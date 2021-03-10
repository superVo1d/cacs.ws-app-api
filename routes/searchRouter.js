const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const ObjectId = require('mongodb').ObjectId;

const Users = require('../models/users.js')

const searchRouter = express.Router()

searchRouter.use(bodyParser.json())

searchRouter.route('/')
.post((req, res, next) => {

	let lim = req.body.lim;
	let search = req.body.search;
    let query = new RegExp(`^${search}`, 'i');

	Users.aggregate([
  		{
  			$match: { working_name: {$regex: query}}
  		}
	]).collation({locale: "ru" }).sort({name:'asc'}).limit(lim || 7)
	.then((students) => {

		const results = new Array(students.length)
			.fill()
			.map((v, i) => {
				return {
					"cacs_id": students[i].id,
			    	"name": students[i].working_name,
			    	"status": students[i].role === 'student' ? 's' : 't'
				}
			})

		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.json(results);
	}, (err) => next(err))
	.catch((err) => {
		next(err);
	});
});

module.exports = searchRouter;
