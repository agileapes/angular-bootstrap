(function (toolkit) {
    toolkit.dynamic.inputGroup = new toolkit.classes.Directive("1.0", "input-group", function () {
        return {
            restrict: "E",
            replace: true,
            transclude: true,
            templateUrl: toolkit.dynamic.inputGroup.templateUrl,
            scope: {
                size: "@"
            }
        };
    });
    toolkit.dynamic.groupPrepend = toolkit.dynamic.groupAppend = new toolkit.classes.Directive("1.0", "input-group-addon", function () {
        return {
            require: "^" + toolkit.classes.Directive.qualify("inputGroup"),
            restrict: "E",
            replace: true,
            transclude: true,
            scope: true,
            templateUrl: toolkit.dynamic.groupAppend.templateUrl,
            controller: function ($scope, $element) {
                $scope.appendAddonClass = function () {
                    return $element.find("button").length > 0 ? "input-group-btn" : "input-group-addon";
                };
            }
        };
    });
})(BootstrapUI);