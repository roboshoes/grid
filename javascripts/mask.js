var image  = require( "./image" );
var config = require( "./config" );

module.exports = function( matrix ) {

    var imageData = image(
        "MENES",
        config.gridWidth,
        config.gridHeight
    );

    var data = imageData.data;

    var length = matrix.length;
    var tile;

    for ( var y = 0; y < matrix.length; y++ ) {
        for ( var x = 0; x < matrix[ y ].length; x++ ) {
            tile = matrix[ y ][ x ];

            tile.updateAvailability( data[ ( y * length + x ) * 4 + 3 ] === 0 );
        }
    }

};