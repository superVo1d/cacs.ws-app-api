const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const Users = require('../models/users.js')
const Teachers_schedule = require('../models/teachers_schedule.js')
const Students_schedule = require('../models/students_schedule.js')
const Time_updated = require('../models/time_updated.js')

const scheduleRouter = express.Router()

scheduleRouter.use(bodyParser.json())

const ObjectId = require('mongodb').ObjectId;

function getWeek(week) {

    let date = new Date();

    let shiftedWeekDate;

    if (halfYear() === 2) {
      //Второй семестр
      shiftedWeekDate = date.getDate() + 7 * (week - getWeekNumber(new Date()));
    } else {
      //Первый семестр
      if (((getWeekNumber(new Date()) > 26) && (week > 26)) || ((getWeekNumber(new Date()) < 26) && (week < 26))) {
        //Если week в этом же году
        shiftedWeekDate = date.getDate() + 7 * (week - getWeekNumber(new Date()));
      } else { 
        //Если недели в разных годах
        //getWeekNumber(new Date()) > 26
        if (getWeekNumber(new Date()) > 26) {
          //week в следующем году.
          shiftedWeekDate = date.getDate() + 7 * ( 53 - week + getWeekNumber(new Date()));
        } else {
          //week в прошлом году.
          shiftedWeekDate = date.getDate() + 7 * ( week - 53 - getWeekNumber(new Date()));
        }
      }
    }

    date.setDate(shiftedWeekDate);

    let days = [];

    for (let i = 1; i <= 7; i++) {

      let dayOfWeek;

      if (date.getDay() === 0) {
        dayOfWeek = 7;
      } else {
        dayOfWeek = date.getDay();
      }
      
      let first = date.getDate() - dayOfWeek + i;
      let day = new Date(date.setDate(first));
      days.push(day);
    }

    return days.map(day => {
    	const monthCorrected = ((day.getMonth() + 1) % 12 + 12) % 12;
    	const month = monthCorrected.toString().length === 1 ? ('0' + monthCorrected) : monthCorrected;
    	const date = day.getDate().toString().length === 1 ? ('0' + day.getDate()) : day.getDate();

    	return day.getFullYear() + '-' + month + '-' + date + 'T00:00:00'
    });
}

function getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    // Return array of year and week number
    return weekNo;
}

const halfYear = () => {
    let date = new Date();

    let month = date.getMonth();

    if (0 < month && month < 8) {
      return 2;
    } else {
      return 1;
    }
}

