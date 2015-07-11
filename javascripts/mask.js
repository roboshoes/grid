var image  = require( "./image" );
var config = require( "./config" );

module.exports = function( matrix ) {

    var imageData = image(
        config.message,
        config.gridWidth,
        config.gridHeight
    );

    var data = imageData.data;

    var colLength = matrix.length;
    var rowLength = matrix[ 0 ].length;

    for ( var y = 0; y < colLength; y++ ) {
        for ( var x = 0; x < rowLength; x++ ) {
            matrix[ y ][ x ].updateAvailability( data[ ( y * rowLength + x ) * 4 + 3 ] === 0 );
        }
    }

};