import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Popover,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography
} from "antd";
import {
  fetchBasicIndustries,
  fetchIndustryTechnicalIndicators,
  fetchPeerFundamentals,
  fetchPeerYears
} from "../services/classificationService";

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_SORT_BY = "total_revenue";
const DEFAULT_SORT_DIR = "desc";

// ---------------------------------------------------------------------------
// Fundamentals column definitions
// ---------------------------------------------------------------------------
const DEFAULT_FUND_COLUMNS = [
  "stock_name", "financial_year", "financial_date",
  "total_revenue", "net_income", "ebitda", "free_cash_flow",
  "diluted_eps", "roe_pct", "roce_pct", "debt_to_equity_x", "current_ratio_x"
];

const SORTABLE_FUND = new Set([
  "stock_name","financial_year","financial_date","total_revenue","net_income","ebitda",
  "free_cash_flow","diluted_eps","book_value_per_share","fcf_per_share","revenue_growth_pct",
  "net_income_growth_pct","eps_growth_pct","ebitda_growth_pct","fcf_growth_pct",
  "gross_margin_pct","operating_margin_pct","ebitda_margin_pct","net_margin_pct",
  "roa_pct","roe_pct","roic_pct","roce_pct","receivables_turnover_x","inventory_turnover_x",
  "payables_turnover_x","debt_to_equity_x","debt_to_assets_pct","net_debt_to_ebitda_x",
  "interest_coverage_x","current_ratio_x","quick_ratio_x","cash_flow_to_net_income_x",
  "free_cash_flow_margin_pct","capex_intensity_pct","cash_change"
]);

// ---------------------------------------------------------------------------
// Technical column definitions
// ---------------------------------------------------------------------------
const DEFAULT_TECH_COLUMNS = [
  "stock_name", "last_close", "high_52w", "low_52w",
  "pct_from_52w_high", "pct_from_52w_low",
  "rsi_14", "macd_line", "macd_signal", "adx_14",
  "sma_20", "sma_50", "sma_200", "golden_cross_state"
];

const TECH_COLUMN_GROUPS = [
  {
    group: "Price",
    cols: [
      { key: "stock_name",         title: "Stock",              width: 220 },
      { key: "trade_date",         title: "Trade Date",         width: 120 },
      { key: "last_close",         title: "Last Close",         width: 110 },
      { key: "high_52w",           title: "52W High",           width: 110 },
      { key: "low_52w",            title: "52W Low",            width: 110 },
      { key: "pct_from_52w_high",  title: "% from 52W High",   width: 140 },
      { key: "pct_from_52w_low",   title: "% from 52W Low",    width: 140 },
      { key: "high_ytd",           title: "YTD High",           width: 110 },
      { key: "low_ytd",            title: "YTD Low",            width: 110 },
    ]
  },
  {
    group: "Moving Averages",
    cols: [
      { key: "sma_20",   title: "SMA 20",   width: 100 },
      { key: "sma_50",   title: "SMA 50",   width: 100 },
      { key: "sma_100",  title: "SMA 100",  width: 100 },
      { key: "sma_200",  title: "SMA 200",  width: 100 },
      { key: "ema_9",    title: "EMA 9",    width: 100 },
      { key: "ema_21",   title: "EMA 21",   width: 100 },
      { key: "ema_50",   title: "EMA 50",   width: 100 },
      { key: "ema_200",  title: "EMA 200",  width: 100 },
    ]
  },
  {
    group: "Momentum",
    cols: [
      { key: "rsi_14",         title: "RSI 14",        width: 100 },
      { key: "macd_line",      title: "MACD Line",     width: 110 },
      { key: "macd_signal",    title: "MACD Signal",   width: 120 },
      { key: "macd_histogram", title: "MACD Hist",     width: 110 },
      { key: "stoch_k",        title: "Stoch K",       width: 100 },
      { key: "stoch_d",        title: "Stoch D",       width: 100 },
      { key: "cci_20",         title: "CCI 20",        width: 100 },
      { key: "williams_r_14",  title: "Williams R",    width: 110 },
      { key: "roc_10",         title: "ROC 10",        width: 100 },
    ]
  },
  {
    group: "Trend",
    cols: [
      { key: "adx_14",             title: "ADX 14",           width: 100 },
      { key: "golden_cross_state", title: "Golden Cross",     width: 130 },
      { key: "golden_cross_event", title: "GC Event",         width: 110 },
      { key: "death_cross_event",  title: "DC Event",         width: 110 },
    ]
  },
  {
    group: "Volatility",
    cols: [
      { key: "bb_upper",          title: "BB Upper",       width: 110 },
      { key: "bb_middle",         title: "BB Middle",      width: 110 },
      { key: "bb_lower",          title: "BB Lower",       width: 110 },
      { key: "atr_14",            title: "ATR 14",         width: 100 },
      { key: "stddev_20",         title: "Std Dev 20",     width: 110 },
      { key: "hist_volatility_20",title: "Hist Vol 20",    width: 120 },
    ]
  },
  {
    group: "Volume",
    cols: [
      { key: "avg_volume_1m",  title: "Avg Vol 1M",   width: 120 },
      { key: "avg_volume_1y",  title: "Avg Vol 1Y",   width: 120 },
      { key: "volume_ratio",   title: "Vol Ratio",    width: 110 },
      { key: "obv",            title: "OBV",          width: 100 },
      { key: "vwap",           title: "VWAP",         width: 100 },
    ]
  },
  {
    group: "Pivot",
    cols: [
      { key: "pivot_point",       title: "Pivot",        width: 100 },
      { key: "pivot_support_1",   title: "Support 1",    width: 110 },
      { key: "pivot_resistance_1",title: "Resistance 1", width: 120 },
    ]
  }
];

