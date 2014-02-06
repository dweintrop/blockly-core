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

Textly.updater = null;

Textly.init = function() {
	Textly.updater = Textly.updatePrettyJS;
}

Textly.update = function() {
	console.log('updated');
	Textly.updater();
}

Textly.resize = function(parentBlock) {
	var textlyDiv = document.getElementById('textly');

  textlyDiv.style.cssText = parentBlock.style.cssText;
  textlyDiv.style.top = (parentBlock.scrollHeight + 100) + 'px';
  textlyDiv.style.overflow = 'auto';

	var parentbBox = BlocklyApps.getBBox_(parentBlock);
  for (var x in Textly.code.TABS_) {
    var el = document.getElementById('content_' + Textly.code.TABS_[x]);
    el.style.top = '28px';
    // Height and width need to be set, read back, then set again to
    // compensate for scrollbars.

    el.style.height = parentbBox.height + 30 + 'px';
    el.style.height = (2 * parentbBox.height - el.offsetHeight) + 'px';
    el.style.width = parentbBox.width + 15 + 'px';
    el.style.width = (2 * parentbBox.width - el.offsetWidth) + 'px';
  }
}

Textly.updatePrettyJS = function () {
	Textly.updater = Textly.updatePrettyJS;
	var outputDiv = document.getElementById('content_javascript')
	var code = Blockly.Generator.workspaceToCode('JavaScript');
	var prettyCode = BlocklyApps.stripCode(code);
	if (typeof prettyPrintOne == 'function') {
    prettyCode = prettyPrintOne(prettyCode, 'js');
  } 
  outputDiv.innerHTML = prettyCode;
}

Textly.editableJSDiv = null;

