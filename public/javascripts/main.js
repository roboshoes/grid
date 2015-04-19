(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
    size: 10,
    speed: 0.1
};
},{}],2:[function(require,module,exports){
var grid = require( "./grid" );
var stage = require( "./stage" );

var canvas = document.querySelector( "#canvas" );
var context = canvas.getContext( "2d" );

function init() {
    onResize();
    clear();

    grid.setContext( context );
    grid.generate( 20 );
    grid.start();

    render();
}

function render() {
    requestAnimationFrame( render );

    grid.render();
}

function clear() {
    context.clearRect( 0, 0, stage.width, stage.height );
}

function onResize() {
    canvas.width = stage.width = window.innerWidth;
    canvas.height = stage.height = window.innerHeight;
}

init();
},{"./grid":3,"./stage":4}],3:[function(require,module,exports){
var tile = require( "./tile" );
var stage = require( "./stage" );
var config = require( "./config" );

var exports = module.exports = {};
var matrix;
var activeTiles;
var context;
var gridSize = 0;
var checkPool = window.checkPool = [];

exports.setContext = function( value ) {
    context = value;
};

exports.generate = function( size ) {
    gridSize = size;

    matrix = [];
    activeTiles = [];

    var x, y;

    for ( y = 0; y < size; y++ ) {
        matrix.push( [] );

        for ( x = 0; x < size; x++ ) {
            matrix[ y ].push( tile.generate( x, y, context ) );
        }
    }

    for ( y = 0; y < size; y++ ) {
        for ( x = 0; x < size; x++ ) {

            var neighbors = [];
            var corners = [];

            if ( y > 0 )        neighbors.push( matrix[ y - 1 ][ x ] );
            if ( y < size - 1 ) neighbors.push( matrix[ y + 1 ][ x ] );
            if ( x > 0 )        neighbors.push( matrix[ y ][ x - 1 ] );
            if ( x < size - 1 ) neighbors.push( matrix[ y ][ x + 1 ] );

            if ( x < size - 1 && y > 0 )        corners.push( matrix[ y - 1 ][ x + 1 ] );
            if ( x < size - 1 && y < size - 1 ) corners.push( matrix[ y + 1 ][ x + 1 ] );
            if ( x > 0 && y < size - 1 )        corners.push( matrix[ y + 1 ][ x - 1 ] );
            if ( x > 0 && y > 0 )               corners.push( matrix[ y - 1 ][ x - 1 ] );

            matrix[ y ][ x ].setNeighbors( neighbors );
            matrix[ y ][ x ].setCorners( corners );
        }
    }
};

exports.start = function( x, y ) {

    x = x || 0;
    y = y || 0;

    var next = matrix[ y ][ x ];

    next.updateAvailability( false );

    activeTiles.push( next );
};

exports.render = function() {
    renderActive();
};

function renderActive() {

    var x, y, current;

    for( var i = 0, length = activeTiles.length; i < length; i++ ) {
        current = activeTiles[ i ];

        x = stage.centerX - gridSize * config.size / 2 + current.x * config.size;
        y = stage.centerY - gridSize * config.size / 2 + current.y * config.size;

        context.translate( x, y ); // save

            current.render();

            if ( current.isComplete() ) {
                checkPool.unshift( activeTiles.splice( i, 1 )[ 0 ] );
                i--;
                length--;

                next();
            }

        context.translate( -x, - y ); // restore
    }
}

function next() {

    var probe;
    var tile;

    while ( checkPool.length > 0 ) {

        probe = checkPool[ 0 ];
        tile = probe.getAvailableNeighbor();

        if ( tile && ! tile.isComplete() ) {

            tile.updateAvailability( false );
            activeTiles.push( tile );

            break;

        } else {

            checkPool.shift();

        }
    }
}

},{"./config":1,"./stage":4,"./tile":5}],4:[function(require,module,exports){
var width = 0;
var height = 0;

var centerX = 0;
var centerY = 0;

Object.defineProperty( exports,  "width", {

    set: function( value ) {
        width = value;
        centerX = value / 2;
    },

    get : function() {
        return width;
    }
} );

Object.defineProperty( exports, "height", {

    set: function( value ) {
        height = value;
        centerY = value / 2;
    },

    get : function() {
        return height;
    }
} );

Object.defineProperty( exports,  "centerX", {

    set: function( value ) {
        centerX = value;
        width = value * 2;
    },

    get : function() {
        return centerX;
    }
} );

Object.defineProperty( exports, "centerY", {

    set: function( value ) {
        centerY = value;
        height = value * 2;
    },

    get : function() {
        return centerY;
    }
} );

},{}],5:[function(require,module,exports){
var config = require( "./config" );
var shuffle = require( "mout/array/shuffle" );

exports.generate = function( x, y, context ) {

    var self = {};
    var t = 0;
    var neighbors;
    var cornsers;
    var available = true;

    self.x = x;
    self.y = y;

    self.setNeighbors = function( array ) {
        neighbors = array;
    };

    self.setCorners = function( array ) {
        cornsers = array;
    };

    self.render = function() {
        available = false;

        t += config.speed;
        t = Math.min( t, 1 );

        var size = Math.ceil( config.size * t );
        var half = Math.ceil( config.size * t * 0.5 );

        context.beginPath();
        context.fillStyle = "black";
        context.rect( - half , -half, size, size );
        context.fill();
    };

    self.isComplete = function() {
        return t >= 1;
    };

    self.getAvailableNeighbor = function() {
        var current;

        var shuffled = shuffle( neighbors );

        for ( var i = shuffled.length - 1; i >= 0; i-- ) {
            current = shuffled[ i ];

            if ( current.hasSaveSurrounding( self ) ) {
                return current;
            }
        }

        return null;
    };

    self.hasSaveSurrounding = function( entrence ) {

        var i, current;

        for ( i = neighbors.length - 1; i >= 0; i-- ) {
            current = neighbors[ i ];

            if ( current === entrence ) continue;

            if ( ! current.isAvailable() ) return false;
        }

        for ( i = cornsers.length - 1; i >= 0; i-- ) {
            current = cornsers[ i ];

            if ( current.isAdjacent( entrence ) ) continue;

            if ( ! current.isAvailable() ) return false;
        }

        return true;
    };

    self.isAdjacent = function( tile ) {

        for ( var i = neighbors.length - 1; i >= 0; i-- ) {
            if ( neighbors[ i ] === tile ) return true;
        }

        return false;

    };

    self.updateAvailability = function( value ) {
        available = available && value;
    };

    self.isAvailable = function() {
        return available;
    };

    return self;
};
},{"./config":1,"mout/array/shuffle":6}],6:[function(require,module,exports){
var randInt = require('../random/randInt');

    /**
     * Shuffle array items.
     */
    function shuffle(arr) {
        var results = [],
            rnd;
        if (arr == null) {
            return results;
        }

        var i = -1, len = arr.length, value;
        while (++i < len) {
            if (!i) {
                results[0] = arr[0];
            } else {
                rnd = randInt(0, i);
                results[i] = results[rnd];
                results[rnd] = arr[i];
            }
        }

        return results;
    }

    module.exports = shuffle;


},{"../random/randInt":10}],7:[function(require,module,exports){
/**
 * @constant Maximum 32-bit signed integer value. (2^31 - 1)
 */

    module.exports = 2147483647;


},{}],8:[function(require,module,exports){
/**
 * @constant Minimum 32-bit signed integer value (-2^31).
 */

    module.exports = -2147483648;


},{}],9:[function(require,module,exports){
var random = require('./random');
var MIN_INT = require('../number/MIN_INT');
var MAX_INT = require('../number/MAX_INT');

    /**
     * Returns random number inside range
     */
    function rand(min, max){
        min = min == null? MIN_INT : min;
        max = max == null? MAX_INT : max;
        return min + (max - min) * random();
    }

    module.exports = rand;


},{"../number/MAX_INT":7,"../number/MIN_INT":8,"./random":11}],10:[function(require,module,exports){
var MIN_INT = require('../number/MIN_INT');
var MAX_INT = require('../number/MAX_INT');
var rand = require('./rand');

    /**
     * Gets random integer inside range or snap to min/max values.
     */
    function randInt(min, max){
        min = min == null? MIN_INT : ~~min;
        max = max == null? MAX_INT : ~~max;
        // can't be max + 0.5 otherwise it will round up if `rand`
        // returns `max` causing it to overflow range.
        // -0.5 and + 0.49 are required to avoid bias caused by rounding
        return Math.round( rand(min - 0.5, max + 0.499999999999) );
    }

    module.exports = randInt;


},{"../number/MAX_INT":7,"../number/MIN_INT":8,"./rand":9}],11:[function(require,module,exports){


    /**
     * Just a wrapper to Math.random. No methods inside mout/random should call
     * Math.random() directly so we can inject the pseudo-random number
     * generator if needed (ie. in case we need a seeded random or a better
     * algorithm than the native one)
     */
    function random(){
        return random.get();
    }

    // we expose the method so it can be swapped if needed
    random.get = Math.random;

    module.exports = random;



},{}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hZG1pbi9Qcm9qZWN0cy9wYXRoLWNyZWF0aW9uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9hZG1pbi9Qcm9qZWN0cy9wYXRoLWNyZWF0aW9uL2phdmFzY3JpcHRzL2NvbmZpZy5qcyIsIi9Vc2Vycy9hZG1pbi9Qcm9qZWN0cy9wYXRoLWNyZWF0aW9uL2phdmFzY3JpcHRzL2Zha2VfZDI2ODRkMTYuanMiLCIvVXNlcnMvYWRtaW4vUHJvamVjdHMvcGF0aC1jcmVhdGlvbi9qYXZhc2NyaXB0cy9ncmlkLmpzIiwiL1VzZXJzL2FkbWluL1Byb2plY3RzL3BhdGgtY3JlYXRpb24vamF2YXNjcmlwdHMvc3RhZ2UuanMiLCIvVXNlcnMvYWRtaW4vUHJvamVjdHMvcGF0aC1jcmVhdGlvbi9qYXZhc2NyaXB0cy90aWxlLmpzIiwiL1VzZXJzL2FkbWluL1Byb2plY3RzL3BhdGgtY3JlYXRpb24vbm9kZV9tb2R1bGVzL21vdXQvYXJyYXkvc2h1ZmZsZS5qcyIsIi9Vc2Vycy9hZG1pbi9Qcm9qZWN0cy9wYXRoLWNyZWF0aW9uL25vZGVfbW9kdWxlcy9tb3V0L251bWJlci9NQVhfSU5ULmpzIiwiL1VzZXJzL2FkbWluL1Byb2plY3RzL3BhdGgtY3JlYXRpb24vbm9kZV9tb2R1bGVzL21vdXQvbnVtYmVyL01JTl9JTlQuanMiLCIvVXNlcnMvYWRtaW4vUHJvamVjdHMvcGF0aC1jcmVhdGlvbi9ub2RlX21vZHVsZXMvbW91dC9yYW5kb20vcmFuZC5qcyIsIi9Vc2Vycy9hZG1pbi9Qcm9qZWN0cy9wYXRoLWNyZWF0aW9uL25vZGVfbW9kdWxlcy9tb3V0L3JhbmRvbS9yYW5kSW50LmpzIiwiL1VzZXJzL2FkbWluL1Byb2plY3RzL3BhdGgtY3JlYXRpb24vbm9kZV9tb2R1bGVzL21vdXQvcmFuZG9tL3JhbmRvbS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2l6ZTogMTAsXG4gICAgc3BlZWQ6IDAuMVxufTsiLCJ2YXIgZ3JpZCA9IHJlcXVpcmUoIFwiLi9ncmlkXCIgKTtcclxudmFyIHN0YWdlID0gcmVxdWlyZSggXCIuL3N0YWdlXCIgKTtcclxuXHJcbnZhciBjYW52YXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCBcIiNjYW52YXNcIiApO1xyXG52YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCBcIjJkXCIgKTtcclxuXHJcbmZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICBvblJlc2l6ZSgpO1xyXG4gICAgY2xlYXIoKTtcclxuXHJcbiAgICBncmlkLnNldENvbnRleHQoIGNvbnRleHQgKTtcclxuICAgIGdyaWQuZ2VuZXJhdGUoIDIwICk7XHJcbiAgICBncmlkLnN0YXJ0KCk7XHJcblxyXG4gICAgcmVuZGVyKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlcigpIHtcclxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSggcmVuZGVyICk7XHJcblxyXG4gICAgZ3JpZC5yZW5kZXIoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2xlYXIoKSB7XHJcbiAgICBjb250ZXh0LmNsZWFyUmVjdCggMCwgMCwgc3RhZ2Uud2lkdGgsIHN0YWdlLmhlaWdodCApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvblJlc2l6ZSgpIHtcclxuICAgIGNhbnZhcy53aWR0aCA9IHN0YWdlLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gc3RhZ2UuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xyXG59XHJcblxyXG5pbml0KCk7IiwidmFyIHRpbGUgPSByZXF1aXJlKCBcIi4vdGlsZVwiICk7XHJcbnZhciBzdGFnZSA9IHJlcXVpcmUoIFwiLi9zdGFnZVwiICk7XHJcbnZhciBjb25maWcgPSByZXF1aXJlKCBcIi4vY29uZmlnXCIgKTtcclxuXHJcbnZhciBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcclxudmFyIG1hdHJpeDtcclxudmFyIGFjdGl2ZVRpbGVzO1xyXG52YXIgY29udGV4dDtcclxudmFyIGdyaWRTaXplID0gMDtcclxudmFyIGNoZWNrUG9vbCA9IHdpbmRvdy5jaGVja1Bvb2wgPSBbXTtcclxuXHJcbmV4cG9ydHMuc2V0Q29udGV4dCA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcclxuICAgIGNvbnRleHQgPSB2YWx1ZTtcclxufTtcclxuXHJcbmV4cG9ydHMuZ2VuZXJhdGUgPSBmdW5jdGlvbiggc2l6ZSApIHtcclxuICAgIGdyaWRTaXplID0gc2l6ZTtcclxuXHJcbiAgICBtYXRyaXggPSBbXTtcclxuICAgIGFjdGl2ZVRpbGVzID0gW107XHJcblxyXG4gICAgdmFyIHgsIHk7XHJcblxyXG4gICAgZm9yICggeSA9IDA7IHkgPCBzaXplOyB5KysgKSB7XHJcbiAgICAgICAgbWF0cml4LnB1c2goIFtdICk7XHJcblxyXG4gICAgICAgIGZvciAoIHggPSAwOyB4IDwgc2l6ZTsgeCsrICkge1xyXG4gICAgICAgICAgICBtYXRyaXhbIHkgXS5wdXNoKCB0aWxlLmdlbmVyYXRlKCB4LCB5LCBjb250ZXh0ICkgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICggeSA9IDA7IHkgPCBzaXplOyB5KysgKSB7XHJcbiAgICAgICAgZm9yICggeCA9IDA7IHggPCBzaXplOyB4KysgKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgbmVpZ2hib3JzID0gW107XHJcbiAgICAgICAgICAgIHZhciBjb3JuZXJzID0gW107XHJcblxyXG4gICAgICAgICAgICBpZiAoIHkgPiAwICkgICAgICAgIG5laWdoYm9ycy5wdXNoKCBtYXRyaXhbIHkgLSAxIF1bIHggXSApO1xyXG4gICAgICAgICAgICBpZiAoIHkgPCBzaXplIC0gMSApIG5laWdoYm9ycy5wdXNoKCBtYXRyaXhbIHkgKyAxIF1bIHggXSApO1xyXG4gICAgICAgICAgICBpZiAoIHggPiAwICkgICAgICAgIG5laWdoYm9ycy5wdXNoKCBtYXRyaXhbIHkgXVsgeCAtIDEgXSApO1xyXG4gICAgICAgICAgICBpZiAoIHggPCBzaXplIC0gMSApIG5laWdoYm9ycy5wdXNoKCBtYXRyaXhbIHkgXVsgeCArIDEgXSApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB4IDwgc2l6ZSAtIDEgJiYgeSA+IDAgKSAgICAgICAgY29ybmVycy5wdXNoKCBtYXRyaXhbIHkgLSAxIF1bIHggKyAxIF0gKTtcclxuICAgICAgICAgICAgaWYgKCB4IDwgc2l6ZSAtIDEgJiYgeSA8IHNpemUgLSAxICkgY29ybmVycy5wdXNoKCBtYXRyaXhbIHkgKyAxIF1bIHggKyAxIF0gKTtcclxuICAgICAgICAgICAgaWYgKCB4ID4gMCAmJiB5IDwgc2l6ZSAtIDEgKSAgICAgICAgY29ybmVycy5wdXNoKCBtYXRyaXhbIHkgKyAxIF1bIHggLSAxIF0gKTtcclxuICAgICAgICAgICAgaWYgKCB4ID4gMCAmJiB5ID4gMCApICAgICAgICAgICAgICAgY29ybmVycy5wdXNoKCBtYXRyaXhbIHkgLSAxIF1bIHggLSAxIF0gKTtcclxuXHJcbiAgICAgICAgICAgIG1hdHJpeFsgeSBdWyB4IF0uc2V0TmVpZ2hib3JzKCBuZWlnaGJvcnMgKTtcclxuICAgICAgICAgICAgbWF0cml4WyB5IF1bIHggXS5zZXRDb3JuZXJzKCBjb3JuZXJzICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0cy5zdGFydCA9IGZ1bmN0aW9uKCB4LCB5ICkge1xyXG5cclxuICAgIHggPSB4IHx8IDA7XHJcbiAgICB5ID0geSB8fCAwO1xyXG5cclxuICAgIHZhciBuZXh0ID0gbWF0cml4WyB5IF1bIHggXTtcclxuXHJcbiAgICBuZXh0LnVwZGF0ZUF2YWlsYWJpbGl0eSggZmFsc2UgKTtcclxuXHJcbiAgICBhY3RpdmVUaWxlcy5wdXNoKCBuZXh0ICk7XHJcbn07XHJcblxyXG5leHBvcnRzLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyQWN0aXZlKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiByZW5kZXJBY3RpdmUoKSB7XHJcblxyXG4gICAgdmFyIHgsIHksIGN1cnJlbnQ7XHJcblxyXG4gICAgZm9yKCB2YXIgaSA9IDAsIGxlbmd0aCA9IGFjdGl2ZVRpbGVzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGN1cnJlbnQgPSBhY3RpdmVUaWxlc1sgaSBdO1xyXG5cclxuICAgICAgICB4ID0gc3RhZ2UuY2VudGVyWCAtIGdyaWRTaXplICogY29uZmlnLnNpemUgLyAyICsgY3VycmVudC54ICogY29uZmlnLnNpemU7XHJcbiAgICAgICAgeSA9IHN0YWdlLmNlbnRlclkgLSBncmlkU2l6ZSAqIGNvbmZpZy5zaXplIC8gMiArIGN1cnJlbnQueSAqIGNvbmZpZy5zaXplO1xyXG5cclxuICAgICAgICBjb250ZXh0LnRyYW5zbGF0ZSggeCwgeSApOyAvLyBzYXZlXHJcblxyXG4gICAgICAgICAgICBjdXJyZW50LnJlbmRlcigpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBjdXJyZW50LmlzQ29tcGxldGUoKSApIHtcclxuICAgICAgICAgICAgICAgIGNoZWNrUG9vbC51bnNoaWZ0KCBhY3RpdmVUaWxlcy5zcGxpY2UoIGksIDEgKVsgMCBdICk7XHJcbiAgICAgICAgICAgICAgICBpLS07XHJcbiAgICAgICAgICAgICAgICBsZW5ndGgtLTtcclxuXHJcbiAgICAgICAgICAgICAgICBuZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgY29udGV4dC50cmFuc2xhdGUoIC14LCAtIHkgKTsgLy8gcmVzdG9yZVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBuZXh0KCkge1xyXG5cclxuICAgIHZhciBwcm9iZTtcclxuICAgIHZhciB0aWxlO1xyXG5cclxuICAgIHdoaWxlICggY2hlY2tQb29sLmxlbmd0aCA+IDAgKSB7XHJcblxyXG4gICAgICAgIHByb2JlID0gY2hlY2tQb29sWyAwIF07XHJcbiAgICAgICAgdGlsZSA9IHByb2JlLmdldEF2YWlsYWJsZU5laWdoYm9yKCk7XHJcblxyXG4gICAgICAgIGlmICggdGlsZSAmJiAhIHRpbGUuaXNDb21wbGV0ZSgpICkge1xyXG5cclxuICAgICAgICAgICAgdGlsZS51cGRhdGVBdmFpbGFiaWxpdHkoIGZhbHNlICk7XHJcbiAgICAgICAgICAgIGFjdGl2ZVRpbGVzLnB1c2goIHRpbGUgKTtcclxuXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgY2hlY2tQb29sLnNoaWZ0KCk7XHJcblxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCJ2YXIgd2lkdGggPSAwO1xudmFyIGhlaWdodCA9IDA7XG5cbnZhciBjZW50ZXJYID0gMDtcbnZhciBjZW50ZXJZID0gMDtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBleHBvcnRzLCAgXCJ3aWR0aFwiLCB7XG5cbiAgICBzZXQ6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgd2lkdGggPSB2YWx1ZTtcbiAgICAgICAgY2VudGVyWCA9IHZhbHVlIC8gMjtcbiAgICB9LFxuXG4gICAgZ2V0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3aWR0aDtcbiAgICB9XG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggZXhwb3J0cywgXCJoZWlnaHRcIiwge1xuXG4gICAgc2V0OiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIGhlaWdodCA9IHZhbHVlO1xuICAgICAgICBjZW50ZXJZID0gdmFsdWUgLyAyO1xuICAgIH0sXG5cbiAgICBnZXQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGhlaWdodDtcbiAgICB9XG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggZXhwb3J0cywgIFwiY2VudGVyWFwiLCB7XG5cbiAgICBzZXQ6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgY2VudGVyWCA9IHZhbHVlO1xuICAgICAgICB3aWR0aCA9IHZhbHVlICogMjtcbiAgICB9LFxuXG4gICAgZ2V0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBjZW50ZXJYO1xuICAgIH1cbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBleHBvcnRzLCBcImNlbnRlcllcIiwge1xuXG4gICAgc2V0OiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIGNlbnRlclkgPSB2YWx1ZTtcbiAgICAgICAgaGVpZ2h0ID0gdmFsdWUgKiAyO1xuICAgIH0sXG5cbiAgICBnZXQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGNlbnRlclk7XG4gICAgfVxufSApO1xuIiwidmFyIGNvbmZpZyA9IHJlcXVpcmUoIFwiLi9jb25maWdcIiApO1xyXG52YXIgc2h1ZmZsZSA9IHJlcXVpcmUoIFwibW91dC9hcnJheS9zaHVmZmxlXCIgKTtcclxuXHJcbmV4cG9ydHMuZ2VuZXJhdGUgPSBmdW5jdGlvbiggeCwgeSwgY29udGV4dCApIHtcclxuXHJcbiAgICB2YXIgc2VsZiA9IHt9O1xyXG4gICAgdmFyIHQgPSAwO1xyXG4gICAgdmFyIG5laWdoYm9ycztcclxuICAgIHZhciBjb3Juc2VycztcclxuICAgIHZhciBhdmFpbGFibGUgPSB0cnVlO1xyXG5cclxuICAgIHNlbGYueCA9IHg7XHJcbiAgICBzZWxmLnkgPSB5O1xyXG5cclxuICAgIHNlbGYuc2V0TmVpZ2hib3JzID0gZnVuY3Rpb24oIGFycmF5ICkge1xyXG4gICAgICAgIG5laWdoYm9ycyA9IGFycmF5O1xyXG4gICAgfTtcclxuXHJcbiAgICBzZWxmLnNldENvcm5lcnMgPSBmdW5jdGlvbiggYXJyYXkgKSB7XHJcbiAgICAgICAgY29ybnNlcnMgPSBhcnJheTtcclxuICAgIH07XHJcblxyXG4gICAgc2VsZi5yZW5kZXIgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBhdmFpbGFibGUgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgdCArPSBjb25maWcuc3BlZWQ7XHJcbiAgICAgICAgdCA9IE1hdGgubWluKCB0LCAxICk7XHJcblxyXG4gICAgICAgIHZhciBzaXplID0gTWF0aC5jZWlsKCBjb25maWcuc2l6ZSAqIHQgKTtcclxuICAgICAgICB2YXIgaGFsZiA9IE1hdGguY2VpbCggY29uZmlnLnNpemUgKiB0ICogMC41ICk7XHJcblxyXG4gICAgICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBcImJsYWNrXCI7XHJcbiAgICAgICAgY29udGV4dC5yZWN0KCAtIGhhbGYgLCAtaGFsZiwgc2l6ZSwgc2l6ZSApO1xyXG4gICAgICAgIGNvbnRleHQuZmlsbCgpO1xyXG4gICAgfTtcclxuXHJcbiAgICBzZWxmLmlzQ29tcGxldGUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdCA+PSAxO1xyXG4gICAgfTtcclxuXHJcbiAgICBzZWxmLmdldEF2YWlsYWJsZU5laWdoYm9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGN1cnJlbnQ7XHJcblxyXG4gICAgICAgIHZhciBzaHVmZmxlZCA9IHNodWZmbGUoIG5laWdoYm9ycyApO1xyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IHNodWZmbGVkLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICkge1xyXG4gICAgICAgICAgICBjdXJyZW50ID0gc2h1ZmZsZWRbIGkgXTtcclxuXHJcbiAgICAgICAgICAgIGlmICggY3VycmVudC5oYXNTYXZlU3Vycm91bmRpbmcoIHNlbGYgKSApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH07XHJcblxyXG4gICAgc2VsZi5oYXNTYXZlU3Vycm91bmRpbmcgPSBmdW5jdGlvbiggZW50cmVuY2UgKSB7XHJcblxyXG4gICAgICAgIHZhciBpLCBjdXJyZW50O1xyXG5cclxuICAgICAgICBmb3IgKCBpID0gbmVpZ2hib3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICkge1xyXG4gICAgICAgICAgICBjdXJyZW50ID0gbmVpZ2hib3JzWyBpIF07XHJcblxyXG4gICAgICAgICAgICBpZiAoIGN1cnJlbnQgPT09IGVudHJlbmNlICkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICBpZiAoICEgY3VycmVudC5pc0F2YWlsYWJsZSgpICkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yICggaSA9IGNvcm5zZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICkge1xyXG4gICAgICAgICAgICBjdXJyZW50ID0gY29ybnNlcnNbIGkgXTtcclxuXHJcbiAgICAgICAgICAgIGlmICggY3VycmVudC5pc0FkamFjZW50KCBlbnRyZW5jZSApICkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICBpZiAoICEgY3VycmVudC5pc0F2YWlsYWJsZSgpICkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9O1xyXG5cclxuICAgIHNlbGYuaXNBZGphY2VudCA9IGZ1bmN0aW9uKCB0aWxlICkge1xyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IG5laWdoYm9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSApIHtcclxuICAgICAgICAgICAgaWYgKCBuZWlnaGJvcnNbIGkgXSA9PT0gdGlsZSApIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgc2VsZi51cGRhdGVBdmFpbGFiaWxpdHkgPSBmdW5jdGlvbiggdmFsdWUgKSB7XHJcbiAgICAgICAgYXZhaWxhYmxlID0gYXZhaWxhYmxlICYmIHZhbHVlO1xyXG4gICAgfTtcclxuXHJcbiAgICBzZWxmLmlzQXZhaWxhYmxlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIGF2YWlsYWJsZTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHNlbGY7XHJcbn07IiwidmFyIHJhbmRJbnQgPSByZXF1aXJlKCcuLi9yYW5kb20vcmFuZEludCcpO1xuXG4gICAgLyoqXG4gICAgICogU2h1ZmZsZSBhcnJheSBpdGVtcy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzaHVmZmxlKGFycikge1xuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdLFxuICAgICAgICAgICAgcm5kO1xuICAgICAgICBpZiAoYXJyID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGkgPSAtMSwgbGVuID0gYXJyLmxlbmd0aCwgdmFsdWU7XG4gICAgICAgIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICAgICAgICAgIGlmICghaSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbMF0gPSBhcnJbMF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJuZCA9IHJhbmRJbnQoMCwgaSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0c1tpXSA9IHJlc3VsdHNbcm5kXTtcbiAgICAgICAgICAgICAgICByZXN1bHRzW3JuZF0gPSBhcnJbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHNodWZmbGU7XG5cbiIsIi8qKlxuICogQGNvbnN0YW50IE1heGltdW0gMzItYml0IHNpZ25lZCBpbnRlZ2VyIHZhbHVlLiAoMl4zMSAtIDEpXG4gKi9cblxuICAgIG1vZHVsZS5leHBvcnRzID0gMjE0NzQ4MzY0NztcblxuIiwiLyoqXG4gKiBAY29uc3RhbnQgTWluaW11bSAzMi1iaXQgc2lnbmVkIGludGVnZXIgdmFsdWUgKC0yXjMxKS5cbiAqL1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSAtMjE0NzQ4MzY0ODtcblxuIiwidmFyIHJhbmRvbSA9IHJlcXVpcmUoJy4vcmFuZG9tJyk7XG52YXIgTUlOX0lOVCA9IHJlcXVpcmUoJy4uL251bWJlci9NSU5fSU5UJyk7XG52YXIgTUFYX0lOVCA9IHJlcXVpcmUoJy4uL251bWJlci9NQVhfSU5UJyk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHJhbmRvbSBudW1iZXIgaW5zaWRlIHJhbmdlXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmFuZChtaW4sIG1heCl7XG4gICAgICAgIG1pbiA9IG1pbiA9PSBudWxsPyBNSU5fSU5UIDogbWluO1xuICAgICAgICBtYXggPSBtYXggPT0gbnVsbD8gTUFYX0lOVCA6IG1heDtcbiAgICAgICAgcmV0dXJuIG1pbiArIChtYXggLSBtaW4pICogcmFuZG9tKCk7XG4gICAgfVxuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSByYW5kO1xuXG4iLCJ2YXIgTUlOX0lOVCA9IHJlcXVpcmUoJy4uL251bWJlci9NSU5fSU5UJyk7XG52YXIgTUFYX0lOVCA9IHJlcXVpcmUoJy4uL251bWJlci9NQVhfSU5UJyk7XG52YXIgcmFuZCA9IHJlcXVpcmUoJy4vcmFuZCcpO1xuXG4gICAgLyoqXG4gICAgICogR2V0cyByYW5kb20gaW50ZWdlciBpbnNpZGUgcmFuZ2Ugb3Igc25hcCB0byBtaW4vbWF4IHZhbHVlcy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiByYW5kSW50KG1pbiwgbWF4KXtcbiAgICAgICAgbWluID0gbWluID09IG51bGw/IE1JTl9JTlQgOiB+fm1pbjtcbiAgICAgICAgbWF4ID0gbWF4ID09IG51bGw/IE1BWF9JTlQgOiB+fm1heDtcbiAgICAgICAgLy8gY2FuJ3QgYmUgbWF4ICsgMC41IG90aGVyd2lzZSBpdCB3aWxsIHJvdW5kIHVwIGlmIGByYW5kYFxuICAgICAgICAvLyByZXR1cm5zIGBtYXhgIGNhdXNpbmcgaXQgdG8gb3ZlcmZsb3cgcmFuZ2UuXG4gICAgICAgIC8vIC0wLjUgYW5kICsgMC40OSBhcmUgcmVxdWlyZWQgdG8gYXZvaWQgYmlhcyBjYXVzZWQgYnkgcm91bmRpbmdcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoIHJhbmQobWluIC0gMC41LCBtYXggKyAwLjQ5OTk5OTk5OTk5OSkgKTtcbiAgICB9XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHJhbmRJbnQ7XG5cbiIsIlxuXG4gICAgLyoqXG4gICAgICogSnVzdCBhIHdyYXBwZXIgdG8gTWF0aC5yYW5kb20uIE5vIG1ldGhvZHMgaW5zaWRlIG1vdXQvcmFuZG9tIHNob3VsZCBjYWxsXG4gICAgICogTWF0aC5yYW5kb20oKSBkaXJlY3RseSBzbyB3ZSBjYW4gaW5qZWN0IHRoZSBwc2V1ZG8tcmFuZG9tIG51bWJlclxuICAgICAqIGdlbmVyYXRvciBpZiBuZWVkZWQgKGllLiBpbiBjYXNlIHdlIG5lZWQgYSBzZWVkZWQgcmFuZG9tIG9yIGEgYmV0dGVyXG4gICAgICogYWxnb3JpdGhtIHRoYW4gdGhlIG5hdGl2ZSBvbmUpXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmFuZG9tKCl7XG4gICAgICAgIHJldHVybiByYW5kb20uZ2V0KCk7XG4gICAgfVxuXG4gICAgLy8gd2UgZXhwb3NlIHRoZSBtZXRob2Qgc28gaXQgY2FuIGJlIHN3YXBwZWQgaWYgbmVlZGVkXG4gICAgcmFuZG9tLmdldCA9IE1hdGgucmFuZG9tO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSByYW5kb207XG5cblxuIl19
