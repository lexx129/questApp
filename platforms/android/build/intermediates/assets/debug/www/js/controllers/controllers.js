//angular.module('quest').controller(quest.controllers, ['ngCordova'])

quest.controller('QuestCtrl', function ($scope, $ionicPlatform) {
})

// factories for objects with scenes and pages in these scenes
quest.factory('Scene', function(){
	

	return {
		sceneData: []
	};
// 	var scenesService = {
// 		scenes: [];
// 	};
});

quest.factory('pages', function(){
	var pages = {};
	pages.list = [];
	
	pages.add = function(page){
		pages.list.push({
			id: page.id,
			scene: page.scene,
			num: page.num,
			title: page.title,
			content: page.content
		});
	};
	return pages;	
});

quest.controller('LoginCtrl', function($scope, LoginService, $ionicPlatform, $ionicPopup, $state, USER_ROLES){
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
				$state.go('main');
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



quest.controller("qrCodeCtrl", function ($scope, $cordovaBarcodeScanner) {
	$scope.scanBarcode = function () {
		$cordovaBarcodeScanner.scan().then(function (imageData) {
			var respond = imageData.text;
			if (respond == "Правильный ответ")
				alert("Bingo!");
			console.log("Barcode Format -> " + imageData.format);
			console.log("Cancelled -> " + imageData.cancelled);
		}, function (error) {
			console.log("An error happened -> " + error);
		});
	};
});

quest.controller("NextCtrl", function ($scope, $cordovaSQLite) {
	$scope.getnextpage = function () {
		if (!checkFirst()){
			alert("**This page is not first**");
// 		**Promises doesn't work on KitKat**
			var check = checkAnswers();
							
			if (check){
				alert("All answers are correct");
				getNextTask();
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
		$( "[name *= 'question-']" ).each(function( index ) {
			alert(index);
			var val = '';
			var id = parseInt($(this).attr('name').replace("question-", ""));
			
			if ($(this).is('[type="text"]') || $(this).is('select')) {
				val = $(this).val();
				if (val != $(this).attr("answer"))
				{
					ret = false;
					alert('Неверный ответ на вопрос №' + index);
				}
			}
			else {
				val = $(this).is(":checked") ? 1 : 0;
				if (val != parseInt($(this).attr("answer")))
				{
					ret = false;
					alert('Неверный ответ на вопрос №' + index);
				}
			}
		});
		
		return ret;
	}

	//Return true if page is front page of quest
	//Return false otherwise
	//Update active-scene time
	function checkFirst() {
			$cordovaSQLite = sqlplugin;
			if (scene.currentTask == 0) {
				// Update time in `active-scene` if we start the quest
				$cordovaSQLite.execute(db, 'DELETE FROM `active-scene`').then(
				function () {
					//alert("scene id is " + scene.id);
					var query = 'INSERT INTO `active-scene` ("scene", "current_task") VALUES (' + scene.id + ', 0)';
					$cordovaSQLite.execute(db, query).then(
						function () {
							getNextTask();
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
	function getNextTask() {
		$cordovaSQLite = sqlplugin;
		var query = 'UPDATE `active-scene` SET `current_task` = `current_task` + 1';
		$cordovaSQLite.execute(db, query).then(
		function () {
		var query = 'SELECT `current_task`, `start_time` FROM `active-scene`';
		$cordovaSQLite.execute(db, query).then(
			function (result) {
				//alert(result.rows.item(0));
				scene.currentTask = result.rows.item(0).current_task;
				scene.startTime = result.rows.item(0).start_time;
				alert("curr time = " + scene.currentTime);
				var query = 'SELECT * FROM `scene-list` WHERE scene = "' + (scene.id + 1) + '" AND `num` = "' + scene.currentTask + '"';
				//alert("query is " + query);
				$cordovaSQLite.execute(db, query).then(
				function (result) {
					if (result.rows.length == 0) {
						scene.currentTask = -1;//End quest
						getPage();
						return;
					}
					scene.task = result.rows.item(0).task;//Next task of quest
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
			error(err);
		}
		);
	}
})

quest.controller("AdminCtrl", function ($rootScope, $scope, $state, $ionicPlatform, $ionicModal, $cordovaSQLite, $ionicListDelegate, SharedProps) {
// 	button to set DB to default value
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
		//alert("Adding page named '" + scene.name);
		
// 		 var query = 'INSERT INTO `scene-stats` ("scene", "time", "status") VALUES (' + scene.id + ', ' + totalTime + ', "' + msg + '")';
		
		var addQuery = 'INSERT INTO `scene` ("name", "time") VALUES ("' + scene.name + '", ' + scene.time +')';
		alert(addQuery);
		$cordovaSQLite.execute(db, addQuery).then(
			function(){
				$scope.$emit('sceneAdded');
				$state.go('adminPanel');
				$scope.newScene.hide();
// 				$state.go('adminPanel', {}, {reload: true});
// 				$cordovaSQLite.execute(db, 'SELECT * FROM "scene"').then(
// 					function(result){
// 						for (var i = 0; i < result.rows.length; i++){
// 							alert(result.rows.item(i).name);
// 						}
// 					}, function (err) {
// 			                  error(err)
// 						alert("Smth went wrong..");
// 					}
// 				);
				
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
		scene.name + "'?")){
			var query = "DELETE from 'scene' WHERE id=" + scene.id;
			alert("query for deleting: \n" + query);
			$scope.scenes.splice($rootScope.scenes.indexOf(scene), 1);
		}
	};
	
// 	prints list of existing scenes
	$scope.printScenes = function(){ 
		//$scope.scenes = [];
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
// 							alert("name: " + $scope.scenes.name + "\n id: " + $scope.scenes.id);
						//});
				/*		Scene.id = result.rows.item(i).id;
						Scene.name = result.rows.item(i).name;
						alert("scene id: " + Scene.id + "\n scene name: " + Scene.name);
				*/		
					}
// 					alert("num of scenes: " + $scope.scenes.length);
				}
				else {
					console.log("No scenes found");
				}
			}, function (err) {
				error(err);
			}
		);
	}
	
// 	var self = this;
// 	self.pages = pages.list;
	
	//$rootScope.pages = [];
	
	
		
  });

quest.controller("sceneEditCtrl", function($rootScope, $scope, $state, $cordovaSQLite, $ionicListDelegate, SharedProps){
// 	var self = this;
	$scope.pages = [];
	
//	$scope.scenes = Scene;
//	alert($scope.pages.length);
	
	$scope.data={
		//отображение кнопки удаления по умолчанию
		showDelete: false
	};
	
	$scope.addNewScene = function(){
		$scope.sceneModal.show();
		$scope.activeScene = {
			name:"",
			pages:""
		}
		$scope.currSceneId = -1;
	}
	
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
						var page = [];
	// 						alert(result.rows.item(i).name);
						$scope.pages.push({
							scene: result.rows.item(i).scene,
							num: result.rows.item(i).num
						});
						var taskQuery = 'SELECT * FROM  `tasks` WHERE id = ' + result.rows.item(i).id;
					}
				}
				else {alert("Scene #" + result.rows.item(i).id + " has no pages");}
				}, function (err){
					error(err);
				});
// 			$state.go('sceneEditor');
	};
	
	$scope.deletePage = function(page){
		alert("Trying to delete page #" + page.num);
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
		$scope.pages.splice(fromIndex, 1);
		$scope.pages.splice(toIndex, 0, page);
	};
	$scope.addNewPage = function(){
		
	}
});

quest.controller("pageEditCtrl", function($scope, $state, $cordovaSQLite, SharedProps){
// 	$scope.page = SharedProps.getCurrPage();
	$scope.tasks = [];
	
	$scope.data={
		//отображение кнопки удаления по умолчанию
		showDelete: false
	};
	
	$scope.currSceneId = -1;
	
	$scope.addNewPage = function(){
		$scope.sceneModal.show();
		$scope.activeScene = {
			name:"",
			pages:""
		}
		$scope.currSceneId = -1;
	}
// 	**opens page's details (tasks)**
	$scope.openTask = function(){
		$scope.page = SharedProps.getCurrTask();
// 		alert("curr scene id is " + SharedProps.getCurrScene().id);
// 		alert("curr scene id is " + $scope.scene.id);
		var taskQuery = 'SELECT * FROM  `tasks` WHERE id = ' + page.id;
		$cordovaSQLite.execute(db, taskQuery).then(
			function(result){
				if (result.rows.length > 0){
					
					$scope.tasks.push({
						id: result.rows.id,
						title: result.rows.title,
						content: result.rows.content,
						img: result.rows.img
						
					});
				} else {alert("Page #" + page.id + " has no tasks");}
			}, function (err) {
				error(err);
			});
	};
	
	$scope.deleteTask = function(task){
		alert("Trying to delete task #" + task.num);
	};
	$scope.editTask = function(task){
		alert("Trying to edit task #" + task.num);
		SharedProps.setCurrTask(task);
		alert("Task of id " + SharedProps.getCurrTask.id + " is set to curr");
	};
	$scope.moveTask = function(task, fromIndex, toIndex) {
		//alert($scope.scenes.join('\n'));
		$scope.tasks.splice(fromIndex, 1);
		$scope.tasks.splice(toIndex, 0, task);
	};
});


function getContext($state) {
  var query = "SELECT * FROM `active-scene`";
  $cordovaSQLite = sqlplugin;
  var promise = $cordovaSQLite.execute(db, query).then(
    function (result) {
	alert(result.rows);
	alert("Length of query result" + result.rows.length);
      if (result.rows.length != 1) {
       // admin();
        return;
      }

      if (!confirm("Продолжить квест?"))
       // admin();
// 		//$state.go('adminPanel');
		$state.go('login');

      scene.startTime = result.rows.item(0).start_time;
      scene.id = result.rows.item(0).scene;
	alert("active scene id is " + scene.id);
      scene.currentTask = result.rows.item(0).current_task;

      var query = 'SELECT * FROM `scene` WHERE `id` ="' + scene.id + '"';
	alert("query 1 = " + query);
      $cordovaSQLite.execute(db, query).then(
        function (result) {
          if (result.rows.length != 1) {
            alert('Scene !exists');
            return;
          }
          scene.name = result.rows.item(0).name;
          scene.time = result.rows.item(0).time;
		alert("scene name = " + scene.name + "\n scene time = " + scene.time);
          document.getElementById("timer").innerHTML = formatTime(parseInt(scene.time / 60)) + ':' + formatTime(parseInt(scene.time % 60)) + ':00';

          var query = 'SELECT * FROM `scene-list` WHERE scene = "' + scene.id + '" AND `num` = "' + scene.currentTask + '"';
		alert("query 2 = " + query);
          $cordovaSQLite.execute(db, query).then(
            function (result) {
              if (result.rows.length != 0) {
                scene.task = result.rows.item(0).task;
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
      prefildDB();
      error(' db !exists ' + err);
      getContext();
    }
  );
}

function getPage(status) {
  $cordovaSQLite = sqlplugin;
  alert('currentTask ' + scene.currentTask + ' scene.id ' + scene.id);

  if (scene.currentTask == -1) {
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

    var totalTime = Date.parse(new Date()) - Date.parse(scene.startTime);

    var query = 'INSERT INTO `scene-stats` ("scene", "time", "status") VALUES (' + scene.id + ', ' + totalTime + ', "' + msg + '")';

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

  if (scene.currentTask == 0) {
    $('h1').text(scene.name);
    return;
  }

  timerStart = true;
  scene.endTime = Date.parse(scene.startTime) + (scene.time * 60 + UTCShift) * 1000;

  var query = 'SELECT * FROM `tasks` WHERE id = "' + scene.task + '"';

  $cordovaSQLite.execute(db, query).then(
  function (result) {
      if (result.rows.length == 0) {
        error('!exists task ' + scene.task);
        return;
      }
      $('h1').text(result.rows.item(0).title);

      $('#content').text(result.rows.item(0).content);
      var query = 'SELECT * FROM `questions` WHERE `task` = ' + scene.task + ' ORDER BY `number`';
      $cordovaSQLite.execute(db, query).then(
      function (result) {
        $('#question').html("");
        for (var i = 0; i < result.rows.length; i++) {
          var html = '';
          switch (result.rows.item(i).type) {
            case 1 :
		{
              var query = 'SELECT * FROM `answers` WHERE `question` = ' + result.rows.item(i).id + ' AND `valid` = "1";';
              var question = {"id": result.rows.item(i).id, "text": result.rows.item(i).question};
              $cordovaSQLite.execute(db, query).then(
                function (result) {
                  var html = question.text + ' <input type="text" name="question-' + question.id +
			'" value="" answer="' + result.rows.item(0).answer + '" required />';
			formatQuestion(html);
                },
                function (err) {
                  error(err)
                }
              );
              break;// simple text field
            }
		case 2 :
		{
              var query = 'SELECT * FROM `answers` WHERE `question` = ' + result.rows.item(i).id + ' AND `valid` = "1";';
              var question = {"id": result.rows.item(i).id, "text": result.rows.item(i).question};
              $cordovaSQLite.execute(db, query).then(
                function (result) {
			var html = '';
			html = ' <input type="checkbox" name="question-' + question.id +
			'" value="" answer="' + result.rows.item(0).valid + '" required /> ' + question.text;
			formatQuestion(html);
                },
                function (err) {
                  error(err)
                }
              );
              break;// checkboxes
            }
            case 3 :
            {
              var query = 'SELECT * FROM `answers` WHERE `question` = ' + result.rows.item(i).id;
              var question = {"id": result.rows.item(i).id, "text": result.rows.item(i).question};
              $cordovaSQLite.execute(db, query).then(
                function (result) {
                  var html = '',
			answer = '';
                  for (var i = 0; i < result.rows.length; i++) {
                    html += '<option>' + result.rows.item(i).answer + '</option>';
			  if (result.rows.item(i).valid == 1)
				answer = result.rows.item(i).answer;
                  }
                  html = question.text + '<select name="question-' + question.id + '" answer="' + answer + '" required>' + html + '</select>';
                  formatQuestion(html);
                },
                function (err) {
                  error(err)
                }
              );
              break;// SELECT
            }
            case 4 :
            {
              var query = 'SELECT * FROM `answers` WHERE `question` = ' + result.rows.item(i).id + ' AND `valid` = "1";';
              var question = {"id": result.rows.item(i).id, "text": result.rows.item(i).question};
              $cordovaSQLite.execute(db, query).then(
                function (result) {
			var html = '';
			html = '<button type="button" id="QR" name="question-' + question.id + '" answer="' + result.rows.item(0).answer + '" required>Scan QR</button>';
			formatQuestion(html);
                },
                function (err) {
                  error(err)
                }
              );
              break;
            }// QR
          }
        }
      }

      ,
      function (err) {
        error(err)
      }

      )
      ;
    },
    function (err) {
      error(err)
    }
  );

  function formatQuestion(html) {
	html = '<label>' + html + '</label>';
	$('#question').html($('#question').html() + html);
	$("[name *= 'question-']").bind("change", function(){
		//alert( "Handler for .change() called." );
	});
}
}

function admin() {
//   while (prompt("Введите пароль:", '') != "1") {
//     alert('Неверный пароль? Пиши: 1');
//   }

  $('h1').html('quest admin pro 2000');

//   if (confirm("Очистить ДБ?"))
//     prefildDB();
}

function error(err) {
  alert('error ' + JSON.stringify(err, null, 4));
  console.error(JSON.stringify(err, null, 4));
}

function formatTime(time) {
  return ((time > 9) ? time : '0' + time);
}

var timeinterval = setInterval(timer, 1000);

function timer() {
  //var t = Date.parse('July 5 2016 23:00:00 GMT+03:00') - Date.parse(new Date());
  var t = scene.endTime - Date.parse(new Date());
  if (!timerStart)
    return;

  if (t < 0) {
    scene.currentTask = -1;
    getPage('overtime');
    return;
  }
  var seconds = Math.floor((t / 1000) % 60);
  var minutes = Math.floor((t / 1000 / 60) % 60);
  var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
  document.getElementById("timer").innerHTML = formatTime(hours) + ':' + formatTime(minutes) + ':' + formatTime(seconds);
}