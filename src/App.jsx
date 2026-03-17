import React from "react";
import { Tabs } from "antd";
import ClassificationFilters from "./components/ClassificationFilters";
import styles from "./App.module.css";

function BullBearLogo() {
  return (
    <svg
      className={styles.logo}
      viewBox="0 0 120 52"
      role="img"
      aria-label="Bull and bear mark"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <path
        d="M18 34c5-7 11-10 18-10 6 0 11 2 17 7 6 5 12 8 20 8h10"
        fill="none"
        stroke="url(#logoGradient)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M22 16l8 6 10-1M84 17l9 5 8-3"
        fill="none"
        stroke="#0f172a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="30" cy="30" r="2.4" fill="#0f172a" />
      <circle cx="90" cy="30" r="2.4" fill="#0f172a" />
    </svg>
  );
}

export default function App() {
  const tabItems = [
    {
      key: "classify",
      label: "Classify",
      children: <ClassificationFilters />
    },
    {
      key: "masters",
      label: "Masters",
      children: (
        <div className={styles.placeholder}>
          <h3>Master Updates</h3>
          <p>Add mappings, attributes, and reference data updates in this tab.</p>
        </div>
      )
    },
    {
      key: "bulk",
      label: "Bulk Ops",
      children: (
        <div className={styles.placeholder}>
          <h3>Bulk Operations</h3>
          <p>Use this tab for file-based mass updates and validation workflows.</p>
        </div>
      )
    }
  ];

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <BullBearLogo />
          <div>
            <h1 className={styles.title}>mcr-trades</h1>
            <p className={styles.subtitle}>Read the cycle early. Trade with conviction.</p>
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <Tabs defaultActiveKey="classify" items={tabItems} />
      </main>
    </div>
  );
}
