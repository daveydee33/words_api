# Notes

[Mongoose documentation: Models](http://mongoosejs.com/docs/models.html)
* Models are fancy constructors compiled from our `Schema` definitions.
* Instances of these models represent `documents` which can be saved and retrieved from our database.  All document creation and retrieval from the database is handled by these models.

# To run the app

## Start MongoDB first (start the mongo daemon)
Don't forget we need to have MongoDB running first.  In a separate terminal tab, start MongoDB.  On my personal laptop, I put the MongoDB directory here, though we don't need to specify if it's already in the default location of `/data/db`.

```bash
mongod --dbpath /Dropbox/Dropbox/Projects/mongodb_shared_db_dir/data/db/
```

If MongoDB isn't running, we'll get an error like this:
```
{ Error: connect ECONNREFUSED 127.0.0.1:27017
    at Object.exports._errnoException (util.js:1007:11)
    at exports._exceptionWithHostPort (util.js:1030:20)
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1080:14)
  name: 'MongoError',
  message: 'connect ECONNREFUSED 127.0.0.1:27017' }
```

### MongoDB commands

Start the MongoDB shell in another tab
```bash
mongo
```

MongoDB commands
```
use wordsanddefinitions
db.words.drop()
quit()
```

## Testing with Postman
I currently have this running as follows:

* Hostname: localhost (or check `app.js` file)
* Port: 3000
* MongoDB on port: 27107
* MongoDB database name:  wordsanddefinitions

To access the API - the base URL is:
* http://localhost:3000/words

example: GET http://localhost:3000/words



**Observations**
* The most votes should be at the top
* If same number of votes, the most recent updated should be at the top

### List all Words
```
GET /words
```

### Create a Word
```
POST
/words

Content-Type: application/json

{
	"text": "one"
}
```

### Get a specific word
```
GET 
/words/592fceee98cdbd3b612bb7d1
```

### Add a definition to the word
```
POST
/words/592fceee98cdbd3b612bb7d1/definitions

Content-Type: application/json

{
	"text": "the first number"
}
```

### Vote on a definition
```
POST

/words/592fceee98cdbd3b612bb7d1/definitions/592fd02198cdbd3b612bb7d2/vote-up

Content-Type: application/json
```



# 1
```javascript
'use strict';

var express = require("express");
var app = express();

// middleware A
app.use(function(req, res, next){
    console.log();
    console.log("First piece of middleware");
    console.log("Query String:", req.query.color); // if we pass it like:  http://localhost/?color=red
    req.myMsg = "Dave";
    next();
});

// middleware B
app.use("/other/:id", function(req, res, next){
    console.log("Second piece of middleware - ID:", req.params.id);
    console.log("Received message:", req.myMsg);
    next();
});

var port = process.env.PORT || 3000;

app.listen(port, function(){
    console.log("Express server is listening on port", port);
});
```

If I access with: localhost:3000/other/one/?color=red

```

First piece of middleware
Query String: red
Second piece of middleware - ID: one
Received message: Dave
```

* request will hit all middlewares that it applies to
* can pass data to further middle wares by adding object properties to the `req` object.
* eg) req.myMsg = "Dave";
* can access query paramenters like: req.query.color (and will have the value that was passed in the URL like `?color=red`)
* can access values from the url like `/user/:id` with `req.params.id`


# Receiving and parsing JSON in the API

Install the `body-parser` module.

`npm install --save body-parser@~1.15`

> the `~` will install with latest patch release

Add the `body-parser` to the project.  Specifcally, the *json* parser.  
`app.use(jsonParser());`

This function adds middleware that we can add to our route.
`var jsonParser = require("body-parser.json").json`

```javascript
'use strict';

var express = require("express");
var app = express();
var jsonParser = require("body-parser").json;

var jsonCheck = function(req, res, next){
    if (req.body) {
        console.log("The sky is", req.body.color);
    } else {
        console.log("No body property on the request.");
    }
    next();
}

app.use(jsonCheck); // the function we defined
// -> No body property on the request

app.use(jsonParser()); // the one we imported
app.use(jsonCheck); // the function we defined
// -> The sky is ... (or undefined)

var port = process.env.PORT || 3000;

app.listen(port, function(){
    console.log("Express server is listening on port", port);
});
```

* before we use the `body-parser` module that we imported (and named a `jsonParser` variable for) - we're unable to parse the JSON data.
* after we use the json parser, we can parse and get the values



# Creating our own router file, and handling GET and POST

