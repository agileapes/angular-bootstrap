function ifDefined(variable) {
    try {
        return eval(variable);
    } catch (e) {
        return null;
    }
}

(function ($, angular, config) {

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

    BootstrapUI = {
        version: "0.4",
        tools: {},
        classes: {},
        directives: {},
        filters: {},
        ext: {}
    };

    //*****
    // Classes
    //*****

    /**
     * State class which is quite handy in creating complex event objects and allowing for conditional behaviour
     * @param initializer the public fields and methods of the state object
     * @param privates the private fields and methods of the state object
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
     * @param version the version of the directive
     * @param url the URL to the template
     * @param factory the directive calculation lambda (optional)
     * @constructor
     */
    BootstrapUI.classes.Directive = function (version, url, factory) {
        this.isDirective = true;
        this.version = version;
        this.templateUrl = config.base + "/" + config.templateBase + "/" + url + ".html";
        this.factory = factory ? factory : function () {
            return {};
        };
    };

    BootstrapUI.classes.Directive.qualify = function (name) {
        if (config.namespace == "") {
            return name;
        } else {
            return config.namespace + name[0].toUpperCase() + name.substring(1);
        }
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

    BootstrapUI.tools.console = {
        preserve: false,
        messages: [],
        handler: function (logger) {
            logger = BootstrapUI.tools.console.proxy("console." + logger);
            return function () {
                if (!config.debug) {
                    return;
                }
                for (var i = 0; i < arguments.length; i++) {
                    var argument = arguments[i];
                    if (BootstrapUI.tools.console.preserve) {
                        BootstrapUI.tools.console.messages.push(argument);
                    }
                    if (logger) {
                        logger(argument);
                    }
                }
            }
        },
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
        BootstrapUI.preloader.directive(config.directives);
        BootstrapUI.preloader.filter(config.filters);
        if (config.preloadAll) {
            BootstrapUI.preloader.directive("breadcrumb", "buttonGroup", "container", "dropdown", "form", "icon", "inputGroup", "pagination");
            BootstrapUI.preloader.filter("range", "capitalize", "capitalizeFirst");
        }
        BootstrapUI.config = config;
    };

    BootstrapUI.preloader = {
        items: {},
        qualify: function (component) {
            if (component.type == "directive") {
                return config.base + "/" + config.directivesBase + "/" + component.name + ".js";
            } else if (component.type == "filter") {
                return config.base + "/" + config.filtersBase + "/" + component.name + ".js";
            } else {
                BootstrapUI.tools.console.error("Failed to resolve path for unknown component " + component.name);
                return null;
            }
        },
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
            if (typeof name == "undefined") {
                var components = [];
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
                                deferred.reject(name, component.loadError);
                                return;
                            }
                            deferred.resolve(name, true);
                            delete component.loading;
                        },
                        error: function (xhr, error) {
                            deferred.reject(name, error);
                        }
                    });
                }
            }
            return  deferred.promise();
        }
    };

    BootstrapUI.register = function (component, factory) {
        if (!factory && $.isFunction(component)) {
            factory = component;
            component = null;
        } else if ($.isFunction(component)) {
            component = component();
        }
        BootstrapUI.preloader.get(component).loaded = true;
        var registry = {};
        factory.apply(registry, [registry, BootstrapUI.classes, BootstrapUI.tools]);
        $.each(registry, function (simpleName, value) {
            if (value.isDirective) {
                if (BootstrapUI.directives[BootstrapUI.classes.Directive.qualify(simpleName)]) {
                    return;
                }
                BootstrapUI.directives[BootstrapUI.classes.Directive.qualify(simpleName)] = value.factory;
                BootstrapUI.tools.console.debug("Registered directive: " + simpleName);
            } else if (value.isFilter) {
                if (BootstrapUI.filters[simpleName]) {
                    return;
                }
                BootstrapUI.filters[simpleName] = value.factory;
                BootstrapUI.tools.console.debug("Registered filter: " + simpleName);
            } else {
                BootstrapUI.tools.console.error("Unknown component discovered " + simpleName);
            }
        });
    };

    /**
     * Will bootstrap the UI on the given root element
     * @param root optional, assumed to be `document` if not provided
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
    setTimeout(function () {
        loader = BootstrapUI.preloader.load();
        $(function () {
            $("html[data-bootstrapui]").each(function () {
                BootstrapUI.tools.console.debug("Auto-bootstrap starting ...");
                BootstrapUI.bootstrap(this);
            });
        });
    }, 0);
})(ifDefined("jQuery"), ifDefined("angular"), ifDefined("BootstrapUIConfig"));