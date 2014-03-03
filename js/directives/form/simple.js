(function (toolkit, $) {
    toolkit.register("formInput.simple", function (registry) {
        registry.text = toolkit.ext.formInput.define({
            templateUrl: "simple"
        });
        registry.email = $.extend({}, registry.text);
        registry.password = $.extend({}, registry.text);
        registry.static = toolkit.ext.formInput.define({
            templateUrl: "static"
        });
        registry.textarea = toolkit.ext.formInput.define({
            templateUrl: "textarea"
        });
        registry.checkbox = toolkit.ext.formInput.define({
            templateUrl: "checkbox"
        });
    });
}).postpone(null, [BootstrapUI, jQuery], function () {
        return  typeof BootstrapUI.ext.formInput != "undefined" && !BootstrapUI.ext.formInput.components.text;
    }, 10000);