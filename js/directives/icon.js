(function (toolkit) {
    toolkit.register("icon", function (registry) {
        registry.icon = new toolkit.classes.Directive("1.0", "icon", function () {
            return {
                restrict: "E",
                replace: true,
                templateUrl: registry.icon.templateUrl,
                scope: {
                    glyph: "@"
                }
            };
        });
    });
})(BootstrapUI);