import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message
} from "antd";
import {
  classifyStock,
  fetchBasicIndustries,
  fetchUnclassifiedStocks
} from "../services/classificationService";

const { Text, Title } = Typography;

const MARKET_CAP_OPTIONS = ["LARGECAP", "MIDCAP", "SMALLCAP"];

export default function UnclassifiedStocksTab() {
  const [messageApi, contextHolder] = message.useMessage();

  // Unclassified stocks list
  const [stocks, setStocks] = useState([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  // Basic industries for the classify modal
  const [basicIndustries, setBasicIndustries] = useState([]);
  const [basicsLoading, setBasicsLoading] = useState(false);
  const [basicsLoaded, setBasicsLoaded] = useState(false);

  // Classify modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null); // { id, name, trading_symbol }
  const [companyName, setCompanyName] = useState("");
  const [basicCode, setBasicCode] = useState("");
  const [marketCap, setMarketCap] = useState("");
  const [submitStatus, setSubmitStatus] = useState("idle"); // idle | loading | success | error
  const [submitError, setSubmitError] = useState("");

  // Search filter
  const [searchText, setSearchText] = useState("");

  // ---------------------------------------------------------------------------
  // Load unclassified stocks
  // ---------------------------------------------------------------------------
  const loadStocks = useCallback(async (signal) => {
    setListLoading(true);
    setListError("");
    try {
      const response = await fetchUnclassifiedStocks(signal);
      const data = Array.isArray(response?.data) ? response.data : [];
      setStocks(data);
      setTotal(typeof response?.total === "number" ? response.total : data.length);
    } catch (err) {
      if (err?.name === "CanceledError") return;
      setListError(err?.response?.data?.detail || err?.message || "Failed to load unclassified stocks.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadStocks(controller.signal);
    return () => controller.abort();
  }, [loadStocks]);

  // ---------------------------------------------------------------------------
  // Load basic industries (lazy — only when modal first opens)
  // ---------------------------------------------------------------------------
  const loadBasics = useCallback(async () => {
    if (basicsLoaded || basicsLoading) return;
    setBasicsLoading(true);
    try {
      const response = await fetchBasicIndustries(undefined, { limit: 200 });
      const list = Array.isArray(response?.basic_industries)
        ? response.basic_industries
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];
      const normalized = list
        .map((item) => ({
          code: item?.basic_ind_code?.trim() || item?.code?.trim() || "",
          name: item?.basic_industry_name?.trim() || item?.name?.trim() || ""
        }))
        .filter((item) => item.code && item.name)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
      setBasicIndustries(normalized);
      setBasicsLoaded(true);
    } catch (err) {
      if (err?.name === "CanceledError") return;
      // Non-fatal — user can still type if needed
    } finally {
      setBasicsLoading(false);
    }
  }, [basicsLoaded, basicsLoading]);

  // ---------------------------------------------------------------------------
  // Open classify modal
  // ---------------------------------------------------------------------------
  function openModal(stock) {
    setSelectedStock(stock);
    setCompanyName(stock.name || "");
    setBasicCode("");
    setMarketCap("");
    setSubmitStatus("idle");
    setSubmitError("");
    setModalOpen(true);
    loadBasics();
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedStock(null);
    setSubmitStatus("idle");
    setSubmitError("");
  }

  // ---------------------------------------------------------------------------
  // Submit classification
  // ---------------------------------------------------------------------------
  async function handleClassify() {
    if (!companyName.trim()) {
      setSubmitError("Company name is required.");
      return;
    }
    if (!basicCode) {
      setSubmitError("Basic industry is required.");
      return;
    }
    if (!marketCap) {
      setSubmitError("Market cap is required.");
      return;
    }

    setSubmitStatus("loading");
    setSubmitError("");

    try {
      await classifyStock(selectedStock.id, {
        company_name: companyName.trim(),
        basic_ind_code: basicCode,
        market_cap_category: marketCap
      });

      // Remove classified stock from the list
      setStocks((prev) => prev.filter((s) => s.id !== selectedStock.id));
      setTotal((prev) => Math.max(0, prev - 1));

      setSubmitStatus("success");
      messageApi.success(`${companyName.trim()} classified successfully.`);
      closeModal();
    } catch (err) {
      setSubmitStatus("idle");
      const detail = err?.response?.data?.detail;
      setSubmitError(
        Array.isArray(detail)
          ? detail.map((d) => d?.msg).filter(Boolean).join(", ")
          : detail || err?.message || "Classification failed."
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Filtered list
  // ---------------------------------------------------------------------------
  const filteredStocks = useMemo(() => {
    if (!searchText.trim()) return stocks;
    const q = searchText.trim().toLowerCase();
    return stocks.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.trading_symbol?.toLowerCase().includes(q)
    );
  }, [stocks, searchText]);

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------
  const columns = [
    {
      title: "Stock Name",
      dataIndex: "name",
      key: "name",
      width: 400,
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (name) => <Text strong>{name}</Text>
    },
    {
      title: "Symbol",
      dataIndex: "trading_symbol",
      key: "trading_symbol",
      width: 160,
      render: (sym) => sym ? <Tag color="green">{sym}</Tag> : "—"
    },
    {
      title: "Action",
      key: "action",
      width: 110,
      align: "right",
      render: (_, row) => (
        <Button
          type="primary"
          size="small"
          onClick={() => openModal(row)}
        >
          Classify
        </Button>
      )
    }
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      {contextHolder}
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        {/* Header */}
        <Card>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  Unclassified Stocks
                  {total > 0 && (
                    <Badge
                      count={total}
                      style={{ backgroundColor: "#f59e0b", marginLeft: 10 }}
                    />
                  )}
                </Title>
                <Text type="secondary">
                  Stocks not yet assigned to a basic industry. Classify them to include in peer analysis.
                </Text>
              </div>
              <Button
                onClick={() => loadStocks()}
                disabled={listLoading}
              >
                Refresh
              </Button>
            </Space>

            {listError && (
              <Alert
                type="error"
                showIcon
                message={listError}
                action={
                  <Button size="small" onClick={() => loadStocks()}>
                    Retry
                  </Button>
                }
              />
            )}

            <Input.Search
              placeholder="Search by name or symbol..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ maxWidth: 360 }}
            />
          </Space>
        </Card>

        {/* Table */}
        <Table
          dataSource={filteredStocks}
          columns={columns}
          rowKey="id"
          loading={listLoading}
          size="middle"
          pagination={{
            pageSize: 25,
            showSizeChanger: true,
            pageSizeOptions: ["25", "50", "100"],
            showTotal: (t) => `${t} stocks`
          }}
          locale={{ emptyText: listError ? "Failed to load" : "No unclassified stocks found." }}
        />
      </Space>

      {/* Classify Modal */}
      <Modal
        title={
          <Space direction="vertical" size={2}>
            <Text strong>Classify Stock</Text>
            {selectedStock && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                {selectedStock.name}
                {selectedStock.trading_symbol ? ` · ${selectedStock.trading_symbol}` : ""}
              </Text>
            )}
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        destroyOnClose
        footer={
          <Space>
            <Button onClick={closeModal} disabled={submitStatus === "loading"}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleClassify}
              loading={submitStatus === "loading"}
            >
              Classify
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item label="Company Name" required>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name"
            />
          </Form.Item>

          <Form.Item label="Basic Industry" required>
            <Select
              showSearch
              value={basicCode || undefined}
              onChange={(val) => setBasicCode(val || "")}
              placeholder="Select basic industry"
              loading={basicsLoading}
              optionFilterProp="label"
              options={basicIndustries.map((b) => ({ label: b.name, value: b.code }))}
            />
          </Form.Item>

          <Form.Item label="Market Cap" required>
            <Select
              value={marketCap || undefined}
              onChange={(val) => setMarketCap(val || "")}
              placeholder="Select market cap"
              options={MARKET_CAP_OPTIONS.map((o) => ({ label: o, value: o }))}
            />
          </Form.Item>

          {submitError && (
            <Alert type="error" message={submitError} showIcon />
          )}
        </Form>
      </Modal>
    </>
  );
}
