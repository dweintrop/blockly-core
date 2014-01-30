/**
 * @fileoverview Core JavaScript library for Textly feature of Blockly.
 * @author dweintrop@u.northwestern.edu (David Weintrop)
 */
'use strict';

// Top level object for Textly.
goog.provide('Textly');

// Closure dependencies.
goog.require('goog.cssom');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.editor.SeamlessField');

Textly.init = function() {
}


Textly.update = function() {
	var rawjsDiv = document.getElementById('rawjsDiv')
	var code = Blockly.Generator.workspaceToCode('JavaScript');
	rawjsDiv.innerHTML = code;
	
	var editableRawjsDiv = new goog.editor.SeamlessField('rawjsDiv');
  editableRawjsDiv.makeEditable();

	var prettyCode = BlocklyApps.stripCode(code);
	if (typeof prettyPrintOne == 'function') {
    prettyCode = prettyPrintOne(prettyCode, 'js');
  } 
  var prettyCodePre = document.getElementById('prettyCodePre');
  prettyCodePre.innerHTML = prettyCode;

	var editablePrettyCodePre = new goog.editor.SeamlessField('prettyCodePre');
	// editablePrettyCodePre.setIframeableCss(editablePrettyCodePre.getIframeableCss() + goog.cssom.getAllCssText('../apps/prettify.css'));
  editablePrettyCodePre.makeEditable();
}