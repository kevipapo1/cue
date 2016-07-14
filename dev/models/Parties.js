var mongoose = require('mongoose');

var PartySchema = new mongoose.Schema({
	host: String,
	guests: [String],
  name: String,
  lat: Number,
  lng: Number,
  requests: [{type: mongoose.Schema.Types.ObjectId, ref: 'Request'}]
});

mongoose.model('Party', PartySchema);