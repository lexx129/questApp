//angular.module('quest').controller(quest.controllers, ['ngCordova'])

quest.controller('QuestCtrl', function ($scope, $state, $cordovaSQLite, $ionicPlatform, $cordovaBarcodeScanner) {
	
	$scope.scene={
		id: 		'',
		time: 	'',
		startTime:	'',
		endTime: 	'',
		currentTask: '',
		name: 	'',
		task: 	''
	};

	$scope.getContext = function() {
		var query = "SELECT * FROM `active-scene`";
		var promise = $cordovaSQLite.execute(db, query).then(
			function (result) {
				if (result.rows.length != 1) {
					alert("there're more then 1 active scene now");
					$state.go('sceneChooser');
					return;
				}				
				$scope.scene.startTime = result.rows.item(0).start_time;
				$scope.scene.id = result.rows.item(0).scene;
				$scope.scene.currentTask = result.rows.item(0).current_task;
				
				alert("\nactive scene id is " + $scope.scene.id);

				if ($scope.scene.currentTask != 0 && !confirm("Продолжить квест?"))
					$state.go('sceneChooser');
				
				var query = 'SELECT * FROM `scene` WHERE `id` ="' + $scope.scene.id + '"';
// 				alert("query 1 = " + query);
				$cordovaSQLite.execute(db, query).then(
					function (result) {
							if (result.rows.length != 1) {
								alert('Такого сценария нет!');
							return;
						}
						
						$scope.scene.name = result.rows.item(0).name;
						$scope.scene.time = result.rows.item(0).time;
						
						alert("scene name = " + $scope.scene.name + "\n scene time = " + $scope.scene.time);
						document.getElementById("timer").innerHTML = formatTime(parseInt($scope.scene.time / 60)) + ':' + formatTime(parseInt($scope.scene.time % 60)) + ':00';

						var query = 'SELECT * FROM `scene-list` WHERE scene = "' + $scope.scene.id + '" AND `num` = "' + $scope.scene.currentTask + '"';
// 						alert("query 2 = " + query);
						$cordovaSQLite.execute(db, query).then(
							function (result) {
								if (result.rows.length != 0) {
									$scope.scene.task = result.rows.item(0).task;
								}
								getPage();
							},
							function (err) {
								error(err);
							}
						);
					},
					function (err) {
						error(err);
					}
				);
			},
			function (err) {
				error(' db !exists ' + err);
			}
		);
	}
	
	function getPage(status) {
		alert('currentTask ' + $scope.scene.currentTask + '  scene.id ' + $scope.scene.id);

		if ($scope.scene.currentTask == -1) {
			var msg = '';
			switch (status) {
				case 'overtime' :
				msg = 'Время вышло';
				break;
				default:
				msg = 'Конец';
			}
			timerStart = false;
			clearInterval(timeinterval);

			var totalTime = Date.parse(new Date()) - Date.parse($scope.scene.startTime);

			var query = 'INSERT INTO `scene-stats` ("scene", "time", "status") VALUES (' + $scope.scene.id + ', ' + totalTime + ', "' + msg + '")';

			$cordovaSQLite.execute(db, query).then(
				function () {
				var query = 'DELETE FROM `active-scene`';
				$cordovaSQLite.execute(db, query).then($cordovaSQLite.execute(db, 'VACUUM'));

				$('ion-content').html('<h1>' + msg + '</h1>');
				},
				function (err) {
				error(err)
				}
			);
			return;
		}

		if ($scope.scene.currentTask == 0) {
			$('h1').text($scope.scene.name);
			return;
		}

		timerStart = true;
		$scope.scene.endTime = Date.parse($scope.scene.startTime) + ($scope.scene.time * 60 + UTCShift) * 1000;
		
		var query = 'SELECT * FROM `tasks` WHERE id = "' + $scope.scene.task + '"';

		$cordovaSQLite.execute(db, query).then(
		function (result) {
			if (result.rows.length == 0) {
				error('!exists task ' + $scope.scene.task);
				return;
			}
			$('h1').text(result.rows.item(0).title);

			$('#content').text(result.rows.item(0).content);
			var query = 'SELECT * FROM `questions` WHERE `task` = ' + $scope.scene.task + ' ORDER BY `number`';
			$cordovaSQLite.execute(db, query).then(
			function (result) {
				$('#question').html("");
				for (var i = 0; i < result.rows.length; i++) {
					$('#question').html($('#question').html() + '<label id="question-' + result.rows.item(i).id + '"><span>' + result.rows.item(i).question +'</span></label>');
					var html = '';
					formatQuestion(result.rows.item(i).id, result.rows.item(i).type);
				}
			}

			,
			function (err) {
				error(err)
			}
			);
		},
		function (err) {
			error(err)
		}
		);

		function formatQuestion(id, type) {
			switch(type) {
				case 1 :// TEXT FIELD
					var query = 'SELECT * FROM `answers` WHERE `question` = ' + id + ' AND `valid` = "1";';
					var question = {"id": id};
					$cordovaSQLite.execute(db, query).then(
						function (result) {
							var html = '<input type="text" name="question-' + question.id +
							'" value="" answer="' + result.rows.item(0).answer + '" placeholder="Введите ответ" required />';
							$('#question-' + id).html($('#question-' + id).html() + html);
						},
						function (err) {
							error(err)
						}
					);
					break;

				case 2 ://CHECKBOX 
					var query = 'SELECT * FROM `answers` WHERE `question` = ' + id + ' AND `valid` = "1";';
					$cordovaSQLite.execute(db, query).then(
						function (result) {
							var html = '<input type="checkbox" name="question-' + question.id +
								'" value="" answer="' + result.rows.item(0).valid + '" required />';
							$('#question-' + id).html($('#question-' + id).html() + html);
						},
						function (err) {
							error(err)
						}
					);
					break;
					
				case 3 :// SELECT
					var query = 'SELECT * FROM `answers` WHERE `question` = ' + id;
					$cordovaSQLite.execute(db, query).then(
						function (result) {
							var html = '',
							answer = '';
							for (var i = 0; i < result.rows.length; i++) {
								html += '<option>' + result.rows.item(i).answer + '</option>';
								if (result.rows.item(i).valid == 1)
									answer = result.rows.item(i).answer;
							}
							html = '<select name="question-' + id + '" answer="' + answer + '" required>' + html + '</select>';
							$('#question-' + id).html($('#question-' + id).html() + html);
						},
						function (err) {
							error(err)
						}
					);
					break;
					
				case 4 :// QR
					var query = 'SELECT * FROM `answers` WHERE `question` = ' + id + ' AND `valid` = "1";';
					$cordovaSQLite.execute(db, query).then(
						function (result) {
							var html = '<button type="button" class="QR">Сканировать QR код</button><input type="text" style="display: none;" id="question-qr" name="question-' + id + '" value="" answer="' + result.rows.item(0).answer + '"/>';
							$('#question-' + id).html($('#question-' + id).html() + html);
							$('.QR').bind('click', function(){$('#qr').click()});
						},
						function (err) {
							error(err)
						}
					);
					break;
			}
		}
	}

	$scope.getnextpage = function () {
		if (!checkFirst()){
// 			alert("**This page is not first**");
// 		**Promises doesn't work on KitKat**
			var check = checkAnswers();
			if (check){
				var query = 'UPDATE `active-scene` SET `current_task` = `current_task` + 1';
				$cordovaSQLite.execute(db, query).then(
					function () {
						alert("All answers are correct");
						getTask();
					},
					function (err) {
						error(err);
					}
				);
			}
			else if (check == -1) {
				getTask();
			}

// 			var check = new Promise((resolve, reject) => {
// 				//Return true if answer is correct
// 				function checks(){
// 					if (checkAnswers())
// 						resolve("result");
// 				}
// 				checks();
// 			});
// 			check.then(
// 				result => {
// 					//alert("This page is first");
// 					getNextTask();
// 				}
// 			);
		}	
	};

	function checkAnswers() {
		var ret = true;
		
		if (!$( "[name *= 'question-']" ).length)
			return -1;
		
		$( "[name *= 'question-']" ).each(function( index ) {
			alert(index);
			var val = '';
			var id = parseInt($(this).attr('name').replace("question-", ""));
			
			if ($(this).is('[type="text"]') || $(this).is('select')) {
				val = $(this).val().trim();
			}
			else {
				val = $(this).is(":checked") ? 1 : 0;
			}
			
			alert ('This val: ' + val + ' and ans: ' + $(this).attr("answer"));
			if (val.localeCompare($(this).attr("answer").trim()) != 0)
			{
				alert('Неверный ответ на вопрос №' + (index + 1));
				ret = false;
			}
		});
		
		return ret;
	}

	//Return true if page is front page of quest
	//Return false otherwise
	//Update active-scene time
	function checkFirst() {
		$cordovaSQLite = sqlplugin;
		if ($scope.scene.currentTask == 0) {
			// Update time in `active-scene` if we start the quest
			$cordovaSQLite.execute(db, 'DELETE FROM `active-scene`').then(
				function () {
					alert("scene id is " + $scope.scene.id);
					var query = 'INSERT INTO `active-scene` ("scene", "current_task") VALUES (' + $scope.scene.id + ', 1)';
					$cordovaSQLite.execute(db, query).then(
						function () {
// 							alert("active scene updated");
							getTask();
						},
						function (err) {
							error(err);
						}
					);
				},
				function (err) {
					error(err);
				}
			);
			return true;
		}
		return false;
	}

		
	//Change current task and call getPage
	function getTask() {

		var query = 'SELECT `current_task`, `start_time` FROM `active-scene`';
		$cordovaSQLite.execute(db, query).then(
			function (result) {
				//alert(result.rows.item(0));
				$scope.scene.currentTask = result.rows.item(0).current_task;
				$scope.scene.startTime = result.rows.item(0).start_time;
				
				var query = 'SELECT * FROM `scene-list` WHERE scene = "' + ($scope.scene.id) + '" AND `num` = "' + $scope.scene.currentTask + '"';
				alert("query is " + query);
				$cordovaSQLite.execute(db, query).then(
				function (result) {
					if (result.rows.length == 0) {
						alert ('Active scene ' + $scope.scene.id  + ' not found!');
						$scope.scene.currentTask = -1;//End quest
						getPage();
						return;
					}
					$scope.scene.task = result.rows.item(0).task;//Next task of quest
					getPage();
				},
				function (err) {
					error(err);
				}
				);
			},
			function (err) {
				error(err);
			}
		);
	}
	
	var timeinterval = setInterval(timer, 1000);

	function timer() {
		//var t = Date.parse('July 5 2016 23:00:00 GMT+03:00') - Date.parse(new Date());
		var t = $scope.scene.endTime - Date.parse(new Date());
		if (!timerStart)
			return;
		
		if (t < 0) {
			$scope.scene.currentTask = -1;
			getPage('overtime');
			return;
		}
		var seconds = Math.floor((t / 1000) % 60);
		var minutes = Math.floor((t / 1000 / 60) % 60);
		var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
		$('#timer').text(formatTime(hours) + ':' + formatTime(minutes) + ':' + formatTime(seconds));
	}

	$scope.scanBarcode = function() {
		$cordovaBarcodeScanner.scan().then(
			function (imageData) {
				$('#question-qr').val(imageData.text.trim());
				$('#next').click();
				alert(imageData.text.trim());
			}, function (error) {
			console.log("An error happened -> " + error);
		});
	};
});

