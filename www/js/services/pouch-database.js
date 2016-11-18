(function(angular) {

  var module = angular.module('pockeyt.services.pouch-database', []);

  var PouchDatabaseFactory = [
    '$rootScope',
    '$q',
    function($rootScope, $q) {

    	var database;
    	var userDoc;
    	var _id;

    	var setDatabase = function(databaseName) {
    		database = new PouchDB(databaseName, {adapter: 'websql'});
    	};

    	var getInfo = function() {
    		database.info().then(function(info) {
    			console.log(info);
    		});
    	};

    	var storeData = function(response) {
    		userDoc = {
    			"_id": response.user.email,
    			"first_name": response.user.first_name,
				"last_name": response.user.last_name,
				"userId": response.user.id
    		};
    		console.log(userDoc);

    		return database.allDocs({ include_docs: true}).then(function(docs) {
    			console.log(docs.rows[0].doc._id);
    			_id = (docs.rows[0].doc._id);
    		}).then (function() {
    			console.log(_id);
    			return database.get(_id).then(function(doc) {
    				console.log(doc)
    				return database.remove(doc);
    			}).then(function () {
    				console.log("found old user and adding " + userDoc);
    				return database.put(userDoc);
    			});
    		}).catch(function(err) {
    				console.log(err);
    				console.log(userDoc);
    				return database.put(userDoc);
    			});
    	};

    	var getUserData = function() {
    		return database.allDocs({ 
    			include_docs: true
    		}).then(function(result) {
                console.log(result.rows[0].doc.userId);
                if (angular.isDefined(result.rows[0])) {
                    console.log(result.rows[0].doc.userId);
                    $rootScope.userId = result.rows[0].doc.userId;
                }
    		}).catch(function(err) {
                console.log(err);
    		});
    	};

	    return {
	    	setDatabase: setDatabase,
	    	getInfo: getInfo,
	    	storeData: storeData,
	    	getUserData: getUserData
	    };
    }];
  module.factory('PouchDatabase', PouchDatabaseFactory);
})(angular);