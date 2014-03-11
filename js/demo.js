$(document).on("ui.ready", function (e, state) {
    var module = angular.module("demoApplication", [], null);
    module.directive("impressBox", function () {
        return {
            restrict: "E",
            replace: true,
            transclude: true,
            scope: {
                link: "@",
                glyph: "@",
                variation: "@"
            },
            template: "<a class='{{variation}} sliding up impress-box' ng-href='{{link}}'>" +
                "<span class='glyph landmark'><span class='glyphicon glyphicon-{{glyph}}'></span></span>" +
                "<span class='caption' ng-transclude></span>" +
                "</a>"
        };
    });
    state.bind(module);
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
