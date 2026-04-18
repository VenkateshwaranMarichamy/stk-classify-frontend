import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  List,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message
} from "antd";
import { fetchAllStocks, fetchStockProfile, patchStockProfile } from "../services/classificationService";

const { Text, Title } = Typography;
const { TextArea } = Input;

const OWNERSHIP_OPTIONS = [
  "GOVT_CONTROLLED",
  "JOINT_VENTURE",
  "PRIVATE",
  "PSU"
];
const RISK_LEVEL_OPTIONS = [
  "VERY LOW",
  "LOW",
  "MEDIUM",
  "HIGH",
  "VERY HIGH"
];

const ARRAY_FIELDS = ["associated_brands", "location", "keynotes", "clients", "products", "index_stock", "cutting_edge_products"];
// ID-array fields: stored as arrays of numbers, sent as arrays of numbers
const ID_ARRAY_FIELDS = ["parent_companies", "subsidiaries"];
const ALL_FIELDS = [
  "associated_brands",
  "business_group",
  "information",
  "risk_level",
  "location",
  "ownership_type",
  "keynotes",
  "clients",
  "products",
  "index_stock",
  "cutting_edge_products",
  "parent_companies",
  "subsidiaries"
];
const EMPTY_PROFILE_FORM = {
  associated_brands: [],
  business_group: "",
  information: "",
  risk_level: "",
  location: [],
  ownership_type: null,
  keynotes: [],
  clients: [],
  products: [],
  index_stock: [],
  cutting_edge_products: [],
  parent_companies: [],
  subsidiaries: []
};

function normalizeTagArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (item ?? "").toString().trim())
    .filter(Boolean);
}

function normalizeIdArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => Number(item)).filter((n) => Number.isFinite(n) && n > 0);
}

function normalizeProfile(profile) {
  return {
    associated_brands: normalizeTagArray(profile?.associated_brands),
    business_group: (profile?.business_group ?? "").toString(),
    information: (profile?.information ?? "").toString(),
    risk_level: (profile?.risk_level ?? "").toString(),
    location: normalizeTagArray(profile?.location),
    ownership_type: profile?.ownership_type ?? null,
    keynotes: normalizeTagArray(profile?.keynotes),
    clients: normalizeTagArray(profile?.clients),
    products: normalizeTagArray(profile?.products),
    index_stock: normalizeTagArray(profile?.index_stock),
    cutting_edge_products: normalizeTagArray(profile?.cutting_edge_products),
    parent_companies: normalizeIdArray(profile?.parent_companies),
    subsidiaries: normalizeIdArray(profile?.subsidiaries)
  };
}

