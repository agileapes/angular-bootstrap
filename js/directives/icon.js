(function (toolkit) {
    toolkit.dynamic.icon = new toolkit.classes.Directive("1.0", "icon", function () {
        return {
            restrict: "E",
            replace: true,
            templateUrl: toolkit.dynamic.icon.templateUrl,
            scope: {
                glyph: "@"
            }
        };
    });
})(BootstrapUI);