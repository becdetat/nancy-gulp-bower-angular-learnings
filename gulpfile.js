var gulp = require('gulp');
var plug = require('gulp-load-plugins')();


//gulp.task('help', plug.taskListing);
gulp.task(
	'rev-and-inject', 
	['js', 'vendorjs', 'css', 'vendorcss'],
	function(){

	});

gulp.task('build', ['rev-and-inject', 'images', 'fonts'], function() {
	console.log('Building the optimised app');

	// return gulp
	// 	.src('')
	// 	.pipe(plug.notify({
	// 		onLast: true,
	// 		message: 'Deployed code!'
	// 	}));
});

