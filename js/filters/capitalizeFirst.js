(function (toolkit, $) {
    toolkit.register("capitalizeFirst", function (registry) {
        registry.capitalizeFirst = new toolkit.classes.Filter("1.0", function () {
            var capitalize = function (input) {
                if (input === null) {
                    return "Null";
                }
                var output;
                if ($.isArray(input)) {
                    output = [];
                    for (var i = 0; i < input.length; i ++) {
                        output[i] = capitalize(input[i]);
                    }
                } else if (typeof(input) == "string") {
                    output = input.replace(/[a-z]+/, function (word) {
                        return word[0].toUpperCase() + word.substring(1);
                    });
                } else {
                    output = capitalize(input.toString());
                }
                return output;
            };
            return  capitalize;
        });
    });
})(BootstrapUI, jQuery);