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
 
// **This service shares date through controlles, like
// 		current scene on edition and etc**
 
 quest.service('SharedProps', function(){
	 var currentScene = {
		 id: '',
		 name: '',
		 time: '',
		 changed: false
	};
	 var currentPage = {
		id: '',
		scene: '',
		num: ''
	};
	 
	 return {
		getCurrScene: function(){
			return currentScene;
		}, 
		getCurrPage: function(){
			return currentPage;
		},
		setCurrScene: function(scene){
			currentScene.id = scene.id;
			currentScene.name = scene.name;
			currentScene.time = scene.time;
		}, 
		setCurrPage: function(page){
			currentPage.id = page.id;
			currentPage.scene = page.scene;
			currentPage.num = page.num;
		},
	};
});

 quest.service('pagesService', function($q, $scope, $cordovaSQLite, tasks){
	return{
		openPages: function(scene){
			var deferred = $q.defer();
			var promise = deferred.promise;
			var query = 'SELECT * FROM `scene-list` WHERE scene = ' + scene.id;
			alert("scene list query: \n" + query);
			$cordovaSQLite.execute(db, query).then(
			function(result){
				if (result.rows.length > 0){
					for (var i = 0; i < result.rows.length; i++){
// 						alert(result.rows.item(i).name);
						$scope.task.push({
							scene: result.rows.item(i).scene,
							num: result.rows.item(i).num
						});
						var taskQuery = 'SELECT * FROM  `tasks` WHERE id = ' + result.rows.item(i).id;
						alert("query for task-list in page #" + result.rows.item(i).id);
						$cordovaSQLite.execute(db, taskQuery).then(
							function(result){
								$scope.tasks.push({
									id: result.rows.item(i).id,
									title: result.rows.item(i).title,
									content:result.rows.item(i).content			
								});
						}, function (err) {
							error(err);
						});
					}
				}
				else {alert("Scene #" + scene.id + " has no pages");}
				}, function (err){
					error(err);
				}
			);
			$state.go('sceneEditor');
		
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
	};
});


