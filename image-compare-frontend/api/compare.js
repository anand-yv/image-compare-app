// api/[...path].js  (or api/compare.js if you only need /api/compare)
const TARGET_BASE = process.env.BACKEND_URL; // must include http:// or https://
const FETCH_TIMEOUT_MS = 20000; // 20 seconds

if (!TARGET_BASE) {
    console.error("Missing BACKEND_URL env var. Set BACKEND_URL in Vercel project env vars.");
}

function sanitizeHeaders(origHeaders, targetHost) {
    const headers = { ...origHeaders };
    const hopByHop = [
        "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
        "te", "trailers", "transfer-encoding", "upgrade"
    ];
    for (const h of hopByHop) delete headers[h];
    delete headers["content-length"];
    delete headers["accept-encoding"]; // ask upstream to send uncompressed body
    if (targetHost) headers.host = targetHost;
    return headers;
}

async function getRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", (err) => reject(err));
    });
}

export default async function handler(req, res) {
    if (!TARGET_BASE) {
        res.status(500).json({ error: "Server misconfigured: BACKEND_URL not set" });
        return;
    }

    try {
        const incoming = new URL(req.url, `https://${req.headers.host}`);
        // Keep full path including /api if your backend expects it. For /api/compare -> keep it.
        const incomingPath = incoming.pathname;
        const search = incoming.search || "";
        const targetBaseTrimmed = TARGET_BASE.replace(/\/$/, "");
        const target = `${targetBaseTrimmed}${incomingPath}${search}`;

        console.log("Proxy request:", req.method, "->", target);

        const rawBody = await getRawBody(req);
        const targetHost = new URL(target).host;
        const headers = sanitizeHeaders(req.headers, targetHost);

        // AbortController for timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        let upstreamResp;
        try {
            upstreamResp = await fetch(target, {
                method: req.method,
                headers,
                body: ["GET", "HEAD"].includes(req.method) ? undefined : rawBody,
                redirect: "follow",
                signal: controller.signal,
            });
        } catch (fetchErr) {
            clearTimeout(timeout);
            console.error("Fetch to backend failed:", fetchErr && fetchErr.message);
            // Distinguish abort/timeout vs DNS/ECONNREFUSED
            if (fetchErr.name === "AbortError") {
                res.status(504).json({ error: "Upstream timeout", message: `No response from backend within ${FETCH_TIMEOUT_MS / 1000}s` });
            } else {
                // Likely DNS or connection refused
                res.status(502).json({ error: "Upstream connection failed", message: fetchErr.message });
            }
            return;
        } finally {
            clearTimeout(timeout);
        }

        // Forward status and headers (but do not forward content-encoding or transfer-encoding)
        res.status(upstreamResp.status);
        upstreamResp.headers.forEach((v, k) => {
            const key = k.toLowerCase();
            if (key === "transfer-encoding" || key === "content-encoding") return;
            res.setHeader(k, v);
        });

        const ab = await upstreamResp.arrayBuffer();
        res.send(Buffer.from(ab));
    } catch (err) {
        console.error("Proxy top-level error:", err);
        res.status(500).json({ error: "Proxy failed", message: String(err) });
    }
}
