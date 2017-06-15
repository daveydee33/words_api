'use strict';

var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var sortDefinitions = function(a, b) {
    //- negative a before b
    //0 no change
    //+ positive b before a

    // order by votes.  if this matches, order by most recent edit first
    if(a.votes === b.votes){
        return b.updatedAt - a.updatedAt;
        /* 
        if(a.updatedAt > b.updatedAt){
            return -1;
        } else if(a.updatedAt < b.updatedAt) {
            return 1;
        } else {
            return 0;
        }
        */
    }
    return b.votes - a.votes;
}

var DefinitionSchema = new Schema({
    text: String,
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
    votes: {type: Number, default:0}
});

DefinitionSchema.method("update", function(updates, callback) {
    Object.assign(this, updates, {updatedAt: new Date()});
    this.parent().save(callback);
});

DefinitionSchema.method("vote", function(vote, callback) {
    if (vote === "up") {
        this.votes += 1;
    } else {
        this.votes -= 1;
    }
    this.parent().save(callback);
});

var WordSchema = new Schema({
    text: String,
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
    definitions: [DefinitionSchema]
});

WordSchema.method("update", function(updates, callback) {
    Object.assign(this, updates, {updatedAt: new Date()});
    this.save(callback);
});

// A pre-save callback (pre-save hook?) to sort before saving to DB
WordSchema.pre("save", function(next){
    //this.definitions.sort();  // can't use this because [object Object] -- the stringified value will be same for all the sort calls the toString() method.
    this.definitions.sort(sortDefinitions);
    next();
});

var Word = mongoose.model("Word", WordSchema);

module.exports.Word = Word;

