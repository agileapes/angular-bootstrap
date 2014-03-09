(function (toolkit) {
    toolkit.register("progressBar", function (registry) {
        registry.progressBar = new toolkit.classes.Directive("1.0", "progress-bar", function () {
            return {
                restrict: "E",
                replace: false,
                transclude: true,
                templateUrl: registry.progressBar.templateUrl,
                scope: {
                    progress: "=",
                    type: "=",
                    striped: "=?",
                    active: "=?",
                    label: "=?"
                },
                controller: function ($scope) {
                    if (typeof $scope.striped == "undefined") {
                        $scope.striped = false;
                    }
                    if (typeof $scope.active == "undefined") {
                        $scope.active = false;
                    }
                    if (typeof $scope.label == "undefined") {
                        $scope.label = false;
                    }
                }
            };
        });
    });

})(BootstrapUI);