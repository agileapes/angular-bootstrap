(function (toolkit) {
    toolkit.register("image", function (registry) {
        registry.image = new toolkit.classes.Directive("1.0", "image", function () {
            return {
                restrict: "E",
                replace: true,
                templateUrl: registry.image.templateUrl,
                scope: {
                    location: "@",
                    alt: "@"
                },
                link: function ($scope, element, attrs) {
                    element.get(0).removeAttribute("location");
                    element.get(0).removeAttribute("alt");
                }
            };
        });
    });
})(BootstrapUI);