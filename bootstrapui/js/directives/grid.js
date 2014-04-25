(function (BootstrapUI) {

    BootstrapUI.directive("grid", [
        {
            type: 'filter',
            identifier: 'paginator'
        },
        {
            type: 'filter',
            identifier: 'range'
        }
    ], [function () {
        return {
            restrict: "E",
            replace: true,
            templateUrl: "grid",
            scope: {
                ngModel: '=',
                rows: '@',
                page: '@',
                striped: '@',
                hover: '@',
                bordered: '@',
                condensed: "@",
                controls: "@",
                noData: "@"
            },
            defaults: {
                striped: false,
                hover: false,
                condensed: false,
                bordered: false,
                controls: true,
                noData: "Nothing to show :-)"
            },
            controller: ["$scope", "$element", "$attrs", "$transclude", "$filter", "$sce", "$q", "$interpolate", "bu$event", function controller($scope, $element, $attrs, $transclude, $filter, $sce, $q, $interpolate, bu$event) {
                var helper = {
                    find: function (key) {
                        var deferred = $q.defer();
                        for (var i = 0; i < $scope.ngModel.data.length; i++) {
                            if ($scope.ngModel.data[i][$scope.ngModel.key] == key) {
                                deferred.resolve({
                                    index: i,
                                    data: $scope.ngModel.data[i]
                                });
                                break;
                            }
                        }
                        deferred.reject();
                        return {
                            then: function (success, failure) {
                                deferred.promise.then(function (descriptor) {
                                    if (success) {
                                        $scope.$apply.postpone($scope, [function () {
                                            success.call(null, descriptor);
                                        }]);
                                    }
                                }, function () {
                                    if (failure) {
                                        $scope.$apply.postpone($scope, [function () {
                                            failure.call();
                                        }]);
                                    }
                                });
                            }
                        };
                    },
                    current: function () {
                        return item;
                    }
                };
                var paginator = $filter('paginator');
                var range = $filter('range');
                var controller = this;
                $scope.view = {};
                $scope.view.pages = function () {
                    var event = bu$event($scope, {
                        pages: Math.ceil($scope.ngModel.data.length / $scope.ngModel.view.rows),
                        set: function (pages) {
                            this.pages = pages;
                        }
                    });
                    event.$emit('bu.grid.pages');
                    $scope.pageList = range([], 5, $scope.view.page, 1, $scope.view.currentPages);
                    return event.$get().pages();
                };
                $scope.$watch('ngModel', function (value) {
                    if (angular.isUndefined(value)) {
                        return;
                    }
                    $scope.error = "";
                    if (angular.isUndefined($scope.ngModel)) {
                        $scope.error = "Grid cannot work without proper binding";
                        return;
                    }
                    if (!angular.isObject($scope.ngModel)) {
                        $scope.error = "The bound data model needs to be an object";
                        return;
                    }
                    if (!angular.isArray($scope.ngModel.headers) || $scope.ngModel.headers.length == 0) {
                        $scope.error = "No headers specified for the grid";
                        return;
                    }
                    if (!angular.isArray($scope.ngModel.data)) {
                        $scope.ngModel.data = [];
                    }
                    if (angular.isUndefined($scope.ngModel.key)) {
                        $scope.ngModel.key = "";
                    }
                    if (!angular.isObject($scope.ngModel.view)) {
                        $scope.ngModel.view = {};
                    }
                    if (!angular.isNumber($scope.ngModel.view.rows)) {
                        $scope.ngModel.view.rows = angular.isNumber($scope.rows) ? $scope.rows : 10;
                    }
                    if (angular.isUndefined($scope.ngModel.view.page)) {
                        $scope.ngModel.view.page = angular.isNumber($scope.page) ? $scope.page : 1;
                    } else {
                        $scope.ngModel.view.page = parseInt($scope.ngModel.view.page);
                    }
                    if (angular.isUndefined($scope.ngModel.view.controls)) {
                        $scope.ngModel.view.controls = true;
                    }
                    angular.forEach($scope.ngModel.headers, function (header, index) {
                        if ($scope.error) {
                            return;
                        }
                        if (angular.isString(header)) {
                            header = {
                                id: header
                            };
                        }
                        if (!angular.isString(header.id)) {
                            $scope.error = "Header " + index + " has no id";
                            return;
                        }
                        if (!angular.isString(header.text)) {
                            header.id = header.text;
                        }
                        if (angular.isUndefined(header.visible)) {
                            header.visible = true;
                        }
                        if (angular.isUndefined(header.sortable)) {
                            header.sortable = false;
                        }
                        if (!angular.isNumber(header.width)) {
                            header.width = Math.floor(12 / $scope.ngModel.headers.length);
                        }
                        if (!angular.isNumber(header.className)) {
                            header.className = "";
                        }
                        if (!angular.isFunction(header.handler)) {
                            header.handler = function () {
                                return "N/A";
                            };
                        }
                        $scope.ngModel.headers[index] = header;
                    });
                    if ($scope.error) {
                        return;
                    }
                    $scope.view.currentPages = $scope.view.pages();
                    $scope.view.page = Math.min(Math.max($scope.ngModel.view.page, 1), $scope.view.currentPages);
                    $scope.update();
                }, true);
                $scope.goto = function (disabled, target) {
                    if (disabled) {
                        return;
                    }
                    if (target <= 1) {
                        target = 1;
                    }
                    if (target >= $scope.view.currentPages) {
                        target = $scope.view.currentPages;
                    }
                    if (target == $scope.view.page) {
                        return;
                    }
                    var event = bu$event($scope, {
                        from: $scope.view.page,
                        to: target,
                        cancelled: false,
                        scope: $scope,
                        element: $element,
                        attrs: $attrs,
                        cancel: function () {
                            this.cancelled = true;
                        }
                    });
                    event.$emit('bu.grid.navigating');
                    if (!event.$get().cancelled()) {
                        $scope.ngModel.view.page = target;
                        event.$emit('bu.grid.navigated');
                    }
                };
                $scope.update = function () {
                    $scope.view.data = [];
                    var deferred = $q.defer();
                    var view = paginator($scope.ngModel.data, $scope.ngModel.view.rows, $scope.ngModel.view.page);
                    var event = bu$event($scope, {
                        data: view,
                        page: $scope.view.page,
                        loading: 'Loading ...',
                        set: function (value) {
                            this.data = value;
                        }
                    });
                    event.$emit('bu.grid.data');
                    view = event.$get().data();
                    $scope.loading = $sce.trustAsHtml(event.$get().loading());
                    if (angular.isObject(view) && angular.isFunction(view.then)) {
                        view.then(function (data) {
                            deferred.resolve(data);
                        });
                    } else {
                        deferred.resolve(view);
                    }
                    $scope.view.data = [];
                    deferred.promise.then(function (data) {
                        data = paginator(data, $scope.ngModel.view.rows, $scope.ngModel.view.page);
                        $scope.loading = undefined;
                        var finalView = [];
                        for (var i = 0; i < data.length; i++) {
                            finalView.push(angular.extend({}, data[i]));
                            angular.forEach($scope.ngModel.headers, function (header) {
                                var item = finalView[i];
                                if (angular.isUndefined(item[header.id])) {
                                    item[header.id] = function ($scope, $element, $attrs, helper) {
                                        return header.handler.apply(controller, [$scope, $element, $attrs, helper]);
                                    };
                                }
                                if (angular.isFunction(item[header.id])) {
                                    item[header.id] = item[header.id].apply(controller, [$scope, $element, $attrs, helper]);
                                }
                                var html = item[header.id] === null ? "null" : (item[header.id] === undefined ? "" : item[header.id].toString());
                                html = $interpolate(html)({
                                    $key: item[$scope.ngModel.key],
                                    $item: item
                                });
                                item[header.id] = $sce.trustAsHtml(html);
                            });
                        }
                        $scope.view.data = finalView;
                    });
                };
            }]
        };
    }]);

})(dependency('BootstrapUI'));