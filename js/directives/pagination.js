(function (toolkit) {
    toolkit.register("pagination", function (registry) {
        registry.pagination = new toolkit.classes.Directive("1.0", "pagination", function () {
            return {
                restrict: "E",
                replace: true,
                templateUrl: registry.pagination.templateUrl,
                scope: {
                    first: "@",
                    last: "@",
                    current: "@",
                    show: "@",
                    navigation: "@",
                    onChange: "@"
                },
                controller: function ($scope) {
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
                        range = toolkit.tools.range($scope.first, $scope.last, $scope.current, $scope.show);
                    };
                    this.update();
                },
                link: function ($scope, $element, $attributes, controller) {
                    $scope.go = function (to) {
                        new toolkit.classes.State({
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
        });
    });
})(BootstrapUI);