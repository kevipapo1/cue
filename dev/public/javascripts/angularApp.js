var app = angular.module('flapperNews', ['ui.router']);

app.config(['$stateProvider', '$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

	$stateProvider.state('cue', {
		url : '/cue',
		templateUrl : '/cue.html',
		controller : 'CueCtrl',
		resolve : {
			postPromise : ['parties',
			function(parties) {
				return parties.getAll();
			}]

		}
	}).state('parties', {
		url : '/parties/:id',
		templateUrl : '/parties.html',
		controller : 'PartiesCtrl',
		resolve : {
			party : ['$stateParams', 'parties', 
			function($stateParams, parties) {
				return parties.get($stateParams.id);
			}]
		}
	}).state('login', {
		url : '/login',
		templateUrl : '/login.html',
		controller : 'AuthCtrl',
		onEnter : ['$state', 'auth',
		function($state, auth) {
			if (auth.isLoggedIn()) {
				$state.go('cue');
			}
		}]

	}).state('register', {
		url : '/register',
		templateUrl : '/register.html',
		controller : 'AuthCtrl',
		onEnter : ['$state', 'auth',
		function($state, auth) {
			if (auth.isLoggedIn()) {
				$state.go('cue');
			}
		}]

	});

	$urlRouterProvider.otherwise('cue');
}]);

