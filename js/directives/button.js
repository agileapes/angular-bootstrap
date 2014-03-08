(function (toolkit, $) {
    toolkit.register("button", function (registry) {
        registry.button = new toolkit.classes.Directive("1.0", "button", function () {
            return {
                restrict: "E",
                replace: false,
                transclude: true,
                templateUrl: registry.button.templateUrl,
                scope: {
                    action: "&?",
                    type: "@",
                    size: "@"
                },
                controller: function ($scope, $element, $attrs) {
                    if (typeof $scope.action() == "undefined") {
                        $scope.action = function () {return null;};
                    }
                    var bindings = $.extend({}, $scope.$$isolateBindings, {
                        'ngClass': "@ng-class",
                        'ngDisabled': "@ng-disabled",
                        'ngTransclude': "@ng-transclude",
                        'ngClick': "@ng-click"
                    });
                    $.each(bindings, function (binding, attribute) {
                        $element.get(0).removeAttribute(attribute.substring(1));
                    });
                    $scope.disabled = typeof $attrs.disabled != "undefined";
                    $scope.block = typeof $attrs.block != "undefined";
                    $scope.active = typeof $attrs.active != "undefined";
                    $scope.perform = function () {
                        (function () {
                            if (!$scope.disabled) {
                                $scope.$apply($scope.action());
                            }
                        }).postpone(null, [], 0);
                    };
                }
            };
        });
    });
})(BootstrapUI, jQuery);