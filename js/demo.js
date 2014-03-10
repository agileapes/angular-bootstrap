$(document).on("ui.ready", function (e, state) {
    state.bind(angular.module("demoApplication", [], null));
});
$(function () {
    $("pre code").each(function () {
        hljs.highlightBlock(this);
    });
    $("[data-toggle=tooltip]").tooltip();
    $("pre code .annotation").tooltip({
        container: "body",
        placement: "top",
        html: true
    });
});
