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
	
	$scope.$on('$ionicView.enter', function(){	
		$scope.getContext();
	});
	
	var deregister = $ionicPlatform.registerBackButtonAction(
		function(e){
			e.preventDefault();
		}, 101
	);
	
	$scope.$on('$destroy', deregister);

	$scope.getContext = function() {
		var query = "SELECT * FROM `active-scene`";
		var promise = $cordovaSQLite.execute(db, query).then(
			function (result) {
				if (result.rows.length > 1) {
					$state.go('sceneChooser');
					return;
				}				
				$scope.scene.startTime = result.rows.item(0).start_time;
				$scope.scene.id = result.rows.item(0).scene;
				$scope.scene.currentTask = result.rows.item(0).current_task;

				if ($scope.scene.currentTask != 0 && !confirm("Продолжить квест?"))
				{
// 					$scope.scene.currentTask = 0;
					
					$state.go('sceneChooser');
					return;
				}
				var query = 'SELECT * FROM `scene` WHERE `id` ="' + $scope.scene.id + '"';
				$cordovaSQLite.execute(db, query).then(
					function (result) {
							if (result.rows.length != 1) {
								alert('Такого сценария нет!');
							return;
						}
						
						$scope.scene.name = result.rows.item(0).name;
						$scope.scene.time = result.rows.item(0).time;
						
						document.getElementById("timer").innerHTML = formatTime($scope.scene.time) + ':00';

						var query = 'SELECT * FROM `scene-list` WHERE scene = "' + $scope.scene.id + '" AND `num` = "' + $scope.scene.currentTask + '"';
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

		if ($scope.scene.currentTask == -1) {
			var msg = '', txt = '';

			var totalTime = Date.parse(new Date()) - (Date.parse($scope.scene.startTime) + UTCShift * 1000);
			
			switch (status) {
				case 'overtime' :
				txt = "Время вышло!";
				msg = '<h1 class="lose">' + txt + '</h1>';
				$('#timer-container').addClass('red');
				break;
				default:
				txt = "Победа!";
				msg = '<h1 class="win">Вы выйграли</h1><h3>Ваше время <div>' + formatTime(Math.floor((totalTime / 1000) / 60)) + ':' + formatTime(Math.floor((totalTime / 1000) % 60)) + '</div></h3>';
			}
			
			timerStart = false;
			clearInterval(timeinterval);


			var query = 'INSERT INTO `scene-stats` ("scene", "time", "status") VALUES (' + $scope.scene.id + ', ' + totalTime + ', "' + txt + '")';

			$cordovaSQLite.execute(db, query).then(
				function () {
				var query = 'DELETE FROM `active-scene`';
				$cordovaSQLite.execute(db, query).then($cordovaSQLite.execute(db, 'VACUUM'));
					$('#timer').text("00:00");
					$('header').css('display','table-row');	
					$('#content').html(msg);	
					$('#question').html('');
					$('footer').html('<div><div class="empty"></div></div>');
				},
				function (err) {
				error(err)
				}
			);
			return;
		}

		if ($scope.scene.currentTask == 0) {
			$('#content').html('<h1>' + $scope.scene.name + '</h1>');
			return;
		}

		timerStart = true;
		$scope.scene.endTime = Date.parse($scope.scene.startTime) + ($scope.scene.time * 60 + UTCShift) * 1000;
/*		alert(new Date().getTimezoneOffset() + 
			"\nStarted time: " + Date.parse($scope.scene.startTime) + 
			"\nTime we got: " + $scope.scene.time +
			"\nendTime: " + $scope.scene.endTime);
*/		
		var query = 'SELECT * FROM `tasks` WHERE id = "' + $scope.scene.task + '"';

		$cordovaSQLite.execute(db, query).then(
		function (result) {
			if (result.rows.length == 0) {
				$scope.scene.currentTask = -1;
				getPage();
				return;
			}
			
			$('header').css('display','none');
			
			$('.content-table').hide(
				function() {
					$('#content').html(
						'<h4>Задание ' + $scope.scene.currentTask + '</h4>' +
						'<h2>' + result.rows.item(0).title + '</h2>' +
						'<div class="image"><img src="' + result.rows.item(0).img + '"/></div>' + 
						'<p>' + result.rows.item(0).content + '</p>'
					);
					
					var query = 'SELECT * FROM `questions` WHERE `task` = ' + $scope.scene.task + ' ORDER BY `number`';
					$cordovaSQLite.execute(db, query).then(
						function (result) {
							$('#question').html("");
							for (var i = 0; i < result.rows.length; i++) {
								$('#question').html($('#question').html() + '<label id="question-' + result.rows.item(i).id + '"><span>' + result.rows.item(i).question +'</span></label>');
								var html = '';
								formatQuestion(result.rows.item(i).id, result.rows.item(i).type);
							}
						},
						function (err) {
							error(err)
						}
					);
					
					$('.content-table').fadeIn();
					
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

				case 3 ://CHECKBOX (unused) 
					var query = 'SELECT * FROM `answers` WHERE `question` = ' + id + ' AND `valid` = "1";';
					var question = {"id": id};
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
					
				case 2 :// SELECT
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
							var html = '<button type="button" class="QR">Сканировать QR код</button><input type="text" id="question-qr" name="question-' + id + '" value="" answer="' + result.rows.item(0).answer + '" style="display: none;"/>';
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
			else {
				$( "#next" ).effect( "shake" );
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
		
		$( ".red" ).removeClass('red');
		$( "[name *= 'question-']" ).each(function( index ) {
			var val = '';
			var id = parseInt($(this).attr('name').replace("question-", ""));
			
			if ($(this).is('[type="text"]') || $(this).is('select')) {
				val = $(this).val().trim();
			}
			else {
				val = $(this).is(":checked") ? 1 : 0;
			}
			
			//alert ('This val: ' + val + ' and ans: ' + $(this).attr("answer"));
			if (val.localeCompare($(this).attr("answer").trim()) != 0)
			{
				//alert('Неверный ответ на вопрос №' + (index + 1));
				if ($(this).attr('id') == 'question-qr') {
					$('.QR').addClass('red');
				}
				$(this).addClass('red');
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
		var minutes = Math.floor(t / 1000 / 60);
		$('#timer').text(formatTime(minutes) + ':' + formatTime(seconds));
	}

	$scope.scanBarcode = function() {
		$cordovaBarcodeScanner.scan().then(
			function (imageData) {
				$('#question-qr').val(imageData.text.trim());
				$('#next').click();
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
		LoginService.loginUser($scope.user.username,
		$scope.user.password).success(function(user) {
						
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
				template: 'Проверьте правильность введенных данных!'
			});
		});
		$scope.user.username = "";
		$scope.user.password = "";
	}
});

quest.controller("AdminCtrl", function ($rootScope, $scope, $state, $ionicPlatform, $ionicModal, $cordovaSQLite, $ionicListDelegate, 
SharedProps) {
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
				if (length == 0){
					var maxNum = 0;
				}
				var createTaskForNewPage = 'INSERT INTO `tasks` ("title", "content") VALUES ("", "")';
					$cordovaSQLite.execute(db, createTaskForNewPage).then(
						function(res){
							var newPageIdQ = 'SELECT * FROM `tasks` WHERE "id" = (SELECT max(id) from `tasks`)';
							$cordovaSQLite.execute(db, newPageIdQ).then(
								function(res){
									var addNewPageQuery = 'INSERT INTO `scene-list` ("scene", "num", "task") VALUES (' + $scope.scene.id + ', ' + (maxNum+1) + ', ' + res.rows.item(0).id + ')';
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
								});
							
						}, function(err){
							error(err);
						});
			}, function(err){
					error(err);
			}
		);
	}; 
	
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
		var query = 'SELECT * FROM `scene-list` WHERE scene = ' + $scope.scene.id;
// 		alert("scene list query: \n" + query);
		$cordovaSQLite.execute(db, query).then(
			function(result){
				if (result.rows.length > 0){
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
// 		alert("Page of id " + SharedProps.getCurrPage().id + " is set to curr");
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
// 		
	};
	
});

quest.controller("pageEditCtrl", function($rootScope, $scope, $state, $cordovaSQLite, $ionicListDelegate, $q, SharedProps, $cordovaImagePicker){
// 	$scope.page = SharedProps.getCurrPage();
	$scope.task = {
		id: 		'',
		title: 	'',
		content: 	'',
		img: 		''
	};
	
	$scope.questions = [];
	$scope.answers = [];
	
	$scope.data={
		//отображение кнопки удаления по умолчанию
		showDelete: false
	};
	
	$scope.loadQuestions = function(){
		var deferred = $q.defer();
		$scope.questions = [];
		var questionQuery = 'SELECT * FROM `questions` WHERE "task" = "' + $scope.task.id + '"';
			$cordovaSQLite.execute(db, questionQuery).then(
				function(result){
		// 						alert(result.rows.length);
					if (result.rows.length > 0){
						for (var i = 0; i < result.rows.length; i++){
		// 								alert(result.rows.item(i).id + ' ' + result.rows.item(i).task + result.rows.item(i).question);
							$scope.questions.push({
								id: 		result.rows.item(i).id,
								task: 	result.rows.item(i).task,
								number: 	result.rows.item(i).number,
								type: 	result.rows.item(i).type,
								question: 	result.rows.item(i).question
							});
						}
					}
// 					alert("question (re)loaded");
					deferred.resolve();
				}, function(err){
					error(err);
				});
			return deferred.promise;
	}
	
// 	**opens page's details (task)**
	$scope.openPage = function(){
		$scope.page = SharedProps.getCurrPage();
	
		var taskQuery = 'SELECT * FROM  `tasks` WHERE "id" = "' + $scope.page.task + '"';
		$cordovaSQLite.execute(db, taskQuery).then(
			function(res){
				//alert(1);
				if (res.rows.length > 0){
					$scope.task.id = res.rows.item(0).id;
					$scope.task.title = res.rows.item(0).title;
					$scope.task.content = res.rows.item(0).content;
					$scope.task.img = res.rows.item(0).img;
				} 
				SharedProps.setCurrTask($scope.task);
// 				alert($scope.task.title + "\n" + $scope.task.content);
// 					alert("task id: " + $scope.task.id);
				var promise = $scope.loadQuestions();				
			}, function (err) {
					error(err);
			}
			
		);
	}	
	
	$scope.addNewQuestion = function(){
		var query = 'SELECT * from `questions` WHERE "task" = "' + $scope.task.id + '"';
		if ($scope.task.id == '')
			alert("Сначала необходимо добавить заголовок и содержимое!");
		else {
		$cordovaSQLite.execute(db, query).then(
			function(result){
				var maxNum = -1;
				for (var i = 0; i < $scope.questions.length; i++){
					if ($scope.questions[i].number > maxNum)
						maxNum = $scope.questions[i].number;
				}
				var length = result.rows.length;
				if (length == 0){
					var maxNum = 0;
				}
				var addNewQuestionQuery = 'INSERT INTO `questions` ("task", "number", "type", "question") VALUES (' + $scope.task.id + ', ' + (maxNum+1) + ',' + 1 + ', "Новый вопрос")';
				alert(addNewQuestionQuery);
				$cordovaSQLite.execute(db, addNewQuestionQuery).then(
					function(res){
						var addAnsForNewQuestionQ = 'INSERT into `answers` ("question", "answer", "valid") VALUES (' + res.insertId + ', "Новый ответ", ' + 1 + ')';
						$cordovaSQLite.execute(db, addAnsForNewQuestionQ).then(
							function(){
								var questionContUpdQ = 'UPDATE `tasks` SET "title" = "' + $scope.task.title + '", "content" = "' + $scope.task.content + '" WHERE "id" = ' + $scope.task.id;
								$cordovaSQLite.execute(db, questionContUpdQ).then(
									function(){
										$scope.$emit('questionAdded');
									},
									function(err){
										error(err);
									}
									
								);
							}, function(error){
								error(err);
							}
						);
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
	
	$scope.editQuestion = function(question){
		var promise = $scope.loadQuestions();
		promise.then(function(){
			for (var i = 0; i < $scope.questions.length; i++){
				if ($scope.questions[i].id == question.id)
					question = $scope.questions[i];
			}
			SharedProps.setCurrQuestion(question);
	// 		alert("going to edit question of type " + question.type);
			$ionicListDelegate.closeOptionButtons();
			$state.go('questionEditor');
		});
	
	};
	
	$scope.deleteQuestion = function(question){
		if(confirm("Вы действительно хотите удалить вопрос " + question.number)){
			var deleteQuestionQuery = 'DELETE from `questions` WHERE "id" = ' + question.id;
			$cordovaSQLite.execute(db, deleteQuestionQuery).then(
				function(){
					$scope.questions.splice($scope.questions.indexOf($scope.page), 1);
					var updateQuestionsNumbers = 'UPDATE `questions` SET "number" = number - 1 WHERE "number" >' + question.number + ' AND "task" = ' + question.task;
					$cordovaSQLite.execute(db, updateQuestionsNumbers).then(
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
	};
	
	$scope.textAreaAdjust = function() {
		var element = document.getElementById("pageCont");
		element.style.height = 'auto';
		element.style.height = (element.scrollHeight) + 'px';
	};
	
	$scope.getImage = function() {       
	// Image picker will load images according to these settings
		var options = {
			maximumImagesCount: 1, // Max number of selected images
			width: 0,
			height: 0,
			quality: 80            // Higher is better
		};
		
		$cordovaImagePicker.getPictures(options).then(function (results) {
				// Loop through acquired images
			for (var i = 0; i < results.length; i++) {
				console.log('Image URI: ' + results[i]);   // Print image URI
				$scope.task.img = results[i];
				
				var updateImgQuery = 'UPDATE `tasks` SET "img" = "' + 
				$scope.task.img + '" WHERE "id" = ' + $scope.task.id;
				$cordovaSQLite.execute(db, updateImgQuery).then(
					function(){
						
					},
					function(err){
						error(err);
					}
					
				);
			}
		}, function(error) {
			error(error);
		});
};  
	
	$scope.$on('questionAdded', function(){
		$scope.questions = [];
		$scope.openPage();
	});
	
	$rootScope.$on('taskEdited', function(){
		$scope.task = [];
		$scope.questions = [];
		$scope.openPage();
	});
	
	$scope.$on('$ionicView.afterEnter', function(){
		$scope.textAreaAdjust();
	});
	
	$scope.$on('$ionicView.unloaded', function(){
		var checkQuery = 'SELECT * FROM `tasks` WHERE "id" = ' + $scope.task.id;
		$cordovaSQLite.execute(db, checkQuery).then(
			function(result){
				var currTitle = result.rows.item(0).title;
				var currContent = result.rows.item(0).content;
				var img = result.rows.item(0).img;
				var updateTaskInfoQuery = 'UPDATE `tasks` SET "title" = "' + $scope.task.title + '", "content" = "' + $scope.task.content + '" WHERE "id" = ' + $scope.task.id;
				if (currTitle != $scope.task.title || currContent != $scope.task.content){
					$cordovaSQLite.execute(db, updateTaskInfoQuery).then(
						function() {
							alert("task info updated");
							$rootScope.$emit('taskEdited');
						},
						function(err){
							error(err);
						}		
					);
				}
			}
		);
		
		
	});
});

quest.controller('questionEditCtrl', function($rootScope, $scope, $state, $cordovaSQLite, $ionicListDelegate, SharedProps){
	
	$scope.answers = [];
	
	$scope.types = [
		{id:  1,
		desc: "Обычное текстовое или числовое поле ввода"},
		{id: 2,
		desc: "Выбор одного правильного ответа"},
		{id: 4,
		desc: "QR-код"}
	];
	$scope.selectedType = $scope.types[0];
	$scope.validAnswer;
	
	$scope.openQuestion = function(){
		$scope.question = SharedProps.getCurrQuestion();
		$scope.page = SharedProps.getCurrPage();
 		if ($scope.question.type == 1)
			$scope.selectedType = $scope.types[0];
		else if ($scope.question.type == 2)
			$scope.selectedType = $scope.types[1];
		else if ($scope.question.type == 4) 
			$scope.selectedType = $scope.types[2];
		//else alert ("Smth went wrong | " + $scope.question.type + " | " + $scope.question.id);
		
		var answerQuery = 'SELECT * FROM `answers` WHERE "question" = ' + $scope.question.id;
		$cordovaSQLite.execute(db, answerQuery).then(
			function(result){
				if(result.rows.length > 0){
					for (var i = 0; i < result.rows.length; i++){
						$scope.answers.push({
							id: result.rows.item(i).id,
							question: result.rows.item(i).question,
							answer: result.rows.item(i).answer,
							valid: result.rows.item(i).valid
						});
						if ($scope.answers[i].valid == 1)
							$scope.validAnswer = $scope.answers[i];
					}
				}
			}, function(err){
				error(err);
			}
		);
	}
	
	$scope.onTypeChange = function(question, selected){
		/*непонятная магия -- scope.selectedType не обновляется через ng-model, передаю как параметр функции*/
		$scope.selectedType = selected;
		//$scope.question.type = selected;
// 		alert("1:" + question.type.id == 1);
// 		alert(question.type.id == '1');
// 		alert(question.type.id == "1");
		var typeUpdateQuery = 'UPDATE `questions` SET "type" = "' + selected.id + '" WHERE "id" = ' + question.id;
		if (selected.id == 2 && question.type != 2){
			$scope.question.type == selected;
			/*хитрый запрос для одновременной вставки двух новых вариантов ответа*/
			var addAnswersQ = 'INSERT into `answers` ("question", "answer", "valid") SELECT "' + question.id + '" as "question", "Вариант 2" as "answer", 0  as "valid" UNION ALL SELECT "' + question.id + '", "Вариант 3", "0"';
			
			$cordovaSQLite.execute(db, addAnswersQ).then(
				function(){},
				function(err){
					error(err);
				}
			);
		}
		if (question.type == 2 && selected.id != 2){
			$scope.question.type == selected;
			var minAnsId = 99999999;
// 			var searchAnsQ = 'SELECT * FROM `answers` WHERE "question" = ' + question.id;
// 			alert(searchAnsQ);
// 			$cordovaSQLite.execute(db, searchAnsQ).then(
// 				function(result){
					for (var i = 0; i < $scope.answers.length; i++) {
// 						alert(result.rows.item(i).id);
						if ($scope.answers[i].id < minAnsId)
							minAnsId = $scope.answers[i].id;
					}
					var setOneValidQ = 'UPDATE `answers` SET "valid" = 1 WHERE "id" = ' + minAnsId;
					$cordovaSQLite.execute(db, setOneValidQ).then(
						function(){
							var clearAnsQ = 'DELETE FROM `answers` WHERE "question" = ' + question.id + ' AND "id" != ' + minAnsId;
							$cordovaSQLite.execute(db, clearAnsQ);
						}
					);
// 				}, function(err){
// 					error(err);
// 				}
// 			);
			
		}
		
		alert(typeUpdateQuery);
		
		$cordovaSQLite.execute(db, typeUpdateQuery).then(
			function(){
				$scope.answers=[];
				question.type = selected.id;
				SharedProps.setCurrQuestion(question);
				$scope.openQuestion();
				$state.reload();
			}, function (err){
				error(err);
			}
		);
	}
	
	$scope.onValidChange = function (question, ans){
		
		for (var i = 0; i < $scope.answers.length; i++){
			if ($scope.answers[i].id == ans.id)
				$scope.answers[i].valid = 1;
			else
				$scope.answers[i].valid = 0;
// 			var updateValidAns = 'UPDATE `answers` SET "valid" = ' + $scope.answers[i].valid + ' WHERE "id" = ' + $scope.answers[i].id;
// 			$cordovaSQLite.execute(db, updateValidAns);
		}
	}
	
	$scope.$on('$ionicView.unloaded', function(){
		var checkAnswersQ = 'SELECT * FROM `questions` WHERE "id" = ' + $scope.question.id;
		$cordovaSQLite.execute(db, checkAnswersQ).then(
			function(result){
// 				var currType = result.rows.item(0).type;
				var currQuestion = result.rows.item(0).question;
				var updateQuestionQ = 'UPDATE `questions` SET "question" = "' + $scope.question.question + '" WHERE "id" = "' + $scope.question.id + '"';
				
				if (currQuestion != $scope.question.question){
					alert ("updating question info: " + updateQuestionQ);
					$cordovaSQLite.execute(db, updateQuestionQ).then(
						function(){
					/*нужно для обновления сути вопроса в форме*/
						//	$scope.answers=[];
// 							SharedProps.setCurrQuestion(question);
						//	$scope.openQuestion();
							$rootScope.$emit("taskEdited");
						//	$state.reload();
						}, function(err){
							error(err);
						}
					);
				}
			}, function(err){
				error(err);
			}
		);
		
		var checkQuestionsQ = 'SELECT * FROM `answers` WHERE "question" = ' + $scope.question.id;
		var updated = false;
		$cordovaSQLite.execute(db, checkQuestionsQ).then(
			function(result){
				for (var i = 0; i < result.rows.length; i++){
					var currId = result.rows.item(i).id;
					var currAnswer = result.rows.item(i).answer;
					var currValid = result.rows.item(i).valid;
					
					var updateAnswersQuery = 'UPDATE `answers` SET "answer" = "' + $scope.answers[i].answer + '", "valid" = "' + $scope.answers[i].valid + '" WHERE "id" = ' + $scope.answers[i].id;
					
					if (currAnswer != $scope.answers[i].answer || currValid != $scope.answers[i].valid){
						$cordovaSQLite.execute(db, updateAnswersQuery).then(
							function() {
								updated = true;
							//	alert("answer(s) were updated");
							},
							function(err){
								error(err);
							}		
						);
					} 
// 					else {
// 						alert("No need to refresh answers");
// 					}
				}
				if (updated)
					alert("answer(s) were updated");
				else 
					alert("No need to refresh answers");
			}
		);
		
	});
});
	
function formatTime(time) {
	return ((time > 9) ? time : '0' + time);
}

function error(err) {
  alert('error ' + JSON.stringify(err, null, 4));
  console.log(JSON.stringify(err, null, 4));
}

