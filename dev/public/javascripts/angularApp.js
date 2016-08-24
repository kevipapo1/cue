var app = angular.module('flapperNews', ['ui.router']);

app.constant('CONST', {
	SVC: {
		SOUNDCLOUD: 0,
		YOUTUBE: 1	
	}
});

app.run(['$rootScope', 'auth', 
function($rootScope, auth) {
	$rootScope.isMobile = (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))return true;else return false;})(navigator.userAgent||navigator.vendor||window.opera);
	console.log($rootScope.isMobile);
	if (!auth.isLoggedIn()) {
		auth.register().then(function() {
			//$state.go('parties');
		});
	}
}]);

app.config(['$stateProvider', '$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

	$stateProvider.state('welcome', {
		url : '/',
		templateUrl : '/welcome.html',
		controller : 'WelcomeCtrl'/*,
		onEnter : ['$state', 'auth',
		function($state, auth) {
			if (auth.isRegistered()) {
				$state.go('parties');
			}
		}]*/

	}).state('login', {
		url : '/login',
		templateUrl : '/login.html',
		controller : 'AuthCtrl',
		onEnter : ['$state', 'auth',
		function($state, auth) {
			if (auth.isRegistered()) {
				$state.go('welcome');
			}
		}]

	}).state('register', {
		url : '/register',
		templateUrl : '/register.html',
		controller : 'AuthCtrl',
		onEnter : ['$state', 'auth',
		function($state, auth) {
			if (auth.isRegistered()) {
				$state.go('welcome');
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
	}).state('create', {
		url : '/parties/create',
		templateUrl : '/create.html',
		controller : 'CreateCtrl',
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

	$urlRouterProvider.otherwise('/');
}]);

app.factory('auth', ['$http', '$window',
function($http, $window) {
	var auth = {};

	auth.saveUser = function(data) {
		$window.localStorage['cue-token'] = data.token;
		$window.localStorage['cue-isGuest'] = data.isGuest;
	};

	auth.getToken = function() {
		return $window.localStorage['cue-token'];
	};

	auth.isLoggedIn = function() {
		var token = auth.getToken();

		if (token) {
			var payload = JSON.parse($window.atob(token.split('.')[1]))
			return payload.exp > Date.now() / 1000;
		}
		else {
			return false;
		}
	};

	auth.isGuest = function() {
		if ($window.localStorage['cue-isGuest']) {
			return JSON.parse($window.localStorage['cue-isGuest']);
		}
		else {
			return false;
		}
	};

	auth.isRegistered = function() {
		return auth.isLoggedIn() && !auth.isGuest();
	};

	auth.currentUser = function() {
		if (auth.isLoggedIn()) {
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};

	auth.register = function(user) {
		console.log(user);
		var url, o;
		if (!user) {
			url = '/register/guest';
		}
		else if (auth.isLoggedIn()) {
			url = '/register/claim';
			o = {headers: {Authorization: 'Bearer ' + auth.getToken()}};
		}
		else {
			url = '/register';
		}
		return $http.post(url, user, o).success(function(data) {
			console.log(data);
			auth.saveUser(data);
		});
	};

	auth.logIn = function(user) {
		return $http.post('/login', user).success(function(data) {
			auth.saveUser(data);
		});
	};

	auth.logOut = function() {
		$window.localStorage.removeItem('cue-token');
		$window.localStorage.removeItem('cue-isGuest');
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
				console.log(data);
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
	//grab a single party from the server
	o.get = function(id) {
		//use the express route to grab this post and return the response
		//from that route, which is a json of the post data
		//.then is a promise, a kind of newly native thing in JS that upon cursory research
		//looks friggin sweet; TODO Learn to use them like a boss.  First, this.
		return $http.get('/parties/' + id).then(function(res) {
			console.log(res.data);
			return res.data;
		});
	};
	o.connect = function(id) {
		return geolocationSvc.getLocation().then(function(data) {
			console.log(data);
			data.password = prompt("Enter the party's password:");
			return $http.post('/parties/' + id, data, {
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



app.controller('WelcomeCtrl', ['$scope', '$state', 'auth',
function($scope, $state, auth) {
	$scope.message = "Welcome to Cue";

	/*$scope.guest = function() {
		auth.register().then(function() {
			$state.go('parties');
		});
	};*/
}]);

app.controller('PartiesCtrl', ['$scope', /*'$state', */'parties', /*'geolocationSvc', */'auth',
function($scope, /*$state,*/ parties, /*geolocationSvc,*/ auth) {
	$scope.parties = parties.parties;
	$scope.isLoggedIn = auth.isLoggedIn;
	//setting title to blank here to prevent empty posts
	//$scope.name = '';
	//$scope.password = '';

	$scope.refresh = function() {
		parties.getAll();
	}

	/*$scope.createParty = function() {
		if ($scope.name === '') {
			return;
		}
		geolocationSvc.getLocation().then(function(position) {
			var lat = position.lat;
			var lng = position.lng;
			parties.create({
				name : $scope.name,
				password: ($scope.password ? $scope.password : null),
				loc: [lng, lat],
			}).success(function(data) {
				socket.emit('create', auth.getToken());
				$state.go('party', {id: data._id});
			});
			//clear the values
			$scope.name = '';
			$scope.password = '';
		});
	};*/
}]);

app.controller('CreateCtrl', ['$scope', '$state', 'parties', 'geolocationSvc', 'auth',
function($scope, $state, parties, geolocationSvc, auth) {
	$scope.parties = parties.parties;
	$scope.isLoggedIn = auth.isLoggedIn;
	//setting title to blank here to prevent empty posts
	$scope.name = '';
	$scope.password = '';

	/*$scope.refresh = function() {
		parties.getAll();
	}*/

	$scope.createParty = function() {
		if ($scope.name === '') {
			return;
		}
		geolocationSvc.getLocation().then(function(position) {
			var lat = position.lat;
			var lng = position.lng;
			parties.create({
				name : $scope.name,
				password: ($scope.password ? $scope.password : null),
				loc: [lng, lat],
			}).success(function(data) {
				socket.emit('create', auth.getToken());
				$state.go('party', {id: data._id});
			});
			//clear the values
			$scope.name = '';
			$scope.password = '';
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
	//$scope.isLoggedIn = auth.isLoggedIn;
	$scope.isGuest = auth.isGuest;
	$scope.isRegistered = auth.isRegistered;
	$scope.currentUser = auth.currentUser;
	$scope.logOut = auth.logOut;

	$scope.numConnections = 0;
	socket.on('connected', function(n) {
		$scope.$apply(function(){
			$scope.numConnections = n;
		});
	});
}]);