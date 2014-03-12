/**
 * Will return the value of the given expression if it does not throw an exception.
 * This is particularly useful for detecting the existence of dependencies.
 * @param variable
 * @returns {*}
 */
function ifDefined(variable) {
    try {
        return eval(variable);
    } catch (e) {
        return null;
    }
}

/**
 * Loads the BootstrapUI object into the `window` namespace.
 * This allows for injection of jQuery, AngularJS, as well as the BoostrapUIConfig object into the system.
 */
(function ($, angular, config) {

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
     * Proxies the calls using a parent container. This way, if an event is triggered on an object inside container "A",
     * which could be identified with selector "B", we could add handlers to it using `$("A").on.proxy("event", "B", handler);`
     * Detaching handlers attached using this method is the same as detaching handlers attached via `jQuery.on`.
     * @param event the event to which we want to listen
     * @param selector the selector applied to the target
     * @param callback the callback being attached
     * @returns {jQuery} jQuery selector on the parent container
     */
    $.fn.on.proxy = function (event, selector, callback) {
        if (!callback) {
            if (!selector || !$.isFunction(selector)) {
                callback = function () {};
            } else if ($.isFunction (selector)) {
                callback = selector;
            }
            selector = "*";
        }
        var $this = $(this);
        $this.on(event, function (event) {
            var args = arguments;
            $(event.target).filter(selector).each(function () {
                callback.apply(this, args);
            });
        });
        return $this;
    };

    /**
     * Forwards specified events of the specified types occurring for the selected elements to the recipient proxy object
     * @param {HTMLElement|jQuery} proxy the proxy object receiving the events
     * @param {string} event the event name(s)
     * @param {string} [_] optional event names
     * @returns {jQuery}
     */
    $.fn.on.forward = function (proxy, event, _) {
        var $this = $(this);
        var events = arguments;
        $this.each(function () {
            var target = $(this);
            $(events).each(function (index) {
                if (index == 0) {
                    return;
                }
                target.on(this, function () {
                    var args = [];
                    var event = arguments[0];
                    if (arguments.length > 1) {
                        for (var i = 1; i < arguments.length; i ++) {
                            args.push(arguments[i]);
                        }
                    }
                    console.error(proxy.jquery);
                    $(proxy).trigger(event, args);
                });
            });
        });
        return $this;
    };

    //*****
    // Preconfiguring the scope
    //*****
    if (!$) {
        alert("BootstrapUI requires jQuery");
    }
    if (!angular) {
        alert("BootstrapUI requires AngularJS");
    }
    if (!config) {
        config = {};
    }

    //*****
    // Defining the actual BootstrapUI singleton class here
    //*****

    /**
     * The BootstrapUI main scope declared
     */
    window.BootstrapUI = {
        /**
         * Current version of the BoostrapUI as loaded with the window context
         */
        version: "0.5.1",
        /**
         * Different component types registered with the BootstrapUI framework
         */
        types: {},
        /**
         * Namespace reserved for tools (a)synchronously registered with the context so that they are made
         * available to other users
         */
        tools: {},
        /**
         * Classes exposing features for to the components are registered in this namespace
         */
        classes: {},
        /**
         * All directives loaded asynchronously via the framework are registered in this namespace
         */
        directives: {},
        /**
         * This is a namespace reserved for filters loaded to the framework
         */
        filters: {},
        /**
         * This is a special namespace reserved for use by extensions to the framework
         */
        ext: {}
    };

    //*****
    // Classes
    //*****

    /**
     * State class which is quite handy in creating complex event objects and allowing for conditional behaviour
     * @param [initializer] the public fields and methods of the state object
     * @param [privates] the private fields and methods of the state object
     * @constructor
     */
    BootstrapUI.classes.State = function (initializer, privates) {
        if (!privates) {
            privates = {};
        }
        var key, storage = [];
        var $this = this;
        var init = function () {
            var target = this;
            if ($.isFunction(target)) {
                //noinspection JSUnfilteredForInLoop
                $this[key] = function () {
                    return target.apply(privates, arguments);
                };
                return;
            }
            //noinspection JSUnfilteredForInLoop
            $this[key] = target;
        };
        for (key in initializer) {
            //noinspection JSUnfilteredForInLoop
            init.apply(initializer[key], []);
        }
        /**
         * Stores a value in the internal storage
         * @param key
         * @param value
         */
        this.set = function (key, value) {
            storage[key] = value;
        };
        /**
         * Retrieves a value from the internal storage
         * @param key
         * @param defaultValue
         * @returns {*}
         */
        this.get = function (key, defaultValue) {
            if (typeof defaultValue == "undefined") {
                defaultValue = null;
            }
            if (storage[key]) {
                return storage[key];
            }
            return defaultValue;
        };
        /**
         * Triggers an event on the given target object, passing itself as the state parameter
         * @param target
         * @param event
         * @returns {BootstrapUI.classes.State}
         */
        this.trigger = function (target, event) {
            $(target).trigger(event, [$this]);
            return $this;
        };
        /**
         * Executes the callback if the condition holds. Condition can be either a boolean expression or
         * a lambda.
         * @param condition
         * @param callback
         * @returns {BootstrapUI.classes.State}
         */
        this.when = function (condition, callback) {
            if (typeof condition == "boolean") {
                if (!condition) {
                    return $this;
                }
            } else {
                if (!condition($this)) {
                    return $this;
                }
            }
            callback($this);
            return $this;
        };
    };

    /**
     * A class representing a new directive
     * @param {String} version the version of the directive
     * @param {String} [url] the URL to the template
     * @param {Function} [factory] the directive calculation lambda (optional)
     * @param {Array} [requirements] the directives that this directive's template rely on.
     * @constructor
     */
    BootstrapUI.classes.Directive = function (version, url, factory, requirements) {
        this.isDirective = true;
        this.version = version;
        this.templateUrl = config.base + "/" + config.templateBase + "/" + url + ".html";
        this.requirements = $.isArray(requirements) ? requirements : [];
        if ($.isFunction(url) && typeof factory == "undefined") {
            factory = url;
            url = null;
            this.templateUrl = null;
        }
        this.factory = factory ? factory : function () {
            return {};
        };
    };

    /**
     * Returns the qualified name of the given directive for the framework. This is usually given by
     * adding the namespace related prefix to the raw name of the directive
     * @param {string} name
     * @returns {string}
     */
    BootstrapUI.classes.Directive.qualify = function (name) {
        if (config.namespace == "") {
            return name;
        } else {
            return config.namespace + name[0].toUpperCase() + name.substring(1);
        }
    };

    /**
     * Returns the tag name that can be used in the HTML document by the user, given the
     * raw normalized directive name.
     * @param {String} name
     * @returns {String}
     */
    BootstrapUI.classes.Directive.tag = function (name) {
        var tagName = name.replace(/[A-Z]/g, function (match) {
            return "-" + match.toLowerCase();
        });
        if (config.namespace != "") {
            tagName = config.namespace + ":" + tagName;
        }
        return tagName;
    };

    /**
     * Helper class for creating new filters
     * @param version the version of the filter
     * @param factory the factory method for the given filter
     * @constructor
     */
    BootstrapUI.classes.Filter = function (version, factory) {
        this.isFilter = true;
        this.version = version;
        this.factory = factory ? factory : function () {
            return function (input) {
                return input;
            };
        };
    };

    /**
     * TemplateCache class that should be registered as a service with the module to provide template interception.
     * @param $http AngularJS HTTP service
     * @param $cacheFactory AngularJS cache factory
     * @constructor
     */
    BootstrapUI.classes.TemplateCache = function ($http, $cacheFactory) {
        var self = this;
        var templateCache = $cacheFactory("buTemplateCache");
        this.info = function () {
            return templateCache.info();
        };
        this.put = function (key, template) {
            templateCache.put(key, template);
        };
        this.remove = function (key) {
            templateCache.remove(key);
        };
        this.removeAll = function () {
            templateCache.removeAll();
        };
        this.destroy = function () {
            templateCache.destroy();
        };
        this.get = function (key) {
            return $http.get(key, {
                cache: templateCache
            }).then(function (result) {
                for (var i = 0; i < BootstrapUI.classes.TemplateCache.interceptors.length; i++) {
                    var interceptor = BootstrapUI.classes.TemplateCache.interceptors[i];
                    var returned = interceptor.apply(self, [result.data, key]);
                    if (returned) {
                        result.data = returned;
                    }
                }
                return result;
            });
        };
    };

    BootstrapUI.classes.TemplateCache.interceptors = [];

    /**
     * This tool will generate a range builder for the given specifications
     * @param {int} from the low number of the range
     * @param {int} [to] the maximum number of the range. Default is `from+1`
     * @param {int} [current] current number in the range around which the range is built. Default is `from`.
     * @param {int} [show] The number of items in the created range. This number is made so that the current item
     * is in the center, unless the centering throws the range outside the boundaries, in which case it will be
     * adjusted to be compliant with the constraints. Default is to let the range contain all the items within the
     * specified boundaries.
     * @returns {{from: number, to: number, expand: expand}} Calling the expand function will result in an array
     * containing all the items in the range, as per the given specification.
     */
    BootstrapUI.tools.range = function (from, to, current, show) {
        if (!to) {
            to = from + 1;
        }
        if (!current) {
            current = from;
        }
        if (!show) {
            show = to - from + 1;
        }
        if (show > to - from + 1) {
            show = to - from + 1;
        }
        from = parseInt(from);
        to = parseInt(to);
        current = parseInt(current);
        show = parseInt(show);
        var before = Math.floor(show / 2);
        var after = Math.ceil(show / 2) - 1;
        if (current + after + 1 > to) {
            before += current + after - to;
            after = to - current;
        }
        if (current - before < from) {
            after += before - current + 1;
            before = current - from;
        }
        var output = {
            from: current - before,
            to: current + after,
            expand: function () {
                var result = [];
                for (var i = output.from; i < output.to + 1; i++) {
                    result.push(i);
                }
                return result;
            }
        };
        return output;
    };

    /**
     * This is an action queue that will hold actions in named queues until the given queue is triggered.
     * @see fail
     * @see perform
     * @see notify
     */
    BootstrapUI.tools.actionQueue = {
        /**
         * Namespace for the queues to be registered. In case of memory leaks, it always
         * pays to check this namespace to see if there are any dangling tasks waiting to be executed without
         * any hope of reaching the execution state.
         */
        requests: {},
        /**
         * Registry for failures occurring via the push/load system.
         */
        failures: {},
        /**
         * A registry for the timeout interval handlers to be registered.
         */
        timeouts: {},
        /**
         * Notifies the queue that it is safe to executed all actions and dispose of the associated queue
         * @param {String} queue the fully qualified name of the queue
         */
        notify: function (queue) {
            if (!BootstrapUI.tools.actionQueue.requests[queue]) {
                return;
            }
            if (BootstrapUI.tools.actionQueue.timeouts[queue]) {
                clearTimeout(BootstrapUI.tools.actionQueue.timeouts[queue]);
            }
            var actions = BootstrapUI.tools.actionQueue.requests[queue];
            BootstrapUI.tools.console.debug("Running actions associated with queue <" + queue + "/>");
            delete BootstrapUI.tools.actionQueue.requests[queue];
            for (var i = 0; i < actions.length; i++) {
                var func = actions[i];
                func.postpone();
            }
        },
        /**
         * Performs the given action if the criteria set by the controller is met, otherwise the action is
         * scheduled for the queue to be notified.
         * @param {Function} controller the criteria controller
         * @param {String} queue the name of the target queue
         * @param {Function} action the action to be performed
         * @param {int} [timeout] the timeout allowed for the queue to be notified, prior to considering the
         * action to have been failed. Default is 5000ms.
         */
        perform: function (controller, queue, action, timeout) {
            if (typeof timeout != "number") {
                timeout = 5000;
            }
            if (!$.isFunction(controller) || controller(queue)) {
                action.postpone();
                return;
            }
            BootstrapUI.tools.console.debug("Postponing action until queue trigger <" + queue + "/> becomes available");
            if (!BootstrapUI.tools.actionQueue.requests[queue]) {
                BootstrapUI.tools.actionQueue.requests[queue] = [];
            }
            if (!BootstrapUI.tools.actionQueue.timeouts[queue]) {
                BootstrapUI.tools.actionQueue.timeouts[queue] = setTimeout(function () {
                    BootstrapUI.tools.console.error("Timeout waiting for queue <" + queue + "/> to be triggered.");
                    BootstrapUI.tools.actionQueue.requests[queue] = [];
                    delete BootstrapUI.tools.actionQueue.requests[queue];
                    if (BootstrapUI.tools.actionQueue.failures[queue]) {
                        $(BootstrapUI.tools.actionQueue.failures[queue]).each(function () {
                            this();
                        });
                    }
                    delete BootstrapUI.tools.actionQueue.failures[queue];
                }, timeout);
            }
            BootstrapUI.tools.actionQueue.requests[queue].push(action);
        },
        /**
         * Registers a failure handler callback for the given queue. These will be called in the order in which
         * they have been registered should the queue time out.
         * @param {string} queue
         * @param {Function} handler
         */
        fail: function (queue, handler) {
            if (!BootstrapUI.tools.actionQueue.failures[queue]) {
                BootstrapUI.tools.actionQueue.failures[queue] = [];
            }
            BootstrapUI.tools.actionQueue.failures[queue].push(handler);
        }
    };

    /**
     * A console wrapper for the browser, which will enable extensive logging even if the browser does not support a
     * console interface.
     * @see replace
     */
    BootstrapUI.tools.console = {
        /**
         * A reference to the actual console used by the browser
         */
        browserConsole: console,
        /**
         * Flag that determines whether or not messages passed to this console should be preserved for
         * later inspection. Handy for debugging, but not memory-efficient for production.
         */
        preserve: false,
        /**
         * The format for the log messages dumped to the console.
         */
        format: "%s",
        /**
         * Flag determining whether or not messages passed to this console should be sent through to the browser's
         * console as well
         */
        output: true,
        /**
         * Flag determining whether or not this console has replaced the browser console
         */
        replaced: false,
        /**
         * Namespace for the messages sent to the console
         */
        messages: {
            /**
             * Log level messages
             */
            log: [],
            /**
             * Debug level messages
             */
            debug: [],
            /**
             * Warning level messages
             */
            warn: [],
            /**
             * Info level messages
             */
            info: [],
            /**
             * Error level messages
             */
            error: [],
            /**
             * Function that will flush all the augmented messages to the browser's console
             */
            flush: function () {
                if (BootstrapUI.tools.console.browserConsole) {
                    var messages = [];
                    $(["log", "debug", "warn", "info", "error"]).each(function () {
                        var level = this;
                        $(BootstrapUI.tools.console.messages[level]).each(function () {
                            messages.push($.extend(this, {
                                level: level
                            }));
                        });
                        BootstrapUI.tools.console.messages[level].length = 0;
                    });
                    messages.sort(function (first, second) {
                        return first.time < second.time;
                    });
                    var loggers = {};
                    $(messages).each(function () {
                        var message = this;
                        if (!loggers[message.level]) {
                            loggers[message.level] = BootstrapUI.tools.console.proxy("BootstrapUI.tools.console.browserConsole." + message.level);
                        }
                        var logger = loggers[message.level];
                        logger(message.toString());
                    });
                } else {
                    throw "No console to flush to";
                }
            }
        },
        /**
         * Replaces the browser's console with the BootstrapUI console.
         */
        replace: function () {
            BootstrapUI.tools.console.replaced = true;
            window.console = BootstrapUI.tools.console;
        },
        /**
         * Returns a log handler for the given log level
         * @param {string} logger one of log, warn, debug, error, and info.
         * @returns {Function}
         */
        handler: function (logger) {
            var level = logger;
            logger = BootstrapUI.tools.console.proxy("BootstrapUI.tools.console.browserConsole." + logger);
            return function () {
                if (!config.debug) {
                    return arguments;
                }
                for (var i = 0; i < arguments.length; i++) {
                    var argument = arguments[i];
                    var message = {
                        time: new Date(),
                        message: argument,
                        toString: function () {
                            return BootstrapUI.tools.console.format
                                .replace("%s", this.message)
                                .replace("%t", this.time.getTime())
                                .replace("%y", this.time.getYear() + 1900)
                                .replace("%m", this.time.getMonth().toString().fix(2, "0"))
                                .replace("%d", this.time.getDate().toString().fix(2, "0"))
                                .replace("%H", this.time.getHours().toString().fix(2, "0"))
                                .replace("%M", this.time.getMinutes().toString().fix(2, "0"))
                                .replace("%S", this.time.getSeconds().toString().fix(2, "0"))
                                .replace("%l", this.time.getMilliseconds().toString().fix(3, "0"))
                                .replace("%l", this.time.getMilliseconds().toString().fix(2, "0"))
                                .replace("%L", level.toUpperCase().center(5))
                        }
                    };
                    if (BootstrapUI.tools.console.preserve) {
                        BootstrapUI.tools.console.messages[level].push(message);
                    }
                    if (BootstrapUI.tools.console.output && BootstrapUI.tools.console.browserConsole) {
                        logger(message.toString());
                    }
                }
                return arguments.length == 1 ? arguments[0] : arguments;
            }
        },
        /**
         * Returns a proxy method that will call to the underlying method if it is available and does nothing otherwise.
         * @param {string} target
         * @returns {Object}
         */
        proxy: function (target) {
            eval("function proxy(x) {try {eval('" + target + "');} catch (e) {return;}" + target + "(x);}");
            return eval("proxy");
        }
    };
    BootstrapUI.tools.console.log = BootstrapUI.tools.console.handler("log");
    BootstrapUI.tools.console.debug = BootstrapUI.tools.console.handler("debug");
    BootstrapUI.tools.console.warn = BootstrapUI.tools.console.handler("warn");
    BootstrapUI.tools.console.info = BootstrapUI.tools.console.handler("info");
    BootstrapUI.tools.console.error = BootstrapUI.tools.console.handler("error");

    /**
     * Configures the Bootstrap UI for use with initial parameters
     * @param config
     */
    BootstrapUI.configure = function (config) {
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
        BootstrapUI.tools.console.preserve = config.console.preserve;
        BootstrapUI.tools.console.output = config.console.output;
        BootstrapUI.tools.console.format = config.console.format;
        if (config.console.replace) {
            BootstrapUI.tools.console.replace();
        }
        BootstrapUI.preloader.directive(config.directives);
        BootstrapUI.preloader.filter(config.filters);
        if (config.preloadAll) {
            BootstrapUI.preloader.directive("breadcrumb", "buttonGroup", "container", "dropdown", "form", "icon", "inputGroup", "pagination", "panel", "alert", "popover", "image", "progressBar", "label", "badge", "button");
            BootstrapUI.preloader.filter("range", "capitalize", "capitalizeFirst");
        }
        BootstrapUI.config = config;
    };

    /**
     * A preloader that will load items via AJAX and perform predesignated actions if specified.
     */
    BootstrapUI.preloader = {
        /**
         * The preloaded items
         */
        items: {},
        /**
         * Path qualifiers for each given component types. All custom types must register a qualifier here, or hand
         * in a qualified path with each instance of component descriptors.
         */
        qualifiers: {
            /**
             * Path qualifier for the directives. Will look into `config.directiveBase`
             * @param {string} name
             * @returns {string}
             */
            directive: function (name) {
                return config.base + "/" + config.directivesBase + "/" + name + ".js";
            },
            /**
             * Path qualifier for the directives. Will look into `config.filtersBase`
             * @param {string} name
             * @returns {string}
             */
            filter: function (name) {
                return config.base + "/" + config.filtersBase + "/" + name + ".js";
            }
        },
        /**
         * Qualifies the path to the given component. If the component has specified a `path` property intrinsically,
         * that is given the most precedence. If not, it will try to look at `preloader.qualifiers` for a qualifier for
         * the given component type. If that fails as well, returns `null` and logs an error.
         * @param {object} component
         * @returns {string}
         */
        qualify: function (component) {
            if (component.path) {
                return component.path;
            } else if (BootstrapUI.preloader.qualifiers[component.type]) {
                component.path = BootstrapUI.preloader.qualifiers[component.type](component.name);
                return component.path;
            } else {
                BootstrapUI.tools.console.error("Failed to resolve path for component " + component.name);
                return null;
            }
        },
        /**
         * Adds a new component to the preloader's queue. The item has to specify a name as well as a type.
         * @param {object} item
         * @returns {BootstrapUI.preloader}
         */
        add: function (item) {
            if ($.isArray(item)) {
                $(item).each(function () {
                    BootstrapUI.preloader.add(this);
                });
                return BootstrapUI.preloader;
            }
            if (BootstrapUI.preloader.items[item.name]) {
                BootstrapUI.preloader.items[item.name] = $.extend(BootstrapUI.preloader.items[item.name], item);
            } else {
                BootstrapUI.preloader.items[item.name] = item;
            }
            return BootstrapUI.preloader;
        },
        /**
         * Registers directives of the given name.
         * @param {string} name
         * @param {string} [_]
         * @returns {BootstrapUI.preloader}
         */
        directive: function (name, _) {
            if ($.isArray(name)) {
                $(name).each(function () {
                    BootstrapUI.preloader.directive(this);
                });
                return BootstrapUI.preloader;
            } else if (arguments.length > 1) {
                $(arguments).each(function () {
                    BootstrapUI.preloader.directive(this);
                });
                return BootstrapUI.preloader;
            }
            return BootstrapUI.preloader.add({
                name: name,
                type: "directive"
            });
        },
        /**
         * Registers filters of the given name.
         * @param {string} name
         * @param {string} [_]
         * @returns {Object} a jQuery promised which will be resolved when all the given items have been
         * loaded.
         */
        filter: function (name, _) {
            if ($.isArray(name)) {
                $(name).each(function () {
                    BootstrapUI.preloader.filter(this);
                });
                return BootstrapUI.preloader;
            } else if (arguments.length > 1) {
                $(arguments).each(function () {
                    BootstrapUI.preloader.filter(this);
                });
                return BootstrapUI.preloader;
            }
            return BootstrapUI.preloader.add({
                name: name,
                type: "filter"
            });
        },
        /**
         * Returns the component object for the given name, if it exists, otherwise, it first creates a prototypical
         * object and returns that.
         * @param {string} name
         * @returns {Object}
         */
        get: function (name) {
            if (BootstrapUI.preloader.items[name]) {
                return BootstrapUI.preloader.items[name];
            } else {
                BootstrapUI.preloader.items[name] = {
                    name: name
                };
                return BootstrapUI.preloader.items[name];
            }
        },
        /**
         * Loads all queued objects, unless they have been loaded already. Objects can signal their loading by
         * either being automatically loaded via `load`, or by calling `register` with their name.
         * @param {string|Array} [name] the name of the component to be called. Could be an array of names. Alternatively, you could
         * path in multiple names as arguments. Name prefixes are also acceptable, such as `form.*` which wil load.
         * If no name is specified, the preloader will try to load all items.
         * all registered items whose name starts with `form.`.
         * @returns {BootstrapUI.preloader}
         */
        load: function (name) {
            var deferred = $.Deferred();
            var promise = deferred.promise;
            deferred.promise = function () {
                var result = promise();
                var then = promise.then;
                promise.then = function (done, failed, progress) {
                    then(done, failed, progress);
                    return BootstrapUI.preloader;
                };
                return result;
            };
            var components;
            if (/\.\*$/.test(name)) {
                name = name.substring(0, name.length - 2);
                components = [];
                $.each(BootstrapUI.preloader.items, function (current) {
                    if (current.length > name.length && current.substring(0, name.length) == name) {
                        components.push(current);
                    }
                });
                return BootstrapUI.preloader.load(components);
            }
            if (typeof name == "undefined") {
                components = [];
                $.each(BootstrapUI.preloader.items, function (name) {
                    components.push(name);
                });
                return BootstrapUI.preloader.load(components);
            } else if ($.isArray(name)) {
                var pending = {};
                var result = {};
                var resolved = name.length;
                var remaining = name.length;
                if (name.length == 0) {
                    deferred.resolve(result);
                }
                $(name).each(function () {
                    pending[this] = BootstrapUI.preloader.get(this);
                    BootstrapUI.preloader.load(this).done(function (name, loaded) {
                        remaining --;
                        resolved --;
                        deferred.notify({
                            name: name,
                            loaded: loaded,
                            remaining: remaining,
                            resolved: resolved
                        });
                        result[name] = {
                            name: name,
                            loaded: loaded
                        };
                        delete pending[name];
                    }).fail(function (name, reason) {
                        remaining --;
                        deferred.notify({
                            name: name,
                            remaining: remaining,
                            resolved: resolved,
                            error: reason
                        });
                        pending[name].error = reason;
                    }).always(function () {
                        if (remaining == 0) {
                            if (resolved == 0) {
                                deferred.resolve(result);
                            } else {
                                deferred.reject(pending);
                            }
                        }
                    });
                });
                return deferred.promise();
            }
            if (!BootstrapUI.preloader.items[name]) {
                deferred.reject(name, "Unknown component");
            } else {
                var component = BootstrapUI.preloader.items[name];
                if (component.loaded) {
                    if (component.loading) {
                        BootstrapUI.tools.console.log("Component already scheduled to be loaded: " + name);
                        component.loading.success(function () {
                            if (component.loaded) {
                                deferred.resolve(name, false);
                            } else {
                                deferred.reject(name, component.loadError);
                            }
                        });
                    } else {
                        BootstrapUI.tools.console.log("Component already loaded: " + name);
                        deferred.resolve(name, false);
                    }
                } else {
                    component.loaded = true;
                    component.loading = $.ajax({
                        url: BootstrapUI.preloader.qualify(component),
                        dataType: "text",
                        global: false,
                        success: function (data) {
                            try {
                                eval(data);
                            } catch (e) {
                                component.loadError = e.message ? e.message : e;
                                component.loaded = false;
                                delete component.loading;
                                BootstrapUI.tools.console.debug(e);
                                deferred.reject(name, component.loadError);
                                return;
                            }
                            BootstrapUI.tools.console.log("Loaded component " + name);
                            deferred.resolve(name, true);
                            delete component.loading;
                        },
                        error: function (xhr, error) {
                            deferred.reject(name, error);
                        }
                    });
                }
            }
            return deferred.promise();
        }
    };

    BootstrapUI.loader =

    /**
     * Registers the given component with the preloader.
     * @param {string} [component] the fully qualified name of the component. Optional, but strongly advised.
     * @param {function} factory the factory dispensing the component. factory is of the form `factory(registry,
     * BootstrapUI.classes.Directive.tag, BootstrapUI.classes, BootstrapUI.tools)`, wherein registry is a clean
     * object into which components must be added as properties.
     */
    BootstrapUI.register = function (component, factory) {
        if (!factory && $.isFunction(component)) {
            factory = component;
            component = null;
        } else if ($.isFunction(component)) {
            component = component();
        }
        if (!component) {
            BootstrapUI.tools.console.warn("Component does not specify any names. Caching will not work properly.");
        }
        BootstrapUI.preloader.get(component).loaded = true;
        var registry = {};
        factory.apply(registry, [registry, BootstrapUI.classes.Directive.tag, BootstrapUI.classes, BootstrapUI.tools]);
        $.each(registry, function (simpleName, value) {
            if (value.isDirective) {
                if (BootstrapUI.directives[BootstrapUI.classes.Directive.qualify(simpleName)]) {
                    return;
                }
                if (value.requirements.length > 0) {
                    BootstrapUI.preloader.directive(value.requirements).load();
                }
                BootstrapUI.directives[BootstrapUI.classes.Directive.qualify(simpleName)] = value.factory;
                BootstrapUI.tools.console.debug("Registered directive: " + simpleName);
            } else if (value.isFilter) {
                if (BootstrapUI.filters[simpleName]) {
                    return;
                }
                BootstrapUI.filters[simpleName] = value.factory;
                BootstrapUI.tools.console.debug("Registered filter: " + simpleName);
            } else if (value.getType && $.isFunction(value.getType) && BootstrapUI.types[value.getType()] && $.isFunction(BootstrapUI.types[value.getType()])) {
                BootstrapUI.types[value.getType()].apply(null, [simpleName, value]);
            } else {
                BootstrapUI.tools.console.error("Unknown component discovered " + simpleName);
            }
        });
    };

    /**
     * Will bootstrap the UI on the given root element. Bootstrapping results in event `ui.ready` to be triggered, which
     * can be used to bind events to UI elements loaded dynamically. This event is not triggered unless all components
     * scheduled via the preloader are loaded successfully
     * @param {HTMLElement} root optional, assumed to be `document` if not provided
     */
    BootstrapUI.bootstrap = function (root) {
        BootstrapUI.tools.console.debug("Bootstrapping the UI ...");
        if (!root) {
            root = document;
        }
        if (root.uiBootstrapped) {
            throw "This element has been already bootstrapped";
        }
        root.uiBootstrapped = true;
        loader.done(function () {
            new BootstrapUI.classes.State({
                bind: function (module, callback) {
                    module.service("$templateCache", BootstrapUI.classes.TemplateCache);
                    BootstrapUI.tools.console.debug("Binding the directives ...");
                    module.directive(BootstrapUI.directives);
                    BootstrapUI.tools.console.debug("Binding the filters ...");
                    module.filter(BootstrapUI.filters);
                    BootstrapUI.tools.console.debug("Bootstrapping AngularJS for module '" + module.name + "' ...");
                    angular.bootstrap(this.applicationRoot, [module.name]);
                    BootstrapUI.tools.console.debug("All ready.");
                    if ($.isFunction(callback)) {
                        callback.apply(this, [module]);
                    }
                }
            }, {
                directives: BootstrapUI.directives,
                filters: BootstrapUI.filters,
                applicationRoot: root
            }).trigger(root, "ui.ready");
        });
    };
    BootstrapUI.configure(config);
    var loader;
    /**
     * Automatically bootstraps applications which have the `data-boostrapui` attribute on their `HTML` tag.
     * Applications used with BootstrapUI must not contain an `ng-app` in the portion of the DOM they want to
     * use for components loaded via BoostrapUI.
     * If `data-boostrapui` is not placed on the HTML tag, BootstrapUI.bootstrap() must be called manually at
     * the appropriate time to let BootstrapUI directives attach to the AngularJS application.
     */
    (function () {
        loader = BootstrapUI.preloader.load();
        BootstrapUI.classes.TemplateCache.interceptors.push(function (template, key) {
            return template.replace(/bootstrapui:/g, config.namespace ? (config.namespace + ":") : "");
        });
        $(function () {
            $("html[data-bootstrapui]").each(function () {
                BootstrapUI.tools.console.debug("Auto-bootstrap starting ...");
                BootstrapUI.bootstrap(this);
            });
        });
    }).postpone();

})(ifDefined("jQuery"), ifDefined("angular"), ifDefined("BootstrapUIConfig"));