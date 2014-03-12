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
        var items = {};
        /**
         * Schedules the load of a new item. The actual loading has to be handled by the handler function
         * @param {string} item
         * @param {Function} loadHandler
         * @param {int} [timeout]
         */
        loader.schedule = function (item, loadHandler, timeout) {
            var deferred = loader.get(item, timeout);
            //if the promise has been fulfilled or if we are in the process of doing so we don't do anything more
            if (deferred.state() == "resolved" || deferred.initialized || (deferred.original && deferred.original.initialized)) {
                return deferred;
            }
            //This line prevents the loading handler being fired again if more than one loader is scheduled
            //for the same time before any of them can safely return
            deferred.initialized = true;
            //if the deferred has been wrapped with a timeout, we will still need to send the signal to the original
            if (deferred.original) {
                deferred.original.initialized = true;
            }
            var loaded = loadHandler(item, loader, toolkit);
            if (!loaded || !$.isFunction(loaded.then)) {
                throw new Error("The result of the load operation for " + item + " does not support the deferred or promise interface.");
            }
            loaded.then(function () {
                //we pass any arguments available to us after having the item load to the listening parties
                deferred.resolve.apply(deferred, arguments);
            });
            return deferred;
        };

        /**
         * Returns a promise that is resolved when the item is available (which might be immediately).
         * @param {string} item
         * @param {int} [timeout]
         * @returns {then:then}
         */
        loader.get = function (item, timeout) {
            if (!items[item]) {
                //If the item is not there yet, we return a promise that it will be there at some point
                items[item] = $.Deferred();
            }
            if (typeof timeout == "number") {
                return toolkit.tools.applyTimeout(items[item], timeout);
            }
            return items[item];
        };

        /**
         * Will load all the items given the load handler and then resolve the returned promise.
         *
         * @param {Function} loadHandler the load handler that will be used for all items.
         * @param {string} item the name of the item to be loaded
         * @param {string} [_]
         * @return {then:then}
         */
        loader.load = function (loadHandler, item, _) {
            var promises = [];
            for (var i = 1; i < arguments.length; i++) {
                var task = arguments[i];
                promises.push(loader.schedule(task, loadHandler));
            }
            console.log(promises);
            return toolkit.tools.promises(promises);
        };
    })(toolkit.tools.loader);

    /**
     * This function will take in a list of promises and return a promise that will be resolved when all of the given
     * promises have been satisfied. It will fail should any one of the promises fail. An optional timeout can be
     * specified that will be used to reject the promise when the timeout occurs.
     * @param {Array} items a list of promises which must be resolved
     * @param {int} [timeout] an optional timeout for the promises
     */
    toolkit.tools.promises = function (items, timeout) {
        var descriptor = $.Deferred();
        var pending = [];
        var count = 0;
        var failed = false;
        $(items).each(function (index) {
            var promise = this;
            //we first have to check the validity of the promises
            if (!promise || !promise.then || !$.isFunction(promise.then)) {
                throw new Error("Item " + index + " is not a promise");
            }
            var id = pending.length;
            //we keep count of how many items we expect to resolve first
            count ++;
            //then we keep track of the pending items
            pending.push({
                index: index,
                promise: promise
            });
            promise.then(function () {
                if (failed) {
                    return;
                }
                //if the promise is resolved and no timeout has occurred we count one down.
                pending[id] = null;
                count --;
                descriptor.notify.apply(descriptor, arguments);
            }, function () {
                //if the promise has failed we tell the listeners of the occurrence
                pending[id].rejection = arguments;
                descriptor.reject("A general error has occurred", pending);
            });
        });
        //we check for status every time the descriptor is notified
        descriptor.progress(function () {
            //if the promise has already timed out we don't check any further
            if (failed) {
                descriptor.reject("Timed out waiting for promises to resolve", pending);
                return;
            }
            //if there are no more promises we consider the matter resolved
            if (count == 0) {
                descriptor.resolve();
            }
        });
        //if a timeout has been set, we should honor it.
        if (typeof timeout == "number") {
            var timeoutHandle = setTimeout(function () {
                failed = true;
                descriptor.notify();
            }, timeout);
            //if the descriptor is resolved prior to the timeout handle going off, we should cancel the timeout
            descriptor.then(function () {
                clearTimeout(timeoutHandle);
            });
        }
        return descriptor;
    };

    /**
     * Applies a timeout to a given deferred object
     */
    toolkit.tools.applyTimeout = function (deferred, timeout) {
        var result = $.Deferred();
        result.original = deferred;
        deferred.then(function () {
            result.resolve.apply(result, arguments);
        }, function () {
            result.reject.apply(result, arguments);
        });
        var timeoutHandle = setTimeout(function () {
            deferred.reject("Timed out");
        }, timeout);
        result.then(function () {
            clearTimeout(timeoutHandle);
        });
        return result;
    };

    toolkit.classes.Directive = function (version, templateUrl, factory, requirements) {
        this.version = version;
        this.templateUrl = toolkit.classes.Directive.path(templateUrl);
        this.factory = function ($injector) {
            var directive = $injector.invoke(factory);
        };
    };

})(evaluateExpression("window.angular"), evaluateExpression("window.jQuery"), evaluateExpression("window.BootstrapUIConfig", true));