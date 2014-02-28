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
        dynamic: {},
        tools: {},
        classes: {},
        directives: {},
        filters: {}
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
        config.preload = [
            {
                type: "directive",
                name: "icon"
            },
            {
                type: "directive",
                name: "breadcrumb"
            },
            {
                type: "directive",
                name: "dropdown"
            },
            {
                type: "directive",
                name: "buttonGroup"
            },
            {
                type: "directive",
                name: "inputGroup"
            },
            {
                type: "directive",
                name: "container"
            },
            {
                type: "directive",
                name: "pagination"
            },
            {
                type: "filter",
                name: "capitalize"
            },
            {
                type: "filter",
                name: "capitalizeFirst"
            },
            {
                type: "filter",
                name: "range"
            }
        ];
        var i;
        for (i = 0; i < config.directives.length; i++) {
            config.preload.push({
                type: "directive",
                name: config.directives[i]
            });
        }
        for (i = 0; i < config.filters.length; i++) {
            config.preload.push({
                type: "filter",
                name: config.filters[i]
            });
        }
        config.loaded = 0;
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

    /**
     * Will bootstrap the UI on the given root element
     * @param root optional, assumed to be `document` if not provided
     */
    BootstrapUI.bootstrap = function (root) {
        console.debug("Bootstrapping the UI");
        if (!root) {
            root = document;
        }
        if (root.uiBootstrapped) {
            throw "This element has been already bootstrapped";
        }
        root.uiBootstrapped = true;
        for (var i = 0; i < config.preload.length; i++) {
            if (config.preload[i].type == "directive") {
                $.getScript(config.base + "/" + config.directivesBase + "/" + config.preload[i].name + ".js", function () {
                    config.loaded ++;
                });
            } else if (config.preload[i].type == "filter") {
                $.getScript(config.base + "/" + config.filtersBase + "/" + config.preload[i].name + ".js", function () {
                    config.loaded ++;
                });
            } else {
                throw "Unknown preload content type: " + config.preload[i].type;
            }
        }
        config.waiting = setInterval(function () {
            if (config.loaded == config.preload.length) {
                clearInterval(config.waiting);
                var obj;
                for (obj in BootstrapUI.dynamic) {
                    //noinspection JSUnfilteredForInLoop
                    var directive = BootstrapUI.dynamic[obj];
                    if (!directive.isDirective) {
                        continue;
                    }
                    //noinspection JSUnfilteredForInLoop
                    BootstrapUI.directives[BootstrapUI.classes.Directive.qualify(obj)] = directive.factory;
                }
                for (obj in BootstrapUI.dynamic) {
                    //noinspection JSUnfilteredForInLoop
                    var filter = BootstrapUI.dynamic[obj];
                    if (!filter.isFilter) {
                        continue;
                    }
                    //noinspection JSUnfilteredForInLoop
                    BootstrapUI.filters[obj] = filter.factory;
                }
                console.debug("UI ready");
                new BootstrapUI.classes.State({
                    bind: function (module, callback) {
                        console.debug("Binding the directives");
                        module.directive(BootstrapUI.directives);
                        module.filter(BootstrapUI.filters);
                        angular.bootstrap(this.applicationRoot, [module.name]);
                        if ($.isFunction(callback)) {
                            callback.apply(this, [module]);
                        }
                    }
                }, {
                    directives: BootstrapUI.directives,
                    filters: BootstrapUI.filters,
                    applicationRoot: root
                }).trigger(root, "ui.ready");
            }
        }, 1);
    };
    BootstrapUI.configure(config);
    $(function () {
        $("html[data-bootstrapui]").each(function () {
            console.debug("Auto-bootstrap in progress");
            BootstrapUI.bootstrap(this);
            console.debug("Auto-bootstrap done.");
        });
    });
})(jQuery, angular, BootstrapUIConfig);