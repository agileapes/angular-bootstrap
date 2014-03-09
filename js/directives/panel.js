(function (toolkit, $) {
    toolkit.register("panel", function (registry) {
        registry.panel = new toolkit.classes.Directive("1.0", "panel", function () {
            return {
                restrict: "E",
                replace: true,
                templateUrl: registry.panel.templateUrl,
                transclude: true,
                scope: {
                    type: "@",
                    title: "@"
                },
                link: function ($scope, $element) {
                    $($element).data('panel', true);
                }
            };
        });
        registry.panelAttachment = new toolkit.classes.Directive("1.0", "panel-attachment", function () {
            return {
                restrict: "E",
                replace: true,
                require: "",
                templateUrl: registry.panelAttachment.templateUrl,
                transclude: true,
                link: function ($scope, $element) {
                    $($element).data('panel-attachment', true);
                    var node = $element.get(0);
                    var panel = null;
                    while (node != null) {
                        if ($(node).data('panel')) {
                            panel = node;
                            break;
                        }
                        if (node.nodeName[0] == '#' || $(node).data('panel-attachment')) {
                            node = node.previousSibling;
                        } else {
                            break;
                        }
                    }
                    if (!panel) {
                        toolkit.tools.console.error("Panel attachments must be placed after panels");
                    }
                    $(panel).append($element);
                }
            };
        });
    });
})(BootstrapUI, jQuery);