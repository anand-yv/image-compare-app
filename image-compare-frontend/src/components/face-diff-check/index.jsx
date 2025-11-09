import { useState } from "react";
import axios from "axios";
import styles from "./index.module.css";

export default function FaceDiffCheck() {
    const [image1, setImage1] = useState(null);
    const [image2, setImage2] = useState(null);
    const [preview1, setPreview1] = useState(null);
    const [preview2, setPreview2] = useState(null);
    const [percentage, setPercentage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleImageChange = (e, setImage, setPreview) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleCompare = async () => {
        if (!image1 || !image2) {
            alert("Please upload both images.");
            return;
        }

        const formData = new FormData();
        formData.append("image1", image1);
        formData.append("image2", image2);

        try {
            setLoading(true);
            setPercentage(null);

            const res = await axios.post("/api/compare", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setPercentage(res.data.data?.percentageMatched ?? 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
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
                        onChange={(e) => handleImageChange(e, setImage1, setPreview1)}
                    />
                    {preview1 && <img src={preview1} alt="Preview 1" className={styles.preview} />}
                </div>

                <div className={styles.uploadBox}>
                    <label className={styles.label}>Image 2</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, setImage2, setPreview2)}
                    />
                    {preview2 && <img src={preview2} alt="Preview 2" className={styles.preview} />}
                </div>
            </div>

            <button className={styles.btn} onClick={handleCompare} disabled={loading || image1 === null && image2 === null}>
                {loading ? "Comparing..." : "Compare Faces"}
            </button>

            {percentage !== null && (
                <div className={styles.result}>
                    <p>Similarity: <span>{percentage.toFixed(2)}%</span></p>
                </div>
            )}
        </div>
    );
}
