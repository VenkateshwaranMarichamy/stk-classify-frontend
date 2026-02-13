import React from "react";
import styles from "./ClassificationFilters.module.css";

export default function EditStockModal({
  isOpen,
  editCompany,
  editMarketCap,
  editBasicCode,
  marketCapOptions,
  basicIndustryStatus,
  basicIndustryErrorMessage,
  modalBasicOptions,
  onCompanyChange,
  onMarketCapChange,
  onBasicCodeChange,
  onClose,
  onUpdate
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Edit Stock</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <label className={styles.modalField}>
            <span className={styles.label}>Company</span>
            <input
              className={styles.input}
              value={editCompany}
              onChange={(e) => onCompanyChange(e.target.value)}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>Market Cap</span>
            <select
              className={styles.select}
              value={editMarketCap}
              onChange={(e) => onMarketCapChange(e.target.value)}
            >
              <option value="">Select market cap</option>
              {marketCapOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>Basic Industry</span>
            <select
              className={styles.select}
              value={editBasicCode}
              onChange={(e) => onBasicCodeChange(e.target.value)}
              disabled={basicIndustryStatus === "loading" || basicIndustryStatus === "error"}
            >
              <option value="">Select basic industry</option>
              {basicIndustryStatus === "loading" && (
                <option value="">Loading...</option>
              )}
              {basicIndustryStatus === "error" && (
                <option value="">{basicIndustryErrorMessage}</option>
              )}
              {basicIndustryStatus === "success" &&
                modalBasicOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={onUpdate}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
