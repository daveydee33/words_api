'use strict';

var express = require("express");
var router = express.Router();
var Word = require("./models").Word;

router.param("wordId", function(req, res, next, id){
    Word.findById(id, function(err, doc){
        if (err) return next(err);
        if (!doc) {
            err = new Error("Not Found");
            err.status = 404;
            return next(err);
        }
        req.word = doc;
        return next();
    });
});

router.param("definitionId", function(req, res, next, id){
    req.definition = req.word.definitions.id(id);
    if (!req.definition) {
        err = new Error("Not Found");
        err.status = 404;
        return next(err);
    }
    next();
});

// GET /words
// Route for words collection - Return all the words
router.get("/", function(req, res, next){
    Word.find({})
            .sort({createdAt: -1})
            .exec(function(err, words){
                if (err) return next(err);
                res.json(words);
            });
});

// POST /words
// Route for creating words
router.post("/", function(req, res, next){
    var word = new Word(req.body);
    word.save(function(err, word){
        if (err) return next(err);
        res.status(201);
        res.json(word);
    });

    // Placeholder...
    // res.json({
    //     response: "You sent me a POST request",
    //     body: req.body
    // });
});

// GET /words/:wordId
// Route for specific word
router.get("/:wordId", function(req, res, next){
    res.json(req.word);

    // Placeholder... 
    //res.json({response: "You sent me a GET request for ID: " + req.params.wordId});
});

//POST /words/:id/definitions
// Route for creating a definition to a word
router.post("/:wordId/definitions", function(req, res, next){
    req.word.definitions.push(req.body);
    req.word.save(function(err, word){
        if (err) return next(err);
        res.status(201);
        res.json(word);
    });

    // Placeholder...
    // res.json({
    //     response: "You sent me a POST request to /defitions",
    //     wordId: req.params.wordId,
    //     body: req.body
    // });
});

// PUT /words/:wordId/defitions/:definitionId
// Edit a specific definition
router.put("/:wordId/definitions/:definitionId", function(req, res){
    req.definition.update(req.body, function(err, result){
        if (err) return next(err);
        res.json(result);
    });

    // Placeholder...
    // res.json({
    //     response: "You sent me a PUT request to /defititions",
    //     wordId: req.params.wordId,
    //     definitionId: req.params.definitionId,
    //     body: req.body
    // });
});

// DELETE /words/:wordId/defitions/definitionId
// Delete a specific definition
router.delete("/:wordId/definitions/:definitionId", function(req, res){
    req.definition.remove(function(err){
        req.word.save(function(err, word){
            if (err) return next(err);
            res.json(word);
        });
    });

    // Placeholder
    // res.json({
    //     response: "You sent me a DELETE request to /defititions",
    //     wordId: req.params.wordId,
    //     definitionId: req.params.definitionId,
    // });
});

// POST /words/:wordId/defitions/definitionId/vote-up
// POST /words/:wordId/defitions/definitionId/vote-down
// Post a specific definition
router.post("/:wordId/definitions/:definitionId/vote-:direction", 
    function(req, res, next){
        if (req.params.direction.search(/^(up|down)$/) === -1){
            var err = new Error("Not Found - should be either 'vote-up' or 'vote-down'.");
            err.status = 404;
            next(err);
        } else {
            req.vote = req.params.direction;
            next();
        }
    }, 
    function(req, res, next){
        req.definition.vote(req.vote, function(err, word){
            if (err) return next(err);
            res.json(word);
        });

        // Placeholder...
        // res.json({
        //     response: "You sent me a POST request to /vote-" + req.params.direction,
        //     wordId: req.params.wordId,
        //     definitionId: req.params.definitionId,
        //     vote: req.params.direction
        // });
});

module.exports = router;