// Flat list for column picker
const ALL_TECH_COLS = TECH_COLUMN_GROUPS.flatMap((g) => g.cols);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function displayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value;
}

function numCol(title, dataIndex, width = 120) {
  return {
    title, dataIndex, key: dataIndex,
    sorter: true, width, align: "right",
    render: (v) => displayValue(v)
  };
}

function ColumnPicker({ allCols, visible, onChange, defaultCols }) {
  return (
    <div style={{ padding: 12, width: 300, maxHeight: 440, overflowY: "auto", background: "#fff", borderRadius: 8 }}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Checkbox.Group
          value={visible}
          onChange={onChange}
          options={allCols.map((c) => ({ label: c.title || c.label, value: c.key || c.value }))}
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}
        />
        <Space>
          <Button size="small" onClick={() => onChange(defaultCols)}>Reset</Button>
          <Button size="small" onClick={() => onChange(allCols.map((c) => c.key || c.value))}>All</Button>
        </Space>
      </Space>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fundamentals sub-component
// ---------------------------------------------------------------------------
function FundamentalsView({ basicIndustryCode }) {
  const [financialYearOptions, setFinancialYearOptions] = useState([]);
  const [financialYear, setFinancialYear] = useState(undefined);
  const [rows, setRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_FUND_COLUMNS);
  const [pagination, setPagination] = useState({ current: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0 });
  const [sortState, setSortState] = useState({ field: DEFAULT_SORT_BY, order: DEFAULT_SORT_DIR });
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [yearsError, setYearsError] = useState("");
  const [tableError, setTableError] = useState("");

  useEffect(() => {
    if (!basicIndustryCode) {
      setFinancialYearOptions([]);
      setFinancialYear(undefined);
      setRows([]);
      setPagination((p) => ({ ...p, current: 1, total: 0 }));
      return;
    }
    const controller = new AbortController();
    setLoadingYears(true);
    setYearsError("");
    fetchPeerYears(basicIndustryCode, controller.signal)
      .then((response) => {
        const years = Array.isArray(response?.years) ? response.years : [];
        const options = years.map((y) => ({ label: String(y), value: Number(y) }));
        setFinancialYearOptions(options);
        setFinancialYear(response?.default_year ? Number(response.default_year) : options[0]?.value);
        setPagination((p) => ({ ...p, current: 1 }));
      })
      .catch((err) => { if (err?.name !== "CanceledError") setYearsError(err?.message || "Failed to load years."); })
      .finally(() => setLoadingYears(false));
    return () => controller.abort();
  }, [basicIndustryCode]);

  useEffect(() => {
    if (!basicIndustryCode || !financialYear) return;
    const controller = new AbortController();
    setLoadingTable(true);
    setTableError("");
    fetchPeerFundamentals(
      { basic_ind_code: basicIndustryCode, financial_year: financialYear,
        page: pagination.current, page_size: pagination.pageSize,
        sort_by: sortState.field, sort_dir: sortState.order },
      controller.signal
    )
      .then((response) => {
        setRows(Array.isArray(response?.rows) ? response.rows : []);
        setPagination((p) => ({ ...p, total: Number(response?.total) || 0 }));
      })
      .catch((err) => { if (err?.name !== "CanceledError") setTableError(err?.message || "Failed to load fundamentals."); })
      .finally(() => setLoadingTable(false));
    return () => controller.abort();
  }, [basicIndustryCode, financialYear, pagination.current, pagination.pageSize, sortState.field, sortState.order]);

  const allColumns = useMemo(() => [
    { title: "Stock", dataIndex: "stock_name", key: "stock_name", sorter: true, fixed: "left", width: 220, ellipsis: true, render: displayValue },
    { title: "Year", dataIndex: "financial_year", key: "financial_year", sorter: true, width: 90, render: displayValue },
    { title: "Date", dataIndex: "financial_date", key: "financial_date", sorter: true, width: 120, render: displayValue },
    numCol("Revenue", "total_revenue", 120),
    numCol("Net Income", "net_income", 120),
    numCol("EBITDA", "ebitda", 110),
    numCol("FCF", "free_cash_flow", 110),
    numCol("Diluted EPS", "diluted_eps", 110),
    numCol("Book Value", "book_value_per_share", 120),
    numCol("FCF / Share", "fcf_per_share", 120),
    numCol("Revenue Growth %", "revenue_growth_pct", 135),
    numCol("Net Income Growth %", "net_income_growth_pct", 150),
    numCol("EPS Growth %", "eps_growth_pct", 125),
    numCol("EBITDA Growth %", "ebitda_growth_pct", 140),
    numCol("FCF Growth %", "fcf_growth_pct", 125),
    numCol("Gross Margin %", "gross_margin_pct", 125),
    numCol("Operating Margin %", "operating_margin_pct", 140),
    numCol("EBITDA Margin %", "ebitda_margin_pct", 130),
    numCol("Net Margin %", "net_margin_pct", 120),
    numCol("ROA %", "roa_pct", 100),
    numCol("ROE %", "roe_pct", 100),
    numCol("ROIC %", "roic_pct", 100),
    numCol("ROCE %", "roce_pct", 100),
    numCol("Receivables Turnover x", "receivables_turnover_x", 165),
    numCol("Inventory Turnover x", "inventory_turnover_x", 160),
    numCol("Payables Turnover x", "payables_turnover_x", 160),
    numCol("Debt / Equity x", "debt_to_equity_x", 130),
    numCol("Debt / Assets %", "debt_to_assets_pct", 130),
    numCol("Net Debt / EBITDA x", "net_debt_to_ebitda_x", 160),
    numCol("Interest Coverage x", "interest_coverage_x", 150),
    numCol("Current Ratio x", "current_ratio_x", 130),
    numCol("Quick Ratio x", "quick_ratio_x", 120),
    numCol("CFO / Net Income x", "cash_flow_to_net_income_x", 160),
    numCol("FCF Margin %", "free_cash_flow_margin_pct", 130),
    numCol("Capex Intensity %", "capex_intensity_pct", 140),
    numCol("Cash Change", "cash_change", 110),
  ], []);

  const columns = useMemo(() => allColumns.filter((c) => visibleColumns.includes(c.key)), [allColumns, visibleColumns]);
  const columnOptions = useMemo(() => allColumns.map((c) => ({ label: c.title, value: c.key })), [allColumns]);

  function handleTableChange(nextPag, _filters, sorter) {
    const field = !Array.isArray(sorter) && sorter?.field && SORTABLE_FUND.has(sorter.field) ? sorter.field : sortState.field;
    const order = !Array.isArray(sorter) && sorter?.order ? (sorter.order === "ascend" ? "asc" : "desc") : sortState.order;
    setPagination((p) => ({ ...p, current: nextPag.current || 1, pageSize: nextPag.pageSize || DEFAULT_PAGE_SIZE }));
    setSortState({ field, order });
  }

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} md={10}>
          <Select
            placeholder="Select financial year"
            value={financialYear}
            onChange={(v) => { setFinancialYear(v); setPagination((p) => ({ ...p, current: 1 })); }}
            loading={loadingYears}
            disabled={!basicIndustryCode || financialYearOptions.length === 0}
            options={financialYearOptions}
            style={{ width: "100%" }}
          />
        </Col>
      </Row>
      {yearsError && <Alert type="error" message={yearsError} showIcon />}
      {tableError && <Alert type="error" message={tableError} showIcon />}
      <Card
        styles={{ body: { padding: 0 } }}
        extra={
          <Popover
            content={<ColumnPicker allCols={columnOptions} visible={visibleColumns} onChange={setVisibleColumns} defaultCols={DEFAULT_FUND_COLUMNS} />}
            title="Choose Columns" trigger="click" placement="bottomRight"
            overlayInnerStyle={{ padding: 0, background: "#fff" }}
          >
            <Button size="small">Columns</Button>
          </Popover>
        }
      >
        <Table
          rowKey="stock_id"
          dataSource={rows}
          columns={columns}
          loading={loadingTable}
          size="small"
          onChange={handleTableChange}
          pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true, pageSizeOptions: ["10","25","50","100"] }}
          scroll={{ x: "max-content" }}
        />
      </Card>
    </Space>
  );
}

