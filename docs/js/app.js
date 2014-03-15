'use strict';
(function (angular) {
    var module = angular.module("BootstrapUIDocumentation", ["ngRoute", "ngAnimate"], null);
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
    module.animation('.reveal-animation', function() {
        return {
            enter: function(element, done) {
                element.css('display', 'none');
                element.fadeIn(250, done);
                return function() {
                    element.stop();
                }
            },
            leave: function(element, done) {
                element.fadeOut(250, done);
                return function() {
                    element.stop();
                }
            }
        }
    });

})(angular);