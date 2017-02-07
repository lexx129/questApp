var db = null,
    sqlplugin = null,
    UTCShift = -(new Date().getTimezoneOffset()) * 60,
    timerStart = false,
    answerChecked = {"correct" : false, "checked" : false};
//     scene = {"name": "", "currentTask": 0, "id": 0, "startTime": 0, "endTime": 0, "task": 0};
    


var quest = angular.module('quest', ['ionic', 'ngCordova']);

quest.run(function($ionicPlatform,  $cordovaSQLite, $state) {
  $ionicPlatform.ready(function() {
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }
    
 /*   $ionicPlatform.registerBackButtonAction(function(event){
		if($state.current.name == "main"){
			$ionicPopup.confirm({
				title: 'Предупреждение',
				template: 'Вы действительно хотите выйти?'
			}).then(function(res){
				if (res){
					$ionicPlatform.exitApp();
				}
			})
		}
	    
	}, 100);*/
    
	
    sqlplugin = $cordovaSQLite;
    db = $cordovaSQLite.openDB({name: "quest.db", location: "default"});
    //getContext();
//    alert('DB successfully opened');
    /*$cordovaSQLite.execute(db, 'CREATE TABLE IF NOT EXISTS tasks (id integer primary key, title varchar, content varchar, img varchar, type integer);');
    alert('Table created');
    $cordovaSQLite.execute(db, 'INSERT INTO tasks (title, content, img) VALUES ("Задание 1", "Небольшой текст", "img/davinci.jpg");');
    alert('Data inserted');*/
  });
})

quest.constant('USER_ROLES', {
	admin: 	'admin_role',
	user: 	'user_role'
});

quest.config(function($stateProvider, $urlRouterProvider, USER_ROLES) {
	$stateProvider
// just some login form
	.state('login', {
		url: 			'/login',
		templateUrl:	'templates/login.html',
		controller: 	'LoginCtrl'
	})
	
// 	From for initial scene choosing
	.state('sceneChooser',{
		url: 			'/sceneChooser',
		templateUrl: 	'templates/sceneChooser.html',
		controller: 	'sceneChooseCtrl'
	})
	
// 	Form for quest-playing
	.state('main', {
		url: 			'/quest',
		templateUrl: 	'templates/main.html',
		controller: 	'QuestCtrl'
	})
	
// 	Just an admin panel :)
	.state('adminPanel', {
		url: 			'/adminPanel',
// 		views: {
// 			'adminPanel@': {
		templateUrl: 	'templates/adminPanel.html',
		controller: 	'AdminCtrl'
 	})
	
	.state('sceneEditor', {
		url: 			'/sceneEditor',
		templateUrl: 	'templates/sceneEditor.html',
		controller: 	'sceneEditCtrl'
	})
	
	.state('pageEditor', {
		url: 			'/pageEditor',
		templateUrl: 	'templates/pageEditor.html',
		controller: 	'pageEditCtrl'
	})
	
	.state('questionEditor', {
		url: 			'/questionEditor',
		templateUrl: 	'templates/questionEditor.html',
		controller: 	'questionEditCtrl'
	})

	
	

/*
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  


  // Each tab has its own nav history stack:

  .state('tab.home', {
    url: '/home',
    views: {
      'tab-home: {
        templateUrl: 'templates/tab-home.html',
        controller: 'HomeCtrl'
      }
    }
  })

  
    .state('tab.questPage', {
      url: '/pages/:pageId',
      views: {
        'tab-pages': {
          templateUrl: 'templates/chat-detail.html',
          controller: 'ChatDetailCtrl'
        }
      }
    })

  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl'
      }
    }
  });*/

  // if none of the above states are matched, use this as the fallback
	$urlRouterProvider.otherwise('/login');
  });


