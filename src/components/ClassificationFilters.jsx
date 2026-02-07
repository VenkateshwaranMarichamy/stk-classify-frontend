import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { fetchClassificationData } from "../services/classificationService";

const EMPTY_INDEX = {
  macroOptions: [],
  getSectors: () => [],
  getIndustries: () => [],
  getBasics: () => [],
};

const sortAlpha = (arr) =>
  arr.slice().sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

function normalizeRows(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
}

function buildIndex(rows) {
  const macroMap = new Map();

  for (const row of rows) {
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

    let basicSet = industryMap.get(industry);
    if (!basicSet) {
      basicSet = new Set();
      industryMap.set(industry, basicSet);
    }

    basicSet.add(basic);
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
    const basicSet = industryMap?.get(industry);
    if (!basicSet) return [];
    return sortAlpha(Array.from(basicSet));
  };

  return { macroOptions, getSectors, getIndustries, getBasics };
}

export default function ClassificationFilters({ onSelectionChange }) {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState(null);

  const [macro, setMacro] = useState("");
  const [sector, setSector] = useState("");
  const [industry, setIndustry] = useState("");
  const [basicIndustry, setBasicIndustry] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    async function load() {
      setStatus("loading");
      setError(null);
      try {
        const data = await fetchClassificationData(controller.signal);
        if (ignore) return;
        setRows(normalizeRows(data));
        setStatus("success");
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

  const index = useMemo(() => {
    if (!rows.length) return EMPTY_INDEX;
    return buildIndex(rows);
  }, [rows]);

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

  useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange({
      macro_sector: macro || null,
      sector: sector || null,
      industry: industry || null,
      basic_industry: basicIndustry || null,
    });
  }, [macro, sector, industry, basicIndustry, onSelectionChange]);

  const isLoading = status === "loading";
  const isError = status === "error";

  return (
    <div
      style={{
        display: "grid",
        gap: "12px",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        alignItems: "end",
      }}
    >
      <label style={{ display: "grid", gap: "6px" }}>
        <span>Macro Sector</span>
        <select
          value={macro}
          onChange={(e) => {
            const next = e.target.value;
            setMacro(next);
            setSector("");
            setIndustry("");
            setBasicIndustry("");
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

      <label style={{ display: "grid", gap: "6px" }}>
        <span>Sector</span>
        <select
          value={sector}
          onChange={(e) => {
            const next = e.target.value;
            setSector(next);
            setIndustry("");
            setBasicIndustry("");
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

      <label style={{ display: "grid", gap: "6px" }}>
        <span>Industry</span>
        <select
          value={industry}
          onChange={(e) => {
            const next = e.target.value;
            setIndustry(next);
            setBasicIndustry("");
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

      <label style={{ display: "grid", gap: "6px" }}>
        <span>Basic Industry</span>
        <select
          value={basicIndustry}
          onChange={(e) => setBasicIndustry(e.target.value)}
          disabled={!macro || !sector || !industry || isLoading || isError}
        >
          <option value="">Select basic industry</option>
          {basicOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>

      {isLoading && (
        <div style={{ gridColumn: "1 / -1" }}>Loading classifications…</div>
      )}
      {isError && (
        <div style={{ gridColumn: "1 / -1", color: "crimson" }}>
          Failed to load classifications. Please try again.
        </div>
      )}
    </div>
  );
}
