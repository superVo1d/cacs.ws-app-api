const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
 
const Users = require('../models/users.js')

const userExistsRouter = express.Router()

userExistsRouter.use(bodyParser.json())

userExistsRouter.route('/')
.post((req, res, next) => {

	let id = req.body.cacs_id;
	let role = req.body.status === 's' ? 'student' : 'teacher';

	Users.findOne({
 		'id': id,
 		'role': role
	}).then((user) => {
		res.setHeader('Content-Type', 'application/json');

		if (user) {		
			res.statusCode = 200;
			res.json({
			    "cacs_id": user.id,
			    "last_name": user.name.split(' ')[0],
			    "name": user.name.split(' ')[1],
			    "patronymic": typeof user.name.split(' ')[2] === 'undefined' ? '' : user.name.split(' ')[2],
			    "status": user.role === 'student' ? 's' : 't'
			});
		} else {
			res.statusCode = 404;
			res.send('User not found')
		}

	}, (err) => next(err))
	.catch((err) => {
		next(err);
	});


	// Groups_id.findOne({ group: "fake" })
 //    .then((fake) => {

	// 	Users.findOne({
	// 		'cacs_id': id,
	// 		'status': status
	// 	})
	// 	.then((user) => {

	// 		res.setHeader('Content-Type', 'application/json');

	// 		if (user) {

	// 			if (typeof user.group !== 'undefined') {
	// 				if (user.group.toString() == fake._id.toString()) {
						
	// 					res.statusCode = 404;
	// 					res.send('Fake!')

	// 					return;
	// 				}
	// 			}

	// 			res.statusCode = 200;
	// 			res.json({
	// 			    "cacs_id": user.cacs_id,
	// 			    "last_name": user.last_name,
	// 			    "name": user.name,
	// 			    "patronymic": user.patronymic,
	// 			    "status": user.status,
 //    				"refresh_time": user.refresh_time
	// 			});
	// 		} else {
	// 			res.statusCode = 404;
	// 			res.send('User not found')
	// 		}

	// 	}, (err) => next(err))
	// 	.catch((err) => {
	// 		next(err);
	// 	});

	// }, (err) => next(err))
 //    .catch((err) => {
	// 	next(err);
	// });
});

module.exports = userExistsRouter;
