'use strict';

//npm install gulp gulp-minify-css gulp-uglify gulp-clean gulp-cleanhtml gulp-jshint gulp-strip-debug gulp-zip gulp-less gulp-replace --save-dev

var gulp = require('gulp'),
  clean = require('gulp-clean'),
  cleanhtml = require('gulp-cleanhtml'),
  minifycss = require('gulp-minify-css'),
  jshint = require('gulp-jshint'),
  stripdebug = require('gulp-strip-debug'),
  uglify = require('gulp-uglify'),
  zip = require('gulp-zip'),
  path = require('path'),
  less = require('gulp-less'),
  replace = require('gulp-replace');


  var buildDir = "buildChrome";
  var appDir = "app";
  var distDir = "distChrome";

  var fs = require('fs');
  var json = JSON.parse(fs.readFileSync('./package.json'));

//clean build directory
gulp.task('clean', function() {
  return gulp.src(buildDir + '/*', {read: false})
    .pipe(clean());
});

//copy static folders to build directory
gulp.task('copy', function() {
  gulp.src(appDir + '/favicon.ico')
    .pipe(gulp.dest(buildDir));
  gulp.src(appDir + '/background.js')
    .pipe(gulp.dest(buildDir));
  return gulp.src(appDir + '/manifest.json')
    .pipe(replace('@@version', json.version))
    .pipe(gulp.dest(buildDir));
});

gulp.task('copyImg', function() {
  return gulp.src(appDir + '/images/**')
    .pipe(gulp.dest(buildDir + '/images'));
});

gulp.task('copyBower', function() {
  return gulp.src('app/bower_components/**/*.js')
    .pipe(gulp.dest(buildDir + '/bower_components'));
});

gulp.task('getVersion', function(){
  console.log("version", json.version);
});

//copy and compress HTML files
gulp.task('html', function() {
  return gulp.src(appDir + '/*.html')
    .pipe(cleanhtml())
    .pipe(replace('@@version', json.version))
    .pipe(replace('@@year', new Date().getFullYear()))
    .pipe(gulp.dest(buildDir));
});

//run scripts through JSHint
gulp.task('jshint', function() {
  return gulp.src(appDir + '/scripts/*.js')
    .pipe(jshint())
    // .pipe(jshint.reporter('default'));
});

//copy vendor scripts and uglify all other scripts, creating source maps
gulp.task('scripts', ['jshint'], function() {
  // gulp.src(appDir + '/scripts/lib/**/*.js')
  //  .pipe(gulp.dest(buildDir + '/scripts/lib'));
  return gulp.src([appDir + '/scripts/**/*.js'])
    .pipe(stripdebug())
    // .pipe(uglify({
    //   outSourceMap: true,
    //   mangle: false
    // }))
    .pipe(gulp.dest(buildDir + '/scripts'));
});


gulp.task("less", function(){
  return gulp.src(appDir + '/styles/**/*.less')
    .pipe(less({
      paths: [ appDir + '/styles' ]
    }))
    .pipe(gulp.dest(buildDir + '/styles/compiled'));
});

//minify styles
gulp.task('styles', function() {
  return gulp.src(appDir + '/styles/**/*.css')
    // .pipe(minifycss({root: 'src/styles', keepSpecialComments: 0}))
    .pipe(gulp.dest(buildDir + '/styles'));
  // return gulp.src('src/styles/**')
    // .pipe(gulp.dest('build/styles'));
});

//build ditributable and sourcemaps after other tasks completed
gulp.task('zip', ['html', 'scripts', 'styles', 'copy', 'copyImg', 'copyBower'], function() {
  var manifest = require('./' + appDir + '/manifest');

  var namePrefix = manifest.short_name || manifest.name;

  var distFileName = namePrefix + ' v' + json.version + '.zip',
    mapFileName = namePrefix + ' v' + json.version + '-maps.zip';

  //collect all source maps
  // gulp.src('build/scripts/**/*.map')
    // .pipe(zip(mapFileName))
    // .pipe(gulp.dest('dist'));
  //build distributable extension
  return gulp.src([buildDir + '/**', '!' + buildDir + '/scripts/**/*.map'])
    .pipe(zip(distFileName))
    .pipe(gulp.dest(distDir));
});

//run all tasks after build directory has been cleaned
gulp.task('default', ['clean'], function() {
    gulp.start('zip');
});
