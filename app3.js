var drumMachine = document.getElementById("drumMachine");
console.log(drumMachine)
var nRows = 15;
var nCols = 15;

for (let i = 0; i < nRows; i++) {
  var row = document.createElement("tr");
  for (let j = 0; j < nCols; j++) {
    let cell = document.createElement("td");
    cell.className = "clickable";
    cell.addEventListener("click", function () {
      this.classList.toggle("activated");
    });
    row.appendChild(cell);
  }
  drumMachine.appendChild(row);
}
