var app = angular.module('flapperNews', ['ui.router']);

app.config(['$stateProvider', '$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

	$stateProvider.state('welcome', {
		url : '/',
		templateUrl : '/welcome.html',
		controller : 'WelcomeCtrl',
		onEnter : ['$state', 'auth',
		function($state, auth) {
			if (auth.isLoggedIn()) {
				$state.go('parties');
			}
		}]

	}).state('login', {
		url : '/login',
		templateUrl : '/login.html',
		controller : 'AuthCtrl',
		onEnter : ['$state', 'auth',
		function($state, auth) {
			if (auth.isLoggedIn()) {
				$state.go('parties');
			}
		}]

	}).state('register', {
		url : '/register',
		templateUrl : '/register.html',
		controller : 'AuthCtrl',
		onEnter : ['$state', 'auth',
		function($state, auth) {
			if (auth.isLoggedIn()) {
				$state.go('parties');
			}
		}]

	}).state('parties', {
		url : '/parties',
		templateUrl : '/parties.html',
		controller : 'PartiesCtrl',
		onEnter : ['$state', 'auth',
		function($state, auth) {
			if (!auth.isLoggedIn()) {
				$state.go('welcome');
			}
		}],
		resolve : {
			postPromise : ['parties',
			function(parties) {
				return parties.getAll();
			}]

		}
	}).state('party', {
		url : '/parties/:id',
		templateUrl : '/party.html',
		controller : 'PartyCtrl',
		onEnter : ['$state', 'auth',
		function($state, auth) {
			if (!auth.isLoggedIn()) {
				$state.go('welcome');
			}
		}],
		resolve : {
			party : ['$stateParams', 'parties', 
			function($stateParams, parties) {
				return parties.connect($stateParams.id).then(function(res) {
					return parties.get($stateParams.id);
				});
			}]
		}
	});

	$urlRouterProvider.otherwise('login');
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
	  return $http.post('/parties', party, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
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
	o.connect = function(id) {
		return $http.post('/parties/' + id, null, {
			headers: {Authorization: 'Bearer ' + auth.getToken()}
		}).then(function(res) {
			console.log(res.data);
		});
	}
	o.getCurrentRequest = function(party) {
		return $http.get('/parties/' + party._id + '/requests/current', {
			headers: {Authorization: 'Bearer ' + auth.getToken()}
		}).then(function(res) {
			console.log(res);
			return res.data;
		});
	};
	//comments, once again using express
	o.addRequest = function(id, request) {
	  return $http.post('/parties/' + id + '/requests', request, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  });
	};
	
	o.skipRequest = function(party, request) {
	  return $http.put('/parties/' + party._id + '/requests/'+ request._id + '/skip', null, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  });
	};

	o.setPlayed = function(party, request) {
		return $http.put('/parties/' + party._id + '/requests/' + request._id + '/played', null, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
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

	var get = function(party) {
		console.log(parties);
		var deferred = $q.defer();
		var current = {
			request: null,
			data: null
		};
		parties.getCurrentRequest(party).then(function(request) {
			current.request = request;
			console.log(request);
			console.log(!request);
			if (!request) {
				current.data = null;
				deferred.resolve(current);
			}
			else {
				SC.resolve(request.url).then(function(data) {
					current.data = data;
					deferred.resolve(current);
				});
			}
		});
		return deferred.promise;
	}

	o.update = function(party) {
		return get(party).then(function(current) {
			o.request = current.request;
			o.data = current.data;
		});
	};

	return o;
}]);

app.factory('geolocationSvc', ['$q', '$window', 
function($q, $window) {
	var o = {
		lat: null,
		lng: null
	};

	o.getLocation = function() {
		var deferred = $q.defer();
		if (!$window.navigator.geolocation) {
			deferred.reject('Geolocation not supported.');
		}
		else {
			$window.navigator.geolocation.getCurrentPosition(
				function(position) {
					deferred.resolve(position);
				}, function(err) {
					deferred.reject(err);
				}
			);
		}
		return deferred.promise;
	}

	return o;
}]);

