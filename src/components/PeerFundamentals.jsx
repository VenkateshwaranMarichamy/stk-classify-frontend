import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Checkbox, Col, Popover, Row, Select, Space, Table, Typography } from "antd";
import { fetchBasicIndustries, fetchPeerFundamentals, fetchPeerYears } from "../services/classificationService";

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_SORT_BY = "total_revenue";
const DEFAULT_SORT_DIR = "desc";
const DEFAULT_VISIBLE_COLUMNS = [
  "stock_name",
  "financial_year",
  "financial_date",
  "total_revenue",
  "net_income",
  "ebitda",
  "free_cash_flow",
  "diluted_eps",
  "roe_pct",
  "roce_pct",
  "debt_to_equity_x",
  "current_ratio_x"
];

const SORTABLE_COLUMNS = new Set([
  "stock_name",
  "financial_year",
  "financial_date",
  "total_revenue",
  "net_income",
  "ebitda",
  "free_cash_flow",
  "diluted_eps",
  "book_value_per_share",
  "fcf_per_share",
  "revenue_growth_pct",
  "net_income_growth_pct",
  "eps_growth_pct",
  "ebitda_growth_pct",
  "fcf_growth_pct",
  "gross_margin_pct",
  "operating_margin_pct",
  "ebitda_margin_pct",
  "net_margin_pct",
  "roa_pct",
  "roe_pct",
  "roic_pct",
  "roce_pct",
  "receivables_turnover_x",
  "inventory_turnover_x",
  "payables_turnover_x",
  "debt_to_equity_x",
  "debt_to_assets_pct",
  "net_debt_to_ebitda_x",
  "interest_coverage_x",
  "current_ratio_x",
  "quick_ratio_x",
  "cash_flow_to_net_income_x",
  "free_cash_flow_margin_pct",
  "capex_intensity_pct",
  "cash_change"
]);

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value;
}

function numberColumn(title, dataIndex, width = 140) {
  return {
    title,
    dataIndex,
    key: dataIndex,
    sorter: true,
    width,
    align: "right",
    render: (value) => displayValue(value)
  };
}

