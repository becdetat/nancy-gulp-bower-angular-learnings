Nancy, Gulp, Bower and AngularJS learnings
==========================================

WARNING learning in the open. These are just scratchy notes.


## Create the folder structure

`/src`, `/src/client`, `/src/server`

`/src/client` will contain the artifacts needed for gulp/bower - HTML, images, css, client-side JS and server-side JS used to compule the client into a static site (which will be copied into the Nancy project as a build artifact).

`/src/server` will contain the 'traditional' .NET server, ie. the Nancy project, test projects, other projects. Basically whatever is needed to run the server except for the static site (which gets copied here as an artifact from the Gulp build).


## Create the server

Create a Nancy/ASP.NET project in `src/server/ServerProject`.

**Optional**: Set up Autofac by adding Autofac and Nancy.Bootstrappers.Autofac via NuGet. Change the `Bootstrapper` class to inherit from `AutofacNancyBootstrapper` and override `ConfigureRequestContainer()` to add your Autofac registrations. eg.:

	protected override void ConfigureRequestContainer(ILifetimeScope container, NancyContext context)
	{
		var builder = new ContainerBuilder();

		builder.RegisterAssemblyModules(new[]
		{
			typeof (Bootstrapper).Assembly
		});

		builder.Update(container.ComponentRegistry);
	}


## Point Nancy to the client

Override `ConfigureConventions` and do stuff...


## Set up the client

### About Bower and Gulp

https://github.com/johnpapa/ng-demos/tree/master/grunt-gulp

Gulp is a nodejs based build tool. It executes `gulpfile.js` in the project root to set up a build pipeline, doing things like JS package management (Bower), bundling, minification, etc.

Bower is a JS package management tool. Kind of like NuGet but for JavaScript. 


### Prereqs

Install Node and NPM. The easiest way may be via chocolatey, this does both:

	cinst nodejs.install

Get NPM to create a `package.json` file in the project root by running `npm install`. Now install Bower and Gulp using NPM:

	npm install --save-dev gulp
	npm install --save-dev bower

The `--save-dev` flag adds the dependencies to `package.json`. This means that when you open the repository in a new environment you can just do `npm install` to automatically install the project's NPM dependencies.


### Getting started with Bower

Run this to create `bower.json` in the project root:

	bower init

This walks through a wizard style script. Then install a JS component like this:

	bower install angular

This creates the AngularJS package inside `/bower_components/angular`, containing `angular.js` etc. It also adds the dependency to `bower.json`.

###  Getting started with Gulp

Create a file `gulpfile.js` in the project root:

	var gulp = require('gulp');

https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md

ok lets build us a gulp pipeline. Add this to `gulpfile.js`:

`gulp.task()` defines a task that's available.

	gulp.task('hello', function() {
		console.log('Hello world!')
	});

If you run `gulp hello`:

	λ gulp hello
	[10:22:08] Using gulpfile c:\source\angular-learnings\gulpfile.js
	[10:22:08] Starting 'hello'...
	Hello world!
	[10:22:08] Finished 'hello' after 316 μs

`gulp.task` also lets you run prereq tasks:

	gulp.task('hello', ['one', 'two', 'three'], function() {
		console.log('Hello world!')
	});

	gulp.task('one', function(){
		console.log('one');
	});
	gulp.task('two', function(){
		console.log('two');
	});
	gulp.task('three', function(){
		console.log('three');
	});

	[10:24:49] Starting 'one'...
	one
	[10:24:49] Finished 'one' after 200 μs
	[10:24:49] Starting 'two'...
	two
	[10:24:49] Finished 'two' after 151 μs
	[10:24:49] Starting 'three'...
	three
	[10:24:49] Finished 'three' after 154 μs
	[10:24:49] Starting 'hello'...
	Hello world!
	[10:24:49] Finished 'hello' after 135 μs

We can use this to create a build pipeline. Remove 


### Simple build pipeline - copy `index.html` to server

I'm just going to start out with a simple build pipeline that basically copies `index.html` to the server.

Install some more NPM packages. 

[`gulp-load-plugins`](https://www.npmjs.com/package/gulp-load-plugins)

> Loads in any gulp plugins and attaches them to the global scope, or an object of your choice.

Eg.:
	var gutil = require('gulp-load-plugins')([
		'colors', 'env', 'log', 'pipeline'
	]);

[`gulp-notify`](https://www.npmjs.com/package/gulp-notify)

	npm install --save-dev gulp-notify

> gulp plugin to send messages based on Vinyl Files or Errors to Mac OS X, Linux or Windows using the node-notifier module. Fallbacks to Growl or simply logging

[`gulp-filter`](https://www.npmjs.com/package/gulp-filter)

	npm install --save-dev gulp-filter

['chalk'](https://www.npmjs.com/package/chalk)

	npm install --save-dev chalk

> Terminal string styling done right

[`dateformat`](https://www.npmjs.com/package/dateformat)

	npm install --save-dev dateformat

> A node.js package for Steven Levithan's excellent dateFormat() function.

[`del`](https://www.npmjs.com/package/del)

	npm install --save-dev del
	
> Delete files/folders using globs

Whew, that's a bunch of dependencies. At the top of `gulpfile.js`, pull them in using `require()` and get some utility dependencies into scope:

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

The line `var config = require('./gulp-config.json');` requires a file that doesn't exist yet. `gulp-config.json` is going to contain some file paths used by the build script.

To centralise the build paths, add this next:

	var config = {
		"paths": {
			"source": "src/client",
			"distribution": "src/client-dist"
		}
	};

This could be put into another file like `gulp-config.json` and pulled in with a `require()` but for now this will do.

I'll split out the actual copy process into a gulp task called `rev-and-inject`. This will eventually be more involved including adding a revision number for cache busting and injecting minified and bundled resources.

	gulp.task('rev-and-inject', function() {
		var indexPath = path.join(config.paths.source, 'index.html');

		return gulp
			// set source
			.src([].concat(indexPath))
			// write to dest
			.pipe(gulp.dest(config.paths.distribution))
	});

The `build` task calls `rev--and-inject` before displaying a notification (using a toast!):

	gulp.task('build', function(){
		return gulp
			.src('')
			.pipe(notify({
				onLast: true,
				message: 'Build complete'
		}));
	});

In `src/client` I've added an `index.html` just for testing. Run `gulp build`:

	

