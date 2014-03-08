(function (toolkit, angular) {
    toolkit.register("image", function (registry) {
        registry.image = new toolkit.classes.Directive("1.0", "image", function () {
            return {
                restrict: "E",
                replace: true,
                templateUrl: registry.image.templateUrl,
                scope: {
                    src: "@",
                    alt: "@",
                    border: "@",
                    ngModel: "=?"
                },
                controller: function ($scope, $element, $attrs) {
                    if (angular.isUndefined($scope.ngModel) && angular.isDefined($scope.src)) {
                        $scope.ngModel = $scope.src;
                    }
                    $scope.responsive = angular.isDefined($attrs.responsive);
                    $element.get(0).removeAttribute("location");
                    $element.get(0).removeAttribute("alt");
                    $element.get(0).removeAttribute("border");
                    $element.get(0).removeAttribute("responsive");
                    $element.get(0).removeAttribute("ng-class");
                }
            };
        });
    });
})(BootstrapUI, angular);