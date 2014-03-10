(function (toolkit, $) {
    toolkit.register("popover", function (registry) {
        registry.popover = new toolkit.classes.Directive("1.0", "popover", function ($compile) {
            return {
                restrict: "A",
                priority: 100,
                controller: function ($scope, $element, $attrs) {
                    var selector = $attrs[toolkit.classes.Directive.qualify("popover")];
                    var popover = $(selector).get(0);
                    if (!popover) {
                        toolkit.tools.console.error("Popover element not found: " + selector);
                        return;
                    }
                    var $popover = $(popover);
                    $popover.hide();
                    $scope.init = function () {
                        var title = $popover.attr('title');
                        if (!title) {
                            title = "";
                        }
                        var trigger = $attrs.trigger;
                        if (!trigger) {
                            trigger = "click";
                        }
                        if (trigger != "click" && trigger != "hover" && trigger != "focus" && trigger != "manual") {
                            toolkit.tools.console.warn("Invalid trigger specified: " + trigger + ", falling back to `click`");
                            trigger = "click";
                        }
                        $($element).popover('destroy');
                        $($element).popover({
                            html: true,
                            title: title,
                            content: $compile($popover.html())($scope),
                            container: $element.get(0).parentNode,
                            placement: $attrs.placement ? $attrs.placement : "right",
                            trigger: trigger
                        });
                    };
                    $scope.$watch(function () {
                        return $attrs.placement;
                    }, $scope.init);
                    $scope.$watch(function () {
                        return $attrs.trigger;
                    }, $scope.init);
                    $scope.$watch(function () {
                        return $popover.attr('title');
                    }, $scope.init);
                    $scope.init.postpone();
                }
            };
        });
    });

})(BootstrapUI, jQuery);