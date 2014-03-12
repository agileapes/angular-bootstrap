/**
 * Defining the "Error" class in case the browser does not support it.
 */
if (typeof Error == "undefined") {
    /**
     * Error class used as a catch all method for handing exceptions around
     * @param {string} message the message for the error
     * @param {string} [cause] the cause of the error
     * @constructor
     */
    function Error(message, cause) {
        this.message = message;
        this.cause = cause;
        this.toString = function () {
            return message;
        }
    }
}

/**
 * Evaluates the value of the string and treats it as a JavaScript expression
 * @param {string} expression
 * @param {boolean} [optional]
 * @returns {Object}
 */
function evaluateExpression(expression, optional) {
    try {
        return eval(expression);
    } catch (e) {
        if (!optional) {
            throw new Error("Failed to obtain the value of expression '" + expression + "'", e);
        }
        return null;
    }
}

/**
 * Starts the BootstrapUI framework with the dependencies injected via evaluation.
 */
(function (
    //A reference to the AngularJS framework's main instance
    angular,
    //Shorthand for window.jQuery
    $,
    //A global configuration object that will help startup the framework right
    globalConfig) {

    /**
     * Postpones the execution of the function until a later time or a given criteria is met.
     * @param [thisArg] {Object} the context of the parameter. Same as `thisArg` for Function.apply. Default is null.
     * @param [args] {Array} the parameters passed to the function. Same as `args` for Function.apply. Default is [].
     * @param [delay] {int|Function} a numeric delay in milliseconds, or
     * @param [timeout] {int} the expected time within which the call is supposed to happen. This is specially useful
     * in setting a limit for the time during which the scheduler is waiting for the dynamic condition to be met.
     * @param [action] {String} a human readable action descriptor
     * @returns {Function} the returned function object will be augmented with control method `then(success(function, result), failure(function, reason))`
     * which will enable the postponing caller to run an action when the scheduler fires the function.
     */
    Function.prototype.postpone = function (thisArg, args, delay, timeout, action) {
        if (typeof thisArg == "undefined") {
            thisArg = null;
        }
        if (typeof args == "undefined") {
            args = [];
        }
        if (typeof delay == "undefined") {
            delay = 0;
        }
        var func = this;
        var successQueue = [];
        var failureQueue = [];
        var done = function (func, result) {
            for (var i = 0; i < successQueue.length; i++) {
                var obj = successQueue[i];
                obj(func, result);
            }
        };
        var fail = function (failure) {
            for (var i = 0; i < failureQueue.length; i++) {
                var obj = failureQueue[i];
                obj(func, failure);
            }
        };
        func.then = function (success, failure) {
            if ($.isFunction(success)) {
                successQueue.push(success);
            }
            if ($.isFunction(failure)) {
                failureQueue.push(failure);
            }
            return func;
        };
        if ($.isFunction(delay)) {
            var stopped = false;
            var controller;
            func.stop = function () {
                stopped = true;
            };
            var interval = setInterval(function () {
                if (stopped) {
                    clearInterval(interval);
                    clearTimeout(controller);
                    fail("Stopped by user");
                    return;
                }
                if (delay()) {
                    clearInterval(interval);
                    clearTimeout(controller);
                    func.postpone(thisArg, args).then(done);
                }
            }, 10);
            if (timeout) {
                controller = setTimeout(function () {
                    clearInterval(interval);
                    clearTimeout(controller);
                    fail("Action timed out after " + timeout);
                    if (action) {
                        action = " '" + action + "'";
                    } else {
                        action = "";
                    }
                    BootstrapUI.tools.console.debug("Abandoning action" + action + " after " + timeout);
                }, timeout);
            }
        } else {
            func.stop = function () {
                clearTimeout(controller);
                fail("Stopped by user");
            };
            controller = setTimeout(function () {
                try {
                    done(func, func.apply(thisArg, args));
                } catch (e) {
                    fail(e.message ? e.message : e);
                }
            }, delay);
        }
        return this;
    };

    /**
     * Repeats the function call with the given delay.
     * @param {Object} [thisArg] the context of the parameter. Same as `thisArg` for Function.apply. Default is null.
     * @param {Array} [args] the parameters passed to the function. Same as `args` for Function.apply. Default is [].
     * @param {int} [delay] a non-negative, non-zero interval at which the function call will occur.
     * @returns {{count, stop, then}} A handler object that will allow you to control the scheduling as well as stop
     * the execution cycle.
     */
    Function.prototype.repeat = function (thisArg, args, delay) {
        if (typeof thisArg == "undefined") {
            thisArg = null;
        }
        if (typeof args == "undefined") {
            args = [];
        }
        if (typeof delay == "undefined") {
            delay = 1000;
        }
        if (delay <= 0) {
            delay = 1;
        }
        var func = this;
        var successQueue = [];
        var failureQueue = [];
        var done = function (func, result) {
            for (var i = 0; i < successQueue.length; i++) {
                var obj = successQueue[i];
                obj(func, result);
            }
        };
        var fail = function (func, reason) {
            for (var i = 0; i < failureQueue.length; i++) {
                var obj = failureQueue[i];
                obj(func, reason);
            }
        };
        var interval = null;
        var handler = {
            /**
             * The number of times the scheduler has fired the function since the beginning of its execution.
             */
            count: 0,
            /**
             * Stops the scheduled execution. This action will result in the failure callbacks being fired, and it also
             * clears all the fields of the handler. After calling this method, no other interaction with the handler is
             * possible.
             */
            stop: function () {
                clearInterval(interval);
                fail(func, "Stopped by user");
                delete handler.count;
                delete handler.stop;
            },
            /**
             * Schedules success and failure callbacks for the execution.
             * @param {Function} [success] Schedules success callback `success(function, result);`
             * @param {Function} [failure] Schedules failure callback `failure(function, reason);`
             */
            then: function (success, failure) {
                if ($.isFunction(success)) {
                    successQueue.push(success);
                }
                if ($.isFunction(failure)) {
                    failureQueue.push(failure);
                }
            }
        };
        interval = setInterval(function () {
            handler.count ++;
            var context = thisArg, parameters = args;
            if ($.isFunction(context)) {
                context = context(handler);
            }
            if ($.isFunction(parameters)) {
                parameters = parameters(handler);
            }
            func.postpone(context, parameters).then(done, fail);
        }, delay);
        return handler;
    };

    /**
     * Repeats the String the given number of times. '0' or a negative number returns an empty string.
     * @param times
     * @returns {String} the repetition of the string
     */
    String.prototype.repeat = function (times) {
        if (!times || times < 1) {
            times = 0;
        }
        var result = "";
        for (var i = 0; i < times; i ++) {
            result += this;
        }
        return result;
    };

    /**
     * Returns a copy of the string fixed to the given length. Should the string be originally smaller than the
     * specified length, it will be padded from the left or the right with the filler character. Should it be
     * larger than the specified length, though, it will be truncated.
     * @param {int} length the length
     * @param {String} [filler] default is " " (space character)
     * @param {boolean} [prepend] default is `true`. If set to false, the padding will occur from the right.
     * @returns {String} the fixed string
     */
    String.prototype.fix = function (length, filler, prepend) {
        if (typeof length != "number") {
            length = this.length;
        }
        if (typeof filler == "undefined") {
            filler = " ";
        }
        if (typeof prepend == "undefined") {
            prepend = true;
        }
        var str = this;
        if (str.length > length) {
            str = str.substring(0, length);
        } else if (str.length < length) {
            filler = filler.repeat(length - str.length);
            str = (prepend ? filler : "") + str + (!prepend ? filler : "");
        }
        return str;
    };

    /**
     * Returns a copy of the string with padding from the left and the right so that it is centered in a string of
     * the given length. If the length of the original string is more than the specified length, no change is done.
     * @param length
     * @returns {String}
     */
    String.prototype.center = function (length) {
        var str = this;
        if (str.length >= length) {
            return str;
        }
        return " ".repeat(Math.floor((length - str.length) / 2)) + str + " ".repeat(Math.ceil((length - str.length) / 2));
    };


    /**
     * The main instance of the framework, wherein all the namespaces are individually defined, but not populated.
     * @type {Object}
     */
    window.BootstrapUI = {
        version: "0.6",
        classes: {},
        tools: {},
        ext: {},
        config: {}
    };

    var toolkit = BootstrapUI;

    /**
     * Before doing anything else, we configure the framework and pre-apply any options
     */
    (function (config) {
        if (!config) {
            config = {};
        }
        if (!config.base) {
            config.base = ".";
        }
        if (!config.templateBase) {
            config.templateBase = "templates";
        }
        if (!config.directivesBase) {
            config.directivesBase = "js/directives";
        }
        if (!config.filtersBase) {
            config.filtersBase = "js/filters";
        }
        if (!config.namespace) {
            config.namespace = "";
        }
        if (!config.directives) {
            config.directives = [];
        }
        if (!config.filters) {
            config.filters = [];
        }
        if (!config.debug) {
            config.debug = false;
        }
        if (!config.ext) {
            config.ext = {};
        }
        if (typeof config.preloadAll == "undefined") {
            config.preloadAll = true;
        }
        if (!config.console) {
            config.console = {};
        }
        if (typeof config.console.replace == "undefined") {
            config.console.replace = false;
        }
        if (typeof config.console.preserve == "undefined") {
            config.console.preserve = config.console.replace;
        }
        if (typeof config.console.output == "undefined") {
            config.console.output = true;
        }
        if (!config.console.format) {
            config.console.format = "%s";
        }
        toolkit.config = config;
        //We attempt to configure any tool for which both a configuring method exists
        $.each(toolkit.tools, function (name, tool) {
            if ($.isFunction(tool.config)) {
                tool.config.apply(null, [config[name] ? config[name] : {}, toolkit]);
            }
        });
    })(globalConfig);

    toolkit.tools.loader = {};
    (function (loader) {
        loader.items = {};
        /**
         * Schedules the load of a new item. The actual loading has to be handled by the handler function
         * @param item
         * @param {Function} loadHandler
         */
        loader.schedule = function (item, loadHandler) {

        };
    })(toolkit.tools.loader);

    toolkit.classes.Directive = function (version, templateUrl, factory, requirements) {

    };

})(evaluateExpression("window.angular"), evaluateExpression("window.jQuery"), evaluateExpression("window.BootstrapUIConfig", true));