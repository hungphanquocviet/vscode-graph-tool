const drawAPI = {
  unstable: {
    nonce: () => 'ToBeReplacedByRandomToken',
    editCurrentLine(args) {
      console.log({
        ...args,
        command: 'editCurrentLine',
      });
    },
  },
}

window.drawAPI = drawAPI

function getData() {
  var data = JSON.parse(document.getElementById("mappingData").value);
  return convertToGraph(data);
}

function convertToGraph(data) {
  let result = "graph D {\n";
  data.forEach(pair => {
    result += ` ${pair[0]}--${pair[1]};\n`;
  });
  result += "}";
  return result;
}

document.querySelector('#text-change-stay').onclick = function () {
  console.log("printed");
  drawAPI.unstable.editCurrentLine({
    control: 'stay',
    text: getData()
  })
};

(function () {
  if (typeof acquireVsCodeApi !== 'undefined') {
    const vscode = acquireVsCodeApi();
    drawAPI.unstable.editCurrentLine = (args) => {
      vscode.postMessage({
        ...args,
        command: 'editCurrentLine',
      })
    }
    vscode.postMessage({ command: 'requestCurrentLine' })
  }
}());