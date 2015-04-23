var tile = require( "./tile" );
var stage = require( "./stage" );
var config = require( "./config" );

var exports = module.exports = {};
var matrix;
var activeTiles;
var context;
var gridWidth = 0;
var gridHeight = 0;
var checkPool = window.checkPool = [];

exports.setContext = function( value ) {
    context = value;
};

exports.generate = function( width, height ) {

    gridWidth = width;
    gridHeight = height;

    matrix = [];
    activeTiles = [];

    var x, y;

    for ( y = 0; y < height; y++ ) {
        matrix.push( [] );

        for ( x = 0; x < width; x++ ) {
            matrix[ y ].push( tile.generate( x, y, context ) );
        }
    }

    for ( y = 0; y < height; y++ ) {
        for ( x = 0; x < width; x++ ) {

            var neighbors = [];
            var corners = [];

            if ( y > 0 )             neighbors.push( matrix[ y - 1 ][ x ] );
            if ( y < height - 1 )    neighbors.push( matrix[ y + 1 ][ x ] );
            if ( x > 0 )             neighbors.push( matrix[ y ][ x - 1 ] );
            if ( x < gridWidth - 1 ) neighbors.push( matrix[ y ][ x + 1 ] );

            if ( x < width - 1 && y > 0 )          corners.push( matrix[ y - 1 ][ x + 1 ] );
            if ( x < width - 1 && y < height - 1 ) corners.push( matrix[ y + 1 ][ x + 1 ] );
            if ( x > 0 && y < height - 1 )         corners.push( matrix[ y + 1 ][ x - 1 ] );
            if ( x > 0 && y > 0 )                  corners.push( matrix[ y - 1 ][ x - 1 ] );

            matrix[ y ][ x ].setNeighbors( neighbors );
            matrix[ y ][ x ].setCorners( corners );
        }
    }
};

exports.mask = function( transform ) {
    transform( matrix );
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

        x = stage.centerX - gridWidth * config.size / 2 + current.x * config.size;
        y = stage.centerY - gridHeight * config.size / 2 + current.y * config.size;

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