function arraysEqual(a, b) {
  const left = Array.isArray(a) ? a : [];
  const right = Array.isArray(b) ? b : [];
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function profilesEqual(left, right) {
  return ALL_FIELDS.every((field) => {
    if (ARRAY_FIELDS.includes(field) || ID_ARRAY_FIELDS.includes(field)) {
      return arraysEqual(left[field], right[field]);
    }
    return (left[field] ?? null) === (right[field] ?? null);
  });
}

function buildPatchPayload(original, current) {
  const payload = {};
  const safeOriginal = { ...EMPTY_PROFILE_FORM, ...(original || {}) };
  const safeCurrent = { ...EMPTY_PROFILE_FORM, ...(current || {}) };

  for (const field of ALL_FIELDS) {
    if (ARRAY_FIELDS.includes(field) || ID_ARRAY_FIELDS.includes(field)) {
      if (!arraysEqual(safeOriginal[field], safeCurrent[field])) {
        payload[field] = safeCurrent[field];
      }
      continue;
    }

    if (field === "ownership_type") {
      const originalValue = safeOriginal[field] || null;
      const currentValue = safeCurrent[field] || null;
      if (originalValue !== currentValue) {
        payload[field] = currentValue;
      }
      continue;
    }

    const originalValue = (safeOriginal[field] ?? "").toString().trim();
    const currentValue = (safeCurrent[field] ?? "").toString().trim();
    if (originalValue !== currentValue) {
      payload[field] = currentValue || null;
    }
  }

  return payload;
}

function fieldIsDirty(field, original, current) {
  const safeOriginal = { ...EMPTY_PROFILE_FORM, ...(original || {}) };
  const safeCurrent = { ...EMPTY_PROFILE_FORM, ...(current || {}) };

  if (ARRAY_FIELDS.includes(field) || ID_ARRAY_FIELDS.includes(field)) {
    return !arraysEqual(safeOriginal[field], safeCurrent[field]);
  }

  if (field === "ownership_type") {
    return (safeOriginal[field] || null) !== (safeCurrent[field] || null);
  }

  return (safeOriginal[field] ?? "").toString().trim() !== (safeCurrent[field] ?? "").toString().trim();
}

function DirtyLabel({ label, dirty }) {
  return (
    <Space size={8}>
      <span>{label}</span>
      {dirty && <Tag color="warning">Modified</Tag>}
    </Space>
  );
}

function ListFieldEditor({
  label,
  values,
  dirty,
  placeholder,
  disabled,
  onAdd,
  onRemove
}) {
  const [draftValue, setDraftValue] = useState("");

  const handleAdd = useCallback(() => {
    const normalizedValue = draftValue.trim();
    if (!normalizedValue) return;
    onAdd(normalizedValue);
    setDraftValue("");
  }, [draftValue, onAdd]);

  return (
    <Form.Item label={<DirtyLabel label={label} dirty={dirty} />}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            onPressEnter={(event) => {
              event.preventDefault();
              handleAdd();
            }}
            placeholder={placeholder}
            disabled={disabled}
            status={dirty ? "warning" : ""}
          />
          <Button type="primary" onClick={handleAdd} disabled={disabled || !draftValue.trim()}>
            Add
          </Button>
        </Space.Compact>

        {values.length > 0 ? (
          <List
            size="small"
            bordered
            dataSource={values}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    key={`remove-${item}`}
                    type="text"
                    danger
                    size="small"
                    onClick={() => onRemove(item)}
                    disabled={disabled}
                  >
                    Remove
                  </Button>
                ]}
              >
                <Text>{item}</Text>
              </List.Item>
            )}
          />
        ) : (
          <Text type="secondary">No values added yet.</Text>
        )}
      </Space>
    </Form.Item>
  );
}

