(function (toolkit, $) {
    toolkit.register("formSelect.combo", function (registry) {
        registry.combo = toolkit.ext.formSelect.define({
            templateUrl: "combo"
        });
    });
}).postpone(null, [BootstrapUI, jQuery], function () {
        return  typeof BootstrapUI.ext.formSelect != "undefined" && !BootstrapUI.ext.formSelect.components.text;
    }, 10000, "loading basic form select input points");