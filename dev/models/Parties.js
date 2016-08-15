var mongoose = require('mongoose');
var crypto = require('crypto');

var PartySchema = new mongoose.Schema({
	host: String,
	guests: [String],
  name: String,
  hasPassword: Boolean,
  hash: String,
  salt: String,
  loc: {type: [Number], required: true, index: '2dsphere'},
  requests: [{type: mongoose.Schema.Types.ObjectId, ref: 'Request'}]
});

PartySchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');

  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

PartySchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

  return this.hash === hash;
};

var hidePassword = function(data) {
	var prep = function(party) {
		party.hash = undefined;
		party.salt = undefined;
	}
	if (typeof data == Array) {
		for (var i = 0; i < data.length; i++) {
			prep(data[i]);
		}
	}
	else {
		prep(data);
	}
};

PartySchema.methods.hidePassword = function() {
	hidePassword(this);
};

PartySchema.statics.findByLocation = function(position, cb) {
  var query = {loc: {$geoWithin: { $centerSphere: [[Number(position.lng), Number(position.lat)], 0.1/3963.2] }}};
  this.find(query, function(err, parties) {
  //	if (!err)	hidePassword(parties);
  	cb(err, parties);
  });
};

PartySchema.statics.removeGuestFromAll = function(username, cb) {
  var query = {"guests": username};
  var action = {$pullAll: {"guests": [username]}};
  this.update(query, action, {multi: true}, cb);
};

PartySchema.statics.addGuest = function(username, party, cb) {
  var query = {_id: party._id};
  var action = {$push: {"guests": username}};
  this.update(query, action, {safe: true, upsert: true}, cb);
};

PartySchema.statics.addRequest = function(request, party, cb) {
  var query = {_id: party._id};
  var action = {$push: {"requests": request}};
  this.update(query, action, {safe: true, upsert: true}, cb);
};

mongoose.model('Party', PartySchema);