Textly.initializeEditableJS = function () {
	Textly.updater = Textly.updateEditableJS;

	// Enable seamless editor
	Textly.editableJSDiv = new goog.editor.SeamlessField('content_editablejavascript');

	// this line sometimes freezes firefox (often, not always) - so just hardcode the style for now
	// editablePrettyCodePre.setIframeableCss(goog.cssom.getAllCssText('../apps/prettify.css'));
	Textly.editableJSDiv.setIframeableCss('body { background-color: rgb(255, 255, 255); font-family: sans-serif; margin-top: 0px; } h1 { font-weight: normal; font-size: 140%; } a:hover { color: rgb(255, 0, 0); } .farSide { text-align: right; } html[dir="RTL"] .farSide { text-align: left; } button { margin: 5px; padding: 10px; border-top-left-radius: 4px; border-top-right-radius: 4px; border-bottom-right-radius: 4px; border-bottom-left-radius: 4px; border: 1px solid rgb(221, 221, 221); font-size: large; background-color: rgb(238, 238, 238); color: rgb(0, 0, 0); } button.primary { border: 1px solid rgb(221, 75, 57); background-color: rgb(221, 75, 57); color: rgb(255, 255, 255); } button.secondary { border: 1px solid rgb(77, 144, 254); background-color: rgb(77, 144, 254); color: rgb(255, 255, 255); } button.primary > img, button.secondary > img { opacity: 1; } button > img { opacity: 0.6; vertical-align: text-bottom; } button:hover > img { opacity: 1; } button:active { border: 1px solid rgb(136, 136, 136) !important; } button:hover { box-shadow: rgb(136, 136, 136) 2px 2px 5px; } button.disabled:hover > img { opacity: 0.6; } button.disabled { display: none; } button.notext { font-size: 10%; } #dialog { visibility: hidden; background-color: rgb(255, 255, 255); color: rgb(0, 0, 0); border: 1px solid rgb(204, 204, 204); position: absolute; border-top-left-radius: 8px; border-top-right-radius: 8px; border-bottom-right-radius: 8px; border-bottom-left-radius: 8px; box-shadow: rgb(136, 136, 136) 5px 5px 5px; padding: 10px; } #dialogBorder { visibility: hidden; position: absolute; background-color: rgb(255, 255, 255); color: rgb(0, 0, 0); border: 1px solid rgb(0, 0, 0); border-top-left-radius: 6px; border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-bottom-left-radius: 6px; box-shadow: rgb(136, 136, 136) 5px 5px 5px; } #dialogShadow { visibility: hidden; position: fixed; top: 0px; left: 0px; height: 100%; width: 100%; background-color: rgb(0, 0, 0); opacity: 0.3; } .dialogAnimate { transition: 0.2s linear; -webkit-transition: 0.2s linear; } .dialogHiddenContent { visibility: hidden; position: absolute; top: 0px; left: 0px; z-index: -1; } #dialogHeader { height: 25px; margin: -10px -10px 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; background-color: rgb(221, 221, 221); cursor: move; } #dialog button { min-width: 4em; } #containerCode { direction: ltr; font-size: large; overflow: auto; max-height: 400px; } button.primary { text-align: left; } html[dir="RTL"] button.primary { text-align: right; } #toolbarDiv { text-align: center; width: 400px; padding-top: 1em; } #blockly { position: fixed; bottom: 10px; } #textly { position: fixed; bottom: 10px; } #display { border: 1px solid rgb(204, 204, 204); } #downloadImageLink { display: none; } #languageMenu { vertical-align: top; margin-top: 12px; } .sliderTrack { stroke: #aaaaaa; stroke-width: 6px; stroke-linecap: round; } .sliderKnob { fill: #dddddd; stroke: #bbbbcc; stroke-width: 1px; stroke-linejoin: round; } .sliderKnob:hover { fill: #eeeeee; } .icon21 { height: 21px; width: 21px; background-image: url(http://localhost/~dweintrop/code-dot-org/blockly-core/apps/turtle/icons.png); } .code { background-position: -21px 0px; } .link { background-position: 0px 0px; } .img { background-position: -42px 0px; } .run { background-position: -63px -21px; } .stop { background-position: -63px 0px; } .blocklySvg { cursor: pointer; background-color: rgb(255, 255, 255); border: 1px solid rgb(221, 221, 221); } .blocklyWidgetDiv { position: absolute; display: none; z-index: 999; } .blocklyDraggable { cursor: url(http://localhost/~dweintrop/code-dot-org/blockly-core/media/handopen.cur) 8 5, auto; } .blocklyResizeSE { fill: #aaaaaa; cursor: se-resize; } .blocklyResizeSW { fill: #aaaaaa; cursor: sw-resize; } .blocklyResizeLine { stroke-width: 1px; stroke: #888888; } .blocklyHighlightedConnectionPath { stroke-width: 4px; stroke: #ffcc33; fill: none; } .blocklyPathLight { fill: none; stroke-width: 2px; stroke-linecap: round; } .blocklySelected > .blocklyPath { stroke-width: 3px; stroke: #ffcc33; } .blocklySelected > .blocklyPathLight { display: none; } .blocklyDragging > .blocklyPath, .blocklyDragging > .blocklyPathLight { fill-opacity: 0.8; stroke-opacity: 0.8; } .blocklyDragging > .blocklyPathDark { display: none; } .blocklyDisabled > .blocklyPath { fill-opacity: 0.5; stroke-opacity: 0.5; } .blocklyDisabled > .blocklyPathLight, .blocklyDisabled > .blocklyPathDark { display: none; } .blocklyText { cursor: default; font-family: sans-serif; font-size: 11pt; fill: #ffffff; } .blocklyNonEditableText > text { pointer-events: none; } .blocklyNonEditableText > rect, .blocklyEditableText > rect { fill: #ffffff; fill-opacity: 0.6; } .blocklyNonEditableText > text, .blocklyEditableText > text { fill: #000000; } .blocklyEditableText:hover > rect { stroke-width: 2px; stroke: #ffffff; } .blocklySvg text { -webkit-user-select: none; cursor: inherit; } .blocklyHidden { display: none; } .blocklyFieldDropdown:not(.blocklyHidden) { display: block; } .blocklyTooltipBackground { fill: #ffffc7; stroke-width: 1px; stroke: #d8d8d8; } .blocklyTooltipShadow, .blocklyContextMenuShadow, .blocklyDropdownMenuShadow { fill: #bbbbbb; filter: url(#blocklyShadowFilter); } .blocklyTooltipText { font-family: sans-serif; font-size: 9pt; fill: #000000; } .blocklyIconShield { cursor: default; fill: #0000cc; stroke-width: 1px; stroke: #cccccc; } .blocklyIconGroup:hover > .blocklyIconShield { fill: #0000ff; stroke: #ffffff; } .blocklyIconGroup:hover > .blocklyIconMark { fill: #ffffff; } .blocklyIconMark { font-family: sans-serif; font-size: 9pt; font-weight: bold; fill: #cccccc; text-anchor: middle; cursor: default !important; } .blocklyWarningBody { } .blocklyMinimalBody { margin: 0px; padding: 0px; } .blocklyCommentTextarea { margin: 0px; padding: 2px; border: 0px; resize: none; background-color: rgb(255, 255, 204); } .blocklyHtmlInput { font-family: sans-serif; font-size: 11pt; border: none; outline: none; width: 100%; } .blocklyContextMenuBackground, .blocklyMutatorBackground { fill: #ffffff; stroke-width: 1px; stroke: #dddddd; } .blocklyContextMenuOptions > .blocklyMenuDiv, .blocklyContextMenuOptions > .blocklyMenuDivDisabled, .blocklyDropdownMenuOptions > .blocklyMenuDiv { fill: #ffffff; } .blocklyContextMenuOptions > .blocklyMenuDiv:hover > rect, .blocklyDropdownMenuOptions > .blocklyMenuDiv:hover > rect { fill: #5577ee; } .blocklyMenuSelected > rect { fill: #5577ee; } .blocklyMenuText { font-family: sans-serif; font-size: 15px; fill: #000000; cursor: default !important; } .blocklyContextMenuOptions > .blocklyMenuDiv:hover > .blocklyMenuText, .blocklyDropdownMenuOptions > .blocklyMenuDiv:hover > .blocklyMenuText { fill: #ffffff; } .blocklyMenuSelected > .blocklyMenuText { fill: #ffffff; } .blocklyMenuDivDisabled > .blocklyMenuText { fill: #cccccc; } .blocklyFlyoutBackground { fill: #dddddd; fill-opacity: 0.8; } .blocklyColourBackground { fill: #666666; } .blocklyScrollbarBackground { fill: #ffffff; stroke-width: 1px; stroke: #e4e4e4; } .blocklyScrollbarKnob { fill: #cccccc; } .blocklyScrollbarBackground:hover + .blocklyScrollbarKnob, .blocklyScrollbarKnob:hover { fill: #bbbbbb; } .blocklyInvalidInput { background-color: rgb(255, 170, 170); background-position: initial initial; background-repeat: initial initial; } .blocklyAngleCircle { stroke: #444444; stroke-width: 1px; fill: #dddddd; fill-opacity: 0.8; } .blocklyAngleMarks { stroke: #444444; stroke-width: 1px; } .blocklyAngleGuage { fill: #dd0000; fill-opacity: 0.8; } .blocklyToolboxDiv { background-color: rgb(221, 221, 221); display: none; overflow-x: visible; overflow-y: auto; position: absolute; } .blocklyTreeRoot { padding: 4px 0px; } .blocklyTreeRoot:focus { outline: none; } .blocklyTreeRow { line-height: 22px; height: 22px; padding-right: 1em; white-space: nowrap; } .blocklyToolboxDiv[dir="RTL"] .blocklyTreeRow { padding-right: 0px; padding-left: 1em !important; } .blocklyTreeRow:hover { background-color: rgb(228, 228, 228); } .blocklyTreeIcon { height: 16px; width: 16px; vertical-align: middle; background-image: url(http://localhost/~dweintrop/code-dot-org/blockly-core/media/tree.png); } .blocklyTreeIconClosedLtr { background-position: -32px -1px; } .blocklyTreeIconClosedRtl { background-position: 0px -1px; } .blocklyTreeIconOpen { background-position: -16px -1px; } .blocklyTreeIconNone { background-position: -48px -1px; } .blocklyTreeSelected > .blocklyTreeIconClosedLtr { background-position: -32px -17px; } .blocklyTreeSelected > .blocklyTreeIconClosedRtl { background-position: 0px -17px; } .blocklyTreeSelected > .blocklyTreeIconOpen { background-position: -16px -17px; } .blocklyTreeSelected > .blocklyTreeIconNone { background-position: -48px -17px; } .blocklyTreeLabel { cursor: default; font-family: sans-serif; font-size: 16px; padding: 0px 3px; vertical-align: middle; } .blocklyTreeSelected { background-color: rgb(85, 119, 238) !important; } .blocklyTreeSelected .blocklyTreeLabel { color: rgb(255, 255, 255); } .blocklyArrow { font-size: 80%; } .goog-palette { outline: none; cursor: default; } .goog-palette-table { border: 1px solid rgb(102, 102, 102); border-collapse: collapse; } .goog-palette-cell { height: 25px; width: 25px; margin: 0px; border-width: 0px 1px 0px 0px; text-align: center; vertical-align: middle; border-right-style: solid; border-right-color: rgb(102, 102, 102); font-size: 1px; } .goog-palette-colorswatch { position: relative; height: 25px; width: 25px; border: 1px solid rgb(102, 102, 102); } .goog-palette-cell-hover .goog-palette-colorswatch { border: 1px solid rgb(255, 255, 255); } .goog-palette-cell-selected .goog-palette-colorswatch { border: 1px solid rgb(0, 0, 0); color: rgb(255, 255, 255); } .pln { color: rgb(0, 0, 0); } @media screen {   .str { color: rgb(0, 136, 0); }  .kwd { color: rgb(0, 0, 136); }  .com { color: rgb(136, 0, 0); } .typ { color: rgb(102, 0, 102); }  .lit { color: rgb(0, 102, 102); }  .pun, .opn, .clo { color: rgb(102, 102, 0); }  .tag { color: rgb(0, 0, 136); }  .atn { color: rgb(102, 0, 102); }  .atv { color: rgb(0, 136, 0); }  .dec, .var { color: rgb(102, 0, 102); }  .fun { color: red; }} @media print, projection {   .str { color: rgb(0, 102, 0); }  .kwd { color: rgb(0, 0, 102); font-weight: bold; }  .com { color: rgb(102, 0, 0); font-style: italic; }  .typ { color: rgb(68, 0, 68); font-weight: bold; }  .lit { color: rgb(0, 68, 68); }  .pun, .opn, .clo { color: rgb(68, 68, 0); }  .tag { color: rgb(0, 0, 102); font-weight: bold; }  .atn { color: rgb(68, 0, 68); }  .atv { color: rgb(0, 102, 0); }} pre.prettyprint { padding: 2px; border: 1px solid rgb(136, 136, 136); } ol.linenums { margin-top: 0px; margin-bottom: 0px; } li.L0, li.L1, li.L2, li.L3, li.L5, li.L6, li.L7, li.L8 { list-style-type: none; } li.L1, li.L3, li.L5, li.L7, li.L9 { background-color: rgb(238, 238, 238); background-position: initial initial; background-repeat: initial initial; }');
  
 //  goog.events.listen(Textly.editableJSDiv, goog.editor.Field.EventType.DELAYEDCHANGE, Textly.jsUpdated); 
  Textly.editableJSDiv.makeEditable();

  // populate editor
  Textly.updateEditableJS();
}

