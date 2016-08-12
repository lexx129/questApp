angular.module('quest.services', [])

.service('LoginService', function($q) {
    return {
        loginUser: function(name, pass) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            if (name == 'ionic' && pass == 'ionic') {
                deferred.resolve('Valid credentials.');
            } else {
                deferred.reject('Invalid credentials.');
            }
            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        }
    }
});

.service('isAdmin', function($q){
	return{
		 loginUser: function(name, pass) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            if (name == 'admin' && pass == 'admin') {
                deferred.resolve('Yay');
            } else {
                deferred.reject('Nay');
            }
            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        }
	}
});


