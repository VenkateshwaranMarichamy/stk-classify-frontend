import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  fetchClassificationData,
  fetchBasicIndustries,
  fetchStocksByBasicCode
} from "../services/classificationService";
import styles from "./ClassificationFilters.module.css";

const EMPTY_INDEX = {
  macroOptions: [],
  getSectors: () => [],
  getIndustries: () => [],
  getBasics: () => [],
};

const MARKET_CAP_OPTIONS = ["LARGECAP", "MIDCAP", "SMALLCAP"];

const sortAlpha = (arr) =>
  arr.slice().sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

const normalizeMarketCap = (value) =>
  (value || "").toString().toUpperCase().replace(/\s+/g, "");

function normalizePayload(raw) {
  if (raw && typeof raw === "object") return raw;
  if (Array.isArray(raw)) return { rows: raw };
  if (Array.isArray(raw?.data)) return { rows: raw.data };
  if (Array.isArray(raw?.results)) return { rows: raw.results };
  return {};
}

function buildIndex(payload) {
  const macroMap = new Map();

  if (Array.isArray(payload?.macro_economic_sectors)) {
    for (const macro of payload.macro_economic_sectors) {
      const name = macro?.macro_economic_sector?.trim();
      if (name && !macroMap.has(name)) {
        macroMap.set(name, new Map());
      }
    }
  }

  if (
    Array.isArray(payload?.macro_economic_sectors) &&
    Array.isArray(payload?.sectors) &&
    Array.isArray(payload?.industries) &&
    Array.isArray(payload?.basic_industries)
  ) {
    const mesByCode = new Map();
    for (const macro of payload.macro_economic_sectors) {
      if (macro?.mes_code && macro?.macro_economic_sector) {
        mesByCode.set(macro.mes_code, macro.macro_economic_sector.trim());
      }
    }

    const sectorByCode = new Map();
    for (const sector of payload.sectors) {
      if (sector?.sect_code && sector?.sector_name && sector?.mes_code) {
        sectorByCode.set(sector.sect_code, {
          name: sector.sector_name.trim(),
          mesCode: sector.mes_code
        });
      }
    }

    const industryByCode = new Map();
    for (const industry of payload.industries) {
      if (industry?.ind_code && industry?.industry_name && industry?.sect_code) {
        industryByCode.set(industry.ind_code, {
          name: industry.industry_name.trim(),
          sectCode: industry.sect_code
        });
      }
    }

    for (const basic of payload.basic_industries) {
      const basicName = basic?.basic_industry_name?.trim();
      const basicCode = basic?.basic_ind_code?.trim();
      if (!basicName || !basicCode || !basic?.ind_code) continue;

      const industry = industryByCode.get(basic.ind_code);
      if (!industry) continue;

      const sector = sectorByCode.get(industry.sectCode);
      if (!sector) continue;

      const macroName = mesByCode.get(sector.mesCode);
      if (!macroName) continue;

      let sectorMap = macroMap.get(macroName);
      if (!sectorMap) {
        sectorMap = new Map();
        macroMap.set(macroName, sectorMap);
      }

      let industryMap = sectorMap.get(sector.name);
      if (!industryMap) {
        industryMap = new Map();
        sectorMap.set(sector.name, industryMap);
      }

      let basicMap = industryMap.get(industry.name);
      if (!basicMap) {
        basicMap = new Map();
        industryMap.set(industry.name, basicMap);
      }

      if (!basicMap.has(basicName)) {
        basicMap.set(basicName, basicCode);
      }
    }
  } else if (Array.isArray(payload?.rows)) {
    for (const row of payload.rows) {
      const macro = row?.macro_sector?.trim();
      const sector = row?.sector?.trim();
      const industry = row?.industry?.trim();
      const basic = row?.basic_industry?.trim();

      if (!macro || !sector || !industry || !basic) continue;

      let sectorMap = macroMap.get(macro);
      if (!sectorMap) {
        sectorMap = new Map();
        macroMap.set(macro, sectorMap);
      }

      let industryMap = sectorMap.get(sector);
      if (!industryMap) {
        industryMap = new Map();
        sectorMap.set(sector, industryMap);
      }

      let basicMap = industryMap.get(industry);
      if (!basicMap) {
        basicMap = new Map();
        industryMap.set(industry, basicMap);
      }

      if (!basicMap.has(basic)) {
        basicMap.set(basic, basic);
      }
    }
  }

  const macroOptions = sortAlpha(Array.from(macroMap.keys()));

  const getSectors = (macro) => {
    const sectorMap = macroMap.get(macro);
    if (!sectorMap) return [];
    return sortAlpha(Array.from(sectorMap.keys()));
  };

  const getIndustries = (macro, sector) => {
    const sectorMap = macroMap.get(macro);
    const industryMap = sectorMap?.get(sector);
    if (!industryMap) return [];
    return sortAlpha(Array.from(industryMap.keys()));
  };

  const getBasics = (macro, sector, industry) => {
    const sectorMap = macroMap.get(macro);
    const industryMap = sectorMap?.get(sector);
    const basicMap = industryMap?.get(industry);
    if (!basicMap) return [];
    return sortAlpha(Array.from(basicMap.keys())).map((name) => ({
      name,
      code: basicMap.get(name)
    }));
  };

  return { macroOptions, getSectors, getIndustries, getBasics };
}

