$(document).on("ui.ready", function (e, state) {
    var module = angular.module("demoApplication", [], null);
    state.bind(angular.module("demoApplication"));
});
