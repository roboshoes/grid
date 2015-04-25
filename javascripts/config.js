var dat = require( "dat-gui" );

var gui = new dat.GUI();
var exports = module.exports = {
    size: 5,
    speed: 0.1,
    gridWidth: 106,
    gridHeight: 106,
    hyperlapse: true,
    canvasPadding: 5,
    cyclesPerFrame: 5,
    message: "GRID"
};

gui.add( exports, "message" );