export default function ClassificationFilters({ onSelectionChange }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState(null);
  const [basicIndustryList, setBasicIndustryList] = useState([]);
  const [basicIndustryStatus, setBasicIndustryStatus] = useState("idle");
  const [basicIndustryError, setBasicIndustryError] = useState(null);
  // Prevent duplicate fetch in React 18 StrictMode (dev only runs effects twice).
  const hasFetchedRef = useRef(false);

  const [macro, setMacro] = useState("");
  const [sector, setSector] = useState("");
  const [industry, setIndustry] = useState("");
  const [basicCode, setBasicCode] = useState("");
  const [stocks, setStocks] = useState([]);
  const [stocksCount, setStocksCount] = useState(0);
  const [stocksStatus, setStocksStatus] = useState("idle"); // idle | loading | success | error
  const [stocksError, setStocksError] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editCompany, setEditCompany] = useState("");
  const [editMarketCap, setEditMarketCap] = useState("");
  const [editBasicCode, setEditBasicCode] = useState("");

  useEffect(() => {
    if (hasFetchedRef.current) return;
    const controller = new AbortController();
    let ignore = false;

    async function load() {
      setStatus("loading");
      setError(null);
      try {
        const data = await fetchClassificationData(controller.signal);
        if (ignore) return;
        setData(normalizePayload(data));
        setStatus("success");
        hasFetchedRef.current = true;
      } catch (err) {
        if (ignore) return;
        if (axios.isCancel?.(err) || err?.name === "CanceledError") return;
        setError(err);
        setStatus("error");
      }
    }

    load();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  async function loadBasicsIfNeeded() {
    if (basicIndustryStatus === "loading" || basicIndustryStatus === "success") return;
    setBasicIndustryStatus("loading");
    setBasicIndustryError(null);
    try {
      const data = await fetchBasicIndustries();
      const list = Array.isArray(data?.basic_industries)
        ? data.basic_industries
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
      setBasicIndustryList(list);
      setBasicIndustryStatus("success");
    } catch (err) {
      if (axios.isCancel?.(err) || err?.name === "CanceledError") return;
      setBasicIndustryError(err);
      setBasicIndustryStatus("error");
    }
  }

  const index = useMemo(() => {
    if (!data) return EMPTY_INDEX;
    return buildIndex(data);
  }, [data]);

  const macroOptions = index.macroOptions;

  const sectorOptions = useMemo(() => {
    if (!macro) return [];
    return index.getSectors(macro);
  }, [index, macro]);

  const industryOptions = useMemo(() => {
    if (!macro || !sector) return [];
    return index.getIndustries(macro, sector);
  }, [index, macro, sector]);

  const basicOptions = useMemo(() => {
    if (!macro || !sector || !industry) return [];
    return index.getBasics(macro, sector, industry);
  }, [index, macro, sector, industry]);

  const modalBasicOptions = useMemo(() => {
    const options = basicIndustryList
      .map((item) => ({
        code: item?.basic_ind_code?.trim() || "",
        name: item?.basic_industry_name?.trim() || ""
      }))
      .filter((item) => item.code && item.name);
    return sortAlpha(options.map((opt) => opt.name)).map((name) => {
      const match = options.find((opt) => opt.name === name);
      return match || { name, code: "" };
    });
  }, [basicIndustryList]);

  const selectedBasicName = useMemo(() => {
    if (!basicCode) return "";
    return basicOptions.find((opt) => opt.code === basicCode)?.name || "";
  }, [basicOptions, basicCode]);

  useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange({
      macro_economic_sector: macro || null,
      sector_name: sector || null,
      industry_name: industry || null,
      basic_industry_name: selectedBasicName || null
    });
  }, [macro, sector, industry, selectedBasicName, onSelectionChange]);

  async function handleSearch() {
    if (!basicCode) return;
    setStocksStatus("loading");
    setStocksError(null);
    try {
      const response = await fetchStocksByBasicCode(basicCode);
      const list = Array.isArray(response?.data) ? response.data : [];
      setStocks(list);
      setStocksCount(typeof response?.count === "number" ? response.count : list.length);
      setStocksStatus("success");
    } catch (err) {
      if (axios.isCancel?.(err) || err?.name === "CanceledError") return;
      setStocksError(err);
      setStocksStatus("error");
    }
  }

  function openEditModal(row) {
    setEditCompany(row?.company_name || "");
    const normalized = normalizeMarketCap(row?.market_cap_category);
    setEditMarketCap(MARKET_CAP_OPTIONS.includes(normalized) ? normalized : "");
    setEditBasicCode(basicCode || "");
    setIsEditOpen(true);
    loadBasicsIfNeeded();
  }

  function closeEditModal() {
    setIsEditOpen(false);
  }

  function handleUpdate() {
    // TODO: wire to backend update endpoint when available.
    closeEditModal();
  }

  const isLoading = status === "loading";
  const isError = status === "error";
  const basicIndustryErrorMessage = basicIndustryError?.message || "Failed to load";

  return (
    <div className={styles.container}>
      <label className={styles.field}>
        <span className={styles.label}>Macro Sector</span>
        <select
          className={styles.select}
          value={macro}
          onChange={(e) => {
            const next = e.target.value;
            setMacro(next);
            setSector("");
            setIndustry("");
            setBasicCode("");
            setStocks([]);
            setStocksCount(0);
            setStocksStatus("idle");
          }}
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
          onChange={(e) => {
            const next = e.target.value;
            setSector(next);
            setIndustry("");
            setBasicCode("");
            setStocks([]);
            setStocksCount(0);
            setStocksStatus("idle");
          }}
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
          onChange={(e) => {
            const next = e.target.value;
            setIndustry(next);
            setBasicCode("");
            setStocks([]);
            setStocksCount(0);
            setStocksStatus("idle");
          }}
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
          onChange={(e) => {
            setBasicCode(e.target.value);
            setStocks([]);
            setStocksCount(0);
            setStocksStatus("idle");
          }}
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
          onClick={handleSearch}
          disabled={!basicCode || stocksStatus === "loading"}
        >
          {stocksStatus === "loading" ? "Searching..." : "Search"}
        </button>
      </div>

      {isLoading && (
        <div className={styles.status} aria-live="polite">
          Loading classifications…
        </div>
      )}
      {isError && (
        <div className={`${styles.status} ${styles.error}`} role="alert">
          Failed to load classifications. Please try again.
        </div>
      )}

      {stocksStatus === "error" && (
        <div className={`${styles.status} ${styles.error}`} role="alert">
          Failed to load stocks. Please try again.
        </div>
      )}

      {stocksStatus === "success" && (
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
                        onClick={() => openEditModal(row)}
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
      )}

      {isEditOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Edit Stock</h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeEditModal}
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
                  onChange={(e) => setEditCompany(e.target.value)}
                />
              </label>
              <label className={styles.modalField}>
                <span className={styles.label}>Market Cap</span>
                <select
                  className={styles.select}
                  value={editMarketCap}
                  onChange={(e) => setEditMarketCap(e.target.value)}
                >
                  <option value="">Select market cap</option>
                  {MARKET_CAP_OPTIONS.map((option) => (
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
                  onChange={(e) => setEditBasicCode(e.target.value)}
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
                onClick={closeEditModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={handleUpdate}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
