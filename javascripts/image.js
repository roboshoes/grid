var canvas = document.createElement( "canvas" );
var context = canvas.getContext( "2d" );

module.exports = function( string, width, height ) {

    canvas.width = width;
    canvas.height = height;

    context.clearRect( 0, 0, width, height );

    context.fillStyle = "black";
    context.font = "40px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText( string, width / 2, height / 2 );

    return context.getImageData( 0, 0, width, height );
};