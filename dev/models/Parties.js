var mongoose = require('mongoose');

var PartySchema = new mongoose.Schema({
	host: String,
	guests: [String],
  name: String,
  loc: {type: [Number], required: true, index: '2dsphere'},
  requests: [{type: mongoose.Schema.Types.ObjectId, ref: 'Request'}]
});

PartySchema.statics.findByLocation = function(position, cb) {
  var query = {loc: {$geoWithin: { $centerSphere: [[Number(position.lng), Number(position.lat)], 0.1/3963.2] }}};
  this.find(query, cb);
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