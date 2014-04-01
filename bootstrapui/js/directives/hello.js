(function ($injector) {
    $injector.invoke(["bu$directives", function (directives) {
        directives.register("helloJumbo", directives.instantiate(function () {
            return {
                templateUrl: "hello",
                restrict: "E",
                scope: {}
            };
        }));
    }]);
})($injector);