Textly.updateEditableJS = function () {
	
	// these lines duplicate updatedPrettyJS - combine if prettyJS sticks around
	// var outputDiv = document.getElementById('content_editablejavascript')
	var code = Blockly.Generator.workspaceToCode('JavaScript');
	var prettyCode = BlocklyApps.stripCode(code)
	Textly.editableJSDiv.setHtml(false, prettyCode, true);
	Textly.jsUpdated();	
}

Textly.jsUpdated = function () {
	var prettyCode = Textly.editableJSDiv.getElement().textContent;
	// var prettyCode = BlocklyApps.stripCode(strippedJSText);
	if (typeof prettyPrintOne == 'function') {
    prettyCode = prettyPrintOne(prettyCode, 'js');
    Textly.editableJSDiv.setHtml(false, prettyCode, true);
  } 

	console.log('js updated');
}


// CODE MIRROR TAB
Textly.codeMirror = null;

Textly.initializeCodeMirror = function () {
	var code = Blockly.Generator.workspaceToCode('JavaScript');
	var prettyCode = BlocklyApps.stripCode(code);
	var cmTextArea = document.getElementById('codeMirror-textArea');
	cmTextArea.value = prettyCode;
	Textly.codeMirror = CodeMirror.fromTextArea(cmTextArea, 
		{
		  mode: "javascript",
			lineNumbers: true,
			tabSize: 2
		});
}

