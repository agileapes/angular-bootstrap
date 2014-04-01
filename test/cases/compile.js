angular.module("myApplication", ["buMain"]);

describe("bu$compile service", function () {

    beforeEach(function () {
        //changing the test root to be <DIV#testRoot/> instead of <HTML/>
        var body = angular.element(document.documentElement).find("body");
        body.append("<div id='testRoot'></div>");
        var testRoot = document.getElementById("testRoot");
        angular.module("myApplication")
            .value("$rootElement", angular.element(testRoot));
        //loading module
        module("myApplication");
    });

    afterEach(function () {
        //cleaning up the test root
        var testRoot = document.getElementById("testRoot");
        testRoot.parentNode.removeChild(testRoot);
    });

    it("fails to be invoked if no directive name has been provided", inject(function (bu$compile) {
        expect(bu$compile.bind(null, undefined)).toThrowError("Directive name cannot be empty: " + undefined);
        expect(bu$compile.bind(null, null)).toThrowError("Directive name cannot be empty: " + null);
        expect(bu$compile.bind(null, "")).toThrowError("Directive name cannot be empty: " + "");
    }));

    it("fails to be invoked if a factory is not provided and this is the first usage", inject(function (bu$compile) {
        var directiveName = "directive";
        expect(bu$compile.bind(null, directiveName)).toThrowError("No previous description was found for directive " + directiveName);
    }));

    it("will not fail if invoked with only the name after the first time", inject(function (bu$compile) {
        var directiveName = "myDirective";
        bu$compile(directiveName, function () {
            return {};
        });
        expect(bu$compile.bind(null, directiveName)).not.toThrow();
    }));

    it("returns a compile function `function (root, compileFunction) {...}`", inject(function (bu$compile) {
        var compile = bu$compile("myDirective", function () {
            return {};
        });
        expect(compile).not.toBeUndefined();
        expect(angular.isFunction(compile)).toBeTruthy();
    }));

    it("registers a directive with the `bu$directiveRegistry` registry", inject(function (bu$registryFactory, bu$compile) {
        var registry = bu$registryFactory.get("bu$directiveRegistry");
        expect(registry).not.toBeUndefined();
        expect(registry.list()).toEqual([]);
        bu$compile("myDirective", function () {
            return {};
        });
        expect(registry.list()).toEqual(["myDirective"]);
    }));

});