'use strict';

describe("Function.prototype.bind([{*} context], [{*} parameters*])", function () {

    var f = jasmine.createSpy("function");

    it("should provide a default context should none be provided", function () {
        var context = {
            name: "Context"
        };
        var bound = f.bind(context);
        bound.call(null);
        expect(f).toHaveBeenCalled();
        expect(f.calls.mostRecent()).toEqual({
            object: context,
            args: []
        });
    });

    it("should provide initial arguments", function () {
        f.bind(null, 1, 2, 3)(4, null);
        expect(f).toHaveBeenCalled();
        expect(f).toHaveBeenCalledWith(1, 2, 3, 4, null);
    });

});

describe("function evaluateExpression({string} expression) {}", function () {

    beforeEach(function () {
        this.target = {
            value: 1
        };
    });

    it("should not throw when evaluating a valid expression", function () {
        expect(evaluateExpression.bind(this, "this.target.value", false)).not.toThrow();
    });

    it("should return the value of an expression if it is valid", function () {
        expect(evaluateExpression.call(this, "this.target")).toEqual(jasmine.objectContaining({
            value: 1
        }));
    });

    it("should throw en error when evaluating the value of an invalid expression", function () {
        expect(evaluateExpression.bind(this, "this.target2", false)).toThrow();
    });

    it("should not throw an error when evaluating the value of an optional invalid expression", function () {
        expect(evaluateExpression.bind(this, "this.target2", true)).not.toThrow();
    });

    it("should return 'null' when evaluating an optional invalid expression", function () {
        expect(evaluateExpression.call(this, "this.target2", true)).toBeNull();
    });

});

