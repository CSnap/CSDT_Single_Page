import "../css/main.css" // eslint-disable-line no-use-before-define
import React from "react"
import ReactDOM from "react-dom"
import AppStore from "./AppStore"
import AppList from "./AppList"

const app = document.getElementById("app")

ReactDOM.render(<AppList store={store}/>, app)
