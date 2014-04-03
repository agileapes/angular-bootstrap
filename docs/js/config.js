angular.module("BootstrapUIDocumentation").config(["bu$configurationProvider", "$locationProvider", function (configuration, $locationProvider) {
    configuration.set({
        namespace: "ui",
        base: "..",
        debug: true,
        preloadAll: true,
        tools: {
            form: {
                preloadAll: true
            }
        }
    });
    $locationProvider.html5Mode(true).hashPrefix('!');
}]);