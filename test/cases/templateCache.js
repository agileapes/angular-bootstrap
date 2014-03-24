describe("TemplateCache", function () {

    var templateCache, $http, $cacheFactory, delegateCache, firstUrl, secondUrl, loadTimeout = 1000;
    var firstTemplate = "<h1>First</h1>";
    var secondTemplate = "<h1>Second</h1>";

    beforeEach(function () {
        firstUrl = "1.html";
        secondUrl = "2.html";
        var templates = {
            "1.html": firstTemplate,
            "2.html": secondTemplate
        };
        $http = {
            status: "idle",
            get: function (url, options) {
                var cache = options && options.cache;
                var deferred = $.Deferred();
                if (cache && cache.get(url)) {
                    deferred.resolve();
                    return deferred.promise();
                }
                $http.status = "working";
                setTimeout(function () {
                    if (typeof templates[url] == "undefined") {
                        deferred.reject();
                        return;
                    }
                    $http.status = "idle";
                    if (cache) {
                        cache.put(url, templates[url]);
                    }
                    deferred.resolve({
                        data: templates[url]
                    });
                }, loadTimeout);
                return deferred.promise();
            }
        };
        $cacheFactory = function (cacheId) {
            if (typeof $cacheFactory.caches[cacheId] != "undefined") {
                return $cacheFactory.caches[cacheId];
            }
            var count = 0;
            var cache = {};
            var result = $cacheFactory.caches[cacheId] = {
                info: function () {
                    return {
                        id: cacheId,
                        size: count
                    }
                },
                put: function (id, template) {
                    if (typeof cache[id] == "undefined") {
                        count++;
                    }
                    cache[id] = template;
                },
                remove: function (id) {
                    if (typeof cache[id] != "undefined") {
                        delete cache[id];
                        count--;
                    }
                },
                removeAll: function () {
                    $.each(cache, function (id) {
                        result.remove(id);
                    });
                },
                destroy: function () {
                    delete $cacheFactory.destroy(cacheId);
                },
                get: function (id) {
                    if (typeof cache[id] != "undefined") {
                        return cache[id];
                    }
                    return null;
                }
            };
            return  result;
        };
        $cacheFactory.caches = {};
        $cacheFactory.destroy = function (cacheId) {
            if (typeof $cacheFactory.caches[cacheId] != "undefined") {
                delete $cacheFactory.caches[cacheId];
            }
        };
        $cacheFactory.get = function (cacheId) {
            if (typeof $cacheFactory.caches[cacheId] != "undefined") {
                return $cacheFactory.caches[cacheId];
            }
            return null;
        };
        delegateCache = $cacheFactory("buTemplateCache");
        spyOn($http, "get").and.callThrough();
        spyOn(delegateCache, "get").and.callThrough();
        spyOn(delegateCache, "put").and.callThrough();
        spyOn(delegateCache, "remove").and.callThrough();
        spyOn(delegateCache, "removeAll").and.callThrough();
        spyOn(delegateCache, "info").and.callThrough();
        spyOn(delegateCache, "destroy").and.callThrough();
        templateCache = new BootstrapUI.classes.TemplateCache($http, $cacheFactory);
        jasmine.clock().install();
    });

    afterEach(function () {
        jasmine.clock().uninstall();
    });

    it("knows itself using the id 'buTemplateCache'", function () {
        expect(templateCache.info().id).toEqual("buTemplateCache");
    });

    describe("when no templates have been loaded yet", function () {

        it("correctly knows that the number of templates included is zero", function () {
            expect(templateCache.info().size).toEqual(0);
        });

        it("will facilitate a $http.get(...) to the specified url for the template to be cached", function () {
            var url = "url/for/a/template.html";
            //initially the http service is not used
            expect($http.status).toEqual("idle");
            templateCache.get(url);
            //after asking the template cache to retrieve a template, it will ask the http service to fetch it
            expect($http.get).toHaveBeenCalled();
            expect($http.get.calls.mostRecent().args[0]).toEqual(url);
            //we expect http service to use the underlying cache
            expect($http.get.calls.mostRecent().args[1]).not.toBeNull();
            //the http service must first call the delegate cache
            expect(delegateCache.get).toHaveBeenCalled();
            expect(delegateCache.get).toHaveBeenCalledWith(url);
            //then the http service must try to load the item from a remote
            expect($http.status).toEqual("working");
        });

        it("will correctly retrieve and return the loaded template", function () {
            var onLoad = jasmine.createSpy("templateLoaded");
            templateCache.get(firstUrl).then(onLoad);
            expect($http.status).toEqual("working");
            jasmine.clock().tick(loadTimeout + 1);
            expect($http.status).toEqual("idle");
            expect(onLoad).toHaveBeenCalled();
            expect(onLoad).toHaveBeenCalledWith(jasmine.objectContaining({
                data: firstTemplate
            }));
        });

        it("will store the loaded template into the delegate cache", function () {
            templateCache.get(firstUrl);
            jasmine.clock().tick(loadTimeout + 1);
            expect(delegateCache.put).toHaveBeenCalled();
            expect(delegateCache.put).toHaveBeenCalledWith(firstUrl, firstTemplate);
            expect(delegateCache.get(firstUrl)).toEqual(firstTemplate);
        });

    });

});