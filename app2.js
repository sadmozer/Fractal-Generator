(function() {
    var CANVAS = document.getElementById('canvas');
    var CTX = canvas.getContext('2d');

    window.addEventListener('resize', resizeCanvas, false);
    let isDrawing = true;

    let timer;
    // var POINTS = [
    //     {x: 0, y: 0}, {x:1, y:0}, 
    //     {x: 0, y: 1}, {x: 2, y: 0}, 
    //     {x: 0, y: 2}, {x: 1, y: 2}, 
    //     {x: 2, y: 1}, {x:2, y:2},
    //     {x: 3, y: 2}, {x:2, y:3},
    // ]
    var POINTS;
    const highlightedCells = new Set();

    function luminance(r, g, b) {
        const a = [r, g, b].map(function(v) {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }
    
    // Helper function to calculate contrast ratio
    function contrastRatio(color1, color2) {
        const lum1 = luminance(color1.r, color1.g, color1.b);
        const lum2 = luminance(color2.r, color2.g, color2.b);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }
    
    // Generate a random RGB color
    function randomColor() {
        return {
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256)
        };
    }
    
    // Ensure two colors have good contrast
    function generateContrastingColors() {
        let bgColor = randomColor();
        let patternColor;
        do {
            patternColor = randomColor();
        } while (contrastRatio(bgColor, patternColor) < 4.5);  // Adjust the contrast ratio threshold if needed
        return { bgColor, patternColor };
    }

    var fillColorPoints;
    var fillColorBackground;
    function init_variables() {
        var { bgColor, patternColor } = generateContrastingColors();
        fillColorBackground = bgColor;
        fillColorPoints = patternColor;
        POINTS = [...highlightedCells]
        POINTS = POINTS.map(function(o) { return {x: parseInt(o.split(",")[0]), y: parseInt(o.split(",")[1]) }});
        MAX_X = Math.max.apply(Math, POINTS.map(function(o) {return o.x}))
        MAX_Y = Math.max.apply(Math, POINTS.map(function(o) {return o.y}))
        MIN_X = Math.min.apply(Math, POINTS.map(function(o) {return o.x}))
        MIN_Y = Math.min.apply(Math, POINTS.map(function(o) {return o.y}))
        RANGE_X = MAX_X - MIN_X + 1;
        RANGE_Y = MAX_Y - MIN_Y + 1;
    }

    function resizeCanvas() {
        CANVAS.width = window.innerWidth - 320;
        CANVAS.height = window.innerHeight;
    }
    resizeCanvas();
    init_variables();
    const offsetX = Math.floor(CANVAS.width/2);
    const offsetY = Math.floor(CANVAS.height/2);
    
    function rec_fun(depth, OLD_POINT_X, OLD_POINT_Y) {
        if(depth >= 1) {
            for(let i=0; i<POINTS.length; i++) {
                var NEW_POINT_X = POINTS[i].x + OLD_POINT_X * RANGE_X;
                var NEW_POINT_Y = POINTS[i].y + OLD_POINT_Y * RANGE_Y;
                if (NEW_POINT_X >= 0 && NEW_POINT_X <= CANVAS.width && NEW_POINT_Y >= 0 && NEW_POINT_Y <= CANVAS.height) {
                    rec_fun(depth-1, NEW_POINT_X, NEW_POINT_Y);
                    (function (NEW_POINT_X, NEW_POINT_Y) {
                        timer = setTimeout(function() {
                            if (isDrawing) {
                                CTX.fillStyle = `rgb(${fillColorPoints.r}, ${fillColorPoints.g}, ${fillColorPoints.b})`;
                                CTX.fillRect(NEW_POINT_X+offsetX, NEW_POINT_Y+offsetY, 1, 1)
                                CTX.fillRect(NEW_POINT_X+offsetX, -NEW_POINT_Y+offsetY, 1, 1)
                                CTX.fillRect(-NEW_POINT_X+offsetX, NEW_POINT_Y+offsetY, 1, 1)
                                CTX.fillRect(-NEW_POINT_X+offsetX, -NEW_POINT_Y+offsetY, 1, 1)
                                // CTX.fillRect(NEW_POINT_Y+offset, NEW_POINT_X+offset, 1, 1)
                            }
                        }, 20);
                    })(NEW_POINT_X, NEW_POINT_Y);
                }
            }
        }
    }

    var drumMachine = document.getElementById("drumMachine");
    var nRows = 9;
    var nCols = 9;
    for (let i = 0; i < nRows; i++) {
        var row = document.createElement("tr");
        for (let j = 0; j < nCols; j++) {
            let cell = document.createElement("td");
            cell.className = "clickable";
            cell.addEventListener("click", function (event) {
                this.classList.toggle("activated");
                const cellE = event.target;
                const row = cell.parentElement;
                const xIndex = row.rowIndex;
                const yIndex = cellE.cellIndex;
                isDrawing = false;  // Set the flag to false to stop the recursion
                clearTimeout(timer);  // Optional: Clear the last setTimeout
                const offset = 100; 
                if (cell.classList.contains("activated")) {
                    highlightedCells.add(yIndex + "," + xIndex)
                }
                else {
                    // init_variables()
                    // isDrawing = false;  // Set the flag to false to stop the recursion
                    // clearTimeout(timer);  // Optional: Clear the last setTimeout
                    highlightedCells.delete(yIndex + "," + xIndex)
                    // (function() {
                    //     // console.log("deactivated")
                    //     setTimeout(function() {
                    //         CTX.fillStyle = "blue";
                    //         CTX.fillRect(0, 0, CANVAS.width, CANVAS.height)
                    //     }, 20);
                    // })();
                    // isDrawing = true;
                    // draw(5);
                    // draw(-1);
                    // (function() {
                        // setTimeout(function() {
                        //     CTX.fillStyle = "green";
                        //     CTX.fillRect(0, 0, CANVAS.width, CANVAS.height)
                        // }, 20);
                        // })();
                        // draw(5);
                    }
                    (function() {
                        init_variables()
                        console.log(POINTS)
                        setTimeout(function() {
                            CTX.fillStyle = `rgb(${fillColorBackground.r}, ${fillColorBackground.g}, ${fillColorBackground.b})`;
                            CTX.fillRect(0, 0, CANVAS.width, CANVAS.height)
                        }, 20);
                    })();
                    isDrawing = true;
                    rec_fun(4, 0, 0);
                });
            row.appendChild(cell);
        }
        drumMachine.appendChild(row);
    }

})();