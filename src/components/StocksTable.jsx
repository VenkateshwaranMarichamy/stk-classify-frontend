import React, { useMemo, useState } from "react";
import { Button, Card, Col, Empty, Row, Select, Space, Table, Tag, Typography } from "antd";

const { Text } = Typography;

const RISK_COLOR = { HIGH: "red", MEDIUM: "orange", LOW: "green" };
const SIZE_COLOR = { LARGE: "blue", MEDIUM: "cyan", SMALL: "geekblue", MICRO: "purple" };
const CAP_COLOR = {
  MEGA_CAP: "gold",
  LARGE_CAP: "blue",
  MID_CAP: "cyan",
  SMALL_CAP: "geekblue",
  MICRO_CAP: "purple"
};

const MARKET_CAP_OPTIONS = ["MEGA_CAP", "LARGE_CAP", "MID_CAP", "SMALL_CAP", "MICRO_CAP"];
const REVENUE_SIZE_OPTIONS = ["LARGE", "MEDIUM", "SMALL", "MICRO"];
const RISK_OPTIONS = ["HIGH", "MEDIUM", "LOW"];

function FilterSelect({ placeholder, options, value, onChange, colorMap }) {
  return (
    <Select
      allowClear
      placeholder={placeholder}
      value={value || undefined}
      onChange={(val) => onChange(val || "")}
      style={{ minWidth: 140 }}
      options={[
        {
          value: "__empty__",
          label: <Text type="secondary" style={{ fontStyle: "italic" }}>Not set</Text>
        },
        ...options.map((o) => ({
          value: o,
          label: colorMap
            ? <Tag color={colorMap[o]} style={{ margin: 0 }}>{o}</Tag>
            : o
        }))
      ]}
    />
  );
}

export default function StocksTable({ stocks, stocksCount, onEdit }) {
  const [filterMarketCap, setFilterMarketCap] = useState("");
  const [filterRevenueSize, setFilterRevenueSize] = useState("");
  const [filterTechRisk, setFilterTechRisk] = useState("");
  const [filterFundRisk, setFilterFundRisk] = useState("");

  const hasActiveFilter = filterMarketCap || filterRevenueSize || filterTechRisk || filterFundRisk;

  const filteredStocks = useMemo(() => {
    return stocks.filter((row) => {
      if (filterMarketCap) {
        const isEmpty = filterMarketCap === "__empty__";
        const val = row.market_cap_category;
        if (isEmpty ? val : val !== filterMarketCap) return false;
      }
      if (filterRevenueSize) {
        const isEmpty = filterRevenueSize === "__empty__";
        const val = row.revenue_size;
        if (isEmpty ? val : val !== filterRevenueSize) return false;
      }
      if (filterTechRisk) {
        const isEmpty = filterTechRisk === "__empty__";
        const val = row.tech_risk;
        if (isEmpty ? val : val !== filterTechRisk) return false;
      }
      if (filterFundRisk) {
        const isEmpty = filterFundRisk === "__empty__";
        const val = row.fund_risk;
        if (isEmpty ? val : val !== filterFundRisk) return false;
      }
      return true;
    });
  }, [stocks, filterMarketCap, filterRevenueSize, filterTechRisk, filterFundRisk]);

  const columns = [
    {
      title: "Company",
      dataIndex: "company_name",
      key: "company_name",
      width: 220,
      ellipsis: true
    },
    {
      title: "Market Cap",
      dataIndex: "market_cap_category",
      key: "market_cap_category",
      width: 120,
      render: (val) => val
        ? <Tag color={CAP_COLOR[val] || "default"}>{val}</Tag>
        : "—"
    },
    {
      title: "Revenue Size",
      dataIndex: "revenue_size",
      key: "revenue_size",
      width: 120,
      render: (val) => val
        ? <Tag color={SIZE_COLOR[val] || "default"}>{val}</Tag>
        : "—"
    },
    {
      title: "Tech Risk",
      dataIndex: "tech_risk",
      key: "tech_risk",
      width: 110,
      render: (val) => val
        ? <Tag color={RISK_COLOR[val] || "default"}>{val}</Tag>
        : "—"
    },
    {
      title: "Fund Risk",
      dataIndex: "fund_risk",
      key: "fund_risk",
      width: 110,
      render: (val) => val
        ? <Tag color={RISK_COLOR[val] || "default"}>{val}</Tag>
        : "—"
    },
    {
      title: "Comments",
      dataIndex: "comments",
      key: "comments",
      ellipsis: true
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_, row) => (
        <Button type="link" onClick={() => onEdit(row)} style={{ paddingInline: 0 }}>
          Edit
        </Button>
      )
    }
  ];

  const shownCount = filteredStocks.length;
  const title = hasActiveFilter
    ? `Results (${shownCount} of ${stocksCount})`
    : `Results (${stocksCount})`;

  return (
    <Card
      title={title}
      extra={
        hasActiveFilter && (
          <Button
            size="small"
            onClick={() => {
              setFilterMarketCap("");
              setFilterRevenueSize("");
              setFilterTechRisk("");
              setFilterFundRisk("");
            }}
          >
            Clear Filters
          </Button>
        )
      }
    >
      {stocks.length === 0 ? (
        <Empty description="No companies found." image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {/* Filter bar */}
          <Row gutter={[8, 8]} align="middle">
            <Col>
              <Text type="secondary" style={{ fontSize: 13 }}>Filter:</Text>
            </Col>
            <Col>
              <FilterSelect
                placeholder="Market Cap"
                options={MARKET_CAP_OPTIONS}
                value={filterMarketCap}
                onChange={setFilterMarketCap}
                colorMap={CAP_COLOR}
              />
            </Col>
            <Col>
              <FilterSelect
                placeholder="Revenue Size"
                options={REVENUE_SIZE_OPTIONS}
                value={filterRevenueSize}
                onChange={setFilterRevenueSize}
                colorMap={SIZE_COLOR}
              />
            </Col>
            <Col>
              <FilterSelect
                placeholder="Tech Risk"
                options={RISK_OPTIONS}
                value={filterTechRisk}
                onChange={setFilterTechRisk}
                colorMap={RISK_COLOR}
              />
            </Col>
            <Col>
              <FilterSelect
                placeholder="Fund Risk"
                options={RISK_OPTIONS}
                value={filterFundRisk}
                onChange={setFilterFundRisk}
                colorMap={RISK_COLOR}
              />
            </Col>
          </Row>

          <Table
            dataSource={filteredStocks}
            columns={columns}
            rowKey={(row) => row?.company_id ?? `${row.company_name}-${row.market_cap_category}`}
            pagination={false}
            scroll={{ x: "max-content" }}
            size="small"
            locale={{ emptyText: "No stocks match the selected filters." }}
          />
        </Space>
      )}
    </Card>
  );
}