describe('Function.prototype.postpone([{*} thisArg], [{array} arguments], [{int|Function} delay], [{int} timeout], [{string} descriptor])', function () {

    var f;

    beforeEach(function () {
        f = jasmine.createSpy("function");
        jasmine.clock().install();
    });

    afterEach(function () {
        jasmine.clock().uninstall();
    });

    it('should result in the function being called', function () {
        f.postpone();
        jasmine.clock().tick(1);
        expect(f).toHaveBeenCalled();
    });

    it('should result in the function having received its arguments', function () {
        f.postpone(null, [1, 2, 3]);
        jasmine.clock().tick(1);
        expect(f).toHaveBeenCalledWith(1, 2, 3);
    });

    it('should result in the function having received its context', function () {
        var callContext = {
            someProperty: "someValue"
        };
        f.postpone(callContext, [1, 2, 3]);
        jasmine.clock().tick(1);
        expect(f.calls.mostRecent()).toEqual({
            object: callContext,
            args: [1, 2, 3]
        });
    });

    it('should be triggered after the given delay time', function () {
        f.postpone(null, [], 100);
        expect(f).not.toHaveBeenCalled();
        jasmine.clock().tick(50);
        expect(f).not.toHaveBeenCalled();
        jasmine.clock().tick(49);
        expect(f).not.toHaveBeenCalled();
        jasmine.clock().tick(1);
        expect(f).toHaveBeenCalled();
    });

    it('should not be called unless the controller function tells it that it should', function () {
        var run = false;
        f.postpone(null, [], function () {
            return run;
        });
        expect(f).not.toHaveBeenCalled();
        run = true;
        expect(f).not.toHaveBeenCalled();
        //10 for the controller check interval + 1 for the function to be executed = 11
        jasmine.clock().tick(11);
        expect(f).toHaveBeenCalled();
    });

    it('should run its success callbacks in order', function () {
        var result = [];
        var success = jasmine.createSpy("success", function () {
            result.push(result.length + 1);
        }).and.callThrough();
        var failure = jasmine.createSpy("failure");
        f.postpone(null, [], 0)
            .then(success, failure)
            .then(success, failure);
        expect(f).not.toHaveBeenCalled();
        expect(result.length).toEqual(0);
        jasmine.clock().tick(1);
        expect(f).toHaveBeenCalled();
        expect(result.length).not.toEqual(0);
        expect(result).toEqual([1, 2]);
        expect(success).toHaveBeenCalled();
        expect(success.calls.count()).toEqual(2);
        expect(failure).not.toHaveBeenCalled();
    });

    it("should honor its timeout and run failure callbacks when timeout occurs", function () {
        var result = [];
        var success = jasmine.createSpy("success", function () {
            //pushes 1, 2, ...
            result.push(result.length + 1);
        }).and.callThrough();
        var failure = jasmine.createSpy("failure", function () {
            //pushes -1, -2, ...
            result.push(-(result.length + 1));
        }).and.callThrough();
        f.postpone(null, [], 3000, 2000)
            .then(success, failure)
            .then(success, failure);
        expect(f).not.toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();
        expect(failure).not.toHaveBeenCalled();
        jasmine.clock().tick(2500);
        expect(failure).toHaveBeenCalled();
        expect(failure.calls.count()).toEqual(2);
        expect(success).not.toHaveBeenCalled();
        jasmine.clock().tick(1000);
        expect(f).not.toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();
        expect(result).toEqual([-1, -2]);
    });

    it("should honor timeout and run failure callbacks when timeout occurs during execution with non-deterministic delay", function () {
        var result = [];
        var success = jasmine.createSpy("success", function () {
            //pushes 1, 2, ...
            result.push(result.length + 1);
        }).and.callThrough();
        var failure = jasmine.createSpy("failure", function () {
            //pushes -1, -2, ...
            result.push(-(result.length + 1));
        }).and.callThrough();
        var run = false;
        f.postpone(null, [], function () {
            return run;
        }, 2000)
            .then(success, failure)
            .then(success, failure);
        expect(f).not.toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();
        expect(failure).not.toHaveBeenCalled();
        jasmine.clock().tick(2500);
        expect(failure).toHaveBeenCalled();
        expect(failure.calls.count()).toEqual(2);
        expect(success).not.toHaveBeenCalled();
        jasmine.clock().tick(1000);
        run = true;
        jasmine.clock().tick(100);
        expect(f).not.toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();
        expect(result).toEqual([-1, -2]);
    });

    it("should allow for the user to stop the execution when the delay is deterministic", function () {
        var result = [];
        var success = jasmine.createSpy("success", function () {
            //pushes 1, 2, ...
            result.push(result.length + 1);
        }).and.callThrough();
        var failure = jasmine.createSpy("failure", function () {
            //pushes -1, -2, ...
            result.push(-(result.length + 1));
        }).and.callThrough();
        var handler = f.postpone(null, [], 100)
            .then(success, failure)
            .then(success, failure);
        expect(f).not.toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();
        expect(failure).not.toHaveBeenCalled();
        jasmine.clock().tick(60);
        handler.stop();
        jasmine.clock().tick(20);
        expect(success).not.toHaveBeenCalled();
        expect(failure).toHaveBeenCalled();
        expect(failure.calls.count()).toEqual(2);
        jasmine.clock().tick(60);
        expect(handler.stop).toBeUndefined();
        expect(f).not.toHaveBeenCalled();
    });

    it("should allow for the user to stop the execution when the delay is non-deterministic", function () {
        var result = [];
        var success = jasmine.createSpy("success", function () {
            //pushes 1, 2, ...
            result.push(result.length + 1);
        }).and.callThrough();
        var failure = jasmine.createSpy("failure", function () {
            //pushes -1, -2, ...
            result.push(-(result.length + 1));
        }).and.callThrough();
        var run = false;
        var handler = f.postpone(null, [], function () {
            return run;
        })
            .then(success, failure)
            .then(success, failure);
        expect(f).not.toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();
        expect(failure).not.toHaveBeenCalled();
        jasmine.clock().tick(60);
        run = true;
        handler.stop();
        jasmine.clock().tick(20);
        expect(success).not.toHaveBeenCalled();
        expect(failure).toHaveBeenCalled();
        expect(failure.calls.count()).toEqual(2);
        jasmine.clock().tick(60);
        expect(handler.stop).toBeUndefined();
        expect(f).not.toHaveBeenCalled();
    });

    it("should run failure callbacks if the method throws an exception", function () {
        var f = jasmine.createSpy("function").and.throwError();
        var success = jasmine.createSpy("success");
        var failure = jasmine.createSpy("failure");
        f.postpone().then(success, failure);
        expect(f).not.toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();
        expect(failure).not.toHaveBeenCalled();
        jasmine.clock().tick(100);
        expect(f).toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();
        expect(failure).toHaveBeenCalled();
    });

});