export default function PeerFundamentals() {
  const [basicIndustryOptions, setBasicIndustryOptions] = useState([]);
  const [basicIndustryCode, setBasicIndustryCode] = useState("");
  const [financialYearOptions, setFinancialYearOptions] = useState([]);
  const [financialYear, setFinancialYear] = useState(undefined);
  const [rows, setRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0
  });
  const [sortState, setSortState] = useState({
    field: DEFAULT_SORT_BY,
    order: DEFAULT_SORT_DIR
  });
  const [loadingBasics, setLoadingBasics] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [basicsError, setBasicsError] = useState("");
  const [yearsError, setYearsError] = useState("");
  const [tableError, setTableError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadBasicIndustries() {
      setLoadingBasics(true);
      setBasicsError("");
      try {
        const response = await fetchBasicIndustries(controller.signal, { limit: 200 });
        const source = Array.isArray(response?.basic_industries)
          ? response.basic_industries
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : [];

        const options = source
          .map((item) => ({
            label: item?.basic_industry_name || item?.name || item?.basic_ind_code,
            value: item?.basic_ind_code || item?.code || ""
          }))
          .filter((item) => item.label && item.value)
          .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

        setBasicIndustryOptions(options);
      } catch (err) {
        if (err?.name === "CanceledError") return;
        setBasicsError(err?.message || "Failed to load basic industries.");
      } finally {
        setLoadingBasics(false);
      }
    }

    loadBasicIndustries();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!basicIndustryCode) {
      setFinancialYearOptions([]);
      setFinancialYear(undefined);
      setRows([]);
      setPagination((prev) => ({ ...prev, current: 1, total: 0 }));
      return;
    }

    const controller = new AbortController();

    async function loadPeerYears() {
      setLoadingYears(true);
      setYearsError("");
      setTableError("");
      try {
        const response = await fetchPeerYears(basicIndustryCode, controller.signal);
        const years = Array.isArray(response?.years) ? response.years : [];
        const options = years.map((year) => ({
          label: String(year),
          value: Number(year)
        }));
        setFinancialYearOptions(options);
        setFinancialYear(response?.default_year ? Number(response.default_year) : options[0]?.value);
        setPagination((prev) => ({ ...prev, current: 1 }));
      } catch (err) {
        if (err?.name === "CanceledError") return;
        setYearsError(err?.message || "Failed to load financial years.");
      } finally {
        setLoadingYears(false);
      }
    }

    loadPeerYears();
    return () => controller.abort();
  }, [basicIndustryCode]);

  useEffect(() => {
    if (!basicIndustryCode || !financialYear) return;

    const controller = new AbortController();

    async function loadPeers() {
      setLoadingTable(true);
      setTableError("");
      try {
        const response = await fetchPeerFundamentals(
          {
            basic_ind_code: basicIndustryCode,
            financial_year: financialYear,
            page: pagination.current,
            page_size: pagination.pageSize,
            sort_by: sortState.field,
            sort_dir: sortState.order
          },
          controller.signal
        );

        setRows(Array.isArray(response?.rows) ? response.rows : []);
        setPagination((prev) => ({
          ...prev,
          total: Number(response?.total) || 0
        }));
      } catch (err) {
        if (err?.name === "CanceledError") return;
        setTableError(err?.message || "Failed to load peer fundamentals.");
      } finally {
        setLoadingTable(false);
      }
    }

    loadPeers();
    return () => controller.abort();
  }, [basicIndustryCode, financialYear, pagination.current, pagination.pageSize, sortState.field, sortState.order]);

  const allColumns = useMemo(
    () => [
      {
        title: "Stock",
        dataIndex: "stock_name",
        key: "stock_name",
        sorter: true,
        fixed: "left",
        width: 220,
        ellipsis: true,
        render: (value) => displayValue(value)
      },
      {
        title: "Year",
        dataIndex: "financial_year",
        key: "financial_year",
        sorter: true,
        width: 90,
        render: (value) => displayValue(value)
      },
      {
        title: "Date",
        dataIndex: "financial_date",
        key: "financial_date",
        sorter: true,
        width: 120,
        render: (value) => displayValue(value)
      },
      numberColumn("Revenue", "total_revenue", 120),
      numberColumn("Net Income", "net_income", 120),
      numberColumn("EBITDA", "ebitda", 110),
      numberColumn("FCF", "free_cash_flow", 110),
      numberColumn("Diluted EPS", "diluted_eps", 110),
      numberColumn("Book Value", "book_value_per_share", 120),
      numberColumn("FCF / Share", "fcf_per_share", 120),
      numberColumn("Revenue Growth %", "revenue_growth_pct", 135),
      numberColumn("Net Income Growth %", "net_income_growth_pct", 150),
      numberColumn("EPS Growth %", "eps_growth_pct", 125),
      numberColumn("EBITDA Growth %", "ebitda_growth_pct", 140),
      numberColumn("FCF Growth %", "fcf_growth_pct", 125),
      numberColumn("Gross Margin %", "gross_margin_pct", 125),
      numberColumn("Operating Margin %", "operating_margin_pct", 140),
      numberColumn("EBITDA Margin %", "ebitda_margin_pct", 130),
      numberColumn("Net Margin %", "net_margin_pct", 120),
      numberColumn("ROA %", "roa_pct", 100),
      numberColumn("ROE %", "roe_pct", 100),
      numberColumn("ROIC %", "roic_pct", 100),
      numberColumn("ROCE %", "roce_pct", 100),
      numberColumn("Receivables Turnover x", "receivables_turnover_x", 165),
      numberColumn("Inventory Turnover x", "inventory_turnover_x", 160),
      numberColumn("Payables Turnover x", "payables_turnover_x", 160),
      numberColumn("Debt / Equity x", "debt_to_equity_x", 130),
      numberColumn("Debt / Assets %", "debt_to_assets_pct", 130),
      numberColumn("Net Debt / EBITDA x", "net_debt_to_ebitda_x", 160),
      numberColumn("Interest Coverage x", "interest_coverage_x", 150),
      numberColumn("Current Ratio x", "current_ratio_x", 130),
      numberColumn("Quick Ratio x", "quick_ratio_x", 120),
      numberColumn("CFO / Net Income x", "cash_flow_to_net_income_x", 160),
      numberColumn("FCF Margin %", "free_cash_flow_margin_pct", 130),
      numberColumn("Capex Intensity %", "capex_intensity_pct", 140),
      numberColumn("Cash Change", "cash_change", 110),
    ],
    []
  );

  const columns = useMemo(
    () => allColumns.filter((column) => visibleColumns.includes(column.key)),
    [allColumns, visibleColumns]
  );

  const columnOptions = useMemo(
    () =>
      allColumns.map((column) => ({
        label: column.title,
        value: column.key
      })),
    [allColumns]
  );

  function handleTableChange(nextPagination, _filters, sorter) {
    const sorterField =
      !Array.isArray(sorter) && sorter?.field && SORTABLE_COLUMNS.has(sorter.field)
        ? sorter.field
        : sortState.field;
    const sorterOrder =
      !Array.isArray(sorter) && sorter?.order
        ? sorter.order === "ascend"
          ? "asc"
          : "desc"
        : sortState.order;

    setPagination((prev) => ({
      ...prev,
      current: nextPagination.current || 1,
      pageSize: nextPagination.pageSize || DEFAULT_PAGE_SIZE
    }));
    setSortState({
      field: sorterField,
      order: sorterOrder
    });
  }

  const columnMenu = (
    <div
      style={{
        padding: 12,
        width: 300,
        maxHeight: 420,
        overflowY: "auto",
        background: "#ffffff",
        borderRadius: 8
      }}
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Checkbox.Group
          value={visibleColumns}
          onChange={(checkedValues) => setVisibleColumns(checkedValues)}
          options={columnOptions}
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}
        />
        <Space>
          <Button size="small" onClick={() => setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)}>
            Reset Default
          </Button>
          <Button size="small" onClick={() => setVisibleColumns(allColumns.map((column) => column.key))}>
            Show All
          </Button>
        </Space>
      </Space>
    </div>
  );

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Peer Fundamentals
          </Typography.Title>
          <Typography.Text type="secondary">
            Select a basic industry and financial year to review the peer set with server-side sorting and pagination.
          </Typography.Text>

          <Row gutter={[12, 12]}>
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
              <Select
                placeholder="Select financial year"
                value={financialYear}
                onChange={(value) => {
                  setFinancialYear(value);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                loading={loadingYears}
                disabled={!basicIndustryCode || financialYearOptions.length === 0}
                options={financialYearOptions}
                style={{ width: "100%" }}
              />
            </Col>
          </Row>

          {basicsError && <Alert type="error" message={basicsError} showIcon />}
          {yearsError && <Alert type="error" message={yearsError} showIcon />}
          {tableError && <Alert type="error" message={tableError} showIcon />}
        </Space>
      </Card>

      <Card
        bodyStyle={{ padding: 0 }}
        extra={
          <Popover
            content={columnMenu}
            title="Choose Columns"
            trigger="click"
            placement="bottomRight"
            overlayInnerStyle={{ padding: 0, background: "#ffffff" }}
          >
            <Button>Columns</Button>
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
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "25", "50", "100"]
          }}
          scroll={{ x: "max-content" }}
        />
      </Card>
    </Space>
  );
}
