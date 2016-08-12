//angular.module('quest').factory(quest.services, []);

 quest.service('LoginService', function($q, USER_ROLES) {
	var role = '';
	return {
		loginUser: function(username, password) {
			var deferred = $q.defer();
			var promise = deferred.promise;
			
			if (username == 'User' && password == '1') {
				role = USER_ROLES.user;
				deferred.resolve('Valid credentials.');
			} else {
				if (username == 'Admin' && password == 'qqq'){
					role = USER_ROLES.admin;
					deferred.resolve('Valid credentials.');
				}
				else {
					alert('username = ' + username + '\n password = ' + password );
					deferred.reject('Invalid credentials.');
				}
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
			
		},
		role: function() { //alert("Role in service is " + role);
			return role;}
	};
});

 quest.service('isAdmin', function($q){
	return{
		loginUser: function(name, pass) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            if (name.toLowerCase() == 'admin' && pass == 'admin') {
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


