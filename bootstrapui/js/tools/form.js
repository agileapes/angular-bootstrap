(function (BootstrapUI) {
    'use strict';
    var config = {};
    var form = {
        configuration: function () {
            return config;
        },
        configure: function (configuration) {
            if (angular.isUndefined(configuration)) {
                configuration = {};
            }
            config = configuration;
            if (!config.templatesBase) {
                config.templatesBase = "~/form";
            }
            if (!config.directivesBase) {
                config.directivesBase = "~/form";
            }
            config.templatesBase = config.templatesBase.replace(/^~(?:\/|$)/, BootstrapUI.configuration.templatesBase + "/");
            config.directivesBase = config.directivesBase.replace(/^~(?:\/|$)/, BootstrapUI.configuration.directivesBase + "/");
            if (angular.isUndefined(config.preloadAll)) {
                config.preloadAll = false;
            }
            if (!angular.isObject(config.aliases)) {
                config.aliases = {};
            }
            if (!angular.isObject(config.aliases.input)) {
                config.aliases.input = {};
            }
            if (!angular.isObject(config.aliases.select)) {
                config.aliases.select = {};
            }
            config.aliases.input['basic'] = 'disallowed'; //redirect so that type 'basic' cannot be used
            config.aliases.input['text'] = 'basic';
            config.aliases.input['password'] = 'basic';
            config.aliases.input['email'] = 'basic';
            config.aliases.input['date'] = 'basic';
            if (angular.isUndefined(config.visualErrors)) {
                config.visualErrors = true;
            }
        }
    };
    form.configure();
    BootstrapUI.tools.register('form', form);
})(dependency("BootstrapUI"));