quest.controller('sceneChooseCtrl', function($scope, $state, $cordovaSQLite, SharedProps){
	$scope.scenes = [],
	
	$scope.printScenes = function(){ 
		var query = 'SELECT * FROM `scene`';
		$cordovaSQLite.execute(db, query).then(
			function(result){
				if (result.rows.length > 0){
					for (var i = 0; i < result.rows.length; i++){
						//alert(result.rows.item(i).name);
						$scope.scenes.push({
							name: result.rows.item(i).name,
							id: result.rows.item(i).id,
							time:result.rows.item(i).time
						});
					}
				}
				else {
					console.log("No scenes found");
				}
			}, function (err) {
				error(err);
			}
		);
	};	
	
	$scope.setScene = function(scene){
		var clearQ = "DELETE from 'active-scene'";
		$cordovaSQLite.execute(db, clearQ).then(
			function(){
				var setQuery = 'INSERT into `active-scene`("scene", "current_task") VALUES (' + scene.id + ', 0)';
				alert("setQuery = "  + setQuery);
				$cordovaSQLite.execute(db, setQuery).then(
					function(){
						$state.go('main');
					}, function(err){
						error(err);
					}
				);
			}, function(err){
				error(err);
			} 
		);
			
	};
});

quest.controller('LoginCtrl', function($scope, LoginService, $ionicPlatform, $ionicPopup, $state, $cordovaSQLite, USER_ROLES){
	$scope.user = {};
	var defaultForm = {
		login : "",
		password : ""
	}
	$scope.login = function(){
// 		alert($scope.user.username + "\n" +
// 					$scope.user.password);
		LoginService.loginUser($scope.user.username,
					$scope.user.password).success(function(user) {
		//	alert("user logged on");
			/*LoginService.isAdmin($scope.data.username, 
						$scope.data.password).success(function(data){
				
				$state.go('adminPanel');
			}).error(function(data){
				alert("user logged on")
				$stage.go('main');
			});*/
			if (LoginService.role() == 'user_role'){
				//alert("Role in ctrl is " + LoginService.role());
				var inspectQ = "SELECT * from 'active-scene' WHERE 'current_task' > 0";
				$cordovaSQLite.execute(db, inspectQ).then(
					function(result){
						if (result.rows.length > 0){
							alert("There is unfinished scene, going there..");
							$state.go('main');
						} else{
							alert("No unfinished scenes found, going to chooser");
							$state.go('sceneChooser');
						}
					},function(err){
						error(err);
					}
					
				);
			} else {
				if (LoginService.role() == 'admin_role')
					$state.go('adminPanel');
			}
		}).error(function(user) {
			var alertPopup = $ionicPopup.alert({
				title: 'Неверный логин/пароль!',
				template: 'Invalid credentials!'
			});
		});
		$scope.user.username = "";
		$scope.user.password = "";
// 		$scope.form.loginForm = angular.copy(defaultForm);
		
// 		$scope.form.loginForm.$setUntouched();
	}
// 	console.log("Logged on as '" + $scope.user.username + 
// 		"', using pswd '" + $scope.user.password);
});