export default function StockProfileEditorTab({ profileId, onClose }) {
  const [messageApi, contextHolder] = message.useMessage();
  const [profileMeta, setProfileMeta] = useState(null);
  const [originalForm, setOriginalForm] = useState(null);
  const [formState, setFormState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Stock directory for resolving IDs → names in parent_companies / subsidiaries
  const [allStocks, setAllStocks] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    fetchAllStocks(controller.signal)
      .then((data) => {
        if (Array.isArray(data)) setAllStocks(data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const stockOptions = useMemo(
    () =>
      allStocks
        .filter((s) => Number.isInteger(s?.id) && s?.name)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({
          value: s.id,
          label: s.symbol ? `${s.name} (${s.symbol})` : s.name
        })),
    [allStocks]
  );

  const loadProfile = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchStockProfile(profileId, signal);
      const normalized = normalizeProfile(response);
      setProfileMeta({
        id: response?.stock_id ?? profileId,
        stock_name: response?.stock_name || response?.name || `Profile ${profileId}`
      });
      setOriginalForm(normalized);
      setFormState(normalized);
    } catch (err) {
      if (err?.name === "CanceledError") return;
      setError(err?.response?.data?.detail || err?.message || "Failed to load stock profile.");
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    const controller = new AbortController();
    loadProfile(controller.signal);
    return () => controller.abort();
  }, [loadProfile]);

  const currentForm = useMemo(
    () => ({ ...EMPTY_PROFILE_FORM, ...(formState || {}) }),
    [formState]
  );

  const dirtyMap = useMemo(() => {
    return Object.fromEntries(
      ALL_FIELDS.map((field) => [field, fieldIsDirty(field, originalForm, currentForm)])
    );
  }, [originalForm, currentForm]);

  const hasUnsavedChanges = useMemo(() => {
    if (!originalForm) return false;
    return !profilesEqual(originalForm, currentForm);
  }, [originalForm, currentForm]);

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;

    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const updateField = useCallback((field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: ID_ARRAY_FIELDS.includes(field)
        ? normalizeIdArray(value)
        : ARRAY_FIELDS.includes(field)
          ? normalizeTagArray(value)
          : value
    }));
  }, []);

  const addListItem = useCallback((field, value) => {
    setFormState((prev) => {
      const currentValues = normalizeTagArray(prev?.[field]);
      if (currentValues.includes(value)) {
        return prev;
      }

      return {
        ...prev,
        [field]: [...currentValues, value]
      };
    });
  }, []);

  const removeListItem = useCallback((field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: normalizeTagArray(prev?.[field]).filter((item) => item !== value)
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!originalForm) return;

    const patchPayload = buildPatchPayload(originalForm, currentForm);
    if (Object.keys(patchPayload).length === 0) {
      messageApi.info("No changes to save.");
      return;
    }

    const previousOriginal = originalForm;

    setSaving(true);
    setOriginalForm(currentForm);

    try {
      const response = await patchStockProfile(profileId, patchPayload);
      const normalized = normalizeProfile(response);
      setProfileMeta({
        id: response?.stock_id ?? profileId,
        stock_name: response?.stock_name || response?.name || `Profile ${profileId}`
      });
      setOriginalForm(normalized);
      setFormState(normalized);
      setError("");
      messageApi.success("Stock profile updated.");
    } catch (err) {
      setOriginalForm(previousOriginal);
      setFormState(previousOriginal);
      const detail = err?.response?.data?.detail;
      const errorMessage = Array.isArray(detail)
        ? detail.map((item) => item?.msg).filter(Boolean).join(", ")
        : detail || err?.message || "Failed to update stock profile.";
      setError(errorMessage);
      messageApi.error(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [currentForm, messageApi, originalForm, profileId]);

  const handleClose = useCallback(() => {
    if (!onClose) return;
    if (!hasUnsavedChanges) {
      onClose();
      return;
    }

    Modal.confirm({
      title: "Unsaved changes",
      content: "You have unsaved profile edits. Close the editor and discard them?",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep Editing",
      destroyOnHidden: true,
      onOk: onClose
    });
  }, [hasUnsavedChanges, onClose]);

  if (loading) {
    return (
      <>
        {contextHolder}
        <Card>
          <Space direction="vertical" size={16} style={{ width: "100%", alignItems: "center" }}>
            <Spin size="large" />
            <Text type="secondary">Loading stock profile...</Text>
          </Space>
        </Card>
      </>
    );
  }

  if (error && !formState) {
    return (
      <>
        {contextHolder}
        <Card>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Alert type="error" message={error} showIcon />
            <Button onClick={() => loadProfile()}>Retry</Button>
          </Space>
        </Card>
      </>
    );
  }

  return (
    <>
      {contextHolder}
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Space align="baseline" style={{ justifyContent: "space-between", width: "100%" }}>
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  Stock Profile Editor
                </Title>
                <Text type="secondary">
                  {profileMeta?.stock_name}
                </Text>
              </div>
              {onClose && (
                <Button onClick={handleClose}>
                  Close Editor
                </Button>
              )}
            </Space>

            {hasUnsavedChanges && (
              <Alert
                type="warning"
                showIcon
                message="Unsaved changes"
                description="You have local edits that are not yet persisted."
              />
            )}

            {error && currentForm && (
              <Alert type="error" showIcon message={error} />
            )}
          </Space>
        </Card>

        <Card>
          <Form layout="vertical">
            <Row gutter={[16, 8]}>
              <Col xs={24} md={12}>
                <Form.Item label={<DirtyLabel label="Associated Brands" dirty={dirtyMap.associated_brands} />}>
                  <Select
                    mode="tags"
                    value={currentForm.associated_brands}
                    onChange={(value) => updateField("associated_brands", value)}
                    placeholder="Add brands and press Enter"
                    status={dirtyMap.associated_brands ? "warning" : ""}
                    disabled={saving}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label={<DirtyLabel label="Business Group" dirty={dirtyMap.business_group} />}>
                  <Input
                    value={currentForm.business_group}
                    onChange={(e) => updateField("business_group", e.target.value)}
                    status={dirtyMap.business_group ? "warning" : ""}
                    disabled={saving}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label={<DirtyLabel label="Information" dirty={dirtyMap.information} />}>
                  <TextArea
                    rows={5}
                    value={currentForm.information}
                    onChange={(e) => updateField("information", e.target.value)}
                    status={dirtyMap.information ? "warning" : ""}
                    disabled={saving}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label={<DirtyLabel label="Risk Level" dirty={dirtyMap.risk_level} />}>
                  <Select
                    allowClear
                    value={currentForm.risk_level || undefined}
                    onChange={(value) => updateField("risk_level", value ?? "")}
                    options={RISK_LEVEL_OPTIONS.map((option) => ({ label: option, value: option }))}
                    status={dirtyMap.risk_level ? "warning" : ""}
                    disabled={saving}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label={<DirtyLabel label="Ownership Type" dirty={dirtyMap.ownership_type} />}>
                  <Select
                    allowClear
                    value={currentForm.ownership_type || undefined}
                    onChange={(value) => updateField("ownership_type", value ?? null)}
                    options={OWNERSHIP_OPTIONS.map((option) => ({ label: option, value: option }))}
                    status={dirtyMap.ownership_type ? "warning" : ""}
                    disabled={saving}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label={<DirtyLabel label="Location" dirty={dirtyMap.location} />}>
                  <Select
                    mode="tags"
                    value={currentForm.location}
                    onChange={(value) => updateField("location", value)}
                    placeholder="Add locations and press Enter"
                    status={dirtyMap.location ? "warning" : ""}
                    disabled={saving}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label={<DirtyLabel label="Clients" dirty={dirtyMap.clients} />}>
                  <Select
                    mode="tags"
                    value={currentForm.clients}
                    onChange={(value) => updateField("clients", value)}
                    placeholder="Add clients and press Enter"
                    status={dirtyMap.clients ? "warning" : ""}
                    disabled={saving}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label={<DirtyLabel label="Products" dirty={dirtyMap.products} />}>
                  <Select
                    mode="tags"
                    value={currentForm.products}
                    onChange={(value) => updateField("products", value)}
                    placeholder="Add products and press Enter"
                    status={dirtyMap.products ? "warning" : ""}
                    disabled={saving}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label={<DirtyLabel label="Index" dirty={dirtyMap.index_stock} />}>
                  <Select
                    mode="tags"
                    value={currentForm.index_stock}
                    onChange={(value) => updateField("index_stock", value)}
                    placeholder="Add indices and press Enter"
                    status={dirtyMap.index_stock ? "warning" : ""}
                    disabled={saving}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label={<DirtyLabel label="Cutting Edge Products" dirty={dirtyMap.cutting_edge_products} />}>
                  <Select
                    mode="tags"
                    value={currentForm.cutting_edge_products}
                    onChange={(value) => updateField("cutting_edge_products", value)}
                    placeholder="Add cutting edge products and press Enter"
                    status={dirtyMap.cutting_edge_products ? "warning" : ""}
                    disabled={saving}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label={<DirtyLabel label="Parent Companies" dirty={dirtyMap.parent_companies} />}>
                  <Select
                    mode="multiple"
                    showSearch
                    allowClear
                    value={currentForm.parent_companies}
                    onChange={(value) => updateField("parent_companies", value)}
                    options={stockOptions}
                    optionFilterProp="label"
                    placeholder="Select parent companies"
                    status={dirtyMap.parent_companies ? "warning" : ""}
                    disabled={saving}
                    loading={allStocks.length === 0}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label={<DirtyLabel label="Subsidiaries" dirty={dirtyMap.subsidiaries} />}>
                  <Select
                    mode="multiple"
                    showSearch
                    allowClear
                    value={currentForm.subsidiaries}
                    onChange={(value) => updateField("subsidiaries", value)}
                    options={stockOptions}
                    optionFilterProp="label"
                    placeholder="Select subsidiaries"
                    status={dirtyMap.subsidiaries ? "warning" : ""}
                    disabled={saving}
                    loading={allStocks.length === 0}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <ListFieldEditor
                  label="Keynotes"
                  values={currentForm.keynotes}
                  dirty={dirtyMap.keynotes}
                  placeholder="Add a keynote statement"
                  disabled={saving}
                  onAdd={(value) => addListItem("keynotes", value)}
                  onRemove={(value) => removeListItem("keynotes", value)}
                />
              </Col>
            </Row>

            <Space>
              <Button type="primary" onClick={handleSave} loading={saving}>
                Save Changes
              </Button>
              <Button
                onClick={() => {
                  setFormState(originalForm);
                  setError("");
                }}
                disabled={!hasUnsavedChanges || saving}
              >
                Reset
              </Button>
            </Space>
          </Form>
        </Card>
      </Space>
    </>
  );
}
