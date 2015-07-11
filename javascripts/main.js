var grid   = require( "./grid" );
var config = require( "./config" );
var mask   = require( "./mask" );

var canvas = document.querySelector( "#canvas" );
var context = canvas.getContext( "2d" );

function init() {

    setup();
    render();

    config.on( "render", setup );
}

function setup() {
    setSize();
    clear();

    grid.setContext( context );
    grid.generate( config.gridWidth, config.gridHeight );
    grid.mask( mask );
    grid.start();
}

function render() {
    requestAnimationFrame( render );

    grid.render();
}

function clear() {
    context.clearRect( 0, 0, canvas.width, canvas.height );
}

function setSize() {
    canvas.width = config.gridWidth * config.size + config.canvasPadding * 2;
    canvas.height = config.gridHeight * config.size + config.canvasPadding * 2;
}

init();