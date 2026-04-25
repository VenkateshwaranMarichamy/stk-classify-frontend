import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
  Table
} from "antd";
import {
  fetchAllStocks,
  fetchStockDetails,
  fetchStockFundamentals,
  fetchStockProfile
} from "../services/classificationService";

const { Text, Title } = Typography;

// ---------------------------------------------------------------------------
// Metric groups for the fundamentals transposed table
// ---------------------------------------------------------------------------
const METRIC_GROUPS = [
  {
    group: "Income",
    metrics: [
      { key: "total_revenue", label: "Revenue" },
      { key: "net_income", label: "Net Income" },
      { key: "ebitda", label: "EBITDA" },
      { key: "free_cash_flow", label: "Free Cash Flow" },
      { key: "diluted_eps", label: "Diluted EPS" },
      { key: "book_value_per_share", label: "Book Value / Share" },
      { key: "fcf_per_share", label: "FCF / Share" },
    ],
  },
  {
    group: "Growth",
    metrics: [
      { key: "revenue_growth_pct", label: "Revenue Growth %" },
      { key: "net_income_growth_pct", label: "Net Income Growth %" },
      { key: "eps_growth_pct", label: "EPS Growth %" },
      { key: "ebitda_growth_pct", label: "EBITDA Growth %" },
      { key: "fcf_growth_pct", label: "FCF Growth %" },
    ],
  },
  {
    group: "Margins",
    metrics: [
      { key: "gross_margin_pct", label: "Gross Margin %" },
      { key: "operating_margin_pct", label: "Operating Margin %" },
      { key: "ebitda_margin_pct", label: "EBITDA Margin %" },
      { key: "net_margin_pct", label: "Net Margin %" },
      { key: "free_cash_flow_margin_pct", label: "FCF Margin %" },
    ],
  },
  {
    group: "Returns",
    metrics: [
      { key: "roa_pct", label: "ROA %" },
      { key: "roe_pct", label: "ROE %" },
      { key: "roic_pct", label: "ROIC %" },
      { key: "roce_pct", label: "ROCE %" },
    ],
  },
  {
    group: "Efficiency",
    metrics: [
      { key: "receivables_turnover_x", label: "Receivables Turnover x" },
      { key: "inventory_turnover_x", label: "Inventory Turnover x" },
      { key: "payables_turnover_x", label: "Payables Turnover x" },
      { key: "capex_intensity_pct", label: "Capex Intensity %" },
    ],
  },
  {
    group: "Leverage",
    metrics: [
      { key: "debt_to_equity_x", label: "Debt / Equity x" },
      { key: "debt_to_assets_pct", label: "Debt / Assets %" },
      { key: "net_debt_to_ebitda_x", label: "Net Debt / EBITDA x" },
      { key: "interest_coverage_x", label: "Interest Coverage x" },
    ],
  },
  {
    group: "Liquidity",
    metrics: [
      { key: "current_ratio_x", label: "Current Ratio x" },
      { key: "quick_ratio_x", label: "Quick Ratio x" },
    ],
  },
  {
    group: "Cash Flow",
    metrics: [
      { key: "cash_flow_to_net_income_x", label: "CFO / Net Income x" },
      { key: "cash_change", label: "Cash Change" },
    ],
  },
];

// ---------------------------------------------------------------------------
// ClassificationSection
// ---------------------------------------------------------------------------
const CAP_COLOR = {
  MEGA_CAP: "gold", LARGE_CAP: "blue", MID_CAP: "cyan",
  SMALL_CAP: "geekblue", MICRO_CAP: "purple"
};
const RISK_COLOR = { HIGH: "red", MEDIUM: "orange", LOW: "green" };
const SIZE_COLOR = { LARGE: "blue", MEDIUM: "cyan", SMALL: "geekblue", MICRO: "purple" };

function MetricBadge({ label, value, colorMap }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      padding: "12px 20px",
      background: "#f8fafc",
      borderRadius: 10,
      border: "1px solid #e2e8f0",
      minWidth: 120
    }}>
      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      {value
        ? <Tag color={colorMap[value] || "default"} style={{ margin: 0, fontSize: 13, padding: "2px 10px" }}>{value}</Tag>
        : <span style={{ color: "#94a3b8", fontSize: 13 }}>—</span>
      }
    </div>
  );
}

