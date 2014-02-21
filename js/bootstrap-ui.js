if (typeof BootstrapUIConfig == "undefined") {
    BootstrapUIConfig = {};
}

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
    inputGroupAddon: "templates/input-group-addon.html",
    container: "templates/container.html",
    section: "templates/section.html",
    breadcrumb: "templates/breadcrumb.html",
    breadcrumbItem: "templates/breadcrumb-item.html",
    pagination: "templates/pagination.html"
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
        transclude: true,
        templateUrl: BootstrapUI.templates.dropdownHeader,
        replace: true,
        scope: {
            glyph: "@"
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
BootstrapUI.directives.groupPrepend = BootstrapUI.directives.groupAppend = function () {
    return {
        require: "^inputGroup",
        restrict: "E",
        replace: true,
        transclude: true,
        scope: true,
        templateUrl: BootstrapUI.templates.inputGroupAddon,
        controller: function ($scope, $element) {
            $scope.appendAddonClass = function () {
                return $element.find("button").length > 0 ? "input-group-btn" : "input-group-addon";
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
                sections.push(section);
                if (sections.length == 1 || section.active) {
                    $scope.activate(section);
                }
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
BootstrapUI.directives.breadcrumbs = function () {
    return {
        restrict: "E",
        transclude: true,
        replace: true,
        templateUrl: BootstrapUI.templates.breadcrumb,
        controller: function ($scope) {
            var crumbs = $scope.crumbs = [];
            $scope.update = function () {
                if (crumbs.length > 0) {
                    angular.forEach(crumbs, function (crumb) {
                        crumb.active = false;
                    });
                    console.log((crumbs.length - 1) + " is active now");
                    crumbs[crumbs.length - 1].active = true;
                }
            };
            this.addCrumb = function (crumb) {
                crumbs.push(crumb);
                $scope.update();
            };
        }
    };
};
BootstrapUI.directives.breadcrumb = function () {
    return {
        require: '^breadcrumbs',
        restrict: 'E',
        transclude: true,
        replace: true,
        templateUrl: BootstrapUI.templates.breadcrumbItem,
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
};
BootstrapUI.directives.pagination = function ($parse) {
    return {
        restrict: "E",
        replace: false,
        templateUrl: BootstrapUI.templates.pagination,
        scope: {
            first: "@",
            last: "@",
            current: "@",
            show: "@",
            navigation: "@",
            onChange: "@"
        },
        controller: function ($scope, $element) {
            var range = {};
            $scope.skipsBeginning = function () {
                return $scope.first != range.from;
            };
            $scope.skipsEnding = function () {
                return $scope.last != range.to;
            };
            $scope.previous = function () {
                $scope.current = parseInt($scope.current);
                $scope.first = parseInt($scope.first);
                if ($scope.current > $scope.first) {
                    $scope.go($scope.current - 1);
                }
            };
            $scope.next = function () {
                $scope.current = parseInt($scope.current);
                $scope.last = parseInt($scope.last);
                if ($scope.current < $scope.last) {
                    $scope.go($scope.current + 1);
                }
            };
            var controller = this;
            $scope.go = function (to) {
                var from = $scope.current;
                var changing = true;
                $element.get(0).stop = function () {
                    changing = false;
                };
                $element.trigger('changing', [to, from]);
                if (!changing) {
                    return;
                }
                $element.get(0).stop = null;
                $scope.current = to;
                controller.update();
                $element.trigger('changed', [to, from]);
            };
            this.update = function () {
                range = BootstrapUI.tools.range($scope.first, $scope.last, $scope.current, $scope.show);
            };
            this.update();
        }
    };
};
BootstrapUI.tools = {};
BootstrapUI.tools.range = function (from, to, current, show) {
    if (!to) {
        to = from + 1;
    }
    if (!current) {
        current = from;
    }
    if (!show) {
        show = to - from + 1;
    }
    if (show > to - from + 1) {
        show = to - from + 1;
    }
    from = parseInt(from);
    to = parseInt(to);
    current = parseInt(current);
    show = parseInt(show);
    var before = Math.floor(show / 2);
    var after = Math.ceil(show / 2) - 1;
    if (current + after + 1 > to) {
        before += current + after - to;
        after = to - current;
    }
    if (current - before < from) {
        after += before - current + 1;
        before = current - from;
    }
    var output = {
        from: current - before,
        to: current + after,
        expand: function () {
            var result = [];
            for (var i = output.from; i < output.to + 1; i++) {
                result.push(i);
            }
            return result;
        }
    };
    return output;
};
BootstrapUI.filters = {};
BootstrapUI.filters.range = function () {
    return function (input, from, to, current, show) {
        return BootstrapUI.tools.range(from, to, current, show).expand();
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
BootstrapUI.bind = function (module) {
    module.directive(BootstrapUI.directives);
    module.filter(BootstrapUI.filters);
};
BootstrapUI.initialize();
