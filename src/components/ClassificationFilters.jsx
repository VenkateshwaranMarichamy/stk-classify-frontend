import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Alert, Card, Space } from "antd";
import {
  fetchBasicIndustries,
  fetchClassificationData,
  fetchStocksByBasicCode,
  updateStockClassification
} from "../services/classificationService";
import ClassificationDropdowns from "./ClassificationDropdowns";
import EditStockModal from "./EditStockModal";
import StocksTable from "./StocksTable";
import {
  buildIndex,
  EMPTY_INDEX,
  normalizeMarketCap,
  normalizePayload
} from "./classificationUtils";

const MARKET_CAP_OPTIONS = ["LARGECAP", "MIDCAP", "SMALLCAP"];

export default function ClassificationFilters({ onSelectionChange }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState(null);
  const [basicIndustryList, setBasicIndustryList] = useState([]);
  const [basicIndustryStatus, setBasicIndustryStatus] = useState("idle"); // idle | loading | success | error
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
  const [editCompanyId, setEditCompanyId] = useState(null);
  const [editCompany, setEditCompany] = useState("");
  const [editMarketCap, setEditMarketCap] = useState("");
  const [editBasicCode, setEditBasicCode] = useState("");
  const [editBasicName, setEditBasicName] = useState("");
  const [updateStatus, setUpdateStatus] = useState("idle"); // idle | loading | success | error
  const [updateError, setUpdateError] = useState("");

  useEffect(() => {
    if (hasFetchedRef.current) return;
    const controller = new AbortController();
    let ignore = false;

    async function load() {
      setStatus("loading");
      setError(null);
      try {
        const response = await fetchClassificationData(controller.signal);
        if (ignore) return;
        setData(normalizePayload(response));
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
      const response = await fetchBasicIndustries();
      const list = Array.isArray(response?.basic_industries)
        ? response.basic_industries
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
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
    return basicIndustryList
      .map((item) => ({
        code:
          item?.basic_ind_code?.trim() ||
          item?.basicIndustryCode?.trim() ||
          item?.code?.trim() ||
          "",
        name:
          item?.basic_industry_name?.trim() ||
          item?.basicIndustryName?.trim() ||
          item?.basic_industry?.trim() ||
          item?.industry_name?.trim() ||
          item?.name?.trim() ||
          ""
      }))
      .filter((item) => item.code && item.name)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }, [basicIndustryList]);

  const selectedBasicName = useMemo(() => {
    if (!basicCode) return "";
    return basicOptions.find((opt) => opt.code === basicCode)?.name || "";
  }, [basicOptions, basicCode]);

  const modalBasicOptionsWithCurrent = useMemo(() => {
    if (!editBasicCode) return modalBasicOptions;
    const hasCurrent = modalBasicOptions.some((opt) => opt.code === editBasicCode);
    if (hasCurrent) return modalBasicOptions;
    return [
      {
        code: editBasicCode,
        name: editBasicName || selectedBasicName || editBasicCode
      },
      ...modalBasicOptions
    ];
  }, [editBasicCode, editBasicName, modalBasicOptions, selectedBasicName]);

  useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange({
      macro_economic_sector: macro || null,
      sector_name: sector || null,
      industry_name: industry || null,
      basic_industry_name: selectedBasicName || null
    });
  }, [macro, sector, industry, selectedBasicName, onSelectionChange]);

  function resetStocks() {
    setStocks([]);
    setStocksCount(0);
    setStocksStatus("idle");
    setStocksError(null);
  }

  function handleMacroChange(next) {
    setMacro(next);
    setSector("");
    setIndustry("");
    setBasicCode("");
    resetStocks();
  }

  function handleSectorChange(next) {
    setSector(next);
    setIndustry("");
    setBasicCode("");
    resetStocks();
  }

  function handleIndustryChange(next) {
    setIndustry(next);
    setBasicCode("");
    resetStocks();
  }

  function handleBasicChange(next) {
    setBasicCode(next);
    resetStocks();
  }

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

  async function refreshStocksInBackground() {
    if (!basicCode) return;
    try {
      const response = await fetchStocksByBasicCode(basicCode);
      const list = Array.isArray(response?.data) ? response.data : [];
      setStocks(list);
      setStocksCount(typeof response?.count === "number" ? response.count : list.length);
      setStocksStatus("success");
    } catch {
      // Keep current UI state; background refresh failures should not disrupt editing flow.
    }
  }

  function openEditModal(row) {
    const companyId = Number(row?.company_id);
    setEditCompanyId(Number.isFinite(companyId) && companyId > 0 ? companyId : null);
    setEditCompany(row?.company_name || "");
    const normalized = normalizeMarketCap(row?.market_cap_category);
    setEditMarketCap(MARKET_CAP_OPTIONS.includes(normalized) ? normalized : "");
    const currentCode =
      row?.basic_ind_code ||
      row?.basicIndustryCode ||
      row?.code ||
      basicCode ||
      "";
    const currentName =
      row?.basic_industry_name ||
      row?.basicIndustryName ||
      row?.basic_industry ||
      row?.industry_name ||
      row?.name ||
      selectedBasicName ||
      "";
    setEditBasicCode(currentCode);
    setEditBasicName(currentName);
    setUpdateStatus("idle");
    setUpdateError("");
    setIsEditOpen(true);
    loadBasicsIfNeeded();
  }

  function closeEditModal() {
    setUpdateStatus("idle");
    setUpdateError("");
    setIsEditOpen(false);
  }

  async function handleUpdate() {
    if (!editCompanyId) {
      setUpdateStatus("error");
      setUpdateError("Missing company id for this row.");
      return;
    }
    if (!editCompany?.trim()) {
      setUpdateStatus("error");
      setUpdateError("Company name is required.");
      return;
    }
    if (!editMarketCap) {
      setUpdateStatus("error");
      setUpdateError("Market cap is required.");
      return;
    }
    if (!editBasicCode) {
      setUpdateStatus("error");
      setUpdateError("Basic industry is required.");
      return;
    }

    setUpdateStatus("loading");
    setUpdateError("");
    try {
      const response = await updateStockClassification(editCompanyId, {
        company_name: editCompany.trim(),
        basic_ind_code: editBasicCode,
        market_cap_category: editMarketCap
      });

      const updatedBasicCode = response?.basic_ind_code ?? editBasicCode;
      const updatedCompanyName = response?.company_name ?? editCompany.trim();
      const updatedMarketCap = response?.market_cap_category ?? editMarketCap;

      setStocks((prev) => {
        const nextRows = prev
          .map((row) =>
            row?.company_id === editCompanyId
              ? {
                  ...row,
                  company_name: updatedCompanyName,
                  market_cap_category: updatedMarketCap
                }
              : row
          )
          .filter((row) => {
            if (row?.company_id !== editCompanyId) return true;
            return updatedBasicCode === basicCode;
          });

        setStocksCount(nextRows.length);
        return nextRows;
      });

      setUpdateStatus("success");
      closeEditModal();
      refreshStocksInBackground();
    } catch (err) {
      setUpdateStatus("error");
      if (err?.response?.data?.detail) {
        const detail = Array.isArray(err.response.data.detail)
          ? err.response.data.detail.map((d) => d?.msg).filter(Boolean).join(", ")
          : err.response.data.detail;
        setUpdateError(detail || "Update failed.");
      } else {
        setUpdateError(err?.message || "Update failed.");
      }
    }
  }

  const isLoading = status === "loading";
  const isError = status === "error";
  const basicIndustryErrorMessage = basicIndustryError?.message || "Failed to load";

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <ClassificationDropdowns
            macro={macro}
            sector={sector}
            industry={industry}
            basicCode={basicCode}
            macroOptions={macroOptions}
            sectorOptions={sectorOptions}
            industryOptions={industryOptions}
            basicOptions={basicOptions}
            isLoading={isLoading}
            isError={isError}
            stocksStatus={stocksStatus}
            onMacroChange={handleMacroChange}
            onSectorChange={handleSectorChange}
            onIndustryChange={handleIndustryChange}
            onBasicChange={handleBasicChange}
            onSearch={handleSearch}
          />

          {isLoading && (
            <Alert message="Loading classifications..." type="info" showIcon />
          )}
          {isError && (
            <Alert message="Failed to load classifications. Please try again." type="error" showIcon />
          )}
          {stocksStatus === "error" && (
            <Alert message={stocksError?.message || "Failed to load stocks. Please try again."} type="error" showIcon />
          )}
        </Space>
      </Card>

      {stocksStatus === "success" && (
        <StocksTable
          stocks={stocks}
          stocksCount={stocksCount}
          onEdit={openEditModal}
        />
      )}

      <EditStockModal
        isOpen={isEditOpen}
        editCompany={editCompany}
        editMarketCap={editMarketCap}
        editBasicCode={editBasicCode}
        marketCapOptions={MARKET_CAP_OPTIONS}
        basicIndustryStatus={basicIndustryStatus}
        basicIndustryErrorMessage={basicIndustryErrorMessage}
        modalBasicOptions={modalBasicOptionsWithCurrent}
        updateStatus={updateStatus}
        updateError={updateError}
        onCompanyChange={setEditCompany}
        onMarketCapChange={setEditMarketCap}
        onBasicCodeChange={setEditBasicCode}
        onClose={closeEditModal}
        onUpdate={handleUpdate}
      />
    </Space>
  );
}
