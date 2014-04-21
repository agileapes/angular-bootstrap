(function (BootstrapUI) {
    BootstrapUI.directive('formSelectItem', ["bu$name", "$q", function (bu$name, $q) {
        return {
            restrict: "E",
            replace: true,
            scope: {
                value: '@'
            },
            controller: function ($scope, $element) {

                $($element).attr('ng-transclude', null);
            },
            link: function ($scope, $element) {
                var deferred = $q.defer();
                var done = $scope.$watch(function () {
                    var key = ('$' + bu$name.directive('formSelect') + 'Controller');
                    var node = $element[0];
                    var controller = undefined;
                    while (node) {
                        if (angular.element(node).data()[key]) {
                            controller = angular.element(node).data()[key];
                            break;
                        }
                        node = node.parentNode;
                    }
                    return controller;
                }, function (controller) {
                    if (angular.isDefined(controller)) {
                        done();
                        deferred.resolve(controller);
                    }
                });
                deferred.promise.then(function (controller) {
                    $scope.caption = $element.html();
                    controller.add($scope);
                });
            }
        };
    }])
})(dependency("BootstrapUI"));