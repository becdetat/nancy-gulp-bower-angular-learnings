'use strict';

var gulp = require('gulp');
var config = require('./gulp-config.json');

var $ = {
	if: require('gulp-if'),
	notify: require('gulp-notify'),
	rev: require('gulp-rev'),
	revReplace: require('gulp-rev-replace'),
	useref: require('gulp-useref'),
	filter: require('gulp-filter'),
	uglify: require('gulp-uglify'),
	minifyCss: require('gulp-minify-css'),
	del: require('del'),
	path: require('path'),
	connect: require('connect'),
	serveStatic: require('serve-static'),
	log: require('gulp-load-plugins')()
		.loadUtils(['log'])
		.log
};

gulp.task('fonts', function(){
	return gulp
		.src([$.path.join(config.paths.client, 'content/fonts/*')])
		.pipe(gulp.dest($.path.join(config.paths.destination, 'content/fonts')));
});

gulp.task('images', function(){
	return gulp
		.src([$.path.join(config.paths.client, 'content/images/*')])
		.pipe(gulp.dest($.path.join(config.paths.destination, 'content/images')));
});

gulp.task('build', ['fonts', 'images'], function() {
	var cssFilter = $.filter('**/*.css');
	var jsFilter = $.filter('**/*.js');
	var assets = $.useref.assets();

	return gulp
		.src($.path.join(config.paths.client, '*.html'))
		.pipe(assets)
		.pipe($.if('*.js', $.uglify()))
		.pipe($.if('*.css', $.minifyCss()))
		.pipe($.rev())
		.pipe(assets.restore())
		.pipe($.useref())
		.pipe($.revReplace())
		.pipe(gulp.dest(config.paths.destination))

		.pipe($.notify({
			onLast: true,
			message: 'Build complete'
		}))
		;
});

gulp.task('clean', function() {
	$.log('Cleaning: ' + config.paths.destination);

	$.del([].concat(config.paths.destination));
});

gulp.task('serve', function() {
	var sourcePath = $.path.join(__dirname, config.paths.destination);
	var port = 12857;
	var serveFromPath = '/' + config.paths.buildPrefix;

	log('Hosting ' + sourcePath + ' at http://localhost:' + port + serveFromPath);

	$.connect()
		.use(serveFromPath, $.serveStatic(sourcePath))
		.listen(port);
});
