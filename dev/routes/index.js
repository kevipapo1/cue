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

  router.get('/posts', function(req, res, next) {
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
  });

  router.post('/register', function(req, res, next){
    if(!req.body.username || !req.body.password){
      return res.status(400).json({message: 'Please fill out all fields'});
    }

    var user = new User();

    user.username = req.body.username;

    user.setPassword(req.body.password)

    user.save(function (err){
      if(err){ return next(err); }

      return res.json({token: user.generateJWT()})
    });
  });

  router.post('/login', function(req, res, next){
    if(!req.body.username || !req.body.password){
      return res.status(400).json({message: 'Please fill out all fields'});
    }

    console.log('calling passport');
    passport.authenticate('local', function(err, user, info){
      if(err){ return next(err); }

      console.log(user);

      if(user){
        return res.json({token: user.generateJWT()});
      } else {
        return res.status(401).json(info);
      }
    })(req, res, next);
  });

  /******* Cue routes *******/

  router.get('/parties', function(req, res, next) {
    Party.find(function(err, parties) {
      if (err) {
        return next(err);
      }
      res.json(parties);
    });
  });

  router.post('/parties', auth, function(req, res, next) {
    var party = new Party(req.body);
    party.host = req.payload.username;
    party.save(function(err, party) {
      if (err) { return next(err); }
      res.json(party);
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
    var query = {"guests": String(req.payload.username)};
    var remove = {"guests": [String(req.payload.username)]};
    Party.update(query, {$pullAll: remove}, {multi: true}, function(err, raw) {
      if (err) return next(err);
      console.log(raw);
      req.party.addGuest(req.payload.username, function(err, party) {
        if (err) return next(err);
        console.log(req.party);
        res.json(party);
      });
    });
  });

  router.post('/parties/:party/requests', auth, function(req, res, next) {
    var request = new Request(req.body);
    request.party = req.party;
    request.requester = req.payload.username;
    
    request.save(function(err, request){
      if(err){ return next(err); }

      req.party.requests.push(request);
      req.party.save(function(err, party) {
        if(err){ return next(err); }

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
  });

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
          //setTimeout(function() {
          var i = req.request.skips.indexOf(req.payload.username);
          var update;
          if (i < 0) {
            update = {$push: {skips: req.payload.username}};
          }
          else {
            update = {$pull: {skips: req.payload.username}};
          }
          Request.findByIdAndUpdate(
            req.request._id,
            update,
            {safe: true, upsert: true},
            function(err, request) {
          //req.request.skip(req.payload.username, function(err, request) {
            if (err) { return next(err); }
            io.emit('skip', request);
            res.json(request);
          });
          //}, 10000); 
        }
      });
    }
  });

  router.put('/parties/:party/requests/:request/played', auth, function(req, res, next) {
    if (req.party.host == req.payload.username) {
      req.request.setPlayed(function(err, request) {
        if (err) { return next(err); }
        io.emit('played', req.party);
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