quest.controller("AdminCtrl", function ($rootScope, $scope, $state, $ionicPlatform, $ionicModal, $cordovaSQLite, $ionicListDelegate, SharedProps) {
	//button to set DB to default value
	$scope.prefildDB = function(){
		if (confirm("Очистить ДБ?")){
			prefildDB();
		}
	}
	
	$ionicModal.fromTemplateUrl('templates/addNewScene.html', function($ionicModal){
		$scope.newScene = $ionicModal;
	},{
		scope: $scope,
		animation: 'slide-in-up'
	});
	
	$scope.addNewScene = function(){
		$scope.newScene.show();
		$scope.scene = {
			id: "",
			name: "",
			time: ""
		}
	};
	
	$scope.closeCreating = function(){
	  $scope.newScene.hide();
	}
	$scope.confirmSceneCreate = function(scene){
		var addQuery = 'INSERT INTO `scene` ("name", "time") VALUES ("' + scene.name + '", ' + scene.time +')';
		alert(addQuery);
		$cordovaSQLite.execute(db, addQuery).then(
			function(){
				$scope.$emit('sceneAdded');
				$state.go('adminPanel');
				$scope.newScene.hide();
			},
                function (err) {
                  error(err)
			  //  alert("Smth went wrong..");
                }
		);
	};
	
	$rootScope.$on('sceneAdded', function(){
		$scope.scenes = [];
		$scope.printScenes();
	});
	
// 	$scope.scenes = Scene;
	$scope.scenes = [];
	
	$scope.data={
		//отображение кнопки удаления по умолчанию
		showDelete: false
	};
	
	$scope.editScene = function(scene){
		//console.log("opened task #" + item.id);
// 		alert("opened item #" + scene.id);
		SharedProps.setCurrScene(scene);
		//$scope.openScene(scene);
		$ionicListDelegate.closeOptionButtons();
		$state.go('sceneEditor');
		
// 		alert("Scene with id " + SharedProps.getCurrScene().id + " is set to curr");
		//var pages = loadPages(id);
	};
	
	$scope.moveScene = function(scene, fromIndex, toIndex) {
		//alert($scope.scenes.join('\n'));
		$scope.scenes.splice(fromIndex, 1);
		$scope.scenes.splice(toIndex, 0, scene);
	};
	
	$scope.deleteScene = function(scene) {
		if (confirm("Вы действительно хотите удалить сценарий '" + 
		scene.name + "' вместе со всем содержимым?")){
			var sceneDeleteQuery = "DELETE from 'scene' WHERE id=" + scene.id;
// 			alert("query for deleting: \n" + query);
			$cordovaSQLite.execute(db, sceneDeleteQuery).then(
				function(){
					var cleanUp
					$scope.scenes.splice($scope.scenes.indexOf(scene), 1);
				}, function(err){
					error(err);
				}
			);
			
		}
	};
	
// 	**prints list of existing scenes**
	$scope.printScenes = function(){ 
		var query = 'SELECT * FROM `scene`';
		$cordovaSQLite.execute(db, query).then(
			function(result){
				if (result.rows.length > 0){
					for (var i = 0; i < result.rows.length; i++){
						//alert(result.rows.item(i).name);
						$scope.scenes.push({
							name: result.rows.item(i).name,
							id: result.rows.item(i).id,
							time:result.rows.item(i).time
						});
					}
				}
				else {
					console.log("No scenes found");
				}
			}, function (err) {
				error(err);
			}
		);
	}
  });

