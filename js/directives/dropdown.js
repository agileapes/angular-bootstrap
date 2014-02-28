(function (toolkit) {
    toolkit.dynamic.dropdown = new toolkit.classes.Directive("1.0", "dropdown", function () {
        return  {
            restrict: "E",
            templateUrl: toolkit.dynamic.dropdown.templateUrl,
            transclude: true,
            replace: true,
            scope: {
                glyph: "@",
                id: "@",
                position: "@",
                label: "@",
                kind: "@",
                caret: "@",
                size: "@"
            },
            controller: function ($scope, $element) {
                var node = $element.get(0);
                while (node && !angular.element(node).hasClass("dropdown")) {
                    node = node.parentNode;
                }
                var isInBtnGroup = angular.element(node.parentNode).hasClass("button-group");
                $scope.isBtnGroup = function () {
                    return isInBtnGroup;
                };
            }
        };
    });
    toolkit.dynamic.dropdownItem = new toolkit.classes.Directive("1.0", "dropdown-item", function () {
        return  {
            require: "^" + toolkit.classes.Directive.qualify("dropdown"),
            restrict: "E",
            templateUrl: toolkit.dynamic.dropdownItem.templateUrl,
            transclude: true,
            scope: {
                href: "@",
                glyph: "@",
                disabled: "@"
            },
            controller: function ($scope) {
                $scope.navigate = function () {
                    window.location.href = $scope.href;
                };
            },
            replace: true
        };
    });
    toolkit.dynamic.dropdownDivider = new toolkit.classes.Directive("1.0", "dropdown-divider", function () {
        return {
            require: "^" + toolkit.classes.Directive.qualify("dropdown"),
            restrict: "E",
            templateUrl: toolkit.dynamic.dropdownDivider.templateUrl,
            scope: {},
            replace: true
        }
    });
    toolkit.dynamic.dropdownHeader = new toolkit.classes.Directive("1.0", "dropdown-header", function () {
        return {
            require: "^" + toolkit.classes.Directive.qualify("dropdown"),
            restrict: "E",
            transclude: true,
            templateUrl: toolkit.dynamic.dropdownHeader.templateUrl,
            replace: true,
            scope: {
                glyph: "@"
            }
        }
    });
})(BootstrapUI);