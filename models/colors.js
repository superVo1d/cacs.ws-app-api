const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const colorsSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	course: {
		type: [Number],
		required: false
	},
	color: {
		type: Number,
		required: false
	}	
});

var Colors = mongoose.model('Color', colorsSchema);

module.exports = Colors;