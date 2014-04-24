(function (BootstrapUI) {

    BootstrapUI.filter('paginator', function () {
        return function (input, pageSize, pageNumber) {
            if (!angular.isArray(input)) {
                return input;
            }
            var output = [];
            if (!angular.isNumber(pageNumber)) {
                pageNumber = 1;
            }
            if (!angular.isNumber(pageSize)) {
                pageSize = input.length;
            }
            if (pageSize <= 0) {
                pageSize = input.length;
            }
            if (pageSize >= input.length) {
                return input;
            }
            var pages = Math.ceil(input.length / pageSize);
            if (pageNumber <= 0) {
                pageNumber = 1;
            }
            if (pageNumber >= pages) {
                pageNumber = pages;
            }
            for (var i = (pageNumber - 1) * pageSize; i < Math.min(pageNumber * pageSize, input.length); i++) {
                output.push(input[i]);
            }
            return output;
        };
    });

})(dependency('BootstrapUI'));