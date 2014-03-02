(function (toolkit) {
    toolkit.register("container", function (registry) {
        registry.container = new toolkit.classes.Directive("1.0", "container", function () {
            return {
                restrict: "E",
                replace: true,
                transclude: true,
                templateUrl: registry.container.templateUrl,
                scope: {
                    type: "@",
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
                link: function (scope, element, attribute, containerController) {
                    scope.$content = element;
                    containerController.addSection(scope);
                }
            };
        });
    });
})(BootstrapUI);