scheduleRouter.route('/')
.post((req, res, next) => {

	const cacs_id = parseInt(req.body.cacs_id);
	const role = req.body.status === 's' ? 'student' : 'teacher';
	const datesOfWeek = getWeek(req.body.week);

	Users.findOne({
	 	'id': cacs_id,
	 	'role': role
	})
	.then((user) => {

		if (role === 'student') {
			
			Students_schedule.find({
				'stid': cacs_id,
				'date': {$in: datesOfWeek}
			})
			.then((schedule) => {

				const teachers = new Array(schedule.length)
					.fill()
					.map((v, i) => Teachers_schedule.findOne({
						'date': schedule[i].date,
						'time': schedule[i].time,
						'place': schedule[i].place
					}))

				Promise.all(teachers).then((teachers) => {

					const weekSchedule = new Array(schedule.length)
						.fill()
						.map((v, i) => {

							const date = new Date(schedule[i].date);
							const time = schedule[i].time.split('-')[0];

							return {
								'name': schedule[i].subject,
								'short_name': schedule[i].subject,
								'hours': parseInt(time.split(':')[0]),
								'minutes': parseInt(time.split(':')[1]),
								'type': schedule[i].type,
								'day': date.getDate(),
								'month': date.getMonth(),
								'year': date.getFullYear(),
								'place': schedule[i].place,
								'teacher': teachers[i] ? teachers[i].teachersid.split(';').reduce((teachersArray, id, j) => {
									if (id !== '0') {
									    teachersArray.push({
											"cacs_id": parseInt(id),
											"last_name": teachers[i].teachers.split(', ')[j].split(' ')[0],
											"name": teachers[i].teachers.split(', ')[j].split(' ')[1],
											"patronymic": teachers[i].teachers.split(', ')[j].split(' ')[2],
											"status": "t"
									    });
									  }
									  return teachersArray;
								}, []) : []
							}
						})

					Time_updated.findOne()
					.then((timestamp) => {

						res.statusCode = 200;
						res.setHeader('Content-Type', 'application/json');
						res.json({
							'schedule': weekSchedule,
							'refresh_time': timestamp.time
						});

					}, (err) => next(err))
					.catch((err) => {
						next(err);
					});	

				}, (err) => next(err))
				.catch((err) => {
					next(err);
				});
						
			}, (err) => next(err))
			.catch((err) => {
				next(err);
			});

		} else {

			Teachers_schedule.aggregate([
		  		{
		  			$addFields: { 
		  				teachers_array: { $split: ['$teachersid', ';'] },
		  			}
		  		},
		  		{
		  			$match: {
		  				'date': {$in: datesOfWeek},
						'teachers_array': cacs_id.toString()
		  			}
				}
			])
			.then((schedule) => {

				const weekSchedule = new Array(schedule.length)
					.fill()
					.map((v, i) => {

						const date = new Date(schedule[i].date);
						const time = schedule[i].time.split('-')[0];

						return {
							'name': schedule[i].subject,
							'short_name': schedule[i].subject,
							'hours': parseInt(time.split(':')[0]),
							'minutes': parseInt(time.split(':')[1]),
							'type': schedule[i].type,
							'day': date.getDate(),
							'month': date.getMonth(),
							'year': date.getFullYear(),
							'place': schedule[i].place,
							'teacher': schedule[i].teachers_array.reduce((teachersArray, id, j) => {
								if (id !== '0') {
								    teachersArray.push({
										"cacs_id": parseInt(id),
										"last_name": schedule[i].teachers.split(', ')[j].split(' ')[0],
										"name": schedule[i].teachers.split(', ')[j].split(' ')[1],
										"patronymic": schedule[i].teachers.split(', ')[j].split(' ')[2],
										"status": "t"
								    });
								  }
								  return teachersArray;
							}, [])
						}
					})

				Time_updated.findOne()
				.then((timestamp) => {

					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json({
						'schedule': weekSchedule,
						'refresh_time': timestamp.time
					});

				}, (err) => next(err))
				.catch((err) => {
					next(err);
				});	

			}, (err) => next(err))
			.catch((err) => {
				next(err);
			});
		}

	// 	Users_schedule.findOne({'user_id': new ObjectId(user._id)})
	// 	.then((schedule) => {

	// 		Timetable.find({
	// 			'id': {$in: schedule.elec},
	// 			'week': week,
	// 			'group': user.group
	// 		})
	// 		.then((lessons) => {

	// 			const uniqueLessons = [...new Set(
	// 				lessons.map(lesson => {
	// 					return {
	// 						'id': lesson.id,
	// 						'place': lesson.place,
	// 						'type': lesson.type,
	// 						'day': lesson.day,
	// 						'month': lesson.month,
	// 						'year': lesson.year,
	// 						'number': lesson.number,
	// 						'week': lesson.week	
	// 					}
	// 				})					
	// 				.map(JSON.stringify))].map(JSON.parse);

	// 			const events = new Array(uniqueLessons.length)
	// 				.fill()
	// 				.map((v, i) => Lessons_info.findById(uniqueLessons[i].id));

	// 			Promise.all(events).then((events) => {
	// 				const bells = new Array(uniqueLessons.length)
	// 					.fill()
	// 					.map((v, i) => Bell_schedule.findOne({'_id': uniqueLessons[i].number}));

	// 				Promise.all(bells).then((bells) => {

	// 					const teachers = new Array(uniqueLessons.length)
	// 						.fill()
	// 						.map((v, i) => Lessons_info.findById(uniqueLessons[i].id));

	// 					Promise.all(teachers).then((teachers) => {

	// 						const arrayOfTeachers = teachers.map((v, i) => v.teacher)

	// 						teachers = new Array(arrayOfTeachers.length)
	// 							.fill()
	// 							.map((v, i) => arrayOfTeachers[i].map((id, j) => Users.findById(id)));

	// 						Promise.all(teachers.map(promise => Promise.all(promise))).then((teachers) => {

	// 							const colors = new Array(events.length)
	// 								.fill()
	// 								.map((v, i) => Colors.findOne({name: events[i].name}));

	// 							Promise.all(colors).then((colors) => {
									
	// 							 	const weekSchedule = new Array(events.length)
	// 									.fill()
	// 									.map((v, i) => ({
	// 										'name': events[i].name,
	// 										'short_name': events[i].short_name,
	// 										'hours': bells[i].hours,
	// 										'minutes': bells[i].minutes,
	// 										'type': uniqueLessons[i].type,
	// 										'color': colors[i].color,
	// 										'day': uniqueLessons[i].day,
	// 										'month': uniqueLessons[i].month,
	// 										'year': uniqueLessons[i].year,
	// 										'place': uniqueLessons[i].place,
	// 										'teacher': teachers[i].map((teacher) => {
	// 											return {
	// 												"cacs_id": teacher.cacs_id,
 //                    								"last_name": teacher.last_name,
 //                    								"name": teacher.name,
 //                    								"patronymic": teacher.patronymic,
 //                    								"status": teacher.status
 //                    							}
	// 										})
	// 								}));

	// 								res.statusCode = 200;
	// 								res.setHeader('Content-Type', 'application/json');
	// 								res.json({
	// 									'schedule': weekSchedule,
	// 								'refresh_time': user.refresh_time
	// 								});										

	// 							}, (err) => next(err))
	// 							.catch((err) => {
	// 								next(err);
	// 							});	

	// 						}, (err) => next(err))
	// 						.catch((err) => {
	// 							next(err);
	// 						});								
	// 					}, (err) => next(err))
	// 					.catch((err) => {
	// 						next(err);
	// 					});
	// 				}, (err) => next(err))
	// 				.catch((err) => {
	// 					next(err);
	// 				});
	// 			}, (err) => next(err))
	// 			.catch((err) => {
	// 				next(err);
	// 			});
	// 		}, (err) => next(err))
	// 		.catch((err) => {
	// 			next(err);
	// 		});		
	// 	}, (err) => next(err))
	// 	.catch((err) => {
	// 		next(err);
	// 	});

	// 	// res.statusCode = 200;
	// 	// res.setHeader('Content-Type', 'application/json');
	// 	// res.json(user.group);


	// 	/*
	// 	Users_schedule.findOne({'cacs_id': cacs_id})
	// 	.then((schedule) => {

	// 		Timetable.find({
	// 			'id': {$in: schedule.elec},
	// 			'week': week //,
	// 			//'group': user.group
	// 		})
	// 		.then((lessons) => {

	// 			const events = new Array(lessons.length)
	// 				.fill()
	// 				.map((v, i) => Lessons_info.findById(lessons[i].id));
			
	// 			Promise.all(events).then((events) => {
	// 				const bells = new Array(lessons.length)
	// 					.fill()
	// 					.map((v, i) => Bell_schedule.findOne({'_id': lessons[i].number}));
				
	// 				Promise.all(bells).then((bells) => {
	// 					const teachers = new Array(lessons.length)
	// 						.fill()
	// 						.map((v, i) => lessons[i].teacher.split(',')
	// 							.map((id, j) => Users.findOne({'id': id}))
	// 						);

	// 					Promise.all(teachers.map(promise => Promise.all(promise))).then((teachers) => {
	// 						const weekSchedule = new Array(events.length)
	// 							.fill()
	// 							.map((v, i) => ({
	// 								'name': events[i].name,
	// 								'short_name': events[i].short_name,
	// 								'time': bells[i].time,
	// 								'type': events[i].type,
	// 								'color': lessons[i].color,
	// 								'day': lessons[i].day,
	// 								'month': lessons[i].month,
	// 								'place': lessons[i].place,
	// 								'teacher': teachers[i]
	// 							}));

	// 						res.statusCode = 200;
	// 						res.setHeader('Content-Type', 'application/json');
	// 						res.json(weekSchedule);
							
	// 					}, (err) => next(err))
	// 					.catch((err) => {
	// 						next(err);
	// 					});
	// 				}, (err) => next(err))
	// 				.catch((err) => {
	// 					next(err);
	// 				});
	// 			}, (err) => next(err))
	// 			.catch((err) => {
	// 				next(err);
	// 			});
	// 		}, (err) => next(err))
	// 		.catch((err) => {
	// 			next(err);
	// 		});		
	// 	}, (err) => next(err))
	// 	.catch((err) => {
	// 		next(err);
	// 	});
	// 	*/
	}, (err) => next(err))
	.catch((err) => {
		next(err);
	});

});

module.exports = scheduleRouter;
