'use strict';

var gulp = require('gulp');
var notify = require('gulp-notify');
var filter = require('gulp-filter');
var plugins = require('gulp-load-plugins')();
var del = require('del');
var path = require('path');
var config = require('./gulp-config.json');
var concat = require('gulp-concat');
var bytediff = require('gulp-bytediff');
var minifyCss = require('gulp-minify-css');
var inject = require('gulp-inject');
var connect = require('connect');
var serveStatic = require('serve-static');
var uglify = require('gulp-uglify');
var cache = require('gulp-cache');
var imagemin = require('gulp-imagemin');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');

var gutil = plugins.loadUtils([
	'colors', 'log'
]);

var log = gutil.log;
var colors = gutil.colors;


gulp.task('vendorcss', function(){
	return gulp
		.src(config.paths.vendorcss)
		.pipe(concat('vendor.min.css'))
		.pipe(bytediff.start())
		.pipe(minifyCss())
		.pipe(bytediff.stop(bytediffFormatter))
		.pipe(gulp.dest(config.paths.destination));
});

gulp.task('css', function() {
	return gulp
		.src([path.join(config.paths.client, '**/*.css')])
		.pipe(concat('site.min.css'))
		.pipe(bytediff.start())
		.pipe(minifyCss())
		.pipe(bytediff.stop(bytediffFormatter))
		.pipe(gulp.dest(config.paths.destination));
});

gulp.task('vendorjs', function(){
	return gulp
		.src(config.paths.vendorjs)
		.pipe(concat('vendor.min.js'))
		.pipe(bytediff.start())
		.pipe(uglify())
		.pipe(bytediff.stop(bytediffFormatter))
		.pipe(gulp.dest(config.paths.destination));
});

gulp.task('js', function() {
	return gulp
		.src([path.join(config.paths.client, '**/*.js')])
		.pipe(concat('site.min.js'))
		.pipe(bytediff.start())
		.pipe(uglify())
		.pipe(bytediff.stop(bytediffFormatter))
		.pipe(gulp.dest(config.paths.destination));
});

gulp.task('rev-and-inject', ['vendorcss', 'css', 'vendorjs', 'js'], function(){
	var localInject = function(pathGlob, name) {
		var options = {
			ignorePath: config.paths.destination,
			read: false,
			addPrefix: config.paths.buildPrefix
		};
		if (name) {
			options.name = name;
		}

		return inject(gulp.src(pathGlob), options);
	};

	var indexFilter = filter('index.html');
	var cssFilter = filter("**/*.min.css");
	var jsFilter = filter("**/*.min.js");
	var manifestFilter = filter('rev-manifest.json');

	return gulp
		.src([].concat(
			path.join(config.paths.client, 'index.html'), 
			path.join(config.paths.destination, '*.min.css'),
			path.join(config.paths.destination, '*.min.js')))

		.pipe(cssFilter)
		.pipe(rev())
		.pipe(gulp.dest(config.paths.destination))
		.pipe(cssFilter.restore())

		.pipe(jsFilter)
		.pipe(rev())
		.pipe(gulp.dest(config.paths.destination))
		.pipe(jsFilter.restore())

		.pipe(indexFilter)
		.pipe(localInject(path.join(config.paths.destination, 'vendor.min.css'), 'inject-vendor'))
		.pipe(localInject(path.join(config.paths.destination, 'site.min.css')))
		.pipe(localInject(path.join(config.paths.destination, 'vendor.min.js'), 'inject-vendor'))
		.pipe(localInject(path.join(config.paths.destination, 'site.min.js')))
		.pipe(gulp.dest(config.paths.destination))
		.pipe(indexFilter.restore())


		.pipe(revReplace())
		.pipe(gulp.dest(config.paths.destination))
		;
});

gulp.task('fonts', function(){
	return gulp
		.src([path.join(config.paths.client, 'content/fonts/*')])
		.pipe(gulp.dest(path.join(config.paths.destination, 'content/fonts')));
});

gulp.task('images', function(){
	return gulp
		.src([path.join(config.paths.client, 'content/images/*')])
		.pipe(cache(imagemin({
			optimizationLevel: 3
		})))
		.pipe(gulp.dest(path.join(config.paths.destination, 'content/images')));
});

gulp.task('build', ['rev-and-inject', 'fonts', 'images'], function() {
	return gulp
		.src('')
		.pipe(notify({
			onLast: true,
			message: 'Build complete'
		}));
});

gulp.task('clean', function() {
	log('Cleaning: ' + colors.blue(config.paths.destination));

	del([].concat(config.paths.destination));
});

gulp.task('serve', function() {
	var sourcePath = path.join(__dirname, config.paths.destination);
	var port = 12857;
	var serveFromPath = '/' + config.paths.buildPrefix;

	log('Hosting ' + sourcePath + ' at http://localhost:' + port + serveFromPath);

	connect()
		.use(serveFromPath, serveStatic(sourcePath))
		.listen(port);
});

function bytediffFormatter(data) {
	var formatPercent = function(num, precision) {
		return (num * 100).toFixed(precision);
	};
    var difference = (data.savings > 0) ? ' smaller.' : ' larger.';

    return data.fileName + ' went from ' +
        (data.startSize / 1000).toFixed(2) + ' kB to ' + (data.endSize / 1000).toFixed(2) + ' kB' +
        ' and is ' + formatPercent(1 - data.percent, 2) + '%' + difference;
}

