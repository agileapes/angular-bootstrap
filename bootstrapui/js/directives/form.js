(function ($injector) {
    'use strict';
    $injector.invoke(["bu$directives", "bu$toolRegistry", "bu$loader", "bu$configuration", "$q", "bu$registryFactory", "$http", function (bu$directives, bu$toolRegistry, bu$loader, bu$configuration, $q, bu$registryFactory, $http) {
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
                config.templatesBase = config.templatesBase.replace(/^~(?:\/|$)/, bu$configuration.templatesBase + "/");
                config.directivesBase = config.directivesBase.replace(/^~(?:\/|$)/, bu$configuration.directivesBase + "/");
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
                if (angular.isUndefined(config.visualErrors)) {
                    config.visualErrors = true;
                }
            },
            input: bu$registryFactory("bu$form.input")
        };
        form.configure();
        bu$toolRegistry.register('form', form);
        bu$directives.register("formContainer", bu$directives.instantiate(function () {
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
        }));
        bu$directives.register("formInput", bu$directives.instantiate(function () {
            var deferred = $q.defer();
            deferred.resolve(directiveLoader('input'));
            return {
                template: deferred.promise,
                restrict: "E",
                replace: true,
                transclude: false,
                require: "^(bui)FormContainer",
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
                    ngModel: '=?',
                    descriptor: '&?'
                },
                defaults: {
                    label: " ",
                    placeholder: "",
                    validation: "",
                    state: "normal",
                    feedback: "",
                    orientation: "vertical",
                    labelSize: 3
                },
                link: ["scope", "element", "attrs", "controller", function (scope, element, attrs, controller) {
                    if (!scope.labelSize && controller && controller.$scope && controller.$scope.labelSize) {
                        scope.labelSize = controller.$scope.labelSize;
                    }
                    if (!scope.orientation && controller && controller.$scope && controller.$scope.orientation) {
                        scope.orientation = controller.$scope.orientation;
                    }
                }],
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
        }));
        var notFound = "<div class='form-error {{orientation}} {{orientation == \"horizontal\" ? \"col-sm-offset-\" + labelSize + \" col-sm-\" + (12 - labelSize) : \"\"}}'><div class=''>&lt;{{namespace ? namespace + ':' : ''}}form-{{component}} type='{{type}}'/&gt;</div></div>";
        var directiveLoader = function (type) {
            return ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {
                var deferred = $q.defer();
                bu$loader.load({
                    type: "form." + type,
                    identifier: $scope.type,
                    pathResolver: function (item) {
                        return config.directivesBase + "/" + item.identifier + ".js";
                    }
                }).then(function (loaded) {
                    var element = form[type].get(loaded[0].identifier);
                    if (angular.isFunction(element) || (angular.isArray(element) && element.length > 0 && angular.isFunction(element[element.length - 1]))) {
                        element = $injector.invoke(element, form, {
                            scope: $scope,
                            $scope: $scope,
                            element: $element,
                            $element: $element,
                            attrs: $attrs,
                            $attrs: $attrs
                        });
                    }
                    if (!/\.[^\.]+$/.test(element.templateUrl)) {
                        element.templateUrl = bu$configuration.base + "/" + config.templatesBase + "/" + element.templateUrl + ".html";
                        element.templateUrl = element.templateUrl.replace(/\/{2,}/g, "/");
                    }
                    deferred.resolve(element);
                }, function (reason) {
                    var fail = function (reason) {
                        if (config.visualErrors) {
                            $scope.namespace = bu$configuration.namespace;
                            $scope.component = type;
                            deferred.resolve(notFound);
                        } else {
                            deferred.reject(reason);
                        }
                    };
                    if (reason.status == 404) {
                        var element = {
                            templateUrl: $scope.type
                        };
                        if (config.aliases[type][element.templateUrl]) {
                            element.templateUrl = config.aliases[type][element.templateUrl];
                        }
                        element.templateUrl = bu$configuration.base + "/" + config.templatesBase + "/" + element.templateUrl + ".html";
                        element.templateUrl = element.templateUrl.replace(/\/{2,}/g, "/");
                        $http.head(element.templateUrl).then(function () {
                            deferred.resolve(element);
                        }, function (reason) {
                            fail(reason);
                        });
                    } else {
                        fail(reason);
                    }
                });
                return deferred.promise;
            }];
        };
    }]);
})(eval("$injector"));