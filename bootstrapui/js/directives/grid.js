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
            controller: ["$scope", "$element", "$attrs", "$transclude", "$filter", "$sce", "$q", function controller($scope, $element, $attrs, $transclude, $filter, $sce, $q) {
                var paginator = $filter('paginator');
                var controller = this;
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
                        $scope.ngModel.view.rows = $scope.rows | 10;
                    }
                    if (!angular.isNumber($scope.ngModel.view.page)) {
                        $scope.ngModel.view.page = $scope.page | 0;
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
                    $scope.view = {};
                    $scope.view.pages = Math.ceil($scope.ngModel.data.length / $scope.ngModel.view.rows);
                    $scope.view.page = Math.min(Math.max($scope.ngModel.view.page, 1), $scope.view.pages);
                    $scope.update();
                }, true);
                $scope.goto = function (target) {
                    if (target <= 1) {
                        target = 1;
                    }
                    if (target >= $scope.view.pages) {
                        target = $scope.view.pages;
                    }
                    $scope.ngModel.view.page = target;
                };
                $scope.update = function () {
                    $scope.view.data = [];
                    var view = paginator($scope.ngModel.data, $scope.ngModel.view.rows, $scope.ngModel.view.page);
                    var finalView = [];
                    for (var i = 0; i < view.length; i++) {
                        finalView.push(angular.extend({}, view[i]));
                        angular.forEach($scope.ngModel.headers, function (header) {
                            var item = finalView[i];
                            if (angular.isUndefined(item[header.id])) {
                                item[header.id] = function ($scope, $element, $attrs, helper) {
                                    return header.handler.apply(controller, [$scope, $element, $attrs, helper]);
                                };
                            }
                            if (angular.isFunction(item[header.id])) {
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
                                                    $scope.$apply.postpone($scope, [function () {
                                                        success.call(null, descriptor);
                                                    }]);
                                                }, function () {
                                                    $scope.$apply.postpone($scope, [function () {
                                                        failure.call();
                                                    }]);
                                                });
                                            }
                                        };
                                    },
                                    current: function () {
                                        return item;
                                    }
                                };
                                item[header.id] = item[header.id].apply(controller, [$scope, $element, $attrs, helper]);
                            }
                            var html = item[header.id] === null ? "null" : (item[header.id] === undefined ? "" : item[header.id].toString());
                            html = html.replace(/\{\{\s*\$key\s*\}\}/g, function () {
                                var value = item[$scope.ngModel.key];
                                if (angular.isString(value)) {
                                    value = '"' + value.replace(/(^|[^\\])"/g, '$1\\"');
                                }
                                return value;
                            });
                            item[header.id] = $sce.trustAsHtml(html);
                        });
                    }
                    $scope.view.data = finalView;
                };
            }]
        };
    }]);

})(dependency('BootstrapUI'));