(function (toolkit) {
    toolkit.dynamic.range = new toolkit.classes.Filter("1.0", function () {
        return function (input, from, to, current, show) {
            return BootstrapUI.tools.range(from, to, current, show).expand();
        };
    });
})(BootstrapUI);