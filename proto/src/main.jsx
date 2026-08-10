import React from "react";
import { createRoot } from "react-dom/client";
import "./brand.css";
import { installerStockage } from "./storage.js";
import Proto from "./Proto.jsx";

// Avant le rendu : le proto lit window.storage des son premier effet.
installerStockage();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Proto />
  </React.StrictMode>
);
