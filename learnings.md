Set up gulp / bower workflow with Nancy in an ASP.NET container

## Create the folder structure

`/src`, `/src/client`, `/src/server`

`/src/client` will contain the artifacts needed for gulp/bower - HTML, images, css, client-side JS and server-side JS used to compule the client into a static site (which will be copied into the Nancy project as a build artifact).

`/src/server` will contain the 'traditional' .NET server, ie. the Nancy project, test projects, other projects. Basically whatever is needed to run the server except for the static site (which gets copied here as an artifact from the Gulp build).


## Set up the server

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



2. Create 