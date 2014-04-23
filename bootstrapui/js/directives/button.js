(function (BootstrapUI) {

    'use strict';

    BootstrapUI.directive("button", [], ['$parse', function ($parse) {
        return {
            restrict: "E",
            replace: true,
            templateUrl: "button",
            transclude: true,
            scope: {
                type: "@",
                size: "@",
                block: "@",
                active: "@",
                disabled: "@",
                action: '@'
            },
            defaults: {
                action: ""
            },
            controller: function ($scope, $element) {
                $($element).find('[ng-transclude]').attr('ng-transclude', null);
                var expression = undefined;
                $scope.act = function () {
                    if (angular.isUndefined(expression)) {
                        if ($scope.action) {
                            expression = $parse($scope.action);
                        } else {
                            expression = function () {};
                        }
                    }
                    if (!$scope.disabled) {
                        expression($scope.$parent);
                    }
                };
            }
        };
    }]);

})(dependency('BootstrapUI'));
