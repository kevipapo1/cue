var mongoose = require('mongoose');

var PartySchema = new mongoose.Schema({
	host: String,
	guests: [String],
  name: String,
  lat: Number,
  lng: Number,
  requests: [{type: mongoose.Schema.Types.ObjectId, ref: 'Request'}]
});

/*PartySchema.methods.addGuest = function(username, cb) {
	//if (this.guests.indexOf(String(username)) == -1) {
		this.guests.push(String(username));
	//}
	this.save(cb);
};*/

/*PartySchema.methods.removeGuest = function(username, cb) {
	var i = this.guests.indexOf(String(username));
	if (i != -1) {
		this.guests.splice(i, 1);
	}
	this.save(cb);
};*/

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
}

mongoose.model('Party', PartySchema);