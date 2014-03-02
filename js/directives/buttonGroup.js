(function (toolkit) {
    toolkit.register("buttonGroup", function (registry) {
        registry.buttonGroup = new toolkit.classes.Directive("1.0", "button-group", function () {
            return {
                restrict: "E",
                replace: true,
                transclude: true,
                templateUrl: registry.buttonGroup.templateUrl,
                scope: {
                    size: "@",
                    orientation: "@"
                }
            };
        });
        registry.groupButton = new toolkit.classes.Directive("1.0", "button-group-button", function () {
            return {
                require: "^" + toolkit.classes.Directive.qualify("buttonGroup"),
                restrict: "E",
                replace: true,
                templateUrl: registry.groupButton.templateUrl,
                scope: {
                    label: "@",
                    href: "@",
                    glyph: "@",
                    position: "@",
                    kind: "@"
                }
            };
        });
    });
})(BootstrapUI);