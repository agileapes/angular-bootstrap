(function (toolkit) {
    toolkit.dynamic.breadcrumbs = new toolkit.classes.Directive("1.0", "breadcrumb", function () {
        return {
            restrict: "E",
            transclude: true,
            replace: true,
            templateUrl: toolkit.dynamic.breadcrumbs.templateUrl,
            controller: function ($scope) {
                var crumbs = $scope.crumbs = [];
                $scope.update = function () {
                    if (crumbs.length > 0) {
                        angular.forEach(crumbs, function (crumb) {
                            crumb.active = false;
                        });
                        crumbs[crumbs.length - 1].active = true;
                    }
                };
                this.addCrumb = function (crumb) {
                    crumbs.push(crumb);
                    $scope.update();
                };
            }
        };
    });
    toolkit.dynamic.breadcrumb = new toolkit.classes.Directive("1.0", "breadcrumb-item", function () {
        return {
            require: '^' + toolkit.classes.Directive.qualify("breadcrumbs"),
            restrict: 'E',
            transclude: true,
            replace: true,
            templateUrl: toolkit.dynamic.breadcrumb.templateUrl,
            scope: {
                href: "@",
                glyph: "@"
            },
            controller: function ($scope) {
                $scope.navigate = function () {
                    window.location.href = $scope.href;
                };
            },
            link: function (crumb, element, attribute, containerController) {
                containerController.addCrumb(crumb);
            }
        };
    });
})(BootstrapUI);