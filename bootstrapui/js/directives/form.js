(function (BootstrapUI) {
    'use strict';
    var config = {};
    var form = {
        configure: function (configuration) {
            if (angular.isUndefined(configuration)) {
                configuration = {};
            }
            config = configuration;
            if (!config.templatesBase) {
                config.templatesBase = "~/form";
            }
            if (!config.directivesBase) {
                config.directivesBase = "~/form";
            }
            config.templatesBase = config.templatesBase.replace(/^~(?:\/|$)/, BootstrapUI.configuration.templatesBase + "/");
            config.directivesBase = config.directivesBase.replace(/^~(?:\/|$)/, BootstrapUI.configuration.directivesBase + "/");
            if (angular.isUndefined(config.preloadAll)) {
                config.preloadAll = false;
            }
            if (!angular.isObject(config.aliases)) {
                config.aliases = {};
            }
            if (!angular.isObject(config.aliases.input)) {
                config.aliases.input = {};
            }
            config.aliases.input['basic'] = 'disallowed'; //redirect so that type 'basic' cannot be used
            config.aliases.input['text'] = 'basic';
            config.aliases.input['password'] = 'basic';
            config.aliases.input['email'] = 'basic';
            config.aliases.input['date'] = 'basic';
            if (angular.isUndefined(config.visualErrors)) {
                config.visualErrors = true;
            }
        },
        input: BootstrapUI.registry("bu$form.input")
    };
    form.configure();
    BootstrapUI.tools.register('form', form);
    BootstrapUI.directive('formContainer', function () {
        return {
            restrict: "E",
            scope: {
                orientation: "@",
                labelSize: "@"
            },
            defaults: {
                orientation: "vertical",
                labelSize: 3
            },
            controller: ["$scope", function ($scope) {
                this.$scope = $scope;
            }]
        };
    });
    BootstrapUI.directive("formInput", ["$q", "$http", function ($q, $http, bu$injector) {
        var deferred = $q.defer();
        var define = function (id, definition) {
            form.input.register(id, definition);
        };
        if (!this || !this.bu$Preload) {
            deferred.resolve(function ($scope, $elements, $attrs) {
                var defined = $q.defer();
                var definition = form.input.get($scope.type);
                if (angular.isDefined(definition)) {
                    defined.resolve(definition);
                    return;
                }
                var url = BootstrapUI.configuration.base + "/" + config.directivesBase + "/" + $scope.type + ".js";
                url = url.replace(/\/{2,}/g, "/");
                $http.get(url).then(function (result) {
                    var script = result.data;
                    try {
                        var before = form.input.info().size;
                        eval(script);
                        if (before == form.input.info().size) {
                            //noinspection ExceptionCaughtLocallyJS
                            throw new Error("No new items where defined after fetching the definition");
                        }
                        var definition = form.input.get($scope.type);
                        if (angular.isDefined(definition)) {
                            defined.resolve(definition);
                        } else {
                            //noinspection ExceptionCaughtLocallyJS
                            throw new Error("Fetching did not resolve in defining the directive type");
                        }
                    } catch (e) {
                        throw new Error("Failed to fetch definition for type `" + $scope.type + "`", e);
                    }
                }, function (reason) {
                    if (reason.status == 404) {
                        define($scope.type, {});
                        var definition = form.input.get($scope.type);
                        defined.resolve(definition);
                    } else {
                        throw new Error("There was a problem accessing directive definition for type `" + $scope.type + "`", reason);
                    }
                });
                return defined.promise.then(function (definition) {
                    if (angular.isUndefined(definition.template) && angular.isUndefined(definition.templateUrl)) {
                        definition.templateUrl = $scope.type;
                    }
                    if (angular.isDefined(definition.templateUrl) && !/\.[^\.]+$/.test(definition.templateUrl)) {
                        if (config.aliases.input[definition.templateUrl]) {
                            definition.templateUrl = config.aliases.input[definition.templateUrl];
                        }
                        definition.templateUrl = (BootstrapUI.configuration.base + "/" + config.templatesBase + "/" + definition.templateUrl + ".html").replace(/\/{2,}/g, "/");
                    }
                    return definition;
                });
            });
        }
        return {
            template: '<div><code>&lt;{{namespace ? namespace + \':\' : \'\'}}form-input type="{{type}}"/&gt;</code><span></span></div>',
            restrict: "E",
            replace: true,
            transclude: false,
            require: "^?bu$FormContainer",
            resolve: deferred.promise,
            scope: {
                type: "@",
                label: "@",
                placeholder: "@",
                id: "@",
                validation: "@",
                state: "@",
                feedback: "@",
                value: "@",
                orientation: "@",
                labelSize: "@",
                ngModel: '=',
                descriptor: '&?'
            },
            defaults: {
                label: " ",
                placeholder: "",
                validation: "",
                state: "normal",
                feedback: ""
            },
            link: {
                pre: function () {
                },
                post: ["scope", "element", "attrs", "controller", function (scope, element, attrs, controller) {
                    if (!scope.labelSize && controller && controller.$scope && controller.$scope.labelSize) {
                        scope.labelSize = controller.$scope.labelSize;
                    }
                    if (!scope.labelSize) {
                        scope.labelSize = 3;
                    }
                    if (!scope.orientation && controller && controller.$scope && controller.$scope.orientation) {
                        scope.orientation = controller.$scope.orientation;
                    }
                    if (!scope.orientation) {
                        scope.orientation = "vertical";
                    }
                    scope.namespace = BootstrapUI.configuration.namespace;
                }]            },
            controller: function ($scope) {
                if (angular.isDefined($scope.descriptor) && angular.isDefined($scope.descriptor())) {
                    angular.forEach(['orientation', 'labelSize', 'placeholder', 'feedback', 'state', 'label'], function (item) {
                        $scope.$watch(function () {
                            return $scope.descriptor()[item];
                        }, function (value) {
                            if (angular.isDefined(value) && $scope[item] != value) {
                                $scope[item] = value;
                                $scope.$apply.postpone($scope);
                            }
                        });
                    });
                }
            }
        }
    }]);
})(dependency("BootstrapUI"));