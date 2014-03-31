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
(function (
    //A reference to the AngularJS framework's main instance
    angular) {

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
                    console.debug("Abandoning action" + action + " after " + timeout);
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
                    console.debug("Abandoning action" + action + " after " + timeout);
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
            count ++;
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
    toolkit.value("version", "0.7");

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
                        size ++;
                    }
                },
                unregister: function (id) {
                    runCallbacks('unregister', storage[id], registry, [id, storage[id]]);
                    if (typeof storage[id] != "undefined") {
                        size --;
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
            return config.namespace + name[0].toUpperCase() + name.substring(1);
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
            this.$get.$inject = ["$compile", "$rootElement", "$injector", "bu$name"];
        }).postpone(this);
        var directiveRegistry = bu$registryFactoryProvider.$get()("bu$directiveRegistry");
        this.$get = function ($compile, $rootElement, $injector, bu$name) {
            return function (directiveName, directiveFactory) {
                //a directive name is the least requirement for working with directives
                if (!directiveName) {
                    throw new Error("Directive name cannot be empty " + directiveName);
                }
                var directiveDescriptor = directiveRegistry.get(directiveName);
                if (!directiveDescriptor) {
                    if (angular.isUndefined(directiveFactory)) {
                        throw new Error("No previous description was found for directive " + directiveName);
                    }
                    //invoke the factory with its dependencies
                    var directive = $injector.invoke(directiveFactory, {
                        //this is to signal to the directive factory that we are just pre-loading
                        //the directive, so that if differentiation between an actual angular-driven
                        //construction and this one is necessary it can be done properly by querying
                        //the value 'this.bu$Preload' inside the constructor to see if it is '=== true'
                        bu$Preload: true
                    });
                    if (angular.isFunction(directive)) {
                        //if the result is a function, we assume that it is the post-link method
                        directive = {
                            link: {
                                post: directive
                            }
                        };
                    } else if (angular.isArray(directive) && directive.length > 0 && angular.isFunction(directive[directive.length - 1])) {
                        //if the directive is a function wrapped in bracket dependency notation we assume it to be
                        //the post-link method with its dependencies explicitly defined
                        directive = {
                            link: {
                                post: directive
                            }
                        };
                    } else if (!angular.isObject(directive)) {
                        throw new Error("Invalid directive definition provided for " + directiveName);
                    }
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
                                var attributeName = node.attributes.item(i).name;
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
                        //
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

})(evaluateExpression("window.angular"));