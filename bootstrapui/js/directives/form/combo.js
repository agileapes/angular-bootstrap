define('combo', {
    controller: function ($scope) {
        $scope.current = null;
        if (angular.isArray($scope.ngModel)) {
            $scope.current = $scope.ngModel[0];
        }
    },
    link: function ($scope) {
        $scope.selection = 'single';
        $scope.$watch('current', function (value) {
            if (angular.isDefined(value) && value !== null) {
                $scope.ngModel = [value];
            }
        });
    }
});