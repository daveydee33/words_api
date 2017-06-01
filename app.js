'use strict';

var express = require("express");
var app = express();
var routes = require("./routes"); // my routes files
var jsonParser = require("body-parser").json; // json parser
var logger = require("morgan"); // middleware for logging

app.use(logger("dev"));
app.use(jsonParser());

var mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/wordsanddefinitions");

var db = mongoose.connection;

db.on("error", function(err){
  console.error("connection error:", err);
});

db.once("open", function(){
  console.log("db connection successful");
});

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	if(req.method === "OPTIONS") {
		res.header("Access-Control-Allow-Methods", "PUT,POST,DELETE");
		return res.status(200).json({});
	}
	next();
});




// our own router
app.use("/words", routes);

// If request didn't get picked up by our router above, then we haven't created a route for it and we'll mostly likey have a 404.
// catch 404 and forward to error handler
app.use(function(req, res, next){
    var err = new Error("Not found"); // JS default error object
    err.status = 404;
    next(err); // calling next() with a parameter signals to Express that we have an error
});

// Our own custom Error Handler - to override the default Express error handler
app.use(function(err, req, res, next){  // 4 parameters tells Express that this is an Error Handler and not a route.
    res.status(err.status || 500);
    res.json({
        error: {
            //status: err.status,
            message: err.message
        }
    });
});


var port = process.env.PORT || 3000;

app.listen(port, function(){
    console.log("Express server is listening on port", port);
});

