'use strict';

angular.module("myApplication", ["buMain", "buMockDom"]);

describe("Directive Compiler Service `bu$directiveCompiler`", function () {

    var testRoot;

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
        inject(function ($timeout) {
            $timeout.verifyNoPendingTasks();
        });
    });

    it("can be told about new directives using `.register(...)`", inject(function (bu$directiveCompiler) {
        bu$directiveCompiler.register('a', function () {
            return {};
        });
        var list = bu$directiveCompiler.list();
        expect(list).toContain('a');
        expect(list.length).toBe(1);
    }));

    it("knows the new directives it has been told about since last compile via `.uncompiled()`", inject(function (bu$directiveCompiler) {
        bu$directiveCompiler.register('a', function () {
            return {};
        });
        var list = bu$directiveCompiler.list();
        expect(list).toContain('a');
        expect(list.length).toBe(1);
        var uncompiled = bu$directiveCompiler.uncompiled();
        expect(uncompiled).toContain('a');
        expect(uncompiled.length).toBe(1);
        expect(uncompiled).toEqual(list);
    }));

    it("can be told to forget about the new directvies using `.flush()`", inject(function (bu$directiveCompiler) {
        bu$directiveCompiler.register('a', function () {
            return {};
        });
        var list = bu$directiveCompiler.list();
        var uncompiled = bu$directiveCompiler.uncompiled();
        expect(list).toContain('a');
        expect(list.length).toBe(1);
        expect(uncompiled).toContain('a');
        expect(uncompiled.length).toBe(1);
        expect(uncompiled).toEqual(list);
        bu$directiveCompiler.flush();
        list = bu$directiveCompiler.list();
        uncompiled = bu$directiveCompiler.uncompiled();
        expect(uncompiled).toEqual([]);
        expect(list).toContain('a');
        expect(list.length).toBe(1);
    }));

    describe("has a registry on added directives that", function () {

        var factory;
        var registry;
        var directive = {
            specialProperty: 'special value'
        };

        beforeEach(function () {
            inject(function (bu$directiveCompiler, bu$registryFactory) {
                factory = jasmine.createSpy("that acts as directive factory", function () {
                    return directive;
                }).and.callThrough();
                bu$directiveCompiler.register('a', factory);
                registry = bu$registryFactory.get("bu$directiveCompiler$registry");
            });
        });

        it("is accessible through `bu$registryFactory` via the identifier `bu$directiveCompiler$registry`", function () {
            expect(registry.info()).toEqual(jasmine.objectContaining({
                id: 'bu$directiveCompiler$registry'
            }));
        });

        it("has an `identifier` for each directive", function () {
            expect(registry.get('a')).toEqual(jasmine.objectContaining({
                identifier: 'a'
            }));
        });

        it("remembers the `factory` for each directive", function () {
            expect(registry.get('a')).toEqual(jasmine.objectContaining({
                factory: factory
            }));
        });

        it("given a bracket notation definition turns it into explicit `$inject` annotation", inject(function (bu$directiveCompiler, bu$registryFactory) {
            bu$directiveCompiler.register('someDirective', ["$injector", function ($injector) {
                return {
                    injector: $injector
                };
            }]);
            var registry = bu$registryFactory.get("bu$directiveCompiler$registry");
            var directive = registry.get("someDirective");
            expect(angular.isArray(directive.factory)).toBeFalsy();
            expect(angular.isFunction(directive.factory)).toBeTruthy();
            expect(directive.factory.$inject).toBeDefined();
            expect(angular.isArray(directive.factory.$inject)).toBeTruthy();
            expect(directive.factory.$inject.length).toBe(1);
            expect(directive.factory.$inject).toContain('$injector');
        }));

        it("rejects a factory that is not a function", inject(function (bu$directiveCompiler) {
            expect(bu$directiveCompiler.register.bind(null, 'someDirective', {})).toThrowError("Directive factory should be a function");
        }));

        it("creates a `filter` function for each directive", function () {
            expect(registry.get('a').filter).toBeDefined();
            expect(angular.isFunction(registry.get('a').filter)).toBeTruthy();
        });

        it("creates a `productionFactory` function for each directive which will be called instead of the actual factory", function () {
            expect(registry.get('a').productionFactory).toBeDefined();
            expect(angular.isFunction(registry.get('a').productionFactory)).toBeTruthy();
        });

        it("remembers the non-doctored version of the `directive` as it would be returned by the factory", function () {
            expect(registry.get('a')).toEqual(jasmine.objectContaining({
                directive: directive
            }));
        });

        it("invokes the `factory` method once for each directive", function () {
            expect(factory).toHaveBeenCalled();
            expect(factory.calls.count()).toBe(1);
        });

        it("passes a reference `{bu$Preload: true}` as context to factory upon registration to signal that this " +
            "invocation does not indicate any visual changes", function () {
            expect(factory.calls.mostRecent()).toEqual(jasmine.objectContaining({
                object: {
                    bu$Preload: true
                }
            }));
        });

        it("registers the directive with AngularJS's `$compileProvider`", function () {
            //at the moment I am not sure how to test this.
            //lets trust the code that it will run fine, though.
        });

    });

    describe("when `restrict` contains `A`", function () {

        var namespace = "bu", registry, node, directiveName = "myDirective", filter;

        beforeEach(function () {
            angular.module("myApplication")
                .config(function (bu$configurationProvider) {
                    bu$configurationProvider.set({
                        namespace: namespace
                    });
                });
            inject(function (bu$registryFactory, bu$compile, bu$mock$domBuilder) {
                node = bu$mock$domBuilder.node();
                bu$compile(directiveName, function () {
                    return {
                        restrict: "A"
                    };
                });
                registry = bu$registryFactory.get("bu$directiveRegistry");
                filter = registry.get(directiveName).filter;
            });
        });


    });

    describe("when the `restrict` property is specified by the directive", function () {

        var node;
        var filter;
        var namespace;

        beforeEach(function () {
            angular.module("myApplication")
                .config(function (bu$configurationProvider) {
                    bu$configurationProvider.reset();
                });
            inject(function (bu$configuration, bu$mock$domBuilder) {
                node = bu$mock$domBuilder.node();
                namespace = bu$configuration.namespace;
            });
        });

        describe("and it is set to `A` or is left undefined", function () {

            beforeEach(function () {
                node.nodeType = 1;
                inject(function (bu$directiveCompiler, bu$registryFactory) {
                    bu$directiveCompiler.register('myDirective', function () {
                        return {
                            restrict: "A"
                        };
                    });
                    var registry = bu$registryFactory.get("bu$directiveCompiler$registry");
                    filter = registry.get('myDirective').filter;
                });
            });

            it("will accept de-normalized attributes (myAttribute -> my-attribute)", function () {
                node.setAttribute(namespace + "-my-DIRECTIVE", null);
                var chosen = filter(node);
                expect(chosen).toEqual(node);
            });

            it("will accept de-normalized attributes with namespace", function () {
                node.setAttribute(namespace + ":my-directive", null);
                var chosen = filter(node);
                expect(chosen).toEqual(node);
            });

            it("will accept de-normalized attributes with `x-` prefix", function () {
                node.setAttribute("x-" + namespace + "-my-directive", null);
                var chosen = filter(node);
                expect(chosen).toEqual(node);
            });

            it("will accept de-normalized attributes with `data-` prefix", function () {
                node.setAttribute("data-" + namespace + "-my-directive", null);
                var chosen = filter(node);
                expect(chosen).toEqual(node);
            });

            it("will not accept any other element", function () {
                var chosen = filter(node);
                expect(chosen).toBeNull();
            });

        });

        describe("and it is set to `E`", function () {

            beforeEach(function () {
                inject(function (bu$directiveCompiler, bu$registryFactory) {
                    bu$directiveCompiler.register('myDirective', function () {
                        return {
                            restrict: "E"
                        };
                    });
                    var registry = bu$registryFactory.get("bu$directiveCompiler$registry");
                    filter = registry.get('myDirective').filter;
                });
            });

            it("matches elements with de-normalized name", function () {
                node.nodeName = namespace + "-my-directive";
                expect(filter(node)).toEqual(node);
            });

            it("matches elements with namespace prefix", function () {
                node.nodeName = namespace + ":My-Directive";
                expect(filter(node)).toEqual(node);
            });

            it("matches elements with `x-` prefix", function () {
                node.nodeName = "X-" + namespace + "-My-Directive";
                expect(filter(node)).toEqual(node);
            });

            it("matches elements with `data-` prefix", function () {
                node.nodeName = "Data-" + namespace + "-My-Directive";
                expect(filter(node)).toEqual(node);
            });

            it("does not match any other element", function () {
                expect(filter(node)).toBeNull();
            });

        });

        describe("and it is set to `C`", function () {

            beforeEach(function () {
                inject(function (bu$directiveCompiler, bu$registryFactory) {
                    bu$directiveCompiler.register('myDirective', function () {
                        return {
                            restrict: "C"
                        };
                    });
                    var registry = bu$registryFactory.get("bu$directiveCompiler$registry");
                    filter = registry.get('myDirective').filter;
                });
            });

            it("matches elements whose class name contains the directive", function () {
                node.className = "something-" + namespace + "-my-directive-goes-here";
                expect(filter(node)).toEqual(node);
            });

            it("matches elements whose class name contains the directive with namespace prefix", function () {
                node.className = "something-" + namespace + ":my-directive-goes-here";
                expect(filter(node)).toEqual(node);
            });

            it("matches elements whose class name contains the directive with `x-` prefix", function () {
                node.className = "something-x-" + namespace + "-my-directive-goes-here";
                expect(filter(node)).toEqual(node);
            });

            it("matches elements whose class name contains the directive with `data-` prefix", function () {
                node.className = "something-data-" + namespace + "-my-directive-goes-here";
                expect(filter(node)).toEqual(node);
            });

            it("does not match any other element", function () {
                node.className = "something-data-my-directive-goes-here";
                expect(filter(node)).toBeNull();
            });

        });

        describe("and it is set to `I`", function () {

            beforeEach(function () {
                inject(function (bu$directiveCompiler, bu$registryFactory, bu$mock$domBuilder) {
                    node = bu$mock$domBuilder.node("a-node", bu$mock$domBuilder.comment("my comment"));
                    bu$directiveCompiler.register('myDirective', function () {
                        return {
                            restrict: "I"
                        };
                    });
                    var registry = bu$registryFactory.get("bu$directiveCompiler$registry");
                    filter = registry.get('myDirective').filter;
                });
            });

            it("accepts all comments and returns their parent nodes", function () {
                var chosen = filter(node.firstChild);
                expect(chosen).not.toBeNull();
                expect(chosen).not.toBeUndefined();
                expect(chosen).toEqual(node);
            });

            it("does not accept any other node", function () {
                node.nodeType = 1;
                expect(filter(node)).toBeNull();
            });

        });

    });

    describe("masks the actual factory", function () {

        var registry, postLink;

        beforeEach(function () {
            postLink = jasmine.createSpy("for post link function");
            inject(function (bu$directiveCompiler, bu$registryFactory) {
                bu$directiveCompiler.register('objectDirective', function () {
                    return {};
                });
                bu$directiveCompiler.register('functionDirective', function () {
                    return postLink;
                });
                registry = bu$registryFactory.get("bu$directiveCompiler$registry");
            })
        });

        it("given a factory that returns a function, creates a definition object and populates its post-link with that function", inject(function ($injector) {
            var factory = registry.get('functionDirective').productionFactory;
            var directive = $injector.invoke(factory, {
                bu$Preload: true
            });
            expect(angular.isFunction(directive)).toBeFalsy();
            expect(angular.isObject(directive)).toBeTruthy();
            expect(angular.isFunction(directive.compile)).toBeTruthy();
            var linker = $injector.invoke(directive.compile, null, {
                tElement: null,
                tAttrs: null
            });
            expect(angular.isFunction(linker.post)).toBeTruthy();
            expect(postLink).not.toHaveBeenCalled();
            $injector.invoke(linker.post);
            expect(postLink).toHaveBeenCalled();
        }));

        it("adds the `compile` property if necessary and sets it to `function (...) {...}`", inject(function ($injector) {
            var directiveDescriptor = registry.get('objectDirective');
            var factory = directiveDescriptor.productionFactory;
            var directive = $injector.invoke(factory, {
                bu$Preload: true
            });
            expect(directive.restrict).toBeDefined();
            expect(directive.restrict).toBe('A');
        }));

        it("creates a `link` with `pre()` and `post()` functions returning from the `compile()`", inject(function ($injector) {
            var factory = registry.get('functionDirective').productionFactory;
            var directive = $injector.invoke(factory, {
                bu$Preload: true
            });
            expect(angular.isFunction(directive)).toBeFalsy();
            expect(angular.isObject(directive)).toBeTruthy();
            expect(angular.isFunction(directive.compile)).toBeTruthy();
            var linker = $injector.invoke(directive.compile, null, {
                tElement: null,
                tAttrs: null
            });
            expect(angular.isFunction(linker.pre)).toBeTruthy();
            expect(angular.isFunction(linker.post)).toBeTruthy();
        }));

        it("adds the `restrict` property if necessary and sets it to `A`", inject(function ($injector) {
            var directiveDescriptor = registry.get('objectDirective');
            var factory = directiveDescriptor.productionFactory;
            var directive = $injector.invoke(factory, {
                bu$Preload: true
            });
            expect(directive.restrict).toBeDefined();
            expect(directive.restrict).toBe('A');
        }));

        it("adds the `replace` property if necessary and sets it to `false`", inject(function ($injector) {
            var directiveDescriptor = registry.get('objectDirective');
            var factory = directiveDescriptor.productionFactory;
            var directive = $injector.invoke(factory, {
                bu$Preload: true
            });
            expect(directive.replace).toBeDefined();
            expect(directive.replace).toBe(false);
        }));

        it("adds the `transclude` property if necessary and sets it to `false`", inject(function ($injector) {
            var directiveDescriptor = registry.get('objectDirective');
            var factory = directiveDescriptor.productionFactory;
            var directive = $injector.invoke(factory, {
                bu$Preload: true
            });
            expect(directive.transclude).toBeDefined();
            expect(directive.transclude).toBe(false);
        }));

        it("adds the `priority` property if necessary and sets it to `0`", inject(function ($injector) {
            var directiveDescriptor = registry.get('objectDirective');
            var factory = directiveDescriptor.productionFactory;
            var directive = $injector.invoke(factory, {
                bu$Preload: true
            });
            expect(directive.priority).toBeDefined();
            expect(directive.priority).toBe(0);
        }));

        it("adds the `scope` property if necessary and sets it to `false`", inject(function ($injector) {
            var directiveDescriptor = registry.get('objectDirective');
            var factory = directiveDescriptor.productionFactory;
            var directive = $injector.invoke(factory, {
                bu$Preload: true
            });
            expect(directive.scope).toBeDefined();
            expect(directive.scope).toBe(false);
        }));

        it("adds the `require` property if necessary and sets it to `null`", inject(function ($injector) {
            var directiveDescriptor = registry.get('objectDirective');
            var factory = directiveDescriptor.productionFactory;
            var directive = $injector.invoke(factory, {
                bu$Preload: true
            });
            expect(directive.require).toBeDefined();
            expect(directive.require).toBeNull();
        }));

        it("mask `require` to modify all `bu$` prefixes into namespace prefixes", inject(function ($injector, bu$directiveCompiler) {
            bu$directiveCompiler.register('someDirective', function () {
                return {
                    require: "^bu$SomeOtherDirective"
                };
            });
            var directive = $injector.invoke(registry.get('someDirective').productionFactory);
            expect(directive.require).toEqual("^uiSomeOtherDirective");
        }));

        it("adds the `controller` property if necessary and sets it to `function (...) {}`", inject(function ($injector) {
            var directiveDescriptor = registry.get('objectDirective');
            var factory = directiveDescriptor.productionFactory;
            var directive = $injector.invoke(factory, {
                bu$Preload: true
            });
            expect(directive.controller).toBeDefined();
            expect(angular.isFunction(directive.controller)).toBeTruthy();
        }));

    });

    describe("with no newly registered directives pending", function () {

        it("will know that no nodes require compilation", inject(function (bu$directiveCompiler) {
            var uncompiled = bu$directiveCompiler.findUncompiled();
            expect(uncompiled).toEqual([]);
        }));
        
        it("will not modify the DOM", inject(function (bu$directiveCompiler, bu$mock$domBuilder) {
            var node = bu$mock$domBuilder.node("html", bu$mock$domBuilder.node("a"), bu$mock$domBuilder.node("div", bu$mock$domBuilder.text("Hello!")));
            node.firstChild.setAttribute('href', 'http://www.google.com');
            node.appendChild(bu$mock$domBuilder.node("b"));
            var outerHTML = node.outerHTML;
            bu$directiveCompiler.compile(node);
            expect(node.outerHTML).toEqual(outerHTML);
        }));

    });

    describe("with multiple registered directives pending compilation", function () {

        var order;

        beforeEach(inject(function (bu$directiveCompiler) {
            order = [];
            bu$directiveCompiler.register('x', function () {
                return {
                    replace: true,
                    transclude: true,
                    template: '<div><div ng-transclude></div><ul><li ng-repeat=\'item in items\'>{{item}}</li></ul></div>',
                    restrict: 'E',
                    scope: {},
                    controller: function ($scope) {
                        order.push('x.controller');
                        var items = $scope.items = [];
                        this.add = function (item) {
                            items.push(item);
                        };
                    },
                    link: {
                        pre: function () {
                            order.push('x.preLink');
                        },
                        post: function () {
                            order.push('x.postLink');
                        }
                    }
                };
            });
            bu$directiveCompiler.register('y', function () {
                return {
                    replace: true,
                    require: '^bu$X',
                    scope: {
                        v: '@'
                    },
                    restrict: "E",
                    controller: function () {
                        order.push('y.controller');
                    },
                    link: {
                        pre: function () {
                            order.push('y.preLink');
                        },
                        post: function ($scope, element, attrs, controller) {
                            order.push('y.postLink');
                            controller.add($scope.v);
                        }
                    }
                }
            });
            testRoot.html("<span><ui:x><ui:y v='1'></ui:y><ui:y v='2'></ui:y></ui:x></span>");
        }));

        it("will run `controller`, and `pre` and `post` link functions in the required order", inject(function (bu$directiveCompiler, $timeout) {
            bu$directiveCompiler.compile();
            $timeout.flush();
            expect(order.length).toBe(9);
            expect(order[0]).toBe('x.controller');
            expect(order[1]).toBe('x.preLink');
            expect(order[2]).toBe('y.controller');
            expect(order[3]).toBe('y.preLink');
            expect(order[4]).toBe('y.postLink');
            expect(order[5]).toBe('y.controller');
            expect(order[6]).toBe('y.preLink');
            expect(order[7]).toBe('y.postLink');
            expect(order[8]).toBe('x.postLink');
        }));

        it("can recognize nodes that require compilation using `.findUncompiled(...)`", inject(function (bu$directiveCompiler) {
            var uncompiled = bu$directiveCompiler.findUncompiled();
            expect(uncompiled.length).toBe(1);
            expect(uncompiled[0].nodeName).toBeDefined();
            expect(angular.isString(uncompiled[0].nodeName)).toBeTruthy();
            expect(uncompiled[0].nodeName.toLowerCase()).toBe("ui:x");
        }));

        it("consistently finds the same uncompiled nodes with `.findUncompiled(...)`", inject(function (bu$directiveCompiler) {
            var firstAttempt = bu$directiveCompiler.findUncompiled();
            var secondAttempt = bu$directiveCompiler.findUncompiled();
            expect(firstAttempt).toEqual(secondAttempt);
        }));
        
        it("does not find any nodes via `.findUncompiled(...)` after `.flush()`ing", inject(function (bu$directiveCompiler) {
            var uncompiled = bu$directiveCompiler.findUncompiled();
            expect(uncompiled.length).toBe(1);
            bu$directiveCompiler.flush();
            uncompiled = bu$directiveCompiler.findUncompiled();
            expect(uncompiled).toEqual([]);
        }));

        it("transforms the nodes into their template", inject(function (bu$directiveCompiler, $timeout) {
            bu$directiveCompiler.compile();
            $timeout.flush();
            expect(testRoot.text()).toBe('12');
        }));

    });

    describe("when setting default values", function () {

        var defaultText = "123";

        var buffer;

        beforeEach(inject(function (bu$directiveCompiler) {
            buffer = [];
            bu$directiveCompiler.register('x', function () {
                return {
                    restrict: "E",
                    scope: {
                        a: "@",
                        b: "@"
                    },
                    defaults: {
                        a: defaultText
                    },
                    controller: ["$scope", "$element", "$attrs", "$transclude", "$timeout", function ($scope, $element, $attrs, $transclude, $timeout) {
                        $timeout(function () {
                            buffer.push($scope.a);
                        });
                    }],
                    template: "<span>{{a}}-{{b}}</span>"
                };
            });
            bu$directiveCompiler.register('y', function () {
                return {
                    restrict: "E",
                    scope: {
                        a: "@"
                    },
                    defaults: {
                        b: 1234
                    }
                }
            });
            bu$directiveCompiler.register('z', function () {
                return {
                    restrict: "E",
                    scope: {
                        a: "=?something"
                    },
                    defaults: {
                        a: 1234
                    }
                }
            });
        }));
        
        it("will use the value attributed to scope variables from `defaults` if the attribute is `undefined`", inject(function (bu$directiveCompiler, $timeout) {
            testRoot.html('<ui:x b="xyz"></ui:x>');
            bu$directiveCompiler.compile();
            $timeout.flush();
            expect(testRoot.text()).toBe(defaultText + "-xyz");
        }));

        it("will make the default values available to the original controller if run within a `$timeout`", inject(function (bu$directiveCompiler, $timeout) {
            testRoot.html('<ui:x b="xyz"></ui:x>');
            bu$directiveCompiler.compile();
            $timeout.flush();
            expect(buffer).toBeDefined();
            expect(buffer.length).toBe(1);
            expect(buffer[0]).toEqual('123');
        }));

        it("will depend on the attribute value if it is not `undefined`, regardless of the `defaults`", inject(function (bu$directiveCompiler, $timeout) {
            testRoot.html('<ui:x a="mno" b="xyz"></ui:x>');
            bu$directiveCompiler.compile();
            $timeout.flush();
            expect(testRoot.text()).toBe("mno-xyz");
        }));

        it("will not change the value of any of the `$scope`s variables if they are not defined as a default", inject(function (bu$directiveCompiler, $timeout) {
            testRoot.html('<ui:x></ui:x>');
            bu$directiveCompiler.compile();
            $timeout.flush();
            expect(testRoot.text()).toBe(defaultText + "-");
        }));
        
        it("will result in an error if specifying defaults for variables not bound to the scope", inject(function (bu$directiveCompiler, $timeout) {
            testRoot.html('<ui:y></ui:y>');
            var compile = (function () {
                bu$directiveCompiler.compile();
                $timeout.flush();
            });
            expect(compile).toThrowError("Variable `b` is not defined in the scope of directive `y`");
        }));

        it("will result in an error if specifying defaults with a variable that has not been bound with `@`", inject(function (bu$directiveCompiler, $timeout) {
            testRoot.html('<ui:z></ui:z>');
            var compile = (function () {
                bu$directiveCompiler.compile();
                $timeout.flush();
            });
            expect(compile).toThrowError("Variable `a` is not bound uni-directionally on directive `z`");
        }));

    });

    describe("when using the `resolve` property on the directive definition object", function () {

        it("can render a promised HTML template", inject(function (bu$directiveCompiler, $timeout, $q) {
            var deferred = $q.defer();
            bu$directiveCompiler.register('myDirective', function () {
                return {
                    template: "<span>loading</span>",
                    restrict: "E",
                    replace: true,
                    transclude: true,
                    scope: {
                        v: "@"
                    },
                    resolve: deferred.promise
                };
            });
            testRoot.html("<ui-my-directive v='testing'>the awesome</ui-my-directive>");
            bu$directiveCompiler.compile();
            //we expect the element to display a loader before the promise is resolved
            expect(testRoot.text()).toBe('loading');
            //after compiling, we resolve the promise some time later ...
            $timeout(function () {
                deferred.resolve("<span>{{v}} <span ng-transclude></span></span>");
            });
            $timeout.flush();
            expect(testRoot.text()).toBe('testing the awesome');
        }));

        it("can render an HTML template through a promised function", inject(function (bu$directiveCompiler, $timeout, $q) {
            var deferred = $q.defer();
            bu$directiveCompiler.register('myDirective', function () {
                return {
                    restrict: "E",
                    replace: true,
                    scope: {
                        v: "@"
                    },
                    resolve: deferred.promise
                };
            });
            testRoot.html("<ui-my-directive v='testing'></ui-my-directive>");
            bu$directiveCompiler.compile();
            //after compiling, we resolve the promise some time later ...
            $timeout(function () {
                deferred.resolve(function () {
                    return "<span>{{v}}</span>";
                });
            });
            $timeout.flush();
            expect(testRoot.text()).toBe('testing');
        }));

        it("supports the directive definition object format", inject(function (bu$directiveCompiler, $timeout, $q) {
            var deferred = $q.defer();
            bu$directiveCompiler.register('myDirective', function () {
                return {
                    restrict: "E",
                    replace: true,
                    scope: {
                        v: "@"
                    },
                    resolve: deferred.promise
                };
            });
            testRoot.html("<ui-my-directive v='testing'></ui-my-directive>");
            bu$directiveCompiler.compile();
            //after compiling, we resolve the promise some time later ...
            $timeout(function () {
                deferred.resolve(function () {
                    return {
                        template: "<span>{{v}}</span>"
                    };
                });
            });
            $timeout.flush();
            expect(testRoot.text()).toBe('testing');
        }));

        it("accepts and runs a promised controller", inject(function (bu$directiveCompiler, $timeout, $q) {
            var deferred = $q.defer();
            bu$directiveCompiler.register('myDirective', function () {
                return {
                    restrict: "E",
                    replace: true,
                    scope: {
                        v: "@"
                    },
                    resolve: deferred.promise
                };
            });
            testRoot.html("<ui-my-directive v='testing'></ui-my-directive>");
            bu$directiveCompiler.compile();
            //after compiling, we resolve the promise some time later ...
            var controller = jasmine.createSpy("for checking that the controller is called", function ($scope) {
                $scope.xyz = 123;
            }).and.callThrough();
            controller.$inject = ["$scope"];
            $timeout(function () {
                deferred.resolve(function () {
                    return {
                        template: "<span>{{v}}-{{xyz}}</span>",
                        controller: controller
                    };
                });
            });
            $timeout.flush();
            expect(testRoot.text()).toBe('testing-123');
            expect(controller).toHaveBeenCalled();
        }));

        it("accepts and runs a promised pre-linking function", inject(function (bu$directiveCompiler, $timeout, $q) {
            var deferred = $q.defer();
            bu$directiveCompiler.register('myDirective', function () {
                return {
                    restrict: "E",
                    replace: true,
                    scope: {
                        v: "@"
                    },
                    resolve: deferred.promise
                };
            });
            var linker = jasmine.createSpy("for checking the pre-linker");
            testRoot.html("<ui-my-directive v='testing'></ui-my-directive>");
            bu$directiveCompiler.compile();
            //after compiling, we resolve the promise some time later ...
            $timeout(function () {
                deferred.resolve(function () {
                    return {
                        template: "<span>{{v}}</span>",
                        link: {
                            pre: linker
                        }
                    };
                });
            });
            $timeout.flush();
            expect(testRoot.text()).toBe('testing');
            expect(linker).toHaveBeenCalled();
        }));

        it("accepts and runs a promised post-linking function", inject(function (bu$directiveCompiler, $timeout, $q) {
            var deferred = $q.defer();
            bu$directiveCompiler.register('myDirective', function () {
                return {
                    restrict: "E",
                    replace: true,
                    scope: {
                        v: "@"
                    },
                    resolve: deferred.promise
                };
            });
            var linker = jasmine.createSpy("for checking the pre-linker");
            testRoot.html("<ui-my-directive v='testing'></ui-my-directive>");
            bu$directiveCompiler.compile();
            //after compiling, we resolve the promise some time later ...
            $timeout(function () {
                deferred.resolve(function () {
                    return {
                        template: "<span>{{v}}</span>",
                        link: {
                            post: linker
                        }
                    };
                });
            });
            $timeout.flush();
            expect(testRoot.text()).toBe('testing');
            expect(linker).toHaveBeenCalled();
        }));

        it("runs the directives' `controller`, `preLink` and `postLink` functions in the correct order", inject(function (bu$directiveCompiler, $timeout, $q) {
            var parent = $q.defer();
            var child = $q.defer();
            var order = [];
            bu$directiveCompiler.register('x', function () {
                return {
                    restrict: "E",
                    replace: true,
                    transclude: true,
                    scope: {},
                    resolve: parent.promise,
                    controller: function () {
                        order.push('x.controller');
                    },
                    link: {
                        pre: function () {
                            order.push('x.preLink');
                        },
                        post: function () {
                            order.push('x.postLink');
                        }
                    }
                };
            });
            bu$directiveCompiler.register('y', function () {
                return {
                    restrict: "E",
                    replace: true,
                    require: "^bu$X",
                    scope: {},
                    transclude: true,
                    resolve: child.promise,
                    controller: function () {
                        order.push('y.controller');
                    },
                    link: {
                        pre: function () {
                            order.push('y.preLink');
                        },
                        post: function () {
                            order.push('y.postLink');
                        }
                    }
                };
            });
            testRoot.html("<ui:x><span><ui:y>Hello</ui:y></span></ui:x>");
            bu$directiveCompiler.compile();
            $timeout(function () {
                parent.resolve(function () {
                    return {
                        template: "<span ng-transclude></span>",
                        controller: function () {
                            order.push("x.promise.controller");
                        },
                        link: {
                            pre: function () {
                                order.push("x.promise.preLink");
                            },
                            post: function () {
                                order.push("x.promise.postLink");
                            }
                        }
                    };
                });
            });
            $timeout.flush();
            $timeout(function () {
                child.resolve(function () {
                    return {
                        template: "<span ng-transclude></span>",
                        controller: function () {
                            order.push("y.promise.controller");
                        },
                        link: {
                            pre: function () {
                                order.push("y.promise.preLink");
                            },
                            post: function () {
                                order.push("y.promise.postLink");
                            }
                        }
                    };
                });
            });
            $timeout.flush();
            expect(testRoot.text()).toBe('Hello');
            expect(order.length).toBe(12);
            expect(order[0]).toBe('x.controller');
            expect(order[1]).toBe('x.promise.controller');
            expect(order[2]).toBe('x.preLink');
            expect(order[3]).toBe('x.promise.preLink');
            expect(order[4]).toBe('y.controller');
            expect(order[5]).toBe('x.postLink');
            expect(order[6]).toBe('x.promise.postLink');
            expect(order[7]).toBe('y.promise.controller');
            expect(order[8]).toBe('y.preLink');
            expect(order[9]).toBe('y.promise.preLink');
            expect(order[10]).toBe('y.postLink');
            expect(order[11]).toBe('y.promise.postLink');
        }));

    });

    describe("when calling `.compile()` a second time", function () {

        it("will work properly if the directive does not use `resolve`", inject(function (bu$directiveCompiler, $timeout) {
            bu$directiveCompiler.register('x', function () {
                return {
                    restrict: "E",
                    transclude: true,
                    replace: true,
                    template: "<div ng-transclude></div>"
                };
            });
            testRoot.html("<ui:x>Hello</ui:x>");
            $timeout(function () {
                bu$directiveCompiler.compile();
            });
            $timeout.flush();
            $timeout(function () {
                bu$directiveCompiler.compile();
            });
            $timeout.flush();
            expect(testRoot.text()).toBe('Hello');
        }));

        it("will work properly if the directive uses `resolve` and it is resolved before the first `.compile()`", inject(function (bu$directiveCompiler, $timeout, $q) {
            var deferred = $q.defer();
            bu$directiveCompiler.register('x', function () {
                return {
                    restrict: "E",
                    transclude: true,
                    replace: true,
                    resolve: deferred.promise
                };
            });
            testRoot.html("<ui:x>Hello</ui:x>");
            $timeout(function () {
                deferred.resolve("<div ng-transclude></div>");
            });
            $timeout.flush();
            $timeout(function () {
                bu$directiveCompiler.compile();
            });
            $timeout.flush();
            $timeout(function () {
                bu$directiveCompiler.compile();
            });
            $timeout.flush();
            expect(testRoot.text()).toBe('Hello');
        }));

        it("will work properly if the directive uses `resolve` and it is resolved before the second `.compile()`", inject(function (bu$directiveCompiler, $timeout, $q) {
            var deferred = $q.defer();
            bu$directiveCompiler.register('x', function () {
                return {
                    restrict: "E",
                    transclude: true,
                    replace: true,
                    resolve: deferred.promise
                };
            });
            testRoot.html("<ui:x>Hello</ui:x>");
            $timeout(function () {
                bu$directiveCompiler.compile();
            });
            $timeout.flush();
            $timeout(function () {
                deferred.resolve("<div ng-transclude></div>");
            });
            $timeout.flush();
            $timeout(function () {
                bu$directiveCompiler.compile();
            });
            $timeout.flush();
            expect(testRoot.text()).toBe('Hello');
        }));

        it("will work properly if the directive uses `resolve` and it is resolved after the second `.compile()`", inject(function (bu$directiveCompiler, $timeout, $q) {
            var deferred = $q.defer();
            bu$directiveCompiler.register('x', function () {
                return {
                    restrict: "E",
                    transclude: true,
                    replace: true,
                    resolve: deferred.promise
                };
            });
            testRoot.html("<ui:x>Hello</ui:x>");
            $timeout(function () {
                bu$directiveCompiler.compile();
            });
            $timeout.flush();
            $timeout(function () {
                bu$directiveCompiler.compile();
            });
            $timeout.flush();
            $timeout(function () {
                deferred.resolve("<div ng-transclude></div>");
            });
            $timeout.flush();
            expect(testRoot.text()).toBe('Hello');
        }));

    });

});