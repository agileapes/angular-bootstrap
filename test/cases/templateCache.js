'use strict';

describe("TemplateCache", function () {

    angular.module('myApplicationModule', ["buMain", "cachingHttp"])
        //This is a cache factory that will instantiate and return a simple cache all the time
        .provider("myCacheFactory", function ($cacheFactoryProvider) {
            this.$get = function () {
                var cacheFactory = $cacheFactoryProvider.$get();
                try {
                    delegateCache = cacheFactory("buTemplateCache");
                } catch (e) {
                    delegateCache = cacheFactory.get("buTemplateCache");
                }
                return function () {
                    return delegateCache;
                };
            };
        })
        .config(function ($templateCacheProvider) {
            //we are plugging in the aforementioned cache into the template cache so that our dummy cache
            //is used all the time for internal purposes and so that we can track its content.
            $templateCacheProvider.$get.$inject = ["bu$cachingHttp", "myCacheFactory"];
        });

    var templateCache, $http, delegateCache, firstUrl, templateCacheProvider;
    var firstTemplate = "<h1>First</h1>";

    beforeEach(function () {
        angular.module('myApplicationModule')
            .config(function ($templateCacheProvider) {
                templateCacheProvider = $templateCacheProvider;
            });
        module("myApplicationModule");
        inject(function ($templateCache, bu$cachingHttp) {
            firstUrl = "1.html";
            $http = bu$cachingHttp;
            templateCache = $templateCache;
            spyOn(delegateCache, "get").and.callThrough();
            spyOn(delegateCache, "put").and.callThrough();
            spyOn($http, "get").and.callThrough();
        });
    });

    afterEach(function () {
        $http.verifyNoOutstandingExpectation();
    });

    it("knows itself using the id `buTemplateCache`", function () {
        expect(templateCache.info().id).toEqual("buTemplateCache");
    });

    it("will facilitate a `$http.get(...)` to the specified url for the template to be cached", function () {
        var url = "url/for/a/template.html";
        //initially the http service is not used
        templateCache.get(url);
        //the http service must first call the delegate cache
        expect($http.get).toHaveBeenCalled();
        expect($http.get).toHaveBeenCalledWith(url, jasmine.objectContaining({}));
    });

    it("will correctly retrieve and return the loaded template", function () {
        $http.expect("GET", firstUrl).respond(firstTemplate);
        var onLoad = jasmine.createSpy("for when template has been loaded");
        templateCache.get(firstUrl).then(onLoad);
        expect(onLoad).not.toHaveBeenCalled();
        $http.flush(1);
        expect(onLoad).toHaveBeenCalled();
        expect(onLoad).toHaveBeenCalledWith(firstTemplate);
    });

    it("will store the loaded template into the delegate cache", function () {
        $http.expect("GET", firstUrl).respond(firstTemplate);
        var loadedTemplate = "test";
        templateCache.get(firstUrl).then(function (data) {
            loadedTemplate = data;
        });
        expect(delegateCache.put).not.toHaveBeenCalled();
        $http.flush(1);
        expect(delegateCache.put).toHaveBeenCalled();
        expect(delegateCache.put).toHaveBeenCalledWith(firstUrl, firstTemplate);
        expect(delegateCache.get(firstUrl)).toEqual(firstTemplate);
        expect(loadedTemplate).toEqual(firstTemplate);
    });

    it("cannot load a template that is not there", function () {
        $http.expect("GET", firstUrl).respond(404, {});
        var success = jasmine.createSpy("onSuccess");
        var failure = jasmine.createSpy("onFailure");
        templateCache.get(firstUrl).then(success, failure);
        expect(success).not.toHaveBeenCalled();
        expect(failure).not.toHaveBeenCalled();
        $http.flush(1);
        expect(success).not.toHaveBeenCalled();
        expect(failure).toHaveBeenCalled();
    });

    it("accepts interceptors and lets template values be modified upon `.put(...)`", function () {
        var interceptor = jasmine.createSpy("interceptor").and.callFake(function (template) {
            return template.replace(/x/g, '');
        });
        var url = "/some/template.html";
        var template = "axbxc";
        templateCacheProvider.intercept({
            put: interceptor
        });
        expect(interceptor).not.toHaveBeenCalled();
        templateCache.put(url, template);
        expect(interceptor).toHaveBeenCalled();
        expect(interceptor).toHaveBeenCalledWith(template, url);
        templateCache.get(url).then(function (template) {
            expect(template).not.toBeFalsy();
            expect(template).toBe("abc");
        });
    });

    it("accepts interceptors and lets template values be modified upon `.get(...)`", function () {
        var interceptor = jasmine.createSpy("interceptor").and.callFake(function (template) {
            return template.replace(/x/g, '');
        });
        var url = "/some/template.html";
        var template = "axbxc";
        templateCacheProvider.intercept({
            get: interceptor
        });
        expect(interceptor).not.toHaveBeenCalled();
        templateCache.put(url, template);
        expect(interceptor).not.toHaveBeenCalled();
        templateCache.get(url).then(function (template) {
            expect(interceptor).toHaveBeenCalled();
            expect(interceptor).toHaveBeenCalledWith(template, url);
            expect(template).not.toBeFalsy();
            expect(template).toBe("abc");
        });
    });

    describe("when no templates have been loaded yet", function () {

        it("correctly knows that the number of templates included is zero", function () {
            expect(templateCache.info().size).toEqual(0);
        });

    });

});