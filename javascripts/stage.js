var width = 0;
var height = 0;

var centerX = 0;
var centerY = 0;

Object.defineProperty( exports,  "width", {

    set: function( value ) {
        width = value;
        centerX = value / 2;
    },

    get : function() {
        return width;
    }
} );

Object.defineProperty( exports, "height", {

    set: function( value ) {
        height = value;
        centerY = value / 2;
    },

    get : function() {
        return height;
    }
} );

Object.defineProperty( exports,  "centerX", {

    set: function( value ) {
        centerX = value;
        width = value * 2;
    },

    get : function() {
        return centerX;
    }
} );

Object.defineProperty( exports, "centerY", {

    set: function( value ) {
        centerY = value;
        height = value * 2;
    },

    get : function() {
        return centerY;
    }
} );