app.factory('soundcloudSvc', [
function() {
	var o = {};

	SC.initialize({
    client_id: '380a8297f1c8b75c7705bfde9bb6f44f'
  });

	o.search = function(query) {
		return SC.get('/tracks', {
		  q: query
		}).then(function(tracks) {
			return tracks;
		});
	}

	o.generateRequest = function(url) {
		return SC.resolve(url).then(function(data) {
			var request = {
				url : url,
				name : data.title,
				artist : data.user.username,
				service : 1
			};
			return request;
		});
	}

	return o;
}]);



app.controller('WelcomeCtrl', ['$scope', '$state',
function($scope, $state) {
	$scope.message = "Welcome to Cue";
}]);

app.controller('PartiesCtrl', ['$scope', '$state', 'parties', 'geolocationSvc', 'auth',
function($scope, $state, parties, geolocationSvc, auth) {
	$scope.parties = parties.parties;
	$scope.isLoggedIn = auth.isLoggedIn;
	//setting title to blank here to prevent empty posts
	$scope.name = '';

	$scope.refresh = function() {
		parties.getAll();
	}

	$scope.createParty = function() {
		if ($scope.name === '') {
			return;
		}
		geolocationSvc.getLocation().then(function(position) {
			parties.create({
				name : $scope.name,
				lat : position.coords.latitude,
				lng : position.coords.longitude
			}).success(function(data) {
				socket.emit('create', auth.getToken());
				$state.go('party', {id: data._id});
			});
			//clear the values
			$scope.name = '';
		});
	};
}]);

app.controller('PartyCtrl', ['$scope', 'parties', 'party', 'current', 'soundcloudSvc', 'auth',
function($scope, parties, party, current, soundcloudSvc, auth) {
	$scope.party = party;
	$scope.current = current;
	$scope.current.update(party);
	$scope.playing = false;
	$scope.results = [];

	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.isHost = (party.host == auth.currentUser());
	$scope.isSkipped = function() {
		if ($scope.current.request)
			return $scope.current.request.skips.indexOf(auth.currentUser()) >= 0;
		else
			return false;
	};

	$scope.addRequest = function(url) {
		soundcloudSvc.generateRequest(url).then(function(request) {
			parties.addRequest(party._id, request).success(function(request) {
				$scope.party.requests.push(request);
				$scope.current.update(party);
			});
		});
	};
	$scope.skip = function() {
		if ($scope.current.request) {
			parties.skipRequest(party, $scope.current.request);
		}
	};
	$scope.play = function() {
		if ($scope.isHost && $scope.current.request) {
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
		else {
			$scope.playing = false;
		}
	}
	$scope.playNext = function() {
		console.log("playNext");
		$("#player").empty();
		if ($scope.isHost && $scope.current.request) {
			parties.setPlayed(party, $scope.current.request);	
		}
	}

	$scope.search = function(query) {
		soundcloudSvc.search(query).then(function(tracks) {
			$scope.$apply(function() {
				$scope.results = tracks;
			});
		});
	}

	$scope.refresh = function() {
		return parties.get(party._id).then(function(data) {
			$scope.party = data;
		});
	}

	socket.on('skip', function(data) {
		if (data._id == $scope.current.request._id) {
			$scope.$apply(function() {
				$scope.current.request.skips = data.skips;
			});
			if ($scope.current.request.skips.length >= 2) {
				$scope.playNext();
			}
		}
	});

	socket.on('played', function(party) {
		if (party._id == $scope.party._id) {
			$scope.refresh();
			$scope.current.update(party).then(function() {
				if ($scope.playing) {
					$scope.play();
				}
			});
		}
	})

}]);

app.controller('AuthCtrl', ['$scope', '$state', 'auth',
function($scope, $state, auth) {
	$scope.user = {};

	$scope.register = function() {
		auth.register($scope.user).error(function(error) {
			$scope.error = error;
		}).then(function() {
			$state.go('welcome');
		});
	};

	$scope.logIn = function() {
		auth.logIn($scope.user).error(function(error) {
			$scope.error = error;
		}).then(function() {
			$state.go('welcome');
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
	});
}]);