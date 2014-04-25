(function (BootstrapUI) {

    BootstrapUI.filter('range', function () {
        return function (input, range, current, start, end) {
            if (!angular.isArray(input)) {
                return input;
            }
            if (!angular.isNumber(parseInt(start))) {
                start = 1;
            }
            if (!angular.isNumber(parseInt(current))) {
                current = 1;
            }
            if (!angular.isNumber(parseInt(end))) {
                end = current;
            }
            if (!angular.isNumber(parseInt(range))) {
                range = 10;
            }
            start = parseInt(start);
            end = parseInt(end);
            current = parseInt(current);
            range = parseInt(range);
            if (end < start) {
                end = start;
            }
            if (current >= end) {
                current = end;
            }
            if (current <= start) {
                current = start;
            }
            var from = current - Math.floor(range / 2);
            if (from < start) {
                from = start;
            }
            var to = from + range;
            if (to > end) {
                to = end;
                from = to - range;
            }
            if (from < start) {
                from = start;
            }
            var output = [];
            for (var i  = from; i < to + 1; i ++) {
                output.push(i);
            }
            return output;
        };
    });

})(dependency('BootstrapUI'));