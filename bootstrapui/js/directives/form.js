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
            return {
                template: '<div><code>&lt;{{namespace ? namespace + \':\' : \'\'}}form-input type="{{type}}"/&gt;</code><span></span></div>',
                restrict: "E",
                replace: true,
                transclude: false,
                require: "^?bu$FormContainer",
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
                    feedback: ""
                },
                link: ["scope", "element", "attrs", "controller", function (scope, element, attrs, controller) {
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
                    scope.namespace = bu$configuration.namespace;
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
    }]);
})(eval("$injector"));