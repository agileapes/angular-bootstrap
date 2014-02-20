var BootstrapUI = {};
BootstrapUI.namespace = BootstrapUIConfig && BootstrapUIConfig.namespace ? BootstrapUIConfig.namespace : "x";
BootstrapUI.base = BootstrapUIConfig && BootstrapUIConfig.base ? BootstrapUIConfig.base : ".";
BootstrapUI.templates = {
    icon: "templates/icon.html",
    dropdown: "templates/dropdown.html",
    dropdownItem: "templates/dropdown-item.html",
    dropdownDivider: "templates/dropdown-divider.html",
    dropdownHeader: "templates/dropdown-header.html",
    buttonGroup: "templates/button-group.html",
    buttonGroupButton: "templates/button-group-button.html",
    inputGroup: "templates/input-group.html",
    inputGroupPrepend: "templates/input-group-prepend.html",
    inputGroupAppend: "templates/input-group-append.html",
    container: "templates/container.html",
    section: "templates/section.html"
};
BootstrapUI.directives = {};
BootstrapUI.directives.icon = function () {
    return {
        restrict: "E",
        templateUrl: BootstrapUI.templates.icon,
        scope: {
            glyph: "@"
        }
    };
};
BootstrapUI.directives.dropdown = function () {
    return  {
        restrict: "E",
        templateUrl: BootstrapUI.templates.dropdown,
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
            label: "@",
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
            label: "@"
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
            size: "@",
            orientation: "@"
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
            label: "@",
            href: "@",
            glyph: "@",
            position: "@",
            kind: "@"
        }
    };
};
BootstrapUI.directives.inputGroup = function () {
    return {
        restrict: "E",
        replace: true,
        transclude: true,
        templateUrl: BootstrapUI.templates.inputGroup,
        scope: {
            size: "@"
        }
    };
};
BootstrapUI.directives.groupPrepend = function () {
    return {
        require: "^inputGroup",
        restrict: "E",
        replace: true,
        transclude: true,
        templateUrl: BootstrapUI.templates.inputGroupPrepend,
        controller: function ($scope, $element) {
            $scope.prependAddonClass = function () {
                return angular.element($element.get(0).parentNode).find(".input-group-prepend button").length > 0 ? "input-group-btn" : "input-group-addon";
            };
        }
    };
};
BootstrapUI.directives.groupAppend = function () {
    return {
        require: "^inputGroup",
        restrict: "E",
        replace: true,
        transclude: true,
        templateUrl: BootstrapUI.templates.inputGroupAppend,
        controller: function ($scope, $element) {
            $scope.appendAddonClass = function () {
                return angular.element($element.get(0).parentNode).find(".input-group-append button").length > 0 ? "input-group-btn" : "input-group-addon";
            };
        }
    };
};
BootstrapUI.directives.container = function () {
    return {
        restrict: "E",
        replace: true,
        transclude: true,
        templateUrl: BootstrapUI.templates.container,
        scope: {
            type: "@",
            stacked: "@"
        },
        controller: function ($scope, $element) {
            var sections = $scope.sections = [];
            $scope.activate = function (section) {
                angular.forEach(sections, function (section) {
                    section.active = false;
                });
                section.active = true;
            };
            this.addSection = function (section) {
                if (sections.length == 0 || section.active) {
                    $scope.activate(section);
                }
                sections.push(section);
            };
        }
    };
};
BootstrapUI.directives.section = function () {
    return {
        require: '^container',
        restrict: 'E',
        transclude: true,
        replace: true,
        templateUrl: BootstrapUI.templates.section,
        scope: {
            title: "@",
            active: "@",
            glyph: "@"
        },
        link: function (scope, element, attribute, containerController) {
            containerController.addSection(scope);
        }
    };
};
BootstrapUI.initialize = function () {
    for (var directive in BootstrapUI.directives) {
        //noinspection JSUnfilteredForInLoop
        BootstrapUI.directives[BootstrapUI.namespace + directive[0].toUpperCase() + directive.substring(1)] = BootstrapUI.directives[directive];
    }
    for (var template in BootstrapUI.templates) {
        //noinspection JSUnfilteredForInLoop
        BootstrapUI.templates[template] = BootstrapUI.base + "/" + BootstrapUI.templates[template];
    }
};
BootstrapUI.initialize();