(function (toolkit) {
    toolkit.register("label", function (registry) {
        registry.label = new toolkit.classes.Directive("1.0", "label", function () {
            return {
                restrict: "E",
                replace: true,
                transclude: true,
                templateUrl: registry.label.templateUrl,
                scope: {
                    type: "@"
                }
            };
        });
    });

})(BootstrapUI);