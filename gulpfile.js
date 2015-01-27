'use strict';

var gulp = require('gulp');
var config = require('./gulp-config.json');
var notify = require('gulp-notify');
var filter = require('gulp-filter');
var plugins = require('gulp-load-plugins')();
var del = require('del');
var path = require('path');

var gutil = plugins.loadUtils([
	'colors', 'log'
]);

var log = gutil.log;
var colors = gutil.colors;

// Revision and inject into index.html, then write it to the dist folder
gulp.task('rev-and-inject', function(){
	var index = path.join(config.paths.client, 'index.html');
	var indexFilter = filter(['index.html']);

	gulp
		// set source (/src/client/)
		.src([].concat(index))
		// filter to index.html
		//.pipe(indexFilter)
		// write to dest (/src/client-build/)
		.pipe(gulp.dest(config.paths.dist));
		// remove filter
		//.pipe(indexFilter.restore());
});

// Just copy files to production for now
gulp.task('build', ['rev-and-inject'], function() {
	log('Building the optimised app');

	// notify
	return gulp.src('').pipe(notify({
		onLast: true,
		message: 'Deployed code!'
	}));
});

gulp.task('clean', function() {
	log('Cleaning: ' + colors.blue(config.paths.dist));
	del([].concat(config.paths.dist));
});
