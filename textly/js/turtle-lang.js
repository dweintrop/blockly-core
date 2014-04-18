'use strict';

// TODO: correct/clean-up/integrate this once re-integrated with Blockly
// goog.require("Textly");
var Textly = {};
Textly.Lang = {};

Textly.Lang.TurtleKeyword = function(args) {
    //private fields
    var keyword = args.keyword;
    var style = args.style || "turtle";
    var js = args.js;
    var supportCode = args.supportCode;

    var that = {};

    that.getKeyword = function() {return keyword;}
    that.getStyle = function() {return style;}
    that.getJS = function() {return js;}
    that.getSupportCode = function() {return supportCode;}

    return that;
  };

Textly.Lang.TurtleKeywords = {
    moveForward: Textly.Lang.TurtleKeyword({
      keyword: "moveForward",
      js: "Turtle.moveForward"}),
    moveForwardBy: Textly.Lang.TurtleKeyword({
      keyword: "moveForwardBy",
      js: "Turtle.moveForward"}),
    moveBackward: Textly.Lang.TurtleKeyword({
      keyword: "moveBackward",
      js: "Turtle.moveBackward"}),
    moveBackwardBy: Textly.Lang.TurtleKeyword({
      keyword: "moveBackwardBy",
      js: "Turtle.moveBackward"}),
    turnRight: Textly.Lang.TurtleKeyword({
      keyword: "turnRight",
      js: "Turtle.turnRight"}),
    turnRightBy: Textly.Lang.TurtleKeyword({
      keyword: "turnRightBy",
      js: "Turtle.turnRight"}),
    turnLeft: Textly.Lang.TurtleKeyword({
      keyword: "turnLeft",
      js: "Turtle.turnLeft"}),
    turnLeftBy: Textly.Lang.TurtleKeyword({
      keyword: "turnLeftBy",
      js: "Turtle.turnLeft"}),
    setWidth: Textly.Lang.TurtleKeyword({
      keyword: "setWidth",
      js: "Turtle.penWidth"}),
    setWidthTo: Textly.Lang.TurtleKeyword({
      keyword: "setWidthTo",
      js: "Turtle.penWidth"}),
    penUp: Textly.Lang.TurtleKeyword({
      keyword: "penUp",
      js: "Turtle.penUp"}),
    penDown: Textly.Lang.TurtleKeyword({
      keyword: "penDown",
      js: "Turtle.penDown"}),
    showTurtle: Textly.Lang.TurtleKeyword({
      keyword: "showTurtle",
      js: "Turtle.showTurtle"}),
    hideTurtle: Textly.Lang.TurtleKeyword({
      keyword: "hideTurtle",
      js: "Turtle.hideTurtle"}),
    print: Textly.Lang.TurtleKeyword({
      keyword: "print",
      js: "Turtle.drawPrint"}),
    font: Textly.Lang.TurtleKeyword({
      keyword: "font",
      js: "Turtle.drawFont"}),


    // Colors
    setColor: Textly.Lang.TurtleKeyword({
      keyword: "setColor",
      js: "Turtle.penColour",
      style: "set-color"
    }),
    setColorTo: Textly.Lang.TurtleKeyword({
      keyword: "setColorTo",
      js: "Turtle.penColour",
      style: "set-color"
    }),
    colorWith: Textly.Lang.TurtleKeyword({
      keyword: "colorWith",
      js: "__colour_rgb",
      style: "color",
      supportCode: "function __colour_rgb(r, g, b) { r = Math.round(Math.max(Math.min(Number(r), 100), 0) * 2.55); g = Math.round(Math.max(Math.min(Number(g), 100), 0) * 2.55); b = Math.round(Math.max(Math.min(Number(b), 100), 0) * 2.55); r = ('0' + (r || 0).toString(16)).slice(-2); g = ('0' + (g || 0).toString(16)).slice(-2); b = ('0' + (b || 0).toString(16)).slice(-2); return '#' + r + g + b;}"
    }),
    aqua: Textly.Lang.TurtleKeyword({
      keyword: "aqua",
      js:"\'#00FFFF\'",
      style: "aqua"
    }),
    black: Textly.Lang.TurtleKeyword({
      keyword: "black",
      js:"\'#000000\'",
      style: "black"
    }),
    blue: Textly.Lang.TurtleKeyword({
      keyword: "blue",
      js:"\'#0000ff\'",
      style: "blue"
    }),
    brown: Textly.Lang.TurtleKeyword({
      keyword: "brown",
      js:"\'#a52a2a\'",
      style: "brown"
    }),
    gray: Textly.Lang.TurtleKeyword({
      keyword: "grey",
      js:"\'#808080\'",
      style: "grey"
    }),
    green: Textly.Lang.TurtleKeyword({
      keyword: "green",
      js:"\'#008000\'",
      style: "green"
    }),
    orange: Textly.Lang.TurtleKeyword({
      keyword: "orange",
      js:"\'#ffa500\'",
      style: "orange"
    }),
    pink: Textly.Lang.TurtleKeyword({
      keyword: "pink",
      js:"\'#ffc0cb\'",
      style: "pink"
    }),
    purple: Textly.Lang.TurtleKeyword({
      keyword: "purple",
      js:"\'#800080\'",
      style: "purple"
    }),
    red: Textly.Lang.TurtleKeyword({
      keyword: "red",
      js:"\'#ff0000\'",
      style: "red"
    }),
    white: Textly.Lang.TurtleKeyword({
      keyword: "white",
      js:"\'#ffffff\'",
      style: "black"
    }),
    yellow: Textly.Lang.TurtleKeyword({
      keyword: "yellow",
      js:"\'#ffff00\'",
      style: "yellow"
    }),
    randomColor: Textly.Lang.TurtleKeyword({
      keyword: "randomColor",
      js: "__colour_random()",
      style: "color",
      supportCode: "function __colour_random() { var num = Math.floor(Math.random() * Math.pow(2, 24)); return '#' + ('00000' + num.toString(16)).substr(-6);}"
    }),

    //Logic
    and: Textly.Lang.TurtleKeyword({
      keyword: "and",
      js:"&&",
      style: "bool"
    }),
    or: Textly.Lang.TurtleKeyword({
      keyword: "or",
      js:"||",
      style: "bool"
    })
  };