// ---------------------------------------------------------------------------
// Technical sub-component
// ---------------------------------------------------------------------------
function TechnicalView({ basicIndustryCode }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_TECH_COLUMNS);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 });

  useEffect(() => {
    if (!basicIndustryCode) { setRows([]); return; }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchIndustryTechnicalIndicators(
      basicIndustryCode,
      { page: pagination.current, page_size: pagination.pageSize },
      controller.signal
    )
      .then((response) => {
        setRows(Array.isArray(response?.stocks) ? response.stocks : []);
        setPagination((p) => ({ ...p, total: Number(response?.total) || 0 }));
      })
      .catch((err) => { if (err?.name !== "CanceledError") setError(err?.message || "Failed to load technical indicators."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [basicIndustryCode, pagination.current, pagination.pageSize]);

  const allTechColumns = useMemo(() => {
    const stockCol = {
      title: "Stock", dataIndex: "name", key: "stock_name",
      fixed: "left", width: 220, ellipsis: true,
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: displayValue
    };
    const rest = ALL_TECH_COLS.filter((c) => c.key !== "stock_name").map((c) => ({
      title: c.title, dataIndex: c.key, key: c.key, width: c.width,
      align: "right",
      sorter: (a, b) => {
        const av = parseFloat(a[c.key]); const bv = parseFloat(b[c.key]);
        if (isNaN(av) && isNaN(bv)) return 0;
        if (isNaN(av)) return 1; if (isNaN(bv)) return -1;
        return av - bv;
      },
      render: (v) => {
        if (c.key === "golden_cross_state") {
          return v ? <Tag color={v === "above" ? "green" : "red"}>{v}</Tag> : "—";
        }
        if (c.key === "golden_cross_event" || c.key === "death_cross_event") {
          return typeof v === "boolean" ? (v ? <Tag color="green">Yes</Tag> : <Tag color="default">No</Tag>) : "—";
        }
        return displayValue(v);
      }
    }));
    return [stockCol, ...rest];
  }, []);

  const columns = useMemo(
    () => allTechColumns.filter((c) => visibleColumns.includes(c.key)),
    [allTechColumns, visibleColumns]
  );

  if (!basicIndustryCode) return null;

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      {error && <Alert type="error" message={error} showIcon />}
      <Card
        styles={{ body: { padding: 0 } }}
        extra={
          <Popover
            content={
              <div style={{ padding: 12, width: 320, maxHeight: 440, overflowY: "auto", background: "#fff", borderRadius: 8 }}>
                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                  {TECH_COLUMN_GROUPS.map((group) => (
                    <div key={group.group}>
                      <Typography.Text strong style={{ fontSize: 12, color: "#166534" }}>{group.group}</Typography.Text>
                      <Checkbox.Group
                        value={visibleColumns}
                        onChange={setVisibleColumns}
                        options={group.cols.map((c) => ({ label: c.title, value: c.key }))}
                        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 4 }}
                      />
                    </div>
                  ))}
                  <Space>
                    <Button size="small" onClick={() => setVisibleColumns(DEFAULT_TECH_COLUMNS)}>Reset</Button>
                    <Button size="small" onClick={() => setVisibleColumns(ALL_TECH_COLS.map((c) => c.key))}>All</Button>
                  </Space>
                </Space>
              </div>
            }
            title="Choose Columns" trigger="click" placement="bottomRight"
            overlayInnerStyle={{ padding: 0, background: "#fff" }}
          >
            <Button size="small">Columns</Button>
          </Popover>
        }
      >
        <Table
          rowKey="ticker_id"
          dataSource={rows}
          columns={columns}
          loading={loading}
          size="small"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["25", "50", "100"],
            onChange: (page, pageSize) => setPagination((p) => ({ ...p, current: page, pageSize }))
          }}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: loading ? "Loading..." : "No technical data available." }}
        />
      </Card>
    </Space>
  );
}