## `app.js`
```javascript 
'use strict';

var express = require("express");
var app = express();
var routes = require("./routes"); // my routes files
var jsonParser = require("body-parser").json; // json parser

app.use(jsonParser());

app.use("/words", routes);

var port = process.env.PORT || 3000;

app.listen(port, function(){
    console.log("Express server is listening on port", port);
});
```

## `routes.js`
```javascript
'use strict';

var express = require("express");
var router = express.Router();

//GET /words
// Route for words collection - Return all the words
router.get("/", function(req, res){
    res.json({response: "You sent me a GET request"});
});

//POST /words
// Route for creating words - Return all the words
router.post("/", function(req, res){
    res.json({
        response: "You sent me a POST request",
        body: req.body
    });
});

//GET /words/:id
// Route for specific word
router.get("/:id", function(req, res){
    res.json({response: "You sent me a GET request for ID: " + req.params.id});
});


module.exports = router;
```


Note that we'll use the URL:
```
GET http://localhost:3000/words
GET http://localhost:3000/words/5
POST http://localhost:3000/words
```

In the `app.js` we already handle the `/words` part, so in the `routes.js` file from there we just need to match `/` or `/:id` for example.


# Using Morgan (middleware module) to log HTTP status/routes in the terminal.

We can configure Morgan to log HTTP status codes and routes.

```
npm install --save morgan@~1.7
```


# Creating our own error handler for HTTP errors 404 and 500

The default Express error handler doesn't return JSON, so we'll build our own custom error handlers.

When Express gets an error either internally or we can manuualy pass it an error with `next()`, Express will stop and immediately invoke the first error handler.

