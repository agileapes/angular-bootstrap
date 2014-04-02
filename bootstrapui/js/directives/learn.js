(function ($injector) {
    $injector.invoke(["bu$directives", function (directives) {
        directives.register("learnMore", directives.instantiate(function () {
            return {
                templateUrl: "learn",
                restrict: "E",
                scope: {
                    address: "@"
                }
            };
        }));
    }]);
})($injector);