(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
    size: 20,
    speed: 0.1,
    gridsize: 30
};
},{}],2:[function(require,module,exports){
var grid = require( "./grid" );
var stage = require( "./stage" );
var config = require( "./config" );

var canvas = document.querySelector( "#canvas" );
var context = canvas.getContext( "2d" );

function init() {
    onResize();
    clear();

    grid.setContext( context );
    grid.generate( config.gridsize );

    var center = Math.floor( config.gridsize / 2 );

    grid.start( center, center );

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
},{"./config":1,"./grid":3,"./stage":4}],3:[function(require,module,exports){
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
        neighbors = shuffle( array );
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

        for ( var i = neighbors.length - 1; i >= 0; i-- ) {
            current = neighbors[ i ];

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hZG1pbi9Qcm9qZWN0cy9wYXRoLWNyZWF0aW9uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9hZG1pbi9Qcm9qZWN0cy9wYXRoLWNyZWF0aW9uL2phdmFzY3JpcHRzL2NvbmZpZy5qcyIsIi9Vc2Vycy9hZG1pbi9Qcm9qZWN0cy9wYXRoLWNyZWF0aW9uL2phdmFzY3JpcHRzL2Zha2VfYzgzYjA5YjcuanMiLCIvVXNlcnMvYWRtaW4vUHJvamVjdHMvcGF0aC1jcmVhdGlvbi9qYXZhc2NyaXB0cy9ncmlkLmpzIiwiL1VzZXJzL2FkbWluL1Byb2plY3RzL3BhdGgtY3JlYXRpb24vamF2YXNjcmlwdHMvc3RhZ2UuanMiLCIvVXNlcnMvYWRtaW4vUHJvamVjdHMvcGF0aC1jcmVhdGlvbi9qYXZhc2NyaXB0cy90aWxlLmpzIiwiL1VzZXJzL2FkbWluL1Byb2plY3RzL3BhdGgtY3JlYXRpb24vbm9kZV9tb2R1bGVzL21vdXQvYXJyYXkvc2h1ZmZsZS5qcyIsIi9Vc2Vycy9hZG1pbi9Qcm9qZWN0cy9wYXRoLWNyZWF0aW9uL25vZGVfbW9kdWxlcy9tb3V0L251bWJlci9NQVhfSU5ULmpzIiwiL1VzZXJzL2FkbWluL1Byb2plY3RzL3BhdGgtY3JlYXRpb24vbm9kZV9tb2R1bGVzL21vdXQvbnVtYmVyL01JTl9JTlQuanMiLCIvVXNlcnMvYWRtaW4vUHJvamVjdHMvcGF0aC1jcmVhdGlvbi9ub2RlX21vZHVsZXMvbW91dC9yYW5kb20vcmFuZC5qcyIsIi9Vc2Vycy9hZG1pbi9Qcm9qZWN0cy9wYXRoLWNyZWF0aW9uL25vZGVfbW9kdWxlcy9tb3V0L3JhbmRvbS9yYW5kSW50LmpzIiwiL1VzZXJzL2FkbWluL1Byb2plY3RzL3BhdGgtY3JlYXRpb24vbm9kZV9tb2R1bGVzL21vdXQvcmFuZG9tL3JhbmRvbS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2l6ZTogMjAsXG4gICAgc3BlZWQ6IDAuMSxcbiAgICBncmlkc2l6ZTogMzBcbn07IiwidmFyIGdyaWQgPSByZXF1aXJlKCBcIi4vZ3JpZFwiICk7XHJcbnZhciBzdGFnZSA9IHJlcXVpcmUoIFwiLi9zdGFnZVwiICk7XHJcbnZhciBjb25maWcgPSByZXF1aXJlKCBcIi4vY29uZmlnXCIgKTtcclxuXHJcbnZhciBjYW52YXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCBcIiNjYW52YXNcIiApO1xyXG52YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCBcIjJkXCIgKTtcclxuXHJcbmZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICBvblJlc2l6ZSgpO1xyXG4gICAgY2xlYXIoKTtcclxuXHJcbiAgICBncmlkLnNldENvbnRleHQoIGNvbnRleHQgKTtcclxuICAgIGdyaWQuZ2VuZXJhdGUoIGNvbmZpZy5ncmlkc2l6ZSApO1xyXG5cclxuICAgIHZhciBjZW50ZXIgPSBNYXRoLmZsb29yKCBjb25maWcuZ3JpZHNpemUgLyAyICk7XHJcblxyXG4gICAgZ3JpZC5zdGFydCggY2VudGVyLCBjZW50ZXIgKTtcclxuXHJcbiAgICByZW5kZXIoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyKCkge1xyXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCByZW5kZXIgKTtcclxuXHJcbiAgICBncmlkLnJlbmRlcigpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjbGVhcigpIHtcclxuICAgIGNvbnRleHQuY2xlYXJSZWN0KCAwLCAwLCBzdGFnZS53aWR0aCwgc3RhZ2UuaGVpZ2h0ICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uUmVzaXplKCkge1xyXG4gICAgY2FudmFzLndpZHRoID0gc3RhZ2Uud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgIGNhbnZhcy5oZWlnaHQgPSBzdGFnZS5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbn1cclxuXHJcbmluaXQoKTsiLCJ2YXIgdGlsZSA9IHJlcXVpcmUoIFwiLi90aWxlXCIgKTtcclxudmFyIHN0YWdlID0gcmVxdWlyZSggXCIuL3N0YWdlXCIgKTtcclxudmFyIGNvbmZpZyA9IHJlcXVpcmUoIFwiLi9jb25maWdcIiApO1xyXG5cclxudmFyIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xyXG52YXIgbWF0cml4O1xyXG52YXIgYWN0aXZlVGlsZXM7XHJcbnZhciBjb250ZXh0O1xyXG52YXIgZ3JpZFNpemUgPSAwO1xyXG52YXIgY2hlY2tQb29sID0gd2luZG93LmNoZWNrUG9vbCA9IFtdO1xyXG5cclxuZXhwb3J0cy5zZXRDb250ZXh0ID0gZnVuY3Rpb24oIHZhbHVlICkge1xyXG4gICAgY29udGV4dCA9IHZhbHVlO1xyXG59O1xyXG5cclxuZXhwb3J0cy5nZW5lcmF0ZSA9IGZ1bmN0aW9uKCBzaXplICkge1xyXG4gICAgZ3JpZFNpemUgPSBzaXplO1xyXG5cclxuICAgIG1hdHJpeCA9IFtdO1xyXG4gICAgYWN0aXZlVGlsZXMgPSBbXTtcclxuXHJcbiAgICB2YXIgeCwgeTtcclxuXHJcbiAgICBmb3IgKCB5ID0gMDsgeSA8IHNpemU7IHkrKyApIHtcclxuICAgICAgICBtYXRyaXgucHVzaCggW10gKTtcclxuXHJcbiAgICAgICAgZm9yICggeCA9IDA7IHggPCBzaXplOyB4KysgKSB7XHJcbiAgICAgICAgICAgIG1hdHJpeFsgeSBdLnB1c2goIHRpbGUuZ2VuZXJhdGUoIHgsIHksIGNvbnRleHQgKSApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3IgKCB5ID0gMDsgeSA8IHNpemU7IHkrKyApIHtcclxuICAgICAgICBmb3IgKCB4ID0gMDsgeCA8IHNpemU7IHgrKyApIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBuZWlnaGJvcnMgPSBbXTtcclxuICAgICAgICAgICAgdmFyIGNvcm5lcnMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIGlmICggeSA+IDAgKSAgICAgICAgbmVpZ2hib3JzLnB1c2goIG1hdHJpeFsgeSAtIDEgXVsgeCBdICk7XHJcbiAgICAgICAgICAgIGlmICggeSA8IHNpemUgLSAxICkgbmVpZ2hib3JzLnB1c2goIG1hdHJpeFsgeSArIDEgXVsgeCBdICk7XHJcbiAgICAgICAgICAgIGlmICggeCA+IDAgKSAgICAgICAgbmVpZ2hib3JzLnB1c2goIG1hdHJpeFsgeSBdWyB4IC0gMSBdICk7XHJcbiAgICAgICAgICAgIGlmICggeCA8IHNpemUgLSAxICkgbmVpZ2hib3JzLnB1c2goIG1hdHJpeFsgeSBdWyB4ICsgMSBdICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHggPCBzaXplIC0gMSAmJiB5ID4gMCApICAgICAgICBjb3JuZXJzLnB1c2goIG1hdHJpeFsgeSAtIDEgXVsgeCArIDEgXSApO1xyXG4gICAgICAgICAgICBpZiAoIHggPCBzaXplIC0gMSAmJiB5IDwgc2l6ZSAtIDEgKSBjb3JuZXJzLnB1c2goIG1hdHJpeFsgeSArIDEgXVsgeCArIDEgXSApO1xyXG4gICAgICAgICAgICBpZiAoIHggPiAwICYmIHkgPCBzaXplIC0gMSApICAgICAgICBjb3JuZXJzLnB1c2goIG1hdHJpeFsgeSArIDEgXVsgeCAtIDEgXSApO1xyXG4gICAgICAgICAgICBpZiAoIHggPiAwICYmIHkgPiAwICkgICAgICAgICAgICAgICBjb3JuZXJzLnB1c2goIG1hdHJpeFsgeSAtIDEgXVsgeCAtIDEgXSApO1xyXG5cclxuICAgICAgICAgICAgbWF0cml4WyB5IF1bIHggXS5zZXROZWlnaGJvcnMoIG5laWdoYm9ycyApO1xyXG4gICAgICAgICAgICBtYXRyaXhbIHkgXVsgeCBdLnNldENvcm5lcnMoIGNvcm5lcnMgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnRzLnN0YXJ0ID0gZnVuY3Rpb24oIHgsIHkgKSB7XHJcblxyXG4gICAgeCA9IHggfHwgMDtcclxuICAgIHkgPSB5IHx8IDA7XHJcblxyXG4gICAgdmFyIG5leHQgPSBtYXRyaXhbIHkgXVsgeCBdO1xyXG5cclxuICAgIG5leHQudXBkYXRlQXZhaWxhYmlsaXR5KCBmYWxzZSApO1xyXG5cclxuICAgIGFjdGl2ZVRpbGVzLnB1c2goIG5leHQgKTtcclxufTtcclxuXHJcbmV4cG9ydHMucmVuZGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXJBY3RpdmUoKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIHJlbmRlckFjdGl2ZSgpIHtcclxuXHJcbiAgICB2YXIgeCwgeSwgY3VycmVudDtcclxuXHJcbiAgICBmb3IoIHZhciBpID0gMCwgbGVuZ3RoID0gYWN0aXZlVGlsZXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgY3VycmVudCA9IGFjdGl2ZVRpbGVzWyBpIF07XHJcblxyXG4gICAgICAgIHggPSBzdGFnZS5jZW50ZXJYIC0gZ3JpZFNpemUgKiBjb25maWcuc2l6ZSAvIDIgKyBjdXJyZW50LnggKiBjb25maWcuc2l6ZTtcclxuICAgICAgICB5ID0gc3RhZ2UuY2VudGVyWSAtIGdyaWRTaXplICogY29uZmlnLnNpemUgLyAyICsgY3VycmVudC55ICogY29uZmlnLnNpemU7XHJcblxyXG4gICAgICAgIGNvbnRleHQudHJhbnNsYXRlKCB4LCB5ICk7IC8vIHNhdmVcclxuXHJcbiAgICAgICAgICAgIGN1cnJlbnQucmVuZGVyKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGN1cnJlbnQuaXNDb21wbGV0ZSgpICkge1xyXG4gICAgICAgICAgICAgICAgY2hlY2tQb29sLnVuc2hpZnQoIGFjdGl2ZVRpbGVzLnNwbGljZSggaSwgMSApWyAwIF0gKTtcclxuICAgICAgICAgICAgICAgIGktLTtcclxuICAgICAgICAgICAgICAgIGxlbmd0aC0tO1xyXG5cclxuICAgICAgICAgICAgICAgIG5leHQoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICBjb250ZXh0LnRyYW5zbGF0ZSggLXgsIC0geSApOyAvLyByZXN0b3JlXHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5leHQoKSB7XHJcblxyXG4gICAgdmFyIHByb2JlO1xyXG4gICAgdmFyIHRpbGU7XHJcblxyXG4gICAgd2hpbGUgKCBjaGVja1Bvb2wubGVuZ3RoID4gMCApIHtcclxuXHJcbiAgICAgICAgcHJvYmUgPSBjaGVja1Bvb2xbIDAgXTtcclxuICAgICAgICB0aWxlID0gcHJvYmUuZ2V0QXZhaWxhYmxlTmVpZ2hib3IoKTtcclxuXHJcbiAgICAgICAgaWYgKCB0aWxlICYmICEgdGlsZS5pc0NvbXBsZXRlKCkgKSB7XHJcblxyXG4gICAgICAgICAgICB0aWxlLnVwZGF0ZUF2YWlsYWJpbGl0eSggZmFsc2UgKTtcclxuICAgICAgICAgICAgYWN0aXZlVGlsZXMucHVzaCggdGlsZSApO1xyXG5cclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICBjaGVja1Bvb2wuc2hpZnQoKTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiIsInZhciB3aWR0aCA9IDA7XG52YXIgaGVpZ2h0ID0gMDtcblxudmFyIGNlbnRlclggPSAwO1xudmFyIGNlbnRlclkgPSAwO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIGV4cG9ydHMsICBcIndpZHRoXCIsIHtcblxuICAgIHNldDogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICB3aWR0aCA9IHZhbHVlO1xuICAgICAgICBjZW50ZXJYID0gdmFsdWUgLyAyO1xuICAgIH0sXG5cbiAgICBnZXQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdpZHRoO1xuICAgIH1cbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBleHBvcnRzLCBcImhlaWdodFwiLCB7XG5cbiAgICBzZXQ6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgaGVpZ2h0ID0gdmFsdWU7XG4gICAgICAgIGNlbnRlclkgPSB2YWx1ZSAvIDI7XG4gICAgfSxcblxuICAgIGdldCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gaGVpZ2h0O1xuICAgIH1cbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBleHBvcnRzLCAgXCJjZW50ZXJYXCIsIHtcblxuICAgIHNldDogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICBjZW50ZXJYID0gdmFsdWU7XG4gICAgICAgIHdpZHRoID0gdmFsdWUgKiAyO1xuICAgIH0sXG5cbiAgICBnZXQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGNlbnRlclg7XG4gICAgfVxufSApO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIGV4cG9ydHMsIFwiY2VudGVyWVwiLCB7XG5cbiAgICBzZXQ6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgY2VudGVyWSA9IHZhbHVlO1xuICAgICAgICBoZWlnaHQgPSB2YWx1ZSAqIDI7XG4gICAgfSxcblxuICAgIGdldCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gY2VudGVyWTtcbiAgICB9XG59ICk7XG4iLCJ2YXIgY29uZmlnID0gcmVxdWlyZSggXCIuL2NvbmZpZ1wiICk7XHJcbnZhciBzaHVmZmxlID0gcmVxdWlyZSggXCJtb3V0L2FycmF5L3NodWZmbGVcIiApO1xyXG5cclxuZXhwb3J0cy5nZW5lcmF0ZSA9IGZ1bmN0aW9uKCB4LCB5LCBjb250ZXh0ICkge1xyXG5cclxuICAgIHZhciBzZWxmID0ge307XHJcbiAgICB2YXIgdCA9IDA7XHJcbiAgICB2YXIgbmVpZ2hib3JzO1xyXG4gICAgdmFyIGNvcm5zZXJzO1xyXG4gICAgdmFyIGF2YWlsYWJsZSA9IHRydWU7XHJcblxyXG4gICAgc2VsZi54ID0geDtcclxuICAgIHNlbGYueSA9IHk7XHJcblxyXG4gICAgc2VsZi5zZXROZWlnaGJvcnMgPSBmdW5jdGlvbiggYXJyYXkgKSB7XHJcbiAgICAgICAgbmVpZ2hib3JzID0gc2h1ZmZsZSggYXJyYXkgKTtcclxuICAgIH07XHJcblxyXG4gICAgc2VsZi5zZXRDb3JuZXJzID0gZnVuY3Rpb24oIGFycmF5ICkge1xyXG4gICAgICAgIGNvcm5zZXJzID0gYXJyYXk7XHJcbiAgICB9O1xyXG5cclxuICAgIHNlbGYucmVuZGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgYXZhaWxhYmxlID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHQgKz0gY29uZmlnLnNwZWVkO1xyXG4gICAgICAgIHQgPSBNYXRoLm1pbiggdCwgMSApO1xyXG5cclxuICAgICAgICB2YXIgc2l6ZSA9IE1hdGguY2VpbCggY29uZmlnLnNpemUgKiB0ICk7XHJcbiAgICAgICAgdmFyIGhhbGYgPSBNYXRoLmNlaWwoIGNvbmZpZy5zaXplICogdCAqIDAuNSApO1xyXG5cclxuICAgICAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gXCJibGFja1wiO1xyXG4gICAgICAgIGNvbnRleHQucmVjdCggLSBoYWxmICwgLWhhbGYsIHNpemUsIHNpemUgKTtcclxuICAgICAgICBjb250ZXh0LmZpbGwoKTtcclxuICAgIH07XHJcblxyXG4gICAgc2VsZi5pc0NvbXBsZXRlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHQgPj0gMTtcclxuICAgIH07XHJcblxyXG4gICAgc2VsZi5nZXRBdmFpbGFibGVOZWlnaGJvciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBjdXJyZW50O1xyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IG5laWdoYm9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSApIHtcclxuICAgICAgICAgICAgY3VycmVudCA9IG5laWdoYm9yc1sgaSBdO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBjdXJyZW50Lmhhc1NhdmVTdXJyb3VuZGluZyggc2VsZiApICkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfTtcclxuXHJcbiAgICBzZWxmLmhhc1NhdmVTdXJyb3VuZGluZyA9IGZ1bmN0aW9uKCBlbnRyZW5jZSApIHtcclxuXHJcbiAgICAgICAgdmFyIGksIGN1cnJlbnQ7XHJcblxyXG4gICAgICAgIGZvciAoIGkgPSBuZWlnaGJvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnQgPSBuZWlnaGJvcnNbIGkgXTtcclxuXHJcbiAgICAgICAgICAgIGlmICggY3VycmVudCA9PT0gZW50cmVuY2UgKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggISBjdXJyZW50LmlzQXZhaWxhYmxlKCkgKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKCBpID0gY29ybnNlcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnQgPSBjb3Juc2Vyc1sgaSBdO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBjdXJyZW50LmlzQWRqYWNlbnQoIGVudHJlbmNlICkgKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggISBjdXJyZW50LmlzQXZhaWxhYmxlKCkgKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH07XHJcblxyXG4gICAgc2VsZi5pc0FkamFjZW50ID0gZnVuY3Rpb24oIHRpbGUgKSB7XHJcblxyXG4gICAgICAgIGZvciAoIHZhciBpID0gbmVpZ2hib3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICkge1xyXG4gICAgICAgICAgICBpZiAoIG5laWdoYm9yc1sgaSBdID09PSB0aWxlICkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBzZWxmLnVwZGF0ZUF2YWlsYWJpbGl0eSA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcclxuICAgICAgICBhdmFpbGFibGUgPSBhdmFpbGFibGUgJiYgdmFsdWU7XHJcbiAgICB9O1xyXG5cclxuICAgIHNlbGYuaXNBdmFpbGFibGUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gYXZhaWxhYmxlO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gc2VsZjtcclxufTsiLCJ2YXIgcmFuZEludCA9IHJlcXVpcmUoJy4uL3JhbmRvbS9yYW5kSW50Jyk7XG5cbiAgICAvKipcbiAgICAgKiBTaHVmZmxlIGFycmF5IGl0ZW1zLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHNodWZmbGUoYXJyKSB7XG4gICAgICAgIHZhciByZXN1bHRzID0gW10sXG4gICAgICAgICAgICBybmQ7XG4gICAgICAgIGlmIChhcnIgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaSA9IC0xLCBsZW4gPSBhcnIubGVuZ3RoLCB2YWx1ZTtcbiAgICAgICAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgICAgICAgICAgaWYgKCFpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0c1swXSA9IGFyclswXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcm5kID0gcmFuZEludCgwLCBpKTtcbiAgICAgICAgICAgICAgICByZXN1bHRzW2ldID0gcmVzdWx0c1tybmRdO1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbcm5kXSA9IGFycltpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIG1vZHVsZS5leHBvcnRzID0gc2h1ZmZsZTtcblxuIiwiLyoqXG4gKiBAY29uc3RhbnQgTWF4aW11bSAzMi1iaXQgc2lnbmVkIGludGVnZXIgdmFsdWUuICgyXjMxIC0gMSlcbiAqL1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSAyMTQ3NDgzNjQ3O1xuXG4iLCIvKipcbiAqIEBjb25zdGFudCBNaW5pbXVtIDMyLWJpdCBzaWduZWQgaW50ZWdlciB2YWx1ZSAoLTJeMzEpLlxuICovXG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IC0yMTQ3NDgzNjQ4O1xuXG4iLCJ2YXIgcmFuZG9tID0gcmVxdWlyZSgnLi9yYW5kb20nKTtcbnZhciBNSU5fSU5UID0gcmVxdWlyZSgnLi4vbnVtYmVyL01JTl9JTlQnKTtcbnZhciBNQVhfSU5UID0gcmVxdWlyZSgnLi4vbnVtYmVyL01BWF9JTlQnKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgcmFuZG9tIG51bWJlciBpbnNpZGUgcmFuZ2VcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByYW5kKG1pbiwgbWF4KXtcbiAgICAgICAgbWluID0gbWluID09IG51bGw/IE1JTl9JTlQgOiBtaW47XG4gICAgICAgIG1heCA9IG1heCA9PSBudWxsPyBNQVhfSU5UIDogbWF4O1xuICAgICAgICByZXR1cm4gbWluICsgKG1heCAtIG1pbikgKiByYW5kb20oKTtcbiAgICB9XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHJhbmQ7XG5cbiIsInZhciBNSU5fSU5UID0gcmVxdWlyZSgnLi4vbnVtYmVyL01JTl9JTlQnKTtcbnZhciBNQVhfSU5UID0gcmVxdWlyZSgnLi4vbnVtYmVyL01BWF9JTlQnKTtcbnZhciByYW5kID0gcmVxdWlyZSgnLi9yYW5kJyk7XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHJhbmRvbSBpbnRlZ2VyIGluc2lkZSByYW5nZSBvciBzbmFwIHRvIG1pbi9tYXggdmFsdWVzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJhbmRJbnQobWluLCBtYXgpe1xuICAgICAgICBtaW4gPSBtaW4gPT0gbnVsbD8gTUlOX0lOVCA6IH5+bWluO1xuICAgICAgICBtYXggPSBtYXggPT0gbnVsbD8gTUFYX0lOVCA6IH5+bWF4O1xuICAgICAgICAvLyBjYW4ndCBiZSBtYXggKyAwLjUgb3RoZXJ3aXNlIGl0IHdpbGwgcm91bmQgdXAgaWYgYHJhbmRgXG4gICAgICAgIC8vIHJldHVybnMgYG1heGAgY2F1c2luZyBpdCB0byBvdmVyZmxvdyByYW5nZS5cbiAgICAgICAgLy8gLTAuNSBhbmQgKyAwLjQ5IGFyZSByZXF1aXJlZCB0byBhdm9pZCBiaWFzIGNhdXNlZCBieSByb3VuZGluZ1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCggcmFuZChtaW4gLSAwLjUsIG1heCArIDAuNDk5OTk5OTk5OTk5KSApO1xuICAgIH1cblxuICAgIG1vZHVsZS5leHBvcnRzID0gcmFuZEludDtcblxuIiwiXG5cbiAgICAvKipcbiAgICAgKiBKdXN0IGEgd3JhcHBlciB0byBNYXRoLnJhbmRvbS4gTm8gbWV0aG9kcyBpbnNpZGUgbW91dC9yYW5kb20gc2hvdWxkIGNhbGxcbiAgICAgKiBNYXRoLnJhbmRvbSgpIGRpcmVjdGx5IHNvIHdlIGNhbiBpbmplY3QgdGhlIHBzZXVkby1yYW5kb20gbnVtYmVyXG4gICAgICogZ2VuZXJhdG9yIGlmIG5lZWRlZCAoaWUuIGluIGNhc2Ugd2UgbmVlZCBhIHNlZWRlZCByYW5kb20gb3IgYSBiZXR0ZXJcbiAgICAgKiBhbGdvcml0aG0gdGhhbiB0aGUgbmF0aXZlIG9uZSlcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByYW5kb20oKXtcbiAgICAgICAgcmV0dXJuIHJhbmRvbS5nZXQoKTtcbiAgICB9XG5cbiAgICAvLyB3ZSBleHBvc2UgdGhlIG1ldGhvZCBzbyBpdCBjYW4gYmUgc3dhcHBlZCBpZiBuZWVkZWRcbiAgICByYW5kb20uZ2V0ID0gTWF0aC5yYW5kb207XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHJhbmRvbTtcblxuXG4iXX0=
