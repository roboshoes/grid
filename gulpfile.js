var gulp       = require( "gulp" );
var browserify = require( "gulp-browserify" );
var connect    = require( "gulp-connect" );
var jade       = require( "gulp-jade" );
var gutil      = require( "gulp-util" );

gulp.task( "scripts", function() {
    return gulp.src( "javascripts/main.js" )
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
    return gulp.src( "views/*.jade" )
        .pipe( jade() )
        .pipe( gulp.dest( "public" ) );
} );

gulp.task( "watch", function() {
    gulp.watch( "javascripts/**/*.js", [ "scripts" ] );
    gulp.watch( "views/*.jade", [ "jade" ] );
} );

gulp.task( "default", [ "scripts", "jade", "watch", "connect" ] );