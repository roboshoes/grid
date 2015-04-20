var image  = require( "./image" );
var config = require( "./config" );

module.exports = function( matrix ) {

    var imageData = image(
        "MATTIE",
        config.gridsize,
        config.gridsize
    );

    var data = imageData.data;

    var length = matrix.length;
    var tile;

    for ( var y = 0; y < length; y++ ) {
        for ( var x = 0; x < length; x++ ) {
            tile = matrix[ y ][ x ];

            tile.updateAvailability( data[ ( y * length + x ) * 4 + 3 ] === 0 );
        }
    }

};