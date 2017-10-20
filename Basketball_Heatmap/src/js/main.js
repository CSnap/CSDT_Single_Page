// eslint-disable-next-line
import "../css/main.css" // eslint-disable-line
import React from "react" // eslint-disable-line
import ReactDOM from "react-dom" // eslint-disable-line
import AppStore from "./AppStore" // eslint-disable-line
import AppList from "./AppList" // eslint-disable-line

const app = document.getElementById("app")

ReactDOM.render(<AppList store={store}/>, app) // eslint-disable-line
