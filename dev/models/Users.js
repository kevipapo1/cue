var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');


var UserSchema = new mongoose.Schema({
  username: {type: String, lowercase: true, unique: true},
  //isGuest: Boolean,
  hash: String,
  salt: String,
  token: String
});

UserSchema.methods.generateJWT = function() {

  // set expiration to 60 days
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign({
    _id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000),
  }, 'SECRET');
};

UserSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');

  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

UserSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

  return this.hash === hash;
};

UserSchema.statics.isGuest = function(username, cb) {
  var query = {username: username};
  this.findOne(query, function(err, user) {
    var isGuest = null;
    if (!err) isGuest = !user.hash;
    cb(err, isGuest);
  });
};

UserSchema.statics.removeUser = function(username, cb) {
  var query = {username: username};
  this.findOneAndRemove(query, cb);
};

mongoose.model('User', UserSchema);