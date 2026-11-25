import React from "react";
import { createRoot } from "react-dom/client";
import SignupPage from "./SignupPage.jsx";
import "./signup.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SignupPage />
  </React.StrictMode>,
);