Textly.updateCodeMirror = function () {
  Textly.updater = Textly.updateCodeMirror;
  if (Textly.codeMirror == null) {
    Textly.initializeCodeMirror();
  }
	var code = Blockly.Generator.workspaceToCode('JavaScript');
	var prettyCode = BlocklyApps.stripCode(code);
	Textly.codeMirror.setValue(prettyCode);
}

Textly.updatePython = function () {
	Textly.updater = Textly.updatePython;
	var outputDiv = document.getElementById('content_python')
  var code = Blockly.Generator.workspaceToCode('Python');
  var prettyCode = BlocklyApps.stripCode(code);
  outputDiv.textContent = prettyCode;
  if (typeof prettyPrintOne == 'function') {
    prettyCode = outputDiv.innerHTML;
    prettyCode = prettyPrintOne(prettyCode, 'py');
    outputDiv.innerHTML = prettyCode;
  }
}

Textly.updateXml = function () {
	Textly.updater = Textly.updateXml;
	var xmlTextarea = document.getElementById('content_xml');
  var xmlDom = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
  var xmlText = Blockly.Xml.domToPrettyText(xmlDom);
  xmlTextarea.value = xmlText;
  xmlTextarea.focus();
}


// THIS IS A TRIMMED DOWN VERION OF THE CODE APP TAB UI
/**
 * Create a namespace for the application.
 */
