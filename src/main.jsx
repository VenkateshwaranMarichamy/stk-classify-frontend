import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "antd/dist/reset.css";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
