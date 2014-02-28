(function (toolkit) {
    toolkit.dynamic.formContainer = new toolkit.classes.Directive("1.0", "form-container", function () {
        return {
            restrict: "E",
            transclude: true,
            replace: true,
            templateUrl: toolkit.dynamic.formContainer.templateUrl,
            scope: {
                orientation: "@",
                labelSize: "@"
            },
            controller: function ($scope) {
                this.$scope = $scope;
                if (!$scope.labelSize) {
                    $scope.labelSize = 3;
                }
                if (!$scope.orientation) {
                    $scope.orientation = "vertical";
                }
                $scope.labelSize = parseInt($scope.labelSize);
            }
        };
    });
    toolkit.dynamic.formGroup = new toolkit.classes.Directive("1.0", "form-group", function () {
        return {
            restrict: "E",
            require: "^" + toolkit.classes.Directive.qualify("formContainer"),
            transclude: true,
            replace: true,
            scope: {},
            templateUrl: toolkit.dynamic.formGroup.templateUrl,
            link: function (scope, element, attributes, formContainerController) {
                scope.parent = formContainerController.$scope;
            },
            controller: function ($scope) {
                this.$scope = $scope;
            }
        };
    });
    toolkit.dynamic.formInput = new toolkit.classes.Directive("1.0", "form-input", function ($compile, $http, $templateCache) {
        var getTemplate = function (contentType) {
            var templateLoader,
                baseUrl = toolkit.config.base + "/" + toolkit.config.templateBase + "/form/",
                templateMap = {
                    text: 'simple.html',
                    password: 'simple.html',
                    static: 'static.html'
                };
            var templateUrl = baseUrl + templateMap[contentType];
            console.log(templateUrl);
            templateLoader = $http.get(templateUrl, {cache: $templateCache});
            return templateLoader;

        };
        var linker = function (scope, element, attrs, formGroupController) {
            scope.parent = formGroupController.$scope;
            if (!scope.type) {
                scope.type = "text";
            }
            setTimeout(function () {
                var loader = getTemplate(scope.type);
                loader.success(function (html) {
                    element.html(html);
                }).then(function () {
                    element.replaceWith($compile(element.html())(scope));
                });
            }, 0);
        };
        return {
            restrict: "E",
            require: "^" + toolkit.classes.Directive.qualify("formGroup"),
            transclude: false,
            replace: true,
            scope: {
                type: "@",
                label: "@",
                placeholder: "@",
                value: "@"
            },
            link: linker
        }
    });
})(BootstrapUI);