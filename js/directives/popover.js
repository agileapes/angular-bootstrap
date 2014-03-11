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
                    $scope.update = function () {
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
                        var template = $popover.clone();
                        template.find("> [ng-non-bindable]").add(template.find("> .ng-non-bindable")).each(function () {
                            this.removeAttribute('ng-non-bindable');
                            $(this).removeClass("ng-non-bindable");
                        });
                        var popoverScope = $scope.$new();
                        popoverScope.close = function () {
                            $($element).popover('hide');
                        };
                        var placement = (typeof $attrs.auto != "undefined" && ($attrs.auto === true || $attrs.auto == "true") ? "auto " : "") + ($attrs.placement ? $attrs.placement : "right");
                        console.log(placement);
                        $($element).popover({
                            html: true,
                            title: title,
                            content: $compile(template.html())(popoverScope),
                            container: $element.get(0).parentNode,
                            placement: placement,
                            trigger: trigger
                        });
                    };
                    $scope.$watch(function () {
                        return $attrs.placement;
                    }, $scope.update);
                    $scope.$watch(function () {
                        return $attrs.trigger;
                    }, $scope.update);
                    $scope.$watch(function () {
                        return $attrs.auto;
                    }, $scope.update);
                    $scope.$watch(function () {
                        return $popover.attr('title');
                    }, $scope.update);
                }
            };
        });
    });

})(BootstrapUI, jQuery);