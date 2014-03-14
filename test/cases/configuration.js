describe("BootstrapUI.config's bare minimum", function () {

    it("is applied when BootstrapUIConfig is not present", function () {
        expect(BootstrapUI.config).not.toBeNull();
        expect(BootstrapUI.config).not.toBeUndefined();
    });

    it("will set base location to the current directory (config.base)", function () {
        expect(BootstrapUI.config.base).toEqual(".");
    });

    it("sets the location for directive JavaScript files (config.directivesBase)", function () {
        expect(BootstrapUI.config.directivesBase).toEqual("js/directives");
    });

    it("sets the location for filter JavaScript files (config.filtersBase)", function () {
        expect(BootstrapUI.config.filtersBase).toEqual("js/filters");
    });

    it("sets the location of templates (config.templatesBase)", function () {
        expect(BootstrapUI.config.templatesBase).toEqual("templates");
    });

    it("sets the default HTML tag <namespace:*/> to ui (config.namespace)", function () {
        expect(BootstrapUI.config.namespace).toEqual("ui");
    });

    it("expects no additional directives to be loaded (config.directives)", function () {
        expect(BootstrapUI.config.directives).toEqual([]);
    });

    it("expects no additional filters ot be loaded (config.filters)", function () {
        expect(BootstrapUI.config.filters).toEqual([]);
    });

    it("sets the debug mode to 'false' (config.debug)", function () {
        expect(BootstrapUI.config.debug).toBeFalsy();
    });

    it("expects all directives to be preloaded (config.preloadAll)", function () {
        expect(BootstrapUI.config.preloadAll).toBeTruthy();
    });

    it("sets up namespace for extensions to be configured (config.ext)", function () {
        expect(BootstrapUI.config.ext).toEqual({});
    });

    it("sets up namespace for tools to be configured (config.tools)", function () {
        expect(BootstrapUI.config.tools).toEqual({});
    });

    it("will not be upset if we reconfigure without providing the necessary fields", function () {
        BootstrapUI.configure({});
        expect(BootstrapUI.config).not.toBeNull();
        expect(BootstrapUI.config).not.toBeUndefined();
        expect(BootstrapUI.config.base).toEqual(".");
    });

    it("will not override existing tool-based configuration", function () {
        BootstrapUI.configure({
            tools: {
                firstTool: {
                    firstValue: "1"
                }
            }
        });
        BootstrapUI.configure({
            tools: {
                secondTool: {
                    secondValue: "2"
                }
            }
        });
        expect(BootstrapUI.config.tools).toEqual(jasmine.objectContaining({
            firstTool: {
                firstValue: "1"
            },
            secondTool: {
                secondValue: "2"
            }
        }));
    });


    it("will not override existing extension configuration", function () {
        BootstrapUI.configure({
            ext: {
                firstExtension: {
                    firstValue: "1"
                }
            }
        });
        BootstrapUI.configure({
            ext: {
                secondExtension: {
                    secondValue: "2"
                }
            }
        });
        expect(BootstrapUI.config.ext).toEqual(jasmine.objectContaining({
            firstExtension: {
                firstValue: "1"
            },
            secondExtension: {
                secondValue: "2"
            }
        }));
    });

    it("will override settings if a call to reconfigure() is placed", function () {
        BootstrapUI.configure({
            tools: {
                firstTool: {
                    firstValue: "1"
                }
            }
        });
        expect(BootstrapUI.config.tools).toEqual(jasmine.objectContaining({
            firstTool: {
                firstValue: "1"
            }
        }));
        BootstrapUI.configure({
            tools: {
                secondTool: {
                    secondValue: "2"
                }
            }
        });
        expect(BootstrapUI.config.tools).toEqual(jasmine.objectContaining({
            firstTool: {
                firstValue: "1"
            },
            secondTool: {
                secondValue: "2"
            }
        }));
        BootstrapUI.configure({
            tools: {
                thirdTool: {
                    thirdValue: "3"
                }
            }
        });
        expect(BootstrapUI.config.tools).toEqual(jasmine.objectContaining({
            thirdTool: {
                thirdValue: "3"
            }
        }));
        expect(BootstrapUI.config.firstValue).toBeUndefined();
        expect(BootstrapUI.config.secondValue).toBeUndefined();
    });
});

describe("BootstrapUI's tool-based configuration", function () {

    beforeEach(function () {
        BootstrapUI.reconfigure();
    });

    it("configures loaded tools by calling to their configure() method", function () {
        var extension = {
            tools: {
                myTool: {
                    configure: jasmine.createSpy("toolConfigurator")
                }
            }
        };
        expect(extension.tools.myTool.configure).not.toHaveBeenCalled();
        BootstrapUI.extend(extension);
        expect(extension.tools.myTool.configure).toHaveBeenCalled();
        expect(extension.tools.myTool.configure).toHaveBeenCalledWith({});
        var configuration = {
            firstValue: "1",
            secondValue: "2"
        };
        BootstrapUI.configure({
            tools: {
                myTool: configuration
            }
        });
        expect(extension.tools.myTool.configure.calls.mostRecent()).toEqual(jasmine.objectContaining({
            args: [configuration]
        }));
        expect(extension.tools.myTool.configure.calls.count()).toEqual(2);
    });

    it("loads in the configuration for extensions, but does not call any additional callbacks", function () {
        var extension = {
            ext: {
                myExtension: {
                    configure: jasmine.createSpy("toolConfigurator")
                }
            }
        };
        expect(extension.ext.myExtension.configure).not.toHaveBeenCalled();
        BootstrapUI.extend(extension);
        expect(extension.ext.myExtension.configure).not.toHaveBeenCalled();
        var configuration = {
            firstValue: "1",
            secondValue: "2"
        };
        BootstrapUI.configure({
            ext: {
                myExtension: configuration
            }
        });
        expect(extension.ext.myExtension.configure).not.toHaveBeenCalled();
    });

});