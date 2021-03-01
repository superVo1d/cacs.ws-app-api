const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const time_updatedSchema = new Schema({
	time: {
		type: Number,
		required: false
	}
}, {
	collection: 'time_updated'
});

var Time_updated = mongoose.model('Time_updated', time_updatedSchema);

module.exports = Time_updated;