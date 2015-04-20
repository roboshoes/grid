var gulp       = require( "gulp" );
var browserify = require( "gulp-browserify" );
var connect    = require( "gulp-connect" );
var jade       = require( "gulp-jade" );
var gutil      = require( "gulp-util" );
var less       = require( "gulp-less" );
var minifyCSS  = require( "gulp-minify-css" );

gulp.task( "scripts", function() {
    gulp.src( "javascripts/main.js" )
        .pipe( browserify ( {
            debug: true,
        } ) )
        .on( "error", gutil.log )
        .pipe( gulp.dest( "public/javascripts" ) );
} );

gulp.task( "connect", function() {
    connect.server( {
        root: "public",
        livereload: false
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
        .pipe( minifyCSS() )
        .pipe( gulp.dest( "./public/stylesheets" ) );
} );

gulp.task( "default", [ "scripts", "jade", "less", "watch", "connect" ] );