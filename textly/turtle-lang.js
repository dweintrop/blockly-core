'use strict';

// TODO: correct/clean-up/integrate this once re-integrated with Blockly
// goog.require("Textly");
var Textly = {};
Textly.Lang = {};

Textly.Lang.Turtle = function () {

	// another option that may or may not be helpful
	// "fd(1);" 
	// var fd = function(n) { Turtle.forward)n);}


  var turtleKeyword = function(args) {
		//private fields
		var keyword = args.keyword;
		var style = args.style || "turtle";
		var js = args.js;

		var that = {};

		that.getKeyword = function() {return keyword;}
		that.getStyle = function() {return style;}
		that.getJS = function() {return js;}

		return that;
	}

  var turtleKeywords = {
    moveForward: turtleKeyword({
    	keyword: "moveForward",
    	js: "Turtle.moveForward"}),
    moveForwardBy: turtleKeyword({
    	keyword: "moveForwardBy",
    	js: "Turtle.moveForward"}),
    moveBackward: turtleKeyword({
    	keyword: "moveBackward",
    	js: "Turtle.moveBackward"}),
    turnRight: turtleKeyword({
    	keyword: "turnRight",
    	js: "Turtle.turnRight"}),
    turnLeft: turtleKeyword({
    	keyword: "turnLeft",
    	js: "Turtle.turnLeft"}),
    repeat: turtleKeyword({
    	keyword: "repeat",
    	js: "for (var c = 0; c < arg; c++)"})
  };

	// Interface

  return {
    jsRewriteVisitor: function(keyword) {
    	if (turtleKeywords[keyword]) {
    		return turtleKeywords[keyword].getJS();
    	}
    	return keyword;
	  },
	  codeMirrorStyles: function() {
	  	var forCM = {};
	  	for (var word in turtleKeywords) {
	  		forCM[word] = {type: word, style: turtleKeywords[word].getStyle()}
	  	}
	  	return forCM
	  }
	};
};