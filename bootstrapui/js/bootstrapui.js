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
            return message + (this.cause ? "\ncaused by: " + this.cause : "");
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
        var object = eval(expression);
        if (typeof object == "undefined") {
            //noinspection ExceptionCaughtLocallyJS
            throw new Error("Object not defined: " + expression);
        }
        return  object;
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
(function (//A reference to the AngularJS framework's main instance
           angular, //A reference to the jQuery instance loaded prior to this
           $) {
    'use strict';

    //Stub for when the bind method has not been provided via the browser
    if (!Function.prototype.bind) {
        /**
         * Binds the current function with the given context so that if no context is provided, then this context
         * and the given replacement arguments can be used.
         * @param {Object} [context] the context to use as default
         * @param {*} [_] the arguments to use if needed
         * @returns {Function}
         */
        Function.prototype.bind = function (context, _) {
            var args = [];
            var func = this;
            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            return function () {
                var currentArgs = [];
                var i;
                for (i = 0; i < args.length; i++) {
                    currentArgs.push(args[i]);
                }
                for (i = 0; i < arguments.length; i++) {
                    currentArgs.push(arguments[i]);
                }
                func.apply(this && this != window ? this : context, currentArgs);
            };
        };
    }

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
            if (angular.isFunction(success)) {
                successQueue.push(success);
            }
            if (angular.isFunction(failure)) {
                failureQueue.push(failure);
            }
            return func;
        };
        var stopped = null;
        if (angular.isFunction(delay)) {
            var failed = false;
            var controller;
            func.stop = function () {
                delete func.stop;
                stopped = "Stopped by user";
            };
            var interval = setInterval(function () {
                if (stopped) {
                    if (failed) {
                        return;
                    }
                    failed = true;
                    clearInterval(interval);
                    clearTimeout(controller);
                    fail(stopped);
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
                    stopped = "Action timed out after " + timeout;
                    if (action) {
                        action = " '" + action + "'";
                    } else {
                        action = "";
                    }
                }, timeout);
            }
        } else {
            stopped = false;
            func.stop = function () {
                delete func.stop;
                stopped = true;
                clearTimeout(callController);
                fail("Stopped by user");
            };
            var callController = setTimeout(function () {
                if (stopped) {
                    return;
                }
                try {
                    done(func, func.apply(thisArg, args));
                } catch (e) {
                    fail(e.message ? e.message : e);
                }
            }, delay);
            if (timeout) {
                controller = setTimeout(function () {
                    clearTimeout(controller);
                    clearTimeout(callController);
                    if (stopped) {
                        return;
                    }
                    fail("Action timed out after " + timeout);
                    if (action) {
                        action = " '" + action + "'";
                    } else {
                        action = "";
                    }
                }, timeout);
            }
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
        var count = 0;
        var handler = {
            /**
             * The number of times the scheduler has fired the function since the beginning of its execution.
             */
            count: function () {
                return count;
            },
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
                delete handler.then;
            },
            /**
             * Schedules success and failure callbacks for the execution.
             * @param {Function} [success] Schedules success callback `success(function, result);`
             * @param {Function} [failure] Schedules failure callback `failure(function, reason);`
             */
            then: function (success, failure) {
                if (angular.isFunction(success)) {
                    successQueue.push(success);
                }
                if (angular.isFunction(failure)) {
                    failureQueue.push(failure);
                }
                return handler;
            }
        };
        interval = setInterval(function () {
            var context = thisArg, parameters = args;
            if (angular.isFunction(context)) {
                context = context(handler);
            }
            if (angular.isFunction(parameters)) {
                parameters = parameters(handler);
            }
            count++;
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
        for (var i = 0; i < times; i++) {
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
            return this;
        }
        if (typeof filler != "string") {
            filler = " ";
        }
        if (typeof prepend == "undefined") {
            prepend = true;
        }
        var str = this;
        if (str.length > length) {
            if (!prepend) {
                str = str.substring(0, length);
            } else {
                str = str.substring(str.length - length)
            }
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
     * Defines module buMain to be used for AngularJS applications
     * @type {module}
     */
    var toolkit = angular.module("buMain", []);
    toolkit.value("bu.version", "0.7");

    (function () {
        /**
         * TemplateCache class that should be registered as a service with the module to provide template interception.
         * @param $http AngularJS HTTP service
         * @param templateCache a cache to be used internally
         * @constructor
         */
        var TemplateCache = function ($http, templateCache) {
            var self = this;
            this.info = function () {
                return templateCache.info();
            };
            templateCache._put = templateCache.put;
            templateCache.put = this.put = function (key, template) {
                if (angular.isString(template)) {
                    template = [200, template, {
                        'x-manual': true
                    }];
                }
                templateCache._put(key, template);
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
                    for (var i = 0; i < TemplateCache.interceptors.length; i++) {
                        var interceptor = TemplateCache.interceptors[i];
                        var returned = interceptor.apply(self, [result.data, key]);
                        if (returned) {
                            result.data = returned;
                        }
                    }
                    return result;
                });
            };
        };

        TemplateCache.interceptors = [];

        toolkit.provider("$templateCache", function () {
            this.intercept = function (interceptor) {
                if (!angular.isFunction(interceptor)) {
                    return;
                }
                TemplateCache.interceptors.push(interceptor);
            };
            this.$get = function ($http, $cacheFactory) {
                var cache;
                try {
                    cache = $cacheFactory("buTemplateCache");
                } catch (e) {
                    cache = $cacheFactory.get("buTemplateCache");
                }
                return new TemplateCache($http, cache);
            };
            //this is to avoid confusing bugs when minifying/uglifying the code
            this.$get.$inject = ["$http", "$cacheFactory"];
        });

    })();

    /**
     * Global configuration object accessible via 'bu.config'
     */
    toolkit.provider('bu$configuration', function () {

        var augment = function (first, second) {
            var result = first;
            angular.forEach(second, function (value, key) {
                if (typeof result[key] == "object" && typeof value == "object") {
                    result[key] = augment(result[key], value);
                } else {
                    result[key] = value;
                }
            });
            return result;
        };

        var read = function (obj, property) {
            if (property.indexOf(".") == -1) {
                return obj[property];
            }
            var split = property.split(".");
            if (typeof obj[split[0]] == "object") {
                return read(obj[split[0]], split.splice(1).join("."));
            }
            return undefined;
        };

        var write = function (obj, property, value) {
            if (property.indexOf('.') == -1) {
                obj[property] = value;
                return obj;
            }
            var split = property.split(".");
            if (typeof obj[split[0]] == "undefined") {
                obj[split[0]] = {};
            }
            if (typeof obj[split[0]] == "object") {
                obj[split[0]] = write(obj[split[0]], split.splice(1).join("."), value);
            }
            return obj;
        };

        var config;

        this.reset = function () {
            config = function (key, value) {
                if (typeof value == "undefined") {
                    return read(config, key);
                } else {
                    config = write(config, key, value);
                    return config;
                }
            };
        };
        this.reset();
        this.set = function (configuration) {
            if (typeof configuration != "object") {
                return;
            }
            config = augment(config, configuration);
        };
        this.$get = function () {
            if (!config.base) {
                config.base = ".";
            }
            if (!config.templatesBase) {
                config.templatesBase = "templates";
            }
            if (!config.directivesBase) {
                config.directivesBase = "js/directives";
            }
            if (!config.filtersBase) {
                config.filtersBase = "js/filters";
            }
            if (!config.namespace) {
                config.namespace = "ui";
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
            if (typeof config.preloadAll == "undefined") {
                config.preloadAll = true;
            }
            if (typeof config.ext != "object") {
                config.ext = {};
            }
            if (typeof config.tools != "object") {
                config.tools = {};
            }
            return config;
        };
    });

    /**
     * Registry factory provider
     */
    toolkit.provider("bu$registryFactory", function () {
        var registries = {};
        var recreationDisallowed = true;
        var initOnDemand = false;
        //this is an API, usage should not be analyzed
        //noinspection JSUnusedGlobalSymbols
        this.allowRecreation = function (allow) {
            recreationDisallowed = !allow;
        };
        //this is an API, usage should not be analyzed
        //noinspection JSUnusedGlobalSymbols
        this.allowInitOnDemand = function (allow) {
            initOnDemand = allow;
        };
        var init = function (name) {
            var storage = {};
            var callbacks = {};
            var runCallbacks = function (event, original, context, args) {
                if (!callbacks[event]) {
                    return original;
                }
                for (var i = 0; i < callbacks[event].length; i++) {
                    var currentArgs = args;
                    if (angular.isFunction(currentArgs)) {
                        currentArgs = currentArgs.apply(context, [event, original]);
                    }
                    var returned = callbacks[event][i].apply(context, currentArgs);
                    if (returned !== null && typeof returned != "undefined") {
                        original = returned;
                    }
                }
                return original;
            };
            var size = 0;
            //this is an API, usage should not be analyzed
            //noinspection JSUnusedGlobalSymbols
            var registry = registries[name] = {
                register: function (id, item) {
                    storage[id] = runCallbacks('register', item, registry, function (event, original) {
                        return [id, original];
                    });
                    if (typeof storage[id] != "undefined") {
                        size++;
                    }
                },
                unregister: function (id) {
                    runCallbacks('unregister', storage[id], registry, [id, storage[id]]);
                    if (typeof storage[id] != "undefined") {
                        size--;
                    }
                    delete storage[id];
                },
                get: function (id) {
                    return runCallbacks('get', storage[id], registry, function (event, original) {
                        return [id, original];
                    });
                },
                list: function () {
                    var list = [];
                    angular.forEach(storage, function (value, key) {
                        list.push(key);
                    });
                    return list;
                },
                info: function () {
                    return {
                        id: name,
                        size: size
                    };
                },
                on: function (event, callback) {
                    if (typeof callbacks[event] == "undefined") {
                        callbacks[event] = [];
                    }
                    callbacks[event].push(callback);
                    return callbacks[event].length - 1;
                },
                off: function (event, callbackIndex) {
                    if (typeof callbacks[event] == "undefined" || callbackIndex < 0 || callbackIndex >= callbacks[event].length) {
                        return false;
                    }
                    callbacks[event].splice(callbackIndex, 1);
                    return true;
                },
                trigger: function (event) {
                    var args = [];
                    for (var i = 1; i < arguments.length; i++) {
                        args.push(arguments[i]);
                    }
                    runCallbacks(event, {}, registry, args);
                }
            };
        };
        var registryFactory = function (name) {
            if (recreationDisallowed && typeof registries[name] != "undefined") {
                throw new Error("Registry id " + name + " has already been taken");
            }
            init(name);
            return registries[name];
        };
        registryFactory.get = function (name) {
            if (typeof registries[name] == "undefined") {
                if (initOnDemand) {
                    init(name);
                } else {
                    throw new Error("Unknown registry " + name);
                }
            }
            return registries[name];
        };
        this.$get = function () {
            return registryFactory;
        };
    });

    toolkit.service("bu$toolRegistry", ["bu$registryFactory", "bu$configuration", function (registryFactory, configuration) {
        var toolRegistry = registryFactory("bu$toolRegistry");
        var toolConfigurator = function (id, tool) {
            if (!angular.isFunction(tool.configure)) {
                return;
            }
            var toolConfiguration = configuration("tools." + id);
            if (typeof toolConfiguration != "undefined") {
                tool.configure(toolConfiguration);
            }
        };
        toolRegistry.on("register", toolConfigurator);
        this.register = function (id, tool) {
            toolRegistry.register(id, tool);
        };
        this.get = function (id) {
            return toolRegistry.get(id);
        };
        this.list = function () {
            return toolRegistry.list();
        };
        this.reconfigure = function () {
            var tools = this.list();
            for (var i = 0; i < tools.length; i++) {
                var id = tools[i];
                var tool = this.get(id);
                toolConfigurator(id, tool);
            }
        };
    }]);

    toolkit.service("bu$extensionRegistry", ["bu$registryFactory", function (registryFactory) {
        var extensionRegistry = registryFactory("bu$registryFactory");
        this.register = function (id, extension) {
            extensionRegistry.register(id, extension);
        };
        this.get = function (id) {
            return extensionRegistry.get(id);
        };
        this.list = function () {
            return extensionRegistry.list();
        };
        this.on = function (event, callback) {
            return extensionRegistry.on(event, callback);
        };
        this.off = function (event, callbackIndex) {
            return extensionRegistry.off(event, callbackIndex);
        };
    }]);

    toolkit.service("bu$name", ["bu$configuration", function (config) {
        this.directive = function (name) {
            if (!config.namespace) {
                return name;
            }
            var namespace = config.namespace.split(/[\-:]/);
            for (var i = 1; i < namespace.length; i++) {
                namespace[i] = namespace[i][0].toUpperCase() + namespace[i].substring(1);
            }
            return namespace.join("") + name[0].toUpperCase() + name.substring(1);
        };
        this.normalize = function (domName) {
            //turn DOM name into lower case for unification purposes
            domName = domName.toLowerCase();
            //strip xHTML and HTML5 prefixes
            domName = domName.replace(/^(x|data)-/, '');
            //turn domName into camel case
            domName = domName.split(/[\-:]/);
            for (var i = 1; i < domName.length; i++) {
                domName[i] = domName[i][0].toUpperCase() + domName[i].substring(1);
            }
            domName = domName.join("");
            //return the result
            return domName;
        };
        this.domNames = function (directiveName) {
            var names = [];
            //we first reverse the camel case into dash separated
            directiveName = directiveName.replace(/([A-Z])/g, "-$1").toLowerCase();
            names.push(directiveName);
            //we include a variant with the first term as a namespace
            if (directiveName.indexOf("-") != -1) {
                names.push(directiveName.replace(/\-/, ':'));
            }
            //we then include the HTML5 and xHTML variants
            names.push("data-" + directiveName);
            names.push("x-" + directiveName);
            return names;
        };
    }]);

    toolkit.provider("bu$compile", ["bu$registryFactoryProvider", "$compileProvider", function (bu$registryFactoryProvider, $compileProvider) {
        //this is a simple trick so that we can avoid defining the dependencies of the $get method after
        //we have defined it. Here, we are actually telling before-hand that we want the declaration to
        //be done afterwards
        (function () {
            //noinspection JSPotentiallyInvalidUsageOfThis
            this.$get.$inject = ["$compile", "$rootElement", "$injector", "bu$name", "$rootScope", "$q", "bu$configuration", "$timeout", "$templateCache"];
        }).postpone(this);
        var directiveRegistry = bu$registryFactoryProvider.$get()("bu$directiveRegistry");
        this.$get = function ($compile, $rootElement, $injector, bu$name, $rootScope, $q, bu$configuration, $timeout, $templateCache) {
            return function (directiveName, directiveFactory) {
                //a directive name is the least requirement for working with directives
                if (!directiveName) {
                    throw new Error("Directive name cannot be empty: " + directiveName);
                }
                var directiveDescriptor = directiveRegistry.get(directiveName);
                if (!directiveDescriptor) {
                    if (angular.isUndefined(directiveFactory)) {
                        throw new Error("No previous description was found for directive " + directiveName);
                    }
                    var originalFactory = directiveFactory;
                    var isFunction = function (target) {
                        return angular.isFunction(target) || (angular.isArray(target) && target.length > 0 && angular.isFunction(target[target.length - 1]));
                    };
                    directiveFactory = function ($injector) {
                        var directive = $injector.invoke(originalFactory, this);
                        if (isFunction(directive)) {
                            //If the result is a function, we assume that it is the link method. Alternately,
                            //if the directive is a function wrapped in bracket dependency notation we assume it to be
                            //the link method with its dependencies explicitly defined
                            directive = {
                                link: directive
                            };
                        } else if (!angular.isObject(directive)) {
                            throw new Error("Invalid directive definition provided for " + directiveName);
                        }
                        if (isFunction(directive.link)) {
                            var linker = directive.link;
                            //if specifics have not been mentioned, the link function is assumed to be the post-link
                            //function
                            directive.link = {
                                pre: function () {
                                },
                                post: linker
                            };
                        }
                        var controller = function () {
                        };
                        if (isFunction(directive.controller)) {
                            controller = directive.controller;
                        }
                        if (angular.isUndefined(directive.link)) {
                            directive.link = {};
                        }
                        if (!isFunction(directive.link.pre)) {
                            directive.link.pre = function () {
                            };
                        }
                        if (!isFunction(directive.link.post)) {
                            directive.link.post = function () {
                            };
                        }
                        if (angular.isUndefined(directive.scope)) {
                            directive.scope = false;
                        }
                        if (angular.isUndefined(directive.replace)) {
                            directive.replace = false;
                        }
                        if (angular.isUndefined(directive.transclude)) {
                            directive.transclude = false;
                        }
                        if (angular.isUndefined(directive.priority)) {
                            directive.priority = 0;
                        }
                        if (angular.isUndefined(directive.require)) {
                            directive.require = null;
                        } else {
                            directive.require = directive.require.replace(/\(bui\)(\S+)/g, function (namespace, name) {
                                name = name[0].toLowerCase() + name.substring(1);
                                return bu$name.directive(name);
                            });
                        }
                        if (!angular.isFunction(directive.compile)) {
                            directive.compile = function () {
                            };
                        }
                        if (angular.isDefined(directive.templateUrl) && !/\.[^\.]+$/.test(directive.templateUrl)) {
                            directive.templateUrl = bu$configuration.base + "/" + bu$configuration.templatesBase + "/" + directive.templateUrl + ".html";
                            directive.templateUrl = directive.templateUrl.replace(/\/{2,}/g, "/");
                        }
                        var originalCompile = directive.compile;
                        directive.compile = function (tElement, tAttrs) {
                            var linker = $injector.invoke(originalCompile, this, {
                                tElement: tElement,
                                tAttrs: tAttrs,
                                element: tElement,
                                attrs: tAttrs,
                                $element: tElement,
                                $attrs: tAttrs
                            });
                            if (isFunction(linker)) {
                                linker = {
                                    post: linker
                                };
                            }
                            if (!angular.isObject(linker)) {
                                linker = directive.link;
                            }
                            return linker;
                        };
                        if (!directive.masked || !directive.masked.defaults) {
                            if (!directive.masked) {
                                directive.masked = {};
                            }
                            directive.masked.defaults = true;
                            directive.controller = function ($timeout, $injector, $scope, $element, $attrs) {
                                var context = this;
                                $timeout(function () {
                                    if (angular.isObject(directive.scope) && angular.isObject(directive.defaults)) {
                                        angular.forEach(directive.scope, function (value, key) {
                                            if (angular.isUndefined($scope[key]) && angular.isDefined(directive.defaults[key])) {
                                                var defaultValue = directive.defaults[key];
                                                if (isFunction(defaultValue)) {
                                                    defaultValue = $injector.invoke(defaultValue, context);
                                                }
                                                $scope[key] = defaultValue;
                                            }
                                        });
                                    }
                                    $injector.invoke(controller, context, {
                                        $scope: $scope,
                                        $element: $element,
                                        $attrs: $attrs,
                                        $timeout: $timeout
                                    });
                                });
                            };
                            directive.controller.$inject = ["$timeout", "$injector", "$scope", "$element", "$attrs"];
                        }
                        //we only consider the compilation phase to be safe when the directive is being attached to
                        //the page
                        if ((!this || angular.isUndefined(this.bu$Preload))
                            && angular.isDefined(directive.template) && angular.isFunction(directive.template.then)) {
                            if (!directive.masked || !directive.masked.promises) {
                                if (!directive.masked) {
                                    directive.masked = {};
                                }
                                directive.masked.promises = true;
                                //This is the template loader promise. Then this promise is resolved, it will be safe to
                                //compile the element
                                var templateAvailable = directive.template;
                                //this promise ensures that the element has become available after being rendered
                                var elementAvailable = $q.defer();
                                //this promise ensures that the linker has run, and it is now safe to run the controller
                                var linkerRun = $q.defer();
                                //this controller function can be replaced with a function 'controller' returned by the
                                //promised object, so that controllers can be defined via promises as well
                                var promisedController = function () {
                                };
                                //this is the post-link function that can be overridden by a promise object to enable
                                //developers to link events after promises have been fulfilled
                                var promisedPostLink = function () {
                                };
                                //we nullify the template so as to avoid a flicker when AngularJS sees the template and
                                //gets it 'toString'
                                directive.template = null;
                                //we preserve the original controller to run it after the linker has run
                                var originalController = directive.controller;
                                directive.controller = function ($injector, $compile, $transclude, $scope, $attrs, $element) {
                                    var context = this;
                                    var targetElement = $element;
                                    templateAvailable.then(function (template) {
                                        //this is a deferred, which promises that all that is left to be done
                                        //is to compile the template
                                        //any actions regarding directive definition manipulation must have taken place
                                        //prior to resolving this deferred, as it expects to be resolved with a simple
                                        //string representing the template itself
                                        var templateDone = $q.defer();
                                        //this is the interim which might directly resolve the templateDone promise.
                                        //but it is in this phase that we check whether or not there is any need to
                                        //perform further post-processing of the returned object
                                        var templateInterim = $q.defer();
                                        //if the template is a function, invoke it with dependency injection
                                        //for convenience we allow it access to the element, attributes, scope,
                                        //as well as the transclude function.
                                        //the context of the function will be the controller itself.
                                        if (isFunction(template)) {
                                            try {
                                                template = $injector.invoke(template, context, {
                                                    scope: $scope,
                                                    $scope: $scope,
                                                    element: targetElement,
                                                    $element: targetElement,
                                                    $transclude: $transclude,
                                                    attrs: $attrs,
                                                    $attrs: $attrs
                                                });
                                            } catch (e) {
                                                templateInterim.reject(e);
                                            }
                                        }
                                        //if the template resolved (or the one returned from the function above
                                        //is still a promise, wait for it to be resolved and then signal that we
                                        //can proceed with the compilation
                                        if (angular.isDefined(template.then) && angular.isFunction(template.then)) {
                                            template.then(function (template) {
                                                templateInterim.resolve(template);
                                            }, function (reason) {
                                                templateInterim.reject(reason);
                                            });
                                        } else {
                                            //otherwise, we can assume the template to be a normal element descriptor
                                            //that can and should be used for element compilation
                                            templateInterim.resolve(template);
                                        }
                                        templateInterim.promise.then(function (template) {
                                            //if the resolved template is an object, we assume that it wants to
                                            //modify and manipulate the directive definition to some extent
                                            if (angular.isObject(template)) {
                                                //we check to see if the template promises any controllers
                                                if (isFunction(template.controller)) {
                                                    promisedController = template.controller;
                                                }
                                                //we check to see if the template promises any post-links
                                                if (isFunction(template.link)) {
                                                    promisedPostLink = template.link;
                                                }
                                                //if the template returns a 'template' property that will be
                                                //used
                                                if (angular.isDefined(template.template)) {
                                                    template = template.template;
                                                    templateDone.resolve(template);
                                                } else if (angular.isDefined(template.templateUrl)) {
                                                    //otherwise, if a template url is defined, we will have to ask
                                                    //the template cache to get that for us.
                                                    if (!/\.[^\.]+$/.test(template.templateUrl)) {
                                                        template.templateUrl = bu$configuration.base + "/" + bu$configuration.templatesBase + "/" + template.templateUrl + ".html";
                                                        template.templateUrl = template.templateUrl.replace(/\/{2,}/g, "/");
                                                    }
                                                    $templateCache.get(template.templateUrl).then(function (result) {
                                                        templateDone.resolve(result.data);
                                                    }, function (reason) {
                                                        templateDone.reject(reason);
                                                    });
                                                } else {
                                                    templateDone.reject("No template has been specified");
                                                }
                                            } else {
                                                //if, on the other hand, the resolved template is a simple primitive,
                                                //we will assume it to be the template itself
                                                templateDone.resolve(template);
                                            }
                                        }, function (reason) {
                                            templateDone.reject(reason);
                                        });
                                        templateDone.promise.then(function (template) {
                                            /**
                                             * This means we are here by mistake. We are inside an element and
                                             * assuming it was compiled but it actually was not.
                                             * @todo this fixes it for now, but we should find a better way of doing it
                                             */
                                            if (!targetElement.data('bu-compiled')) {
                                                return
                                            }
                                            //we compile the template and use transclusion if necessary, binding it to the
                                            //scope of the directive
                                            var $element = $compile(angular.element(template), $transclude)($scope);
                                            //based on the 'replace' option, we must take care to place the compiled template
                                            //in the right spot and specify the proper element as the root of the linking
                                            //after the element has been jammed into the DOM, it is safe to signal to the linker
                                            //that the template is now available
                                            if (directive.replace) {
                                                targetElement.replaceWith($element);
                                                elementAvailable.resolve($element);
                                            } else {
                                                targetElement.html('');
                                                targetElement.append($element);
                                                elementAvailable.resolve(targetElement);
                                            }
                                            //if the linker has run its course, we can now run the controller
                                            linkerRun.promise.then(function () {
                                                //now its time to invoke the original controller
                                                var locals = {
                                                    $compile: $compile,
                                                    $transclude: $transclude,
                                                    $scope: $scope,
                                                    $element: $element,
                                                    $attrs: $attrs
                                                };
                                                $injector.invoke(originalController, context, locals);
                                                //after calling the original controller, we now call to the
                                                //promised controller (if any) so that the controller's
                                                //functionality can be extended properly
                                                $injector.invoke(promisedController, context, locals);
                                            });
                                        }, function (reason) {
                                            elementAvailable.reject(reason);
                                        });
                                    }, function (reason) {
                                        //if for any reason the template was not available, we also reject the element
                                        //becoming available
                                        elementAvailable.reject(reason);
                                    });
                                };
                                directive.controller.$inject = ["$injector", "$compile", "$transclude", "$scope", "$attrs", "$element"];
                                if (!directive.masked.compile) {
                                    directive.masked.compile = true;
                                    //this is the proxied compile function
                                    var proxiedCompile = directive.compile;
                                    directive.compile = function (tElement, tAttrs) {
                                        //we first call the compile function
                                        var linker = proxiedCompile.apply(this, [tElement, tAttrs]);
                                        var postLink = linker.post;
                                        if (!directive.masked.postLink) {
                                            directive.masked.postLink = true;
                                            linker.post = function (scope, iElement, iAttrs, controller) {
                                                var context = this;
                                                //once the element is available, we can link it
                                                elementAvailable.promise.then(function ($element) {
                                                    var locals = {
                                                        $scope: scope,
                                                        scope: scope,
                                                        $element: $element,
                                                        element: $element,
                                                        attrs: iAttrs,
                                                        $attrs: iAttrs,
                                                        controller: controller
                                                    };
                                                    $injector.invoke(postLink, context, locals);
                                                    //after running the original post-link function, we invoke
                                                    //the promised post-link function (if any) so that DOM manipulation
                                                    //and event attachment can be performed properly by any extending
                                                    //code
                                                    $injector.invoke(promisedPostLink, context, locals);
                                                    //we now signal to the controller that it can execute
                                                    linkerRun.resolve();
                                                }, function (reason) {
                                                    throw new Error("Failed to load the element", reason);
                                                });
                                            };
                                        }
                                        return linker;
                                    };
                                }
                            }
                        }
                        return  directive;
                    };
                    directiveFactory.$inject = ["$injector"];
                    //invoke the factory with its dependencies
                    var directive = $injector.invoke(directiveFactory, {
                        //this is to signal to the directive factory that we are just pre-loading
                        //the directive, so that if differentiation between an actual angular-driven
                        //construction and this one is necessary it can be done properly by querying
                        //the value 'this.bu$Preload' inside the constructor to see if it is '=== true'
                        bu$Preload: true
                    });
                    //if no restriction is set, the default behaviour of AngularJS is attribute
                    if (!directive.restrict) {
                        directive.restrict = "A";
                    }
                    var currentName = bu$name.directive(directiveName);
                    var domNames = bu$name.domNames(currentName);
                    var filters = [];
                    //here, we set up filters that can select nodes to be processed by the compiler
                    //registering element type filter
                    if (directive.restrict.indexOf("E") != -1) {
                        filters.push(function (node) {
                            if (node.nodeType != 1) { //only select element nodes
                                return null;
                            }
                            if (bu$name.normalize(node.nodeName) == currentName) {
                                return node;
                            }
                            return null;
                        });
                    }
                    //registering attribute type filter
                    if (directive.restrict.indexOf("A") != -1) {
                        filters.push(function (node) {
                            if (node.nodeType != 1) { //only select element nodes
                                return null;
                            }
                            for (var i = 0; i < node.attributes.length; i++) {
                                var attributeName = node.attributes.item(i).name.toLowerCase();
                                if (bu$name.normalize(attributeName) == currentName) {
                                    return node;
                                }
                            }
                            return null;
                        });
                    }
                    //registering class type filter
                    if (directive.restrict.indexOf("C") != -1) {
                        filters.push(function (node) {
                            if (node.nodeType != 1 || !node.className) { //select an element node with a class attribute
                                return null;
                            }
                            for (var i = 0; i < domNames.length; i++) {
                                var domName = domNames[i];
                                if (node.className.indexOf(domName) != -1) {
                                    return node;
                                }
                            }
                            return null;
                        });
                    }
                    //registering comment type filter
                    if (directive.restrict.indexOf("I") != -1) {
                        filters.push(function (node) {
                            if (node.nodeType != 8) { //only select from comment nodes
                                return null;
                            }
                            //to be safe, we recompile all comments again
                            return node.parentNode;
                        });
                    }
                    //we now register the loaded directive definition for later reference
                    directiveDescriptor = {
                        //the raw name of the directive without any namespace prefixing
                        name: directiveName,
                        //the actual directive after having been invoked via the factory
                        directive: directive,
                        //this is the factory used for instantiating the directive definition
                        //since masking is being performed, this is actually overridden to be
                        //a function which proxies the actual factory with masking capabilities.
                        factory: directiveFactory,
                        //this filter will apply all created filters and find if any of them applies
                        //the first that picks anything out
                        filter: function (node) {
                            for (var i = 0; i < filters.length; i++) {
                                var chosen = filters[i].call(null, node);
                                if (chosen) {
                                    return chosen;
                                }
                            }
                            return null;
                        },
                        compile: function (element, compileFunction) {
                            //if no root element has been specified, we assume that we will need to traverse
                            //the ng-app in its entirety
                            if (!element) {
                                element = $rootElement;
                            } else {
                                element = angular.element(element);
                            }
                            //now, let's walk
                            var nodes = [];
                            var collect = function (node) {
                                while (node) {
                                    //if the node has already been considered we ignore it
                                    var $node = angular.element(node);
                                    if ($node.data('bu-compiled') && $node.data('bu-compiled')[currentName]) {
                                        node = node.nextSibling;
                                        continue;
                                    }
                                    var chosen = directiveDescriptor.filter(node);
                                    if (chosen) {
                                        nodes.push(chosen);
                                    } else {
                                        collect(node.firstChild);
                                    }
                                    node = node.nextSibling;
                                }
                            };
                            var processor = function (node) {
                                var $node = angular.element(node);
                                if ($node.data('bu-compile') && $node.data('bu-compile')[currentName]) {
                                    return;
                                }
                                var scope = angular.element(node).scope();
                                if (angular.isUndefined(scope)) {
                                    scope = $rootScope;
                                }
                                $timeout(function () {
                                    scope.$apply(function () {
                                        var $node = angular.element(node);
                                        compileFunction.apply(scope, [$node, scope, function (result) {
                                            $node = angular.element(result);
                                        }]);
                                        //we are keeping track of what sort of compiling we have previously performed
                                        //on each element so that we can improve performance.
                                        //this also is necessary to prevent mixed results when recompiling elements that
                                        //have ng-transclude enabled.
                                        //you could manually change the compiled flag to false, so that recompilation is
                                        //done regardless, for any element of your choosing.
                                        var data = $node.data('bu-compiled') || {};
                                        data[currentName] = true;
                                        $node.data('bu-compiled', data);
                                    });
                                });
                            };
                            if (!angular.isFunction(compileFunction)) {
                                compileFunction = function (node, scope, offerResult) {
                                    offerResult($compile(node)(scope));
                                };
                            }
                            collect(element[0]);
                            angular.forEach(nodes, processor);
                        }
                    };
                    directiveRegistry.register(directiveName, directiveDescriptor);
                    $compileProvider.directive(bu$name.directive(directiveName), directiveFactory);
                }
                return directiveDescriptor.compile;
            };
        };
    }]);

    toolkit.value("bu$Directive", function (requirements, factory) {
        if (angular.isUndefined(factory)) {
            if (angular.isFunction(requirements) || (angular.isArray(requirements) && angular.isFunction(requirements[requirements.length - 1]))) {
                factory = requirements;
                requirements = [];
            } else {
                throw new Error("Cannot instantiate a directive without a factory function");
            }
        }
        this.getRequirements = function () {
            return requirements;
        };
        this.getFactory = function () {
            return factory;
        };
    });

    toolkit.provider("bu$loader", ["bu$registryFactoryProvider", "bu$configurationProvider", "$injector", function (bu$registryFactoryProvider, bu$configurationProvider, $injector) {
        var provider = this;
        var registry = $injector.invoke(bu$registryFactoryProvider.$get)("bu$loader");
        var config = $injector.invoke(bu$configurationProvider.$get);
        var pathResolvers = {
            directive: function (item) {
                return (config.directivesBase + "/" + item.identifier + ".js").replace(/\/{2,}/g, "/");
            },
            filter: function (item) {
                return (config.filtersBase + "/" + item.identifier + ".js").replace(/\/{2,}/g, "/");
            }
        };
        this.addType = function (type, pathResolver) {
            pathResolvers[type] = pathResolver;
        };
        this.$get = function ($http, $q, $rootScope, $injector, $timeout) {
            var loader = {
                load: function (item) {
                    var deferred = $q.defer();
                    if (angular.isArray(item)) {
                        var promises = [];
                        for (var i = 0; i < item.length; i++) {
                            var obj = item[i];
                            promises.push(loader.load(obj));
                        }
                        $q.all(promises).then(function (resolved) {
                            var result = [];
                            for (var i = 0; i < resolved.length; i++) {
                                result.push(resolved[i][0]);
                            }
                            deferred.resolve(result);
                        }, function (reason) {
                            $timeout(function () {
                                $rootScope.$apply(function () {
                                    deferred.reject(reason);
                                });
                            });
                        });
                        return deferred.promise;
                    }
                    if (angular.isUndefined(item.type)) {
                        deferred.reject("Cannot load item without a type");
                        return deferred.promise;
                    }
                    if (angular.isUndefined(item.identifier)) {
                        deferred.reject("Cannot load item without an identifier");
                        return deferred.promise;
                    }
                    var qualifiedName = item.type + ":" + item.identifier;
                    var loaded = registry.get(qualifiedName);
                    if (loaded) {
                        return loaded;
                    }
                    loaded = deferred.promise;
                    registry.register(qualifiedName, loaded);
                    var path = item.path;
                    if (!path) {
                        if (item.pathResolver) {
                            if (!pathResolvers[item.type]) {
                                provider.addType(item.type, item.pathResolver);
                            }
                            path = item.pathResolver.call(null, item);
                        } else if (pathResolvers[item.type]) {
                            path = pathResolvers[item.type].call(null, item);
                        }
                    }
                    if (!path) {
                        throw new Error("Failed to resolve a path for item '" + item.identifier + "' of type '" + item.type + "'");
                    }
                    path = config.base + "/" + path;
                    path = path.replace(/\/{2,}/g, "/");
                    $http.get(path, {
                        cache: true
                    }).then(function (result) {
                        var script = result.data;
                        try {
                            eval(script);
                        } catch (e) {
                            $timeout(function () {
                                $rootScope.$apply(function () {
                                    deferred.reject(e);
                                });
                            });
                            return;
                        }
                        $timeout(function () {
                            $rootScope.$apply(function () {
                                deferred.resolve([
                                    {
                                        identifier: item.identifier,
                                        path: path,
                                        type: item.type
                                    }
                                ]);
                            });
                        });
                    }, function (reason) {
                        $timeout(function () {
                            $rootScope.$apply(function () {
                                deferred.reject(reason);
                            });
                        });
                    });
                    return loaded;
                },
                directive: function (identifier) {
                    if (angular.isArray(identifier)) {
                        var directives = [];
                        for (var i = 0; i < identifier.length; i++) {
                            directives.push({
                                identifier: identifier[i],
                                type: 'directive'
                            });
                        }
                        return loader.load(directives);
                    }
                    return loader.load({
                        identifier: identifier,
                        type: 'directive'
                    });
                },
                filter: function (identifier) {
                    if (angular.isArray(identifier)) {
                        var filters = [];
                        for (var i = 0; i < identifier.length; i++) {
                            filters.push({
                                identifier: identifier[i],
                                type: 'filter'
                            });
                        }
                        return loader.load(filters);
                    }
                    return loader.load({
                        identifier: identifier,
                        type: 'filter'
                    });
                }
            };
            return loader;
        };
        this.$get.$inject = ["$http", "$q", "$rootScope", "$injector", "$timeout"];
    }]);

    toolkit.service("bu$directives", ["bu$registryFactory", "bu$Directive", "bu$compile", "$q", "bu$loader", function (bu$registryFactory, bu$Directive, bu$compile, $q, bu$loader) {
        var registry = bu$registryFactory("bu$directives");
        registry.on('register', function (directiveName, directiveFactory) {
            var requirements = directiveFactory.getRequirements();
            var deferred = $q.defer();
            if (requirements.length > 0) {
                bu$loader.load(requirements).then(function () {
                    deferred.resolve();
                }, function (reason) {
                    deferred.reject(reason);
                });
            } else {
                deferred.resolve();
            }
            deferred.promise.then(function () {
                bu$compile(directiveName, directiveFactory.getFactory())();
            }, function (reason) {
                throw new Error("Failed to resolve dependencies for " + directiveName, reason);
            });
            return directiveFactory;
        });
        this.register = function (id, item) {
            registry.register(id, item);
        };
        this.get = function (id) {
            return registry.get(id);
        };
        this.list = function () {
            return registry.list();
        };
        this.instantiate = function (requirements, factory) {
            return new bu$Directive(requirements, factory);
        };
    }]);

    toolkit.provider("bu$directiveCompiler", ["$injector", "bu$registryFactoryProvider", "$compileProvider", function ($injector, bu$registryFactoryProvider, $compileProvider) {
        var bu$registryFactory = $injector.invoke(bu$registryFactoryProvider.$get, bu$registryFactoryProvider);
        var registry = bu$registryFactory("bu$directiveCompiler$registry");
        var newDirectives = [];
        var bu$name, $rootElement, $compile, $rootScope;
        var config = {
            /**
             * flag to determine whether or not the factory function should be masked
             */
            maskFactory: true,
            /**
             * flag specifying whether or not the directive should be registered with AngularJS automatically
             */
            autoRegisterDirective: true,
            /**
             * flag to determine whether or not the masked factory should be used with AngularJS or if it should only
             * be kept in the registry
             */
            useMaskedFactory: true
        };
        angular.forEach(config, function (value, key) {
            this[key] = function (value) {
                config[key] = value;
            };
        }, this);
        /**
         * Changes a function from the bracket dependency definition notation to the $inject annotation notation.
         * This is necessary both to unify the object model and to expect AngularJS to behave as expected, as it
         * does not seem to like the bracket notation in some places (in the publicLinkFn, for instance)
         * @param {Array|Function} fn
         * @returns {Function}
         */
        var bracketToAnnotation = function (fn) {
            if (angular.isArray(fn) && fn.length > 0 && angular.isFunction(fn[fn.length - 1])) {
                fn[fn.length - 1].$inject = fn.splice(0, fn.length - 1);
                fn = fn[0];
            }
            return fn;
        };
        var bindAnnotated = function (fn) {
            fn = bracketToAnnotation(fn);
            if (!angular.isFunction(fn)) {
                throw new Error("Cannot bind a non-function object");
            }
            if (!angular.isArray(fn.$inject)) {
                fn.$inject = [];
            }
            var $inject = fn.$inject.splice(arguments.length - 2, fn.$inject.length);
            var context = arguments[1];
            var args = [];
            for (var i = 2; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            $inject.push(function () {
                var currentArgs = args.concat();
                for (var i = 0; i < arguments.length; i++) {
                    currentArgs.push(arguments[i]);
                }
                return fn.apply(context, currentArgs);
            });
            return bracketToAnnotation($inject);
        };
        registry.on('register', function (id) {
            newDirectives.push(id);
        });
        registry.on('register', function (id, factory) {
            //this is to convert the bracket notation into $inject annotation
            factory = bracketToAnnotation(factory);
            if (!angular.isFunction(factory)) {
                throw new Error("Directive factory should be a function");
            }
            //this is so that we remember how the directive returned by the factory upon initial registration
            //looked like prior to tampering with it and masking its properties
            var directiveDefinition = $injector.invoke(factory, {
                //we set the bu$Preload to true on the context so that the factory can be aware that this instantiation
                //is actually not for compilation
                bu$Preload: true
            }, {
                $injector: $injector,
                bu$directiveCompiler: bu$directiveCompiler,
                bu$registryFactory: bu$registryFactory
            });
            var currentName = bu$name.directive(id);
            var domNames = bu$name.domNames(currentName);
            var filters = [];
            //here, we set up filters that can select nodes to be processed by the compiler
            //registering element type filter
            if (directiveDefinition.restrict && directiveDefinition.restrict.indexOf("E") != -1) {
                filters.push(function (node) {
                    if (node.nodeType != 1) { //only select element nodes
                        return null;
                    }
                    if (bu$name.normalize(node.nodeName) == currentName) {
                        return node;
                    }
                    return null;
                });
            }
            //registering attribute type filter
            if (!directiveDefinition.restrict || directiveDefinition.restrict.indexOf("A") != -1) {
                filters.push(function (node) {
                    if (node.nodeType != 1) { //only select element nodes
                        return null;
                    }
                    for (var i = 0; i < node.attributes.length; i++) {
                        var attributeName = node.attributes.item(i).name.toLowerCase();
                        if (bu$name.normalize(attributeName) == currentName) {
                            return node;
                        }
                    }
                    return null;
                });
            }
            //registering class type filter
            if (directiveDefinition.restrict && directiveDefinition.restrict.indexOf("C") != -1) {
                filters.push(function (node) {
                    if (node.nodeType != 1 || !node.className) { //select an element node with a class attribute
                        return null;
                    }
                    for (var i = 0; i < domNames.length; i++) {
                        var domName = domNames[i];
                        if (node.className.indexOf(domName) != -1) {
                            return node;
                        }
                    }
                    return null;
                });
            }
            //registering comment type filter
            if (directiveDefinition.restrict && directiveDefinition.restrict.indexOf("I") != -1) {
                filters.push(function (node) {
                    if (node.nodeType != 8) { //only select from comment nodes
                        return null;
                    }
                    //to be safe, we recompile all comments again
                    return node.parentNode;
                });
            }
            //we return a newly fashioned directive descriptor object to be stored instead of the raw factory
            return {
                identifier: id,
                factory: factory,
                productionFactory: factory,
                directive: directiveDefinition,
                filter: function (node) {
                    for (var i = 0; i < filters.length; i++) {
                        var chosen = filters[i].call(null, node);
                        if (chosen) {
                            return chosen;
                        }
                    }
                    return null;
                }
            };
        });
        //Here, we are performing factory masking. To make things more transparent, we do not erase the
        //actual factory function and keep a reference to it. We rather create a different factory that
        //relying on the original, will return a definition object that matches our expectations more
        //closely
        registry.on('register', function (id, descriptor) {
            if (!config.maskFactory) {
                return descriptor;
            }
            descriptor.productionFactory = function ($injector) {
                var directive = $injector.invoke(descriptor.factory);
                directive = bracketToAnnotation(directive);
                if (angular.isFunction(directive)) {
                    directive = {
                        link: directive
                    };
                }
                directive.link = bracketToAnnotation(directive.link);
                if (angular.isFunction(directive.link)) {
                    directive.link = {
                        post: directive.link
                    };
                }
                var linker = {
                    pre: directive.link && directive.link.pre ? directive.link.pre : function () {
                    },
                    post: directive.link && directive.link.post ? directive.link.post : function () {
                    }
                };
                delete directive.link;
                if (!angular.isObject(directive)) {
                    throw new Error("Invalid descriptor definition for " + id);
                }
                if (!angular.isString(directive.restrict)) {
                    directive.restrict = "A";
                }
                if (angular.isUndefined(directive.replace)) {
                    directive.replace = false;
                }
                if (angular.isUndefined(directive.transclude)) {
                    directive.transclude = false;
                }
                if (angular.isUndefined(directive.priority)) {
                    directive.priority = 0;
                }
                if (angular.isUndefined(directive.scope)) {
                    directive.scope = false;
                }
                if (angular.isUndefined(directive.require)) {
                    directive.require = null;
                } else if (angular.isString(directive.require)) {
                    directive.require = directive.require.replace(/bu\$([A-Z]\S*)/g, function (match, directive) {
                        if (directive[0].toLowerCase() == directive[0]) {
                            return match;
                        }
                        return bu$name.directive(directive[0].toLowerCase() + directive.substring(1));
                    });
                }
                if (angular.isUndefined(directive.controller)) {
                    directive.controller = function () {
                    };
                }
                if (!angular.isFunction(directive.compile)) {
                    directive.compile = function () {
                        return linker;
                    };
                }
                linker.pre = bracketToAnnotation(linker.pre);
                linker.post = bracketToAnnotation(linker.post);
                directive.compile = bracketToAnnotation(directive.compile);
                directive.controller = bracketToAnnotation(directive.controller);
                return directive;
            };
            descriptor.productionFactory.$inject = ["$injector"];
            return descriptor;
        });
        //Here we will mask the production factory one more layer to enable the `defaults` magic on the
        //directive definition object
        //This will only work if masking is enabled
        registry.on('register', function (id, descriptor) {
            if (!config.maskFactory) {
                return descriptor;
            }
            var productionFactory = descriptor.productionFactory;
            descriptor.productionFactory = bracketToAnnotation(["$injector", "$timeout", function ($injector, $timeout) {
                var directive = $injector.invoke(productionFactory, this, {
                    $inject: $injector
                });
                //if no defaults are specified the production factory's controller is not masked at all
                if (angular.isUndefined(directive.defaults) || !angular.isObject(directive.defaults)) {
                    return directive;
                }
                var controller = bracketToAnnotation(directive.controller);
                directive.controller = bracketToAnnotation(["$scope", "$element", "$attrs", "$transclude", function ($scope, $element, $attrs, $transclude) {
                    $timeout(function () {
                        angular.forEach(directive.defaults, function (value, key) {
                            if (angular.isUndefined(directive.scope[key])) {
                                throw new Error("Variable `" + key + "` is not defined in the scope of directive `" + id + "`");
                            }
                            if (directive.scope[key][0] != "@") {
                                throw new Error("Variable `" + key + "` is not bound uni-directionally on directive `" + id + "`");
                            }
                            if (angular.isUndefined($attrs[key])) {
                                $scope[key] = value;
                            }
                        });
                    });
                    if (angular.isFunction(controller)) {
                        $injector.invoke(bindAnnotated(controller, this, $scope, $element, $attrs, $transclude), this, {
                            $injector: $injector,
                            $timeout: $timeout
                        });
                    }
                }]);
                return directive;
            }]);
        });
        //Let's mask the production factory further to include support for promises
        registry.on('register', function (id, descriptor) {
            if (!config.maskFactory) {
                return descriptor;
            }
            var productionFactory = descriptor.productionFactory;
            descriptor.productionFactory = bracketToAnnotation(["$injector", "$q", "$http", "$templateCache", function ($injector, $q, $http, $templateCache) {
                var directive = $injector.invoke(productionFactory, this, {
                    $injector: $injector
                });
                var promise = undefined;
                if (angular.isDefined(directive.resolve) && angular.isFunction(directive.resolve.then)) {
                    //he have a promise ... we will assume that the promise will be fulfilled.
                    //don't disappoint us. :-)
                    promise = directive.resolve;
                } else {
                    return directive;
                }
                //we will delete the templates so that rendering is not done by AngularJS
                delete directive.template;
                delete directive.templateUrl;
                var originalCompile = directive.compile;
                var originalController = directive.controller;
                var templateAvailable = $q.defer();
                var templatePreprocessed = $q.defer();
                var transcluded = $q.defer();
                var preLinked = $q.defer();
                var postLinked = $q.defer();
                promise.then(function (template) {
                    var definition = template;
                    if (angular.isFunction(definition)) {
                        definition = $injector.invoke(definition, null);
                    }
                    if (angular.isString(definition)) {
                        definition = {
                            template: definition
                        };
                    }
                    if (!angular.isObject(definition)) {
                        throw new Error("Expected promised definition to be either a template, a directive definition object," +
                            "or a directive definition factory");
                    }
                    if (!angular.isDefined(definition.controller)) {
                        definition.controller = function () {
                        };
                    }
                    definition.controller = bracketToAnnotation(definition.controller);
                    definition.link = bracketToAnnotation(definition.link);
                    if (angular.isFunction(definition.link)) {
                        definition.link = {
                            post: definition.link
                        };
                    }
                    if (!angular.isObject(definition.link)) {
                        definition.link = {};
                    }
                    definition.link.pre = bracketToAnnotation(definition.link.pre);
                    definition.link.post = bracketToAnnotation(definition.link.post);
                    if (angular.isString(definition.templateUrl)) {
                        delete definition.template;
                        $http.get(definition.templateUrl, {
                            cache: $templateCache
                        }).then(function (result) {
                            definition.template = result.data;
                            templateAvailable.resolve(definition);
                        }, function (reason) {
                            throw new Error("Failed to resolve template for directive `" + id + "` from url `" + definition.templateUrl + "`", reason);
                        });
                    } else {
                        if (angular.isFunction(definition.template)) {
                            definition.template = definition.template.apply(null, [directive]);
                        }
                        if (!angular.isString(definition.template)) {
                            throw new Error("Template for directive `" + id + "` must be a string");
                        }
                        templateAvailable.resolve(definition);
                    }
                }, function (reason) {
                    throw new Error("Failed to resolve definition for directive `" + id + "`", reason);
                });
                directive.controller = bracketToAnnotation(["$injector", "$transclude", "$scope", "$element", "$attrs", "$compile",
                    function ($injector, $transclude, $scope, $element, $attrs, $compile) {
                        //let's create the original controller and get it over with
                        $injector.invoke(bindAnnotated(originalController, self, $scope, $element, $attrs, $transclude));
                        templateAvailable.promise.then(function (definition) {
                                var templateElement = $(definition.template);
                                if (angular.isDefined($transclude)) {
                                    if (angular.isDefined(templateElement.attr('ng-transclude'))) {
                                        templateElement.attr('ng-transclude', null);
                                        templateElement.attr('bu-transclude', '');
                                    }
                                    templateElement.find('[ng-transclude]').each(function () {
                                        var $this = $(this);
                                        $this.attr('ng-transclude', null);
                                        $this.attr('bu-transclude', '');
                                    });
                                }
                                if (angular.isFunction(definition.controller)) {
                                    $injector.invoke(bindAnnotated(definition.controller, self, $scope, $element, $attrs, $transclude));
                                }
                                $compile(templateElement)($scope.$new(), function (clone) {
                                    if (directive.replace === true) {
                                        $element.replaceWith(clone);
                                    } else {
                                        $element.append(clone);
                                    }
                                    //By storing a reference to the directive's controller in the DOM element's
                                    //data store we are guaranteeing that AngularJS's `require` syntax will work
                                    //on other elements.
                                    clone.data('$' + bu$name.directive(id) + 'Controller', directive.controller);
                                    templatePreprocessed.resolve(definition);
                                    preLinked.promise.then(function () {
                                        if (angular.isDefined($transclude)) {
                                            //here we look up the transclusion target which now bears the 'bu-transclude'
                                            //attribute instead of 'ng-transclude'
                                            var $clone = $(clone);
                                            var transclusionTarget = angular.isDefined($clone.attr('bu-transclude')) ? $clone : $clone.find('[bu-transclude]');
                                            $transclude(descriptor.$scope, function (transcludedElements) {
                                                if (transclusionTarget.length == 0) {
                                                    throw new Error("Transclusion target could not be found");
                                                }
                                                angular.forEach(transcludedElements, function (transcludedElement) {
                                                    transclusionTarget.append(transcludedElement);
                                                });
                                            });
                                        }
                                        transcluded.resolve(definition);
                                    }, function (reason) {
                                        throw new Error("Pre-linking directive `" + id + "` failed", reason);
                                    });
                                    postLinked.promise.then(function () {
                                    }, function (reason) {
                                        throw new Error("Post-linking directive `" + id + "` failed: ", reason);
                                    });
                                });
                            },
                            function (reason) {
                                throw new Error("Failed to fetch template for directive `" + id + "`", reason);
                            });
                    }]);
                directive.compile = bracketToAnnotation(['tElement', 'tAttrs', function (tElement, tAttrs) {
                    var link = $injector.invoke(originalCompile, this, {
                        tElement: tElement,
                        element: tElement,
                        templateElement: tElement,
                        $templateElement: tElement,
                        $element: tElement,
                        tAttrs: tAttrs,
                        attrs: tAttrs,
                        templateAttrs: tAttrs,
                        $templateAttrs: tAttrs,
                        $attrs: tAttrs
                    });
                    var originalPreLink = link.pre;
                    var originalPostLink = link.post;
                    link.pre = bracketToAnnotation(['$scope', '$element', '$attrs', 'controller', '$transclude', function ($scope, $element, $attrs, controller, $transclude) {
                        var self = this;
                        templatePreprocessed.promise.then(function (definition) {
                            //let's run the original pre-link function.
                            (originalPreLink || angular.noop).apply(self, [$scope, $element, $attrs, controller, $transclude]);
                            //and its time to hand over the control to the promised preLink function (if any)
                            (angular.isFunction(definition.link.pre) ? definition.link.pre : angular.noop).apply(self, [$scope, $element, $attrs, controller, $transclude]);
                            //now, let's signal that pre-linking is finished
                            preLinked.resolve();
                        });
                    }]);
                    link.post = bracketToAnnotation(['$scope', '$element', '$attrs', 'controller', '$transclude', function ($scope, $element, $attrs, controller, $transclude) {
                        var self = this;
                        transcluded.promise.then(function (definition) {
                            //let's run the original post-link function.
                            (originalPostLink || angular.noop).apply(self, [$scope, $element, $attrs, controller, $transclude]);
                            //and its time to hand over the control to the promised preLink function (if any)
                            (angular.isFunction(definition.link.post) ? definition.link.post : angular.noop).apply(self, [$scope, $element, $attrs, controller, $transclude]);
                        });
                    }]);
                    return link;
                }]);
                return directive;
            }]);
        });
        /**
         * We are registering the factory with the AngularJS $compileProvider. This should happen last, when all
         * other modifications on the factory have been performed.
         */
        registry.on('register', function (id, descriptor) {
            var factory = descriptor.productionFactory;
            if (!config.autoRegisterDirective) {
                return descriptor;
            }
            if (!config.useMaskedFactory) {
                factory = descriptor.factory;
            }
            $compileProvider.directive(bu$name.directive(id), factory);
            return descriptor;
        });
        var bu$directiveCompiler = {
            /**
             * registers a new directive
             * @param {String} id the name of the directive
             * @param {Function} directive the directive factory
             */
            register: function (id, directive) {
                registry.register(id, directive);
            },
            /**
             * @returns {Array} all registered directives
             */
            list: function () {
                return registry.list();
            },
            /**
             * @returns {Object} identification and size information
             */
            info: function () {
                return registry.info();
            },
            /**
             * This is to keep track of any newly added directives that have not been compiled yet
             * @returns {Array} the identifiers of all directives that have not been compiled yet
             */
            uncompiled: function () {
                return newDirectives;
            },
            /**
             * Forgets any new and uncompiled directives.
             * @returns {Array} the list of directives being forgotten
             */
            flush: function () {
                return newDirectives.splice(0, newDirectives.length);
            },
            /**
             * Returns a list of nodes that if compiled, will contain all the newly added directives
             * @param {HTMLElement|jQuery} [root] the root element for the DOM subtree. If not specified, the
             * root of the AngularJS application will be used
             * @returns {Array}
             */
            findUncompiled: function (root) {
                if (angular.isUndefined(root)) {
                    root = $rootElement;
                } else {
                    root = angular.element(root);
                }
                var newDirectives = bu$directiveCompiler.uncompiled();
                var directives = [];
                for (var i = 0; i < newDirectives.length; i++) {
                    directives.push(registry.get(newDirectives[i]));
                }
                var nodes = [];
                var collect = function (node) {
                    while (node) {
                        var chosen;
                        for (var i = 0; i < directives.length; i++) {
                            var directive = directives[i];
                            chosen = directive.filter.call(bu$directiveCompiler, node);
                            if (chosen) {
                                break;
                            }
                        }
                        if (chosen) {
                            nodes.push(chosen);
                        } else {
                            collect(node.firstChild);
                        }
                        node = node.nextSibling;
                    }
                };
                collect(root[0]);
                return nodes;
            },
            /**
             * Compiles the DOM tree at the specified root element using the given copmile function
             * @param {HTMLElement|jQuery} [root] the root of the compilation DOM subtree. Will fall back to the
             * AngularJS's ng-app root element via $rootElement.
             * @param {Function} [compileFunction] the compile function which will be expected to carry on the
             * actual compiling of a given node. Will fall back to AngularJS's $compile if not provided.
             */
            compile: function (root, compileFunction) {
                compileFunction = bracketToAnnotation(compileFunction);
                if (!angular.isFunction(compileFunction)) {
                    compileFunction = function (node, scope, offer) {
                        offer($compile(node)(scope));
                    };
                    compileFunction.$inject = ["node", "scope", "offer"];
                }
                var uncompiled = bu$directiveCompiler.findUncompiled(root);
                bu$directiveCompiler.flush();
                for (var i = 0; i < uncompiled.length; i++) {
                    var node = uncompiled[i];
                    var scope = angular.element(node).scope();
                    if (angular.isUndefined(scope)) {
                        scope = $rootScope;
                    }
                    $injector.invoke(compileFunction, bu$directiveCompiler, {
                        node: node,
                        scope: scope,
                        offer: function (result) {
                            node = angular.element(result);
                        }
                    });
                }
            }
        };
        this.$get = function (_bu$name, _$rootElement, _$compile, _$rootScope) {
            bu$name = _bu$name;
            $rootElement = _$rootElement;
            $compile = _$compile;
            $rootScope = _$rootScope;
            return bu$directiveCompiler;
        };
        this.$get.$inject = ["bu$name", "$rootElement", "$compile", "$rootScope"];
    }]);

    /**
     * We will have to configure the $templateCache to look for 'bui:' namespace prefix and replace them
     * with the current namespace
     */
    toolkit.config(["bu$configurationProvider", "$templateCacheProvider", "$injector", function (bu$configurationProvider, $templateCacheProvider, $injector) {
        var bu$configuration = $injector.invoke(bu$configurationProvider.$get);
        var prefix = bu$configuration.namespace ? (bu$configuration.namespace + ":") : "";
        $templateCacheProvider.intercept(function (template) {
            /**
             * All things 'bui:' will be replaced with the current namespace + ':' or the empty string
             * if none is present.
             * To prevent this, prefix 'bui:' with a dollar sign ($). These will be converted so that
             * the dollar sign is removed.
             * This process happens only once, when the template is being persisted.
             */
            return template.replace(/([^\$])bui:/gi, "$1" + prefix).replace(/\$(bui:)/gi, "$1");
        });
    }]);

})(evaluateExpression("window.angular"), evaluateExpression("window.jQuery"));