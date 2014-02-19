var BootstrapUI = {};
BootstrapUI.namespace = "x";
BootstrapUI.templates = {
    icon: "templates/icon.html",
    dropdown: "templates/dropdown.html",
    dropdownItem: "templates/dropdown-item.html",
    dropdownDivider: "templates/dropdown-divider.html",
    dropdownHeader: "templates/dropdown-header.html"
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
            label: "@label"
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
BootstrapUI.initialize = function () {
    var directives = [];
    for (var directive in BootstrapUI.directives) {
        BootstrapUI.directives[BootstrapUI.namespace + directive[0].toUpperCase() + directive.substring(1)] = BootstrapUI.directives[directive];
    }
//    BootstrapUI.directives = directives;
};
BootstrapUI.initialize();
