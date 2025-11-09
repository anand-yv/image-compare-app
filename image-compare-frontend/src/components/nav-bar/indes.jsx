import { NavLink } from "react-router-dom";
import styles from "./index.module.css";

export default function NavBar() {
    return (
        <header className={styles.header}>
            <nav className={styles.logo}>
                <NavLink
                    to={"/"}
                    className={({ isActive }) =>
                        isActive ? `${styles.link} ${styles.active}` : styles.link
                    }
                >🖋️ Face Compare</NavLink>
            </nav>
            <nav className={styles.nav}>
                <NavLink
                    to="/face-diff"
                    className={({ isActive }) =>
                        isActive ? `${styles.link} ${styles.active}` : styles.link
                    }
                >
                    Face Diff Checker
                </NavLink>
            </nav>
        </header>
    );
}