// ---------------------------------------------------------------------------
// Main PeerFundamentals export
// ---------------------------------------------------------------------------
export default function PeerFundamentals() {
  const [basicIndustryOptions, setBasicIndustryOptions] = useState([]);
  const [basicIndustryCode, setBasicIndustryCode] = useState("");
  const [loadingBasics, setLoadingBasics] = useState(false);
  const [basicsError, setBasicsError] = useState("");
  const [view, setView] = useState("fundamentals"); // "fundamentals" | "technical"

  useEffect(() => {
    const controller = new AbortController();
    setLoadingBasics(true);
    fetchBasicIndustries(controller.signal, { limit: 200 })
      .then((response) => {
        const source = Array.isArray(response?.basic_industries) ? response.basic_industries
          : Array.isArray(response?.data) ? response.data
          : Array.isArray(response) ? response : [];
        setBasicIndustryOptions(
          source
            .map((item) => ({ label: item?.basic_industry_name || item?.name || item?.basic_ind_code, value: item?.basic_ind_code || item?.code || "" }))
            .filter((item) => item.label && item.value)
            .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
        );
      })
      .catch((err) => { if (err?.name !== "CanceledError") setBasicsError(err?.message || "Failed to load basic industries."); })
      .finally(() => setLoadingBasics(false));
    return () => controller.abort();
  }, []);

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Typography.Title level={4} style={{ margin: 0 }}>Peers</Typography.Title>
          <Typography.Text type="secondary">
            Select a basic industry to review the peer set — fundamentals or technical indicators.
          </Typography.Text>

          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={12}>
              <Select
                showSearch
                placeholder="Select basic industry"
                value={basicIndustryCode || undefined}
                onChange={(value) => setBasicIndustryCode(value || "")}
                loading={loadingBasics}
                options={basicIndustryOptions}
                optionFilterProp="label"
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} md={8}>
              <Segmented
                value={view}
                onChange={setView}
                options={[
                  { label: "Fundamentals", value: "fundamentals" },
                  { label: "Technical", value: "technical" }
                ]}
                disabled={!basicIndustryCode}
              />
            </Col>
          </Row>

          {basicsError && <Alert type="error" message={basicsError} showIcon />}
        </Space>
      </Card>

      {basicIndustryCode && view === "fundamentals" && (
        <FundamentalsView key={`fund-${basicIndustryCode}`} basicIndustryCode={basicIndustryCode} />
      )}
      {basicIndustryCode && view === "technical" && (
        <TechnicalView key={`tech-${basicIndustryCode}`} basicIndustryCode={basicIndustryCode} />
      )}
    </Space>
  );
}