quest.controller("sceneEditCtrl", function($rootScope, $scope, $state, $cordovaSQLite, $ionicListDelegate, SharedProps){
// 	var self = this;
	$scope.pages = [];
	
	$scope.data={
		//отображение кнопки удаления по умолчанию
		showDelete: false
	};
	
	$scope.addNewPage = function(){
		var query = 'SELECT * from `scene-list` WHERE "scene" = ' + $scope.scene.id;
		$cordovaSQLite.execute(db, query).then(
			function(result){
				var maxNum = -1;
				for (var i = 0; i < $scope.pages.length; i++){
					if ($scope.pages[i].num > maxNum)
						maxNum = $scope.pages[i].num;
				}
				var length = result.rows.length;
// 				alert(length + " pages found");
				if (length == 0){
					var maxNum = 0;
				}
				var addNewPageQuery = 'INSERT INTO `scene-list` ("scene", "num") VALUES (' + $scope.scene.id + ', ' + (maxNum+1) +')';
// 					alert(addNewPageQuery);
				$cordovaSQLite.execute(db, addNewPageQuery).then(
					function(){
						$scope.$emit('pageAdded');
						$state.go('sceneEditor');
					}, function(err){
						error(err);
					}
				);					
			
			}, function(err){
				error(err);
			}
		);
	}
	$rootScope.$on('pageAdded', function(){
		$scope.pages = [];
		$scope.openScene();
	});
	
// 	**Event, that updates edited scene info and fires sceneList refresh if
// 		needed**
	$scope.$on('$ionicView.unloaded', function(){
		var checkQuery = 'SELECT * FROM `scene` WHERE "id" = ' + $scope.scene.id;
		$cordovaSQLite.execute(db, checkQuery).then(
			function(result){
				var currName = result.rows.item(0).name;
				var currTime = result.rows.item(0).time;
				var updateSceneInfoQuery = 'UPDATE `scene` SET "name" = "' + $scope.scene.name + '", "time" = "' + $scope.scene.time + '" WHERE "id" = ' + $scope.scene.id;
				if (currName != $scope.scene.name || currTime != $scope.scene.time){
// 					alert("updating current scene... \n query: " + updateSceneInfoQuery);
					$cordovaSQLite.execute(db, updateSceneInfoQuery).then(
						function() {
							alert("scene info updated");
							$rootScope.$emit('sceneAdded');
						},
						function(err){
							error(err);
						}		
					);
				} /*else {
					alert("No need to refresh sceneList");
				}*/
			}
		);
		
		
	});
	
// 	**opens scene details (pages)**
	$scope.openScene = function(){
		$scope.scene = SharedProps.getCurrScene();
// 		alert("curr scene id is " + SharedProps.getCurrScene().id);
// 		alert("curr scene id is " + $scope.scene.id);
		var query = 'SELECT * FROM `scene-list` WHERE scene = ' + $scope.scene.id;
// 		alert("scene list query: \n" + query);
		$cordovaSQLite.execute(db, query).then(
			function(result){
				if (result.rows.length > 0){
// 					alert("selected scene'd have " + result.rows.length + " tasks");
					for (var i = 0; i < result.rows.length; i++){
						$scope.pages.push({
							id: 		result.rows.item(i).id,
							scene: 	result.rows.item(i).scene,
							num: 		result.rows.item(i).num,
							task: 	result.rows.item(i).task
						});
						var taskQuery = 'SELECT * FROM  `tasks` WHERE id = ' + result.rows.item(i).id;
					}
				}
// 				else {alert("Scene #" + result.rows.item(i).id + " has no pages");}
				}, function (err){
					error(err);
				});
// 			$state.go('sceneEditor');
	};
	
	
	
	$scope.deletePage = function(page){
// 		alert("Trying to delete page #" + page.num);
		if(confirm("Вы действительно хотите удалить страницу " + page.num + " вместе со всем содержимым?")){
			var deletePageQuery = 'DELETE from `scene-list` WHERE "scene" = ' + page.scene + ' AND "num" = ' + page.num;
			$cordovaSQLite.execute(db, deletePageQuery).then(
				function(){
					$scope.pages.splice($scope.pages.indexOf(page), 1);
					var updatePagesNumbers = 'UPDATE `scene-list` SET "num" = num - 1 WHERE "num" >' + page.num;
					$cordovaSQLite.execute(db, updatePagesNumbers).then(
						function(){
							$scope.$emit('pageAdded');
						}, function(err){
							error(err);
						}
					);
				}, function(err){
					error(err);
				}
			);
		}
	};
	$scope.editPage = function(page){
// 		alert("Trying to edit page #" + page.num);
		SharedProps.setCurrPage(page);
		$ionicListDelegate.closeOptionButtons();
		$state.go('pageEditor');
// 		alert("Page of id " + SharedProps.getCurrPage.id + " is set to curr");
	};
	$scope.movePage = function(page, fromIndex, toIndex) {
		//alert($scope.scenes.join('\n'));
// 		alert("first num: " + $scope.pages[fromIndex].num + "\n second num: " + $scope.pages[toIndex].num);
		
// 		**we need to swap pages' nums too before splicing them!**
		var updateFirst = 'UPDATE `scene-list` SET "num" = ' + $scope.pages[toIndex].num + ' WHERE "id" = ' + $scope.pages[fromIndex].id;
		var updateSecond = 'UPDATE `scene-list` SET "num" = ' + $scope.pages[fromIndex].num + ' WHERE "id" = ' + $scope.pages[toIndex].id;
		$cordovaSQLite.execute(db, updateFirst).then(
			function(){
				$cordovaSQLite.execute(db, updateSecond).then(
					function(){
						$scope.pages.splice(fromIndex, 1);
						$scope.pages.splice(toIndex, 0, page);
					},
					function(err){error(err);}
				);
			},function(err){
				error(err);
			}
		);
		alert(updateFirst + '\n *** \n' + updateSecond);
// 		
	};
	
});

