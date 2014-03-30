(function () {
    'use strict';
    var module = angular.module("cachingHttp", []);
    module.provider('bu$cachingHttp', function () {
        this.$get = function ($cacheFactory, $q, $rootScope) {
            var cache = $cacheFactory("buCachingHttpMock");
            var requests = [];
            var expectations = [];
            var actions = [];
            var $http = function (configuration) {
                var deferred = $q.defer();
                var resolved = false;
                if (!configuration) {
                    configuration = {};
                }
                if (!configuration.method) {
                    configuration.method = "GET";
                }
                if (!configuration.url) {
                    configuration.url = "";
                }
                if (!configuration.headers) {
                    configuration.headers = {};
                }
                if (configuration.cache) {
                    if (configuration.cache === true) {
                        configuration.cache = cache;
                    }
                    var cachedData = configuration.cache.get(configuration.url);
                    if (cachedData) {
                        actions.push(function () {
                            $rootScope.$apply(function () {
                                deferred.resolve(cachedData, 200, [], configuration);
                            });
                        });
                        return deferred.promise;
                    }
                }
                for (var i = 0; i < expectations.length; i++) {
                    var expectation = expectations[i];
                    if (expectation.method != configuration.method) {
                        break;
                    }
                    if (expectation.url != configuration.url) {
                        break;
                    }
                    if (typeof configuration.data != "undefined" && expectation.data && !angular.equals(configuration.data, expectation.data)) {
                        break;
                    }
                    if (typeof configuration.headers != "undefined" && expectation.headers && !angular.equals(configuration.headers, expectation.headers)) {
                        break;
                    }
                    expectations.splice(i, 1);
                }
                $(requests).each(function () {
                    if (resolved) {
                        return;
                    }
                    var descriptor = this;
                    if (descriptor.request.method != configuration.method) {
                        return;
                    }
                    if (descriptor.request.url != configuration.url) {
                        return;
                    }
                    if (typeof configuration.data != "undefined" && descriptor.request.data && !angular.equals(configuration.data, descriptor.request.data)) {
                        return;
                    }
                    if (typeof configuration.headers != "undefined" && descriptor.request.headers && !angular.equals(configuration.headers, descriptor.request.headers)) {
                        return;
                    }
                    if (descriptor.request.method == configuration.method && descriptor.request.url == configuration.url) {
                        descriptor.called = true;
                        var responseCodeGroup = descriptor.response.status % 100;
                        if (responseCodeGroup == 4 || responseCodeGroup == 5) {
                            actions.push(function () {
                                $rootScope.$apply(function () {
                                    deferred.reject("Error " + descriptor.response.status, descriptor.response.status, descriptor.response.headers, configuration);
                                });
                            });
                        }
                        actions.push(function () {
                            $rootScope.$apply(function () {
                                if (configuration.cache) {
                                    configuration.cache.put(configuration.url, descriptor.response.data);
                                }
                                deferred.resolve(descriptor.response.data, descriptor.response.status, descriptor.response.headers, configuration);
                            });
                        });
                        resolved = true;
                    }
                });
                if (!resolved) {
                    actions.push(function () {
                        $rootScope.$apply(function () {
                            deferred.reject("Not found", 404, {}, configuration);
                        });
                    });
                }
                return deferred.promise;
            };
            /**
             * Sets up a request-response set
             * @param {String} method the HTTP method used for the request
             * @param {String} url the url to which the request is being made
             * @param {Object} [data] the data being sent
             * @param {Array} [headers] the headers for the request
             * @returns {{respond: respond}}
             */
            $http.when = function (method, url, data, headers) {
                var requestHeaders = headers;
                var requestData = data;
                return {
                    /**
                     * Sets up the response for the request being made
                     * @param {int} [status] the status code for the request. Default is 200.
                     * @param {Object} data the data that comes back as the response
                     * @param {Array} [headers] the headers accompanying response
                     */
                    respond: function (status, data, headers) {
                        if (typeof data == "undefined" && typeof headers == "undefined") {
                            data = status;
                            status = 200;
                            headers = [];
                        }
                        if (typeof headers == "undefined") {
                            headers = [];
                        }
                        requests.push({
                            called: false,
                            request: {
                                method: method,
                                url: url,
                                data: requestData,
                                headers: requestHeaders
                            },
                            response: {
                                status: status,
                                data: data,
                                headers: headers
                            }
                        });
                    }
                }
            };
            /**
             * Same as 'when', only sets up an expectation so that we can ensure that the request has
             * been made.
             * @param {String} method the HTTP method used for the request
             * @param {String} url the url to which the request is being made
             * @param {Object} [data] the data being sent
             * @param {Array} [headers] the headers for the request
             * @returns {{respond: respond}}
             */
            $http.expect = function (method, url, data, headers) {
                expectations.push({
                    method: method,
                    url: url,
                    data: data,
                    headers: headers
                });
                return $http.when(method, url, data, headers);
            };
            $http.send = function (method, url, options, data, headers) {
                options = options || {};
                options.method = method || "GET";
                options.headers = headers || options.headers;
                options.url = url || options.url;
                options.data = data || options.data;
                return $http(options);
            };
            /**
             * Makes a GET request to the HTTP backend
             * @param {String} url the URL
             * @param {Object} [options]
             * @param {Array} [headers]
             * @returns {*} promise
             */
            $http.get = function (url, options, headers) {
                return $http.send("GET", url, options, undefined, headers);
            };
            /**
             * Makes a HEAD request to the HTTP backend
             * @param {String} url the URL
             * @param {Object} [options]
             * @param {Array} [headers]
             * @returns {*} promise
             */
            $http.head = function (url, options, headers) {
                return $http.send("HEAD", url, options, undefined, headers);
            };
            /**
             * Makes a POST request to the HTTP backend
             * @param {String} url
             * @param {Object} [options]
             * @param {Object} [data]
             * @param {Array} [headers]
             * @returns {*}
             */
            $http.post = function (url, options, data, headers) {
                return $http.send("POST", url, options, data, headers);
            };
            /**
             * Makes a DELETE request to the HTTP backend
             * @param {String} url
             * @param {Object} [options]
             * @param {Array} [headers]
             * @returns {*}
             */
            $http['delete'] = function (url, options, headers) {
                return $http.send("DELETE", url, options, undefined, headers);
            };
            /**
             * Makes a PATCH request to the HTTP backend
             * @param {String} url
             * @param {Object} [options]
             * @param {Object} [data]
             * @param {Array} [headers]
             * @returns {*}
             */
            $http.patch = function (url, options, data, headers) {
                return $http.send("PATCH", url, options, data, headers);
            };
            /**
             * Makes a PUT request to the HTTP backend
             * @param {String} url
             * @param {Object} [options]
             * @param {Object} [data]
             * @param {Array} [headers]
             * @returns {*}
             */
            $http.put = function (url, options, data, headers) {
                return $http.send("PUT", url, options, data, headers);
            };
            /**
             * Flushes any outstanding requests, fulfilling any that has been set up properly and clearing
             * any expectations met.
             * @param {int} [count] the number of operations to perform as the backend. Default is all.
             */
            $http.flush = function (count) {
                if (typeof count == "undefined") {
                    count = actions.length;
                }
                var toFlush = actions.splice(0, count);
                for (var i = 0; i < toFlush.length; i++) {
                    var action = toFlush[i];
                    action.call();
                }
            };
            /**
             * Resets all the expectations
             */
            $http.resetExpectations = function () {
                expectations.length = 0;
            };
            /**
             * Verifies that no outstanding expectations have been made
             */
            $http.verifyNoOutstandingExpectation = function () {
                if (expectations.length > 0) {
                    var urls = [];
                    for (var i = 0; i < expectations.length; i++) {
                        var obj = expectations[i];
                        urls.push("`" + obj.method + " " + obj.url + "`");
                    }
                    urls = urls.join(", ");
                    throw {
                        message: "Expected URLs to have been queried: " + urls
                    };
                }
            };
            /**
             * Verifies that no outstanding requests are left hanging
             */
            $http.verifyNoOutstandingRequest = function () {
                var outstanding = [];
                for (var i = 0; i < requests.length; i++) {
                    var obj = requests[i];
                    if (!obj.called) {
                        outstanding.push("`" + obj.request.method + " " + obj.request.url + "`");
                    }
                }
                if (outstanding.length > 0) {
                    throw {
                        message: "Outstanding requests not fulfilled: " + outstanding.join(", ")
                    };
                }
            };
            return $http;
        };
        this.$get.$inject = ["$cacheFactory", "$q", "$rootScope"];
    });
})();