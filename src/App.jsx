import React from "react";
import ClassificationFilters from "./components/ClassificationFilters";
import styles from "./App.module.css";

export default function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Stock Classification Filters</h1>
        <p className={styles.subtitle}>
          Choose a macro sector to drill down into sectors, industries, and basic industries.
        </p>
      </header>
      <main className={styles.main}>
        <ClassificationFilters />
      </main>
    </div>
  );
}
