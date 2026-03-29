import React from "react";
import { Tabs } from "antd";
import ClassificationFilters from "./components/ClassificationFilters";
import PeerFundamentals from "./components/PeerFundamentals";
import styles from "./App.module.css";

export default function App() {
  const tabItems = [
    {
      key: "classify",
      label: "Classify",
      children: <ClassificationFilters />
    },
    {
      key: "peers",
      label: "Peers",
      children: <PeerFundamentals />
    }
  ];

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>mcr-trades</h1>
        <p className={styles.subtitle}>
          Classification, peer analytics, and stock maintenance from one workspace.
        </p>
      </header>
      <main className={styles.main}>
        <Tabs defaultActiveKey="classify" items={tabItems} />
      </main>
    </div>
  );
}
