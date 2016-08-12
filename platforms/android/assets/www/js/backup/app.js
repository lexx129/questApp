var db = null,
    sqlplugin = null,
    UTCShift = 3*60*60,
    timerStart = false,
    answerChecked = {"correct" : false, "checked" : false},
    scene = {"name": "", "currentTask": 0, "id": 0, "startTime": 0, "endTime": 0, "task": 0};

angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngCordova'])

.run(function($ionicPlatform,  $cordovaSQLite) {
  $ionicPlatform.ready(function() {
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }
    sqlplugin = $cordovaSQLite;
    db = $cordovaSQLite.openDB({name: "quest.db", location: "default"});
    getContext();
//    alert('DB successfully opened');
    /*$cordovaSQLite.execute(db, 'CREATE TABLE IF NOT EXISTS tasks (id integer primary key, title varchar, content varchar, img varchar, type integer);');
    alert('Table created');
    $cordovaSQLite.execute(db, 'INSERT INTO tasks (title, content, img) VALUES ("Задание 1", "Небольшой текст", "img/davinci.jpg");');
    alert('Data inserted');*/
  });
})

.config(function($stateProvider, $urlRouterProvider) {
/*
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // just some login form
    .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  })

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

  .state('adminPanel', {
      url: '/adminPanel',
      views: {
        'adminPanel': {
          templateUrl: 'templates/adminPanel.html',
          controller: 'AdminCtrl'
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
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
*/
});
