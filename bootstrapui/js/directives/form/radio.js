define('radio', {
    link: function ($scope, $element, $attrs) {
        $attrs.$observe('group', function (value) {
            $scope.group = value;
        });
    }
});