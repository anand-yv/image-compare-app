export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const backendUrl = process.env.VITE_API_BASE_URL + "/api/compare";

    try {
        // Copy headers except content-length and host
        const headers = { ...req.headers };
        delete headers["content-length"];
        delete headers["host"];
        delete headers["transfer-encoding"];

        // Forward raw request body as-is
        const response = await fetch(backendUrl, {
            method: "POST",
            headers,
            body: req, // IMPORTANT → raw stream, not parsed
        });

        const data = await response.text();

        res.status(response.status).send(data);
    } catch (err) {
        console.error("Proxy error:", err);
        res.status(500).json({ message: "Proxy error", error: err.toString() });
    }
}
