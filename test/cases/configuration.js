angular.module('myApplicationModule', ["buMain"]);

describe("BootstrapUI's configuration", function () {

    var configurationProvider;

    beforeEach(function () {
        module('myApplicationModule');
        angular.module('myApplicationModule').config(function (bu$configurationProvider) {
            configurationProvider = bu$configurationProvider;
        });
    });

    it("allows for accessing properties using named indices `config(...)`", inject(function (bu$configuration) {
        expect(bu$configuration("namespace")).not.toBeUndefined();
    }));

    it("allows for modifying properties using named indices `config(..., ...)`", inject(function (bu$configuration) {
        expect(bu$configuration("something.random")).toBeUndefined();
        bu$configuration("something.random", "value");
        expect(bu$configuration("something.random")).toBe("value");
    }));

    describe("when no external change has been applied", function () {

        it("is applied when no external change has been made", inject(function (bu$configuration) {
            expect(bu$configuration).not.toBeNull();
        }));

        it("will set base location to the current directory `config.base`", inject(function (bu$configuration) {
            expect(bu$configuration.base).toBe(".");
        }));

        it("sets the location for directive JavaScript files `config.directivesBase`", inject(function (bu$configuration) {
            expect(bu$configuration.directivesBase).toBe("js/directives");
        }));

        it("sets the location for filter JavaScript files `config.filtersBase`", inject(function (bu$configuration) {
            expect(bu$configuration.filtersBase).toBe("js/filters");
        }));

        it("sets the location of templates `config.templatesBase`", inject(function (bu$configuration) {
            expect(bu$configuration.templatesBase).toBe("templates");
        }));

        it("sets the default HTML tag <namespace:*/> to ui `config.namespace`", inject(function (bu$configuration) {
            expect(bu$configuration.namespace).toBe("ui");
        }));

        it("expects no additional directives to be loaded `config.directives`", inject(function (bu$configuration) {
            expect(bu$configuration.directives).toEqual([]);
        }));

        it("expects no additional filters ot be loaded `config.filters`", inject(function (bu$configuration) {
            expect(bu$configuration.filters).toEqual([]);
        }));

        it("sets the debug mode to 'false' `config.debug`", inject(function (bu$configuration) {
            expect(bu$configuration.debug).toBe(false);
        }));

        it("expects all directives to be preloaded `config.preloadAll`", inject(function (bu$configuration) {
            expect(bu$configuration.preloadAll).toBe(true);
        }));

        it("sets up namespace for extensions to be configured `config.ext`", inject(function (bu$configuration) {
            expect(bu$configuration.ext).not.toBeUndefined();
        }));

        it("sets up namespace for tools to be configured `config.tools`", inject(function (bu$configuration) {
            expect(bu$configuration.tools).not.toBeUndefined();
        }));

    });

    describe("when a call to `bu$configurationProvider.reset()` is made", function () {

        it("preserves all essential configurations", function () {
            configurationProvider.reset();
            bu$configuration = configurationProvider.$get();
            expect(bu$configuration.x).toBeUndefined();
            expect(bu$configuration).not.toBeNull();
            expect(bu$configuration.base).toBe(".");
            expect(bu$configuration.directivesBase).toBe("js/directives");
            expect(bu$configuration.filtersBase).toBe("js/filters");
            expect(bu$configuration.templatesBase).toBe("templates");
            expect(bu$configuration.namespace).toBe("ui");
            expect(bu$configuration.directives).toEqual([]);
            expect(bu$configuration.filters).toEqual([]);
            expect(bu$configuration.debug).toBe(false);
            expect(bu$configuration.preloadAll).toBe(true);
            expect(bu$configuration.ext).not.toBeUndefined();
            expect(bu$configuration.tools).not.toBeUndefined();
        });

        it("removes any preset changes to the configuration", function () {
            configurationProvider.set({
                something: "hello"
            });
            var configuration = configurationProvider.$get();
            expect(configuration.something).not.toBeUndefined();
            configurationProvider.reset();
            configuration = configurationProvider.$get();
            expect(configuration.something).toBeUndefined();
        });

    });

    describe("when working with tools (through the `bu$toolRegistry` service)", function () {

        it("configures loaded tools by calling to their `.configure(...)` method", inject(function (bu$toolRegistry) {
            configurationProvider.set({
                tools: {
                    myTool: {
                        key: 'value'
                    }
                }
            });
            var myTool = {
                configure: jasmine.createSpy("configurator")
            };
            bu$toolRegistry.register("myTool", myTool);
            expect(myTool.configure).toHaveBeenCalled();
            expect(myTool.configure).toHaveBeenCalledWith({
                key: 'value'
            });
        }));

        it("reruns configurator methods when being refreshed", inject(function (bu$toolRegistry) {
            configurationProvider.set({
                tools: {
                    myTool: {
                        key: 'value'
                    }
                }
            });
            var myTool = {
                configure: jasmine.createSpy("configurator")
            };
            bu$toolRegistry.register("myTool", myTool);
            expect(myTool.configure).toHaveBeenCalled();
            bu$toolRegistry.reconfigure();
            expect(myTool.configure.calls.count()).toBe(2);
        }));

    });

});
