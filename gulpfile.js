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

var gutil = plugins.loadUtils([
	'colors', 'log'
]);

var log = gutil.log;
var colors = gutil.colors;


gulp.task('vendorcss', function(){
	log('Bundle, minify and copy vendor CSS');

	// search pattern for css
	var vendorFilter = filter(['**/*.css']);

	return gulp
		// set source
		.src(config.paths.vendorcss)
		// write to vendor.min.css
		.pipe(concat('vendor.min.css'))

		// start tracking size
		.pipe(bytediff.start())
		// minify css
		.pipe(minifyCss())
		// stop tracking size and output it using bytediffFormatter
		.pipe(bytediff.stop(bytediffFormatter))

		// write to dest/content/css
		.pipe(gulp.dest(path.join(config.paths.destination, 'content/css')));
});

gulp.task('css', function() {
	log('Bundle, minify and copy app CSS');

	return gulp
		// set source (src/**/*.css)
		.src([path.join(config.paths.client, '**/*.css')])
		// write to site.min.css
		.pipe(concat('site.min.css'))
		// start tracking size
		.pipe(bytediff.start())
		// minify the css
		.pipe(minifyCss())
		// stop tracking size and output it
		.pipe(bytediff.stop(bytediffFormatter))
		// write to dest/content/css
		.pipe(gulp.dest(path.join(config.paths.destination, 'content/css')));
});

gulp.task('vendorjs', function(){
	log("Bundle, minify and copy vendor JS");

	return gulp
		// set source
		.src(config.paths.vendorjs)
		// write to vendor.min.js
		.pipe(concat('vendor.min.js'))
		// start tracking size
		.pipe(bytediff.start())
		// uglify js
		.pipe(uglify())
		// stop tracking size and output it using bytediffFormatter
		.pipe(bytediff.stop(bytediffFormatter))

		// write to dest/content/js
		.pipe(gulp.dest(path.join(config.paths.destination, 'content/js')));

});

// Revision and inject into index.html, then write it to the dist folder
gulp.task('rev-and-inject', ['vendorcss', 'css', 'vendorjs'], function(){
	// build up a path to index.html
	var indexPath = path.join(config.paths.client, 'index.html');
	// filter for index.html
	var indexFilter = filter(['index.html']);

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

	return gulp
		// set source (/src/client/)
		.src([].concat(indexPath))
		// filter to index.html
		//.pipe(indexFilter)

		// inject into inject-vendor:css
		.pipe(localInject(
			path.join(config.paths.destination, 'content/css/vendor.min.css'), 
			'inject-vendor'))
		// inject into inject:css 
		.pipe(localInject(
			path.join(config.paths.destination, 'content/css/site.min.css')))
		// inject into inject-vendor:js
		.pipe(localInject(
			path.join(config.paths.destination, 'content/js/vendor.min.js'),
			'inject-vendor'))

		// write to dest (/src/client-build/)
		.pipe(gulp.dest(config.paths.destination));
		// remove filter
		//.pipe(indexFilter.restore());
});

// Just copy files to production for now
gulp.task('build', ['rev-and-inject'], function() {
	// notify
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


/**
 * Formatter for bytediff to display the size changes after processing
 * @param  {Object} data - byte data
 * @return {String}      Difference in bytes, formatted
 */
function bytediffFormatter(data) {
	var formatPercent = function(num, precision) {
		return (num * 100).toFixed(precision);
	};
    var difference = (data.savings > 0) ? ' smaller.' : ' larger.';

    return data.fileName + ' went from ' +
        (data.startSize / 1000).toFixed(2) + ' kB to ' + (data.endSize / 1000).toFixed(2) + ' kB' +
        ' and is ' + formatPercent(1 - data.percent, 2) + '%' + difference;
}

