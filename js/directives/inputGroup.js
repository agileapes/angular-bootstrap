(function (toolkit) {
    toolkit.register("inputGroup", function (registry) {
        registry.inputGroup = new toolkit.classes.Directive("1.0", "input-group", function () {
            return {
                restrict: "E",
                replace: true,
                transclude: true,
                templateUrl: registry.inputGroup.templateUrl,
                scope: {
                    size: "@"
                }
            };
        });
        registry.groupPrepend = registry.groupAppend = new toolkit.classes.Directive("1.0", "input-group-addon", function () {
            return {
                require: "^" + toolkit.classes.Directive.qualify("inputGroup"),
                restrict: "E",
                replace: true,
                transclude: true,
                scope: true,
                templateUrl: registry.groupAppend.templateUrl,
                controller: function ($scope, $element) {
                    $scope.appendAddonClass = function () {
                        return $element.find("button").length > 0 ? "input-group-btn" : "input-group-addon";
                    };
                }
            };
        });
    });
})(BootstrapUI);