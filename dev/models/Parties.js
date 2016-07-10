var mongoose = require('mongoose');

var PartySchema = new mongoose.Schema({
	//host: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  name: String,
  lat: Number,
  lng: Number,
  requests: [{type: mongoose.Schema.Types.ObjectId, ref: 'Request'}]
});

mongoose.model('Party', PartySchema);