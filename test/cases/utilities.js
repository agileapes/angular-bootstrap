'use strict';

describe("Function.prototype.bind([context], [parameters*])", function () {

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

describe("function evaluateExpression(expression) {}", function () {

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

    it("Should throw en error when evaluating the value of an invalid expression", function () {
        expect(evaluateExpression.bind(this, "this.target2", false)).toThrow();
    });

    it("Should not throw an error when evaluating the value of an optional invalid expression", function () {
        expect(evaluateExpression.bind(this, "this.target2", true)).not.toThrow();
    });

    it("Should return 'null' when evaluating an optional invalid expression", function () {
        expect(evaluateExpression.call(this, "this.target2", true)).toBeNull();
    });

});

describe('Function.prototype.postpone(thisArg, arguments, delay, timeout, descriptor)', function () {

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

});