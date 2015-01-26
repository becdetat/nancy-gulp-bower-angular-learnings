using Autofac;
using Nancy;
using Nancy.Bootstrapper;
using Nancy.Bootstrappers.Autofac;
using Nancy.Conventions;

namespace TabManager.Server.AppStart
{
    public class Bootstrapper : AutofacNancyBootstrapper
    {
        protected override void ApplicationStartup(ILifetimeScope container, IPipelines pipelines)
        {
            
        }

        protected override void ConfigureRequestContainer(ILifetimeScope container, NancyContext context)
        {
            var builder = new ContainerBuilder();

            builder.RegisterAssemblyModules(new[]
            {
                typeof (Bootstrapper).Assembly
            });

            builder.Update(container.ComponentRegistry);
        }

        protected override void ConfigureConventions(NancyConventions nancyConventions)
        {



//#if DEBUG
//                nancyConventions.StaticContentsConventions.AddDirectory(@"/src/client", @"/src/client");
//                nancyConventions.StaticContentsConventions.AddDirectory(@"/bower_components", @"/bower_components");

//                nancyConventions.StaticContentsConventions.AddDirectory(@"/app/content", @"/src/client/content");
//                nancyConventions.StaticContentsConventions.AddDirectory(@"/app/images", @"/src/client/content/images");
//                nancyConventions.StaticContentsConventions.AddDirectory(@"/app", @"/src/client/app");

//                nancyConventions.ViewLocationConventions.Add((viewName, model, context) =>
//                {
//                    var viewPath = string.Concat(@"src/client", "/", viewName);
//                    return viewPath;
//                });
//#elif RELEASE
//                StaticConfiguration.DisableErrorTraces = false;

//                nancyConventions.StaticContentsConventions.AddDirectory(@"/app/content", @"/build/content");
//                nancyConventions.StaticContentsConventions.AddDirectory(@"/app/images", @"/build/fonts");
//                nancyConventions.StaticContentsConventions.AddDirectory(@"/app", @"/build");

//                nancyConventions.ViewLocationConventions.Add((viewName, model, context) =>
//                {
//                    var viewPath = string.Concat(@"build", "/", viewName);
//                    return viewPath;
//                });
//#endif
        }
    }
}