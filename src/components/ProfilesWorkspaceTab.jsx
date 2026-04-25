import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Empty, Select, Space, Spin, Typography } from "antd";
import ProfileEditorErrorBoundary from "./ProfileEditorErrorBoundary";
import StockProfileEditorTab from "./StockProfileEditorTab";
import { fetchAllStocks } from "../services/classificationService";

const { Text, Title } = Typography;

export default function ProfilesWorkspaceTab() {
  const [stocks, setStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [stocksError, setStocksError] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState(null);

  const loadStocks = useCallback(async (signal) => {
    setStocksLoading(true);
    setStocksError("");

    try {
      const response = await fetchAllStocks(signal);
      const normalizedStocks = Array.isArray(response)
        ? response
            .map((stock) => ({
              id: stock?.id,
              name: (stock?.name ?? stock?.company_name ?? "").toString().trim(),
              symbol: (stock?.symbol ?? stock?.trading_symbol ?? "").toString().trim()
            }))
            .filter((stock) => Number.isInteger(stock.id) && stock.name)
            .sort((left, right) => left.name.localeCompare(right.name))
        : Array.isArray(response?.data)
          ? response.data
              .map((stock) => ({
                id: stock?.id,
                name: (stock?.name ?? stock?.company_name ?? "").toString().trim(),
                symbol: (stock?.symbol ?? stock?.trading_symbol ?? "").toString().trim()
              }))
              .filter((stock) => Number.isInteger(stock.id) && stock.name)
              .sort((left, right) => left.name.localeCompare(right.name))
          : [];

      setStocks(normalizedStocks);
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

  const stockOptions = useMemo(() => (
    stocks.map((stock) => ({
      value: stock.id,
      label: stock.symbol ? `${stock.name} (${stock.symbol})` : stock.name
    }))
  ), [stocks]);

  const selectedStock = useMemo(
    () => stocks.find((stock) => stock.id === selectedProfileId) || null,
    [selectedProfileId, stocks]
  );

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Title level={4} style={{ margin: 0 }}>
            Stock Profiles
          </Title>
          <Text type="secondary">
            Pick a stock, review the current profile data, and patch only the fields you changed.
          </Text>

          {stocksError && (
            <Alert
              type="error"
              showIcon
              message={stocksError}
              action={<Button size="small" onClick={() => loadStocks()}>Retry</Button>}
            />
          )}

          <Space wrap style={{ width: "100%" }}>
            <Select
              showSearch
              allowClear
              size="large"
              placeholder={stocksLoading ? "Loading stocks..." : "Select a stock"}
              value={selectedProfileId ?? undefined}
              onChange={(value) => setSelectedProfileId(value ?? null)}
              options={stockOptions}
              optionFilterProp="label"
              style={{ minWidth: 360 }}
              disabled={stocksLoading || !!stocksError}
              loading={stocksLoading}
            />
          </Space>

          {stocksLoading && (
            <Space size={8}>
              <Spin size="small" />
              <Text type="secondary">Loading stock directory...</Text>
            </Space>
          )}

        </Space>
      </Card>

      {selectedProfileId ? (
        <ProfileEditorErrorBoundary>
          <StockProfileEditorTab
            key={selectedProfileId}
            profileId={selectedProfileId}
            onClose={() => setSelectedProfileId(null)}
          />
        </ProfileEditorErrorBoundary>
      ) : (
        <Card>
          <Empty
            description="Choose a stock to start editing its profile."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}
    </Space>
  );
}
