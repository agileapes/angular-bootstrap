(function (angular) {
    var module = angular.module("BootstrapUIDocumentation", ["ngRoute"], null);
    module.config(function ($routeProvider) {
        $routeProvider
            .when("/", {
                templateUrl: "pages/home.html"
            })
            .when("/:page", {
                templateUrl: function (parameters) {
                    var page = parameters.page;
                    if (!/.html$/.test(page)) {
                        page += ".html";
                    }
                    return "pages/" + page;
                }
            })
            .otherwise({
                redirectTo: "/"
            });
    });
})(angular);