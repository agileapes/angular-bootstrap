(function (BootstrapUI) {
    'use strict';
    BootstrapUI.directive('formContainer', [{
        type: 'tool',
        identifier: 'form',
        pathResolver: function (item) {
            return BootstrapUI.configuration('toolsBase') + '/' + item.identifier + '.js';
        }
    }], function () {
        return {
            restrict: "E",
            scope: {
                orientation: "@",
                labelSize: "@"
            },
            defaults: {
                orientation: "vertical",
                labelSize: 3
            },
            controller: ["$scope", function ($scope) {
                this.$scope = $scope;
            }]
        };
    });
})(dependency("BootstrapUI"));