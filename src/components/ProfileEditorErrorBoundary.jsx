import React from "react";
import { Alert, Button, Result } from "antd";

export default class ProfileEditorErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("StockProfileEditorTab crashed", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Profile editor failed to render"
          subTitle="Please reload this editor. If the issue persists, inspect the console and API payloads."
          extra={<Button onClick={this.handleReset}>Retry Render</Button>}
        >
          {this.state.error?.message && (
            <Alert type="error" message={this.state.error.message} showIcon />
          )}
        </Result>
      );
    }

    return this.props.children;
  }
}
