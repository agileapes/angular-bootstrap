(function (toolkit, $) {

    var init = function (prefix, $http, $templateCache, $compile, transclude, registryCallback) {
        if (!registryCallback) {
            registryCallback = function (name, item) {};
        }
        var _registryCallback = registryCallback;
        registryCallback = function (type, definition) {
            toolkit.tools.actionQueue.notify(prefix + "." + type);
            toolkit.tools.console.debug("Registered form component <" + prefix + "." + type + "/>");
            toolkit.ext[prefix].components[type] = definition;
            if (definition.templateUrl) {
                $http.get(definition.templateUrl, {
                    cache: $templateCache
                }).success(function (data) {
                    definition.templateLoader.resolve(data, type);
                });
            }
            _registryCallback(type, definition);
        };
        if (!toolkit.ext[prefix]) {
            toolkit.ext[prefix] = {};
        }
        toolkit.ext[prefix].define = function (definition) {
            definition = $.extend(definition, {
                getType: function () {
                    return prefix;
                }
            });
            definition.templateLoader = $.Deferred();
            definition.templateAvailable = $.Deferred();
            if (definition.templateUrl) {
                definition.templateUrl = toolkit.config.base + "/" + toolkit.config.templateBase + "/" + toolkit.config.form.base + "/" + definition.templateUrl + ".html"
            } else {
                definition.templateLoader.reject();
                definition.templateAvailable.reject();
            }
            if (!definition.link) {
                definition.link = function () {};
            }
            if ($.isFunction(definition.link)) {
                definition.link = {
                    post: definition.link
                };
            }
            if (!definition.link.pre || !$.isFunction(definition.link.pre)) {
                definition.link.pre = function () {};
            }
            if (!definition.link.post || !$.isFunction(definition.link.post)) {
                definition.link.post = function () {};
            }
            if (!definition.controller || !$.isFunction(definition.controller)) {
                definition.controller = function () {};
            }
            return definition;
        };
        toolkit.preloader.qualifiers[prefix] = function (name) {
            return toolkit.config.base + "/" + toolkit.config.directivesBase + "/" + toolkit.config.form.base + "/" + name.replace(new RegExp("^" + prefix + "\\."), "") + ".js";
        };
        toolkit.preloader[prefix] = function (name, _) {
            if (arguments.length > 1) {
                $(arguments).each(function () {
                    toolkit.preloader[prefix](this);
                });
            } else if ($.isArray(name)) {
                $(name).each(function () {
                    toolkit.preloader[prefix](this);
                });
            } else {
                toolkit.preloader.add({
                    name: prefix + "." + name,
                    type: prefix
                });
            }
            return toolkit.preloader;
        };
        toolkit.types[prefix] = registryCallback;
        var initializer = {
            templateAvailable: {},
            link: function (loaded, scopePreparator) {
                return function ($scope, $element, $attributes) {
                    $.each($scope.$$isolateBindings, function (binding, attribute) {
                        $($element).get(0).removeAttribute(attribute.substring(1));
                    });
                    var formController = null;
                    scopePreparator($scope, $element, $attributes, formController);
                    var self = this;
                    loaded.done(function () {
                        toolkit.tools.actionQueue.perform(function (type) {
                            return typeof toolkit.ext[prefix].components[type] != "undefined";
                        }, prefix + "." + $scope.type, function () {
                            if (!toolkit.ext[prefix].components[$scope.type]) {
                                toolkit.tools.console.error("Invalid component type: " + $scope.type);
                                return;
                            }
                            var component = toolkit.ext[prefix].components[$scope.type];
                            var postlink = component.link.post;
                            component.link.post = function ($scope, $element, $attributes, formController, event) {
                                (function () {
                                    if ($scope.id) {
                                        $("#" + $scope.id).on.forward($element, "keypress", "keydown", "keyup", "focus", "blur",
                                            "enter", "leave", "click", "dblclick", "mousemove", "mouseover", "mouseout", "mousedown",
                                            "mouseup", "change", "contextmenu", "formchange", "forminput", "input", "invalid",
                                            "reset", "select", "drag", "dragend", "dragenter", "dragleave", "dragover", "dragstart",
                                            "drop");
                                    }
                                }).postpone(null, [], 0);
                                postlink.apply(this, arguments);
                            };
                            var event = function (scope) {
                                if (!scope) {
                                    scope = $scope;
                                }
                                return function (type) {
                                    return {
                                        element: $element,
                                        scope: scope,
                                        target: scope.id ? $("#" + scope.id) : $element,
                                        type: type
                                    };
                                }
                            };
                            component.link.pre.apply(self, [$scope, $element, $attributes, formController, event($scope)]);
                            (function () {
                                $scope.$apply();
                            }).postpone();
                            if (!initializer.templateAvailable[$scope.type]) {
                                initializer.templateAvailable[$scope.type] = $.Deferred();
                            }
                            if (angular.isUndefined($scope.ngModel) && angular.isDefined($scope.value)) {
                                $scope.ngModel = $scope.value;
                            }
                            if (angular.isDefined($scope.descriptor)) {
                                $scope.$watch("descriptor.label", function (value) {
                                    if (typeof value == "string") {
                                        $scope.label = value;
                                    }
                                });
                                $scope.$watch("descriptor.feedback", function (value) {
                                    if (typeof value == "string") {
                                        $scope.feedback = value;
                                    }
                                });
                                $scope.$watch("descriptor.placeholder", function (value) {
                                    if (typeof value == "string") {
                                        $scope.placeholder = value;
                                    }
                                });
                                $scope.$watch("descriptor.orientation", function (value) {
                                    if (typeof value == "string") {
                                        $scope.orientation = value;
                                    }
                                });
                                $scope.$watch("descriptor.state", function (value) {
                                    if (typeof value == "string") {
                                        $scope.state = value;
                                    }
                                });
                                $scope.$watch("descriptor.labelSize", function (value) {
                                    value = parseInt(value);
                                    if (typeof value == "number") {
                                        $scope.labelSize = value;
                                    }
                                });
                            }
                            initializer.templateAvailable[$scope.type].then(function (compiled) {
                                compiled($scope, function ($clone, $localScope) {
                                    $element.replaceWith($clone);
                                    component.link.post.apply(self, [$localScope, $element, $attributes, formController, event($localScope)]);
                                    (function () {
                                        $scope.$apply();
                                    }).postpone();
                                });
                            });
                        });
                        toolkit.tools.actionQueue.fail(prefix + "." + $scope.type, function () {
                            $($element).addClass("failed");
                        });
                    });
                };
            },
            controller: function (loaded) {
                return ["$scope", "$element", "$attrs", "$transclude", "$timeout", function ($scope, $element, $attrs, $transclude, $timeout) {
                    var self = this;
                    $scope.$timeout = $timeout;
                    loaded.done(function () {
                        $scope.scope = $scope;
                        var node = $element.get(0);
                        var parentScope = {
                            labelSize: 3,
                            orientation: "vertical"
                        };
                        while (node) {
                            var data = $(node).data('form.container');
                            if (data) {
                                parentScope = data;
                                break;
                            }
                            node = node.parentNode;
                        }
                        toolkit.tools.actionQueue.perform(function (type) {
                            return typeof toolkit.ext[prefix].components[type] != "undefined";
                        }, prefix + "." + $scope.type, function () {
                            var component = toolkit.ext[prefix].components[$scope.type];
                            component.templateLoader.promise().done(function (template, type) {
                                if (!initializer.templateAvailable[$scope.type]) {
                                    initializer.templateAvailable[$scope.type] = $.Deferred();
                                }
                                initializer.templateAvailable[$scope.type].resolve($compile(angular.element(template), transclude ? $transclude : null));
                            });
                            if (typeof $scope.labelSize == "undefined") {
                                $scope.labelSize = parentScope.labelSize;
                            }
                            if (typeof $scope.orientation == "undefined") {
                                $scope.orientation = parentScope.orientation;
                            }
                            if (!$scope.labelSize) {
                                $scope.labelSize = 3;
                            }
                            if (!$scope.orientation) {
                                $scope.orientation = "vertical";
                            }
                            if ($scope.orientation != "inline" && $scope.orientation != "vertical" && $scope.orientation != "horizontal") {
                                $scope.orientation = "vertical";
                            }
                            $scope.labelSize = parseInt($scope.labelSize);
                            if (component.controller && $.isFunction(component.controller)) {
                                component.controller.apply(self, [$scope, $element, $attrs, $transclude, $timeout]);
                                (function () {
                                    $scope.$apply();
                                }).postpone();
                            }
                        });
                    });
                }];
            }
        };
        return  initializer;
    };
    var configure = function () {
        if (!toolkit.config.form) {
            toolkit.config.form = {};
        }
        if (typeof toolkit.config.form.preloadAll == "undefined") {
            toolkit.config.form.preloadAll = toolkit.config.preloadAll;
        }
        if (!toolkit.config.form.base) {
            toolkit.config.form.base = "form";
        }
        if (!toolkit.config.form.components) {
            toolkit.config.form.components = [];
        }
    };
    var load = function (prefix, defaultComponents) {
        var loaded = $.Deferred();
        if (toolkit.config.form.preloadAll) {
            toolkit.preloader[prefix](defaultComponents);
        }
        toolkit.preloader.load(prefix + ".*")
            .done(function (acceptance) {
                loaded.resolve(acceptance);
            })
            .fail(function (rejection) {
                loaded.reject(rejection);
                toolkit.tools.console.error("Some form components did not load properly");
                toolkit.tools.console.error(rejection);
            });
        return loaded.promise();
    };
    configure();
    toolkit.register("form", function (registry) {
        registry.formContainer = new toolkit.classes.Directive("1.0", "form-container", function () {
            return {
                restrict: "E",
                transclude: true,
                replace: true,
                templateUrl: registry.formContainer.templateUrl,
                scope: {
                    orientation: "@",
                    labelSize: "@"
                },
                controller: function ($scope, $element) {
                    if (!$scope.labelSize) {
                        $scope.labelSize = 3;
                    }
                    if (!$scope.orientation) {
                        $scope.orientation = "vertical";
                    }
                    $element.data('form.container', $scope);
                    $scope.labelSize = parseInt($scope.labelSize);
                }
            };
        });
        toolkit.ext.formInput = {
            components: {}
        };
        toolkit.ext.formSelect = {
            components: {}
        };
        registry.formInput = new toolkit.classes.Directive("1.0", "form-placeholder", function ($compile, $http, $templateCache) {
            var initializer = init("formInput", $http, $templateCache, $compile);
            var loaded = load("formInput", ["basic"]);
            return {
                restrict: "E",
                transclude: false,
                templateUrl: registry.formInput.templateUrl,
                replace: false,
                scope: {
                    type: "@",
                    id: "@",
                    label: "@",
                    value: "@",
                    feedback: "@",
                    placeholder: "@",
                    state: "@",
                    orientation: "@",
                    labelSize: "@",
                    descriptor: "=?",
                    ngModel: "=?"
                },
                link: initializer.link(loaded, function ($scope) {
                    if (!$scope.type) {
                        $scope.type = "text";
                    }
                }),
                controller: initializer.controller(loaded)
            };
        });
        registry.formSelect = new toolkit.classes.Directive("1.0", "form-placeholder", function ($compile, $http, $templateCache) {
            var initializer = init("formSelect", $http, $templateCache, $compile, true);
            var loaded = load("formSelect", ["select"]);
            return {
                restrict: "E",
                transclude: true,
                replace: true,
                templateUrl: registry.formSelect.templateUrl,
                scope: {
                    type: "@",
                    id: "@",
                    label: "@",
                    value: "@",
                    placeholder: "@",
                    state: "@",
                    selection: "@",
                    feedback: "@",
                    orientation: "@",
                    labelSize: "@",
                    descriptor: "=?",
                    ngModel: "=?"
                },
                link: initializer.link(loaded, function ($scope) {
                    if (!$scope.type) {
                        $scope.type = "combo";
                    }
                    if (!$scope.selection) {
                        $scope.selection = "single";
                    }
                }),
                controller: ["$scope", "$element", "$attrs", "$transclude", "$timeout", function ($scope, $element, $attrs, $transclude, $timeout) {
                    $scope.items = [];
                    $scope.controller = this;
                    this.add = function (value, caption) {
                        $scope.items.push({
                            value: value,
                            caption: caption
                        });
                    };
                    this.count = function () {
                        return $scope.items.length;
                    };
                    var controller = initializer.controller(loaded);
                    controller[controller.length - 1].apply(this, [$scope, $element, $attrs, $transclude, $timeout]);
                }]
            };
        });
        registry.formSelectItem = new toolkit.classes.Directive("1.0", "", function () {
            return {
                restrict: "E",
                transclude: true,
                replace: true,
                template: "",
                scope: {
                    value: "@",
                    caption: "@"
                },
                link: function (scope, element, attributes) {
                    var selectController = scope.$parent.controller;
                    if (!scope.caption && scope.value) {
                        scope.caption = scope.value;
                    } else if (scope.caption && !scope.value) {
                        scope.value = scope.caption;
                    } else if (!scope.caption && !scope.value) {
                        scope.caption = selectController.count() + 1;
                        scope.val = selectController.count();
                    }
                    selectController.add(scope.value, scope.caption);
                }
            };
        });
        registry.formAction = new toolkit.classes.Directive("1.0", "form-buttons", function () {
            return {
                restrict: "E",
                require: "^" + toolkit.classes.Directive.qualify("formContainer"),
                transclude: true,
                replace: true,
                templateUrl: registry.formAction.templateUrl,
                scope: {}
            };
        });
    });

})(BootstrapUI, jQuery);