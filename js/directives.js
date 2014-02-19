var BootstrapUI = {};
BootstrapUI.namespace = "x";
BootstrapUI.templates = {
    icon: "templates/icon.html",
    dropdown: "templates/dropdown.html",
    dropdownItem: "templates/dropdown-item.html",
    dropdownDivider: "templates/dropdown-divider.html",
    dropdownHeader: "templates/dropdown-header.html",
    buttonGroup: "templates/button-group.html",
    buttonGroupButton: "templates/button-group-button.html"
};
BootstrapUI.directives = {};
BootstrapUI.directives.icon = function () {
    return {
        restrict: "E",
        templateUrl: BootstrapUI.templates.icon,
        scope: {
            glyph: "@glyph"
        }
    };
};
BootstrapUI.directives.dropdown = function () {
    return  {
        restrict: "E",
        templateUrl: BootstrapUI.templates.dropdown,
        scope: {
            glyph: "@glyph",
            id: "@id",
            position: "@position",
            label: "@label",
            kind: "@kind",
            caret: "@caret",
            size: "@size"
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
        },
        transclude: true,
        replace: true
    };
};
BootstrapUI.directives.dropdownItem = function () {
    return  {
        require: "^dropdown",
        restrict: "E",
        templateUrl: BootstrapUI.templates.dropdownItem,
        scope: {
            label: "@label",
            href: "@href",
            glyph: "@glyph",
            disabled: "@disabled"
        },
        controller: function ($scope) {
            $scope.navigate = function () {
                window.location.href = $scope.href;
            };
        },
        replace: true
    };
};
BootstrapUI.directives.dropdownDivider = function () {
    return {
        require: "^dropdown",
        restrict: "E",
        templateUrl: BootstrapUI.templates.dropdownDivider,
        replace: true
    }
};
BootstrapUI.directives.dropdownHeader = function () {
    return {
        require: "^dropdown",
        restrict: "E",
        templateUrl: BootstrapUI.templates.dropdownHeader,
        replace: true,
        scope: {
            label: "@label"
        }
    }
};
BootstrapUI.directives.buttonGroup = function () {
    return {
        restrict: "E",
        replace: true,
        transclude: true,
        templateUrl: BootstrapUI.templates.buttonGroup,
        scope: {
            size: "@size",
            orientation: "@orientation"
        }
    };
};
BootstrapUI.directives.groupButton = function () {
    return {
        require: "^buttonGroup",
        restrict: "E",
        replace: true,
        templateUrl: BootstrapUI.templates.buttonGroupButton,
        scope: {
            label: "@label",
            href: "@href",
            glyph: "@glyph",
            position: "@position",
            kind: "@kind"
        }
    };
};
BootstrapUI.initialize = function () {
    var directives = [];
    for (var directive in BootstrapUI.directives) {
        BootstrapUI.directives[BootstrapUI.namespace + directive[0].toUpperCase() + directive.substring(1)] = BootstrapUI.directives[directive];
    }
//    BootstrapUI.directives = directives;
};
BootstrapUI.initialize();
