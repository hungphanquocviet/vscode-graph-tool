/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/**
 * This file contains source code adapted from syfxlin/graffiti-board (licensed Apache-2.0).
 *
 * @see https://github.com/syfxlin/graffiti-board/blob/5945b126c945073eced5e6eb78658bc2a7375881/main.js
 */

if (typeof require !== 'undefined') {
  var { intersect } = require('./path-int')
} else {
  var { intersect } = exports
}

window.paints = [];

function ellipse2path(cx, cy, rx, ry) {
  cx = parseFloat(cx);
  cy = parseFloat(cy);
  rx = parseFloat(rx);
  ry = parseFloat(ry);
  if (isNaN(cx - cy + rx - ry)) return;
  return (
    `M ${cx - rx} ${cy} ` +
    `a ${rx} ${ry} 0 1 0 ${2 * rx} 0` +
    `a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 ` +
    `Z`
  );
}

function polygon2path(points) {
  let pointsList = points.split(/(,|, )/g);
  return `M ${pointsList[0]} L ${pointsList.splice(1).join(" ")} Z`;
}

/**
 * Initialize the paint panel
 * @param {} svgId 
 * @param {*} conf 
 * @returns 
 */
function initPaint(svgId, conf = null) {
  if (window.paints[svgId]) {
    return;
  } else {
    window.paints.push(svgId);
  }
  var svgns = "http://www.w3.org/2000/svg";
  var svg = document.getElementById(svgId);
  // var svgOffset = svg.getBoundingClientRect();

  var config = {
    color: "#6190e8",
    fillColor: "none",
    lineWidth: 2,
    eraserSize: 10,
    fontFamily: "inherit",
    fontSize: 14,
    type: "circle",
    ...conf
  };

  // Set the configurations
  document.querySelector(`[data-type="${config.type}"`).classList.add("active");

  var drawMoveOpen = false;
  var resizeOpen = false;
  var svgCurrEle = null;

  // Text
  var text = null;
  var textCount = 0;
  var eraserPath = "";
  var tempPoint = null;
  var drawLimited = false;

  var undoList = [];
  var redoList = [];
  var boxSizeList = [];
  var redoBoxSizeList = [];

  var selectedCircles = [];
  var selectedCirclesLabel = [];
  var nodes = [];
  var nodesLabel = [];

  // Init
  for (const item of svg.children) {
    undoList.push(item);
    boxSizeList.push(item.getBBox());
  }

  var getPoint = (x, y) => {
    var svgOffset = svg.getBoundingClientRect();
    if (drawLimited) {
      return {
        x: Math.round((x - svgOffset.x) / 20) * 20,
        y: Math.round((y - svgOffset.y) / 20) * 20
      };
    } else {
      return {
        x: Math.round((x - svgOffset.x) * 100) / 100,
        y: Math.round((y - svgOffset.y) * 100) / 100
      };
    }
  };

  var drawDown = e => {
    if (e.buttons === 32) {
      config.type = "eraser";
    }

    drawMoveOpen = true;
    let { x, y } = getPoint(e.clientX, e.clientY);

    redoList = [];

    // Create the circle
    if (config.type === "circle") {
      const group = document.createElementNS(svgns, "g");
      svgCurrEle = document.createElementNS(svgns, "circle");
      svgCurrEle.setAttribute("cx", x);
      svgCurrEle.setAttribute("cy", y);
      svgCurrEle.setAttribute('r', 30);
      svgCurrEle.setAttribute("fill", "#6190e8");

      // Set text of circle
      text = document.createElementNS(svgns, "text");
      text.setAttribute("x", x);
      text.setAttribute("y", y);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "central");
      text.textContent = textCount;

      textCount++;
      tempPoint = { x, y };

      group.appendChild(svgCurrEle);
      group.appendChild(text);

      nodes.push(svgCurrEle);
      nodesLabel.push(text);
      svg.appendChild(group);

      undoList.push(group);
    }


    if (config.type === "eraser") {
      eraserPath = `M ${x} ${y}`;
    }

    else {
      svgCurrEle.setAttributeNS(null, "fill", "#6190e8");
      svgCurrEle.setAttributeNS(null, "stroke", config.color);
      svgCurrEle.setAttributeNS(null, "stroke-width", config.lineWidth);
    }
  };

  var drawMove = e => {
    if (!drawMoveOpen) {
      return;
    }
    let { x, y } = getPoint(e.clientX, e.clientY);

    if (config.type === "eraser") {
      eraserPath += `L ${x} ${y}`;
      let index = undoList.findIndex(
        item => intersect(eraserPath, item.getAttributeNS(null, "d")).length > 0
      );
      if (index !== -1) {
        undoList[index].remove();
        undoList.splice(index, 1);
        boxSizeList.splice(index, 1);
      }
    }

    if (config.type === "select") {
      if (x - tempPoint.x < 0) {
        svgCurrEle.setAttributeNS(null, "x", x);
        svgCurrEle.setAttributeNS(null, "y", y);
      }
      svgCurrEle.setAttributeNS(null, "width", Math.abs(x - tempPoint.x));
      svgCurrEle.setAttributeNS(null, "height", Math.abs(y - tempPoint.y));
      selectHasMove = true;
    }
  };

  var drawUp = e => {
    let { x, y } = getPoint(e.clientX, e.clientY);
    drawMoveOpen = false;
    if (config.type === "eraser") {
      return;
    }
    if (resizeOpen) {
      resizeOpen = false;
      return;
    }
    if (config.type === "line") {
      return;
    }

    if (config.type === "circle") {
      svgCurrEle.setAttributeNS(
        null,
        "d",
        ellipse2path(
          svgCurrEle.getAttributeNS(null, "cx"),
          svgCurrEle.getAttributeNS(null, "cy"),
          svgCurrEle.getAttributeNS(null, "r"),
          svgCurrEle.getAttributeNS(null, "r"),
          svgCurrEle.getAttributeNS(null, "fill")
        )
      );
    }

    else {
      undoList.push(svgCurrEle);
      boxSizeList.push(svgCurrEle.getBBox());
    }
    
  };

  var handleClick = e => {
    let { x, y } = getPoint(e.clientX, e.clientY);
    if (config.type === "line") {
      // Check if the click is inside any circle
      const clickedCircle = nodes.find(circle => {
        const cx = parseFloat(circle.getAttribute("cx"));
        const cy = parseFloat(circle.getAttribute("cy"));
        const r = parseFloat(circle.getAttribute("r"));

        return Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) <= r;
      });

      const clickedLabelOfCircle = nodesLabel.find(label => {
        const cx = parseFloat(label.getAttribute("x"));
        const cy = parseFloat(label.getAttribute("y"));
        const r = 30;
        return Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) <= r;
      });

      if (clickedCircle || clickedLabelOfCircle) {
        if (selectedCircles.length < 2) {
          selectedCircles.push(clickedCircle);
          clickedCircle.setAttribute("fill", "green");

          var label = nodesLabel.find(label => {
            const cx = parseFloat(clickedCircle.getAttribute("cx"));
            const cy = parseFloat(clickedCircle.getAttribute("cy"));

            const x = parseFloat(label.getAttribute("x"));
            const y = parseFloat(label.getAttribute("y"));
            return cx == x && cy == y;
          });

          selectedCirclesLabel.push(label.textContent);
        }

        if (selectedCircles.length === 2) {
          const [circle1, circle2] = selectedCircles;
          const [label1, label2] = selectedCirclesLabel;
          // Create a line connecting the two circles
          const line = document.createElementNS(svgns, "line");
          line.setAttribute("x1", circle1.getAttribute("cx"));
          line.setAttribute("y1", circle1.getAttribute("cy"));
          line.setAttribute("x2", circle2.getAttribute("cx"));
          line.setAttribute("y2", circle2.getAttribute("cy"));
          line.setAttribute("stroke", "black");
          line.setAttribute("stroke-width", "2");

          // Append the line to the SVG
          svg.insertBefore(line, svg.firstChild);
          undoList.push(line);

          let mapping = JSON.parse(document.getElementById("mappingData").value);
          mapping.push([label1, label2]);
          document.getElementById("mappingData").value = JSON.stringify(mapping);

          // Reset selected circles array and color
          selectedCircles.forEach(circle => {
            circle.setAttribute("fill", "#6190e8");
          });
          selectedCircles = [];
          selectedCirclesLabel = [];
        }
      }
    }
  }

  svg.addEventListener("pointerdown", drawDown);
  svg.addEventListener("pointermove", drawMove);
  svg.addEventListener("pointerup", drawUp);
  svg.addEventListener("click", handleClick);

  var stopPolygon = () => {
    tempPoint = null;
    drawMoveOpen = false;
    svgCurrEle.setAttributeNS(
      null,
      "d",
      polygon2path(svgCurrEle.getAttributeNS(null, "points"))
    );
    undoList.push(svgCurrEle);
    boxSizeList.push(svgCurrEle.getBBox());
  };

  window.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      stopPolygon();
    }
    if (e.key === "Control") {
      drawLimited = true;
    }
    if (e.key === "Delete" && svg.querySelector("#selects")) {
      redoList = [];
      for (const item of svg.querySelector("#selects").children) {
        let index = item.getAttributeNS(null, "data-index");
        undoList[index].remove();
        redoList.push(undoList[index]);
        undoList.slice(index, 1);
        boxSizeList.splice(index, 1);
      }
      svg.querySelector("#selects").remove();
    }
  });

  window.addEventListener("keyup", e => {
    if (e.key === "Control") {
      drawLimited = false;
    }
  });

  document.querySelectorAll(".svg-pen .svg-btn").forEach(item => {
    item.addEventListener("click", e => {
      if (document.querySelector(".svg-button .active")) {
        document
          .querySelector(".svg-button .active")
          .classList.remove("active");
      }
      item.classList.add("active");
      config.type = item.getAttribute("data-type");
    });
  });

  document.querySelectorAll(".svg-shape .svg-btn").forEach(item => {
    item.addEventListener("click", e => {
      if (document.querySelector(".svg-button .active")) {
        document
          .querySelector(".svg-button .active")
          .classList.remove("active");
      }
      item.classList.add("active");
      config.type = item.getAttribute("data-type");
    });
  });

  document.querySelector("#svg-undo").addEventListener("click", e => {
    undoAction();
  });

  document.querySelector("#svg-redo").addEventListener("click", e => {
    redoAction();
  });

  // Shortcuts undo/redo
  document.addEventListener("keydown", function(e) {
    if (e.ctrlKey && e.key === "z") 
      undoAction();
    if (e.ctrlKey && e.key === "y")
      redoAction();
  });

  document.querySelector("#svg-clean").addEventListener("click", e => {
    undoList = [];
    redoList = [];
    svg.innerHTML = "";
    textCount = 0;
  });

  var undoAction = () => {
    if (undoList.length < 1) {
      return;
    }
    let undoEle = undoList.pop();
    undoEle.remove();
    redoList.push(undoEle);
    redoBoxSizeList.push(boxSizeList.pop());
  }

  var redoAction = () => {
    if (redoList.length < 1) {
      return;
    }
    let redoEle = redoList.pop();
    
    // If the element is line, push to the front
    if (redoEle.tagName === 'line') 
      svg.insertBefore(redoEle, svg.firstChild);
    else 
      svg.append(redoEle);

    undoList.push(redoEle);
    boxSizeList.push(redoBoxSizeList.pop());
  }

  (['change-stay']).forEach(s => {
    document.querySelector("#svg-" + s).addEventListener("click", e => {
      document.querySelector('#text-' + s).onclick()
    });
  })
}

initPaint("svg");
