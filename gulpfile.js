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

var gutil = plugins.loadUtils([
	'colors', 'log'
]);

var log = gutil.log;
var colors = gutil.colors;


gulp.task('vendorcss', function(){
	log('Compressing, bundling and copying vendor CSS');

	// search pattern for css
	var vendorFilter = filter(['**/*.css']);

	return gulp
		// set source (vendorcss)
		.src(config.paths.vendorcss)
		// write to vendor.min.css
		.pipe(concat('vendor.min.css'))

		// start tracking size
		.pipe(bytediff.start())
		// minify css
		.pipe(minifyCss())
		// stop tracking size and output it using bytediffFormatter
		.pipe(bytediff.stop(bytediffFormatter))

		// write to dest/content
		.pipe(gulp.dest(path.join(config.paths.destination, 'content')));
});

gulp.task('css', function() {
	log('Compessing, bundling and copying app CSS');

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
		// write to dest/content
		.pipe(gulp.dest(path.join(config.paths.destination, 'content')));
});

// Revision and inject into index.html, then write it to the dist folder
gulp.task('rev-and-inject', ['vendorcss', 'css'], function(){
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

		// replace the inject-vendor:css section with the minified version
		.pipe(localInject(
			path.join(config.paths.destination, 'content/vendor.min.css'), 
			'inject-vendor'))
		// insert the site css into the head
		.pipe(localInject(
			path.join(config.paths.destination, 'content/site.min.css')))

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

