(function (toolkit) {
    toolkit.register("badge", function (registry) {
        registry.badge = new toolkit.classes.Directive("1.0", "badge", function () {
            return {
                restrict: "E",
                replace: true,
                transclude: true,
                templateUrl: registry.badge.templateUrl,
                scope: {}
            };
        });
    });

})(BootstrapUI);