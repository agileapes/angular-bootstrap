(function (BootstrapUI) {
    BootstrapUI.directive('learnMore', function () {
        return {
            templateUrl: "learn",
            restrict: "E",
            scope: {
                address: "@"
            }
        };
    });
})(eval("BootstrapUI"));