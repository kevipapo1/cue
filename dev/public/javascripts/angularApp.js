var app = angular.module('flapperNews', ['ui.router']);

app.constant('CONST', {
	SVC: {
		SOUNDCLOUD: 0,
		YOUTUBE: 1	
	}
});

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

app.factory('parties', ['$http', 'auth', 'geolocationSvc',
function($http, auth, geolocationSvc) {
	var o = {
		parties : []
	};

	o.getAll = function() {
		return geolocationSvc.getLocation().then(function(position) {
			return $http.get('/parties', {params: position}).success(function(data) {
				angular.copy(data, o.parties);
			});
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
	  }).success(function(data) {
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
		var test = {
			a: 1,
			b: 2,
			c: 3
		};
		return geolocationSvc.getLocation().then(function(position) {
			console.log(position);
			return $http.post('/parties/' + id, position, {
				headers: {Authorization: 'Bearer ' + auth.getToken()}
			}).then(function(res) {
				console.log(res.data);
			});
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
		request: null
	};

	var get = function(party) {
		var deferred = $q.defer();
		var current = {
			request: null
		};
		parties.getCurrentRequest(party).then(function(request) {
			current.request = request;
			deferred.resolve(current);
		});
		return deferred.promise;
	}

	o.update = function(party) {
		return get(party).then(function(current) {
			o.request = current.request;
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
					var pos = {
						lat: position.coords.latitude,
						lng: position.coords.longitude,
						acc: position.coords.accuracy,
						timestamp: position.timestamp
					};
					deferred.resolve(pos);
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
	var o = {

	};

	SC.initialize({
    client_id: '380a8297f1c8b75c7705bfde9bb6f44f'
  });

	o.search = function(query) {
		return SC.get('/tracks', {
		  q: query,
		  limit: 5,
		  linked_partitioning: 1
		}).then(function(response) {
			return response;
		});
	};

	/*o.generateRequest = function(url) {
		return SC.resolve(url).then(function(data) {
			var request = {
				url : url,
				name : data.title,
				artist : data.user.username,
				service : 1
			};
			return request;
		});
	}*/

	return o;
}]);

app.factory('youtubeSvc', [
function() {
	var o = {};

	gapi.load('client', function() {
		gapi.client.load('youtube', 'v3', function() {
			gapi.client.setApiKey('AIzaSyDIRFu77dW_f6zl6H2domiqkMDy7_1KYH8');
		});
	});

	o.search = function(query, cb, token) {
		var options = {
			q: query,
			part: 'snippet',
			type: 'video',
			videoCategoryId: '10',
			maxResults: 5,
		};
		if (token) options.pageToken = token;
		var request = gapi.client.youtube.search.list(options);
		request.execute(cb);
	}

	return o;
}]);

app.factory('musicSvc', ['$q', '$http', 'CONST', 'soundcloudSvc', 'youtubeSvc', 
function($q, $http, CONST, soundcloudSvc, youtubeSvc) {
	var o = {
		query: null,
		nextPage: {
			soundcloud: null,
			youtube: null
		}
	};

	var generateTracks = function(data) {
		var tracks = [];
		for (var i = 0; i < data[0].length; i++) {
			var track = {
				name: data[0][i].title,
				artist: data[0][i].user.username,
				artwork: data[0][i].artwork_url,
				url: data[0][i].id,
				service: CONST.SVC.SOUNDCLOUD
			}
			tracks.push(track);
		}
		for (var i = 0; i < data[1].length; i++) {
			var track = {
				name: data[1][i].snippet.title,
				artist: data[1][i].snippet.channelTitle,
				artwork: data[1][i].snippet.thumbnails.default.url,
				url: data[1][i].id.videoId,
				service: CONST.SVC.YOUTUBE
			}
			tracks.push(track);
		}
		return tracks;
	};

	o.search = function(query) {
		o.query = query;
		var d = $q.defer();
		var deferSC = $q.defer();
		var deferYT = $q.defer();

		soundcloudSvc.search(query).then(function(response) {
			console.log("SC", response);
			o.nextPage.soundcloud = response.next_href;
			deferSC.resolve(response.collection);
		});
		youtubeSvc.search(query, function(response) {
			console.log("YT", response);
			o.nextPage.youtube = response.nextPageToken;
			deferYT.resolve(response.items);
		});

		$q.all([deferSC.promise, deferYT.promise]).then(function(data) {
			var tracks = generateTracks(data);
			d.resolve(tracks);
		});

		return d.promise;
	};

	o.next = function() {
		var d = $q.defer();
		var deferSC = $q.defer();
		var deferYT = $q.defer();

		$http.get(o.nextPage.soundcloud).then(function(response) {
			console.log("SC", response);
			o.nextPage.soundcloud = response.data.next_href;
			deferSC.resolve(response.data.collection);
		});
		youtubeSvc.search(o.query, function(response) {
			console.log("YT", response);
			o.nextPage.youtube = response.nextPageToken;
			deferYT.resolve(response.items);
		}, o.nextPage.youtube);

		$q.all([deferSC.promise, deferYT.promise]).then(function(data) {
			console.log(data);
			var tracks = generateTracks(data);
			d.resolve(tracks);
		});

		return d.promise;
	};

	return o;
}]);

app.factory('playerSvc', ['$q', '$window', '$rootScope', 'CONST', 'parties', 
function($q, $window, $rootScope, CONST, parties) {
	var o = {
		service: null,
		player: null,
		soundcloud: {},
		youtube: {}
	};

	// Load YouTube IFrame API
	var tag = document.createElement('script');
	tag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	$window.onYouTubeIframeAPIReady = function() {
		console.log("YouTube IFrame API ready");
  };

  // Example of event control in IFrame API
  /*var done = false;
  var onPlayerStateChange = function(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
      setTimeout(stopVideo, 6000);
      done = true;
    }
  };
  var stopVideo = function() {
    player.stopVideo();
  };*/

	o.soundcloud.play = function(track) {
		var d = $q.defer();
		SC.get('/tracks/' + track.url).then(function(data) {
			SC.oEmbed(data.permalink_url, { auto_play: true }).then(function(oEmbed) {
				var widget = $(oEmbed.html).attr("id", "widget");
				$("#player").append(widget);
				o.player = SC.Widget("widget").bind(SC.Widget.Events.FINISH, function() {
					$rootScope.$emit('finish');
				});
				d.resolve();
			});
		});
		/*SC.stream('/tracks/' + track.url).then(function(player) {
			o.player = player;
			window['player'] = player;
			o.player.play();
		});*/
		return d.promise;
	};
  o.youtube.play = function(track) {
  	var d = $q.defer();
		o.player = new YT.Player('player', {
      height: '390',
      width: '640',
      videoId: track.url,
      events: {
        'onReady': function(event) {
        	event.target.playVideo();
        	d.resolve()
        },
        'onStateChange': function(event) {
        	if (event.data == YT.PlayerState.ENDED) {
        		$rootScope.$emit('finish');
        	}
        }
      }
    });
    return d.promise;
	};
  o.play = function(track) {
  	var d = $q.defer();
  	o.service = track.service;
  	switch (o.service) {
  		case CONST.SVC.SOUNDCLOUD:
  		o.soundcloud.play(track).then(function() {
  			d.resolve();
  		});
  		break;
  		case CONST.SVC.YOUTUBE:
  		o.youtube.play(track).then(function() {
  			d.resolve();
  		});
  		break;
  	}
  	return d.promise;
  };

  o.playNext = function(party, current, isHost) {
  	o.player = null;
		$("#playerWrapper").empty().append('<div id="player"></div>');
		if (isHost && current.request) {
			parties.setPlayed(party, current.request);
		}
  };

  o.togglePlay = function() {
  	switch (o.service) {
  		case CONST.SVC.SOUNDCLOUD:
  		o.player.toggle();
  		break;
  		case CONST.SVC.YOUTUBE:
  		var state = o.player.getPlayerState();
  		if (state == YT.PlayerState.PLAYING) {
  			o.player.pauseVideo();
  		}
  		else {
  			o.player.playVideo();
  		}
  	}
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
			var lat = position.lat;
			var lng = position.lng;
			parties.create({
				name : $scope.name,
				loc: [lng, lat]
			}).success(function(data) {
				socket.emit('create', auth.getToken());
				$state.go('party', {id: data._id});
			});
			//clear the values
			$scope.name = '';
		});
	};
}]);

app.controller('PartyCtrl', ['$scope', '$rootScope', 'parties', 'party', 'current', 'musicSvc', 'playerSvc', 'auth',
function($scope, $rootScope, parties, party, current, musicSvc, playerSvc, auth) {
	$scope.party = party;
	$scope.current = current;
	$scope.results = [];

	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.isHost = (party.host == auth.currentUser());
	$scope.isPlaying = false;
	$scope.isSkipped = function() {
		if ($scope.current.request)
			return $scope.current.request.skips.indexOf(auth.currentUser()) >= 0;
		else
			return false;
	};

	$scope.addRequest = function(request) {
		parties.addRequest(party._id, request).success(function(request) {
			$scope.party.requests.push(request);
			$scope.current.update(party);
		});
	};
	$scope.skip = function() {
		if ($scope.current.request) {
			parties.skipRequest(party, $scope.current.request);
		}
	};
	$scope.play = function() {
		if ($scope.isHost && $scope.current.request) {
			if (playerSvc.player) {
				playerSvc.togglePlay();
				$scope.isPlaying = !$scope.isPlaying;
			}
			else {
				playerSvc.play($scope.current.request).then(function() {
					$scope.isPlaying = true;
				});
			}
		}
		else {
			$scope.isPlaying = false;
		}
	};
	$scope.playNext = function() {
		playerSvc.playNext(party, $scope.current, $scope.isHost)
	};
	$scope.search = function(query) {
		musicSvc.search(query).then(function(tracks) {
			$scope.results = tracks;
			console.log(tracks);
		});
	};
	$scope.next = function() {
		musicSvc.next().then(function(tracks) {
			$scope.results = $scope.results.concat(tracks);
			console.log(tracks);
		});
	};
	$scope.refresh = function() {
		return parties.get(party._id).then(function(data) {
			$scope.party = data;
		});
	};

	$rootScope.$on('finish', function() {
		$scope.playNext();
	});
	var updateAndPlay = function(partyId) {
		if (partyId == $scope.party._id) {
			$scope.refresh();
			var play = false;
			if (!$scope.current.request) play = true;
			$scope.current.update(party).then(function() {
				if ($scope.isPlaying && !playerSvc.player || play) {
					$scope.play();
				}
			});
		}
	}
	socket.on('request', function(partyId) {
		updateAndPlay(partyId);
	});
	socket.on('played', function(partyId) {
		updateAndPlay(partyId);
	});
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

	$scope.current.update(party);

}]);

app.controller('AuthCtrl', ['$scope', '$state', 'auth',
function($scope, $state, auth) {

	$scope.register = function() {
		auth.register($scope.user).error(function(error) {
			$scope.error = error;
		}).then(function() {
			$state.go('welcome');
		});
	};

	$scope.logIn = function() {
		$scope.user.socket = socket.id;
		console.log($scope.user);
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