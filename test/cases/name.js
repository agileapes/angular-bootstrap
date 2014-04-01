angular.module("myApplication", ["buMain"]);

describe("bu$name.directive()", function () {

    var configProvider;

    beforeEach(function () {
        module('myApplication');
        angular.module('myApplication').config(function (bu$configurationProvider) {
            configProvider = bu$configurationProvider;
        });
    });

    it("uses the configuration service to determine which namespace prefix to use", inject(function (bu$name) {
        configProvider.set({
            namespace: "custom"
        });
        expect(bu$name.directive('sample')).toBe('customSample');
    }));

    it("uses the directive name when there is no namespace", inject(function (bu$name) {
        configProvider.set({
            namespace: ""
        });
        expect(bu$name.directive('sample')).toBe('sample');
    }));

    it("preserves the camel case convention", inject(function (bu$name) {
        configProvider.set({
            namespace: "namespace-prefix"
        });
        expect(bu$name.directive('myDirective')).toBe('namespacePrefixMyDirective');
    }));

});

describe("bu$name.normalize()", function () {

    beforeEach(module('myApplication'));

    it("strips the FIRST 'x-' prefix", inject(function (bu$name) {
        expect(bu$name.normalize('x-test')).toBe('test');
        expect(bu$name.normalize('x-x-test')).toBe('xTest');
    }));

    it("strips the FIRST 'data-' prefix", inject(function (bu$name) {
        expect(bu$name.normalize('data-test')).toBe('test');
        expect(bu$name.normalize('data-data-test')).toBe('dataTest');
    }));

    it("strips 'data-' OR 'x-' prefix", inject(function (bu$name) {
        expect(bu$name.normalize('data-x-test')).toBe('xTest');
        expect(bu$name.normalize('x-data-test')).toBe('dataTest');
    }));

    it("converts any given value into camel case", inject(function (bu$name) {
        expect(bu$name.normalize('some-long-directive-name')).toBe('someLongDirectiveName');
    }));

    it("honors colon as well as dash prefix", inject(function (bu$name) {
        expect(bu$name.normalize('some:long-directive:name')).toBe('someLongDirectiveName');
    }));

});

describe("bu$name.domNames", function () {

    beforeEach(module('myApplication'));

    it("includes the simple dash separated name", inject(function (bu$name) {
        expect(bu$name.domNames('myDirective')).toContain('my-directive');
    }));

    it("includes the simple dash separated name with an optional namespace as the first term", inject(function (bu$name) {
        expect(bu$name.domNames('myDirective')).toContain('my:directive');
    }));

    it("includes the 'x-' prefix version", inject(function (bu$name) {
        expect(bu$name.domNames('myDirective')).toContain('x-my-directive');
    }));

    it("includes the 'data-' prefix version", inject(function (bu$name) {
        expect(bu$name.domNames('myDirective')).toContain('data-my-directive');
    }));

});