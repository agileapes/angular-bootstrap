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

        it("after a registry has been instantiated will return it again using `.get()`", inject(function (bu$registryFactory) {
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

    describe("when recreation has been turned on using `.allowRecreation(true)` on the provider", function () {

        var bu$registryFactory;

        beforeEach(function () {
            registryFactoryProvider.allowRecreation(true);
            bu$registryFactory = registryFactoryProvider.$get();
        });

        it("will not throw an error if instantiation is done multiple times", function () {
            bu$registryFactory("someRegistry");
            bu$registryFactory("someRegistry");
        });

        it("will override the object every time the instantiation routine through the `bu$registryFactory(...)` is called", function () {
            bu$registryFactory("someRegistry").someVariable = "someValue";
            expect(bu$registryFactory.get("someRegistry").someVariable).not.toBeUndefined();
            bu$registryFactory("someRegistry");
            expect(bu$registryFactory.get("someRegistry").someVariable).toBeUndefined();
        });

    });
    
    describe("when allowing init-on-demand through `.allowInitOnDemand(true)` on the provider", function () {

        var bu$registryFactory;

        beforeEach(function () {
            registryFactoryProvider.allowInitOnDemand(true);
            bu$registryFactory = registryFactoryProvider.$get();
        });

        it("can instantiate at point of usage", function () {
            expect(bu$registryFactory.get("someRegistry")).not.toBeUndefined();
        });
        
        it("will preserve the instance instantiated at first point of usage", function () {
            bu$registryFactory.get("someRegistry").someVariable = "someValue";
            expect(bu$registryFactory.get("someRegistry").someVariable).not.toBeUndefined();
        });
        
    });

});

describe("Registry", function () {

    var registry;
    var registryId = "buTest$registry";

    beforeEach((function () {
        module('myApplication');
        inject(function (bu$registryFactory) {
            registry = bu$registryFactory(registryId);
        });
    }));

    it("allows for adding and retrieving named items", function () {
        registry.register('first', 1);
        expect(registry.get('first')).toBe(1);
        expect(registry.get('second')).toBeUndefined();
    });

    it("returns a list of the names of all registered items", function () {
        registry.register('first', 1);
        registry.register('second', 2);
        var list = registry.list();
        expect(list).toContain('first');
        expect(list).toContain('second');
        expect(list.length).toBe(2);
    });

    it("lets you unregister a previously registered item", function () {
        registry.register('first', 1);
        expect(registry.get('first')).toBeDefined();
        registry.unregister('first');
        expect(registry.get('first')).toBeUndefined();
    });

    it("has information on itself", function () {
        registry.register('first', 1);
        expect(registry.info()).toEqual(jasmine.objectContaining({
            id: registryId,
            size: 1
        }));
    });

    it("allows for registering (`.on(...)`) and unregistering (`.off(...)`) event handlers for the `register` event", function () {
        var callback = jasmine.createSpy("eventListener");
        var callbackIndex = registry.on('register', callback);
        expect(callback).not.toHaveBeenCalled();
        registry.register('first', 1);
        expect(callback).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledWith('first', 1);
        expect(callback.calls.count()).toBe(1);
        registry.off('register', callbackIndex);
        registry.register('second', 2);
        expect(callback.calls.count()).toBe(1);
    });

    it("allows for registering (`.on(...)`) and unregistering (`.off(...)`) event handlers for the `unregister` event", function () {
        var callback = jasmine.createSpy("eventListener");
        var callbackIndex = registry.on('unregister', callback);
        expect(callback).not.toHaveBeenCalled();
        registry.unregister('first');
        expect(callback).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledWith('first', undefined);
        expect(callback.calls.count()).toBe(1);
        registry.off('unregister', callbackIndex);
        registry.unregister('second', 2);
        expect(callback.calls.count()).toBe(1);
    });

    it("allows for manipulating items at point of registration", function () {
        registry.on('register', function (id, item) {
            return item - 1;
        });
        registry.on('register', function (id, item) {
            return item * 2;
        });
        registry.register('item', 3);
        expect(registry.get('item')).toBe(4); //(3 - 1) * 2 == 4
    });

    it("allows triggering (`.trigger(...)`) and responding (`.on(...)`) to custom events", function () {
        var spy = jasmine.createSpy("eventHandler");
        registry.on('myEvent', spy);
        expect(spy).not.toHaveBeenCalled();
        registry.trigger('myEvent', 1, 2, 3);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(1, 2, 3);
    });

});