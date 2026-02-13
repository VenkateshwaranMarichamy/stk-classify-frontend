import React from "react";
import { Button, Col, Form, Row, Select } from "antd";

export default function ClassificationDropdowns({
  macro,
  sector,
  industry,
  basicCode,
  macroOptions,
  sectorOptions,
  industryOptions,
  basicOptions,
  isLoading,
  isError,
  stocksStatus,
  onMacroChange,
  onSectorChange,
  onIndustryChange,
  onBasicChange,
  onSearch
}) {
  return (
    <>
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Form.Item label="Macro Sector" style={{ marginBottom: 0 }}>
            <Select
              value={macro || undefined}
              onChange={(value) => onMacroChange(value || "")}
              placeholder="Select macro sector"
              disabled={isLoading || isError}
              options={macroOptions.map((opt) => ({ label: opt, value: opt }))}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Form.Item label="Sector" style={{ marginBottom: 0 }}>
            <Select
              value={sector || undefined}
              onChange={(value) => onSectorChange(value || "")}
              placeholder="Select sector"
              disabled={!macro || isLoading || isError}
              options={sectorOptions.map((opt) => ({ label: opt, value: opt }))}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Form.Item label="Industry" style={{ marginBottom: 0 }}>
            <Select
              value={industry || undefined}
              onChange={(value) => onIndustryChange(value || "")}
              placeholder="Select industry"
              disabled={!macro || !sector || isLoading || isError}
              options={industryOptions.map((opt) => ({ label: opt, value: opt }))}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Form.Item label="Basic Industry" style={{ marginBottom: 0 }}>
            <Select
              value={basicCode || undefined}
              onChange={(value) => onBasicChange(value || "")}
              placeholder="Select basic industry"
              disabled={!macro || !sector || !industry || isLoading || isError}
              options={basicOptions.map((opt) => ({ label: opt.name, value: opt.code }))}
            />
          </Form.Item>
        </Col>
      </Row>

      <Button
        type="primary"
        onClick={onSearch}
        disabled={!basicCode || stocksStatus === "loading"}
        loading={stocksStatus === "loading"}
      >
        Search
      </Button>
    </>
  );
}
