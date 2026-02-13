import React from "react";
import { Button, Card, Empty, Table } from "antd";

export default function StocksTable({ stocks, stocksCount, onEdit }) {
  const columns = [
    {
      title: "Company",
      dataIndex: "company_name",
      key: "company_name"
    },
    {
      title: "Comments",
      dataIndex: "comments",
      key: "comments"
    },
    {
      title: "Market Cap",
      dataIndex: "market_cap_category",
      key: "market_cap_category",
      width: 150
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, row) => (
        <Button type="link" onClick={() => onEdit(row)} style={{ paddingInline: 0 }}>
          Edit
        </Button>
      )
    }
  ];

  return (
    <Card title={`Results (${stocksCount})`}>
      {stocks.length === 0 ? (
        <Empty description="No companies found." image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Table
          dataSource={stocks}
          columns={columns}
          rowKey={(row) => row?.company_id ?? `${row.company_name}-${row.market_cap_category}`}
          pagination={false}
        />
      )}
    </Card>
  );
}
