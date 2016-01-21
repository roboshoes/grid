var gulp       = require( "gulp" );
var browserify = require( "gulp-browserify" );
var connect    = require( "gulp-connect" );
var jade       = require( "gulp-jade" );
var less       = require( "gulp-less" );
var cssnano    = require( "gulp-cssnano" );

function onError( error ) {
    console.log( error );
    this.emit( "end" );
}

gulp.task( "scripts", function() {
    gulp.src( "javascripts/main.js" )
        .pipe( browserify ( {
            debug: true,
        } ) )
        .on( "error", onError )
        .pipe( gulp.dest( "public/javascripts" ) );
} );

gulp.task( "connect", function() {
    connect.server( {
        root: "public"
    } );
} );

gulp.task( "jade", function() {
    gulp.src( "views/*.jade" )
        .pipe( jade() )
        .pipe( gulp.dest( "public" ) );
} );

gulp.task( "watch", function() {
    gulp.watch( "javascripts/**/*.js", [ "scripts" ] );
    gulp.watch( "views/*.jade", [ "jade" ] );
    gulp.watch( "less/*.less", [ "less" ] );
} );

gulp.task( "less", function() {
    gulp.src( "less/**/*.less" )
        .pipe( less() )
        .pipe( cssnano() )
        .pipe( gulp.dest( "./public/stylesheets" ) );
} );

gulp.task( "default", [ "scripts", "jade", "less", "watch", "connect" ] );