var mongoose = require('mongoose');

var PartySchema = new mongoose.Schema({
	host: String,
	guests: [String],
  name: String,
  lat: Number,
  lng: Number,
  requests: [{type: mongoose.Schema.Types.ObjectId, ref: 'Request'}]
});

PartySchema.methods.addGuest = function(username, cb) {
	//if (this.guests.indexOf(String(username)) == -1) {
		this.guests.push(String(username));
	//}
	this.save(cb);
};

/*PartySchema.methods.removeGuest = function(username, cb) {
	var i = this.guests.indexOf(String(username));
	if (i != -1) {
		this.guests.splice(i, 1);
	}
	this.save(cb);
};*/

mongoose.model('Party', PartySchema);