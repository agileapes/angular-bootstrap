(function (BootstrapUI) {
    BootstrapUI.directive('formAction', [
        {
            'type': 'directive',
            identifier: 'formContainer'
        }
    ], function () {
        return {
            require: "^bu$FormContainer",
            restrict: "E",
            templateUrl: "formAction",
            transclude: true
        };
    });
})(dependency('BootstrapUI'));