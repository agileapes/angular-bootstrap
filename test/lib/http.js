(function () {
    'use strict';
    window.$_http = function (genericOptions) {
        var urls = [];
        var requests = [];
        var expectations = [];
        var actions = [];
        var $http = {
            /**
             * Sets up a request-response set
             * @param {String} method the HTTP method used for the request
             * @param {String} url the url to which the request is being made
             * @param {Object} [data] the data being sent
             * @param {Array} [headers] the headers for the request
             * @returns {{respond: respond}}
             */
            when: function (method, url, data, headers) {
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
                        urls.push({
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
            },
            /**
             * Same as 'when', only sets up an expectation so that we can ensure that the request has
             * been made.
             * @param {String} method the HTTP method used for the request
             * @param {String} url the url to which the request is being made
             * @param {Object} [data] the data being sent
             * @param {Array} [headers] the headers for the request
             * @returns {{respond: respond}}
             */
            expect: function (method, url, data, headers) {
                expectations.push({
                    method: method,
                    url: url,
                    data: data,
                    headers: headers
                });
                return $http.when(method, url, data, headers);
            },
            /**
             * Sends a request to the backend. The request will not be fulfilled unless a call to
             * 'flush' has been made.
             * @param {String} method the HTTP method
             * @param {String} url the url to which the request should be sent
             * @param {Object} [options] the options for the request. At the moment only 'cache' is supported
             * @param {Object} [data] the data to be sent to the backend
             * @param {Array} [headers] the headers for the request
             * @returns {*} a promise for the future fulfilment of the request
             */
            send: function (method, url, options, data, headers) {
                var deferred = $.Deferred();
                var resolved = false;
                var config = {
                    method: method,
                    url: url,
                    data: data,
                    headers: headers
                };
                options = $.extend(options, genericOptions);
                if (!headers && options.headers) {
                    headers = options.headers;
                }
                if (!url && options.url) {
                    url = options.url;
                }
                if (!method && options.method) {
                    method = options.method;
                }
                if (options.cache) {
                    var cachedData = options.cache.get(url);
                    if (cachedData) {
                        actions.push(function () {
                            deferred.resolve(cachedData, 200, [], config);
                        });
                        return deferred.promise();
                    }
                }
                for (var i = 0; i < expectations.length; i++) {
                    var expectation = expectations[i];
                    if (expectation.method != method) {
                        break;
                    }
                    if (expectation.url != url) {
                        break;
                    }
                    if (typeof data != "undefined" && expectation.data && !angular.equals(data, expectation.data)) {
                        break;
                    }
                    if (typeof headers != "undefined" && expectation.headers && !angular.equals(headers, expectation.headers)) {
                        break;
                    }
                    expectations.splice(i, 1);
                }
                $(requests).each(function () {
                    if (resolved) {
                        return;
                    }
                    var descriptor = this;
                    if (descriptor.request.method != method) {
                        return;
                    }
                    if (descriptor.request.url != url) {
                        return;
                    }
                    if (typeof data != "undefined" && descriptor.request.data && !angular.equals(data, descriptor.request.data)) {
                        return;
                    }
                    if (typeof headers != "undefined" && descriptor.request.headers && !angular.equals(headers, descriptor.request.headers)) {
                        return;
                    }
                    if (descriptor.request.method == method && descriptor.request.url == url) {
                        descriptor.called = true;
                        var responseData = descriptor.response.data;
                        if (options.cache) {
                            options.cache.put(url, descriptor.response.data);
                        }
                        actions.push(function () {
                            deferred.resolve(responseData, descriptor.response.status, descriptor.response.headers, config);
                        });
                        resolved = true;
                    }
                });
                if (!resolved) {
                    actions.push(function () {
                        deferred.reject("Not found", 404, [], config);
                    });
                }
                return deferred.promise();
            },
            /**
             * Makes a GET request to the HTTP backend
             * @param {String} url the URL
             * @param {Object} [options]
             * @param {Array} [headers]
             * @returns {*} promise
             */
            get: function (url, options, headers) {
                return $http.send("GET", url, options, undefined, headers);
            },
            /**
             * Makes a HEAD request to the HTTP backend
             * @param {String} url the URL
             * @param {Object} [options]
             * @param {Array} [headers]
             * @returns {*} promise
             */
            head: function (url, options, headers) {
                return $http.send("HEAD", url, options, undefined, headers);
            },
            /**
             * Makes a POST request to the HTTP backend
             * @param {String} url
             * @param {Object} [options]
             * @param {Object} [data]
             * @param {Array} [headers]
             * @returns {*}
             */
            post: function (url, options, data, headers) {
                return $http.send("POST", url, options, data, headers);
            },
            /**
             * Makes a DELETE request to the HTTP backend
             * @param {String} url
             * @param {Object} [options]
             * @param {Array} [headers]
             * @returns {*}
             */
            'delete': function (url, options, headers) {
                return $http.send("DELETE", url, options, undefined, headers);
            },
            /**
             * Makes a PATCH request to the HTTP backend
             * @param {String} url
             * @param {Object} [options]
             * @param {Object} [data]
             * @param {Array} [headers]
             * @returns {*}
             */
            patch: function (url, options, data, headers) {
                return $http.send("PATCH", url, options, data, headers);
            },
            /**
             * Makes a PUT request to the HTTP backend
             * @param {String} url
             * @param {Object} [options]
             * @param {Object} [data]
             * @param {Array} [headers]
             * @returns {*}
             */
            put: function (url, options, data, headers) {
                return $http.send("PUT", url, options, data, headers);
            },
            /**
             * Flushes any outstanding requests, fulfilling any that has been set up properly and clearing
             * any expectations met.
             * @param {int} [count] the number of operations to perform as the backend. Default is all.
             */
            flush: function (count) {
                if (typeof count == "undefined") {
                    count = actions.length;
                }
                var toFlush = actions.splice(0, count);
                for (var i = 0; i < toFlush.length; i++) {
                    var action = toFlush[i];
                    action.call();
                }
            },
            /**
             * Resets all the expectations
             */
            resetExpectations: function () {
                expectations.length = 0;
            },
            /**
             * Verifies that no outstanding expectations have been made
             */
            verifyNoOutstandingExpectation: function () {
                if (expectations.length > 0) {
                    var urls = [];
                    for (var i = 0; i < expectations.length; i++) {
                        var obj = expectations[i];
                        urls.push(obj.request.method + " " + obj.request.url);
                    }
                    urls = urls.join(", ");
                    throw {
                        message: "Expected URLs to have been queried: " + urls
                    };
                }
            },
            /**
             * Verifies that no outstanding requests are left hanging
             */
            verifyNoOutstandingRequest: function () {
                var outstanding = [];
                for (var i = 0; i < requests.length; i++) {
                    var obj = requests[i];
                    if (!obj.called) {
                        outstanding.push(obj.request.method + " " + obj.request.url);
                    }
                }
                if (outstanding.length > 0) {
                    throw {
                        message: "Outstanding requests not fulfilled: " + outstanding.join(", ")
                    };
                }
            }
        };
        return  $http;
    };
})();