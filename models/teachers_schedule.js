const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teachers_scheduleSchema = new Schema({
	stid: {
		type: Number,
		required: true
	},
	date: {
		type: String,
		required: true
	},
	time: {
		type: String,
		required: true
	},
	place: {
		type: String,
		required: false
	},
	cycle: {
		type: String,
		required: false
	},
	subject: {
		type: String,
		required: false
	},
	type: {
		type: String,
		required: false
	},
	descr: {
		type: String,
		required: false
	},
	groups: {
		type: String,
		required: true
	},
	teachers: {
		type: String,
		required: true
	},
	teachersid: {
		type: String,
		required: true
	}
}, {
	collection: 'teachers_schedule'
});

var Teachers_schedule = mongoose.model('Teachers_schedule', teachers_scheduleSchema);

module.exports = Teachers_schedule;