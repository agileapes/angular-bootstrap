(function (toolkit) {
    toolkit.dynamic.buttonGroup = new toolkit.classes.Directive("1.0", "button-group", function () {
        return {
            restrict: "E",
            replace: true,
            transclude: true,
            templateUrl: toolkit.dynamic.buttonGroup.templateUrl,
            scope: {
                size: "@",
                orientation: "@"
            }
        };
    });
    toolkit.dynamic.groupButton = new toolkit.classes.Directive("1.0", "button-group-button", function () {
        return {
            require: "^" + toolkit.classes.Directive.qualify("buttonGroup"),
            restrict: "E",
            replace: true,
            templateUrl: toolkit.dynamic.groupButton.templateUrl,
            scope: {
                label: "@",
                href: "@",
                glyph: "@",
                position: "@",
                kind: "@"
            }
        };
    });
})(BootstrapUI);