// macros with sweet.js
// macro and {
//   rule infix {
//     $lhs:expr | $rhs:expr
//   } => {
//     $lhs && $rhs
//   }
// }

// macro fd {
//   rule {} => {Turtle.forward}
//   }



Textly.Lang.Turtle = function () {

	// another option that may or may not be helpful
	// "fd(1);" 
	// var fd = function(n) { Turtle.forward)n);}

  var includedKeywords = {};

  function jsRewriteVisitor(keyword) {
    if (Textly.Lang.TurtleKeywords[keyword]) {
      // record each included keyword
      includedKeywords[keyword] = true;  
      return Textly.Lang.TurtleKeywords[keyword].getJS();
    }
    return keyword;
  };

  // Interface
  return {
      
    rewrite: function(inText) {
      var rewrittenText = "";

      rewrittenText = escodegen.generate(esprima.parse(inText), {
          identifierRewriteVisitor: jsRewriteVisitor
        });

      var supportCode = "";
      for (var keyword in includedKeywords) {
        if (includedKeywords.hasOwnProperty(keyword) && Textly.Lang.TurtleKeywords[keyword].getSupportCode()) {
          supportCode += " " + Textly.Lang.TurtleKeywords[keyword].getSupportCode(); 
        }
      }

      return supportCode + ' ' + rewrittenText;
    },
  	codeMirrorStyles: function() {
    	var forCM = {};
    	for (var word in Textly.Lang.TurtleKeywords) {
    		forCM[word] = {type: word, style: Textly.Lang.TurtleKeywords[word].getStyle()}
    	}
    	return forCM
    }
  };
};