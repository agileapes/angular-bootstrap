(function (toolkit, $) {
    toolkit.register("formInput.simple", function (registry) {
        registry.text = toolkit.ext.formInput.define({
            templateUrl: "simple",
            link: function ($scope, $element, $attributes, controller, event) {
            },
            controller: function ($scope, $element) {
            }
        });
        registry.email = $.extend({}, registry.text);
        registry.password = $.extend({}, registry.text);
        registry.static = $.extend({}, registry.text);
        registry.checkbox = $.extend({}, registry.text);
        registry.textarea = $.extend({}, registry.text);
    });
})(BootstrapUI, jQuery);