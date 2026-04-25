import React from "react";
import { Alert, Button, Col, Form, Input, Modal, Row, Select, Space } from "antd";

const { TextArea } = Input;

export default function EditStockModal({
  isOpen,
  editCompany,
  editMarketCap,
  editBasicCode,
  editTechRisk,
  editFundRisk,
  editRevenueSize,
  editComments,
  marketCapOptions,
  techRiskOptions,
  fundRiskOptions,
  revenueSizeOptions,
  basicIndustryStatus,
  basicIndustryErrorMessage,
  modalBasicOptions,
  updateStatus,
  updateError,
  onCompanyChange,
  onMarketCapChange,
  onBasicCodeChange,
  onTechRiskChange,
  onFundRiskChange,
  onRevenueSizeChange,
  onCommentsChange,
  onClose,
  onUpdate
}) {
  return (
    <Modal
      title="Edit Stock Classification"
      open={isOpen}
      onCancel={onClose}
      destroyOnClose
      width={600}
      footer={
        <Space>
          <Button onClick={onClose} disabled={updateStatus === "loading"}>
            Cancel
          </Button>
          <Button type="primary" onClick={onUpdate} loading={updateStatus === "loading"}>
            Update
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item label="Company Name">
          <Input value={editCompany} onChange={(e) => onCompanyChange(e.target.value)} />
        </Form.Item>

        <Form.Item label="Basic Industry">
          <Select
            showSearch
            value={editBasicCode || undefined}
            onChange={(value) => onBasicCodeChange(value || "")}
            placeholder="Select basic industry"
            loading={basicIndustryStatus === "loading"}
            disabled={basicIndustryStatus === "error"}
            optionFilterProp="label"
            options={modalBasicOptions.map((opt) => ({ label: opt.name, value: opt.code }))}
          />
        </Form.Item>

        {basicIndustryStatus === "error" && (
          <Alert message={basicIndustryErrorMessage} type="error" showIcon style={{ marginBottom: 12 }} />
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Market Cap">
              <Select
                allowClear
                value={editMarketCap || undefined}
                onChange={(value) => onMarketCapChange(value || "")}
                placeholder="Select market cap"
                options={(marketCapOptions || []).map((o) => ({ label: o, value: o }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Revenue Size">
              <Select
                allowClear
                value={editRevenueSize || undefined}
                onChange={(value) => onRevenueSizeChange(value || "")}
                placeholder="Select revenue size"
                options={(revenueSizeOptions || []).map((o) => ({ label: o, value: o }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Tech Risk">
              <Select
                allowClear
                value={editTechRisk || undefined}
                onChange={(value) => onTechRiskChange(value || "")}
                placeholder="Select tech risk"
                options={(techRiskOptions || []).map((o) => ({ label: o, value: o }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Fund Risk">
              <Select
                allowClear
                value={editFundRisk || undefined}
                onChange={(value) => onFundRiskChange(value || "")}
                placeholder="Select fund risk"
                options={(fundRiskOptions || []).map((o) => ({ label: o, value: o }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Comments">
          <TextArea
            rows={3}
            value={editComments}
            onChange={(e) => onCommentsChange(e.target.value)}
            placeholder="Add comments..."
          />
        </Form.Item>

        {updateError && (
          <Alert message={updateError} type="error" showIcon />
        )}
      </Form>
    </Modal>
  );
}
