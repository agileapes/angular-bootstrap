(function (toolkit) {
    toolkit.register("range", function (registry) {
        registry.range = new toolkit.classes.Filter("1.0", function () {
            return function (input, from, to, current, show) {
                return BootstrapUI.tools.range(from, to, current, show).expand();
            };
        });
    });
})(BootstrapUI);