// api/proxy.js
const TARGET_BASE = process.env.BACKEND_URL; // e.g. "http://my-app-env.eba-xxxx.us-east-1.elasticbeanstalk.com"

if (!TARGET_BASE) {
    console.error("Missing BACKEND_URL env var. Set BACKEND_URL in Vercel project env vars (include http:// or https://).");
}

// Read raw request body (supports JSON, multipart/form-data, binary)
async function getRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", (err) => reject(err));
    });
}

// Remove hop-by-hop headers per RFC 7230
function sanitizeHeaders(origHeaders, targetHost) {
    const headers = { ...origHeaders };
    const hopByHop = [
        "connection",
        "keep-alive",
        "proxy-authenticate",
        "proxy-authorization",
        "te",
        "trailers",
        "transfer-encoding",
        "upgrade"
    ];
    for (const h of hopByHop) delete headers[h];
    delete headers["content-length"];
    delete headers["accept-encoding"];
    if (targetHost) headers.host = targetHost;
    return headers;
}

export default async function handler(req, res) {
    if (!TARGET_BASE) {
        res.status(500).json({ error: "Server misconfigured: BACKEND_URL not set" });
        return;
    }

    try {
        // Preserve incoming path including /api (we do NOT strip /api)
        const incoming = new URL(req.url, `https://${req.headers.host}`);
        const incomingPath = incoming.pathname; // <-- keeps /api/compare
        const search = incoming.search || "";
        const targetBaseTrimmed = TARGET_BASE.replace(/\/$/, ""); // drop trailing slash
        const target = `${targetBaseTrimmed}${incomingPath}${search}`; // final target

        const rawBody = await getRawBody(req);
        const targetHost = new URL(target).host;
        const headers = sanitizeHeaders(req.headers, targetHost);

        const upstreamResp = await fetch(target, {
            method: req.method,
            headers,
            body: ["GET", "HEAD"].includes(req.method) ? undefined : rawBody,
            redirect: "follow",
        });

        res.status(upstreamResp.status);
        upstreamResp.headers.forEach((v, k) => {
            if (k.toLowerCase() === "transfer-encoding") return;
            res.setHeader(k, v);
        });

        const ab = await upstreamResp.arrayBuffer();
        res.send(Buffer.from(ab));
    } catch (err) {
        console.error("Proxy error:", err);
        res.status(502).json({ error: "Proxy failed", message: String(err) });
    }
}
