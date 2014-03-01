(function (toolkit, $) {

//    toolkit.ext.form = {
//        Input: function () {
//            this.isFormInput = true;
//        },
//        handlers: {}
//    };
//
//    if (!toolkit.config.ext.form) {
//        toolkit.config.ext.form = [];
//    }
//    var directives = [
//        "simple"
//    ];
//
//    var loaded = 0;
//
//    for (var i = 0; i < directives.length; i++) {
//        toolkit.tools.console.debug("    > Loading form input directive `" + directives[i] + "`");
//        $.ajax({
//            url: toolkit.config.base + "/" + toolkit.config.directivesBase + "/form/" + directives[i] + ".js",
//            dataType: "script",
//            success: function () {
//                loaded++;
//            },
//            cache: true
//        });
//    }
//
//    toolkit.dynamic.formContainer = new toolkit.classes.Directive("1.0", "form-container", function () {
//        return {
//            restrict: "E",
//            transclude: true,
//            replace: true,
//            templateUrl: toolkit.dynamic.formContainer.templateUrl,
//            scope: {
//                orientation: "@",
//                labelSize: "@"
//            },
//            controller: function ($scope) {
//                this.$scope = $scope;
//                if (!$scope.labelSize) {
//                    $scope.labelSize = 3;
//                }
//                if (!$scope.orientation) {
//                    $scope.orientation = "vertical";
//                }
//                $scope.labelSize = parseInt($scope.labelSize);
//            }
//        };
//    });
//
////    var loader = $http.get(toolkit.formHandlers[scope.type].templateUrl, {cache: $templateCache});
//
//    toolkit.dynamic.formInput = new toolkit.classes.Directive("1.0", "form-input", function ($compile, $http, $templateCache) {
//    });
})(BootstrapUI, jQuery);