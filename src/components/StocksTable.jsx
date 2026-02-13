import React from "react";
import styles from "./ClassificationFilters.module.css";

export default function StocksTable({ stocks, stocksCount, onEdit }) {
  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableTitle}>
        Results ({stocksCount})
      </div>
      {stocks.length === 0 ? (
        <div className={styles.empty}>No companies found.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Company</th>
              <th>Comments</th>
              <th>Market Cap</th>
              <th className={styles.actionsCol}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((row, idx) => (
              <tr key={`${row.company_name}-${idx}`}>
                <td>{row.company_name}</td>
                <td>{row.comments}</td>
                <td>{row.market_cap_category}</td>
                <td>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => onEdit(row)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