> "Error-handling middleware always takes four arguments. You must provide four arguments to identify it as an error-handling middleware function. Even if you don’t need to use the next object, you must specify it to maintain the signature. Otherwise, the next object will be interpreted as regular middleware and will fail to handle errors."  
[Error Handling Middleware](https://expressjs.com/en/guide/using-middleware.html)


## `app.js`

Note here the last 2 `app.use` statements were we build the Error Handling.


```javascript
'use strict';

var express = require("express");
var app = express();
var routes = require("./routes"); // my routes files
var jsonParser = require("body-parser").json; // json parser
var logger = require("morgan"); // middleware for logging

app.use(logger("dev"));
app.use(jsonParser());

// out own router
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
```





## `routes.js`

Here look at the very last `router.post`.  Some notes:

* Note how we backed two anonymous functions together.. see and undersand how that works.  Also the regular expression to error if we don't get `vote-up` or `vote-down` exactly.

```javascript
'use strict';

var express = require("express");
var router = express.Router();

//GET /words
// Route for words collection - Return all the words
router.get("/", function(req, res){
    var o = obj.prop;
    res.json({response: "You sent me a GET request"});
});

//POST /words
// Route for creating words
router.post("/", function(req, res){
    res.json({
        response: "You sent me a POST request",
        body: req.body
    });
});

//GET /words/:wordId
// Route for specific word
router.get("/:wordId", function(req, res){
    res.json({response: "You sent me a GET request for ID: " + req.params.wordId});
});

//POST /words/:id/definitions
// Route for creating a definition to a word
router.post("/:wordId/definitions", function(req, res){
    res.json({
        response: "You sent me a POST request to /defitions",
        wordId: req.params.wordId,
        body: req.body
    });
});

// PUT /words/:wordId/defitions/:definitionId
// Edit a specific definition
router.put("/:wordId/definitions/:definitionId", function(req, res){
    res.json({
        response: "You sent me a PUT request to /defititions",
        wordId: req.params.wordId,
        definitionId: req.params.definitionId,
        body: req.body
    });
});

// DELETE /words/:wordId/defitions/definitionId
// Delete a specific definition
router.delete("/:wordId/definitions/:definitionId", function(req, res){
    res.json({
        response: "You sent me a DELETE request to /defititions",
        wordId: req.params.wordId,
        definitionId: req.params.definitionId,
    });
});

// POST /words/:wordId/defitions/definitionId/vote-up
// POST /words/:wordId/defitions/definitionId/vote-down
// Post a specific definition
router.post("/:wordId/definitions/:definitionId/vote-:direction", function(req, res, next){
    if (req.params.direction.search(/^(up|down)$/) === -1){
        var err = new Error("Not Found - must be 'vote-up' or 'vote-down'.");
        err.status = 404;
        next(err);
    } else {
        next();
    }
}, function(req, res){
    res.json({
        response: "You sent me a POST request to /vote-" + req.params.direction,
        wordId: req.params.wordId,
        definitionId: req.params.definitionId,
        vote: req.params.direction
    });
});

module.exports = router;
```


# Using MongoDB and mongoose

I installed **MongoDB** using homebrew for Mac.  

The default database directory for **MongoDB** is `/data/db` but I wanted to make sure mine was backed up to **Dropbox** so I put the directory in the location below.  Maybe I'll move this somewhere else next time.  

Maybe I should just make a local directory for each project? 

## To install and run MongoDB

Install:

```bash 
brew update
brew install mongodb

mkdir -p /Dropbox/Dropbox/Projects/mongodb_shared_db_dir/data/db
```

To run:
```bash
mongod --dbpath /Dropbox/Dropbox/Projects/mongodb_shared_db_dir/data/db
```


# Getting More from Mongoose

* [Getting More from Mongoose](https://teamtreehouse.com/library/getting-more-from-mongoose)

* Static method
* Instance method

Review to understand the difference between **static** and **instance** methods.

> Q: What is the difference between a static method and an instance method in Mongoose
>> A: A static method can be called by a model, and an instance method can be called by a document

> Q: What is a reason you might want to implement an instance method in Mongoose?
>> A: To find other documents like a given document.

> Q: Assuming `AccountSchema` has been defined as a Mongoose schema, what collection name would `mongoose.model('Account', AccountSchema)` link to in MongoDB?
>> A: accounts

This explains it better

```javascript
var schema = new mongoose.Schema({ name: 'string', size: 'string' });
var Tank = mongoose.model('Tank', schema);
```
Mongoose automatically looks for the plural version of your model name. Thus, for the example above, the model Tank is for the tanks collection in the database. 
[Models](http://mongoosejs.com/docs/models.html)


## `mongoose_sandbox.js`

```javascript
'use strict';

var mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/sandbox");

var db = mongoose.connection;

db.on("error", function(err){
	console.error("connection error:", err);
});

db.once("open", function(){
	console.log("db connection successful");
	// All database communication goes here

	var Schema = mongoose.Schema;
	var AnimalSchema = new Schema({
		type:  {type: String, default: "goldfish"},
		size:  String,
		color: {type: String, default: "golden"},
		mass:  {type: Number, default: 0.007},
		name:  {type: String, default: "Angela"}
	});

	AnimalSchema.pre("save", function(next){
		if(this.mass >= 100) {
			this.size = "big";
		} else if (this.mass >= 5 && this.mass < 100) {
			this.size = "medium";
		} else {
			this.size = "small";
		}
		next();
	});

    // Static method
	AnimalSchema.statics.findSize = function(size, callback){
		//this == Animal
		return this.find({size: size}, callback);
	}

    // Instance method
	AnimalSchema.methods.findSameColor = function(callback) {
		//this == document
		return this.model("Animal").find({color: this.color}, callback);
	}

	var Animal = mongoose.model("Animal", AnimalSchema);

	var elephant = new Animal({
		type: "elephant",
		color: "gray",
		mass: 6000,
		name: "Lawrence"
	});

	var animal = new Animal({}); //Goldfish

	var whale = new Animal({
		type: "whale",
		mass: 190500,
		name: "Fig"
	});

	var animalData = [
		{
			type: "mouse",
			color: "gray",
			mass: 0.035,
			name: "Marvin"
		},
		{
			type: "nutria",
			color: "brown",
			mass: 6.35,
			name: "Gretchen"
		},
		{
			type: "wolf",
			color: "gray",
			mass: 45,
			name: "Iris"
		},
		elephant,
		animal,
		whale
	];

	Animal.remove({}, function(err) {
		if (err) console.error(err);
		Animal.create(animalData, function(err, animals){
			if (err) console.error(err);
			Animal.findOne({type: "elephant"}, function(err, elephant) {
				elephant.findSameColor(function(err, animals){
					if (err) console.error(err);
					animals.forEach(function(animal){
						console.log(animal.name + " the " + animal.color + 
							" " + animal.type + " is a " + animal.size + "-sized animal.");
					});
					db.close(function(){
						console.log("db connection closed");
					});
				});
			});
		});
	});
});
```

# Changelog
1-June-2017

Added:
* Word updatedAt value (before the updatedAt was only on Definitions)
* GET for Word list now returns most recent updated Word at top, descending.
* API routes to
    * Update Words
    * Delete Words

TODO:
* Maybe change the response code and response data on the two methods I just created.
* Add sorting to sort last updated Word
* Add Voting or Ranking for Words (maybe by popularity or by needs to review)
* Add tagging/labeling for words to filter based on Language, Category, etc.  Portuguese, Travel, Work, etc.
* After users created, limit the amount of votes to 1.

:)