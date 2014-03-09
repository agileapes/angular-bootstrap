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
                    var progress = null;
                    if (typeof $scope.striped == "undefined") {
                        $scope.striped = false;
                    }
                    if (typeof $scope.active == "undefined") {
                        $scope.active = false;
                    }
                    if (typeof $scope.label == "undefined") {
                        $scope.label = false;
                    }
                    progress = parseFloat(progress);
                    if (progress < 0) {
                        progress = 0;
                    }
                    if (progress > 100) {
                        progress = 100;
                    }
                    $scope.getProgress = function () {
                        return $scope.progress > 100 ? 100 : ($scope.progress < 0 ? 0 : $scope.progress);
                    };
                }
            };
        });
    });

})(BootstrapUI);