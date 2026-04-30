import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Card, Checkbox, Col, Popover, Row,
  Segmented, Select, Space, Table, Tag, Typography
} from "antd";
import {
  fetchBasicIndustries,
  fetchIndustryTechnicalIndicators,
  fetchPeerFundamentals,
  fetchPeerValuation,
  fetchPeerYears,
  fetchStocksByBasicCode,
  fetchValuationYears
} from "../services/classificationService";

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_SORT_BY = "total_revenue";
const DEFAULT_SORT_DIR = "desc";

const MARKET_CAP_OPTIONS = ["MEGA_CAP","LARGE_CAP","MID_CAP","SMALL_CAP","MICRO_CAP"];
const REVENUE_SIZE_OPTIONS = ["LARGE","MEDIUM","SMALL","MICRO"];
const RISK_OPTIONS = ["HIGH","MEDIUM","LOW"];
const CAP_COLOR = { MEGA_CAP:"gold", LARGE_CAP:"blue", MID_CAP:"cyan", SMALL_CAP:"geekblue", MICRO_CAP:"purple" };
const SIZE_COLOR = { LARGE:"blue", MEDIUM:"cyan", SMALL:"geekblue", MICRO:"purple" };
const RISK_COLOR = { HIGH:"red", MEDIUM:"orange", LOW:"green" };

const DEFAULT_FUND_COLUMNS = [
  "stock_name","financial_year","financial_date",
  "_current_price","_trailing_pe","_dividend_yield","_market_cap",
  "total_revenue","net_income","ebitda","free_cash_flow",
  "diluted_eps","roe_pct","roce_pct","debt_to_equity_x","current_ratio_x"
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

const DEFAULT_VAL_COLUMNS = [
  "stock", "current_price", "market_cap", "trailing_pe",
  "forward_pe", "price_to_book", "book_value",
  "dividend_yield", "return_on_equity", "debt_to_equity"
];

const DEFAULT_TECH_COLUMNS = [
  "stock_name","last_close","high_52w","low_52w",
  "pct_from_52w_high","pct_from_52w_low",
  "rsi_14","macd_line","macd_signal","adx_14",
  "sma_20","sma_50","sma_200","golden_cross_state"
];

const TECH_COLUMN_GROUPS = [
  { group:"Price", cols:[
    { key:"stock_name", title:"Stock", width:220 },
    { key:"trade_date", title:"Trade Date", width:120 },
    { key:"last_close", title:"Last Close", width:110 },
    { key:"high_52w", title:"52W High", width:110 },
    { key:"low_52w", title:"52W Low", width:110 },
    { key:"pct_from_52w_high", title:"% from 52W High", width:140 },
    { key:"pct_from_52w_low", title:"% from 52W Low", width:140 },
    { key:"high_ytd", title:"YTD High", width:110 },
    { key:"low_ytd", title:"YTD Low", width:110 },
  ]},
  { group:"Moving Averages", cols:[
    { key:"sma_20", title:"SMA 20", width:100 },
    { key:"sma_50", title:"SMA 50", width:100 },
    { key:"sma_100", title:"SMA 100", width:100 },
    { key:"sma_200", title:"SMA 200", width:100 },
    { key:"ema_9", title:"EMA 9", width:100 },
    { key:"ema_21", title:"EMA 21", width:100 },
    { key:"ema_50", title:"EMA 50", width:100 },
    { key:"ema_200", title:"EMA 200", width:100 },
  ]},
  { group:"Momentum", cols:[
    { key:"rsi_14", title:"RSI 14", width:100 },
    { key:"macd_line", title:"MACD Line", width:110 },
    { key:"macd_signal", title:"MACD Signal", width:120 },
    { key:"macd_histogram", title:"MACD Hist", width:110 },
    { key:"stoch_k", title:"Stoch K", width:100 },
    { key:"stoch_d", title:"Stoch D", width:100 },
    { key:"cci_20", title:"CCI 20", width:100 },
    { key:"williams_r_14", title:"Williams R", width:110 },
    { key:"roc_10", title:"ROC 10", width:100 },
  ]},
  { group:"Trend", cols:[
    { key:"adx_14", title:"ADX 14", width:100 },
    { key:"golden_cross_state", title:"Golden Cross", width:130 },
    { key:"golden_cross_event", title:"GC Event", width:110 },
    { key:"death_cross_event", title:"DC Event", width:110 },
  ]},
  { group:"Volatility", cols:[
    { key:"bb_upper", title:"BB Upper", width:110 },
    { key:"bb_middle", title:"BB Middle", width:110 },
    { key:"bb_lower", title:"BB Lower", width:110 },
    { key:"atr_14", title:"ATR 14", width:100 },
    { key:"stddev_20", title:"Std Dev 20", width:110 },
    { key:"hist_volatility_20", title:"Hist Vol 20", width:120 },
  ]},
  { group:"Volume", cols:[
    { key:"avg_volume_1m", title:"Avg Vol 1M", width:120 },
    { key:"avg_volume_1y", title:"Avg Vol 1Y", width:120 },
    { key:"volume_ratio", title:"Vol Ratio", width:110 },
    { key:"obv", title:"OBV", width:100 },
    { key:"vwap", title:"VWAP", width:100 },
  ]},
  { group:"Pivot", cols:[
    { key:"pivot_point", title:"Pivot", width:100 },
    { key:"pivot_support_1", title:"Support 1", width:110 },
    { key:"pivot_resistance_1", title:"Resistance 1", width:120 },
  ]}
];

const ALL_TECH_COLS = TECH_COLUMN_GROUPS.flatMap((g) => g.cols);

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value;
}

