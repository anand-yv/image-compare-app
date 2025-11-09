

import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import styles from "./App.module.css";
import NavBar from "./components/nav-bar/indes";

const FaceDiffCheck = lazy(() => import("./components/face-diff-check"));

export default function App() {
  return (
    <div className={styles.app}>
      <NavBar />

      <main className={styles.main}>
        <Suspense fallback={<div style={{ textAlign: 'center' }}>Loading...</div>}>
          <Routes>
            <Route
              path="/"
              element={
                <div>
                  <h1 className={styles.title}>🖋️ Face Compare</h1>
                  <p className={styles.subtitle}>
                    A minimal tool for checking face similarity.
                  </p>
                  <p className={styles.note}>
                    Select “Face Diff Checker” from the navigation bar to begin.
                  </p>
                </div>
              }
            />

            <Route path="/face-diff" element={<FaceDiffCheck />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}