Set up gulp / bower workflow with Nancy in an ASP.NET container

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

Now use NPM to install Gulp and Bower:

	npm install -g bower
	npm install -g gulp

Now install them to the project??? run this in the project root `/`:

	npm install --save-dev gulp


### Getting started with Bower

Run this to create `bower.json` in the project root:

	bower init

This walks through a wizard style script. Then install a JS component like this:

	bower install angular

This creates the AngularJS package inside `/bower_components/angular`, containing `angular.js` etc. It also adds the dependency to `bower.json`.

###  Getting started with Gulp

Create a file `gulpfile.js` in the project root:

	var gulp = require('gulp');

	gulp.task('default', function () {
	});

https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md

ok lets build us a gulp pipeline

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

We can use this to create a build pipeline. First use NPM to install [`gulp-load-plugins`](https://www.npmjs.com/package/gulp-load-plugins).

> Loads in any gulp plugins and attaches them to the global scope, or an object of your choice.
