(function (angular, factory) {
    if (typeof define == 'function' && define.amd) {
        define('angular-repository', ['angular'], function (angular) {
            return factory(angular);
        });
    } else {
        return factory(angular);
    }
}(typeof angular === 'undefined' ? null : angular, function (angular) {
    var module = angular.module('ngRepository', ['ngResource']);
    
module
    .factory('ApiContext', [ '$resource', '$q',
    function ($resource, $q) {
        
        function ApiContext(options) {            
            angular.extend(this, options, {                                
                _contexts: []
            });
        };

        ApiContext.prototype.createContext = function (contextOptions) {
            var validate = this._contexts.filter(function (item) {
                return item.key == contextOptions.key;
            });
            if (validate.length == 0) {                
                var context = {
                    key: contextOptions.key,
                    url: contextOptions.url,
                    urlParams: contextOptions.urlParams
                };
                this._contexts.push(context);
            } else {
                throw new Error("Key already exist!");
            }
        };

        ApiContext.prototype._getContext = function (key) {            
            var fltItem = this._contexts.filter(function (item) {
                return item.key == key;
            });
            var context = fltItem[0];
            return context;
        }

        ApiContext.prototype.getList = function (key) {
            var deferredObject = $q.defer();
            var context = this.isSingle ? this._contexts[0] : this._getContext(key);
            if (context !== "") {
                var resource = $resource(context.url, context.urlParams);
                resource.query(function (response) {
                    deferredObject.resolve(response);
                }, function () {
                    deferredObject.reject("Unable to fetch data!");
                });
            } else {
                throw new Error("Resource Not Found! Check your key!");
            }
            
            //var list = [];

            //deferredObject.promise.then(function (response) {
            //    list = response;
            //}, function (response) {
            //    throw new Error(response);
            //});

            return deferredObject.promise;
        };

        ApiContext.prototype.getByParams = function (key, params) {
            var deferredObject = $q.defer();
            var context = this.isSingle ? this._contexts[0] : this._getContext(key);
            if (context !== undefined) {
                var resource = $resource(context.url, context.urlParams);
                resource.get(params, function (response) {
                    deferredObject.resolve(response);
                }, function () {
                    deferredObject.reject("Unable to fetch data!");
                });
            } else {
                throw new Error("Resource Not Found! Check your key!");
            }

            var item = {};
            deferredObject.promise.then(function (response) {
                item = response;
            }, function (response) {
                throw new Error(response.message);
            });
        };

        ApiContext.prototype.save = function (key, params, data) {
            var deferredObject = $q.defer();
            var context = this.isSingle ? this._contexts[0] : this._getContext(key);
            if (context !== undefined) {
                var resource = $resource(context.url, context.urlParams);
                resource.save(params, data, function (response) {
                    deferredObject.resolve("Succesfully Created!");
                }, function (response) {
                    deferredObject.reject("Action Failed!");
                });
            } else {
                throw new Error("Resource Not Found! Check your key!");
            }
            var result = '';
            deferredObject.promise.then(function (response) {
                result = response;
            }, function (response) {
                throw new Error(respond);
            });
            return result;
        };        

        ApiContext.prototype.destory = function (key, params) {
            var deferredObject = $q.defer();
            var context = this.isSingle ? this._contexts[0] : this._getContext(key);
            if (context !== undefined) {
                var resource = $resource(context.url, context.urlParams);
                resource.remove(params, function (response) {
                    deferredObject.resolve("Successfully Deleted!");
                }, function (response) {
                    deferredObject.reject("Unable to destory!");
                });
            } else {
                throw new Error("Resource Not Found! Check your key!");
            }

            var result = '';

            deferredObject.promise.then(function (response) {
                result = response;
            }, function (response) {
                throw new Error(response);
            });
            return result;
        }

        return ApiContext;        
    }]);

return module;
}));