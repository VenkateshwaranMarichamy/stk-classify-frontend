import React from "react";
import styles from "./ClassificationFilters.module.css";

export default function ClassificationDropdowns({
  macro,
  sector,
  industry,
  basicCode,
  macroOptions,
  sectorOptions,
  industryOptions,
  basicOptions,
  isLoading,
  isError,
  stocksStatus,
  onMacroChange,
  onSectorChange,
  onIndustryChange,
  onBasicChange,
  onSearch
}) {
  return (
    <>
      <label className={styles.field}>
        <span className={styles.label}>Macro Sector</span>
        <select
          className={styles.select}
          value={macro}
          onChange={(e) => onMacroChange(e.target.value)}
          disabled={isLoading || isError}
        >
          <option value="">Select macro sector</option>
          {macroOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Sector</span>
        <select
          className={styles.select}
          value={sector}
          onChange={(e) => onSectorChange(e.target.value)}
          disabled={!macro || isLoading || isError}
        >
          <option value="">Select sector</option>
          {sectorOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Industry</span>
        <select
          className={styles.select}
          value={industry}
          onChange={(e) => onIndustryChange(e.target.value)}
          disabled={!macro || !sector || isLoading || isError}
        >
          <option value="">Select industry</option>
          {industryOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Basic Industry</span>
        <select
          className={styles.select}
          value={basicCode}
          onChange={(e) => onBasicChange(e.target.value)}
          disabled={!macro || !sector || !industry || isLoading || isError}
        >
          <option value="">Select basic industry</option>
          {basicOptions.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.name}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          onClick={onSearch}
          disabled={!basicCode || stocksStatus === "loading"}
        >
          {stocksStatus === "loading" ? "Searching..." : "Search"}
        </button>
      </div>
    </>
  );
}
