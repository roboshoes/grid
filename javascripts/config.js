var dat = require( "dat-gui" );
var fillIn = require( "mout/object/fillIn" );
var EventEmitter = require( "events" ).EventEmitter;

var gui = new dat.GUI();
var exports = module.exports = new EventEmitter();
var cyclesController;

window.gui = gui;

fillIn( exports, {
    size: 5,
    _size: 5,
    speed: 0.2,
    gridWidth: 106,
    gridHeight: 106,
    hyperlapse: true,
    canvasPadding: 5,
    cyclesPerFrame: 5,
    message: "GRID",
    startColor: "#000000",
    endColor: "#b612e8",
    colorIncrease: 0.0005,

    render: function() {
        exports.size = exports._size;
        exports.emit( "update" );
        exports.emit( "render" );
    }
} );

gui.add( exports, "message" );
gui.add( exports, "render" );
gui.add( exports, "gridWidth", 10, 1000 ).name( "blocks on x axis" );
gui.add( exports, "gridHeight", 10, 1000 ).name( "blocks on y axis" );
gui.add( exports, "_size", 1, 100 ).name( "block size" ).onFinishChange( exports.render );
gui.add( exports, "speed", 0, 1 );
gui.add( exports, "hyperlapse" ).onChange( onHyperlapseChange );
gui.add( exports, "colorIncrease", 0, 1 );
gui.addColor( exports, "startColor" );
gui.addColor( exports, "endColor" );

onHyperlapseChange();

function onHyperlapseChange() {

    if ( exports.hyperlapse ) {

        cyclesController = gui.add( exports, "cyclesPerFrame", 1, 15 ).step( 1 ).name( "Fast forward" );

    } else {

        gui.remove( cyclesController );
        exports.cyclesPerFrame = 1;

    }
}