function ClassificationSection({ data, loading, error, onRetry }) {
  if (loading) {
    return <Skeleton active paragraph={{ rows: 3 }} />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        message={error}
        showIcon
        action={
          <Button size="small" onClick={onRetry}>
            Retry
          </Button>
        }
      />
    );
  }

  const labelStyle = {
    backgroundColor: "#f0fdf4",
    fontWeight: 600,
    color: "#166534",
  };

  return (
    <Card title="Classification">
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 2 }}
          labelStyle={labelStyle}
        >
          <Descriptions.Item label="Company Name">
            {data?.company_name ?? "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Basic Industry">
            {data?.basic_industry_name ?? "—"}
          </Descriptions.Item>
        </Descriptions>

        {/* 4 metric flags as visual badges */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <MetricBadge label="Market Cap" value={data?.market_cap_category} colorMap={CAP_COLOR} />
          <MetricBadge label="Revenue Size" value={data?.revenue_size} colorMap={SIZE_COLOR} />
          <MetricBadge label="Tech Risk" value={data?.tech_risk} colorMap={RISK_COLOR} />
          <MetricBadge label="Fund Risk" value={data?.fund_risk} colorMap={RISK_COLOR} />
        </div>
      </Space>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ProfileSection helpers
// ---------------------------------------------------------------------------
function resolveIds(ids, directory) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const dirMap = new Map((directory || []).map((s) => [s.id, s.name]));
  return ids.map((id) => dirMap.get(id) ?? String(id));
}

function renderTags(values) {
  if (!Array.isArray(values) || values.length === 0) return "—";
  return values.map((v) => <Tag key={v}>{v}</Tag>);
}

// ---------------------------------------------------------------------------
// ProfileSection
// ---------------------------------------------------------------------------
function ProfileSection({ data, loading, error, onRetry, stockDirectory }) {
  if (loading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        message={error}
        showIcon
        action={
          <Button size="small" onClick={onRetry}>
            Retry
          </Button>
        }
      />
    );
  }

  const parentCompanyNames = resolveIds(data?.parent_companies, stockDirectory);
  const subsidiaryNames = resolveIds(data?.subsidiaries, stockDirectory);

  const labelStyle = {
    backgroundColor: "#f0fdf4",
    fontWeight: 600,
    color: "#166534",
  };

  return (
    <Card title="Profile">
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        {/* Text fields */}
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} labelStyle={labelStyle}>
          <Descriptions.Item label="Ownership Type">
            {data?.ownership_type ?? "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Business Risk Level">
            {data?.business_risk_level ?? "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Business Group">
            {data?.business_group || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Information" span={2}>
            {data?.information || "—"}
          </Descriptions.Item>
        </Descriptions>

        {/* Tag list fields */}
        <Descriptions bordered size="small" column={1} labelStyle={labelStyle}>
          <Descriptions.Item label="Associated Brands">
            {renderTags(data?.associated_brands)}
          </Descriptions.Item>
          <Descriptions.Item label="Locations">
            {renderTags(data?.location)}
          </Descriptions.Item>
          <Descriptions.Item label="Clients">
            {renderTags(data?.clients)}
          </Descriptions.Item>
          <Descriptions.Item label="Products">
            {renderTags(data?.products)}
          </Descriptions.Item>
          <Descriptions.Item label="Keynotes">
            {renderTags(data?.keynotes)}
          </Descriptions.Item>
          <Descriptions.Item label="Parent Companies">
            {renderTags(parentCompanyNames)}
          </Descriptions.Item>
          <Descriptions.Item label="Subsidiaries">
            {renderTags(subsidiaryNames)}
          </Descriptions.Item>
          <Descriptions.Item label="Index">
            {renderTags(data?.index_stock)}
          </Descriptions.Item>
          <Descriptions.Item label="Cutting Edge Products">
            {Array.isArray(data?.cutting_edge_products) && data.cutting_edge_products.length > 0
              ? data.cutting_edge_products.map((v) => <Tag key={v} color="blue">{v}</Tag>)
              : "—"}
          </Descriptions.Item>
        </Descriptions>
      </Space>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// FundamentalsSection
// ---------------------------------------------------------------------------
function FundamentalsSection({ data, loading, error, onRetry }) {
  if (loading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        message={error}
        showIcon
        action={
          <Button size="small" onClick={onRetry}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!data || !Array.isArray(data.rows) || data.rows.length === 0) {
    return (
      <Card title="Fundamentals" bodyStyle={{ padding: 0 }}>
        <div style={{ padding: 24 }}>
          <Empty description="No fundamentals data available for this stock." />
        </div>
      </Card>
    );
  }

  // Sort rows by financial_year descending (newest first = leftmost column)
  const sortedRows = [...data.rows].sort((a, b) => b.financial_year - a.financial_year);
  const years = sortedRows.map((r) => r.financial_year);

  // Build dataSource: group header rows + metric rows
  const dataSource = [];
  for (const { group, metrics } of METRIC_GROUPS) {
    // Group header row
    dataSource.push({
      key: `group-${group}`,
      isGroupHeader: true,
      label: group,
    });

    // One row per metric
    for (const { key: metricKey, label: metricLabel } of metrics) {
      const row = {
        key: metricKey,
        isGroupHeader: false,
        label: metricLabel,
      };
      for (const yearRow of sortedRows) {
        row[yearRow.financial_year] = yearRow[metricKey];
      }
      dataSource.push(row);
    }
  }

  // Build columns
  const columns = [
    {
      title: "Metric",
      dataIndex: "label",
      key: "label",
      fixed: "left",
      width: 200,
      render: (val, row) =>
        row.isGroupHeader ? (
          <Typography.Text strong>{val}</Typography.Text>
        ) : (
          val
        ),
    },
    ...years.map((year) => ({
      title: String(year),
      dataIndex: year,
      key: year,
      width: 110,
      align: "right",
      render: (val, row) => {
        if (row.isGroupHeader) return null;
        if (val === null || val === undefined) return "—";
        return val;
      },
    })),
  ];

  return (
    <Card title="Fundamentals" bodyStyle={{ padding: 0 }}>
      <Table
        dataSource={dataSource}
        columns={columns}
        size="small"
        scroll={{ x: "max-content" }}
        pagination={false}
        rowKey="key"
        rowClassName={(row) => (row.isGroupHeader ? "fundamentals-group-header" : "")}
        onRow={(row) =>
          row.isGroupHeader
            ? { style: { backgroundColor: "#f0fdf4" } }
            : {}
        }
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// StockDetailTab (main export)
// ---------------------------------------------------------------------------
export default function StockDetailTab() {
  // Stock directory
  const [stocks, setStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [stocksError, setStocksError] = useState("");

  // Selected stock
  const [selectedStockId, setSelectedStockId] = useState(null);

  // Classification section
  const [classificationData, setClassificationData] = useState(null);
  const [classificationLoading, setClassificationLoading] = useState(false);
  const [classificationError, setClassificationError] = useState("");

  // Profile section
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Fundamentals section
  const [fundamentalsData, setFundamentalsData] = useState(null);
  const [fundamentalsLoading, setFundamentalsLoading] = useState(false);
  const [fundamentalsError, setFundamentalsError] = useState("");

  // AbortController ref for in-flight stock detail requests
  const abortControllerRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Load stock directory on mount
  // ---------------------------------------------------------------------------
  const loadStocks = useCallback(async (signal) => {
    setStocksLoading(true);
    setStocksError("");
    try {
      const response = await fetchAllStocks(signal);
      // Handle both plain array and wrapped { data: [...] } shapes
      const raw = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.stocks)
            ? response.stocks
            : [];
      const normalized = raw
        .map((s) => ({
          id: s?.id,
          name: (s?.name ?? s?.company_name ?? "").toString().trim(),
          // API may use symbol or trading_symbol
          symbol: (s?.symbol ?? s?.trading_symbol ?? "").toString().trim(),
        }))
        .filter((s) => Number.isInteger(s.id) && s.name);
      setStocks(normalized);
    } catch (err) {
      if (err?.name === "CanceledError") return;
      setStocksError(err?.response?.data?.detail || err?.message || "Failed to load stocks.");
    } finally {
      setStocksLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadStocks(controller.signal);
    return () => controller.abort();
  }, [loadStocks]);

  // ---------------------------------------------------------------------------
  // Stock selector options (sorted alphabetically by name)
  // ---------------------------------------------------------------------------
  const stockOptions = useMemo(
    () =>
      [...stocks]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({
          value: s.id,
          label: s.symbol ? `${s.name} (${s.symbol})` : s.name,
        })),
    [stocks]
  );

  // ---------------------------------------------------------------------------
  // Handle stock selection
  // ---------------------------------------------------------------------------
  const handleStockSelect = useCallback(
    (id) => {
      if (id === null || id === undefined) {
        // Clear selection
        setSelectedStockId(null);
        setClassificationData(null);
        setClassificationLoading(false);
        setClassificationError("");
        setProfileData(null);
        setProfileLoading(false);
        setProfileError("");
        setFundamentalsData(null);
        setFundamentalsLoading(false);
        setFundamentalsError("");
        return;
      }

      // Abort any previous in-flight requests
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const { signal } = controller;

      setSelectedStockId(id);

      // Reset all sections to loading
      setClassificationData(null);
      setClassificationLoading(true);
      setClassificationError("");

      setProfileData(null);
      setProfileLoading(true);
      setProfileError("");

      setFundamentalsData(null);
      setFundamentalsLoading(true);
      setFundamentalsError("");

      // Fire all three fetches in parallel (independent — do NOT await sequentially)
      fetchStockDetails(id, signal)
        .then((data) => setClassificationData(data))
        .catch((err) => {
          if (err?.name === "CanceledError") return;
          setClassificationError(
            err?.response?.data?.detail || err?.message || "Failed to load classification."
          );
        })
        .finally(() => setClassificationLoading(false));

      fetchStockProfile(id, signal)
        .then((data) => setProfileData(data))
        .catch((err) => {
          if (err?.name === "CanceledError") return;
          setProfileError(
            err?.response?.data?.detail || err?.message || "Failed to load profile."
          );
        })
        .finally(() => setProfileLoading(false));

      fetchStockFundamentals(id, signal)
        .then((data) => setFundamentalsData(data))
        .catch((err) => {
          if (err?.name === "CanceledError") return;
          setFundamentalsError(
            err?.response?.data?.detail || err?.message || "Failed to load fundamentals."
          );
        })
        .finally(() => setFundamentalsLoading(false));
    },
    []
  );

  // Retry helpers — re-fire individual section fetches using a fresh controller
  const retryClassification = useCallback(() => {
    if (!selectedStockId) return;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    setClassificationData(null);
    setClassificationLoading(true);
    setClassificationError("");

    fetchStockDetails(selectedStockId, signal)
      .then((data) => setClassificationData(data))
      .catch((err) => {
        if (err?.name === "CanceledError") return;
        setClassificationError(
          err?.response?.data?.detail || err?.message || "Failed to load classification."
        );
      })
      .finally(() => setClassificationLoading(false));
  }, [selectedStockId]);

  const retryProfile = useCallback(() => {
    if (!selectedStockId) return;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    setProfileData(null);
    setProfileLoading(true);
    setProfileError("");

    fetchStockProfile(selectedStockId, signal)
      .then((data) => setProfileData(data))
      .catch((err) => {
        if (err?.name === "CanceledError") return;
        setProfileError(
          err?.response?.data?.detail || err?.message || "Failed to load profile."
        );
      })
      .finally(() => setProfileLoading(false));
  }, [selectedStockId]);

  const retryFundamentals = useCallback(() => {
    if (!selectedStockId) return;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    setFundamentalsData(null);
    setFundamentalsLoading(true);
    setFundamentalsError("");

    fetchStockFundamentals(selectedStockId, signal)
      .then((data) => setFundamentalsData(data))
      .catch((err) => {
        if (err?.name === "CanceledError") return;
        setFundamentalsError(
          err?.response?.data?.detail || err?.message || "Failed to load fundamentals."
        );
      })
      .finally(() => setFundamentalsLoading(false));
  }, [selectedStockId]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {/* Header card with selector */}
      <Card>
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Title level={4} style={{ margin: 0 }}>
            Stock Detail
          </Title>
          <Text type="secondary">
            Select a stock to view its classification, profile, and fundamentals data.
          </Text>

          {stocksError && (
            <Alert
              type="error"
              showIcon
              message={stocksError}
              action={
                <Button size="small" onClick={() => loadStocks()}>
                  Retry
                </Button>
              }
            />
          )}

          <Space wrap style={{ width: "100%" }}>
            <Select
              showSearch
              allowClear
              size="large"
              placeholder={stocksLoading ? "Loading stocks..." : "Select a stock"}
              value={selectedStockId ?? undefined}
              onChange={(value) => handleStockSelect(value ?? null)}
              options={stockOptions}
              optionFilterProp="label"
              style={{ minWidth: 360 }}
              disabled={stocksLoading || !!stocksError}
              loading={stocksLoading}
            />
          </Space>
        </Space>
      </Card>

      {/* Data sections — only shown when a stock is selected */}
      {selectedStockId ? (
        <Row gutter={[0, 16]}>
          <Col span={24}>
            <ClassificationSection
              data={classificationData}
              loading={classificationLoading}
              error={classificationError}
              onRetry={retryClassification}
            />
          </Col>
          <Col span={24}>
            <ProfileSection
              data={profileData}
              loading={profileLoading}
              error={profileError}
              onRetry={retryProfile}
              stockDirectory={stocks}
            />
          </Col>
          <Col span={24}>
            <FundamentalsSection
              data={fundamentalsData}
              loading={fundamentalsLoading}
              error={fundamentalsError}
              onRetry={retryFundamentals}
            />
          </Col>
        </Row>
      ) : (
        <Card>
          <Empty
            description="Select a stock to view its details."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}
    </Space>
  );
}