Textly.code = {};

/**
 * List of tab names.
 * @private
 */
Textly.code.TABS_ = ['javascript', 'editablejavascript', 'codeMirror', 'python', 'xml'];

Textly.code.selected = 'codeMirror';

/**
 * Switch the visible pane when a tab is clicked.
 * @param {string} id ID of tab clicked.
 */
Textly.code.tabClick = function(id) {
  // If the XML tab was open, save and render the content.
  if (document.getElementById('tab_xml').className == 'tabon') {
    var xmlTextarea = document.getElementById('content_xml');
    var xmlText = xmlTextarea.value;
    var xmlDom = null;
    try {
      xmlDom = Blockly.Xml.textToDom(xmlText);
    } catch (e) {
      var q =
          window.confirm(BlocklyApps.getMsg('Code_badXml').replace('%1', e));
      if (!q) {
        // Leave the user on the XML tab.
        return;
      }
    }
    if (xmlDom) {
      Blockly.mainWorkspace.clear();
      Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xmlDom);
    }
  }

  // If the editableJS tab was open, make uneditable, save and render the content.
  if (document.getElementById('tab_editablejavascript').className == 'tabon') {
  	
  	if (Textly.editableJSDiv.isModified()) {
  		console.log('js div was edited');
  	}

  	Textly.editableJSDiv.makeUneditable();
  }

  // Deselect all tabs and hide all panes.
  for (var x in Textly.code.TABS_) {
    var name = Textly.code.TABS_[x];
    document.getElementById('tab_' + name).className = 'taboff';
    document.getElementById('content_' + name).style.visibility = 'hidden';
  }

  // Select the active tab.
  Textly.code.selected = id.replace('tab_', '');
  document.getElementById(id).className = 'tabon';
  // Show the selected pane.
  document.getElementById('content_' + Textly.code.selected).style.visibility =
      'visible';
  Textly.code.renderContent();
  Blockly.fireUiEvent(window, 'resize');
};

/**
 * Populate the currently selected pane with content generated from the blocks.
 */
Textly.code.renderContent = function() {
  var content = document.getElementById('content_' + Textly.code.selected);
  // Initialize the pane.
  if (content.id == 'content_xml') {
  	Textly.updateXml();
  } else if (content.id == 'content_javascript') {
  	Textly.updatePrettyJS();
  } else if (content.id == 'content_editablejavascript') {
  	Textly.initializeEditableJS();
  } else if (content.id == 'content_codeMirror') {
  	Textly.updateCodeMirror();
  } else if (content.id == 'content_python') {
  	Textly.updatePython();
  }
};

/**
 * Initialize Blockly.  Called on page load.
 */
Textly.code.init = function() {

  // Add to reserved word list: Local variables in execution evironment (runJS)
  // and the infinite loop detection function.
  Blockly.JavaScript.addReservedWords('code,timeouts,checkTimeout');

  Textly.code.tabClick('tab_' + Textly.code.selected);
};

if (window.location.pathname.match(/readonly.html$/)) {
  window.addEventListener('load', BlocklyApps.initReadonly);
} else {
  window.addEventListener('load', Textly.code.init);
}



