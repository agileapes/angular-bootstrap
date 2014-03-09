(function (toolkit, $) {
    toolkit.register("container", function (registry) {
        registry.container = new toolkit.classes.Directive("1.0", "container", function () {
            return {
                restrict: "E",
                replace: true,
                transclude: true,
                templateUrl: registry.container.templateUrl,
                scope: {
                    type: "=",
                    stacked: "@"
                },
                controller: function ($scope, $element) {
                    var sections = $scope.sections = [];
                    var current = null;
                    $scope.activate = function (section) {
                        var state = new toolkit.classes.State({
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
                    $scope.$watch("type", function (current, old) {
                        if (current != old && current == 'accordion' || old == 'accordion') {
                            sections.length = 0;
                        }
                    });
                }
            };
        });
        registry.section = new toolkit.classes.Directive("1.0", "section", function () {
            return {
                require: '^' + toolkit.classes.Directive.qualify("container"),
                restrict: 'E',
                transclude: true,
                replace: true,
                templateUrl: registry.section.templateUrl,
                scope: {
                    title: "@",
                    active: "@",
                    glyph: "@"
                },
                link: function ($scope, $element, $attrs, containerController) {
                    $scope.$content = $element;
                    containerController.addSection($scope);
                    var parentNode = $element.get(0);
                    while (parentNode && !$(parentNode).hasClass('contained')) {
                        parentNode = parentNode.parentNode;
                    }
                    if ($scope.$parent.type == 'accordion') {
                        var transposed = false;
                        var panelGroup = $($element.get(0).parentNode.parentNode).find(".panel-group");
                        var stop = $scope.$watch(function () {
                            return panelGroup.find(".panel[data-index=" + $scope.index + "] .panel-body").get(0);
                        }, function (panel) {
                            if (!panel || transposed) {
                                return;
                            }
                            transposed = true;
                            $(panel).append($element);
                            stop();
                        })
                    } else {

                    }
                }
            };
        });
    });
})(BootstrapUI, jQuery);