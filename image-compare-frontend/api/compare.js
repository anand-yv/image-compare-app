const BACKEND_URL = process.env.VITE_API_BASE_URL;

module.exports = async (req, res) => {
    try {
        if (!BACKEND_URL) {
            res.statusCode = 500;
            return res.end("BACKEND_URL not set");
        }

        // Collect raw request body (multipart)
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const rawBody = Buffer.concat(chunks);

        // Remove host header
        // prepare headers (remove host and content-length)
        const headers = { ...req.headers };
        delete headers.host;
        delete headers['content-length'];
        delete headers['transfer-encoding']; // safe to remove too


        // Forward request to backend
        const response = await fetch(`${BACKEND_URL}/api/compare`, {
            method: "POST",
            headers,
            body: rawBody
        });

        // Forward backend status
        res.statusCode = response.status;

        // Forward backend headers
        response.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });

        // Forward backend body
        const buffer = Buffer.from(await response.arrayBuffer());
        res.end(buffer);

    } catch (err) {
        console.error("Proxy error:", err);
        res.statusCode = 500;
        res.end("Proxy Error: " + err.message);
    }
};
