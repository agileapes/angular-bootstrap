if (typeof BootstrapUIConfig == "undefined") {
    BootstrapUIConfig = {};
}

var BootstrapUI = {};
BootstrapUI.namespace = BootstrapUIConfig && BootstrapUIConfig.namespace ? BootstrapUIConfig.namespace : "x";
BootstrapUI.base = BootstrapUIConfig && BootstrapUIConfig.base ? BootstrapUIConfig.base : ".";
BootstrapUI.directivesBase = BootstrapUIConfig && BootstrapUIConfig.directivesBase ? BootstrapUIConfig.directivesBase : "js/directives";
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
            var current = null;
            $scope.activate = function (section) {
                var state = BootstrapUI.tools.state({
                    from: current == null ? -1 : current.index,
                    to: section.index,
                    sections: function () {
                        return this.sections
                    },
                    stop: function () {
                        this.status = "stopped";
                    },
                    status: function () {
                        return this.status;
                    }
                }, {
                    sections: sections,
                    status: "changing"
                });
                state.when(parseInt(state.from) != parseInt(state.to), function (state) {
                    state.trigger($element, "changing").when(state.status() == "changing", function () {
                        if (parseInt(state.from) == parseInt(state.to)) {
                            return;
                        }
                        angular.forEach(sections, function (section) {
                            section.active = false;
                        });
                        if (!sections[state.to]) {
                            state.to = state.from;
                            return;
                        }
                        sections[state.to].active = true;
                        current = section;
                        state.trigger($element, "changed");
                    });
                });
            };
            this.addSection = function (section) {
                section.index = sections.length;
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
            scope.$content = element;
            containerController.addSection(scope);
        }
    };
};
BootstrapUI.directives.pagination = function () {
    return {
        restrict: "E",
        replace: true,
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
            this.update = function () {
                range = BootstrapUI.tools.range($scope.first, $scope.last, $scope.current, $scope.show);
            };
            this.update();
        },
        link: function ($scope, $element, $attributes, controller) {
            $scope.go = function (to) {
                BootstrapUI.tools.state({
                    status: function () {
                        return this.status;
                    },
                    stop: function () {
                        this.status = "stopped";
                    },
                    to: to,
                    from: $scope.current
                }, {
                    status: "changing"
                })
                    .trigger($element, "changing")
                    .when(function (state) {
                        return state.status() == "changing";
                    }, function (state) {
                        $element.get(0).stop = null;
                        $scope.current = to;
                        controller.update();
                        state.trigger($element, "changed");
                    });
            };
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
BootstrapUI.tools.state = function (initializer, privates) {
    return new BootstrapUI.tools.State(initializer, privates);
};
BootstrapUI.tools.State = function (initializer, privates) {
    if (!privates) {
        privates = {};
    }
    var key, storage = [];
    var $this = this;
    var init = function () {
        var target = this;
        if ($.isFunction(target)) {
            //noinspection JSUnfilteredForInLoop
            $this[key] = function () {
                return target.apply(privates, arguments);
            };
            return;
        }
        //noinspection JSUnfilteredForInLoop
        $this[key] = target;
    };
    for (key in initializer) {
        //noinspection JSUnfilteredForInLoop
        init.apply(initializer[key], []);
    }
    this.set = function (key, value) {
        storage[key] = value;
    };
    this.get = function (key, defaultValue) {
        if (typeof defaultValue == "undefined") {
            defaultValue = null;
        }
        if (storage[key]) {
            return storage[key];
        }
        return defaultValue;
    };
    this.trigger = function (target, event) {
        alert($this);
        $(target).trigger(event, [$this]);
        return $this;
    };
    this.when = function (condition, callback) {
        if (typeof condition == "boolean") {
            if (!condition) {
                return $this;
            }
        } else {
            if (!condition($this)) {
                return $this;
            }
        }
        callback($this);
        return $this;
    };
};
BootstrapUI.filters = {};
BootstrapUI.filters.range = function () {
    return function (input, from, to, current, show) {
        return BootstrapUI.tools.range(from, to, current, show).expand();
    };
};
(function () {
    BootstrapUI.dynamic = {};
    BootstrapUI.tools = {};
    BootstrapUI.tools.Directive = function (url, directive) {
        this.isDirective = true;
        this.templateUrl = BootstrapUI.base + "/" + url;
        this.directive = directive;
    };
    BootstrapUI.preload = ["icon"];
    var loaded = 0;
    for (var i = 0; i < BootstrapUI.preload.length; i++) {
        $.ajax({
            url: BootstrapUI.base + "/" + BootstrapUI.directivesBase + "/" + BootstrapUI.preload[i] + ".js",
            success: function () {
                loaded++;
            }
        });
    }
    var waiting = setInterval(function () {
        if (loaded == BootstrapUI.preload.length) {
            clearInterval(waiting);
            for (var directive in BootstrapUI.dynamic) {
                if (!BootstrapUI.dynamic[directive].isDirective) {
                    continue;
                }
                BootstrapUI.directives[BootstrapUI.namespace + directive[0].toUpperCase() + directive.substring(1)] = BootstrapUI.dynamic[directive].directive;
            }
            new BootstrapUI.tools.State({
                    directives: function () {
                        return this.directives;
                    },
                    filters: function () {
                        return this.filters;
                    },
                    bind: function (module) {
                        module.directive(this.directives).filters(this.filters)
                    }
                }, {
                    directives: BootstrapUI.directives,
                    filters: BootstrapUI.filters
                })
                .trigger("ready.ui", document);
        }
    }, 100);
})();
