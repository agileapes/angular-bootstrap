describe("TemplateCache", function () {

    var templateCache, $http, delegateCache, firstUrl, secondUrl, loadTimeout = 1000;
    var firstTemplate = "<h1>First</h1>";
    var secondTemplate = "<h1>Second</h1>";

    beforeEach(inject(function ($cacheFactory) {
        firstUrl = "1.html";
        secondUrl = "2.html";
        delegateCache = $cacheFactory("buTemplateCache");
        $http = window.$_http();
        templateCache = new BootstrapUI.classes.TemplateCache($http, $cacheFactory);
        spyOn(delegateCache, "get").and.callThrough();
        spyOn(delegateCache, "put").and.callThrough();
        spyOn(delegateCache, "remove").and.callThrough();
        spyOn(delegateCache, "removeAll").and.callThrough();
        spyOn(delegateCache, "info").and.callThrough();
        spyOn(delegateCache, "destroy").and.callThrough();
    }));

    afterEach(function () {
        $http.verifyNoOutstandingExpectation();
    });

    it("knows itself using the id 'buTemplateCache'", function () {
        expect(templateCache.info().id).toEqual("buTemplateCache");
    });

    it("will facilitate a $http.get(...) to the specified url for the template to be cached", function () {
        var url = "url/for/a/template.html";
        //initially the http service is not used
        templateCache.get(url);
        //the http service must first call the delegate cache
        expect(delegateCache.get).toHaveBeenCalled();
        expect(delegateCache.get).toHaveBeenCalledWith(url);
    });

    it("will correctly retrieve and return the loaded template", function () {
        $http.expect("GET", firstUrl).respond(firstTemplate);
        var onLoad = jasmine.createSpy("templateLoaded");
        templateCache.get(firstUrl).then(onLoad);
        expect(onLoad).not.toHaveBeenCalled();
        $http.flush();
        expect(onLoad).toHaveBeenCalled();
        expect(onLoad).toHaveBeenCalledWith(firstTemplate);
    });

    it("will store the loaded template into the delegate cache", function () {
        $http.expect("GET", firstUrl).respond(firstTemplate);
        var loadedTemplate;
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

    describe("when no templates have been loaded yet", function () {

        it("correctly knows that the number of templates included is zero", function () {
            expect(templateCache.info().size).toEqual(0);
        });

    });

});