quest.controller("pageEditCtrl", function($scope, $state, $cordovaSQLite, $ionicModal, $ionicListDelegate, SharedProps){
// 	$scope.page = SharedProps.getCurrPage();
	$scope.task = {
		id: 		'',
		title: 	'',
		content: 	'',
		img: 		''
	};
	
	$scope.questions = [];
	
	$ionicModal.fromTemplateUrl('templates/addNewQuestion.html', function($ionicModal){
		$scope.newQuestion = $ionicModal;
	},{
		scope: $scope,
		animation: 'slide-in-up'
	});
	
	$scope.addNewQuestion = function(){
		$scope.newQuestion.show();
		$scope.question = {
			id: 		'',
			task: 	'',
			number: 	'',
			type: 	'',
			question: 	'',
			answer: 	''
		}
	};
	
	$scope.data={
		//отображение кнопки удаления по умолчанию
		showDelete: false
	};
	
// 	**opens page's details (task)**
	$scope.openPage = function(){
		$scope.page = SharedProps.getCurrPage();
		var taskQuery = 'SELECT * FROM  `tasks` WHERE "id" = "' + $scope.page.task + '"';
		alert("find page contents query: \n" + taskQuery);
		$cordovaSQLite.execute(db, taskQuery).then(
			function(result){
				//alert(1);
				if (result.rows.length > 0){
					$scope.task.id = result.rows.item(0).id;
					$scope.task.title = result.rows.item(0).title;
					$scope.task.content = result.rows.item(0).content;
					$scope.task.img = result.rows.item(0).img;
				} else {alert("Page #" + page.id + " has no tasks on it.");}
			}, function (err) {
				error(err);
			}
		);
	}
	
	$ionicModal.fromTemplateUrl('templates/questionEditor.html', function($ionicModal){
		$scope.newQuestion = $ionicModal;
	},{
		scope: $scope,
		animation: 'slide-in-up'
	});
	
	$scope.addNewQuestion = function(){
		$scope.newQuestion.show();
		$scope.question = {
			id: 		"",
			task: 	"",
			number: 	"",
			type: 	"",
			question: 	""
		}
	};
	
	$scope.closeCreating = function(){
	  $scope.newScene.hide();
	}
	
	$scope.confirmSceneCreate = function(scene){
		var addQuery = 'INSERT INTO `scene` ("name", "time") VALUES ("' + scene.name + '", ' + scene.time +')';
		alert(addQuery);
		$cordovaSQLite.execute(db, addQuery).then(
			function(){
				$scope.$emit('sceneAdded');
				$state.go('adminPanel');
				$scope.newScene.hide();
			},
                function (err) {
                  error(err)
			  //  alert("Smth went wrong..");
                }
		);
	};
	
	$scope.openQuestion = function(){
		var questionQuery = 'SELECT * FROM "questions" WHERE "task" = ' + $scope.task.id;
		$cordovaSQLite.execute(db, questionQuery).then(
			function(result){
				if (result.rows.length > 0){
					for (var i = 0; i = result.rows.length; i++){
						$scope.questions.push({
							id: 		result.rows.item(i).id,
							task: 	result.rows.item(i).task,
							number: 	result.rows.item(i).number,
							type: 	result.rows.item(i).type,
							question: 	result.rows.item(i).question
						});
					}
				}
			}, function(err){
				error(err);
			}
		);
	}
	
	
	$scope.confirmQuestionCreate = function(){
		var query = 'SELECT * from `questions` WHERE "task" = ' + $scope.task.id;
		$cordovaSQLite.execute(db, query).then(
			function(result){
				var maxNum = -1;
				for (var i = 0; i < $scope.questions.length; i++){
					if ($scope.questions[i].number > maxNum)
						maxNum = $scope.questions[i].number;
				}
				var length = result.rows.length;
// 				alert(length + " pages found");
				if (length == 0){
					var maxNum = 0;
				}
				var addNewQuestionQuery = 'INSERT INTO `questions` ("task", "number") VALUES (' + $scope.task.id + ', ' + (maxNum+1) +')';
// 					alert(addNewPageQuery);
				$cordovaSQLite.execute(db, addNewQuestion).then(
					function(){
						$scope.$emit('questionAdded');
						$state.go('pageEditor');
					}, function(err){
						error(err);
					}
				);					
			
			}, function(err){
				error(err);
			}
		);
	}
	
	$scope.editQuestion = function(question){
		SharedProps.setCurrQuestion(question);
		$ionicListDelegate.closeOptionButtons();
		$scope.question = {
			id: 		question.id,
			task: 	question.task,
			number: 	question.number,
			type: 	question.type,
			question: 	question.question,
			answer: 	question.answer
		}
		$scope.newQuestion.show();
	};
	
	$scope.deleteQuestion = function(question){
// 		alert("Trying to delete page #" + page.num);
		if(confirm("Вы действительно хотите удалить вопрос " + question.number)){
			var deleteQuestionQuery = 'DELETE from `questions` WHERE "task" = ' + question.task + ' AND "number" = ' + page.number;
			$cordovaSQLite.execute(db, deleteQuestionQuery).then(
				function(){
					$scope.questions.splice($scope.questions.indexOf(page), 1);
					var updateQuestionsNumbers = 'UPDATE `questions` SET "number" = number - 1 WHERE "number" >' + question.number;
					$cordovaSQLite.execute(db, updateQuestionssNumbers).then(
						function(){
							$scope.$emit('questionAdded');
						}, function(err){
							error(err);
						}
					);
				}, function(err){
					error(err);
				}
			);
		}
	};
	
	$scope.moveQuestions = function(task, fromIndex, toIndex) {
		var updateFirst = 'UPDATE `questions` SET "number" = ' + $scope.questions[toIndex].number + ' WHERE "id" = ' + $scope.questions[fromIndex].id;
		var updateSecond = 'UPDATE `questions` SET "number" = ' + $scope.questions[fromIndex].number + ' WHERE "id" = ' + $scope.questions[toIndex].id;
		$cordovaSQLite.execute(db, updateFirst).then(
			function(){
				$cordovaSQLite.execute(db, updateSecond).then(
					function(){
						$scope.questions.splice(fromIndex, 1);
						$scope.questions.splice(toIndex, 0, page);
					},
					function(err){error(err);}
				);
			},function(err){
				error(err);
			}
		);
		alert(updateFirst + '\n *** \n' + updateSecond);
	};
	
	$scope.$on('questionAdded', function(){
		$scope.questions = [];
		$scope.openPage();
	});
});
	
function formatTime(time) {
	return ((time > 9) ? time : '0' + time);
}

function error(err) {
  alert('error ' + JSON.stringify(err, null, 4));
  console.error(JSON.stringify(err, null, 4));
}

