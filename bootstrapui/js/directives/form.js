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
                config.aliases['basic'] = 'disallowed';
                config.aliases['text'] = 'basic';
                config.aliases['password'] = 'basic';
                if (angular.isUndefined(config.visualErrors)) {
                    config.visualErrors = true;
                }
            },
            input: bu$registryFactory("bu$form.input")
        };
        form.configure();
        bu$toolRegistry.register('form', form);
        bu$directives.register("formInput", bu$directives.instantiate(function () {
            var deferred = $q.defer();
            deferred.resolve(directiveLoader('input'));
            return {
                template: deferred.promise,
                restrict: "E",
                replace: true,
                transclude: false,
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
                    ngModel: '=?'
                },
                defaults: {
                    label: " ",
                    placeholder: "",
                    validation: "",
                    state: "normal",
                    feedback: "",
                    orientation: "vertical",
                    labelSize: 3
                }
            }
        }));
        var notFound = "<div class='form error'>&lt;{{namespace ? ':' + namespace : ''}}form-{{component}} type='{{type}}'/&gt;</div>";
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
                        if (config.aliases[element.templateUrl]) {
                            element.templateUrl = config.aliases[element.templateUrl];
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