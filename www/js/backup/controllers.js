angular.module('starter.controllers', ['ngCordova'])

  .controller('DashCtrl', function ($scope) {
  })

  .controller('ChatsCtrl', function ($scope, Chats) {
    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    $scope.chats = Chats.all();
    $scope.remove = function (chat) {
      Chats.remove(chat);
    };
  })

  .controller('ChatDetailCtrl', function ($scope, $stateParams, Chats) {
    $scope.chat = Chats.get($stateParams.chatId);
  })

  .controller('AccountCtrl', function ($scope) {
    $scope.settings = {
      enableFriends: true
    };
  })
  /*
   controller('LoginCtrl', function($scope, LoginService, $ionicPopup, $state) {
   $scope.data = {};

   $scope.login = function() {
   LoginService.loginUser($scope.data.username, $scope.data.password).success(function(data) {
   LoginService.isAdmin($scope.data.username, $scope.data.password).success(function(data){
   $state.go('adminPanel');
   }).error(function(data)
   $state


   }).error(function(data) {
   var alertPopup = $ionicPopup.alert({
   title: 'Login failed!',
   template: 'Invalid credentials!'
   });
   });
   }
   })
   */

  .controller("qrCodeCtrl", function ($scope, $cordovaBarcodeScanner) {
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
  })


  .controller("StarterCtrl", function ($scope, $ionicPlatform) {
  })

  .controller("NextCtrl", function ($scope, $cordovaSQLite) {
    $scope.getnextpage = function () {
      if (!checkFirst())
	{
		var check = new Promise((resolve, reject) => {
			//Return true if answer is correct
			function checks(){
				if (checkAnswers())
					resolve("result");
			}
			checks();
		});
		check.then(
			result => {
				getNextTask();
			}
		);
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
              scene.currentTask = result.rows.item(0).current_task;
              scene.startTime = result.rows.item(0).start_time;
              var query = 'SELECT * FROM `scene-list` WHERE scene = "' + scene.id + '" AND `num` = "' + scene.currentTask + '"';
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

  .controller("AdminCtrl", function ($scope) {
    $scope.prefildDB = prefildDB();
  });

function getContext() {
  var query = "SELECT * FROM `active-scene`";
  $cordovaSQLite = sqlplugin;
  $cordovaSQLite.execute(db, query).then(
    function (result) {
      if (result.rows.length != 1) {
        admin();
        return;
      }

      if (!confirm("Продолжить квест?"))
        admin();

      scene.startTime = result.rows.item(0).start_time;
      scene.id = result.rows.item(0).scene;
      scene.currentTask = result.rows.item(0).current_task;

      var query = 'SELECT * FROM `scene` WHERE `id` ="' + scene.id + '"';
      $cordovaSQLite.execute(db, query).then(
        function (result) {
          if (result.rows.length != 1) {
            alert('Scene !exists');
            return;
          }
          scene.name = result.rows.item(0).name;
          scene.time = result.rows.item(0).time;

          document.getElementById("timer").innerHTML = formatTime(parseInt(scene.time / 60)) + ':' + formatTime(parseInt(scene.time % 60)) + ':00';

          var query = 'SELECT * FROM `scene-list` WHERE scene = "' + scene.id + '" AND `num` = "' + scene.currentTask + '"';

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
		alert( "Handler for .change() called." );
	});
}
}

function admin() {
  while (prompt("Введите пароль:", '') != "1") {
    alert('Неверный пароль? Пиши: 1');
  }

  $('h1').html('quest admin pro 2000');

  if (confirm("Очистить ДБ?"))
    prefildDB();
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