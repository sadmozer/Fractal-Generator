var cols = 5;
var raws = 5;
const backgroundColor = 40;

var grid = []
for(let i=0; i<cols; i++) {
  grid[i] = []
  for(let j=0; j<raws; j++) {
    grid[i][j] = 100
  }
}

var arr = [];
var X = 100;
var Y = 100;
var flag = false;
// Editable grid
var drawCanvas = function(p) {
  p.mouseInsideRect = function(x, y, width, height) {
    return p.mouseX > x && p.mouseX < x + width && p.mouseY > y && p.mouseY < y + height
  }

  p.setup = function() {
    var cnv = p.createCanvas(cols*30+1, raws*30+1);
    cnv.position((p.windowWidth-p.width)*0.90, (p.windowHeight-p.height)/2)
    p.noStroke();
    p.background(64, 64, 64, 50);
  }
  
  p.draw = function() {
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < raws; j++) {
        var x = i * 30;
        var y = j * 30;
        if(p.mouseInsideRect(x, y, 30, 30) && p.mouseIsPressed) {
          p.fill(backgroundColor);
          p.rect(x+2, y+2, 27, 27);

          if(grid[i][j] == 0) {
            p.fill(100);
          }
          else if(grid[i][j] == 100){
            p.fill(0)
          }
          p.rect(x+5, y+5, 22, 22);
        }
        else {
          p.fill(grid[i][j]);
          p.rect(x+2, y+2, 27, 27);
        }
      } 
    }
  }

  p.mouseReleased = function() {
    for(let i=0; i<cols; i++) {
      for(let j=0; j<raws; j++) {
        var x = i*30;
        var y = j*30;
        if(p.mouseInsideRect(x, y, 30, 30)) {
          if(grid[i][j] == 100) {
            grid[i][j] = 0;
          }
          else if(grid[i][j] == 0){
            grid[i][j] = 100;
          }
        }
      }
    }
  }

  p.mousePressed = function() {
  }
}

// Canvas where the fractals generate
var fractCanvas = function(p) {
  p.setup = function() {
    var cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.position(0,0);
    p.background(backgroundColor);
    p.stroke(255);
  }

  p.draw = function() { 
    if(flag) {
      var maxX = 0;
      var maxY = 0;
      
      for(let i=0; i<cols; i++) {
        for(let j=0; j<raws; j++) {
          if(grid[i][j] == 0) {
            arr.push([i, j]);
          }
        }
      }
      
      var minX = 100;
      var minY = 100;

      for(let i=0; i<arr.length; i++) {
        if(arr[i][0] < minX) {
          minX = arr[i][0];
        }
        if(arr[i][1] < minY) {
          minY = arr[i][1];
        }
        if(arr[i][0] > maxX) {
          maxX = arr[i][0];
        }
        if(arr[i][1] > maxY) {
          maxY = arr[i][1];
        }
      }

      var rangeX = maxX - minX + 1;
      var rangeY = maxY - minY + 1;
      for(let i=0; i<arr.length; i++) {
        p.point(arr[i][0], arr[i][1]);
        p.recFun(10, arr[i][0], arr[i][1], rangeX, rangeY);
      }
      flag = false;
    }
  }

  p.keyPressed = function() {
    if(p.keyCode == 32) {
      flag = true;
    }
  }

  p.recFun = function(n, oldX, oldY, rangeX, rangeY) {
    if(n >= 1 && (oldX < p.windowWidth) && (oldY < p.windowHeight)) {
      for(let i=0; i<arr.length; i++) {
        newX = arr[i][0] + oldX*rangeX;
        newY = arr[i][1] + oldY*rangeY;
        p.point(newX, newY);
        p.recFun(n-1, newX, newY, rangeX, rangeY);
      }
    }
  }
}

var canvas2 = new p5(fractCanvas);
var canvas1 = new p5(drawCanvas);
