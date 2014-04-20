(function (BootstrapUI) {
    BootstrapUI.directive({
        helloJumbo: {
            requirements: [{
                type: 'directive',
                identifier: 'learn'
            }],
            factory: function () {
                return {
                    templateUrl: "hello",
                    restrict: "E",
                    scope: {}
                };
            }
        }
    });
})(dependency('BootstrapUI'));