describe("Function.prototype.repeat([{*} thisArg], [{array} arguments], [{int} interval])", function () {

    var f;

    beforeEach(function () {
        f = jasmine.createSpy("function");
        jasmine.clock().install();
    });

    afterEach(function () {
        jasmine.clock().uninstall();
    });

    it("should receive the specified context", function () {
        var context = {
            someProperty: "some value"
        };
        f.repeat(context, [], 100);
        expect(f).not.toHaveBeenCalled();
        jasmine.clock().tick(101);
        expect(f).toHaveBeenCalled();
        expect(f.calls.mostRecent()).toEqual({
            object: context,
            args: []
        });
    });

    it("should receive the specified arguments through the call", function () {
        f.repeat(null, [1, 2, 3], 100);
        expect(f).not.toHaveBeenCalled();
        jasmine.clock().tick(101);
        expect(f).toHaveBeenCalled();
        expect(f).toHaveBeenCalledWith(1, 2, 3);
    });

    it("should repeat the execution of the function so long as the timer goes on", function () {
        f.repeat(null, [], 10);
        expect(f).not.toHaveBeenCalled();
        for (var i = 0; i < 5; i ++) {
            jasmine.clock().tick(11);
            expect(f).toHaveBeenCalled();
            expect(f.calls.count()).toEqual(i + 1);
        }
    });
    
    it("should expose the number of times it has been called through count()", function () {
        var count = 0;
        f.repeat(null, [], 10).then(function () {
            count ++;
        });
        expect(f).not.toHaveBeenCalled();
        for (var i = 0; i < 100; i ++) {
            jasmine.clock().tick(11);
            expect(f).toHaveBeenCalled();
            expect(count).toEqual(f.calls.count());
        }
    });

    it("should execute success callbacks at each call", function () {
        var success = jasmine.createSpy("success");
        var failure = jasmine.createSpy("failure");
        f.repeat(null, [], 10).then(success, failure);
        expect(f).not.toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();
        expect(failure).not.toHaveBeenCalled();
        jasmine.clock().tick(1000);
        expect(success).toHaveBeenCalled();
        expect(failure).not.toHaveBeenCalled();
        expect(success.calls.count()).toEqual(f.calls.count());
    });

    it("should execute failure callbacks at each failed call", function () {
        var success = jasmine.createSpy("success");
        var failure = jasmine.createSpy("failure");
        f.and.throwError().repeat(null, [], 10).then(success, failure);
        expect(f).not.toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();
        expect(failure).not.toHaveBeenCalled();
        jasmine.clock().tick(1000);
        expect(success).not.toHaveBeenCalled();
        expect(failure).toHaveBeenCalled();
        expect(failure.calls.count()).toEqual(f.calls.count());
    });

    it("should allow users to stop the repetition", function () {
        var success = jasmine.createSpy("success");
        var failure = jasmine.createSpy("failure");
        var handle = f.repeat(null, [], 10).then(success, failure);
        expect(f).not.toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();
        expect(failure).not.toHaveBeenCalled();
        expect(handle.count()).toEqual(0);
        jasmine.clock().tick(1001); //1000 for all the calls, 1 for the postponing inside the repeat
        expect(failure).not.toHaveBeenCalled();
        expect(success).toHaveBeenCalled();
        expect(f).toHaveBeenCalled();
        expect(success.calls.count()).toEqual(f.calls.count());
        expect(handle.count()).toEqual(f.calls.count());
        var count = handle.count();
        handle.stop();
        jasmine.clock().tick(1000);
        expect(handle.stop).toBeUndefined();
        expect(handle.then).toBeUndefined();
        expect(handle.count).toBeUndefined();
        expect(f.calls.count()).toEqual(count);
        expect(success.calls.count()).toEqual(count);
        expect(failure).toHaveBeenCalled();
        expect(failure.calls.count()).toEqual(1);
        expect(failure.calls.mostRecent().args[1]).toMatch(/stopped/i);
    });

});

describe("String.prototype.repeat({int} times)", function () {

    it("should return the empty string if the number of times required is negative", function () {
        expect("something".repeat(-1)).toEqual("");
    });

    it("should return the empty string if the repetition number is zero", function () {
        expect("something".repeat(0)).toEqual("");
    });

    it("should return the string itself if the repetition number is one", function () {
        var text = "something";
        expect(text.repeat(1)).toEqual(text);
    });

    it("should return the properly repeated string", function () {
        var text = "something";
        expect(text.repeat(3)).toEqual(text + text + text);
    });

});

describe("String.prototype.fix({int} length, [{string} filler = ' '], [{boolean} prepend = true])", function () {

});