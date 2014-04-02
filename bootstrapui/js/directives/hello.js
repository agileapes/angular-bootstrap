(function ($injector) {
    $injector.invoke(["bu$directives", function (directives) {
        directives.register("helloJumbo", directives.instantiate([{
            identifier: "learn",
            type: "directive"
        }], function () {
            return {
                templateUrl: "hello",
                restrict: "E",
                scope: {}
            };
        }));
    }]);
})($injector);