function numCol(title, dataIndex, width = 120) {
  return { title, dataIndex, key: dataIndex, sorter: true, width, align: "right", render: (v) => displayValue(v) };
}

// ---------------------------------------------------------------------------
// Filter bar — shared by both views
// ---------------------------------------------------------------------------
function ClassificationFilterBar({ classMap, filterValues, onChange }) {
  const { marketCap, revenueSize, techRisk, fundRisk } = filterValues;
  const hasFilter = marketCap || revenueSize || techRisk || fundRisk;

  function mkOptions(opts, colorMap) {
    return [
      { value: "__empty__", label: <Typography.Text type="secondary" style={{ fontStyle:"italic" }}>Not set</Typography.Text> },
      ...opts.map((o) => ({ value: o, label: <Tag color={colorMap[o]} style={{ margin:0 }}>{o}</Tag> }))
    ];
  }

  return (
    <Row gutter={[8, 8]} align="middle" style={{ marginBottom: 8 }}>
      <Col>
        <Typography.Text type="secondary" style={{ fontSize:13 }}>Filter:</Typography.Text>
      </Col>
      {[
        { placeholder:"Market Cap", key:"marketCap", opts:MARKET_CAP_OPTIONS, colorMap:CAP_COLOR },
        { placeholder:"Revenue Size", key:"revenueSize", opts:REVENUE_SIZE_OPTIONS, colorMap:SIZE_COLOR },
        { placeholder:"Tech Risk", key:"techRisk", opts:RISK_OPTIONS, colorMap:RISK_COLOR },
        { placeholder:"Fund Risk", key:"fundRisk", opts:RISK_OPTIONS, colorMap:RISK_COLOR },
      ].map(({ placeholder, key, opts, colorMap }) => (
        <Col key={key}>
          <Select
            allowClear
            placeholder={placeholder}
            value={filterValues[key] || undefined}
            onChange={(val) => onChange({ ...filterValues, [key]: val || "" })}
            style={{ minWidth: 140 }}
            options={mkOptions(opts, colorMap)}
          />
        </Col>
      ))}
      {hasFilter && (
        <Col>
          <Button size="small" onClick={() => onChange({ marketCap:"", revenueSize:"", techRisk:"", fundRisk:"" })}>
            Clear
          </Button>
        </Col>
      )}
    </Row>
  );
}

// Apply classification filters to a row using the classMap (name → classification)
function applyClassFilter(row, nameKey, classMap, filters) {
  const name = (row[nameKey] || "").trim().toUpperCase();
  const cls = classMap.get(name) || {};
  const { marketCap, revenueSize, techRisk, fundRisk } = filters;

  function check(filterVal, rowVal) {
    if (!filterVal) return true;
    if (filterVal === "__empty__") return !rowVal;
    return rowVal === filterVal;
  }

  return (
    check(marketCap, cls.market_cap_category) &&
    check(revenueSize, cls.revenue_size) &&
    check(techRisk, cls.tech_risk) &&
    check(fundRisk, cls.fund_risk)
  );
}

