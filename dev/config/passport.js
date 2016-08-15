var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');

var User = mongoose.model('User');
passport.use('user', new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

var PartyData = mongoose.model('PartyData');
passport.use('party', new LocalStrategy(
  function(id, password, done) {
    PartyData.findOne({ _id: id}, function(err, data) {
      if (err) return done(err);
      if (!data) {
        return done(null, false, {message: "Party doesn't exist"});
      }
      if (!data.validPassword(password)) {
        return done(null, false, {message: 'Incorrect password'});
      }
      return done(null, data);
    });
  }
));