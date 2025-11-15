import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./index.module.css";

export default function FaceDiffCheck() {
    const [image1, setImage1] = useState(null);
    const [image2, setImage2] = useState(null);
    const [preview1, setPreview1] = useState(null);
    const [preview2, setPreview2] = useState(null);
    const [percentage, setPercentage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // const backendBase = import.meta.env.VITE_API_BASE_URL ?? "";


    useEffect(() => {
        return () => {
            if (preview1) URL.revokeObjectURL(preview1);
            if (preview2) URL.revokeObjectURL(preview2);
        };
    }, []);

    const handleImageChange = (e, setImage, setPreview, currentPreview) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) {
            // user cleared selection
            setImage(null);
            if (currentPreview) {
                URL.revokeObjectURL(currentPreview);
                setPreview(null);
            }
            return;
        }

        // optional: simple client-side validation (size/type)
        if (!file.type.startsWith("image/")) {
            setError("Selected file is not an image. Please choose an image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Image size must be less than 5 MB.");
            return;
        }

        // cleanup previous preview
        if (currentPreview) URL.revokeObjectURL(currentPreview);

        const objectUrl = URL.createObjectURL(file);
        setImage(file);
        setPreview(objectUrl);
        setError(null);
    };

    const handleCompare = async () => {
        // guard: both images required
        if (!image1 || !image2) {
            setError("Please upload both images before comparing.");
            return;
        }

        const formData = new FormData();
        formData.append("image1", image1);
        formData.append("image2", image2);

        // assemble URL: if backendBase provided, prefix it (no double slash)
        // const url =
        //     backendBase.trim().replace(/\/+$/, "") + (backendBase ? "/api/compare" : "/api/compare");

        try {
            setLoading(true);
            setError(null);
            setPercentage(null);

            const res = await axios.post("/api/compare", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 30000, // 30s timeout - adjust as needed
            });

            // defensive access to response
            const respData = res?.data;
            // If your API returns a different shape, adapt here
            const matched = respData?.data?.percentageMatched ?? respData?.percentage ?? null;

            if (matched === null || matched === undefined || Number.isNaN(Number(matched))) {
                setError("Unexpected response from server. Please check the backend.");
                return;
            }

            setPercentage(Number(matched));
        } catch (err) {
            console.error("Compare error:", err);

            // pretty error messages
            if (err.code === "ECONNABORTED") {
                setError("Request timed out. Try again or check your backend.");
            } else if (err.response) {
                // server responded with status outside 2xx
                const serverMessage =
                    err.response.data?.message || err.response.data?.error || err.response.statusText;
                setError(`Server error: ${serverMessage} (status ${err.response.status})`);
            } else if (err.request) {
                // request was made but no response
                setError("No response from server. Is the backend running and reachable?");
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        if (preview1) {
            URL.revokeObjectURL(preview1);
            setPreview1(null);
        }
        if (preview2) {
            URL.revokeObjectURL(preview2);
            setPreview2(null);
        }
        setImage1(null);
        setImage2(null);
        setPercentage(null);
        setError(null);
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Face Diff Checker</h2>

            <div className={styles.uploads}>
                <div className={styles.uploadBox}>
                    <label className={styles.label}>Image 1</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, setImage1, setPreview1, preview1)}
                    />
                    {preview1 && (
                        <img src={preview1} alt="Preview 1" className={styles.preview} />
                    )}
                </div>

                <div className={styles.uploadBox}>
                    <label className={styles.label}>Image 2</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, setImage2, setPreview2, preview2)}
                    />
                    {preview2 && (
                        <img src={preview2} alt="Preview 2" className={styles.preview} />
                    )}
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                <button
                    className={styles.btn}
                    onClick={handleCompare}
                    disabled={loading || !image1 || !image2}
                >
                    {loading ? "Comparing..." : "Compare Faces"}
                </button>

                <button
                    className={styles.btn}
                    onClick={handleClear}
                    disabled={loading && true}
                    style={{ backgroundColor: "#fff", color: "#000" }}
                >
                    Clear
                </button>
            </div>

            {error && (
                <div className={styles.error} role="alert" aria-live="assertive">
                    {error}
                </div>
            )}

            {percentage !== null && !error && (
                <div className={styles.result}>
                    <p>
                        Similarity: <span>{Number(percentage).toFixed(2)}%</span>
                    </p>
                </div>
            )}
        </div>
    );
}
