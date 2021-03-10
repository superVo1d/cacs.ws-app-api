const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usersSchema = new Schema({
	id: {
		type: Number,
		required: true
	},
	name: {
		type: String,
		required: true
	},
	group: {
		type: String,
		required: false
	},
	working_name: {
		type: String,
		required: true
	},
	role: {
		type: String,
		required: true
	}
});

var Users = mongoose.model('User', usersSchema);

module.exports = Users;