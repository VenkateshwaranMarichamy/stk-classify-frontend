import React from "react";
import { Alert, Button, Form, Input, Modal, Select, Space } from "antd";

export default function EditStockModal({
  isOpen,
  editCompany,
  editMarketCap,
  editBasicCode,
  marketCapOptions,
  basicIndustryStatus,
  basicIndustryErrorMessage,
  modalBasicOptions,
  updateStatus,
  updateError,
  onCompanyChange,
  onMarketCapChange,
  onBasicCodeChange,
  onClose,
  onUpdate
}) {
  return (
    <Modal
      title="Edit Stock"
      open={isOpen}
      onCancel={onClose}
      destroyOnClose
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
      <Form layout="vertical">
        <Form.Item label="Company">
          <Input value={editCompany} onChange={(e) => onCompanyChange(e.target.value)} />
        </Form.Item>

        <Form.Item label="Market Cap">
          <Select
            value={editMarketCap || undefined}
            onChange={(value) => onMarketCapChange(value || "")}
            placeholder="Select market cap"
            options={marketCapOptions.map((option) => ({ label: option, value: option }))}
          />
        </Form.Item>

        <Form.Item label="Basic Industry">
          <Select
            value={editBasicCode || undefined}
            onChange={(value) => onBasicCodeChange(value || "")}
            placeholder="Select basic industry"
            loading={basicIndustryStatus === "loading"}
            disabled={basicIndustryStatus === "error"}
            options={modalBasicOptions.map((opt) => ({ label: opt.name, value: opt.code }))}
          />
        </Form.Item>

        {basicIndustryStatus === "error" && (
          <Alert message={basicIndustryErrorMessage} type="error" showIcon style={{ marginBottom: 12 }} />
        )}

        {updateError && (
          <Alert message={updateError} type="error" showIcon />
        )}
      </Form>
    </Modal>
  );
}
