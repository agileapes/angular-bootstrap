(function (toolkit) {
    toolkit.register("alert", function (registry) {
        registry.alert = new toolkit.classes.Directive("1.0", "alert", function () {
            return {
                restrict: "E",
                replace: true,
                transclude: true,
                templateUrl: registry.alert.templateUrl,
                scope: {
                    type: "@",
                    title: "@",
                    glyph: "@",
                    dismissible: "=?"
                },
                controller: function ($scope) {
                    if (typeof $scope.dismissible == "undefined") {
                        $scope.dismissible = false;
                    }
                }
            };
        });
    });

})(BootstrapUI);