var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');

var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var Request = mongoose.model('Request');
var Party = mongoose.model('Party');
var PartyData = mongoose.model('PartyData');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});


/* GET home page. */
var returnRouter = function(io) {
  router.get('/', function(req, res) {
    res.render('index');
  });

  router.get('/test', function(req, res, next) {
    io.emit('test', "Another string!");
    res.json({message: "Success"});
  });

  /*router.get('/posts', function(req, res, next) {
    Post.find(function(err, posts){
      if(err){ 
        return next(err);
      }

      res.json(posts);
    });
  });

  router.post('/posts', auth, function(req, res, next) {
    var post = new Post(req.body);
    post.author = req.payload.username;

    post.save(function(err, post){
      if(err){ return next(err); }

      res.json(post);
    });
  });

  router.param('post', function(req, res, next, id) {
    var query = Post.findById(id);

    query.exec(function (err, post){
      if (err) { return next(err); }
      if (!post) { return next(new Error("can't find post")); }

      req.post = post;
      return next();
    });
  });

  router.param('comment', function(req, res, next, id) {
    var query = Comment.findById(id);

    query.exec(function (err, comment){
      if (err) { return next(err); }
      if (!comment) { return next(new Error("can't find comment")); }

      req.comment = comment;
      return next();
    });
  });

  router.get('/posts/:post', function(req, res, next) {
    req.post.populate('comments', function(err, post) {
      res.json(post);
    });
  });

  router.put('/posts/:post/upvote', auth, function(req, res, next) {
    req.post.upvote(function(err, post){
      if (err) { return next(err); }

      res.json(post);
    });
  });

  router.put('/posts/:post/downvote', auth, function(req, res, next) {
    req.post.downvote(function(err, post){
      if (err) { return next(err); }

      res.json(post);
    });
  });

  router.post('/posts/:post/comments', auth, function(req, res, next) {
    var comment = new Comment(req.body);
    comment.post = req.post;
    comment.author = req.payload.username;
    
    comment.save(function(err, comment){
      if(err){ return next(err); }

      req.post.comments.push(comment);
      req.post.save(function(err, post) {
        if(err){ return next(err); }

        res.json(comment);
      });
    });
  });

  router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
    req.comment.upvote(function(err, comment){
      if (err) { return next(err); }

      res.json(comment);
    });
  });

  router.put('/posts/:post/comments/:comment/downvote', auth, function(req, res, next) {
    req.comment.downvote(function(err, comment){
      if (err) { return next(err); }

      res.json(comment);
    });
  });*/

  router.post('/register', function(req, res, next){
    if(!req.body.username || !req.body.password){
      return res.status(400).json({message: 'Please fill out all fields'});
    }

    var user = new User();

    user.username = req.body.username;

    user.setPassword(req.body.password)

    user.save(function (err){
      if(err) return next(err); 

      return res.json({
        token: user.generateJWT(),
        isGuest: false
      });
    });
  });

  router.post('/register/guest', function(req, res, next) {
    var user = new User();
    user.username = Math.random().toString(36).substring(2,10);
    user.save(function (err) {
      if (err) return next(err);
      return res.json({
        token: user.generateJWT(),
        isGuest: true
      });
    })
  });

  router.post('/register/claim', auth, function(req, res, next) {
    if(!req.body.username || !req.body.password){
      return res.status(400).json({message: 'Please fill out all fields'});
    }
    var user = new User();
    user.username = req.body.username;
    user.setPassword(req.body.password);
    user.save(function(err) {
      if (err) return next(err);
      var query = {username: req.payload.username};
      User.removeUser(req.payload.username, function(err, data) {
        if (err) return next(err);
        return res.json({
          token: user.generateJWT(),
          isGuest: false
        });
      });
    });
  });

  router.post('/login', function(req, res, next) {
    console.log(req.body);
    if(!req.body.username || !req.body.password) {
      return res.status(400).json({message: 'Please fill out all fields'});
    }
    else if (!req.body.socket) {
      return res.status(400).json({message: 'Socket missing'});
    }

    console.log('calling passport');
    passport.authenticate('user', function(err, user, info){
      if (err) { return next(err); }

      if (user) {
        var action = {$set: {'socket': req.body.socket}};
        User.findByIdAndUpdate(
          user._id,
          action,
          function(err, user) {
            if (err) { return next(err); }
            console.log(user);
            return res.json({
              token: user.generateJWT(),
              isGuest: !user.hash
            });
          }
        );
      }
      else {
        return res.status(401).json(info);
      }
    })(req, res, next);
  });

  /******* Cue routes *******/

  router.get('/parties', function(req, res, next) {
    Party.findByLocation(req.query, function(err, parties) {
      if (err) { return next(err); }
      res.json(parties);
    });
  });

  router.post('/parties', auth, function(req, res, next) {
    console.log(auth);
    var password = req.body.password;
    req.body.password = undefined;
    req.body.host = req.payload.username;
    var party = new Party(req.body);

    function saveParty() {
      party.save(function(err, party) {
        if (err) { return next(err); }
        res.json(party);
      });
    }

    User.isGuest(req.payload.username, function(err, isGuest) {
      console.log(isGuest);
      //if (isGuest) return res.status(400).json({message: 'Guests can\'t create parties'});
      //else {
        if (password) {
          var data = new PartyData({_id: party._id});
          data.setPassword(password);
          data.save(function(err, data) {
            if (err) return next(err);
            party.hasPassword = true;
            return saveParty();
          });
        }
        else {
          party.hasPassword = false;
          return saveParty();
        }
      //}
    });
    
  });

  router.param('party', function(req, res, next, id) {
    var query = Party.findById(id);

    query.exec(function (err, party){
      if (err) { return next(err); }
      if (!party) { return next(new Error("can't find party")); }

      req.party = party;
      return next();
    });
  });

  router.get('/parties/:party', function(req, res, next) {
    req.party.populate('requests', function(err, party) {
      res.json(party);
    });
  });

  router.post('/parties/:party', auth, function(req, res, next) {
    Party.findByLocation(req.body, function(err, parties) {
      // move to static schema method findByIdAndLocation
      var party = null;
      for (var i = 0; i < parties.length && !party; i++) {
        if (String(parties[i]._id) == String(req.party._id)) {
          party = parties[i];
        }
      }
      if (!party) { return res.status(400).json({message: 'Not in range'}); }
      // END move

      function connectToParty() {
        Party.removeGuestFromAll(req.payload.username, function(err, raw) {
          if (err) return next(err);
          Party.addGuest(req.payload.username, req.party, function(err, party) {
            if (err) return next(err);
            res.json(party);
          });
        });
      }

      if (party.hasPassword && party.guests.indexOf(req.payload.username) < 0) {
        req.body.username = String(party._id);
        passport.authenticate('party', function(err, data, info) {
          if (err) { return next(err); }
          if (data) {
            connectToParty();
          }
          else {
            return res.status(401).json(info);
          }
        })(req, res, next);
      }
      else {
        connectToParty();
      }
    });
  });

  router.post('/parties/:party/requests', auth, function(req, res, next) {
    console.log(req.body);
    var request = new Request(req.body);
    request.party = req.party;
    request.requester = req.payload.username;
    
    request.save(function(err, request){
      if(err){ return next(err); }

      Party.addRequest(request, req.party, function(err, party) {
        if(err){ return next(err); }
        io.emit('request', req.party._id);
        res.json(request);
      });
    });
  });

  var getCurrentRequest = function(party) {
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
  }

  router.get('/parties/:party/requests/current', auth, function(req, res, next) {
    req.party.populate('requests', function(err, party) {
      if (err) { return next(err); }
      var currRequest = getCurrentRequest(party);
      res.send(currRequest);
    });
  });

  router.param('request', function(req, res, next, id) {
    var query = Request.findById(id);

    query.exec(function (err, request) {
      if (err) { return next(err); }
      if (!request) { return next(new Error("can't find request")); }

      req.request = request;
      return next();
    });
  })

  router.put('/parties/:party/requests/:request/skip', auth, function(req, res, next) {
    if (req.party.guests.indexOf(req.payload.username) < 0) {
      return res.status(401).json({message: "Unauthorized"});
    }
    else {
      req.party.populate('requests', function(err, party) {
        if (err) { return next(err); }
        var currRequest = getCurrentRequest(party);
        if (String(currRequest._id) != String(req.request._id)) {
          return res.status(400).json({message: "Your request does not match current request"});
        }
        else {
          Request.toggleSkip(req.payload.username, req.request, function(err, request) {
            if (err) { return next(err); }
            io.emit('skip', request);
            res.json(request);
          });
        }
      });
    }
  });

  router.put('/parties/:party/requests/:request/played', auth, function(req, res, next) {
    if (req.party.host == req.payload.username) {
      req.request.setPlayed(function(err, request) {
        if (err) { return next(err); }
        io.emit('played', req.party._id);
        res.json(request);
      }); 
    }
    else {
      return res.status(401).json({message: "Unauthorized"});
    }
  });

  return router;
}

module.exports = returnRouter;