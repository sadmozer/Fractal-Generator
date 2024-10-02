(function() {
    var CANVAS = document.getElementById('canvas');
    var CTX = canvas.getContext('2d');

    window.addEventListener('resize', resizeCanvas, false);

    
    var POINTS = [{x: 0, y: 0}, {x:1, y:0}, {x: 0, y: 1}, {x: 2, y: 0}, {x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 1}, {x:2, y:2}]
    var MAX_X = Math.max.apply(Math, POINTS.map(function(o) {return o.x}))
    var MAX_Y = Math.max.apply(Math, POINTS.map(function(o) {return o.y}))
    var MIN_X = Math.min.apply(Math, POINTS.map(function(o) {return o.x}))
    var MIN_Y = Math.min.apply(Math, POINTS.map(function(o) {return o.y}))
    var RANGE_X = MAX_X - MIN_X + 1;
    var RANGE_Y = MAX_Y - MIN_Y + 1;
    var k = 0;
    
    // console.log(MAX_X, MAX_Y, MIN_Y, MIN_Y, RANGE_X, RANGE_Y);

    function resizeCanvas() {
        CANVAS.width = window.innerWidth;
        CANVAS.height = window.innerHeight;
        draw();
    }
    resizeCanvas();

    function rec_fun(depth, OLD_POINT_X, OLD_POINT_Y) {
        if(depth >= 1) {
            for(let i=0; i<POINTS.length; i++) {
                var NEW_POINT_X = POINTS[i].x + OLD_POINT_X * RANGE_X;
                var NEW_POINT_Y = POINTS[i].y + OLD_POINT_Y * RANGE_Y;
                
                // Qui avviene la magia
                if (NEW_POINT_X >= 0 
                    && NEW_POINT_X <= CANVAS.width
                    && NEW_POINT_Y >= 0
                    && NEW_POINT_Y <= CANVAS.height) {
                        k+=1;
                        rec_fun(depth-1, NEW_POINT_X, NEW_POINT_Y);
                        (function (NEW_POINT_X, NEW_POINT_Y) {
                            setTimeout(function() {
                                CTX.fillRect(NEW_POINT_X, NEW_POINT_Y, 1, 1)
                            }, 20);
                        })(NEW_POINT_X, NEW_POINT_Y);
                    }
            }
        }
    }

    function draw() {
        var DEPTH = 15;
        CTX.fillStyle = "white";
        for(let i=0; i<POINTS.length; i++) {
            k+=1;
            rec_fun(DEPTH, POINTS[i].x, POINTS[i].y);
            (function(i) {
                setTimeout(function() {
                    CTX.fillRect(POINTS[i].x, POINTS[i].y, 1, 1)
                }, 20);
            })(i);
        }
        console.log(k);
    }

})();