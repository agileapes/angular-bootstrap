angular.module('myApplication', ['buMain']);

describe("bu$registryFactory", function () {

    var registryFactoryProvider;

    beforeEach(function () {
        module('myApplication');
        angular.module('myApplication').config(function (bu$registryFactoryProvider) {
            registryFactoryProvider = bu$registryFactoryProvider;
        });
    });

    describe("when the defaults have not been changed", function () {

        it("instantiates a new registry given that the name is new", inject(function (bu$registryFactory) {
            var registry = bu$registryFactory("myRegistry");
            expect(registry).not.toBeUndefined();
            expect(registry).not.toBeNull();
        }));

        it("after a registry has been instantiated will return it again using '.get()'", inject(function (bu$registryFactory) {
            bu$registryFactory("myRegistry").someVariable = "someValue";
            var registry = bu$registryFactory.get("myRegistry");
            expect(registry).not.toBeUndefined();
            expect(registry).not.toBeNull();
            expect(registry.someVariable).not.toBeUndefined();
            expect(registry.someVariable).toBe("someValue");
        }));

        it("fails to create a factory whose name has been taken", inject(function (bu$registryFactory) {
            bu$registryFactory("myRegistry");
            expect(bu$registryFactory.bind(null, "myRegistry")).toThrow();
        }));

        it("fails to retrieve a factory which has not been instantiated", inject(function (bu$registryFactory) {
            expect(bu$registryFactory.get.bind(null, "myRegistry")).toThrow();
        }));

    });

    describe("when recreation has been turned on using '.allowRecreation()' on the provider", function () {

        it("will not throw an error if instantiation is done multiple times", function () {
            registryFactoryProvider.$get();
        });

        it("will override the object every time the instantiation routine through the bu$registryFactory(...) is called", function () {
            pending();
        });

    });

});