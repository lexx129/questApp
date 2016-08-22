/*function sqliQuery (query) {
  $cordovaSQLite = sqlplugin;
  var result = {
    "error": true
  };
  alert('1');
  $cordovaSQLite.execute(db, query).then(function(res) {
      result = res;
      alert(JSON.stringify(result));
  }, function (err) {
      alert('3');

      console.error(JSON.stringify(err, null, 4));
  });
  //http://stackoverflow.com/questions/32509022/angular-wait-for-promise-in-sqlite-insert
  return result;
}
*/

function prefildDB () {
    $cordovaSQLite = sqlplugin;
    $cordovaSQLite.execute(db, 'DROP TABLE IF EXISTS `tasks`').then(
    $cordovaSQLite.execute(db, 'DROP TABLE IF EXISTS `answers`').then(
    $cordovaSQLite.execute(db, 'DROP TABLE IF EXISTS `questions`').then(
    $cordovaSQLite.execute(db, 'DROP TABLE IF EXISTS `scene`').then(
    $cordovaSQLite.execute(db, 'DROP TABLE IF EXISTS `scene-list`').then(
    $cordovaSQLite.execute(db, 'DROP TABLE IF EXISTS `active-scene`').then(

      $cordovaSQLite.execute(db, 'CREATE TABLE `tasks` (id integer primary key, title varchar, content varchar, img varchar, type integer);').then(
      $cordovaSQLite.execute(db, 'CREATE TABLE `answers` ("id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , "question" INTEGER, "answer" VARCHAR, "valid" INTEGER);').then(
      $cordovaSQLite.execute(db, 'CREATE TABLE `questions` ("id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , "task" INTEGER, "number" INTEGER, "type" INTEGER, "question" VARCHAR);').then(
      $cordovaSQLite.execute(db, 'CREATE TABLE `scene` ("id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , "name" VARCHAR, "time" INTEGER);').then(
      $cordovaSQLite.execute(db, 'CREATE TABLE `scene-list` ("id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , "scene" INTEGER, "num" INTEGER, "task" INTEGER);').then(
      $cordovaSQLite.execute(db, 'CREATE TABLE `active-scene` ("id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , "scene" INTEGER, "current_task" INTEGER, "start_time" Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);').then(
      $cordovaSQLite.execute(db, 'CREATE TABLE IF NOT EXISTS `scene-stats` ("id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, "scene" INTEGER, "status" VARCHAR, "time" INTEGER, "date" Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);').then(

        $cordovaSQLite.execute(db, 'INSERT INTO tasks (title, content, img) VALUES ("Задание 1", "Небольшой текст", "img/davinci.jpg");').then(
        $cordovaSQLite.execute(db, 'INSERT INTO tasks (title, content, img) VALUES ("Задание 2", "Ненебольшой текст", "img/davinci.jpg");').then(
        $cordovaSQLite.execute(db, 'INSERT INTO "scene" VALUES(1,"Пробный",5);').then(
	  $cordovaSQLite.execute(db, 'INSERT INTO "scene" VALUES(2,"Крутой",10);').then(
        $cordovaSQLite.execute(db, 'INSERT INTO "answers" VALUES(1,1,"Ответик", 1);').then(
        $cordovaSQLite.execute(db, 'INSERT INTO "answers" VALUES(2,2,"Вар", 0);').then(
        $cordovaSQLite.execute(db, 'INSERT INTO "answers" VALUES(3,2,"Вар ", 1);').then(
        $cordovaSQLite.execute(db, 'INSERT INTO "answers" VALUES(4,3,"Вар 1", 0);').then(
        $cordovaSQLite.execute(db, 'INSERT INTO "answers" VALUES(5,3,"Вар 2", 1);').then(
        $cordovaSQLite.execute(db, 'INSERT INTO "answers" VALUES(6,3,"Вар 3", 0);').then(
        $cordovaSQLite.execute(db, 'INSERT INTO "questions" VALUES(1,1,1,1,"Вопросик");').then(
        $cordovaSQLite.execute(db, 'INSERT INTO "questions" VALUES(2,1,2,2,"Вопрос 2");').then(
        $cordovaSQLite.execute(db, 'INSERT INTO "questions" VALUES(2,1,2,2,"Вопрос 3");').then(
        $cordovaSQLite.execute(db, 'INSERT INTO "questions" VALUES(3,2,2,3,"Второй вопрос");').then(
        $cordovaSQLite.execute(db, 'INSERT INTO "questions" VALUES(4,2,3,4,"Третий вопрос");').then(
        $cordovaSQLite.execute(db, 'INSERT INTO "scene-list" (scene, num, task) VALUES(1,1,1);').then(
        $cordovaSQLite.execute(db, 'INSERT INTO "scene-list" (scene, num, task) VALUES(1,2,2);').then(
        $cordovaSQLite.execute(db, 'INSERT INTO "tasks" (title, content, img) VALUES ("Первое задание","Современная образовательная парадигма, ратифицируя приоритет           личностной ориентации педагогического процесса, в ходе которого           осуществляется развитие природных задатков, заложенных в каждом индивидууме,           требует переосмысления существующих традиционных форм и           методов общеобязательного образования.","img/davinci.jpg","");').then(
        $cordovaSQLite.execute(db, 'INSERT INTO "active-scene" ("scene", "current_task") VALUES(1, 0);').then(

          alert('Done.')
	)))))))))))))))))
      )))))))
    ))))))));
}