// ---------------------------------------------------------------------------
// Fundamentals sub-component
// ---------------------------------------------------------------------------
function FundamentalsView({ basicIndustryCode, classMap, filters, onFiltersChange }) {
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

  // Valuation data — fetched once using default year, independent of year selector
  const [valMap, setValMap] = useState(new Map()); // stock_id → valuation row

  useEffect(() => {
    if (!basicIndustryCode) { setFinancialYearOptions([]); setFinancialYear(undefined); setRows([]); setValMap(new Map()); return; }
    const controller = new AbortController();
    setLoadingYears(true);
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

  // Fetch valuation data once using default year from valuation years API
  useEffect(() => {
    if (!basicIndustryCode) return;
    const controller = new AbortController();

    async function loadValuation() {
      try {
        const yResp = await fetchValuationYears(basicIndustryCode, controller.signal);
        const defaultYear = yResp?.default_year
          ? Number(yResp.default_year)
          : Array.isArray(yResp?.years) && yResp.years.length > 0
            ? Number(yResp.years[0])
            : null;
        if (!defaultYear) return;

        const vResp = await fetchPeerValuation(
          { basic_ind_code: basicIndustryCode, financial_year: defaultYear, sort_by: "market_cap", sort_dir: "desc" },
          controller.signal
        );

        const map = new Map();
        (Array.isArray(vResp?.rows) ? vResp.rows : []).forEach((r) => {
          if (r.stock_id != null) map.set(Number(r.stock_id), r);
        });
        setValMap(map);
      } catch (err) {
        if (err?.name === "CanceledError") return;
        // non-fatal — valuation columns just show "—"
      }
    }

    loadValuation();
    return () => controller.abort();
  }, [basicIndustryCode]);

  useEffect(() => {
    if (!basicIndustryCode || !financialYear) return;
    const controller = new AbortController();
    setLoadingTable(true);
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

  // Client-side filter using classMap, then merge valuation fields by stock_id
  const filteredRows = useMemo(
    () => rows
      .filter((row) => applyClassFilter(row, "stock_name", classMap, filters))
      .map((row) => {
        const val = valMap.get(Number(row.stock_id)) || {};
        return {
          ...row,
          _current_price: val.current_price ?? null,
          _trailing_pe: val.trailing_pe ?? null,
          _dividend_yield: val.dividend_yield ?? null,
          _market_cap: val.market_cap ?? null,
        };
      }),
    [rows, classMap, filters, valMap]
  );

  const allColumns = useMemo(() => [
    { title:"Stock", dataIndex:"stock_name", key:"stock_name", sorter:true, fixed:"left", width:220, ellipsis:true, render:displayValue },
    { title:"Year", dataIndex:"financial_year", key:"financial_year", sorter:true, width:90, render:displayValue },
    { title:"Date", dataIndex:"financial_date", key:"financial_date", sorter:true, width:120, render:displayValue },
    // Valuation columns (from default year, static)
    { title:"Price", dataIndex:"_current_price", key:"_current_price", width:100, align:"right",
      render:(v) => v != null ? Number(v).toFixed(2) : "—" },
    { title:"Trailing PE", dataIndex:"_trailing_pe", key:"_trailing_pe", width:110, align:"right",
      render:(v) => v != null ? Number(v).toFixed(2) : "—" },
    { title:"Div Yield %", dataIndex:"_dividend_yield", key:"_dividend_yield", width:110, align:"right",
      render:(v) => v != null ? `${Number(v).toFixed(2)}%` : "—" },
    { title:"Mkt Cap (Cr)", dataIndex:"_market_cap", key:"_market_cap", width:120, align:"right",
      render:(v) => v != null ? Number(v).toFixed(2) : "—" },
    // Fundamentals columns
    numCol("Revenue","total_revenue",120), numCol("Net Income","net_income",120),
    numCol("EBITDA","ebitda",110), numCol("FCF","free_cash_flow",110),
    numCol("Diluted EPS","diluted_eps",110), numCol("Book Value","book_value_per_share",120),
    numCol("FCF / Share","fcf_per_share",120), numCol("Revenue Growth %","revenue_growth_pct",135),
    numCol("Net Income Growth %","net_income_growth_pct",150), numCol("EPS Growth %","eps_growth_pct",125),
    numCol("EBITDA Growth %","ebitda_growth_pct",140), numCol("FCF Growth %","fcf_growth_pct",125),
    numCol("Gross Margin %","gross_margin_pct",125), numCol("Operating Margin %","operating_margin_pct",140),
    numCol("EBITDA Margin %","ebitda_margin_pct",130), numCol("Net Margin %","net_margin_pct",120),
    numCol("ROA %","roa_pct",100), numCol("ROE %","roe_pct",100),
    numCol("ROIC %","roic_pct",100), numCol("ROCE %","roce_pct",100),
    numCol("Receivables Turnover x","receivables_turnover_x",165), numCol("Inventory Turnover x","inventory_turnover_x",160),
    numCol("Payables Turnover x","payables_turnover_x",160), numCol("Debt / Equity x","debt_to_equity_x",130),
    numCol("Debt / Assets %","debt_to_assets_pct",130), numCol("Net Debt / EBITDA x","net_debt_to_ebitda_x",160),
    numCol("Interest Coverage x","interest_coverage_x",150), numCol("Current Ratio x","current_ratio_x",130),
    numCol("Quick Ratio x","quick_ratio_x",120), numCol("CFO / Net Income x","cash_flow_to_net_income_x",160),
    numCol("FCF Margin %","free_cash_flow_margin_pct",130), numCol("Capex Intensity %","capex_intensity_pct",140),
    numCol("Cash Change","cash_change",110),
  ], []);

  const columns = useMemo(() => allColumns.filter((c) => visibleColumns.includes(c.key)), [allColumns, visibleColumns]);
  const columnOptions = useMemo(() => allColumns.map((c) => ({ label: c.title, value: c.key })), [allColumns]);

  function handleTableChange(nextPag, _f, sorter) {
    const field = !Array.isArray(sorter) && sorter?.field && SORTABLE_FUND.has(sorter.field) ? sorter.field : sortState.field;
    const order = !Array.isArray(sorter) && sorter?.order ? (sorter.order === "ascend" ? "asc" : "desc") : sortState.order;
    setPagination((p) => ({ ...p, current: nextPag.current || 1, pageSize: nextPag.pageSize || DEFAULT_PAGE_SIZE }));
    setSortState({ field, order });
  }

  const hasFilter = filters.marketCap || filters.revenueSize || filters.techRisk || filters.fundRisk;
  const cardTitle = hasFilter ? `Showing ${filteredRows.length} of ${rows.length} (page)` : undefined;

  return (
    <Space direction="vertical" size={12} style={{ width:"100%" }}>
      <Row gutter={[12,12]} align="middle">
        <Col xs={24} md={10}>
          <Select
            placeholder="Select financial year"
            value={financialYear}
            onChange={(v) => { setFinancialYear(v); setPagination((p) => ({ ...p, current:1 })); }}
            loading={loadingYears}
            disabled={!basicIndustryCode || financialYearOptions.length === 0}
            options={financialYearOptions}
            style={{ width:"100%" }}
          />
        </Col>
      </Row>
      {yearsError && <Alert type="error" message={yearsError} showIcon />}
      {tableError && <Alert type="error" message={tableError} showIcon />}
      <ClassificationFilterBar classMap={classMap} filterValues={filters} onChange={onFiltersChange} />
      <Card
        title={cardTitle}
        styles={{ body:{ padding:0 } }}
        extra={
          <Popover
            content={
              <div style={{ padding:12, width:300, maxHeight:440, overflowY:"auto", background:"#fff", borderRadius:8 }}>
                <Space direction="vertical" size={10} style={{ width:"100%" }}>
                  <Checkbox.Group value={visibleColumns} onChange={setVisibleColumns}
                    options={columnOptions.map((c) => ({ label:c.label, value:c.value }))}
                    style={{ display:"grid", gridTemplateColumns:"1fr", gap:6 }} />
                  <Space>
                    <Button size="small" onClick={() => setVisibleColumns(DEFAULT_FUND_COLUMNS)}>Reset</Button>
                    <Button size="small" onClick={() => setVisibleColumns(allColumns.map((c) => c.key))}>All</Button>
                  </Space>
                </Space>
              </div>
            }
            title="Choose Columns" trigger="click" placement="bottomRight"
            overlayInnerStyle={{ padding:0, background:"#fff" }}
          >
            <Button size="small">Columns</Button>
          </Popover>
        }
      >
        <Table
          rowKey="stock_id"
          dataSource={filteredRows}
          columns={columns}
          loading={loadingTable}
          size="small"
          onChange={handleTableChange}
          pagination={{ current:pagination.current, pageSize:pagination.pageSize, total:pagination.total, showSizeChanger:true, pageSizeOptions:["10","25","50","100"] }}
          scroll={{ x:"max-content" }}
        />
      </Card>
    </Space>
  );
}

// ---------------------------------------------------------------------------
// Technical sub-component
// ---------------------------------------------------------------------------
function TechnicalView({ basicIndustryCode, classMap, filters, onFiltersChange }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_TECH_COLUMNS);
  const [pagination, setPagination] = useState({ current:1, pageSize:50, total:0 });

  useEffect(() => {
    if (!basicIndustryCode) { setRows([]); return; }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchIndustryTechnicalIndicators(basicIndustryCode, { page:pagination.current, page_size:pagination.pageSize }, controller.signal)
      .then((response) => {
        setRows(Array.isArray(response?.stocks) ? response.stocks : []);
        setPagination((p) => ({ ...p, total:Number(response?.total) || 0 }));
      })
      .catch((err) => { if (err?.name !== "CanceledError") setError(err?.message || "Failed to load technical indicators."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [basicIndustryCode, pagination.current, pagination.pageSize]);

  const filteredRows = useMemo(
    () => rows.filter((row) => applyClassFilter(row, "name", classMap, filters)),
    [rows, classMap, filters]
  );

  const allTechColumns = useMemo(() => {
    const stockCol = {
      title:"Stock", dataIndex:"name", key:"stock_name", fixed:"left", width:220, ellipsis:true,
      sorter:(a,b) => (a.name||"").localeCompare(b.name||""), render:displayValue
    };
    const rest = ALL_TECH_COLS.filter((c) => c.key !== "stock_name").map((c) => ({
      title:c.title, dataIndex:c.key, key:c.key, width:c.width, align:"right",
      sorter:(a,b) => { const av=parseFloat(a[c.key]); const bv=parseFloat(b[c.key]); if(isNaN(av)&&isNaN(bv))return 0; if(isNaN(av))return 1; if(isNaN(bv))return -1; return av-bv; },
      render:(v) => {
        if (c.key==="golden_cross_state") return v ? <Tag color={v==="above"?"green":"red"}>{v}</Tag> : "—";
        if (c.key==="golden_cross_event"||c.key==="death_cross_event") return typeof v==="boolean" ? (v?<Tag color="green">Yes</Tag>:<Tag color="default">No</Tag>) : "—";
        return displayValue(v);
      }
    }));
    return [stockCol, ...rest];
  }, []);

  const columns = useMemo(() => allTechColumns.filter((c) => visibleColumns.includes(c.key)), [allTechColumns, visibleColumns]);

  const hasFilter = filters.marketCap || filters.revenueSize || filters.techRisk || filters.fundRisk;
  const cardTitle = hasFilter ? `Showing ${filteredRows.length} of ${rows.length} (page)` : undefined;

  return (
    <Space direction="vertical" size={12} style={{ width:"100%" }}>
      {error && <Alert type="error" message={error} showIcon />}
      <ClassificationFilterBar classMap={classMap} filterValues={filters} onChange={onFiltersChange} />
      <Card
        title={cardTitle}
        styles={{ body:{ padding:0 } }}
        extra={
          <Popover
            content={
              <div style={{ padding:12, width:320, maxHeight:440, overflowY:"auto", background:"#fff", borderRadius:8 }}>
                <Space direction="vertical" size={10} style={{ width:"100%" }}>
                  {TECH_COLUMN_GROUPS.map((group) => (
                    <div key={group.group}>
                      <Typography.Text strong style={{ fontSize:12, color:"#166534" }}>{group.group}</Typography.Text>
                      <Checkbox.Group value={visibleColumns} onChange={setVisibleColumns}
                        options={group.cols.map((c) => ({ label:c.title, value:c.key }))}
                        style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, marginTop:4 }} />
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
            overlayInnerStyle={{ padding:0, background:"#fff" }}
          >
            <Button size="small">Columns</Button>
          </Popover>
        }
      >
        <Table
          rowKey="ticker_id"
          dataSource={filteredRows}
          columns={columns}
          loading={loading}
          size="small"
          pagination={{ current:pagination.current, pageSize:pagination.pageSize, total:pagination.total, showSizeChanger:true, pageSizeOptions:["25","50","100"], onChange:(page,pageSize)=>setPagination((p)=>({...p,current:page,pageSize})) }}
          scroll={{ x:"max-content" }}
          locale={{ emptyText: loading ? "Loading..." : "No technical data available." }}
        />
      </Card>
    </Space>
  );
}

// ---------------------------------------------------------------------------
// Valuation sub-component
// ---------------------------------------------------------------------------
function ValuationView({ basicIndustryCode, classMap, filters, onFiltersChange }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 25, total: 0 });
  const [sortState, setSortState] = useState({ field: "market_cap", order: "desc" });
  const [financialYear, setFinancialYear] = useState(undefined);
  const [yearOptions, setYearOptions] = useState([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [visibleValColumns, setVisibleValColumns] = useState(DEFAULT_VAL_COLUMNS);

  // Fetch available years when industry changes
  useEffect(() => {
    if (!basicIndustryCode) { setYearOptions([]); setFinancialYear(undefined); setRows([]); return; }
    const controller = new AbortController();
    setLoadingYears(true);
    fetchValuationYears(basicIndustryCode, controller.signal)
      .then((response) => {
        const years = Array.isArray(response?.years) ? response.years : [];
        const options = years.map((y) => ({ label: String(y), value: Number(y) }));
        setYearOptions(options);
        // Auto-select default or most recent year
        const defaultYear = response?.default_year ? Number(response.default_year) : options[0]?.value;
        setFinancialYear(defaultYear);
        setPagination((p) => ({ ...p, current: 1 }));
      })
      .catch((err) => { if (err?.name !== "CanceledError") setError(err?.message || "Failed to load years."); })
      .finally(() => setLoadingYears(false));
    return () => controller.abort();
  }, [basicIndustryCode]);

  // Fetch valuation data when year, pagination or sort changes
  useEffect(() => {
    if (!basicIndustryCode || !financialYear) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchPeerValuation(
      {
        basic_ind_code: basicIndustryCode,
        financial_year: financialYear,
        page: pagination.current,
        page_size: pagination.pageSize,
        sort_by: sortState.field,
        sort_dir: sortState.order
      },
      controller.signal
    )
      .then((response) => {
        setRows(Array.isArray(response?.rows) ? response.rows : []);
        setPagination((p) => ({ ...p, total: Number(response?.total) || 0 }));
      })
      .catch((err) => { if (err?.name !== "CanceledError") setError(err?.message || "Failed to load valuation data."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [basicIndustryCode, financialYear, pagination.current, pagination.pageSize, sortState.field, sortState.order]);

  // Client-side filter using classMap (match by stock name)
  const filteredRows = useMemo(
    () => rows.filter((row) => applyClassFilter(row, "stock", classMap, filters)),
    [rows, classMap, filters]
  );

  const hasFilter = filters.marketCap || filters.revenueSize || filters.techRisk || filters.fundRisk;
  const cardTitle = hasFilter ? `Showing ${filteredRows.length} of ${rows.length} (page)` : undefined;

  function fmt(val, decimals = 2) {
    if (val === null || val === undefined) return "—";
    const n = parseFloat(val);
    if (isNaN(n)) return "—";
    return n.toFixed(decimals);
  }

  function fmtPct(val) {
    if (val === null || val === undefined) return "—";
    const n = parseFloat(val);
    if (isNaN(n)) return "—";
    return `${(n * 100).toFixed(2)}%`;
  }

  const SORTABLE_VAL = new Set([
    "stock","financial_year","current_price","market_cap","enterprise_value",
    "trailing_pe","forward_pe","peg_ratio","price_to_sales","price_to_book",
    "enterprise_to_revenue","enterprise_to_ebitda","trailing_eps","forward_eps",
    "book_value","total_cash_per_share","current_ratio","quick_ratio","debt_to_equity",
    "return_on_assets","return_on_equity","dividend_yield","payout_ratio",
    "shares_outstanding","float_shares","held_percent_insiders","held_percent_institutions"
  ]);

  function valCol(title, key, width = 120, renderFn) {
    return {
      title, dataIndex: key, key, width, align: "right",
      sorter: true,
      render: renderFn || ((v) => fmt(v))
    };
  }

  const allValColumns = [
    { title: "Stock", dataIndex: "stock", key: "stock", fixed: "left", width: 180, ellipsis: true, sorter: true, render: (v) => v || "—" },
    valCol("Price", "current_price", 110, (v) => fmt(v, 2)),
    valCol("Market Cap (Cr)", "market_cap", 140, (v) => fmt(v, 2)),
    valCol("EV (Cr)", "enterprise_value", 130, (v) => fmt(v, 2)),
    valCol("Trailing PE", "trailing_pe", 110, (v) => fmt(v, 2)),
    valCol("Forward PE", "forward_pe", 110, (v) => fmt(v, 2)),
    valCol("PEG", "peg_ratio", 90, (v) => fmt(v, 2)),
    valCol("P/S", "price_to_sales", 90, (v) => fmt(v, 2)),
    valCol("P/B", "price_to_book", 90, (v) => fmt(v, 2)),
    valCol("EV/Rev", "enterprise_to_revenue", 100, (v) => fmt(v, 2)),
    valCol("EV/EBITDA", "enterprise_to_ebitda", 110, (v) => fmt(v, 2)),
    valCol("Trailing EPS", "trailing_eps", 120, (v) => fmt(v, 2)),
    valCol("Forward EPS", "forward_eps", 120, (v) => fmt(v, 2)),
    valCol("Book Value", "book_value", 110, (v) => fmt(v, 2)),
    valCol("Cash/Share", "total_cash_per_share", 110, (v) => fmt(v, 2)),
    valCol("Current Ratio", "current_ratio", 120, (v) => fmt(v, 2)),
    valCol("Quick Ratio", "quick_ratio", 110, (v) => fmt(v, 2)),
    valCol("D/E", "debt_to_equity", 90, (v) => fmt(v, 2)),
    valCol("ROA", "return_on_assets", 90, (v) => fmtPct(v)),
    valCol("ROE", "return_on_equity", 90, (v) => fmtPct(v)),
    valCol("Div Yield", "dividend_yield", 100, (v) => v != null ? `${fmt(v, 2)}%` : "—"),
    valCol("Payout", "payout_ratio", 90, (v) => fmtPct(v)),
    valCol("Shares (Cr)", "shares_outstanding", 110, (v) => fmt(v, 2)),
    valCol("Float (Cr)", "float_shares", 100, (v) => fmt(v, 2)),
    valCol("Insiders %", "held_percent_insiders", 110, (v) => fmtPct(v)),
    valCol("Institutions %", "held_percent_institutions", 120, (v) => fmtPct(v)),
  ];

  const columns = allValColumns.filter((c) => visibleValColumns.includes(c.key));

  function handleTableChange(nextPag, _f, sorter) {
    const field = !Array.isArray(sorter) && sorter?.field && SORTABLE_VAL.has(sorter.field)
      ? sorter.field : sortState.field;
    const order = !Array.isArray(sorter) && sorter?.order
      ? (sorter.order === "ascend" ? "asc" : "desc") : sortState.order;
    setPagination((p) => ({ ...p, current: nextPag.current || 1, pageSize: nextPag.pageSize || 25 }));
    setSortState({ field, order });
  }

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      {error && <Alert type="error" message={error} showIcon />}
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} md={10}>
          <Select
            placeholder="Select financial year"
            value={financialYear}
            onChange={(v) => { setFinancialYear(v); setPagination((p) => ({ ...p, current: 1 })); }}
            loading={loadingYears}
            disabled={!basicIndustryCode || yearOptions.length === 0}
            options={yearOptions}
            style={{ width: "100%" }}
          />
        </Col>
      </Row>
      <ClassificationFilterBar classMap={classMap} filterValues={filters} onChange={onFiltersChange} />
      <Card title={cardTitle} styles={{ body: { padding: 0 } }}
        extra={
          <Popover
            content={
              <div style={{ padding: 12, width: 300, maxHeight: 440, overflowY: "auto", background: "#fff", borderRadius: 8 }}>
                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                  <Checkbox.Group
                    value={visibleValColumns}
                    onChange={setVisibleValColumns}
                    options={allValColumns.map((c) => ({ label: c.title, value: c.key }))}
                    style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}
                  />
                  <Space>
                    <Button size="small" onClick={() => setVisibleValColumns(DEFAULT_VAL_COLUMNS)}>Reset</Button>
                    <Button size="small" onClick={() => setVisibleValColumns(allValColumns.map((c) => c.key))}>All</Button>
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
          rowKey="stock_id"
          dataSource={filteredRows}
          columns={columns}
          loading={loading}
          size="small"
          onChange={handleTableChange}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "25", "50", "100"]
          }}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: loading ? "Loading..." : "No valuation data available." }}
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
  const [view, setView] = useState("fundamentals");

  // Classification data for the selected industry (for filter)
  const [classData, setClassData] = useState([]);

  // Shared filter state — persists when switching between Fundamentals/Technical
  const [filters, setFilters] = useState({ marketCap:"", revenueSize:"", techRisk:"", fundRisk:"" });

  // Build name → classification map (uppercase key for case-insensitive match)
  const classMap = useMemo(() => {
    const map = new Map();
    classData.forEach((item) => {
      const key = (item.company_name || "").trim().toUpperCase();
      if (key) map.set(key, item);
    });
    return map;
  }, [classData]);

  // Load basic industry list on mount
  useEffect(() => {
    const controller = new AbortController();
    setLoadingBasics(true);
    fetchBasicIndustries(controller.signal, { limit:200 })
      .then((response) => {
        const source = Array.isArray(response?.basic_industries) ? response.basic_industries
          : Array.isArray(response?.data) ? response.data
          : Array.isArray(response) ? response : [];
        setBasicIndustryOptions(
          source
            .map((item) => ({ label:item?.basic_industry_name||item?.name||item?.basic_ind_code, value:item?.basic_ind_code||item?.code||"" }))
            .filter((item) => item.label && item.value)
            .sort((a,b) => a.label.localeCompare(b.label, undefined, { sensitivity:"base" }))
        );
      })
      .catch((err) => { if (err?.name !== "CanceledError") setBasicsError(err?.message || "Failed to load basic industries."); })
      .finally(() => setLoadingBasics(false));
    return () => controller.abort();
  }, []);

  // Load classification data when industry changes
  useEffect(() => {
    if (!basicIndustryCode) { setClassData([]); setFilters({ marketCap:"", revenueSize:"", techRisk:"", fundRisk:"" }); return; }
    const controller = new AbortController();
    fetchStocksByBasicCode(basicIndustryCode, controller.signal)
      .then((response) => {
        setClassData(Array.isArray(response?.data) ? response.data : []);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [basicIndustryCode]);

  return (
    <Space direction="vertical" size={16} style={{ width:"100%" }}>
      <Card>
        <Space direction="vertical" size={16} style={{ width:"100%" }}>
          <Typography.Title level={4} style={{ margin:0 }}>Peers</Typography.Title>
          <Typography.Text type="secondary">
            Select a basic industry to review the peer set — fundamentals or technical indicators.
          </Typography.Text>
          <Row gutter={[12,12]} align="middle">
            <Col xs={24} md={12}>
              <Select
                showSearch
                placeholder="Select basic industry"
                value={basicIndustryCode || undefined}
                onChange={(value) => { setBasicIndustryCode(value || ""); setFilters({ marketCap:"", revenueSize:"", techRisk:"", fundRisk:"" }); }}
                loading={loadingBasics}
                options={basicIndustryOptions}
                optionFilterProp="label"
                style={{ width:"100%" }}
              />
            </Col>
            <Col xs={24} md={8}>
              <Segmented
                value={view}
                onChange={setView}
                options={[
                  { label: "Fundamentals", value: "fundamentals" },
                  { label: "Valuation", value: "valuation" },
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
        <FundamentalsView
          key={`fund-${basicIndustryCode}`}
          basicIndustryCode={basicIndustryCode}
          classMap={classMap}
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}
      {basicIndustryCode && view === "valuation" && (
        <ValuationView
          key={`val-${basicIndustryCode}`}
          basicIndustryCode={basicIndustryCode}
          classMap={classMap}
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}
      {basicIndustryCode && view === "technical" && (
        <TechnicalView
          key={`tech-${basicIndustryCode}`}
          basicIndustryCode={basicIndustryCode}
          classMap={classMap}
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}
    </Space>
  );
}
