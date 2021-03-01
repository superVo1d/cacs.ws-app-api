const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const students_scheduleSchema = new Schema({
	stid: {
		type: Number,
		required: true
	},
	student: {
		type: String,
		required: true
	},
	group: {
		type: String,
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
	}
}, {
	collection: 'all_students_schedule'
});

var Students_schedule = mongoose.model('Students_schedule', students_scheduleSchema);

module.exports = Students_schedule;