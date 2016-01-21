var config = require( "./config" );

var WIDTH = 1000;

config.on( "update", onUpdateGradient );

var percent = 0;
var canvas = document.createElement( "canvas" );
var context = canvas.getContext( "2d" );

canvas.height = 1;
canvas.width = WIDTH;

function onUpdateGradient() {

    var gradient = context.createLinearGradient( 0, 0, WIDTH, 0 );

    gradient.addColorStop( 0, config.startColor );
    gradient.addColorStop( 1, config.endColor );

    context.fillStyle = gradient;
    context.fillRect( 0, 0, WIDTH, 1 );
}

function pad( value ) {
    return ( "000000" + value ).slice( -6 );
}

function rgbToCSS( r, g, b ) {
    return "#" + pad( ( ( r << 16 ) | ( g << 8 ) | b ).toString( 16 ) );
}

function calculate( value ) {
    var x = ( value * ( WIDTH - 1 ) ) | 0;
    var data = context.getImageData( x, 0, 1, 1 ).data;

    return rgbToCSS( data[ 0 ], data[ 1 ], data[ 2 ] );
}

module.exports.get = function() {
    return calculate( percent )
};

module.exports.getColorFrom = function( base ) {
    return calculate( Math.min( base + config.colorIncrease, 1 ) );
};

module.exports.getPercentFrom = function( base ) {
    return Math.min( base + config.colorIncrease, 1 );
}

onUpdateGradient();