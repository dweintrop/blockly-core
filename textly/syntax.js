/**
 * @fileoverview Core JavaScript library for Syntax Objects for Textly.
 * @author dweintrop@u.northwestern.edu (David Weintrop)
 */
'use strict';

// Top level object for Textly.
goog.provide('Textly.Syntax');

goog.require('Textly');

// call: Textly.Syntax.BlocksFromText(Textly.codeMirror.getValue(), Blockly.languageTree)
// create the full blockly tree from scratch
Textly.Syntax.BlocksFromText = function(js, langTree) {
	// clear main main workspace
	Blockly.mainWorkspace.clear();

	var ast = acorn.parse(js).body;
	var blocks = [];

	// An array of functions to handle each type of ast element
	var expressionHandlers = [];
	expressionHandlers['ExpressionStatement'] = function(node) {
		console.log('expression statement');
		// pass throught to child element
			return expressionHandlers[node['expression']['type']](node['expression']);
		};

	expressionHandlers['CallExpression'] = function(node) {
		console.log('call expression: ' + node);
		var newBlock = null;
		var objectType = node.callee.object.name;
		var property = node.callee.property.name;
		console.log('call: ' + objectType + '.' + property);
		
		var args = node.arguments;

		var languageCategories = langTree.childNodes
		for(var c = 0; c < languageCategories.length; c++) {
			// find category of block group for this call
			if (languageCategories[c].getAttribute('name') === objectType) {
				// we now have the category - figure out which type of block we have

				// found matching element from language tree - so construct block
				var blockType = Textly.Syntax.jsMap[objectType][property]

				// xml approach (from xml.js)
				// newblock = new Blockly.Block(workspace, prototypeName, id);
				

				// direct approach (from factory.js)
				// code: definition of bock from block.js
				// type: type from xml (eg: draw_move)
	      eval('Blockly.Blocks.' + blockType);
	      // Create the preview block.
	      var newBlock = new Blockly.Block(Blockly.mainWorkspace, blockType);
	      newBlock.initSvg();
	      newBlock.render();

			}
		}
		// didn't find category in language tree - create generic call block
		if (newBlock == null) {

		}
	};

	expressionHandlers['Literal'] = function(node) {
		console.log('literal: ' + node['value'])
	};

	// call handler for each top-level tree element
	for (var c = 0; c < ast.length; c++) {
		expressionHandlers[ast[c]['type']](ast[c]);
	}
	 
}

Textly.Syntax.jsMap = {
	'Turtle': {
		'moveForward' : 'draw_move',
		'penWidth' : 'draw_width'
	},
	'Math' : {
		'Literal' : 'math_number'
	}
}

// Blockly.workspace.getBlockbyId(id);


Textly.Syntax.AST = null;

// this function takes in the workspace and returns the generated js; 
//   along the way it builds it's AST with handles back to the blocks themselves
Textly.Syntax.buildAST = function() {
	// clear out AST
	Textly.Syntax.AST = null;

	// copid form generator.js - workspaceToCode
 	var code = [];
  var generator = Blockly.Generator.get('JavaScript');
  generator.init();
  var blocks = Blockly.mainWorkspace.getTopBlocks(true);
  for (var x = 0, block; block = blocks[x]; x++) {

  	// abandoned the idea of iteration through each block in sequence here (as opposed to in javascript.js scrub)
  	//   because the sequencing logic lives in a few different places - not just in scrub
		// var nextBlock = block;
  // 	while (nextBlock) {
	  
	    var line = generator.blockToCode(block);
	    if (line instanceof Array) {
	      // Value blocks return tuples of code and operator order.
	      // Top-level blocks don't care about operator order.
	      line = line[0];
	    }
	    if (line) {
	      if (block.outputConnection && generator.scrubNakedValue) {
	        // This block is a naked value.  Ask the language's code generator if
	        // it wants to append a semicolon, or something.
	        line = generator.scrubNakedValue(line);
	      }

				line = BlocklyApps.stripCode(line);

// abondoned parsing code as you go and adding id to AST because of how connected and nested blocks are converted to text
	      // Textly.Syntax.AST = acorn.parse(line, 
							// 											    {'locations':true, 
							// 											     'program': Textly.Syntax.AST,
							// 											     'blockType': block.type, // this might be redundant as you can get type off block itself
							// 											   	 'blockId' : block.id});
				
	      code.push(line);

    }
  }
  code = code.join('\n');  // Blank line between each section.
  code = generator.finish(code);
  // Final scrubbing of whitespace.
  code = code.replace(/^\s+\n/, '');
  code = code.replace(/\n\s+$/, '\n');
  code = code.replace(/[ \t]+\n/g, '\n');

  // populate AST as last step to make sure line/column values are correct
  Textly.Syntax.AST = acorn.parse(line, {'locations':true});

  return code;
}










// first attempt at parser - probably going to delete
// pretty sure I'm not doing this correctly - the idea is to encapsoluate the 
//   recursion/parsing logic inside a single object without exposing the inner helper methods
// Textly.Syntax.BlocksFromText = (function() {
// 	var parser = {
// 		langTree: null,
// 		// recursively build blocks
// 		init : function(js, inLangTree) {
// 				parser.langTree = inLangTree;
// 				return parser.parse(esprima.parse(js).body[0]); // will there always be only 1 element in the body array?
			
// 		},
// 		parse: function(command) {
// 			var expType = command.type;
// 			var blocks = []
// 	    switch (expType) {
// 	      case 'ExpressionStatement':
// 	      	console.log('ExpressionStatement');
// 	      	blocks.concat(parser.handleExpressionStatement(command));
// 	        break;
// 	      case 'CallExpression':
// 	      	console.log('CallExpression');
// 	      	blocks.concat(parser.handleCallExpression(command));
// 	        break;
// 	    }
// 	    return blocks;
// 		},
// 		handleExpressionStatement : function(command) {
// 			return parser.parse(command.expression)
// 		}, 
// 		handleCallExpression : function(command) {
// 			var newBlock = null;
// 			var expType = command.type;
// 			var objectType = command.callee.object.name;
// 			var property = command.callee.property.name;
// 			var args = command.arguments;
// 			var languageCategories = parser.langTree.childNodes
// 			for(var c = 0; c < languageCategories.length; c++) {
// 				// find group of block group for this call
// 				if (languageCategories[c].getAttribute('name') === callee) {

// 					console.log(callee + '.' + property);
					
// 				}
// 			}
// 			// didn't find block in language tree - create generic call block
// 			if (newBlock == null) {

// 			}
// 		}
// 	}
// 	return parser.init;
// })();



// first attempt at recursive parser - also probably going to delete//  I'm not sure fully recursing through the tree from a single function is the best way to do this
	// //Recursively build out our blocks
	// function traverse(node, func) {
 //    func(node);
 //    for (var key in node) { 
 //      if (node.hasOwnProperty(key)) { 
 //        var child = node[key];
 //        if (typeof child === 'object' && child !== null) { 

 //          if (Array.isArray(child)) {
 //            child.forEach(function(node) {
	//             traverse(node, func);
	//           });
 //          } else {
 //            traverse(child, func);
 //          }
 //        }
 //      }
	//   }
	// }

 //  traverse(ast, function(node) {
 //  	switch (node.type) {
	//       case 'ExpressionStatement':
	//       	consle.log(handleExpressionStatement(node));
	//         break;
	//       case 'CallExpression':
	//       	console.log(handleCallExpression(node)));
	//         break;
	//        default:
	// 	      console.log('fell through switch for: ' + node.type);
	//     }
 //  });