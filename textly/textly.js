/**
 * @fileoverview Core JavaScript library for Textly feature of Blockly.
 * @author dweintrop@u.northwestern.edu (David Weintrop)
 */
'use strict';

// Top level object for Textly.
goog.provide('Textly');

// Closure dependencies.
goog.require('goog.dom');

Textly.init = function() {
	// Builder simple UI
	var textlyDiv = document.getElementById('textly')
	goog.dom.appendChild(textlyDiv, goog.dom.createDom('div', null, 'raw js:'));
	var uglyDiv = goog.dom.createDom('div', {'id':'uglyCodeDiv', 'style':'padding:8px;'});
	goog.dom.appendChild(textlyDiv, uglyDiv);

	goog.dom.appendChild(textlyDiv, goog.dom.createDom('p', null, 'Pretty js:'));
	var prettyPre = goog.dom.createDom('pre', {'id':'prettyCodePre', 'style':'padding:8px;'});
	goog.dom.appendChild(textlyDiv, prettyPre);
}

Textly.update = function() {
	var uglyCodeDiv = document.getElementById('uglyCodeDiv')
	var code = Blockly.Generator.workspaceToCode('JavaScript');
	uglyCodeDiv.innerHTML = code;
	
	var prettyCode = BlocklyApps.stripCode(code);
	if (typeof prettyPrintOne == 'function') {
    prettyCode = prettyPrintOne(prettyCode, 'js');
  } 
  var prettyCodePre = document.getElementById('prettyCodePre');
  prettyCodePre.innerHTML = prettyCode;
}