app.factory('auth', ['$http', '$window',
function($http, $window) {
	var auth = {};

	auth.saveToken = function(token) {
		$window.localStorage['flapper-news-token'] = token;
	};

	auth.getToken = function() {
		return $window.localStorage['flapper-news-token'];
	}

	auth.isLoggedIn = function() {
		var token = auth.getToken();

		if (token) {
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	auth.currentUser = function() {
		if (auth.isLoggedIn()) {
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};

	auth.register = function(user) {
		return $http.post('/register', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};

	auth.logIn = function(user) {
		return $http.post('/login', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};

	auth.logOut = function() {
		$window.localStorage.removeItem('flapper-news-token');
	};

	return auth;
}]);

app.factory('parties', ['$http', 'auth',
function($http, auth) {
	var o = {
		parties : []
	};

	o.getAll = function() {
		return $http.get('/parties').success(function(data) {
			angular.copy(data, o.parties);
		});
	};
	//now we'll need to create new posts
	//uses the router.post in index.js to post a new Post mongoose model to mongodb
	//when $http gets a success back, it adds this post to the posts object in
	//this local factory, so the mongodb and angular data is the same
	//sweet!
	o.create = function(party) {
	  return $http.post('/parties', party/*, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  }*/).success(function(data){
	    o.parties.push(data);
	  });
	};
	//grab a single post from the server
	o.get = function(id) {
		//use the express route to grab this post and return the response
		//from that route, which is a json of the post data
		//.then is a promise, a kind of newly native thing in JS that upon cursory research
		//looks friggin sweet; TODO Learn to use them like a boss.  First, this.
		return $http.get('/parties/' + id).then(function(res) {
			return res.data;
		});
	};
	o.getCurrentRequest = function(party) {
		var currRequest = null;
		var currDate = null;
		for (var i = 0; i < party.requests.length; i++) {
			var request = party.requests[i];
			if (!request.played) {
				date = Date.parse(request.time);
				if (!currRequest || date < currDate) {
					currRequest = request;
					currDate = date;
				}
			}
		}
		return currRequest;
	};
	//comments, once again using express
	o.addRequest = function(id, request) {
	  return $http.post('/parties/' + id + '/requests', request/*, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  }*/);
	};
	
	o.skipRequest = function(party, request) {
	  return $http.put('/parties/' + party._id + '/requests/'+ request._id + '/skip', null/*, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  }*/).success(function(data){
	    request.skips += 1;
	  });
	};

	o.setPlayed = function(party, request) {
		return $http.put('/parties/' + party._id + '/requests/' + request._id + '/played', null/*, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  }*/).success(function(data){
	    request.played = true;
	  });
	};

	return o;
}]);

app.factory('current', ['$q', 'parties',
function($q, parties) {
	var o = {
		request: null,
		data: null
	};

	o.get = function(party) {
		var deferred = $q.defer();
		var current = {
			request: null,
			data: null
		};
		current.request = parties.getCurrentRequest(party);
		if (!current.request) {
			current.data = null;
			deferred.resolve(current);
		}
		else {
			SC.resolve(current.request.url).then(function(data) {
				current.data = data;
				deferred.resolve(current);
			});
		}
		return deferred.promise;
	};

	o.update = function(party) {
		var get = function(party) {
			var deferred = $q.defer();
			var current = {
				request: null,
				data: null
			};
			current.request = parties.getCurrentRequest(party);
			if (!current.request) {
				current.data = null;
				deferred.resolve(current);
			}
			else {
				SC.resolve(current.request.url).then(function(data) {
					current.data = data;
					deferred.resolve(current);
				});
			}
			return deferred.promise;
		}
		get(party).then(function(current) {
			o.request = current.request;
			o.data = current.data;
		})
	};

	return o;
}]);



app.controller('CueCtrl', ['$scope', 'parties', 'auth',
function($scope, parties, auth) {
	$scope.parties = parties.parties;
	$scope.isLoggedIn = auth.isLoggedIn;
	//setting title to blank here to prevent empty posts
	$scope.name = '';

	$scope.createParty = function() {
		if ($scope.name === '') {
			return;
		}
		parties.create({
			name : $scope.name,
			lat : $scope.lat,
			lng : $scope.lng
		});
		//clear the values
		$scope.name = '';
		$scope.lat = '';
		$scope.lng = '';
	};
}]);

app.controller('PartiesCtrl', ['$scope', 'parties', 'party', 'current', 'auth',
function($scope, parties, party, current, auth) {
	$scope.party = party;
	$scope.current = current;
	$scope.current.update(party);
	$scope.playing = false;
	$scope.isLoggedIn = auth.isLoggedIn;

	$scope.addRequest = function() {
		var name, artist;
		SC.resolve($scope.url).then(function(data) {
			name = data.title;
			artist = data.user.username;
			parties.addRequest(party._id, {
				url : $scope.url,
				name : name,
				artist : artist,
				service : $scope.service,
			}).success(function(request) {
				$scope.party.requests.push(request);
					current.get(party).then(function(current) {
						$scope.current = current;
						console.log($scope.current);
					});
			});
		});
	};
	$scope.skip = function(request) {
		parties.skipRequest(party, request);
	};
	$scope.play = function() {
		if (!$scope.current.request) {
			$scope.playing = false;
			return;
		}
		$scope.playing = true;
		var track_url = $scope.current.request.url;
		SC.oEmbed(track_url, { auto_play: true }).then(function(oEmbed) {
			var widget = $(oEmbed.html).attr("id", "widget");
			$("#player").append(widget);
			SC.Widget("widget").bind(SC.Widget.Events.FINISH, function() {
				$scope.playNext();
			});
		});
	}
	$scope.playNext = function() {
		$("#player").empty();
		parties.setPlayed(party, $scope.current.request).success(function() {
			parties.get(party._id).then(function(party) {
				$scope.party = party;
				current.get(party).then(function(current) {
					$scope.current = current;
					console.log($scope.current);
					if ($scope.playing) $scope.play();
				});
			});
		});
	}
	$scope.pause = function() {

	}

}]);

app.controller('AuthCtrl', ['$scope', '$state', 'auth',
function($scope, $state, auth) {
	$scope.user = {};

	$scope.register = function() {
		auth.register($scope.user).error(function(error) {
			$scope.error = error;
		}).then(function() {
			$state.go('home');
		});
	};

	$scope.logIn = function() {
		auth.logIn($scope.user).error(function(error) {
			$scope.error = error;
		}).then(function() {
			$state.go('home');
		});
	};
}]);

app.controller('NavCtrl', ['$scope', 'auth',
function($scope, auth) {
	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.currentUser = auth.currentUser;
	$scope.logOut = auth.logOut;

	$scope.numConnections = 0;
	socket.on('connected', function(n) {
		$scope.$apply(function(){
			$scope.numConnections = n;
		});
		console.log($scope.numConnections);
	});
}]);