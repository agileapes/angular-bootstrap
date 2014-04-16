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

    toolkit.provider("bu$directiveCompiler", ["$injector", "bu$registryFactoryProvider", "$compileProvider", function ($injector, bu$registryFactoryProvider, $compileProvider) {
        var bu$registryFactory = $injector.invoke(bu$registryFactoryProvider.$get, bu$registryFactoryProvider);
        var registry = bu$registryFactory("bu$directiveCompiler$registry");
        var newDirectives = [];
        var bu$name, $rootElement, $compile, $rootScope, bu$configuration, bu$interval;
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
        /**
         * This function works much like the Function.prototype.bind(...) function, with the difference that it
         * also adds a $inject dependency annotation, even if the input is not a function strictly speaking.
         * You can't use the bind function with $injector, neither the native one nor the one implemented here,
         * since both return functions that can't be used for type inference and both will abandon the $inject
         * property.
         * @param {Function|Array} fn the function to be bound or a function with dependencies defined in the
         * bracket notation
         * @param {*} [thisArg] the context of the function call
         * @param {*} [p0] the first parameter to the call
         * @param {*} [_]* the rest of the arguments
         * @returns {Function}
         */
        var bindAnnotated = function (fn, thisArg, p0, _) {
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
        //we push the directive being registered to the stack of new directives since we will not be compiling
        //them again
        registry.on('register', function (id) {
            newDirectives.push(id);
        });
        //we will compose a directive factory descriptor that we will use later on to perform more magic
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
                //the identifier of the directive without any namespace prefixing
                identifier: id,
                //the factory originally passed over to the system, except this one is always in annotated notation
                //even if it was originally in bracket format
                factory: factory,
                //the production factory that is actually registered with AngularJS and is not necessarily
                //the one passed through originally
                productionFactory: factory,
                //this is the directive at the time the factory was registered with the system
                directive: directiveDefinition,
                /**
                 * This is a filter function that when called upon can tell whether or not the directive will
                 * target the given node. The filter will pick either this node or a node somewhere higher in
                 * the hierarchy.
                 * @param {HTMLElement} node
                 * @returns {HTMLElement} or null if the filter does not want to pick out this node
                 */
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
            //let's now mask the factory
            descriptor.productionFactory = function ($injector) {
                var directive = $injector.invoke(descriptor.factory);
                //if the directive is a function, it is the post-link, and we need to change it from
                //bracket notation to annotation
                directive = bracketToAnnotation(directive);
                if (angular.isFunction(directive)) {
                    directive = {
                        link: directive
                    };
                }
                directive.link = bracketToAnnotation(directive.link);
                //if the link is a function it is actually the post-link
                if (angular.isFunction(directive.link)) {
                    directive.link = {
                        post: directive.link
                    };
                }
                //we now define the linker in its complete form and whole glory
                var linker = {
                    pre: directive.link && directive.link.pre ? directive.link.pre : function () {
                    },
                    post: directive.link && directive.link.post ? directive.link.post : function () {
                    }
                };
                //let's delete the link so that only the compile function remains
                delete directive.link;
                //if by this point the directive is not a complete object something is seriously
                //wrong with the user's inhibitions or they are using IE4 or less.
                if (!angular.isObject(directive)) {
                    throw new Error("Invalid descriptor definition for " + id);
                }
                //if restrict is not defined, set it to attribute selector
                if (!angular.isString(directive.restrict)) {
                    directive.restrict = "A";
                }
                //if replace is not defined strictly set it to negative
                if (angular.isUndefined(directive.replace)) {
                    directive.replace = false;
                }
                //if transclude is not defined set it explicitly to false
                if (angular.isUndefined(directive.transclude)) {
                    directive.transclude = false;
                }
                //let us enforce the default priority of 0 if it is not defined
                if (angular.isUndefined(directive.priority)) {
                    directive.priority = 0;
                }
                //if scope is not set, let's have it inherit the parent scope
                if (angular.isUndefined(directive.scope)) {
                    directive.scope = false;
                }
                //if nothing is said about requirements, we will set it to null to make it more verbose
                if (angular.isUndefined(directive.require)) {
                    directive.require = null;
                } else if (angular.isString(directive.require)) {
                    //if require is available, we will scan it and change `bu$` to namespace prefix
                    directive.require = directive.require.replace(/bu\$([A-Z]\S*)/g, function (match, directive) {
                        if (directive[0].toLowerCase() == directive[0]) {
                            return match;
                        }
                        return bu$name.directive(directive[0].toLowerCase() + directive.substring(1));
                    });
                }
                //let's have the templateUrl fall into our definitions
                if (angular.isString(directive.templateUrl) && !/\.[^\.]+$/.test(directive.templateUrl)) {
                    directive.templateUrl = (bu$configuration.base + "/" + bu$configuration.templatesBase + "/" + directive.templateUrl).replace(/\/{2,}/g, "/");
                }
                //if transcludeProperty is not defined, we need to set it to false
                if (!angular.isDefined(directive.transcludeProperty)) {
                    directive.transcludeProperty = false;
                }
                //if no controller is present, replace it with a dummy
                if (angular.isUndefined(directive.controller)) {
                    directive.controller = function () {
                    };
                }
                //if compile function is not present, we return the linker cached earlier.
                //if there is one present, the natural order of things takes form and the defined compiler
                //takes precedence over the linker even if it _was_ originally defined by the developer providing
                //the directive definition object
                if (!angular.isFunction(directive.compile)) {
                    directive.compile = function () {
                        return linker;
                    };
                }
                //let's convert everything to the annotational format, just to be on the safe side
                //also, I would like to sleep free of the AngularJS guru haunting my dreams
                linker.pre = bracketToAnnotation(linker.pre);
                linker.post = bracketToAnnotation(linker.post);
                directive.compile = bracketToAnnotation(directive.compile);
                directive.controller = bracketToAnnotation(directive.controller);
                return directive;
            };
            //last but not least ... dependencies
            descriptor.productionFactory.$inject = ["$injector"];
            return descriptor;
        });
        //let us now mask the production factory one more layer to enable support for injecting values into
        //pre- and post-link functions
        registry.on('register', function (id, descriptor) {
            if (!config.maskFactory) {
                return;
            }
            //don't forget the original factory. we will be calling it first thing.
            var productionFactory = descriptor.productionFactory;
            descriptor.productionFactory = bracketToAnnotation(["$injector", function ($injector) {
                var directive = $injector.invoke(bracketToAnnotation(productionFactory), this, {
                    $injector: $injector
                });
                var compile = directive.compile;
                directive.compile = function (tElement, tAttrs) {
                    var linker = $injector.invoke(bracketToAnnotation(compile), this, {
                        tElement: tElement,
                        tAttrs: tAttrs
                    });
                    if (angular.isFunction(linker)) {
                        linker = {
                            post: linker
                        };
                    }
                    linker.pre = bracketToAnnotation(linker.pre);
                    linker.post = bracketToAnnotation(linker.post);
                    return {
                        pre: function (scope, element, attributes, controller) {
                            return $injector.invoke(bindAnnotated(linker.pre, this, scope, element, attributes, controller));
                        },
                        post: function (scope, element, attributes, controller) {
                            return $injector.invoke(bindAnnotated(linker.post, this, scope, element, attributes, controller));
                        }
                    };
                };
                return directive;
            }]);
        });
        //Here we will mask the production factory one more layer to enable the `defaults` magic on the
        //directive definition object
        //This will only work if masking is enabled
        registry.on('register', function (id, descriptor) {
            if (!config.maskFactory) {
                return descriptor;
            }
            //don't forget the original factory. we will be calling it first thing.
            var productionFactory = descriptor.productionFactory;
            descriptor.productionFactory = bracketToAnnotation(["$injector", "$timeout", function ($injector, $timeout) {
                //let's find out what the factory gives us initially.
                var directive = $injector.invoke(productionFactory, this, {
                    $inject: $injector
                });
                //if no defaults are specified the production factory's controller won't be masked at all
                if (angular.isUndefined(directive.defaults) || !angular.isObject(directive.defaults)) {
                    return directive;
                }
                //this is the original controller (which might or might not be undefined or a no-op)
                var controller = bracketToAnnotation(directive.controller);
                directive.controller = bracketToAnnotation(["$scope", "$element", "$attrs", "$transclude", function ($scope, $element, $attrs, $transclude) {
                    $timeout(function () {
                        //let's scan the defaults and apply them if necessary
                        angular.forEach(directive.defaults, function (value, key) {
                            if (angular.isUndefined(directive.scope[key])) {
                                throw new Error("Variable `" + key + "` is not defined in the scope of directive `" + id + "`");
                            }
                            if (directive.scope[key][0] != "@") {
                                throw new Error("Variable `" + key + "` is not bound uni-directionally on directive `" + id + "`");
                            }
                            if (angular.isUndefined($attrs[key])) {
                                value = bracketToAnnotation(value);
                                //let's see if value requires further evaluation
                                if (angular.isFunction(value)) {
                                    value = $injector.invoke(value, controller, {
                                        $scope: $scope,
                                        $element: $element,
                                        $attrs: $attrs,
                                        key: key,
                                        $attr: key
                                    });
                                }
                                $scope[key] = value;
                            }
                        });
                    });
                    //now let's call the original controller. It doesn't really matter if this call is placed
                    //before the previous statement, as it will always take precedence since $timeout will postpone
                    //the call to the wrapped function (the same as setTimeout). This is important, since it means
                    //the defaults won't be available to the controller (they will be available if the controller places
                    //its execution inside $timeout. this is why I've placed this statement second to the previous, as
                    //in some cases it might be necessary to take advantage of defaults inside the controller)
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
            descriptor.productionFactory = bracketToAnnotation(["$injector", "$q", "$http", "$templateCache", "$compile", function ($injector, $q, $http, $templateCache, $compile) {
                var directive = $injector.invoke(productionFactory, this, {
                    $injector: $injector
                });
                if (!angular.isDefined(directive.resolve) || !angular.isFunction(directive.resolve.then)) {
                    return directive;
                }
                //we will delete the templates so that rendering is not done by AngularJS
                //we leave off the `template` to let directives place a sort of `loader` into the element
                //before resolving the promise
                delete directive.templateUrl;
                //let's keep references to the compile and controller functions, as they are what we will mask
                var originalCompile = directive.compile;
                var originalController = directive.controller;
                //we will create a set of deferred objects to manage our workflow.
                /*
                 * first, the template will be made available to us
                 * accepted formats by resolving the promise are:
                 *
                 *  1. a string, which will be interpreted to be the template
                 *  2. a directive definition object which can contain template, templateUrl, controller,
                 *      preLink, and postLink
                 *  3. a promise which could be resolve to either of the above
                 *  4. a function which returns any of the above
                 *
                 *  This happens right after the original promise through the `resolve` property is resolved
                 */
                var templateAvailable = $q.defer();
                //after the template is available, we need to pre-process it, which involves the actual compiling
                //this triggers the preLink
                var templatePreprocessed = $q.defer(); //resolved inside the controller
                //after preLinked is fulfilled, we need to head to transclusion
                var preLinked = $q.defer(); //resolved inside the compile (preLink)
                //transcluded is resolved when the children are linked
                //this signals that post-linking can be done
                var transcluded = $q.defer(); //resolved inside the controller
                //this promise indicates that the process has finished successfully
                var postLinked = $q.defer(); //resolved inside the compile (postLink)
                var sharedPromises = {
                    waitQueue: {},
                    given: function (id) {
                        if (!angular.isArray(sharedPromises.waitQueue[id])) {
                            sharedPromises.waitQueue[id] = [];
                        }
                        return {
                            perform: function (callback) {
                                var index = sharedPromises.waitQueue[id].length;
                                sharedPromises.waitQueue[id][index] = bu$interval(function () {
                                    if (angular.isObject(sharedPromises[id])) {
                                        bu$interval.cancel(sharedPromises.waitQueue[id][index]);
                                        delete sharedPromises.waitQueue[id][index];
                                        callback.apply(sharedPromises[id], [id]);
                                    }
                                }, 10);
                            }
                        };
                    },
                    clean: function (id) {
                        if (!angular.isArray(sharedPromises.waitQueue[id])) {
                            return false;
                        }
                        for (var i = 0; i < sharedPromises.waitQueue[id].length; i ++) {
                            if (angular.isDefined(sharedPromises.waitQueue[id][i])) {
                                bu$interval.cancel(sharedPromises.waitQueue[id][i]);
                                delete sharedPromises.waitQueue[id][i];
                            }
                        }
                        delete sharedPromises.waitQueue[id];
                    }
                };
                angular.forEach([templateAvailable, templatePreprocessed, preLinked, transcluded, postLinked], function (deferred) {
                    //now let's augment the promises created above to include the `progress` method usually
                    //available in a Q promise, only it is capable of understanding our notifications
                    /**
                     * Watches the progress of the deferred object as it is nudged.
                     * @param {Function} success
                     * @param {Function} [failure]
                     * @param {Function} [progress]
                     * @returns {{then:then}}
                     */
                    deferred.promise.progress = function (success, failure, progress) {
                        var callbacks = {
                            success: angular.isFunction(success) ? success : angular.noop,
                            failure: angular.isFunction(failure) ? failure : angular.noop,
                            progress: angular.isFunction(progress) ? progress : angular.noop
                        };
                        return deferred.promise.then(function () {
                        }, function () {
                        }, function (value) {
                            var passedValue = angular.extend({}, value);
                            delete passedValue.notification;
                            if (value.notification == "resolve") {
                                return callbacks.success.apply(null, [passedValue]);
                            } else if (value.notification == "reject") {
                                return callbacks.failure.apply(null, [passedValue]);
                            } else if (value.notification == "notify") {
                                return callbacks.progress.apply(null, [passedValue]);
                            } else {
                                throw new Error("Unsupported action on deferred object: " + value.notification);
                            }
                        });
                    };
                    deferred.nudge = {
                        /**
                         * Notifies the given deferred object by annotating the value object passed to it
                         * using a `notification` type tag
                         * @param {String} type the type of the notification (resolve, reject)
                         * @param {Object} value the value being passed
                         * @returns {Deferred}
                         */
                        on: function (type, value) {
                            return deferred.notify(angular.extend({
                                notification: type
                            }, value))
                        },
                        /**
                         * @type {{resolve: resolve, reject: reject, notify: notify}}
                         */
                        to: {}
                    };
                    angular.forEach(['resolve', 'reject', 'notify'], function (action) {
                        deferred.nudge.to[action] = deferred.nudge.on.bind(deferred, action);
                    });
                });
                templateAvailable.promise.progress(function (definition) {
                        var $transclude = definition.$$controller.$transclude;
                        var $scope = definition.$$controller.$scope;
                        var $element = definition.$$controller.$element;
                        var $attrs = definition.$$controller.$attrs;
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
                                clone.data('bu$compiled', true);
                                $element.replaceWith(clone);
                            } else {
                                $element.append(clone);
                            }
                            //By storing a reference to the directive's controller in the DOM element's
                            //data store we are guaranteeing that AngularJS's `require` syntax will work
                            //on other elements.
                            clone.data('$' + bu$name.directive(id) + 'Controller', definition.$$controller.$self);
                            definition.clone = clone;
                            sharedPromises[definition.id].templatePreprocessed.resolve(definition);
                        });
                    }, function (reason) {
                        throw new Error("Failed to fetch template for directive `" + id + "`", reason);
                    }
                );
                preLinked.promise.progress(function (definition) {
                    var clone = definition.clone;
                    if (angular.isDefined(definition.$$preLink.$transclude)) {
                        //here we look up the transclusion target which now bears the 'bu-transclude'
                        //attribute instead of 'ng-transclude'
                        var $clone = $(clone);
                        var transclusionTarget = angular.isDefined($clone.attr('bu-transclude')) ? $clone : $clone.find('[bu-transclude]');
                        var src = "";
                        definition.$$preLink.$transclude(definition.$$preLink.$scope, function (transcludedElements) {
                            if (transclusionTarget.length == 0 && !directive.transcludeProperty) {
                                throw new Error("Transclusion target could not be found");
                            }
                            angular.forEach(transcludedElements, function (transcludedElement) {
                                if (directive.transcludeProperty) {
                                    src += transcludedElement.nodeValue ? transcludedElement.nodeValue : transcludedElement.outerHTML;
                                }
                                transclusionTarget.append(transcludedElement);
                            });
                        });
                        //we also make available the transcluded bit so that it can be used later
                        definition.$$preLink.$scope['$transcluded'] = src;
                    }
                    sharedPromises[definition.id].transcluded.resolve(definition);
                }, function (reason) {
                    throw new Error("Pre-linking directive `" + id + "` failed", reason);
                });
                postLinked.promise.progress(function (definition) {
                    if (!sharedPromises[definition.id]) {
                        return;
                    }
                    delete sharedPromises[definition.id];
                    sharedPromises.clean(definition.id);
                }, function (reason) {
                    throw new Error("Post-linking directive `" + id + "` failed: ", reason);
                });
                templatePreprocessed.promise.progress(function (definition) {
                    var originalPreLink = definition.$$preLink.linker;
                    var $scope = definition.$$preLink.$scope;
                    var $element = definition.$$preLink.$element;
                    var $attrs = definition.$$preLink.$attrs;
                    var controller = definition.$$preLink.controller;
                    var $transclude = definition.$$preLink.$transclude;
                    //let's run the original pre-link function.
                    (originalPreLink || angular.noop).apply(self, [$scope, $element, $attrs, controller, $transclude]);
                    //and its time to hand over the control to the promised preLink function (if any)
                    (angular.isFunction(definition.link.pre) ? definition.link.pre : angular.noop).apply(self, [$scope, $element, $attrs, controller, $transclude]);
                    //now, let's signal that pre-linking is finished
                    preLinked.nudge.to.resolve(definition);
                });
                transcluded.promise.progress(function (definition) {
                    var originalPostLink = definition.$$postLink.linker;
                    var $scope = definition.$$postLink.$scope;
                    var $element = definition.$$postLink.$element;
                    var $attrs = definition.$$postLink.$attrs;
                    var controller = definition.$$postLink.controller;
                    var $transclude = definition.$$postLink.$transclude;
                    //let's run the original post-link function.
                    (originalPostLink || angular.noop).apply(self, [$scope, $element, $attrs, controller, $transclude]);
                    //and its time to hand over the control to the promised postLink function (if any)
                    (angular.isFunction(definition.link.post) ? definition.link.post : angular.noop).apply(self, [$scope, $element, $attrs, controller, $transclude]);
                    postLinked.nudge.to.resolve(definition);
                });
                directive.controller = bracketToAnnotation(["$scope", "$element", "$attrs", "$transclude", "$injector",
                    function ($scope, $element, $attrs, $transclude, $injector) {
                        if ($element.data('bu$compiled')) {
                            return;
                        }
                        var self = this;
                        $element.data('bu$compiled', true);
                        //let's create the original controller and get it over with
                        $injector.invoke(bindAnnotated(originalController, self, $scope, $element, $attrs, $transclude));
                        //he have a promise ... we will assume that the promise will be fulfilled.
                        //don't disappoint us. :-)
                        var promise = directive.resolve;
                        var interim = $q.defer();
                        promise.then(function (definition) {
                            definition = bracketToAnnotation(definition);
                            if (angular.isFunction(definition)) {
                                definition = $injector.invoke(bindAnnotated(definition, self, $scope, $element, $attrs));
                            }
                            if (angular.isFunction(definition.then)) {
                                definition.then(function (definition) {
                                    interim.resolve(definition);
                                }, function (reason) {
                                    interim.reject(reason);
                                });
                            } else {
                                interim.resolve(definition);
                            }
                        }, function (reason) {
                            interim.reject(reason);
                        });
                        interim.promise.then(function (template) {
                            var definition = bracketToAnnotation(template);
                            if (angular.isFunction(definition)) {
                                definition = $injector.invoke(bindAnnotated(definition, self, $scope, $element, $attrs));
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
                            definition.$injector = $injector;
                            definition.$$controller = {
                                $scope: $scope,
                                $element: $element,
                                $attrs: $attrs,
                                $transclude: $transclude,
                                $self: self
                            };
                            definition.id = $scope.$id;
                            sharedPromises[definition.id] = {
                                templatePreprocessed: $q.defer(),
                                transcluded: $q.defer()
                            };
                            if (angular.isString(definition.templateUrl)) {
                                //if templateUrl is defined, template must go home
                                delete definition.template;
                                //we will cache and retrieve the template over $http and then resolve the templateAvailable
                                //deferred object
                                $http.get(definition.templateUrl, {
                                    cache: $templateCache
                                }).then(function (result) {
                                    definition.template = result.data;
                                    templateAvailable.nudge.to.resolve(definition);
                                }, function (reason) {
                                    throw new Error("Failed to resolve template for directive `" + id + "` from url `" + definition.templateUrl + "`", reason);
                                });
                            } else {
                                //if the template is a function, we will resolve it
                                if (angular.isFunction(definition.template)) {
                                    definition.template = definition.template.apply(null, [directive]);
                                }
                                if (!angular.isString(definition.template)) {
                                    throw new Error("Template for directive `" + id + "` must be a string");
                                } else if (definition.template == "" || !/^\s*<.*>\s*$/m.test(definition.template)) {
                                    throw new Error("Template for directive `" + id + "` must contain exactly one root element");
                                }
                                templateAvailable.nudge.to.resolve(definition);
                            }
                        }, function (reason) {
                            throw new Error("Failed to resolve definition for directive `" + id + "`", reason);
                        });
                    }]);
                directive.compile = bracketToAnnotation(['tElement', 'tAttrs', function (tElement, tAttrs) {
                    var link = $injector.invoke(bindAnnotated(originalCompile, this, tElement, tAttrs, undefined));
                    var originalPreLink = link.pre;
                    var originalPostLink = link.post;
                    link.pre = bracketToAnnotation(['$scope', '$element', '$attrs', 'controller', '$transclude', function ($scope, $element, $attrs, controller, $transclude) {
                        var self = this;
                        sharedPromises.given($scope.$id).perform(function () {
                            this.templatePreprocessed.promise.then(function (definition) {
                                definition = angular.extend({
                                    $$preLink: {
                                        linker: originalPreLink,
                                        self: self,
                                        $scope: $scope,
                                        $element: $element,
                                        $attrs: $attrs,
                                        controller: controller,
                                        $transclude: $transclude
                                    }
                                }, definition);
                                templatePreprocessed.nudge.to.resolve(definition);
                            });
                        });
                    }]);
                    link.post = bracketToAnnotation(['$scope', '$element', '$attrs', 'controller', '$transclude', function ($scope, $element, $attrs, controller, $transclude) {
                        var self = this;
                        sharedPromises.given($scope.$id).perform(function () {
                            this.transcluded.promise.then(function (definition) {
                                definition = angular.extend({
                                    $$postLink: {
                                        linker: originalPostLink,
                                        self: self,
                                        $scope: $scope,
                                        $element: $element,
                                        $attrs: $attrs,
                                        controller: controller,
                                        $transclude: $transclude
                                    }
                                }, definition);
                                transcluded.nudge.to.resolve(definition);
                            });
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
                        if (chosen && !angular.element(chosen).data('bu$compiled')) {
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
        this.$get = function (_bu$name, _$rootElement, _$compile, _$rootScope, _bu$configuration, _bu$interval) {
            bu$name = _bu$name;
            $rootElement = _$rootElement;
            $compile = _$compile;
            $rootScope = _$rootScope;
            bu$configuration = _bu$configuration;
            bu$interval = _bu$interval;
            return bu$directiveCompiler;
        };
        this.$get.$inject = ["bu$name", "$rootElement", "$compile", "$rootScope", "bu$configuration", "bu$interval"];
    }]);

    toolkit.service('bu$directives', ["bu$directiveCompiler", "bu$loader", "$q", function (bu$directiveCompiler, bu$loader, $q) {
        /**
         * Registers a new directive definition factory or object, given its dependencies
         * @param {String} id
         * @param {Array} [requirements]
         * @param {Function} factory
         */
        this.register = function (id, requirements, factory) {
            console.log('getting to know ' + id);
            if (angular.isUndefined(factory)) {
                factory = requirements;
                requirements = [];
            }
            if (!angular.isArray(requirements)) {
                requirements = [];
            }
            var prerequisites = [];
            for (var i = 0; i < requirements.length; i++) {
                prerequisites.push(bu$loader.load(requirements[i]));
            }
            if (prerequisites.length == 0) {
                var deferred = $q.defer();
                deferred.resolve();
                prerequisites.push(deferred.promise);
            }
            $q.all(prerequisites).then(function () {
                console.log('registering ' + id);
                bu$directiveCompiler.register(id, factory);
                bu$directiveCompiler.compile();
            });
        };
    }]);

    /**
     * This factory will release a function that wraps around setInterval using $timeout to provide valid
     * repeated processes that are also easily testable in the same manner as $timeout.
     *
     * To flush the interval, you will need to call $timeout.flush() in test mode.
     *
     * This is to increase simplicity and compatibility for tests. It is good to note that a clean, testable
     * code should stop its own interval, which would make it transparent to tests, unless it is our intention
     * to actually test the repeatable code.
     */
    toolkit.factory("bu$interval", ["$timeout", "$q", function ($timeout, $q) {
        var rand = Math.random();
        /**
         * The wrapper for setInterval which relies on $timeout for handling deferred event scheduling
         * @param {Function} fn the function to be wrapped
         * @param {int} [delay] the delay in milliseconds. This is optional, though for an interval to repeat
         * without delay is somewhat irregular.
         * @param {boolean} [invokeApply] If set to false skips model dirty checking, otherwise will invoke fn within the $apply block.
         * @returns {promise} a promise that will be *notified* whenever a cycle has completed, and *rejected* when the interval
         * is finally cancelled.
         */
        var bu$interval = function (fn, delay, invokeApply) {
            var cancelled = false;
            var deferred = $q.defer();
            var promise = deferred.promise;
            var reference = $timeout(function caller() {
                if (cancelled) {
                    return;
                }
                deferred.notify(fn.call());
                if (cancelled) {
                    return;
                }
                reference = $timeout(caller, delay, invokeApply);
                if ($timeout.flush) {
                    $timeout.flush.postpone();
                }
            }, delay, invokeApply);
            promise.bu$intervalId = function () {
                return rand;
            };
            promise.stop = function () {
                deferred.reject();
                cancelled = true;
                var cancellation = $timeout.cancel(reference);
                if ($timeout.flush) {
                    try {
                        $timeout.flush();
                    } catch (e) {}
                }
                return cancellation;
            };
            return promise;
        };
        /**
         * Cancels the interval promise which means that the currently scheduled cycle and every other future
         * cycle will be cancelled and not run. This also rejects the promise.
         * @param {promise} promise the promise to be observed.
         * @returns {boolean} Returns true if the task was successfully canceled.
         */
        bu$interval.cancel = function (promise) {
            if (angular.isFunction(promise.stop) && angular.isFunction(promise.bu$intervalId) && promise.bu$intervalId() == rand) {
                return promise.stop();
            }
        };
        return bu$interval;
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