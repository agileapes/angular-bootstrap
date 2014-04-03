'use strict';

angular.module("myApplication", ["buMain"]);

describe("bu$compile service", function () {

    var testRoot;

    function createNode() {
        var node = {
            nodeName: "",
            nodeType: -1,
            attributes: {
                items: [],
                item: function (i) {
                    return node.attributes.items[i];
                },
                add: function (name) {
                    node.attributes.items.push({
                        name: name
                    });
                    node.attributes.length = node.attributes.items.length
                },
                length: 0
            }
        };
        return node;
    }

    beforeEach(function () {
        //changing the test root to be <DIV#testRoot/> instead of <HTML/>
        var body = angular.element(document.documentElement).find("body");
        body.append("<div id='testRoot' style='display: none;'></div>");
        testRoot = angular.element(document.getElementById("testRoot"));
        angular.module("myApplication")
            .value("$rootElement", testRoot)
            .config(function (bu$configurationProvider) {
                bu$configurationProvider.reset();
            });
        //loading module
        module("myApplication");
    });

    afterEach(function () {
        //cleaning up the test root
        testRoot.remove();
    });

    it("fails to be invoked if no directive name has been provided", inject(function (bu$compile) {
        expect(bu$compile.bind(null, undefined)).toThrowError("Directive name cannot be empty: " + undefined);
        expect(bu$compile.bind(null, null)).toThrowError("Directive name cannot be empty: " + null);
        expect(bu$compile.bind(null, "")).toThrowError("Directive name cannot be empty: " + "");
    }));

    it("fails to be invoked if a factory is not provided and this is the first usage", inject(function (bu$compile) {
        var directiveName = "directive";
        expect(bu$compile.bind(null, directiveName)).toThrowError("No previous description was found for directive " + directiveName);
    }));

    it("will not fail if invoked with only the name after the first time", inject(function (bu$compile) {
        var directiveName = "myDirective";
        bu$compile(directiveName, function () {
            return {};
        });
        expect(bu$compile.bind(null, directiveName)).not.toThrow();
    }));

    it("returns a compile function `function (root, compileFunction) {...}`", inject(function (bu$compile) {
        var compile = bu$compile("myDirective", function () {
            return {};
        });
        expect(compile).not.toBeUndefined();
        expect(angular.isFunction(compile)).toBeTruthy();
    }));

    it("registers a directive with the `bu$directiveRegistry` registry", inject(function (bu$registryFactory, bu$compile) {
        var registry = bu$registryFactory.get("bu$directiveRegistry");
        expect(registry).not.toBeUndefined();
        expect(registry.list()).toEqual([]);
        var directiveName = "myDirective";
        bu$compile(directiveName, function () {
            return {};
        });
        expect(registry.list()).toEqual([ directiveName]);
        var directive = registry.get(directiveName);
        expect(directive).not.toBeUndefined();
        expect(directive.name).toBe(directiveName);
        expect(directive.directive).not.toBeUndefined();
        expect(directive.factory).not.toBeUndefined();
        expect(directive.filter).not.toBeUndefined();
        expect(directive.compile).not.toBeUndefined();
    }));

    it("invokes the directive factory once", inject(function (bu$compile) {
        var directive = jasmine.createSpy("directiveFactory").and.callFake(function () {
            return {};
        });
        expect(directive).not.toHaveBeenCalled();
        bu$compile("myDirective", directive);
        expect(directive).toHaveBeenCalled();
        expect(directive.calls.count()).toBe(1);
    }));

    it("replaces the factory's context with an object containing the property `bu$Preloaded`", inject(function (bu$compile) {
        var directive = jasmine.createSpy("directiveFactory").and.callFake(function () {
            return {};
        });
        expect(directive).not.toHaveBeenCalled();
        bu$compile("myDirective", directive);
        expect(directive.calls.mostRecent()).toEqual(jasmine.objectContaining({
            object: {
                bu$Preload: true
            }
        }));
        expect(directive.calls.count()).toBe(1);
    }));
    
    it("adds a directive-specific flag to a nodes `.data(...)` under `bu-compiled`", inject(function (bu$compile, $timeout) {
        testRoot.html("<ui:sample></ui:sample>");
        bu$compile('sample', function () {
            return {
                restrict: "E"
            };
        })(testRoot);
        $timeout.flush();
        var data = angular.element(testRoot.children()[0]).data('bu-compiled');
        expect(data).not.toBeUndefined();
        expect(data.uiSample).not.toBeUndefined();
        expect(data.uiSample).toBe(true);
    }));

    describe("when `restrict` contains `A`", function () {

        var namespace = "bu", registry, node, directiveName = "myDirective", filter;

        beforeEach(function () {
            angular.module("myApplication")
                .config(function (bu$configurationProvider) {
                    bu$configurationProvider.set({
                        namespace: namespace
                    });
                });
            node = createNode();
            node.nodeType = 1;
            inject(function (bu$registryFactory, bu$compile) {
                bu$compile(directiveName, function () {
                    return {
                        restrict: "A"
                    };
                });
                registry = bu$registryFactory.get("bu$directiveRegistry");
                filter = registry.get(directiveName).filter;
            });
        });

        it("will accept de-normalized attributes (myAttribute -> my-attribute)", function () {
            node.attributes.add("BU-my-DIRECTIVE", null);
            var chosen = filter(node);
            expect(chosen).toEqual(node);
        });

        it("will accept de-normalized attributes with namespace", function () {
            node.attributes.add("bu:my-directive", null);
            var chosen = filter(node);
            expect(chosen).toEqual(node);
        });

        it("will accept de-normalized attributes with `x-` prefix", function () {
            node.attributes.add("x-bu-my-directive", null);
            var chosen = filter(node);
            expect(chosen).toEqual(node);
        });

        it("will accept de-normalized attributes with `data-` prefix", function () {
            node.attributes.add("data-bu-my-directive", null);
            var chosen = filter(node);
            expect(chosen).toEqual(node);
        });

        it("will not accept any other element", function () {
            var chosen = filter(node);
            expect(chosen).toBeNull();
        });

    });

    describe("when `restrict` contains `E`", function () {

        var namespace = "bu", registry, node, directiveName = "myDirective", filter;
        beforeEach(function () {
            angular.module("myApplication")
                .config(function (bu$configurationProvider) {
                    bu$configurationProvider.set({
                        namespace: namespace
                    });
                });
            node = createNode();
            node.nodeType = 1;
            inject(function (bu$registryFactory, bu$compile) {
                bu$compile(directiveName, function () {
                    return {
                        restrict: "E"
                    };
                });
                registry = bu$registryFactory.get("bu$directiveRegistry");
                filter = registry.get(directiveName).filter;
            });
        });

        it("matches elements with de-normalized name", function () {
            node.nodeName = "bu-my-directive";
            expect(filter(node)).toEqual(node);
        });

        it("matches elements with namespace prefix", function () {
            node.nodeName = "bu:My-Directive";
            expect(filter(node)).toEqual(node);
        });

        it("matches elements with `x-` prefix", function () {
            node.nodeName = "X-BU-My-Directive";
            expect(filter(node)).toEqual(node);
        });

        it("matches elements with `data-` prefix", function () {
            node.nodeName = "Data-BU-My-Directive";
            expect(filter(node)).toEqual(node);
        });
        
        it("does not match any other element", function () {
            expect(filter(node)).toBeNull();
        });

    });
    
    describe("when `restrict` contains `C`", function () {

        var namespace = "bu", registry, node, directiveName = "myDirective", filter;
        beforeEach(function () {
            angular.module("myApplication")
                .config(function (bu$configurationProvider) {
                    bu$configurationProvider.set({
                        namespace: namespace
                    });
                });
            node = createNode();
            node.nodeType = 1;
            inject(function (bu$registryFactory, bu$compile) {
                bu$compile(directiveName, function () {
                    return {
                        restrict: "C"
                    };
                });
                registry = bu$registryFactory.get("bu$directiveRegistry");
                filter = registry.get(directiveName).filter;
            });
        });

        it("matches elements whose class name contains the directive", function () {
            node.className = "something-bu-my-directive-goes-here";
            expect(filter(node)).toEqual(node);
        });

        it("matches elements whose class name contains the directive with namespace prefix", function () {
            node.className = "something-bu:my-directive-goes-here";
            expect(filter(node)).toEqual(node);
        });

        it("matches elements whose class name contains the directive with `x-` prefix", function () {
            node.className = "something-x-bu-my-directive-goes-here";
            expect(filter(node)).toEqual(node);
        });

        it("matches elements whose class name contains the directive with `data-` prefix", function () {
            node.className = "something-data-bu-my-directive-goes-here";
            expect(filter(node)).toEqual(node);
        });

        it("does not match any other element", function () {
            node.className = "something-data-my-directive-goes-here";
            expect(filter(node)).toBeNull();
        });

    });

    describe("when `restrict` contains `I`", function () {

        var namespace = "bu", registry, node, directiveName = "myDirective", filter;
        beforeEach(function () {
            angular.module("myApplication")
                .config(function (bu$configurationProvider) {
                    bu$configurationProvider.set({
                        namespace: namespace
                    });
                });
            node = createNode();
            node.parentNode = createNode();
            node.parentNode.nodeName = "parentNode";
            node.nodeType = 8;
            inject(function (bu$registryFactory, bu$compile) {
                bu$compile(directiveName, function () {
                    return {
                        restrict: "I"
                    };
                });
                registry = bu$registryFactory.get("bu$directiveRegistry");
                filter = registry.get(directiveName).filter;
            });
        });

        it("accepts all comments and returns their parent nodes", function () {
            var chosen = filter(node);
            expect(chosen).not.toBeNull();
            expect(chosen).not.toBeUndefined();
            expect(chosen).toEqual(node.parentNode);
        });

        it("does not accept any other node", function () {
            node.nodeType = 1;
            expect(filter(node)).toBeNull();
        });

    });
    
    describe("by masking the directive returned from the factory", function () {

        var registry;

        beforeEach(function () {
            inject(function (bu$registryFactory) {
                registry = bu$registryFactory.get("bu$directiveRegistry");
            });
        });
    
        it("always returns a directive definition object", inject(function (bu$compile) {
            bu$compile("sample", function () {
                return function () {}
            });
            //even though we return a function, that function will be returned as directive.link.post
            var directive = registry.get("sample").directive;
            expect(angular.isFunction(directive)).toBeFalsy();
            expect(angular.isObject(directive)).toBeTruthy();
        }));
        
        it("returns the link function as the post-link", inject(function (bu$compile) {
            var linker = jasmine.createSpy("linker");
            bu$compile("sample", function () {
                return linker;
            });
            var directive = registry.get("sample").directive;
            expect(directive.link).not.toBeUndefined();
            expect(directive.link.post).not.toBeUndefined();
            expect(angular.isFunction(directive.link.post)).toBeTruthy();
            expect(linker).not.toHaveBeenCalled();
            directive.link.post();
            expect(linker).toHaveBeenCalled();
        }));

        it("sets up a complete object model", inject(function (bu$compile) {
            bu$compile("sample", function () {
                return {};
            });
            var directive = registry.get("sample").directive;
            expect(directive.restrict).toEqual("A");
            expect(directive.scope).toBe(false);
            expect(directive.replace).toBe(false);
            expect(directive.transclude).toBe(false);
            expect(directive.priority).toBe(0);
            expect(directive.require).toBeNull();
            expect(directive.link).not.toBeUndefined();
            expect(directive.link.pre).not.toBeUndefined();
            expect(directive.link.post).not.toBeUndefined();
            expect(angular.isFunction(directive.link.pre)).toBeTruthy();
            expect(angular.isFunction(directive.link.post)).toBeTruthy();
            expect(directive.compile).not.toBeUndefined();
            expect(angular.isFunction(directive.compile)).toBeTruthy();
            expect(directive.compile()).toEqual(directive.link);
        }));

        it("allows defaults to be placed", inject(function (bu$compile, $timeout) {
            var first = "defaultValue";
            var second = "123";
            testRoot.append("<ui:sample another-variable='" + second + "'></ui:sample>");
            bu$compile("sample", function () {
                return {
                    restrict: "E",
                    template: "{{variable}}+{{anotherVariable}}",
                    scope: {
                        variable: "@",
                        anotherVariable: "@"
                    },
                    defaults: {
                        variable: first
                    }
                };
            })(testRoot);
            $timeout.flush();
            expect(testRoot.text()).toBe(first + "+" + second);
        }));

    });

    describe("when promising a template", function () {

        it("holds on to the controller to make sure it does not execute before the template is there", inject(function (bu$compile, $timeout, $q) {
            testRoot.html("<div ui-my-directive value='1234'></div>");
            var deferred = $q.defer();
            var controller = jasmine.createSpy("controller");
            bu$compile("myDirective", function () {
                return {
                    template: deferred.promise,
                    controller: controller,
                    scope: {
                        value: "@"
                    }
                };
            })();
            expect(controller).not.toHaveBeenCalled();
            deferred.resolve("<span>{{value}}</span>");
            $timeout.flush();
            expect(controller).toHaveBeenCalled();
        }));

        it("has the post-link execute before the controller", inject(function (bu$compile, $timeout, $q) {
            testRoot.html("<div ui-my-directive value='1234'></div>");
            var deferred = $q.defer();
            var controller = jasmine.createSpy("controller");
            var linker = jasmine.createSpy("linker").and.callFake(function () {
                expect(controller).not.toHaveBeenCalled();
            });
            bu$compile("myDirective", function () {
                return {
                    template: deferred.promise,
                    controller: controller,
                    link: linker,
                    scope: {
                        value: "@"
                    }
                };
            })();
            expect(controller).not.toHaveBeenCalled();
            expect(linker).not.toHaveBeenCalled();
            deferred.resolve("<span>{{value}}</span>");
            $timeout.flush();
            expect(controller).toHaveBeenCalled();
            expect(linker).toHaveBeenCalled();
        }));

        it("will render the template correctly", inject(function (bu$compile, $timeout, $q) {
            //here we are testing transclusion as well as dependency injection
            testRoot.html("<div ui-my-directive value='1234'>5678</div>");
            var deferred = $q.defer();
            bu$compile("myDirective", function () {
                return {
                    template: deferred.promise,
                    transclude: true,
                    scope: {
                        value: "@"
                    },
                    controller: function (bu$configuration, $scope) {
                        $scope.namespace = bu$configuration.namespace;
                    }
                };
            })();
            deferred.resolve("<span>{{value}}<span ng-transclude></span>{{namespace}}</span>");
            $timeout.flush();
            expect(testRoot.text()).toBe("12345678ui");
        }));

        it("can render a promise that is resolved with a promise", inject(function (bu$compile, $timeout, $q) {
            //here we are testing transclusion as well as dependency injection
            testRoot.html("<div ui-my-directive value='1234'>5678</div>");
            var deferred = $q.defer();
            bu$compile("myDirective", function () {
                return {
                    template: deferred.promise,
                    transclude: true,
                    scope: {
                        value: "@"
                    },
                    controller: function (bu$configuration, $scope) {
                        $scope.namespace = bu$configuration.namespace;
                    }
                };
            })();
            var template = $q.defer();
            deferred.resolve(template.promise);
            template.resolve("<span>{{value}}<span ng-transclude></span>{{namespace}}</span>");
            $timeout.flush();
            expect(testRoot.text()).toBe("12345678ui");
        }));

        it("can render a promise that is resolved with a function", inject(function (bu$compile, $timeout, $q) {
            //here we are testing transclusion as well as dependency injection
            testRoot.html("<div ui-my-directive value='1234'>5678</div>");
            var deferred = $q.defer();
            bu$compile("myDirective", function () {
                return {
                    template: deferred.promise,
                    transclude: true,
                    scope: {
                        value: "@"
                    },
                    controller: function (bu$configuration, $scope) {
                        $scope.namespace = bu$configuration.namespace;
                    }
                };
            })();
            var template = function ($scope) {
                return "<span>" + (parseInt($scope.value) * 2) + "<span ng-transclude></span>{{namespace}}</span>";
            };
            deferred.resolve(template);
            $timeout.flush();
            expect(testRoot.text()).toBe("24685678ui");
        }));

        it("can render a promise that is resolved with a function that returns a promise", inject(function (bu$compile, $timeout, $q) {
            //here we are testing transclusion as well as dependency injection
            testRoot.html("<div ui-my-directive value='1234'>5678</div>");
            var deferred = $q.defer();
            bu$compile("myDirective", function () {
                return {
                    template: deferred.promise,
                    transclude: true,
                    scope: {
                        value: "@"
                    },
                    controller: function (bu$configuration, $scope) {
                        $scope.namespace = bu$configuration.namespace;
                    }
                };
            })();
            var x;
            var deferredTemplate = $q.defer();
            var template = function ($scope) {
                x = $scope.value;
                $timeout(function () {
                    //and some time later
                    deferredTemplate.resolve("<span>" + x + "{{value}}<span ng-transclude></span>{{namespace}}</span>");
                });
                return deferredTemplate.promise;
            };
            deferred.resolve(template);
            $timeout.flush();
            expect(testRoot.text()).toBe("123412345678ui");
        }));

        it("can render a promise which promises a controller and a post-link", inject(function (bu$compile, $timeout, $q) {
            //here we are testing transclusion as well as dependency injection
            testRoot.html("<div ui-my-directive value='1234'>5678</div>");
            var deferred = $q.defer();
            bu$compile("myDirective", function () {
                return {
                    template: deferred.promise,
                    transclude: true,
                    scope: {
                        value: "@"
                    },
                    controller: function (bu$configuration, $scope) {
                        $scope.namespace = bu$configuration.namespace;
                    }
                };
            })();
            var x;
            var deferredTemplate = $q.defer();
            var click = jasmine.createSpy("for when element has been clicked");
            var template = function ($scope) {
                x = $scope.value;
                $timeout(function () {
                    //and some time later
                    deferredTemplate.resolve({
                        template: "<span>" + x + "{{value}}<span ng-transclude></span>{{namespace}}<em>{{added}}</em></span>",
                        controller: function ($scope) {
                            $scope.added = "ADDED";
                        },
                        link: function ($element) {
                            angular.element($element).find("em").on('click', click);
                        }
                    });
                });
                return deferredTemplate.promise;
            };
            deferred.resolve(template);
            $timeout.flush();
            expect(testRoot.text()).toBe("123412345678uiADDED");
            testRoot.find("em").triggerHandler('click');
            expect(click).toHaveBeenCalled();
        }));

    });

});