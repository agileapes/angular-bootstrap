(function (BootstrapUI) {

    BootstrapUI.directive("icon", [], [function () {
        return {
            restrict: "E",
            replace: true,
            templateUrl: "icon",
            scope: {
                glyph: "@"
            }
        };
    }]);

})(dependency('BootstrapUI'));