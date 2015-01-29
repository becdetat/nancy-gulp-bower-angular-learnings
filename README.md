Nancy, Gulp, Bower and AngularJS learnings
==========================================

WARNING learning in the open. These are just scratchy notes.

Check out my blog series for something slightly better written:

- [Hello World! It's Gulp!](http://bendetat.com/hello-world-its-gulp.html)


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

We can use this to create a build pipeline. Empty out `gulpfile.js` and start again, partner.

![](http://media.giphy.com/media/ik8lXn1EAU9JG0LKy4/giphy.gif)


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

	[15:05:05] Starting 'rev-and-inject'...
	[15:05:05] Finished 'rev-and-inject' after 24 ms
	[15:05:05] Starting 'build'...
	[15:05:05] gulp-notify: [Gulp notification] Build complete
	[15:05:05] Finished 'build' after 35 ms

You can add a quick `clean` task too, which will delete the `src/client-dist` folder:

	gulp.task('clean', function(){
		log('Cleaning: ' + config.paths.distribution);

		del([].concat(config.paths.distribution));
	});


# Stage 2: A useful build pipeline using Gulp and Bower

Big thanks to my colleague [Gert JvR](http://blog.gertjvr.com/) whose [ng-template](https://github.com/gertjvr/ng-template) project I am deconstructing.

## Have you any Bootstrap?

I want to use Bootstrap, but...

![](http://cdn.meme.am/instances/500x/58510881.jpg)

Bower is a JavaScript package manager. So is NPM, in fact we'll use NPM to install Bower. The difference is that NPM is designed as a server-side (or developer-side) package manager, whereas Bower is only a front-end (client-side) package manager. NPM [can be used for client-side package management](http://browserify.org) but hopefully it will be easier to manage the two scenarios independently by using the package manager designed for the task.

Install Bower to the project using NPM:

	npm install --save-dev bower

Now create `bower.json` by running `bower init` and following the instructions. Bower should not be ready to install Bootstrap:


	bower install bootstrap --save

This installs all of Bootstrap (including the seperate jQuery dependency) into `/bower_components`. It also adds a reference to the dependency in `bower.json` - if it doesn't you may have forgotten the `--save` argument.

I then copied the [minimal Bootstrap HTML](http://getbootstrap.com/getting-started/#template) into `src/client/index.html`. This won't work because we're not copying or linking in the CSS correctly.


## Vendor CSS

There are two types of CSS - vendor and site-specific - and each will be handled slightly differently. Vendor CSS is anything that comes from a Bower package, and site-specific CSS will be anything in `/src/client/css`.

I'll start by adding a dependency task to the `rev-and-inject` task:

	gulp.task('rev-and-inject', ['vendorcss'], function() {
		// existing rev-and-inject task

In the last post I declared the `config` object within `gulpfile.js`. I immediately regret this decision and move it into its own file - `gulp-config.json`. Now I need to explicitly add the CSS files that will be included in the site:

	{
		"paths": {
			"client": "src/client/",
			"server": "src/server/",
			"dist": "src/client-dist",
			"vendorcss": [
				"bower_components/bootstrap/dist/css/bootstrap.css",
				"bower_components/bootstrap/dist/css/bootstrap-theme.css"
			]
		}
	}

The `config` object is now initialised using `require()`:

	var config = require('./gulp-config.json');

Now we get to install some more dependencies!

[`gulp-concat`](https://www.npmjs.com/package/gulp-concat)

	npm install --save-dev gulp-concat

> Concatenates files

Pull in the `concat` dependency at the top of `gulpfile.js`:

	var concat = require('gulp-concat');

Now add the `vendorcss` task:

	gulp.task('vendorcss', function(){
	 	return gulp
			// set source
			.src(config.paths.vendorcss)
			// the output will be written to dest/content/vendor.min.css
			.pipe(concat('vendor.min.css'))
			
			// write to dest/content
			.pipe(gulp.dest(path.join(config.paths.destination, 'content/css')));
	});

This takes all of the vendor CSS files specified in `gulp-config.json` and bundles them into `/src/site-dist/content/css/vendor.min.css`. Very exciting but it hasn't minified the CSS yet. Time for some more plugins:

[`gulp-bytediff`](https://www.npmjs.com/package/gulp-bytediff)
	
	npm install --save-dev gulp-bytediff

> Compare file sizes before and after your gulp build process.

`bytediff` is just used to output the file size reduction from minification.

[`gulp-minify-css`](https://www.npmjs.com/package/gulp-minify-css)

	npm install --save-dev gulp-minify-css

> Minify css with clean-css.

Add the `bytediff` and `minify-css` dependencies at the top of `gulpfile.js`:

	var bytediff = require('gulp-bytediff');
	var minifyCss = require('gulp-minify-css');
	 
Then add the minify and bytediff steps to the pipeline (in `gulp.task('vendorcss'..`):

	return gulp
		// set source
		.src(config.paths.vendorcss)
		// the output will be written to dest/content/vendor.min.css
		.pipe(concat('vendor.min.css'))
 
		// start tracking size
		.pipe(bytediff.start())
		// minify css
		.pipe(minifyCss())
		// stop tracking size and output it using bytediffFormatter
		.pipe(bytediff.stop(bytediffFormatter))
 
		// write to dest/content
		.pipe(gulp.dest(path.join(config.paths.destination, 'content/css')));

The `bytediff.stop(bytediffFormatter)` uses a new function to format the file size difference. This function needs to be added:

	function bytediffFormatter(data) {
		var formatPercent = function(num, precision) {
			return (num * 100).toFixed(precision);
		};
	    var difference = (data.savings > 0) ? ' smaller.' : ' larger.';
	    
	    return data.fileName + ' went from ' +
	        (data.startSize / 1000).toFixed(2) + ' kB to ' + (data.endSize / 1000).toFixed(2) + ' kB' +
	        ' and is ' + formatPercent(1 - data.percent, 2) + '%' + difference;
	}

Now when I run `gulp build` the CSS is minified:

	[09:10:18] Starting 'vendorcss'...
	[gulp] [09:10:18] Compressing, bundling and copying vendor CSS
	[09:10:18] vendor.min.css went from 164.02 kB to 135.50 kB and is 17.39% smaller.
	[09:10:18] Finished 'vendorcss' after 298 ms
	[09:10:18] Starting 'rev-and-inject'...
	[09:10:18] Finished 'rev-and-inject' after 5.79 ms
	[09:10:18] Starting 'build'...
	[09:10:18] gulp-notify: [Gulp notification] Build complete
	[09:10:18] Finished 'build' after 48 ms

The `index.html` now needs a reference to the minified CSS file. It could be hard-coded to `content/vendor.min.css` but that is subject to change if the build script changes. So we need to _inject_ the path to the `vendor.min.css` artifact directly into `index.html` as it is being written.

Install yet another plugin:

[`gulp-inject`](https://www.npmjs.com/package/gulp-inject)

	npm install --save-dev gulp-inject

> A javascript, stylesheet and webcomponent injection plugin for Gulp, i.e. inject file references into your index.html

Add the new `inject` dependency to the top of `gulpfile.js`:

	var inject = require('gulp-inject');

Now in the `rev-and-inject` task add a local method that wraps `inject()` with some common options:

	var localInject = function(pathGlob, name) {
		var options = {
			// Strip out the 'src/client-dist-app' part from the path to vendor.min.css
			ignorePaths = config.paths.destination,
			// Don't read file being injected, just get the path
			read: false,
			// add a prefix to the injected path
			addPrefix: config.paths.buildPrefix
		};
	};

<aside>The `read: false` option is interesting, if it is set to true you can use a transform to [inject the contents](https://www.npmjs.com/package/gulp-inject/#injecting-files-contents) of the file into the output.</aside>

There is a new `buildPrefix` value in the config that needs to be added to `gulp-config.json`:

	{
		"paths": {
			// ...
			"buildPrefix": "app",
			// ...

This is needed because when the site will get hosted by Nancy, it will be available at `{yoursite}/app`. So the injected path will be `/app/content/vendor.min.css`. In a minute I'll set up a static server using Node.js for testing the output.

The inject step now needs to be added to the `rev-and-inject` task pipeline:

	gulp.task('rev-and-inject', ['vendorcss'], function() {
		var indexPath = path.join(config.paths.source, 'index.html');

		var localInject = //...

		return gulp
			.src([].concat(indexPath))

			// inject into inject-vendor:css
			.pipe(localInject(
				path.join(config.paths.destination, 'content/css/vendor.min.css'),
				'inject-vendor'))

			.pipe(gulp.dest(config.paths.distribution))
	});

Now in `/src/client/index.html` we just need to replace the link to `bootstrap.min.css` to the `inject-vendor:css` placeholder:

	<title>Bootstrap 101 Template</title>

	<!-- inject-vendor:css -->
	<!-- endinject -->

Now, running `gulp build` should inject the correct path into `/src/client-dist/index.html`:

	<!-- inject-vendor:css -->
	<link rel="stylesheet" href="/app/content/vendor.min.css">
	<!-- endinject -->


### Use Node.js to serve the static website

At the moment the output is going to `/src/client-dist`. When the site is eventually hosted on Nancy it will be served from `/app`, so the injected paths currently all start with `/app`, which means that the build output can't be viewed properly yet. I'm going to set up a quick, static server to publish the site. More dependencies!

[`connect`](https://www.npmjs.com/package/connect)
	
	npm install --save-dev connect

> High performance middleware framework

[`serve-static`](https://www.npmjs.com/package/serve-static)

	npm install --save-dev serve-static
	
> Serve static files

Add the new dependencies at the top of `gulpfile.js`:

	var connect = require('connect');
	var serveStatic = require('serve-static');
	
Now add a new task:

	gulp.task('serve', function(){
		var sourcePath = path.join(__dirname, config.paths.destination);
		var port = 12857;
		var serveFromPath = '/' + config.paths.buildPrefix;

		log('Hosting ' + sourcePath + ' at http://localhost:' + port + serveFromPath);

		connect()
			.use(serveFromPath, serveStatic(sourcePath))
			.listen(port);
	});

Now running `gulp serve` will serve the static content from <http://localhost:12857/app>. I can leave that running in one console while rebuilding in another.

Interestingly, this way of serving a static site could probably be used all the way through to production, as the interaction with the server is all done on the client side via REST calls.


## Site-specific CSS

In `gulpfile.js` add a new `css` task:

	gulp.task('css', function() {
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
			.pipe(gulp.dest(path.join(config.paths.destination, 'content/css')));
	});

This is getting a bit familiar. Instead of using a set of explicit tasks from `gulp-config.json` I've just assumed that anything named `*.css` anywhere in the client should be injected into the static site distribution. The concatenated, minified output gets written to `/src/client-dist/content/site.min.css`. Now in the `rev-and-inject` task the `css` task needs to be added to the prerequisites:

	gulp.task('rev-and-inject', ['vendorcss', 'css'], function(){
		// ...

And the path to the new `site.min.css` needs to be injected (this goes after the `inject-vendor:css` injection):

	// inject into inject:css
	.pipe(localInject(
		path.join(config.paths.destination, 'content/css/site.min.css')))

Note that there is no name placeholder used. This will inject into the default `inject:css` placeholder, which needs to be added to `index.html` after the existing `inject-vendor:css` placeholder:

	<!-- inject:css -->
	<!-- endinject -->

Now if you add some CSS files to `/src/client` they will be injected into `index.html`.


## Vendor JavaScript

One more dependency:

[`gulp-uglify`](https://www.npmjs.com/package/gulp-uglify)

	npm install --save-dev gulp-uglify

> Minify files with UglifyJS.

Vendor JS is configured the same way vendor CSS is, in `gulp-config.json`:

		"vendorcss": [
			// ...
		],
		"vendorjs": [
			"bower_components/jquery/dist/jquery.js",
			"bower_components/bootstrap/dist/bootstrap.js"
		]

`uglify` is used instead of `minifyCss`. Add the dependency at the top of `gulpfile.js`:

	var uglify = require('gulp-uglify');

Now create the `vendorjs` task:

	gulp.task('vendorjs', function(){
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
			.pipe(gulp.dest(path.join(config.paths.destination, 'content/script')));
	});

In `rev-and-inject`, the `vendorcss` prerequisite task needs to be added:

	gulp.task('rev-and-inject', ['vendorcss', 'css', 'vendorjs'], function(){
		// ...	

And the newly minified `content/script/vendor.min.js` needs to be injected (after the `inject:css` injection):

	// inject into inject-vendor:js
	.pipe(localInject(
		path.join(config.paths.destination, 'content/script/vendor.min.js'),
		'inject-vendor'))

Now the `inject-vendor:css` placeholder needs to be added to `index.html` at the end of the `<body>` element:

	<!-- inject-vendor:css -->
	<!-- endinject -->


## Site-specific JavaScript

To support AngularJS, the site-specific JS task will need a couple of extra steps, but I'll leave that for the next post. Meanwhile, it will be similar to the site-specific CSS task, bundling and minifying all `*.js` files in `/src/client`.

	gulp.task('js', function() {
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
	 
			// write to dest/content/script
			.pipe(gulp.dest(path.join(config.paths.destination, 'content/script')));
	});

In `rev-and-inject`, the `js` prerequisite task needs to be added:

	gulp.task('rev-and-inject', ['vendorcss', 'css', 'vendorjs'], function(){
		// ...	

And `content/script/site.min.js` needs to be injected (after the `inject-vendor:js` injection):

	// inject into inject:js
	.pipe(localInject(
		path.join(config.paths.destination, 'content/script/site.min.js')))



