/* eslint-disable */
// eslint-disable-next-line
import React from "react" // eslint-disable-line
import {observer} from "mobx-react" // eslint-disable-line
import { autorun, computed, observable, action } from "mobx" // eslint-disable-line
import ReactDOMServer from 'react-dom/server'

@observer
export default class AppList extends React.Component {

  render() {
    const { shots, made, x, y, num, eff, notice } = this.props;

    function colorPicked(shots, made)  {
      let ratio = made / parseFloat(shots)
      if (eff == true) {
        let pts = 0
        if (num >= 10) {
          pts = 3
        } else {
          pts = 2
        }
        let multiplier = ratio * pts
        ratio = multiplier / 3
      }

      if (ratio > 1.0 || ratio < 0.0) {
        return "black"
        notice(num)
      }
      else if (ratio <= 0.075) {
        return "#0602ff"
      }
      else if (ratio <= 0.125) {
        return "#3835fe"
      }
      else if (ratio <= 0.175) {
        return "#504dfd"
      }
      else if (ratio <= 0.225) {
        return "#6c69fc"
      }
      else if (ratio <= 0.275) {
        return "#8482fc"
      }
      else if (ratio <= 0.325) {
        return "#8f8efc"
      }
      else if (ratio <= 0.375) {
        return "#a3a2fb"
      }
      else if (ratio <= 0.425) {
        return "#bebdfa"
      }
      else if (ratio <= 0.475) {
        return "#dfdffa"
      }
      else if (ratio <= .525) {
        return "white"
      }
      else if (ratio <= .575) {
        return "#fadcdc"
      }
      else if (ratio <= .625) {
        return "#fac1c1"
      }
      else if (ratio <= .675) {
        return "#fba7a7"
      }
      else if (ratio <= .725) {
        return "#fc8a8a"
      }
      else if (ratio <= .775) {
        return "#fc7777"
      }
      else if (ratio <= .825) {
        return "#fd6c6c"
      }
      else if (ratio <= .875) {
        return "#fd4e4e"
      }
      else if (ratio <= .925) {
        return "#fe3b3b"
      }
      else if (ratio <= .975) {
        return "#fe2525"
      }
      else if (ratio <= 1.0) {
        return "#ff1010"
      }
      else {
        return "black"
      }
    }
    const colorP = colorPicked(shots, made)
    let textColor = "white"
    if (colorP == "white") {
      textColor = "lightgrey"
    }

    return (
      <div className="circle-render" style={{
        borderRadius: "50%",
	      width: "70px",
	      height: "70px",
        backgroundColor: colorP,
        color: textColor,
        textAlign: "center",
        fontSize: "20px",
        lineHeight: "70px",
        zIndex: "100",
        position: "absolute",
        left: x,
        top: y
      }}><span className="circle-num" style={{color: textColor}}>{num}</span><style>{(y > 604) ? "#a" + num + ":after" : "#b"+ num + ":after" } {`{
        content: '●';
        z-index: 150;
        font-size: 100px;
        display: absolute;
        float: left;
        color: ${colorP} !important;


      }`}</style>
        <span className="circle-before-render" id={(y > 604) ? "a" + num  : "b" + num  }>

        </span>
      </div>

    )
  }
}
