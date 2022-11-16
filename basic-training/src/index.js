import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Clock } from "./examples/clock-example";
import { Toggle } from "./examples/toggle-example";
import { ComponentHide } from "./examples/component-hide-example";
import { LoginControl } from "./examples/login-example";
import { TotalListExample } from "./examples/list-example";
import { TotalFormExample } from "./examples/form-example";
import { Calculator } from "./examples/temperature-calculator-example";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <div>
    <Clock />
    <hr />
    <Toggle />
    <hr />
    <ComponentHide />
    <hr />
    <LoginControl />
    <hr />
    <TotalListExample />
    <hr />
    <TotalFormExample />
    <hr />
    <Calculator />
  </div>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
