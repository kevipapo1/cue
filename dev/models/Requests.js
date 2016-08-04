var mongoose = require('mongoose');

var RequestSchema = new mongoose.Schema({
	party: {type: mongoose.Schema.Types.ObjectId, ref: 'Party'},
	requester: String,
  url: String,
  name: String,
  artist: String,
  artwork: String,
  service: Number,
  time: {type: Date, default: Date.now},
  skips: [String],
  played: {type: Boolean, default: false}
});

RequestSchema.methods.skip = function(username, cb) {
  var i = this.skips.indexOf(username);
  if (i < 0) {
    this.skips.push(username);
  }
  else {
    this.skips.splice(i, 1);
  }
  this.save(cb);
};

RequestSchema.methods.setPlayed = function(cb) {
  this.played = true;
  this.save(cb);
};

RequestSchema.statics.toggleSkip = function(username, request, cb) {
  var query = {_id: request._id};
  var i = request.skips.indexOf(username);
  var action;
  if (i < 0) {
    action = {$push: {skips: username}};
  }
  else {
    action = {$pull: {skips: username}};
  }
  return this.findOneAndUpdate(query, action, {safe: true, upsert: true, new: true}, cb);
};

mongoose.model('Request', RequestSchema);