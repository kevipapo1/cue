var mongoose = require('mongoose');
var crypto = require('crypto');

var PartyDataSchema = new mongoose.Schema({
  hash: String,
  salt: String
});

PartyDataSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');

  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

PartyDataSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

  return this.hash === hash;
};

mongoose.model('PartyData', PartyDataSchema, 'partydata');