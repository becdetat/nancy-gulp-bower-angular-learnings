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
	log('Bundle, minify and copy vendor CSS');

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

		// write to dest
		.pipe(gulp.dest(config.paths.destination));
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
		// write to dest
		.pipe(gulp.dest(config.paths.destination));
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

		// write to dest
		.pipe(gulp.dest(config.paths.destination));
});

gulp.task('js', function() {
	log('Bundle, minify and copy app JS');

	return gulp
		// set source (src/**/*.js)
		.src([path.join(config.paths.client, '**/*.js')])
		// write to site.min.js
		.pipe(concat('site.min.js'))
		// start tracking size
		.pipe(bytediff.start())
		// uglify js
		.pipe(uglify())
		// stop tracking size and output it using bytediffFormatter
		.pipe(bytediff.stop(bytediffFormatter))

		// write to dest
		.pipe(gulp.dest(config.paths.destination));
});

// Revision and inject into index.html, then write it to the dist folder
gulp.task('rev-and-inject', ['vendorcss', 'css', 'vendorjs', 'js'], function(){
	log('Rev and inject');

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
		// set source (/src/client/)
		.src([].concat(
			path.join(config.paths.client, 'index.html'), 
			path.join(config.paths.destination, '*.min.css'),
			path.join(config.paths.destination, '*.min.js')))

		// filter to *.min.css
		.pipe(cssFilter)
		// add the revision to the files
		.pipe(rev())
		// write the files
		.pipe(gulp.dest(config.paths.destination))
		// clear the filter
		.pipe(cssFilter.restore())

		// add the revision to the js files
		.pipe(jsFilter)
		.pipe(rev())
		.pipe(gulp.dest(config.paths.destination))
		.pipe(jsFilter.restore())

		// filter to index.html
		.pipe(indexFilter)
		// injections
		.pipe(localInject(path.join(config.paths.destination, 'vendor.min.css'), 'inject-vendor'))
		.pipe(localInject(path.join(config.paths.destination, 'site.min.css')))
		.pipe(localInject(path.join(config.paths.destination, 'vendor.min.js'), 'inject-vendor'))
		.pipe(localInject(path.join(config.paths.destination, 'site.min.js')))
		// write index.html
		.pipe(gulp.dest(config.paths.destination))
		// clear the filter
		.pipe(indexFilter.restore())


		// substitute in new filenames
		.pipe(revReplace())
		// write the changes
		.pipe(gulp.dest(config.paths.destination))
		;
});

gulp.task('fonts', function(){
	log('Copy fonts');

	return gulp
		.src([path.join(config.paths.client, 'content/fonts/*')])
		.pipe(gulp.dest(path.join(config.paths.destination, 'content/fonts')));
});

gulp.task('images', function(){
	log('Compress, cache and copy images');

	return gulp
		.src([path.join(config.paths.client, 'content/images/*')])
		.pipe(cache(imagemin({
			optimizationLevel: 3
		})))
		.pipe(gulp.dest(path.join(config.paths.destination, 'content/images')));
});

gulp.task('build', ['rev-and-inject', 'fonts', 'images'], function() {
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

// hmpf. doesn't work.
gulp.task('watch', function(){
	log('Watching files');
	
	return gulp
		.watch([config.paths.client], ['build'])
		.on('change', function(event) {
			log('File ' + event.path + ' was changed, rebuilding');
		});
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

