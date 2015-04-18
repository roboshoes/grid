var stage = require( "./stage" );

var activeTiles = [];
var tiles = [];
var context;

exports.config = function( options ) {
    context = options.context;
};

exports.renderActive = function() {

    for( var i = 0, length = activeTiles.length; i < length; i++ ) {
        activeTiles[ i ].render();

        if ( activeTiles.isComplete() ) {
            activeTiles.splice( i, 1 );
            i--;
            length--;
        }
    }
};

exports.addTile = function( tile ) {
    tiles.push( tile );
    activeTiles.push( tile );
};