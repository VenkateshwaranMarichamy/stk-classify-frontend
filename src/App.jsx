import React from "react";
import { ConfigProvider, Tabs } from "antd";
import ClassificationFilters from "./components/ClassificationFilters";
import PeerFundamentals from "./components/PeerFundamentals";
import ProfilesWorkspaceTab from "./components/ProfilesWorkspaceTab";
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
    },
    {
      key: "profiles",
      label: "Profiles",
      children: <ProfilesWorkspaceTab />
    }
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#15803d",
          colorInfo: "#15803d",
          borderRadius: 12,
          colorBgLayout: "#f4fbf6"
        },
        components: {
          Card: {
            borderRadiusLG: 18
          },
          Tabs: {
            itemActiveColor: "#166534",
            itemColor: "#4b5563",
            itemHoverColor: "#15803d",
            inkBarColor: "#16a34a"
          }
        }
      }}
    >
      <div className={styles.app}>
        <header className={styles.header}>
          <div className={styles.brandBlock}>
            <img
              src="/stoxatlas-logo.svg"
              alt="StoxAtlas logo"
              className={styles.logo}
            />
            <div>
              <h1 className={styles.title}>StoxAtlas</h1>
              <p className={styles.subtitle}>
                Map the market with clarity. Act on the strongest signal.
              </p>
            </div>
          </div>
        </header>
        <main className={styles.main}>
          <Tabs defaultActiveKey="classify" items={tabItems} />
        </main>
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <span className={styles.footerBrand}>StoxAtlas</span>
            <span className={styles.footerText}>
              Research-driven classification and peer intelligence workspace.
            </span>
          </div>
        </footer>
      </div>
    </ConfigProvider>
  );
}
