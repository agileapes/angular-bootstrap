if (typeof BootstrapUIConfig == "undefined") {
    BootstrapUIConfig = {};
}

var BootstrapUI = {};
BootstrapUI.namespace = BootstrapUIConfig && BootstrapUIConfig.namespace ? BootstrapUIConfig.namespace : "x";
BootstrapUI.base = BootstrapUIConfig && BootstrapUIConfig.base ? BootstrapUIConfig.base : ".";
BootstrapUI.directivesBase = BootstrapUIConfig && BootstrapUIConfig.directivesBase ? BootstrapUIConfig.directivesBase : "js/directives";
BootstrapUI.templates = {
    icon: "templates/icon.html",
    dropdown: "templates/dropdown.html",
    dropdownItem: "templates/dropdown-item.html",
    dropdownDivider: "templates/dropdown-divider.html",
    dropdownHeader: "templates/dropdown-header.html",
    buttonGroup: "templates/button-group.html",
    buttonGroupButton: "templates/button-group-button.html",
    inputGroup: "templates/input-group.html",
    inputGroupAddon: "templates/input-group-addon.html",
    container: "templates/container.html",
    section: "templates/section.html",
    breadcrumb: "templates/breadcrumb.html",
    breadcrumbItem: "templates/breadcrumb-item.html",
    pagination: "templates/pagination.html"
};
BootstrapUI.directives = {};
;
BootstrapUI.tools = {};
BootstrapUI.tools.state = function (initializer, privates) {
    return new BootstrapUI.tools.State(initializer, privates);
};
BootstrapUI.tools.State = function (initializer, privates) {
    if (!privates) {
        privates = {};
    }
    var key, storage = [];
    var $this = this;
    var init = function () {
        var target = this;
        if ($.isFunction(target)) {
            //noinspection JSUnfilteredForInLoop
            $this[key] = function () {
                return target.apply(privates, arguments);
            };
            return;
        }
        //noinspection JSUnfilteredForInLoop
        $this[key] = target;
    };
    for (key in initializer) {
        //noinspection JSUnfilteredForInLoop
        init.apply(initializer[key], []);
    }
    this.set = function (key, value) {
        storage[key] = value;
    };
    this.get = function (key, defaultValue) {
        if (typeof defaultValue == "undefined") {
            defaultValue = null;
        }
        if (storage[key]) {
            return storage[key];
        }
        return defaultValue;
    };
    this.trigger = function (target, event) {
        alert($this);
        $(target).trigger(event, [$this]);
        return $this;
    };
    this.when = function (condition, callback) {
        if (typeof condition == "boolean") {
            if (!condition) {
                return $this;
            }
        } else {
            if (!condition($this)) {
                return $this;
            }
        }
        callback($this);
        return $this;
    };
};
BootstrapUI.filters = {};
BootstrapUI.filters.range = function () {
    return function (input, from, to, current, show) {
        return BootstrapUI.tools.range(from, to, current, show).expand();
    };
};
(function () {
    BootstrapUI.dynamic = {};
    BootstrapUI.tools = {};
    BootstrapUI.tools.Directive = function (url, directive) {
        this.isDirective = true;
        this.templateUrl = BootstrapUI.base + "/" + url;
        this.directive = directive;
    };
    BootstrapUI.preload = ["icon"];
    var loaded = 0;
    for (var i = 0; i < BootstrapUI.preload.length; i++) {
        $.ajax({
            url: BootstrapUI.base + "/" + BootstrapUI.directivesBase + "/" + BootstrapUI.preload[i] + ".js",
            success: function () {
                loaded++;
            }
        });
    }
    var waiting = setInterval(function () {
        if (loaded == BootstrapUI.preload.length) {
            clearInterval(waiting);
            for (var directive in BootstrapUI.dynamic) {
                if (!BootstrapUI.dynamic[directive].isDirective) {
                    continue;
                }
                BootstrapUI.directives[BootstrapUI.namespace + directive[0].toUpperCase() + directive.substring(1)] = BootstrapUI.dynamic[directive].directive;
            }
            new BootstrapUI.tools.State({
                    directives: function () {
                        return this.directives;
                    },
                    filters: function () {
                        return this.filters;
                    },
                    bind: function (module) {
                        module.directive(this.directives).filters(this.filters)
                    }
                }, {
                    directives: BootstrapUI.directives,
                    filters: BootstrapUI.filters
                })
                .trigger("ready.ui", document);
        }
    }, 100);
})();
