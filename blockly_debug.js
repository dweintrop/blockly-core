var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.TRUSTED_SITE = true;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if(ctor.instance_) {
      return ctor.instance_
    }
    if(goog.DEBUG) {
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor
    }
    return ctor.instance_ = new ctor
  }
};
goog.instantiatedSingletons_ = [];
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      if(doc.readyState == "complete") {
        var isDeps = /\bdeps.js$/.test(src);
        if(isDeps) {
          return false
        }else {
          throw Error('Cannot write "' + src + '" after document load');
        }
      }
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call((value));
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && (typeof value.splice != "undefined" && (typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")))) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && (typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call"))) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = typeof val;
  return type == "object" && val != null || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + (Math.random() * 1E9 >>> 0);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return(fn.call.apply(fn.bind, arguments))
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = goog.TRUSTED_SITE && Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.getMsgWithFallback = function(a, b) {
  return a
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("Blockly.Names");
Blockly.Names = function(reservedWords) {
  this.reservedDict_ = {};
  if(reservedWords) {
    var splitWords = reservedWords.split(",");
    for(var x = 0;x < splitWords.length;x++) {
      this.reservedDict_[Blockly.Names.PREFIX_ + splitWords[x]] = true
    }
  }
  this.reset()
};
Blockly.Names.PREFIX_ = "$_";
Blockly.Names.prototype.reset = function() {
  this.db_ = {};
  this.dbReverse_ = {}
};
Blockly.Names.prototype.getName = function(name, type) {
  var normalized = Blockly.Names.PREFIX_ + name.toLowerCase() + "_" + type;
  if(normalized in this.db_) {
    return this.db_[normalized]
  }
  var safeName = this.getDistinctName(name, type);
  this.db_[normalized] = safeName;
  return safeName
};
Blockly.Names.prototype.getDistinctName = function(name, type) {
  var safeName = this.safeName_(name);
  var i = "";
  while(this.dbReverse_[Blockly.Names.PREFIX_ + safeName + i] || Blockly.Names.PREFIX_ + safeName + i in this.reservedDict_) {
    i = i ? i + 1 : 2
  }
  safeName += i;
  this.dbReverse_[Blockly.Names.PREFIX_ + safeName] = true;
  return safeName
};
Blockly.Names.prototype.safeName_ = function(name) {
  if(!name) {
    name = "unnamed"
  }else {
    name = encodeURI(name.replace(/ /g, "_")).replace(/[^\w]/g, "_");
    if("0123456789".indexOf(name[0]) != -1) {
      name = "my_" + name
    }
  }
  return name
};
Blockly.Names.equals = function(name1, name2) {
  return name1.toLowerCase() == name2.toLowerCase()
};
goog.provide("Blockly.Xml");
Blockly.Xml.workspaceToDom = function(workspace) {
  var width = Blockly.svgSize().width;
  var xml = Blockly.isMsie() ? document.createElementNS(null, "xml") : document.createElement("xml");
  var blocks = workspace.getTopBlocks(true);
  for(var i = 0, block;block = blocks[i];i++) {
    var element = Blockly.Xml.blockToDom_(block);
    xml.appendChild(element)
  }
  return xml
};
Blockly.Xml.blockToDom_ = function(block) {
  var element = goog.dom.createDom("block");
  element.setAttribute("type", block.type);
  if(block.mutationToDom) {
    var mutation = block.mutationToDom();
    if(mutation) {
      element.appendChild(mutation)
    }
  }
  function titleToDom(title) {
    if(title.name && title.EDITABLE) {
      var container = goog.dom.createDom("title", null, title.getValue());
      container.setAttribute("name", title.name);
      element.appendChild(container)
    }
  }
  for(var x = 0, input;input = block.inputList[x];x++) {
    for(var y = 0, title;title = input.titleRow[y];y++) {
      titleToDom(title)
    }
  }
  if(block.comment) {
    var commentElement = goog.dom.createDom("comment", null, block.comment.getText());
    commentElement.setAttribute("pinned", block.comment.isVisible());
    var hw = block.comment.getBubbleSize();
    commentElement.setAttribute("h", hw.height);
    commentElement.setAttribute("w", hw.width);
    element.appendChild(commentElement)
  }
  var hasValues = false;
  for(var i = 0, input;input = block.inputList[i];i++) {
    var container;
    var empty = true;
    if(input.type == Blockly.DUMMY_INPUT) {
      continue
    }else {
      var childBlock = input.connection.targetBlock();
      if(input.type == Blockly.INPUT_VALUE) {
        container = goog.dom.createDom("value");
        hasValues = true
      }else {
        if(input.type == Blockly.NEXT_STATEMENT) {
          container = goog.dom.createDom("statement")
        }
      }
      if(childBlock) {
        container.appendChild(Blockly.Xml.blockToDom_(childBlock));
        empty = false
      }
    }
    container.setAttribute("name", input.name);
    if(!empty) {
      element.appendChild(container)
    }
  }
  if(hasValues) {
    element.setAttribute("inline", block.inputsInline)
  }
  if(block.isCollapsed()) {
    element.setAttribute("collapsed", true)
  }
  if(block.disabled) {
    element.setAttribute("disabled", true)
  }
  if(!block.isDeletable()) {
    element.setAttribute("deletable", false)
  }
  if(!block.isMovable()) {
    element.setAttribute("movable", false)
  }
  if(!block.isEditable()) {
    element.setAttribute("editable", false)
  }
  if(block.nextConnection) {
    var nextBlock = block.nextConnection.targetBlock();
    if(nextBlock) {
      var container = goog.dom.createDom("next", null, Blockly.Xml.blockToDom_(nextBlock));
      element.appendChild(container)
    }
  }
  return element
};
Blockly.Xml.domToText = function(dom) {
  var oSerializer = new XMLSerializer;
  return oSerializer.serializeToString(dom)
};
Blockly.Xml.domToPrettyText = function(dom) {
  var blob = Blockly.Xml.domToText(dom);
  var lines = blob.split("<");
  var indent = "";
  for(var x = 1;x < lines.length;x++) {
    var line = lines[x];
    if(line[0] == "/") {
      indent = indent.substring(2)
    }
    lines[x] = indent + "<" + line;
    if(line[0] != "/" && line.slice(-2) != "/>") {
      indent += "  "
    }
  }
  var text = lines.join("\n");
  text = text.replace(/(<(\w+)\b[^>]*>[^\n]*)\n *<\/\2>/g, "$1</$2>");
  return text.replace(/^\n/, "")
};
Blockly.Xml.textToDom = function(text) {
  var oParser = new DOMParser;
  var dom = oParser.parseFromString(text, "text/xml");
  if(!dom || (!dom.firstChild || dom.firstChild.nodeName.toLowerCase() != "xml")) {
    throw"Blockly.Xml.textToDom did not obtain a valid XML tree.";
  }
  return dom.firstChild
};
Blockly.Xml.domToWorkspace = function(workspace, xml) {
  var width = Blockly.svgSize().width;
  for(var x = 0, xmlChild;xmlChild = xml.childNodes[x];x++) {
    if(xmlChild.nodeName.toLowerCase() == "block") {
      var block = Blockly.Xml.domToBlock_(workspace, xmlChild);
      var blockX = parseInt(xmlChild.getAttribute("x"), 10);
      var blockY = parseInt(xmlChild.getAttribute("y"), 10);
      if(!isNaN(blockX) && !isNaN(blockY)) {
        block.moveBy(Blockly.RTL ? width - blockX : blockX, blockY)
      }
    }
  }
};
Blockly.Xml.domToBlock_ = function(workspace, xmlBlock) {
  var prototypeName = xmlBlock.getAttribute("type");
  var id = xmlBlock.getAttribute("id");
  var block = new Blockly.Block(workspace, prototypeName, id);
  block.initSvg();
  var inline = xmlBlock.getAttribute("inline");
  if(inline) {
    block.setInputsInline(inline == "true")
  }
  var collapsed = xmlBlock.getAttribute("collapsed");
  if(collapsed) {
    block.setCollapsed(collapsed == "true")
  }
  var disabled = xmlBlock.getAttribute("disabled");
  if(disabled) {
    block.setDisabled(disabled == "true")
  }
  var deletable = xmlBlock.getAttribute("deletable");
  if(deletable) {
    block.setDeletable(deletable == "true")
  }
  var movable = xmlBlock.getAttribute("movable");
  if(movable) {
    block.setMovable(movable == "true")
  }
  var editable = xmlBlock.getAttribute("editable");
  if(editable) {
    block.setEditable(editable == "true")
  }
  var blockChild = null;
  for(var x = 0, xmlChild;xmlChild = xmlBlock.childNodes[x];x++) {
    if(xmlChild.nodeType == 3 && xmlChild.data.match(/^\s*$/)) {
      continue
    }
    var input;
    var firstRealGrandchild = null;
    for(var y = 0, grandchildNode;grandchildNode = xmlChild.childNodes[y];y++) {
      if(grandchildNode.nodeType != 3 || !grandchildNode.data.match(/^\s*$/)) {
        firstRealGrandchild = grandchildNode
      }
    }
    var name = xmlChild.getAttribute("name");
    switch(xmlChild.nodeName.toLowerCase()) {
      case "mutation":
        if(block.domToMutation) {
          block.domToMutation(xmlChild)
        }
        break;
      case "comment":
        block.setCommentText(xmlChild.textContent);
        var visible = xmlChild.getAttribute("pinned");
        if(visible) {
          block.comment.setVisible(visible == "true")
        }
        var bubbleW = parseInt(xmlChild.getAttribute("w"), 10);
        var bubbleH = parseInt(xmlChild.getAttribute("h"), 10);
        if(!isNaN(bubbleW) && !isNaN(bubbleH)) {
          block.comment.setBubbleSize(bubbleW, bubbleH)
        }
        break;
      case "title":
        block.setTitleValue(xmlChild.textContent, name);
        break;
      case "value":
      ;
      case "statement":
        input = block.getInput(name);
        if(!input) {
          throw"Input does not exist: " + name;
        }
        if(firstRealGrandchild && firstRealGrandchild.nodeName.toLowerCase() == "block") {
          blockChild = Blockly.Xml.domToBlock_(workspace, firstRealGrandchild);
          if(blockChild.outputConnection) {
            input.connection.connect(blockChild.outputConnection)
          }else {
            if(blockChild.previousConnection) {
              input.connection.connect(blockChild.previousConnection)
            }else {
              throw"Child block does not have output or previous statement.";
            }
          }
        }
        break;
      case "next":
        if(firstRealGrandchild && firstRealGrandchild.nodeName.toLowerCase() == "block") {
          if(!block.nextConnection) {
            throw"Next statement does not exist.";
          }else {
            if(block.nextConnection.targetConnection) {
              throw"Next statement is already connected.";
            }
          }
          blockChild = Blockly.Xml.domToBlock_(workspace, firstRealGrandchild);
          if(!blockChild.previousConnection) {
            throw"Next block does not have previous statement.";
          }
          block.nextConnection.connect(blockChild.previousConnection)
        }
        break;
      default:
    }
  }
  var next = block.nextConnection && block.nextConnection.targetBlock();
  if(next) {
    next.render()
  }else {
    block.render()
  }
  return block
};
Blockly.Xml.deleteNext = function(xmlBlock) {
  for(var x = 0, child;child = xmlBlock.childNodes[x];x++) {
    if(child.nodeName.toLowerCase() == "next") {
      xmlBlock.removeChild(child);
      break
    }
  }
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && (ch >= " " && ch <= "~") || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str))
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && (index < s.length && stringLength > 0)) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || (goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2]))
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  })
};
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, "-$1").toLowerCase()
};
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
  delimiters = delimiters ? "|[" + delimiters + "]+" : "";
  var regexp = new RegExp("(^" + delimiters + ")([a-z])", "g");
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase()
  })
};
goog.string.parseInt = function(value) {
  if(isFinite(value)) {
    value = String(value)
  }
  if(goog.isString(value)) {
    return/^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10)
  }
  return NaN
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.ASSUME_ANY_VERSION = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || (goog.userAgent.ASSUME_GECKO || (goog.userAgent.ASSUME_MOBILE_WEBKIT || (goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA)));
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && (!goog.userAgent.detectedWebkit_ && navigator.product == "Gecko")
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.ASSUME_ANDROID = false;
goog.userAgent.ASSUME_IPHONE = false;
goog.userAgent.ASSUME_IPAD = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || (goog.userAgent.ASSUME_WINDOWS || (goog.userAgent.ASSUME_LINUX || (goog.userAgent.ASSUME_X11 || (goog.userAgent.ASSUME_ANDROID || (goog.userAgent.ASSUME_IPHONE || goog.userAgent.ASSUME_IPAD)))));
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11");
  var ua = goog.userAgent.getUserAgentString();
  goog.userAgent.detectedAndroid_ = !!ua && ua.indexOf("Android") >= 0;
  goog.userAgent.detectedIPhone_ = !!ua && ua.indexOf("iPhone") >= 0;
  goog.userAgent.detectedIPad_ = !!ua && ua.indexOf("iPad") >= 0
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.ANDROID = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_ANDROID : goog.userAgent.detectedAndroid_;
goog.userAgent.IPHONE = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPHONE : goog.userAgent.detectedIPhone_;
goog.userAgent.IPAD = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPAD : goog.userAgent.detectedIPad_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.ASSUME_ANY_VERSION || (goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0))
};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.IE && goog.userAgent.DOCUMENT_MODE >= documentMode
};
goog.userAgent.DOCUMENT_MODE = function() {
  var doc = goog.global["document"];
  if(!doc || !goog.userAgent.IE) {
    return undefined
  }
  var mode = goog.userAgent.getDocumentMode_();
  return mode || (doc["compatMode"] == "CSS1Compat" ? parseInt(goog.userAgent.VERSION, 10) : 5)
}();
goog.provide("Blockly.Scrollbar");
goog.provide("Blockly.ScrollbarPair");
goog.require("goog.userAgent");
Blockly.ScrollbarPair = function(workspace) {
  this.workspace_ = workspace;
  this.oldHostMetrics_ = null;
  this.hScroll = new Blockly.Scrollbar(workspace, true, true);
  this.vScroll = new Blockly.Scrollbar(workspace, false, true);
  this.corner_ = Blockly.createSvgElement("rect", {"height":Blockly.Scrollbar.scrollbarThickness, "width":Blockly.Scrollbar.scrollbarThickness, "style":"fill: #fff"}, null);
  Blockly.Scrollbar.insertAfter_(this.corner_, workspace.getBubbleCanvas())
};
Blockly.ScrollbarPair.prototype.dispose = function() {
  Blockly.unbindEvent_(this.onResizeWrapper_);
  this.onResizeWrapper_ = null;
  goog.dom.removeNode(this.corner_);
  this.corner_ = null;
  this.workspace_ = null;
  this.oldHostMetrics_ = null;
  this.hScroll.dispose();
  this.hScroll = null;
  this.vScroll.dispose();
  this.vScroll = null
};
Blockly.ScrollbarPair.prototype.resize = function() {
  var hostMetrics = this.workspace_.getMetrics();
  if(!hostMetrics) {
    return
  }
  var resizeH = false;
  var resizeV = false;
  if(!this.oldHostMetrics_ || (this.oldHostMetrics_.viewWidth != hostMetrics.viewWidth || (this.oldHostMetrics_.viewHeight != hostMetrics.viewHeight || (this.oldHostMetrics_.absoluteTop != hostMetrics.absoluteTop || this.oldHostMetrics_.absoluteLeft != hostMetrics.absoluteLeft)))) {
    resizeH = true;
    resizeV = true
  }else {
    if(!this.oldHostMetrics_ || (this.oldHostMetrics_.contentWidth != hostMetrics.contentWidth || (this.oldHostMetrics_.viewLeft != hostMetrics.viewLeft || this.oldHostMetrics_.contentLeft != hostMetrics.contentLeft))) {
      resizeH = true
    }
    if(!this.oldHostMetrics_ || (this.oldHostMetrics_.contentHeight != hostMetrics.contentHeight || (this.oldHostMetrics_.viewTop != hostMetrics.viewTop || this.oldHostMetrics_.contentTop != hostMetrics.contentTop))) {
      resizeV = true
    }
  }
  if(resizeH) {
    this.hScroll.resize(hostMetrics)
  }
  if(resizeV) {
    this.vScroll.resize(hostMetrics)
  }
  if(!this.oldHostMetrics_ || (this.oldHostMetrics_.viewWidth != hostMetrics.viewWidth || this.oldHostMetrics_.absoluteLeft != hostMetrics.absoluteLeft)) {
    this.corner_.setAttribute("x", this.vScroll.xCoordinate)
  }
  if(!this.oldHostMetrics_ || (this.oldHostMetrics_.viewHeight != hostMetrics.viewHeight || this.oldHostMetrics_.absoluteTop != hostMetrics.absoluteTop)) {
    this.corner_.setAttribute("y", this.hScroll.yCoordinate)
  }
  this.oldHostMetrics_ = hostMetrics
};
Blockly.ScrollbarPair.prototype.set = function(x, y) {
  if(Blockly.Scrollbar === Blockly.ScrollbarNative) {
    this.hScroll.set(x, false);
    this.vScroll.set(y, false);
    var xyRatio = {};
    xyRatio.x = this.hScroll.outerDiv_.scrollLeft / this.hScroll.innerImg_.offsetWidth || 0;
    xyRatio.y = this.vScroll.outerDiv_.scrollTop / this.vScroll.innerImg_.offsetHeight || 0;
    this.workspace_.setMetrics(xyRatio)
  }else {
    this.hScroll.set(x, true);
    this.vScroll.set(y, true)
  }
};
Blockly.ScrollbarInterface = function() {
};
Blockly.ScrollbarInterface.prototype.dispose = function() {
};
Blockly.ScrollbarInterface.prototype.resize = function() {
};
Blockly.ScrollbarInterface.prototype.isVisible = function() {
};
Blockly.ScrollbarInterface.prototype.setVisible = function(visible) {
};
Blockly.ScrollbarInterface.prototype.set = function(value, fireEvents) {
};
Blockly.ScrollbarNative = function(workspace, horizontal, opt_pair) {
  this.workspace_ = workspace;
  this.pair_ = opt_pair || false;
  this.horizontal_ = horizontal;
  this.createDom_();
  if(horizontal === null) {
    return
  }
  if(!Blockly.Scrollbar.scrollbarThickness) {
    Blockly.ScrollbarNative.measureScrollbarThickness_(workspace)
  }
  if(horizontal) {
    this.foreignObject_.setAttribute("height", Blockly.Scrollbar.scrollbarThickness);
    this.outerDiv_.style.height = Blockly.Scrollbar.scrollbarThickness + "px";
    this.outerDiv_.style.overflowX = "scroll";
    this.outerDiv_.style.overflowY = "hidden";
    this.innerImg_.style.height = "1px"
  }else {
    this.foreignObject_.setAttribute("width", Blockly.Scrollbar.scrollbarThickness);
    this.outerDiv_.style.width = Blockly.Scrollbar.scrollbarThickness + "px";
    this.outerDiv_.style.overflowX = "hidden";
    this.outerDiv_.style.overflowY = "scroll";
    this.innerImg_.style.width = "1px"
  }
  var scrollbar = this;
  this.onScrollWrapper_ = Blockly.bindEvent_(this.outerDiv_, "scroll", scrollbar, function() {
    scrollbar.onScroll_()
  });
  Blockly.bindEvent_(this.foreignObject_, "mousedown", null, function(e) {
    Blockly.hideChaff(true);
    Blockly.noEvent(e)
  })
};
Blockly.ScrollbarNative.prototype.dispose = function() {
  Blockly.unbindEvent_(this.onResizeWrapper_);
  this.onResizeWrapper_ = null;
  Blockly.unbindEvent_(this.onScrollWrapper_);
  this.onScrollWrapper_ = null;
  goog.dom.removeNode(this.foreignObject_);
  this.foreignObject_ = null;
  this.workspace_ = null;
  this.outerDiv_ = null;
  this.innerImg_ = null
};
Blockly.ScrollbarNative.prototype.resize = function(opt_metrics) {
  var hostMetrics = opt_metrics;
  if(!hostMetrics) {
    hostMetrics = this.workspace_.getMetrics();
    if(!hostMetrics) {
      return
    }
  }
  if(this.horizontal_) {
    var outerLength = hostMetrics.viewWidth;
    if(this.pair_) {
      outerLength -= Blockly.Scrollbar.scrollbarThickness
    }else {
      this.setVisible(outerLength < hostMetrics.contentWidth)
    }
    this.ratio_ = outerLength / hostMetrics.viewWidth;
    var innerLength = this.ratio_ * hostMetrics.contentWidth;
    var innerOffset = (hostMetrics.viewLeft - hostMetrics.contentLeft) * this.ratio_;
    this.outerDiv_.style.width = outerLength + "px";
    this.innerImg_.style.width = innerLength + "px";
    this.xCoordinate = hostMetrics.absoluteLeft;
    if(this.pair_ && Blockly.RTL) {
      this.xCoordinate += Blockly.Scrollbar.scrollbarThickness
    }
    this.yCoordinate = hostMetrics.absoluteTop + hostMetrics.viewHeight - Blockly.Scrollbar.scrollbarThickness;
    this.foreignObject_.setAttribute("x", this.xCoordinate);
    this.foreignObject_.setAttribute("y", this.yCoordinate);
    this.foreignObject_.setAttribute("width", Math.max(0, outerLength));
    this.outerDiv_.scrollLeft = Math.round(innerOffset)
  }else {
    var outerLength = hostMetrics.viewHeight;
    if(this.pair_) {
      outerLength -= Blockly.Scrollbar.scrollbarThickness
    }else {
      this.setVisible(outerLength < hostMetrics.contentHeight)
    }
    this.ratio_ = outerLength / hostMetrics.viewHeight;
    var innerLength = this.ratio_ * hostMetrics.contentHeight;
    var innerOffset = (hostMetrics.viewTop - hostMetrics.contentTop) * this.ratio_;
    this.outerDiv_.style.height = outerLength + "px";
    this.innerImg_.style.height = innerLength + "px";
    this.xCoordinate = hostMetrics.absoluteLeft;
    if(!Blockly.RTL) {
      this.xCoordinate += hostMetrics.viewWidth - Blockly.Scrollbar.scrollbarThickness
    }
    this.yCoordinate = hostMetrics.absoluteTop;
    this.foreignObject_.setAttribute("x", this.xCoordinate);
    this.foreignObject_.setAttribute("y", this.yCoordinate);
    this.foreignObject_.setAttribute("height", Math.max(0, outerLength));
    this.outerDiv_.scrollTop = Math.round(innerOffset)
  }
};
Blockly.ScrollbarNative.prototype.createDom_ = function() {
  this.foreignObject_ = Blockly.createSvgElement("foreignObject", {}, null);
  var body = document.createElementNS(Blockly.HTML_NS, "body");
  body.setAttribute("xmlns", Blockly.HTML_NS);
  body.setAttribute("class", "blocklyMinimalBody");
  var outer = document.createElementNS(Blockly.HTML_NS, "div");
  this.outerDiv_ = outer;
  var inner = document.createElementNS(Blockly.HTML_NS, "img");
  inner.setAttribute("src", Blockly.assetUrl("media/1x1.gif"));
  this.innerImg_ = inner;
  outer.appendChild(inner);
  body.appendChild(outer);
  this.foreignObject_.appendChild(body);
  Blockly.Scrollbar.insertAfter_(this.foreignObject_, this.workspace_.getBubbleCanvas())
};
Blockly.ScrollbarNative.prototype.isVisible = function() {
  return this.foreignObject_.style.display != "none"
};
Blockly.ScrollbarNative.prototype.setVisible = function(visible) {
  if(visible == this.isVisible()) {
    return
  }
  if(this.pair_) {
    throw"Unable to toggle visibility of paired scrollbars.";
  }
  if(visible) {
    this.foreignObject_.style.display = "block";
    this.workspace_.getMetrics()
  }else {
    this.workspace_.setMetrics({x:0, y:0});
    this.foreignObject_.style.display = "none"
  }
};
Blockly.ScrollbarNative.prototype.onScroll_ = function() {
  var xyRatio = {};
  if(this.horizontal_) {
    xyRatio.x = this.outerDiv_.scrollLeft / this.innerImg_.offsetWidth || 0
  }else {
    xyRatio.y = this.outerDiv_.scrollTop / this.innerImg_.offsetHeight || 0
  }
  this.workspace_.setMetrics(xyRatio)
};
Blockly.ScrollbarNative.prototype.set = function(value, fireEvents) {
  if(!fireEvents && this.onScrollWrapper_) {
    var scrollFunc = Blockly.unbindEvent_(this.onScrollWrapper_)
  }
  if(this.horizontal_) {
    this.outerDiv_.scrollLeft = value * this.ratio_
  }else {
    this.outerDiv_.scrollTop = value * this.ratio_
  }
  if(scrollFunc) {
    var scrollbar = this;
    this.onScrollWrapper_ = Blockly.bindEvent_(this.outerDiv_, "scroll", scrollbar, scrollFunc)
  }
};
Blockly.ScrollbarNative.measureScrollbarThickness_ = function(workspace) {
  var testBar = new Blockly.ScrollbarNative(workspace, null, false);
  testBar.outerDiv_.style.width = "100px";
  testBar.outerDiv_.style.height = "100px";
  testBar.innerImg_.style.width = "100%";
  testBar.innerImg_.style.height = "200px";
  testBar.foreignObject_.setAttribute("width", 1);
  testBar.foreignObject_.setAttribute("height", 1);
  testBar.outerDiv_.style.overflowY = "scroll";
  var w1 = testBar.innerImg_.offsetWidth;
  testBar.outerDiv_.style.overflowY = "hidden";
  var w2 = testBar.innerImg_.offsetWidth;
  goog.dom.removeNode(testBar.foreignObject_);
  var thickness = w2 - w1;
  if(thickness <= 0) {
    thickness = 15
  }
  Blockly.Scrollbar.scrollbarThickness = thickness
};
Blockly.ScrollbarSvg = function(workspace, horizontal, opt_pair) {
  this.workspace_ = workspace;
  this.pair_ = opt_pair || false;
  this.horizontal_ = horizontal;
  this.createDom_();
  if(horizontal) {
    this.svgBackground_.setAttribute("height", Blockly.Scrollbar.scrollbarThickness);
    this.svgKnob_.setAttribute("height", Blockly.Scrollbar.scrollbarThickness - 6);
    this.svgKnob_.setAttribute("y", 3)
  }else {
    this.svgBackground_.setAttribute("width", Blockly.Scrollbar.scrollbarThickness);
    this.svgKnob_.setAttribute("width", Blockly.Scrollbar.scrollbarThickness - 6);
    this.svgKnob_.setAttribute("x", 3)
  }
  var scrollbar = this;
  this.onMouseDownBarWrapper_ = Blockly.bindEvent_(this.svgBackground_, "mousedown", scrollbar, scrollbar.onMouseDownBar_);
  this.onMouseDownKnobWrapper_ = Blockly.bindEvent_(this.svgKnob_, "mousedown", scrollbar, scrollbar.onMouseDownKnob_)
};
Blockly.ScrollbarSvg.prototype.dispose = function() {
  this.onMouseUpKnob_();
  if(this.onResizeWrapper_) {
    Blockly.unbindEvent_(this.onResizeWrapper_);
    this.onResizeWrapper_ = null
  }
  Blockly.unbindEvent_(this.onMouseDownBarWrapper_);
  this.onMouseDownBarWrapper_ = null;
  Blockly.unbindEvent_(this.onMouseDownKnobWrapper_);
  this.onMouseDownKnobWrapper_ = null;
  goog.dom.removeNode(this.svgGroup_);
  this.svgGroup_ = null;
  this.svgBackground_ = null;
  this.svgKnob_ = null;
  this.workspace_ = null
};
Blockly.ScrollbarSvg.prototype.resize = function(opt_metrics) {
  var hostMetrics = opt_metrics;
  if(!hostMetrics) {
    hostMetrics = this.workspace_.getMetrics();
    if(!hostMetrics) {
      return
    }
  }
  if(this.horizontal_) {
    var outerLength = hostMetrics.viewWidth;
    if(this.pair_) {
      outerLength -= Blockly.Scrollbar.scrollbarThickness
    }else {
      this.setVisible(outerLength < hostMetrics.contentHeight)
    }
    this.ratio_ = outerLength / hostMetrics.contentWidth;
    if(this.ratio_ === -Infinity || (this.ratio_ === Infinity || isNaN(this.ratio_))) {
      this.ratio_ = 0
    }
    var innerLength = hostMetrics.viewWidth * this.ratio_;
    var innerOffset = (hostMetrics.viewLeft - hostMetrics.contentLeft) * this.ratio_;
    this.svgKnob_.setAttribute("width", Math.max(0, innerLength));
    this.xCoordinate = hostMetrics.absoluteLeft;
    if(this.pair_ && Blockly.RTL) {
      this.xCoordinate += hostMetrics.absoluteLeft + Blockly.Scrollbar.scrollbarThickness
    }
    this.yCoordinate = hostMetrics.absoluteTop + hostMetrics.viewHeight - Blockly.Scrollbar.scrollbarThickness;
    this.svgGroup_.setAttribute("transform", "translate(" + this.xCoordinate + ", " + this.yCoordinate + ")");
    this.svgBackground_.setAttribute("width", Math.max(0, outerLength));
    this.svgKnob_.setAttribute("x", this.constrainKnob_(innerOffset))
  }else {
    var outerLength = hostMetrics.viewHeight;
    if(this.pair_) {
      outerLength -= Blockly.Scrollbar.scrollbarThickness
    }else {
      this.setVisible(outerLength < hostMetrics.contentHeight)
    }
    this.ratio_ = outerLength / hostMetrics.contentHeight;
    if(this.ratio_ === -Infinity || (this.ratio_ === Infinity || isNaN(this.ratio_))) {
      this.ratio_ = 0
    }
    var innerLength = hostMetrics.viewHeight * this.ratio_;
    var innerOffset = (hostMetrics.viewTop - hostMetrics.contentTop) * this.ratio_;
    this.svgKnob_.setAttribute("height", Math.max(0, innerLength));
    this.xCoordinate = hostMetrics.absoluteLeft;
    if(!Blockly.RTL) {
      this.xCoordinate += hostMetrics.viewWidth - Blockly.Scrollbar.scrollbarThickness
    }
    this.yCoordinate = hostMetrics.absoluteTop;
    this.svgGroup_.setAttribute("transform", "translate(" + this.xCoordinate + ", " + this.yCoordinate + ")");
    this.svgBackground_.setAttribute("height", Math.max(0, outerLength));
    this.svgKnob_.setAttribute("y", this.constrainKnob_(innerOffset))
  }
  this.onScroll_()
};
Blockly.ScrollbarSvg.prototype.createDom_ = function() {
  this.svgGroup_ = Blockly.createSvgElement("g", {}, null);
  this.svgBackground_ = Blockly.createSvgElement("rect", {"class":"blocklyScrollbarBackground"}, this.svgGroup_);
  var radius = Math.floor((Blockly.Scrollbar.scrollbarThickness - 6) / 2);
  this.svgKnob_ = Blockly.createSvgElement("rect", {"class":"blocklyScrollbarKnob", "rx":radius, "ry":radius}, this.svgGroup_);
  Blockly.Scrollbar.insertAfter_(this.svgGroup_, this.workspace_.getBubbleCanvas())
};
Blockly.ScrollbarSvg.prototype.isVisible = function() {
  return this.svgGroup_.getAttribute("display") != "none"
};
Blockly.ScrollbarSvg.prototype.setVisible = function(visible) {
  if(visible == this.isVisible()) {
    return
  }
  if(this.pair_) {
    throw"Unable to toggle visibility of paired scrollbars.";
  }
  if(visible) {
    this.svgGroup_.setAttribute("display", "block")
  }else {
    this.workspace_.setMetrics({x:0, y:0});
    this.svgGroup_.setAttribute("display", "none")
  }
};
Blockly.ScrollbarSvg.prototype.onMouseDownBar_ = function(e) {
  Blockly.hideChaff(true);
  if(Blockly.isRightButton(e)) {
    e.stopPropagation();
    return
  }
  var mouseXY = Blockly.mouseToSvg(e);
  var mouseLocation = this.horizontal_ ? mouseXY.x : mouseXY.y;
  var knobXY = Blockly.getSvgXY_(this.svgKnob_);
  var knobStart = this.horizontal_ ? knobXY.x : knobXY.y;
  var knobLength = parseFloat(this.svgKnob_.getAttribute(this.horizontal_ ? "width" : "height"));
  var knobValue = parseFloat(this.svgKnob_.getAttribute(this.horizontal_ ? "x" : "y"));
  var pageLength = knobLength * 0.95;
  if(mouseLocation <= knobStart) {
    knobValue -= pageLength
  }else {
    if(mouseLocation >= knobStart + knobLength) {
      knobValue += pageLength
    }
  }
  this.svgKnob_.setAttribute(this.horizontal_ ? "x" : "y", this.constrainKnob_(knobValue));
  this.onScroll_();
  e.stopPropagation()
};
Blockly.ScrollbarSvg.prototype.onMouseDownKnob_ = function(e) {
  Blockly.hideChaff(true);
  this.onMouseUpKnob_();
  if(Blockly.isRightButton(e)) {
    e.stopPropagation();
    return
  }
  this.startDragKnob = parseFloat(this.svgKnob_.getAttribute(this.horizontal_ ? "x" : "y"));
  this.startDragMouse = this.horizontal_ ? e.clientX : e.clientY;
  Blockly.ScrollbarSvg.onMouseUpWrapper_ = Blockly.bindEvent_(document, "mouseup", this, this.onMouseUpKnob_);
  Blockly.ScrollbarSvg.onMouseMoveWrapper_ = Blockly.bindEvent_(document, "mousemove", this, this.onMouseMoveKnob_);
  e.stopPropagation()
};
Blockly.ScrollbarSvg.prototype.onMouseMoveKnob_ = function(e) {
  var currentMouse = this.horizontal_ ? e.clientX : e.clientY;
  var mouseDelta = currentMouse - this.startDragMouse;
  var knobValue = this.startDragKnob + mouseDelta;
  this.svgKnob_.setAttribute(this.horizontal_ ? "x" : "y", this.constrainKnob_(knobValue));
  this.onScroll_()
};
Blockly.ScrollbarSvg.prototype.onMouseUpKnob_ = function() {
  if(Blockly.ScrollbarSvg.onMouseUpWrapper_) {
    Blockly.unbindEvent_(Blockly.ScrollbarSvg.onMouseUpWrapper_);
    Blockly.ScrollbarSvg.onMouseUpWrapper_ = null
  }
  if(Blockly.ScrollbarSvg.onMouseMoveWrapper_) {
    Blockly.unbindEvent_(Blockly.ScrollbarSvg.onMouseMoveWrapper_);
    Blockly.ScrollbarSvg.onMouseMoveWrapper_ = null
  }
};
Blockly.ScrollbarSvg.prototype.constrainKnob_ = function(value) {
  if(value <= 0 || isNaN(value)) {
    value = 0
  }else {
    var axis = this.horizontal_ ? "width" : "height";
    var barLength = parseFloat(this.svgBackground_.getAttribute(axis));
    var knobLength = parseFloat(this.svgKnob_.getAttribute(axis));
    value = Math.min(value, barLength - knobLength)
  }
  return value
};
Blockly.ScrollbarSvg.prototype.onScroll_ = function() {
  var knobValue = parseFloat(this.svgKnob_.getAttribute(this.horizontal_ ? "x" : "y"));
  var barLength = parseFloat(this.svgBackground_.getAttribute(this.horizontal_ ? "width" : "height"));
  var ratio = knobValue / barLength;
  if(isNaN(ratio)) {
    ratio = 0
  }
  var xyRatio = {};
  if(this.horizontal_) {
    xyRatio.x = ratio
  }else {
    xyRatio.y = ratio
  }
  this.workspace_.setMetrics(xyRatio)
};
Blockly.ScrollbarSvg.prototype.set = function(value, fireEvents) {
  this.svgKnob_.setAttribute(this.horizontal_ ? "x" : "y", value * this.ratio_);
  if(fireEvents) {
    this.onScroll_()
  }
};
if(goog.userAgent.GECKO && (goog.userAgent.MAC || goog.userAgent.LINUX)) {
  Blockly.Scrollbar = Blockly.ScrollbarNative;
  Blockly.Scrollbar.scrollbarThickness = 0
}else {
  Blockly.Scrollbar = Blockly.ScrollbarSvg;
  Blockly.Scrollbar.scrollbarThickness = 15
}
Blockly.Scrollbar.insertAfter_ = function(newNode, refNode) {
  var siblingNode = refNode.nextSibling;
  var parentNode = refNode.parentNode;
  if(!parentNode) {
    throw"Reference node has no parent.";
  }
  if(siblingNode) {
    parentNode.insertBefore(newNode, siblingNode)
  }else {
    parentNode.appendChild(newNode)
  }
};
goog.provide("Blockly.Trashcan");
Blockly.Trashcan = function(workspace) {
  this.workspace_ = workspace
};
Blockly.Trashcan.prototype.CLOSED_URL_ = "media/canclosed.png";
Blockly.Trashcan.prototype.OPEN_URL_ = "media/canopen.png";
Blockly.Trashcan.prototype.WIDTH_ = 70;
Blockly.Trashcan.prototype.HEIGHT_ = 70;
Blockly.Trashcan.prototype.MARGIN_TOP_ = 15;
Blockly.Trashcan.prototype.MARGIN_SIDE_ = 22;
Blockly.Trashcan.prototype.isOpen = false;
Blockly.Trashcan.prototype.radius = 50;
Blockly.Trashcan.prototype.svgGroup_ = null;
Blockly.Trashcan.prototype.svgClosedCan_ = null;
Blockly.Trashcan.prototype.svgOpenCan_ = null;
Blockly.Trashcan.prototype.left_ = 0;
Blockly.Trashcan.prototype.top_ = 0;
Blockly.Trashcan.prototype.createDom = function() {
  this.svgGroup_ = Blockly.createSvgElement("g", {"id":"trashcan", "filter":"url(#blocklyTrashcanShadowFilter)"}, null);
  this.svgClosedCan_ = Blockly.createSvgElement("image", {"width":this.WIDTH_, "height":this.HEIGHT_}, this.svgGroup_);
  this.svgClosedCan_.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", Blockly.assetUrl(this.CLOSED_URL_));
  this.svgOpenCan_ = Blockly.createSvgElement("image", {"width":this.WIDTH_, "height":this.HEIGHT_}, this.svgGroup_);
  this.svgOpenCan_.setAttribute("visibility", "hidden");
  this.svgOpenCan_.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", Blockly.assetUrl(this.OPEN_URL_));
  return this.svgGroup_
};
Blockly.Trashcan.prototype.init = function() {
  this.setOpen_(false);
  this.position_();
  Blockly.bindEvent_(window, "resize", this, this.position_)
};
Blockly.Trashcan.prototype.dispose = function() {
  if(this.svgGroup_) {
    goog.dom.removeNode(this.svgGroup_);
    this.svgGroup_ = null
  }
  this.svgClosedCan_ = null;
  this.svgOpenCan_ = null;
  this.workspace_ = null
};
Blockly.Trashcan.prototype.position_ = function() {
  var metrics = this.workspace_.getMetrics();
  if(!metrics) {
    return
  }
  if(Blockly.RTL) {
    this.left_ = this.MARGIN_SIDE_
  }else {
    this.left_ = metrics.viewWidth + metrics.absoluteLeft - this.WIDTH_ - this.MARGIN_SIDE_
  }
  this.top_ = this.MARGIN_TOP_;
  this.svgGroup_.setAttribute("transform", "translate(" + this.left_ + "," + this.top_ + ")")
};
Blockly.Trashcan.prototype.onMouseMove = function(e) {
  if(!this.svgGroup_) {
    return
  }
  var mouseXY = Blockly.mouseToSvg(e);
  var trashXY = Blockly.getSvgXY_(this.svgGroup_);
  if(Blockly.ieVersion() && Blockly.ieVersion() <= 10) {
    mouseXY = {"x":e.clientX, "y":e.clientY};
    var trashBB = document.getElementById("trashcan").getBoundingClientRect();
    trashXY = {"x":trashBB.left, "y":trashBB.top}
  }
  var over = mouseXY.x + this.radius > trashXY.x && (mouseXY.x < trashXY.x + this.WIDTH_ + this.radius && (mouseXY.y + this.radius > trashXY.y && mouseXY.y < trashXY.y + this.HEIGHT_ + this.radius));
  if(this.isOpen != over) {
    this.setOpen_(over)
  }
};
Blockly.Trashcan.prototype.setOpen_ = function(state) {
  if(this.isOpen == state) {
    return
  }
  this.isOpen = state;
  this.animateLid_()
};
Blockly.Trashcan.prototype.animateLid_ = function() {
  if(this.isOpen) {
    this.svgOpenCan_.setAttribute("visibility", "visible")
  }else {
    this.svgOpenCan_.setAttribute("visibility", "hidden")
  }
};
Blockly.Trashcan.prototype.close = function() {
  this.setOpen_(false)
};
goog.provide("Blockly.Workspace");
goog.require("Blockly.ScrollbarPair");
goog.require("Blockly.Trashcan");
goog.require("Blockly.Xml");
Blockly.Workspace = function(getMetrics, setMetrics) {
  this.getMetrics = getMetrics;
  this.setMetrics = setMetrics;
  this.isFlyout = false;
  this.topBlocks_ = [];
  this.maxBlocks = Infinity;
  Blockly.ConnectionDB.init(this)
};
Blockly.Workspace.SCAN_ANGLE = 3;
Blockly.Workspace.prototype.dragMode = false;
Blockly.Workspace.prototype.pageXOffset = 0;
Blockly.Workspace.prototype.pageYOffset = 0;
Blockly.Workspace.prototype.trashcan = null;
Blockly.Workspace.prototype.fireChangeEventPid_ = null;
Blockly.Workspace.prototype.scrollbar = null;
Blockly.Workspace.prototype.createDom = function() {
  this.svgGroup_ = Blockly.createSvgElement("g", {}, null);
  this.svgBlockCanvas_ = Blockly.createSvgElement("g", {}, this.svgGroup_);
  this.svgBubbleCanvas_ = Blockly.createSvgElement("g", {}, this.svgGroup_);
  this.fireChangeEvent();
  return this.svgGroup_
};
Blockly.Workspace.prototype.dispose = function() {
  if(this.svgGroup_) {
    goog.dom.removeNode(this.svgGroup_);
    this.svgGroup_ = null
  }
  this.svgBlockCanvas_ = null;
  this.svgBubbleCanvas_ = null;
  if(this.trashcan) {
    this.trashcan.dispose();
    this.trashcan = null
  }
};
Blockly.Workspace.prototype.addTrashcan = function() {
  if(Blockly.hasTrashcan && !Blockly.readOnly) {
    this.trashcan = new Blockly.Trashcan(this);
    var svgTrashcan = this.trashcan.createDom();
    this.svgGroup_.insertBefore(svgTrashcan, this.svgBlockCanvas_);
    this.trashcan.init()
  }
};
Blockly.Workspace.prototype.getCanvas = function() {
  return this.svgBlockCanvas_
};
Blockly.Workspace.prototype.getBubbleCanvas = function() {
  return this.svgBubbleCanvas_
};
Blockly.Workspace.prototype.addTopBlock = function(block) {
  this.topBlocks_.push(block);
  this.fireChangeEvent()
};
Blockly.Workspace.prototype.removeTopBlock = function(block) {
  var found = false;
  for(var child, x = 0;child = this.topBlocks_[x];x++) {
    if(child == block) {
      this.topBlocks_.splice(x, 1);
      found = true;
      break
    }
  }
  if(!found) {
    throw"Block not present in workspace's list of top-most blocks.";
  }
  this.fireChangeEvent()
};
Blockly.Workspace.prototype.getTopBlocks = function(ordered) {
  var blocks = [].concat(this.topBlocks_);
  if(ordered && blocks.length > 1) {
    var offset = Math.sin(Blockly.Workspace.SCAN_ANGLE / 180 * Math.PI);
    if(Blockly.RTL) {
      offset *= -1
    }
    blocks.sort(function(a, b) {
      var aXY = a.getRelativeToSurfaceXY();
      var bXY = b.getRelativeToSurfaceXY();
      return aXY.y + offset * aXY.x - (bXY.y + offset * bXY.x)
    })
  }
  return blocks
};
Blockly.Workspace.prototype.getAllBlocks = function() {
  var blocks = this.getTopBlocks(false);
  for(var x = 0;x < blocks.length;x++) {
    blocks = blocks.concat(blocks[x].getChildren())
  }
  return blocks
};
Blockly.Workspace.prototype.clear = function() {
  Blockly.hideChaff();
  while(this.topBlocks_.length) {
    this.topBlocks_[0].dispose()
  }
};
Blockly.Workspace.prototype.render = function() {
  var renderList = this.getAllBlocks();
  for(var x = 0, block;block = renderList[x];x++) {
    if(!block.getChildren().length) {
      block.render()
    }
  }
};
Blockly.Workspace.prototype.getBlockById = function(id) {
  var blocks = this.getAllBlocks();
  for(var x = 0, block;block = blocks[x];x++) {
    if(block.id == id) {
      return block
    }
  }
  return null
};
Blockly.Workspace.prototype.traceOn = function(armed) {
  this.traceOn_ = armed;
  if(this.traceWrapper_) {
    Blockly.unbindEvent_(this.traceWrapper_);
    this.traceWrapper_ = null
  }
  if(armed) {
    this.traceWrapper_ = Blockly.bindEvent_(this.svgBlockCanvas_, "blocklySelectChange", this, function() {
      this.traceOn_ = false
    })
  }
};
Blockly.Workspace.prototype.highlightBlock = function(id) {
  if(!this.traceOn_) {
    return
  }
  var block = null;
  if(id) {
    block = this.getBlockById(id);
    if(!block) {
      return
    }
  }
  this.traceOn(false);
  if(block) {
    block.select()
  }else {
    if(Blockly.selected) {
      Blockly.selected.unselect()
    }
  }
  this.traceOn(true)
};
Blockly.Workspace.prototype.fireChangeEvent = function() {
  if(this.fireChangeEventPid_) {
    window.clearTimeout(this.fireChangeEventPid_)
  }
  var canvas = this.svgBlockCanvas_;
  if(canvas) {
    this.fireChangeEventPid_ = window.setTimeout(function() {
      Blockly.fireUiEvent(canvas, "blocklyWorkspaceChange")
    }, 0)
  }
};
Blockly.Workspace.prototype.paste = function(xmlBlock) {
  if(xmlBlock.getElementsByTagName("block").length >= this.remainingCapacity()) {
    return
  }
  var block = Blockly.Xml.domToBlock_(this, xmlBlock);
  var blockX = parseInt(xmlBlock.getAttribute("x"), 10);
  var blockY = parseInt(xmlBlock.getAttribute("y"), 10);
  if(!isNaN(blockX) && !isNaN(blockY)) {
    if(Blockly.RTL) {
      blockX = -blockX
    }
    do {
      var collide = false;
      var allBlocks = this.getAllBlocks();
      for(var x = 0, otherBlock;otherBlock = allBlocks[x];x++) {
        var otherXY = otherBlock.getRelativeToSurfaceXY();
        if(Math.abs(blockX - otherXY.x) <= 1 && Math.abs(blockY - otherXY.y) <= 1) {
          if(Blockly.RTL) {
            blockX -= Blockly.SNAP_RADIUS
          }else {
            blockX += Blockly.SNAP_RADIUS
          }
          blockY += Blockly.SNAP_RADIUS * 2;
          collide = true
        }
      }
    }while(collide);
    block.moveBy(blockX, blockY)
  }
  block.select()
};
Blockly.Workspace.prototype.remainingCapacity = function() {
  if(this.maxBlocks == Infinity) {
    return Infinity
  }
  return this.maxBlocks - this.getAllBlocks().length
};
goog.provide("Blockly.BlockSvg");
goog.require("goog.userAgent");
Blockly.BlockSvg = function(block) {
  this.block_ = block;
  var options = {};
  if(block.htmlId) {
    options.id = block.htmlId
  }
  this.svgGroup_ = Blockly.createSvgElement("g", options, null);
  this.svgPathDark_ = Blockly.createSvgElement("path", {"class":"blocklyPathDark", "transform":"translate(1, 1)"}, this.svgGroup_);
  this.svgPath_ = Blockly.createSvgElement("path", {"class":"blocklyPath"}, this.svgGroup_);
  this.svgPathLight_ = Blockly.createSvgElement("path", {"class":"blocklyPathLight"}, this.svgGroup_);
  this.svgPath_.tooltip = this.block_;
  Blockly.Tooltip && Blockly.Tooltip.bindMouseEvents(this.svgPath_);
  this.updateMovable()
};
Blockly.BlockSvg.INLINE = -1;
Blockly.BlockSvg.prototype.init = function() {
  var block = this.block_;
  this.updateColour();
  for(var x = 0, input;input = block.inputList[x];x++) {
    input.init()
  }
  if(block.mutator) {
    block.mutator.createIcon()
  }
};
Blockly.BlockSvg.prototype.updateMovable = function() {
  if(this.block_.isMovable()) {
    Blockly.addClass_((this.svgGroup_), "blocklyDraggable")
  }else {
    Blockly.removeClass_((this.svgGroup_), "blocklyDraggable")
  }
};
Blockly.BlockSvg.prototype.getRootElement = function() {
  return this.svgGroup_
};
Blockly.BlockSvg.SEP_SPACE_X = 10;
Blockly.BlockSvg.SEP_SPACE_Y = 10;
Blockly.BlockSvg.INLINE_PADDING_Y = 5;
Blockly.BlockSvg.MIN_BLOCK_Y = 25;
Blockly.BlockSvg.TAB_HEIGHT = 20;
Blockly.BlockSvg.TAB_WIDTH = 8;
Blockly.BlockSvg.NOTCH_WIDTH = 30;
Blockly.BlockSvg.CORNER_RADIUS = 8;
Blockly.BlockSvg.TITLE_HEIGHT = 18;
Blockly.BlockSvg.DISTANCE_45_INSIDE = (1 - Math.SQRT1_2) * (Blockly.BlockSvg.CORNER_RADIUS - 1) + 1;
Blockly.BlockSvg.DISTANCE_45_OUTSIDE = (1 - Math.SQRT1_2) * (Blockly.BlockSvg.CORNER_RADIUS + 1) - 1;
Blockly.BlockSvg.NOTCH_PATH_LEFT = "l 6,4 3,0 6,-4";
Blockly.BlockSvg.NOTCH_PATH_LEFT_HIGHLIGHT = "l 6.5,4 2,0 6.5,-4";
Blockly.BlockSvg.NOTCH_PATH_RIGHT = "l -6,4 -3,0 -6,-4";
Blockly.BlockSvg.JAGGED_TEETH = "l 8,0 0,4 8,4 -16,8 8,4";
Blockly.BlockSvg.JAGGED_TEETH_HEIGHT = 20;
Blockly.BlockSvg.TAB_PATH_DOWN = "v 5 c 0,10 -" + Blockly.BlockSvg.TAB_WIDTH + ",-8 -" + Blockly.BlockSvg.TAB_WIDTH + ",7.5 s " + Blockly.BlockSvg.TAB_WIDTH + ",-2.5 " + Blockly.BlockSvg.TAB_WIDTH + ",7.5";
Blockly.BlockSvg.TAB_PATH_DOWN_HIGHLIGHT_RTL = "v 6.5 m -" + Blockly.BlockSvg.TAB_WIDTH * 0.98 + ",2.5 q -" + Blockly.BlockSvg.TAB_WIDTH * 0.05 + ",10 " + Blockly.BlockSvg.TAB_WIDTH * 0.27 + ",10 m " + Blockly.BlockSvg.TAB_WIDTH * 0.71 + ",-2.5 v 1.5";
Blockly.BlockSvg.TOP_LEFT_CORNER_START = "m 0," + Blockly.BlockSvg.CORNER_RADIUS;
Blockly.BlockSvg.TOP_LEFT_CORNER_START_HIGHLIGHT_RTL = "m " + Blockly.BlockSvg.DISTANCE_45_INSIDE + "," + Blockly.BlockSvg.DISTANCE_45_INSIDE;
Blockly.BlockSvg.TOP_LEFT_CORNER_START_HIGHLIGHT_LTR = "m 1," + (Blockly.BlockSvg.CORNER_RADIUS - 1);
Blockly.BlockSvg.TOP_LEFT_CORNER = "A " + Blockly.BlockSvg.CORNER_RADIUS + "," + Blockly.BlockSvg.CORNER_RADIUS + " 0 0,1 " + Blockly.BlockSvg.CORNER_RADIUS + ",0";
Blockly.BlockSvg.TOP_LEFT_CORNER_HIGHLIGHT = "A " + (Blockly.BlockSvg.CORNER_RADIUS - 1) + "," + (Blockly.BlockSvg.CORNER_RADIUS - 1) + " 0 0,1 " + Blockly.BlockSvg.CORNER_RADIUS + ",1";
Blockly.BlockSvg.INNER_TOP_LEFT_CORNER = Blockly.BlockSvg.NOTCH_PATH_RIGHT + " h -" + (Blockly.BlockSvg.NOTCH_WIDTH - 15 - Blockly.BlockSvg.CORNER_RADIUS) + " a " + Blockly.BlockSvg.CORNER_RADIUS + "," + Blockly.BlockSvg.CORNER_RADIUS + " 0 0,0 -" + Blockly.BlockSvg.CORNER_RADIUS + "," + Blockly.BlockSvg.CORNER_RADIUS;
Blockly.BlockSvg.INNER_BOTTOM_LEFT_CORNER = "a " + Blockly.BlockSvg.CORNER_RADIUS + "," + Blockly.BlockSvg.CORNER_RADIUS + " 0 0,0 " + Blockly.BlockSvg.CORNER_RADIUS + "," + Blockly.BlockSvg.CORNER_RADIUS;
Blockly.BlockSvg.INNER_TOP_LEFT_CORNER_HIGHLIGHT_RTL = "a " + (Blockly.BlockSvg.CORNER_RADIUS + 1) + "," + (Blockly.BlockSvg.CORNER_RADIUS + 1) + " 0 0,0 " + (-Blockly.BlockSvg.DISTANCE_45_OUTSIDE - 1) + "," + (Blockly.BlockSvg.CORNER_RADIUS - Blockly.BlockSvg.DISTANCE_45_OUTSIDE);
Blockly.BlockSvg.INNER_BOTTOM_LEFT_CORNER_HIGHLIGHT_RTL = "a " + (Blockly.BlockSvg.CORNER_RADIUS + 1) + "," + (Blockly.BlockSvg.CORNER_RADIUS + 1) + " 0 0,0 " + (Blockly.BlockSvg.CORNER_RADIUS + 1) + "," + (Blockly.BlockSvg.CORNER_RADIUS + 1);
Blockly.BlockSvg.INNER_BOTTOM_LEFT_CORNER_HIGHLIGHT_LTR = "a " + (Blockly.BlockSvg.CORNER_RADIUS + 1) + "," + (Blockly.BlockSvg.CORNER_RADIUS + 1) + " 0 0,0 " + (Blockly.BlockSvg.CORNER_RADIUS - Blockly.BlockSvg.DISTANCE_45_OUTSIDE) + "," + (Blockly.BlockSvg.DISTANCE_45_OUTSIDE + 1);
Blockly.BlockSvg.prototype.dispose = function() {
  goog.dom.removeNode(this.svgGroup_);
  this.svgGroup_ = null;
  this.svgPath_ = null;
  this.svgPathLight_ = null;
  this.svgPathDark_ = null;
  this.block_ = null
};
Blockly.BlockSvg.prototype.disposeUiEffect = function() {
  Blockly.playAudio("delete");
  var xy = Blockly.getSvgXY_((this.svgGroup_));
  var clone = this.svgGroup_.cloneNode(true);
  clone.translateX_ = xy.x;
  clone.translateY_ = xy.y;
  clone.setAttribute("transform", "translate(" + clone.translateX_ + "," + clone.translateY_ + ")");
  Blockly.svg.appendChild(clone);
  if(navigator.userAgent.indexOf("MSIE") >= 0 || navigator.userAgent.indexOf("Trident") >= 0) {
    clone.style.display = "inline";
    clone.bBox_ = {x:clone.getBBox().x, y:clone.getBBox().y, width:clone.scrollWidth, height:clone.scrollHeight}
  }else {
    clone.bBox_ = clone.getBBox()
  }
  clone.startDate_ = new Date;
  Blockly.BlockSvg.disposeUiStep_(clone)
};
Blockly.BlockSvg.disposeUiStep_ = function(clone) {
  var ms = new Date - clone.startDate_;
  var percent = ms / 150;
  if(percent > 1) {
    goog.dom.removeNode(clone)
  }else {
    var x = clone.translateX_ + (Blockly.RTL ? -1 : 1) * clone.bBox_.width / 2 * percent;
    var y = clone.translateY_ + clone.bBox_.height * percent;
    var translate = x + ", " + y;
    var scale = 1 - percent;
    clone.setAttribute("transform", "translate(" + translate + ")" + " scale(" + scale + ")");
    var closure = function() {
      Blockly.BlockSvg.disposeUiStep_(clone)
    };
    window.setTimeout(closure, 10)
  }
};
Blockly.BlockSvg.prototype.connectionUiEffect = function() {
  Blockly.playAudio("click");
  var xy = Blockly.getSvgXY_((this.svgGroup_));
  if(this.block_.outputConnection) {
    xy.x += Blockly.RTL ? 3 : -3;
    xy.y += 13
  }else {
    if(this.block_.previousConnection) {
      xy.x += Blockly.RTL ? -23 : 23;
      xy.y += 3
    }
  }
  var ripple = Blockly.createSvgElement("circle", {"cx":xy.x, "cy":xy.y, "r":0, "fill":"none", "stroke":"#888", "stroke-width":10}, Blockly.svg);
  ripple.startDate_ = new Date;
  Blockly.BlockSvg.connectionUiStep_(ripple)
};
Blockly.BlockSvg.connectionUiStep_ = function(ripple) {
  var ms = new Date - ripple.startDate_;
  var percent = ms / 150;
  if(percent > 1) {
    goog.dom.removeNode(ripple)
  }else {
    ripple.setAttribute("r", percent * 25);
    ripple.style.opacity = 1 - percent;
    var closure = function() {
      Blockly.BlockSvg.connectionUiStep_(ripple)
    };
    window.setTimeout(closure, 10)
  }
};
Blockly.BlockSvg.prototype.updateColour = function() {
  if(this.block_.disabled) {
    return
  }
  var hexColour = Blockly.makeColour(this.block_.getColour(), this.block_.getSaturation(), this.block_.getValue());
  var rgb = goog.color.hexToRgb(hexColour);
  var rgbLight = goog.color.lighten(rgb, 0.3);
  var rgbDark = goog.color.darken(rgb, 0.4);
  this.svgPathLight_.setAttribute("stroke", goog.color.rgbArrayToHex(rgbLight));
  this.svgPathDark_.setAttribute("fill", goog.color.rgbArrayToHex(rgbDark));
  this.svgPath_.setAttribute("fill", hexColour)
};
Blockly.BlockSvg.prototype.updateDisabled = function() {
  if(this.block_.disabled || this.block_.getInheritedDisabled()) {
    Blockly.addClass_((this.svgGroup_), "blocklyDisabled");
    this.svgPath_.setAttribute("fill", "url(#blocklyDisabledPattern)")
  }else {
    Blockly.removeClass_((this.svgGroup_), "blocklyDisabled");
    this.updateColour()
  }
  var children = this.block_.getChildren();
  for(var x = 0, child;child = children[x];x++) {
    child.svg_.updateDisabled()
  }
};
Blockly.BlockSvg.prototype.addSelect = function() {
  Blockly.addClass_((this.svgGroup_), "blocklySelected");
  this.svgGroup_.parentNode.appendChild(this.svgGroup_)
};
Blockly.BlockSvg.prototype.addSelectNoMove = function() {
  Blockly.addClass_((this.svgGroup_), "blocklySelected")
};
Blockly.BlockSvg.prototype.removeSelect = function() {
  Blockly.removeClass_((this.svgGroup_), "blocklySelected")
};
Blockly.BlockSvg.prototype.addDragging = function() {
  Blockly.addClass_((this.svgGroup_), "blocklyDragging")
};
Blockly.BlockSvg.prototype.removeDragging = function() {
  Blockly.removeClass_((this.svgGroup_), "blocklyDragging")
};
Blockly.BlockSvg.prototype.render = function() {
  this.block_.rendered = true;
  var cursorX = Blockly.BlockSvg.SEP_SPACE_X;
  if(Blockly.RTL) {
    cursorX = -cursorX
  }
  var icons = this.block_.getIcons();
  for(var x = 0;x < icons.length;x++) {
    cursorX = icons[x].renderIcon(cursorX)
  }
  cursorX += Blockly.RTL ? Blockly.BlockSvg.SEP_SPACE_X : -Blockly.BlockSvg.SEP_SPACE_X;
  var inputRows = this.renderCompute_(cursorX);
  this.renderDraw_(cursorX, inputRows);
  var parentBlock = this.block_.getParent();
  if(parentBlock) {
    parentBlock.render()
  }else {
    Blockly.fireUiEvent(window, "resize")
  }
};
Blockly.BlockSvg.prototype.renderTitles_ = function(titleList, cursorX, cursorY) {
  if(Blockly.RTL) {
    cursorX = -cursorX
  }
  for(var t = 0, title;title = titleList[t];t++) {
    var titleSize = title.getSize();
    var titleWidth = titleSize.width;
    if(Blockly.RTL) {
      cursorX -= titleWidth;
      title.getRootElement().setAttribute("transform", "translate(" + cursorX + ", " + cursorY + ")");
      if(titleWidth) {
        cursorX -= Blockly.BlockSvg.SEP_SPACE_X
      }
    }else {
      title.getRootElement().setAttribute("transform", "translate(" + cursorX + ", " + cursorY + ")");
      if(titleWidth) {
        cursorX += titleWidth + Blockly.BlockSvg.SEP_SPACE_X
      }
    }
  }
  return Blockly.RTL ? -cursorX : cursorX
};
Blockly.BlockSvg.prototype.renderCompute_ = function(iconWidth) {
  var inputList = this.block_.inputList;
  var inputRows = [];
  inputRows.rightEdge = iconWidth + Blockly.BlockSvg.SEP_SPACE_X * 2;
  if(this.block_.previousConnection || this.block_.nextConnection) {
    inputRows.rightEdge = Math.max(inputRows.rightEdge, Blockly.BlockSvg.NOTCH_WIDTH + Blockly.BlockSvg.SEP_SPACE_X)
  }
  var titleValueWidth = 0;
  var titleStatementWidth = 0;
  var hasValue = false;
  var hasStatement = false;
  var hasDummy = false;
  var lastType = undefined;
  var isInline = this.block_.inputsInline && !this.block_.isCollapsed();
  for(var i = 0, input;input = inputList[i];i++) {
    if(!input.isVisible()) {
      continue
    }
    var row;
    if(!isInline || (!lastType || (lastType == Blockly.NEXT_STATEMENT || input.type == Blockly.NEXT_STATEMENT))) {
      lastType = input.type;
      row = [];
      if(isInline && input.type != Blockly.NEXT_STATEMENT) {
        row.type = Blockly.BlockSvg.INLINE
      }else {
        row.type = input.type
      }
      row.height = 0;
      inputRows.push(row)
    }else {
      row = inputRows[inputRows.length - 1]
    }
    row.push(input);
    input.renderHeight = Blockly.BlockSvg.MIN_BLOCK_Y;
    if(isInline && input.type == Blockly.INPUT_VALUE) {
      input.renderWidth = Blockly.BlockSvg.TAB_WIDTH + Blockly.BlockSvg.SEP_SPACE_X
    }else {
      input.renderWidth = 0
    }
    if(input.connection && input.connection.targetConnection) {
      var linkedBlock = input.connection.targetBlock();
      var bBox = linkedBlock.getHeightWidth();
      input.renderHeight = Math.max(input.renderHeight, bBox.height);
      input.renderWidth = Math.max(input.renderWidth, bBox.width)
    }
    row.height = Math.max(row.height, input.renderHeight);
    input.titleWidth = 0;
    if(inputRows.length == 1) {
      input.titleWidth += Blockly.RTL ? -iconWidth : iconWidth
    }
    for(var j = 0, title;title = input.titleRow[j];j++) {
      if(j != 0) {
        input.titleWidth += Blockly.BlockSvg.SEP_SPACE_X
      }
      var titleSize = title.getSize();
      input.titleWidth += titleSize.width;
      row.height = Math.max(row.height, titleSize.height)
    }
    if(row.type != Blockly.BlockSvg.INLINE) {
      if(row.type == Blockly.NEXT_STATEMENT) {
        hasStatement = true;
        titleStatementWidth = Math.max(titleStatementWidth, input.titleWidth)
      }else {
        if(row.type == Blockly.INPUT_VALUE) {
          hasValue = true
        }else {
          if(row.type == Blockly.DUMMY_INPUT) {
            hasDummy = true
          }
        }
        titleValueWidth = Math.max(titleValueWidth, input.titleWidth)
      }
    }
  }
  for(var y = 0, row;row = inputRows[y];y++) {
    row.thicker = false;
    if(row.type == Blockly.BlockSvg.INLINE) {
      for(var z = 0, input;input = row[z];z++) {
        if(input.type == Blockly.INPUT_VALUE) {
          row.height += 2 * Blockly.BlockSvg.INLINE_PADDING_Y;
          row.thicker = true;
          break
        }
      }
    }
  }
  inputRows.statementEdge = 2 * Blockly.BlockSvg.SEP_SPACE_X + titleStatementWidth;
  if(hasStatement) {
    inputRows.rightEdge = Math.max(inputRows.rightEdge, inputRows.statementEdge + Blockly.BlockSvg.NOTCH_WIDTH)
  }
  if(hasValue) {
    inputRows.rightEdge = Math.max(inputRows.rightEdge, titleValueWidth + Blockly.BlockSvg.SEP_SPACE_X * 2 + Blockly.BlockSvg.TAB_WIDTH)
  }else {
    if(hasDummy) {
      inputRows.rightEdge = Math.max(inputRows.rightEdge, titleValueWidth + Blockly.BlockSvg.SEP_SPACE_X * 2)
    }
  }
  inputRows.hasValue = hasValue;
  inputRows.hasStatement = hasStatement;
  inputRows.hasDummy = hasDummy;
  return inputRows
};
Blockly.BlockSvg.prototype.renderDraw_ = function(iconWidth, inputRows) {
  if(this.block_.outputConnection) {
    this.squareTopLeftCorner_ = true;
    this.squareBottomLeftCorner_ = true
  }else {
    this.squareTopLeftCorner_ = false;
    this.squareBottomLeftCorner_ = false;
    if(this.block_.previousConnection) {
      var prevBlock = this.block_.previousConnection.targetBlock();
      if(prevBlock && (prevBlock.nextConnection && prevBlock.nextConnection.targetConnection == this.block_.previousConnection)) {
        this.squareTopLeftCorner_ = true
      }
    }
    if(this.block_.nextConnection) {
      var nextBlock = this.block_.nextConnection.targetBlock();
      if(nextBlock && (nextBlock.previousConnection && nextBlock.previousConnection.targetConnection == this.block_.nextConnection)) {
        this.squareBottomLeftCorner_ = true
      }
    }
  }
  var connectionsXY = this.block_.getRelativeToSurfaceXY();
  var steps = [];
  var inlineSteps = [];
  var highlightSteps = [];
  var highlightInlineSteps = [];
  this.renderDrawTop_(steps, highlightSteps, connectionsXY, inputRows.rightEdge);
  var cursorY = this.renderDrawRight_(steps, highlightSteps, inlineSteps, highlightInlineSteps, connectionsXY, inputRows, iconWidth);
  this.renderDrawBottom_(steps, highlightSteps, connectionsXY, cursorY);
  this.renderDrawLeft_(steps, highlightSteps, connectionsXY, cursorY);
  var pathString = steps.join(" ") + "\n" + inlineSteps.join(" ");
  this.svgPath_.setAttribute("d", pathString);
  this.svgPathDark_.setAttribute("d", pathString);
  pathString = highlightSteps.join(" ") + "\n" + highlightInlineSteps.join(" ");
  this.svgPathLight_.setAttribute("d", pathString);
  if(Blockly.RTL) {
    this.svgPath_.setAttribute("transform", "scale(-1 1)");
    this.svgPathLight_.setAttribute("transform", "scale(-1 1)");
    this.svgPathDark_.setAttribute("transform", "translate(1,1) scale(-1 1)")
  }
};
Blockly.BlockSvg.prototype.renderDrawTop_ = function(steps, highlightSteps, connectionsXY, rightEdge) {
  if(this.squareTopLeftCorner_) {
    steps.push("m 0,0");
    highlightSteps.push("m 1,1")
  }else {
    steps.push(Blockly.BlockSvg.TOP_LEFT_CORNER_START);
    highlightSteps.push(Blockly.RTL ? Blockly.BlockSvg.TOP_LEFT_CORNER_START_HIGHLIGHT_RTL : Blockly.BlockSvg.TOP_LEFT_CORNER_START_HIGHLIGHT_LTR);
    steps.push(Blockly.BlockSvg.TOP_LEFT_CORNER);
    highlightSteps.push(Blockly.BlockSvg.TOP_LEFT_CORNER_HIGHLIGHT)
  }
  if(Blockly.BROKEN_CONTROL_POINTS) {
    steps.push("c 0,5 0,-5 0,0")
  }
  if(this.block_.previousConnection) {
    steps.push("H", Blockly.BlockSvg.NOTCH_WIDTH - 15);
    highlightSteps.push("H", Blockly.BlockSvg.NOTCH_WIDTH - 15);
    steps.push(Blockly.BlockSvg.NOTCH_PATH_LEFT);
    highlightSteps.push(Blockly.BlockSvg.NOTCH_PATH_LEFT_HIGHLIGHT);
    var connectionX = connectionsXY.x + (Blockly.RTL ? -Blockly.BlockSvg.NOTCH_WIDTH : Blockly.BlockSvg.NOTCH_WIDTH);
    var connectionY = connectionsXY.y;
    this.block_.previousConnection.moveTo(connectionX, connectionY)
  }
  steps.push("H", rightEdge);
  highlightSteps.push("H", rightEdge + (Blockly.RTL ? -1 : 0))
};
Blockly.BlockSvg.prototype.renderDrawRight_ = function(steps, highlightSteps, inlineSteps, highlightInlineSteps, connectionsXY, inputRows, iconWidth) {
  var cursorX;
  var cursorY = 0;
  var connectionX, connectionY;
  for(var y = 0, row;row = inputRows[y];y++) {
    cursorX = Blockly.BlockSvg.SEP_SPACE_X;
    if(y == 0) {
      cursorX += Blockly.RTL ? -iconWidth : iconWidth
    }
    highlightSteps.push("M", inputRows.rightEdge - 1 + "," + (cursorY + 1));
    if(this.block_.isCollapsed()) {
      var input = row[0];
      var titleX = cursorX;
      var titleY = cursorY + Blockly.BlockSvg.TITLE_HEIGHT;
      this.renderTitles_(input.titleRow, titleX, titleY);
      steps.push(Blockly.BlockSvg.JAGGED_TEETH);
      if(Blockly.RTL) {
        highlightSteps.push("l 8,0 0,3.8 7,3.2 m -14.5,9 l 8,4")
      }else {
        highlightSteps.push("h 8")
      }
      var remainder = row.height - Blockly.BlockSvg.JAGGED_TEETH_HEIGHT;
      steps.push("v", remainder);
      if(Blockly.RTL) {
        highlightSteps.push("v", remainder - 2)
      }
    }else {
      if(row.type == Blockly.BlockSvg.INLINE) {
        for(var x = 0, input;input = row[x];x++) {
          var titleX = cursorX;
          var titleY = cursorY + Blockly.BlockSvg.TITLE_HEIGHT;
          if(row.thicker) {
            titleY += Blockly.BlockSvg.INLINE_PADDING_Y
          }
          cursorX = this.renderTitles_(input.titleRow, titleX, titleY);
          if(input.type != Blockly.DUMMY_INPUT) {
            cursorX += input.renderWidth + Blockly.BlockSvg.SEP_SPACE_X
          }
          if(input.type == Blockly.INPUT_VALUE) {
            inlineSteps.push("M", cursorX - Blockly.BlockSvg.SEP_SPACE_X + "," + (cursorY + Blockly.BlockSvg.INLINE_PADDING_Y));
            inlineSteps.push("h", Blockly.BlockSvg.TAB_WIDTH - input.renderWidth);
            inlineSteps.push(Blockly.BlockSvg.TAB_PATH_DOWN);
            inlineSteps.push("v", input.renderHeight - Blockly.BlockSvg.TAB_HEIGHT);
            inlineSteps.push("h", input.renderWidth - Blockly.BlockSvg.TAB_WIDTH);
            inlineSteps.push("z");
            if(Blockly.RTL) {
              highlightInlineSteps.push("M", cursorX - Blockly.BlockSvg.SEP_SPACE_X + Blockly.BlockSvg.TAB_WIDTH - input.renderWidth - 1 + "," + (cursorY + Blockly.BlockSvg.INLINE_PADDING_Y + 1));
              highlightInlineSteps.push(Blockly.BlockSvg.TAB_PATH_DOWN_HIGHLIGHT_RTL);
              highlightInlineSteps.push("v", input.renderHeight - Blockly.BlockSvg.TAB_HEIGHT + 2);
              highlightInlineSteps.push("h", input.renderWidth - Blockly.BlockSvg.TAB_WIDTH)
            }else {
              highlightInlineSteps.push("M", cursorX - Blockly.BlockSvg.SEP_SPACE_X + 1 + "," + (cursorY + Blockly.BlockSvg.INLINE_PADDING_Y + 1));
              highlightInlineSteps.push("v", input.renderHeight);
              highlightInlineSteps.push("h", Blockly.BlockSvg.TAB_WIDTH - input.renderWidth);
              highlightInlineSteps.push("M", cursorX - input.renderWidth - Blockly.BlockSvg.SEP_SPACE_X + 3.8 + "," + (cursorY + Blockly.BlockSvg.INLINE_PADDING_Y + Blockly.BlockSvg.TAB_HEIGHT - 0.4));
              highlightInlineSteps.push("l", Blockly.BlockSvg.TAB_WIDTH * 0.42 + ",-1.8")
            }
            if(Blockly.RTL) {
              connectionX = connectionsXY.x - cursorX - Blockly.BlockSvg.TAB_WIDTH + Blockly.BlockSvg.SEP_SPACE_X + input.renderWidth - 1
            }else {
              connectionX = connectionsXY.x + cursorX + Blockly.BlockSvg.TAB_WIDTH - Blockly.BlockSvg.SEP_SPACE_X - input.renderWidth + 1
            }
            connectionY = connectionsXY.y + cursorY + Blockly.BlockSvg.INLINE_PADDING_Y;
            input.connection.moveTo(connectionX, connectionY);
            if(input.connection.targetConnection) {
              input.connection.tighten_()
            }
          }
        }
        cursorX = Math.max(cursorX, inputRows.rightEdge);
        steps.push("H", cursorX);
        highlightSteps.push("H", cursorX + (Blockly.RTL ? -1 : 0));
        steps.push("v", row.height);
        if(Blockly.RTL) {
          highlightSteps.push("v", row.height - 2)
        }
      }else {
        if(row.type == Blockly.INPUT_VALUE) {
          var input = row[0];
          var titleX = cursorX;
          var titleY = cursorY + Blockly.BlockSvg.TITLE_HEIGHT;
          if(input.align != Blockly.ALIGN_LEFT) {
            var titleRightX = inputRows.rightEdge - input.titleWidth - Blockly.BlockSvg.TAB_WIDTH - 2 * Blockly.BlockSvg.SEP_SPACE_X;
            if(input.align == Blockly.ALIGN_RIGHT) {
              titleX += titleRightX
            }else {
              if(input.align == Blockly.ALIGN_CENTRE) {
                titleX += (titleRightX + titleX) / 2
              }
            }
          }
          this.renderTitles_(input.titleRow, titleX, titleY);
          steps.push(Blockly.BlockSvg.TAB_PATH_DOWN);
          steps.push("v", row.height - Blockly.BlockSvg.TAB_HEIGHT);
          if(Blockly.RTL) {
            highlightSteps.push(Blockly.BlockSvg.TAB_PATH_DOWN_HIGHLIGHT_RTL);
            highlightSteps.push("v", row.height - Blockly.BlockSvg.TAB_HEIGHT)
          }else {
            highlightSteps.push("M", inputRows.rightEdge - 4.2 + "," + (cursorY + Blockly.BlockSvg.TAB_HEIGHT - 0.4));
            highlightSteps.push("l", Blockly.BlockSvg.TAB_WIDTH * 0.42 + ",-1.8")
          }
          connectionX = connectionsXY.x + (Blockly.RTL ? -inputRows.rightEdge - 1 : inputRows.rightEdge + 1);
          connectionY = connectionsXY.y + cursorY;
          input.connection.moveTo(connectionX, connectionY);
          if(input.connection.targetConnection) {
            input.connection.tighten_()
          }
        }else {
          if(row.type == Blockly.DUMMY_INPUT) {
            var input = row[0];
            var titleX = cursorX;
            var titleY = cursorY + Blockly.BlockSvg.TITLE_HEIGHT;
            if(input.align != Blockly.ALIGN_LEFT) {
              var titleRightX = inputRows.rightEdge - input.titleWidth - 2 * Blockly.BlockSvg.SEP_SPACE_X;
              if(inputRows.hasValue) {
                titleRightX -= Blockly.BlockSvg.TAB_WIDTH
              }
              if(input.align == Blockly.ALIGN_RIGHT) {
                titleX += titleRightX
              }else {
                if(input.align == Blockly.ALIGN_CENTRE) {
                  titleX += (titleRightX + titleX) / 2
                }
              }
            }
            this.renderTitles_(input.titleRow, titleX, titleY);
            steps.push("v", row.height);
            if(Blockly.RTL) {
              highlightSteps.push("v", row.height - 2)
            }
          }else {
            if(row.type == Blockly.NEXT_STATEMENT) {
              var input = row[0];
              if(y == 0) {
                steps.push("v", Blockly.BlockSvg.SEP_SPACE_Y);
                if(Blockly.RTL) {
                  highlightSteps.push("v", Blockly.BlockSvg.SEP_SPACE_Y - 1)
                }
                cursorY += Blockly.BlockSvg.SEP_SPACE_Y
              }
              var titleX = cursorX;
              var titleY = cursorY + Blockly.BlockSvg.TITLE_HEIGHT;
              if(input.align != Blockly.ALIGN_LEFT) {
                var titleRightX = inputRows.statementEdge - input.titleWidth - 2 * Blockly.BlockSvg.SEP_SPACE_X;
                if(input.align == Blockly.ALIGN_RIGHT) {
                  titleX += titleRightX
                }else {
                  if(input.align == Blockly.ALIGN_CENTRE) {
                    titleX += (titleRightX + titleX) / 2
                  }
                }
              }
              this.renderTitles_(input.titleRow, titleX, titleY);
              cursorX = inputRows.statementEdge + Blockly.BlockSvg.NOTCH_WIDTH;
              steps.push("H", cursorX);
              steps.push(Blockly.BlockSvg.INNER_TOP_LEFT_CORNER);
              steps.push("v", row.height - 2 * Blockly.BlockSvg.CORNER_RADIUS);
              steps.push(Blockly.BlockSvg.INNER_BOTTOM_LEFT_CORNER);
              steps.push("H", inputRows.rightEdge);
              if(Blockly.RTL) {
                highlightSteps.push("M", cursorX - Blockly.BlockSvg.NOTCH_WIDTH + Blockly.BlockSvg.DISTANCE_45_OUTSIDE + "," + (cursorY + Blockly.BlockSvg.DISTANCE_45_OUTSIDE));
                highlightSteps.push(Blockly.BlockSvg.INNER_TOP_LEFT_CORNER_HIGHLIGHT_RTL);
                highlightSteps.push("v", row.height - 2 * Blockly.BlockSvg.CORNER_RADIUS);
                highlightSteps.push(Blockly.BlockSvg.INNER_BOTTOM_LEFT_CORNER_HIGHLIGHT_RTL);
                highlightSteps.push("H", inputRows.rightEdge - 1)
              }else {
                highlightSteps.push("M", cursorX - Blockly.BlockSvg.NOTCH_WIDTH + Blockly.BlockSvg.DISTANCE_45_OUTSIDE + "," + (cursorY + row.height - Blockly.BlockSvg.DISTANCE_45_OUTSIDE));
                highlightSteps.push(Blockly.BlockSvg.INNER_BOTTOM_LEFT_CORNER_HIGHLIGHT_LTR);
                highlightSteps.push("H", inputRows.rightEdge)
              }
              connectionX = connectionsXY.x + (Blockly.RTL ? -cursorX : cursorX);
              connectionY = connectionsXY.y + cursorY + 1;
              input.connection.moveTo(connectionX, connectionY);
              if(input.connection.targetConnection) {
                input.connection.tighten_()
              }
              if(y == inputRows.length - 1 || inputRows[y + 1].type == Blockly.NEXT_STATEMENT) {
                steps.push("v", Blockly.BlockSvg.SEP_SPACE_Y);
                if(Blockly.RTL) {
                  highlightSteps.push("v", Blockly.BlockSvg.SEP_SPACE_Y - 1)
                }
                cursorY += Blockly.BlockSvg.SEP_SPACE_Y
              }
            }
          }
        }
      }
    }
    cursorY += row.height
  }
  if(!inputRows.length) {
    cursorY = Blockly.BlockSvg.MIN_BLOCK_Y;
    steps.push("V", cursorY);
    if(Blockly.RTL) {
      highlightSteps.push("V", cursorY - 1)
    }
  }
  return cursorY
};
Blockly.BlockSvg.prototype.renderDrawBottom_ = function(steps, highlightSteps, connectionsXY, cursorY) {
  if(this.block_.nextConnection) {
    steps.push("H", Blockly.BlockSvg.NOTCH_WIDTH + " " + Blockly.BlockSvg.NOTCH_PATH_RIGHT);
    var connectionX;
    if(Blockly.RTL) {
      connectionX = connectionsXY.x - Blockly.BlockSvg.NOTCH_WIDTH
    }else {
      connectionX = connectionsXY.x + Blockly.BlockSvg.NOTCH_WIDTH
    }
    var connectionY = connectionsXY.y + cursorY + 1;
    this.block_.nextConnection.moveTo(connectionX, connectionY);
    if(this.block_.nextConnection.targetConnection) {
      this.block_.nextConnection.tighten_()
    }
  }
  if(Blockly.BROKEN_CONTROL_POINTS) {
    steps.push("c 0,5 0,-5 0,0")
  }
  if(this.squareBottomLeftCorner_) {
    steps.push("H 0");
    if(!Blockly.RTL) {
      highlightSteps.push("M", "1," + cursorY)
    }
  }else {
    steps.push("H", Blockly.BlockSvg.CORNER_RADIUS);
    steps.push("a", Blockly.BlockSvg.CORNER_RADIUS + "," + Blockly.BlockSvg.CORNER_RADIUS + " 0 0,1 -" + Blockly.BlockSvg.CORNER_RADIUS + ",-" + Blockly.BlockSvg.CORNER_RADIUS);
    if(!Blockly.RTL) {
      highlightSteps.push("M", Blockly.BlockSvg.DISTANCE_45_INSIDE + "," + (cursorY - Blockly.BlockSvg.DISTANCE_45_INSIDE));
      highlightSteps.push("A", Blockly.BlockSvg.CORNER_RADIUS - 1 + "," + (Blockly.BlockSvg.CORNER_RADIUS - 1) + " 0 0,1 " + "1," + (cursorY - Blockly.BlockSvg.CORNER_RADIUS))
    }
  }
};
Blockly.BlockSvg.prototype.renderDrawLeft_ = function(steps, highlightSteps, connectionsXY, cursorY) {
  if(this.block_.outputConnection) {
    this.block_.outputConnection.moveTo(connectionsXY.x, connectionsXY.y);
    steps.push("V", Blockly.BlockSvg.TAB_HEIGHT);
    steps.push("c 0,-10 -" + Blockly.BlockSvg.TAB_WIDTH + ",8 -" + Blockly.BlockSvg.TAB_WIDTH + ",-7.5 s " + Blockly.BlockSvg.TAB_WIDTH + ",2.5 " + Blockly.BlockSvg.TAB_WIDTH + ",-7.5");
    if(Blockly.RTL) {
      highlightSteps.push("M", Blockly.BlockSvg.TAB_WIDTH * -0.3 + ",8.9");
      highlightSteps.push("l", Blockly.BlockSvg.TAB_WIDTH * -0.45 + ",-2.1")
    }else {
      highlightSteps.push("V", Blockly.BlockSvg.TAB_HEIGHT - 1);
      highlightSteps.push("m", Blockly.BlockSvg.TAB_WIDTH * -0.92 + ",-1 q " + Blockly.BlockSvg.TAB_WIDTH * -0.19 + ",-5.5 0,-11");
      highlightSteps.push("m", Blockly.BlockSvg.TAB_WIDTH * 0.92 + ",1 V 1 H 2")
    }
  }else {
    if(!Blockly.RTL) {
      if(this.squareTopLeftCorner_) {
        highlightSteps.push("V", 1)
      }else {
        highlightSteps.push("V", Blockly.BlockSvg.CORNER_RADIUS)
      }
    }
  }
  steps.push("z")
};
goog.provide("Blockly.Field");
goog.require("Blockly.BlockSvg");
Blockly.Field = function(text) {
  this.sourceBlock_ = null;
  this.fieldGroup_ = Blockly.createSvgElement("g", {}, null);
  this.borderRect_ = Blockly.createSvgElement("rect", {"rx":4, "ry":4, "x":-Blockly.BlockSvg.SEP_SPACE_X / 2, "y":-12, "height":16}, this.fieldGroup_);
  this.textElement_ = Blockly.createSvgElement("text", {"class":"blocklyText"}, this.fieldGroup_);
  this.size_ = {height:25, width:0};
  this.setText(text);
  this.visible_ = true
};
Blockly.Field.NBSP = "\u00a0";
Blockly.Field.prototype.EDITABLE = true;
Blockly.Field.prototype.init = function(block) {
  if(this.sourceBlock_) {
    throw"Field has already been initialized once.";
  }
  this.sourceBlock_ = block;
  this.updateEditable();
  block.getSvgRoot().appendChild(this.fieldGroup_);
  this.mouseUpWrapper_ = Blockly.bindEvent_(this.fieldGroup_, "mouseup", this, this.onMouseUp_);
  this.setText(null)
};
Blockly.Field.prototype.dispose = function() {
  if(this.mouseUpWrapper_) {
    Blockly.unbindEvent_(this.mouseUpWrapper_);
    this.mouseUpWrapper_ = null
  }
  this.sourceBlock_ = null;
  goog.dom.removeNode(this.fieldGroup_);
  this.fieldGroup_ = null;
  this.textElement_ = null;
  this.borderRect_ = null
};
Blockly.Field.prototype.updateEditable = function() {
  if(!this.EDITABLE) {
    return
  }
  if(this.sourceBlock_.isEditable()) {
    Blockly.addClass_((this.fieldGroup_), "blocklyEditableText");
    Blockly.removeClass_((this.fieldGroup_), "blocklyNoNEditableText");
    this.fieldGroup_.style.cursor = this.CURSOR
  }else {
    Blockly.addClass_((this.fieldGroup_), "blocklyNonEditableText");
    Blockly.removeClass_((this.fieldGroup_), "blocklyEditableText");
    this.fieldGroup_.style.cursor = ""
  }
};
Blockly.Field.prototype.isVisible = function() {
  return this.visible_
};
Blockly.Field.prototype.setVisible = function(visible) {
  this.visible_ = visible;
  this.getRootElement().style.display = visible ? "block" : "none"
};
Blockly.Field.prototype.getRootElement = function() {
  return(this.fieldGroup_)
};
Blockly.Field.prototype.render_ = function() {
  var width;
  if(this.textElement_.getComputedTextLength) {
    width = this.textElement_.getComputedTextLength()
  }else {
    width = 1
  }
  if(this.borderRect_) {
    this.borderRect_.setAttribute("width", width + Blockly.BlockSvg.SEP_SPACE_X)
  }
  this.size_.width = width
};
Blockly.Field.prototype.getSize = function() {
  if(!this.size_.width) {
    this.render_()
  }
  return this.size_
};
Blockly.Field.prototype.getText = function() {
  return this.text_
};
Blockly.Field.prototype.setText = function(text) {
  if(text === null || text === this.text_) {
    return
  }
  this.text_ = text;
  goog.dom.removeChildren((this.textElement_));
  text = text.replace(/\s/g, Blockly.Field.NBSP);
  if(!text) {
    text = Blockly.Field.NBSP
  }
  var textNode = document.createTextNode(text);
  this.textElement_.appendChild(textNode);
  this.size_.width = 0;
  if(this.sourceBlock_ && this.sourceBlock_.rendered) {
    this.sourceBlock_.render();
    this.sourceBlock_.bumpNeighbours_();
    this.sourceBlock_.workspace.fireChangeEvent()
  }
};
Blockly.Field.prototype.getValue = function() {
  return this.getText()
};
Blockly.Field.prototype.setValue = function(text) {
  this.setText(text)
};
Blockly.Field.prototype.onMouseUp_ = function(e) {
  if(Blockly.isRightButton(e)) {
    return
  }else {
    if(Blockly.Block.dragMode_ == 2) {
      return
    }else {
      if(this.sourceBlock_.isEditable()) {
        this.showEditor_()
      }
    }
  }
};
Blockly.Field.prototype.setTooltip = function(newTip) {
};
goog.provide("Blockly.FieldDropdown");
goog.require("Blockly.Field");
Blockly.FieldDropdown = function(menuGenerator, opt_changeHandler) {
  this.menuGenerator_ = menuGenerator;
  this.changeHandler_ = opt_changeHandler;
  this.trimOptions_();
  var firstTuple = this.getOptions_()[0];
  this.value_ = firstTuple[1];
  this.arrow_ = Blockly.createSvgElement("tspan", {"class":"blocklyArrow"}, null);
  this.arrow_.appendChild(document.createTextNode(Blockly.RTL ? "\u25bc " : " \u25bc"));
  Blockly.FieldDropdown.superClass_.constructor.call(this, firstTuple[0])
};
goog.inherits(Blockly.FieldDropdown, Blockly.Field);
Blockly.FieldDropdown.createDom = function() {
  var svgGroup = Blockly.createSvgElement("g", {"class":"blocklyHidden blocklyFieldDropdown"}, null);
  Blockly.FieldDropdown.svgGroup_ = svgGroup;
  Blockly.FieldDropdown.svgShadow_ = Blockly.createSvgElement("rect", {"class":"blocklyDropdownMenuShadow", "x":0, "y":1, "rx":2, "ry":2}, svgGroup);
  Blockly.FieldDropdown.svgBackground_ = Blockly.createSvgElement("rect", {"x":-2, "y":-1, "rx":2, "ry":2, "filter":"url(#blocklyEmboss)"}, svgGroup);
  Blockly.FieldDropdown.svgOptions_ = Blockly.createSvgElement("g", {"class":"blocklyDropdownMenuOptions"}, svgGroup);
  return svgGroup
};
Blockly.FieldDropdown.prototype.dispose = function() {
  if(Blockly.FieldDropdown.openDropdown_ == this) {
    Blockly.FieldDropdown.hide()
  }
  Blockly.Field.prototype.dispose.call(this)
};
Blockly.FieldDropdown.CORNER_RADIUS = 2;
Blockly.FieldDropdown.prototype.CURSOR = "default";
Blockly.FieldDropdown.openDropdown_ = null;
Blockly.FieldDropdown.prototype.showEditor_ = function() {
  var svgGroup = Blockly.FieldDropdown.svgGroup_;
  var svgOptions = Blockly.FieldDropdown.svgOptions_;
  var svgBackground = Blockly.FieldDropdown.svgBackground_;
  var svgShadow = Blockly.FieldDropdown.svgShadow_;
  goog.dom.removeChildren(svgOptions);
  Blockly.removeClass_(svgGroup, "blocklyHidden");
  Blockly.FieldDropdown.openDropdown_ = this;
  function callbackFactory(value) {
    return function(e) {
      if(this.changeHandler_) {
        var override = this.changeHandler_(value);
        if(override !== undefined) {
          value = override
        }
      }
      if(value !== null) {
        this.setValue(value)
      }
      e.stopPropagation()
    }
  }
  var maxWidth = 0;
  var resizeList = [];
  var checkElement = null;
  var options = this.getOptions_();
  for(var x = 0;x < options.length;x++) {
    var text = options[x][0];
    var value = options[x][1];
    var gElement = Blockly.ContextMenu.optionToDom(text);
    var rectElement = (gElement.firstChild);
    var textElement = (gElement.lastChild);
    svgOptions.appendChild(gElement);
    if(!checkElement && value == this.value_) {
      checkElement = Blockly.createSvgElement("text", {"class":"blocklyMenuText", "y":15}, null);
      gElement.insertBefore(checkElement, textElement);
      checkElement.appendChild(document.createTextNode("\u2713"))
    }
    gElement.setAttribute("transform", "translate(0, " + x * Blockly.ContextMenu.Y_HEIGHT + ")");
    resizeList.push(rectElement);
    Blockly.bindEvent_(gElement, "mousedown", null, Blockly.noEvent);
    Blockly.bindEvent_(gElement, "mouseup", this, callbackFactory(value));
    Blockly.bindEvent_(gElement, "mouseup", null, Blockly.FieldDropdown.hide);
    if(textElement.getComputedTextLength) {
      maxWidth = Math.max(maxWidth, textElement.getComputedTextLength())
    }else {
      maxWidth = 1
    }
  }
  maxWidth += Blockly.ContextMenu.X_PADDING * 2;
  for(var x = 0;x < resizeList.length;x++) {
    resizeList[x].setAttribute("width", maxWidth)
  }
  if(Blockly.RTL) {
    for(var x = 0, gElement;gElement = svgOptions.childNodes[x];x++) {
      var textElement = gElement.lastChild;
      textElement.setAttribute("text-anchor", "end");
      textElement.setAttribute("x", maxWidth - Blockly.ContextMenu.X_PADDING)
    }
  }
  if(checkElement) {
    if(Blockly.RTL) {
      checkElement.setAttribute("text-anchor", "end");
      checkElement.setAttribute("x", maxWidth - 5)
    }else {
      checkElement.setAttribute("x", 5)
    }
  }
  var width = maxWidth + Blockly.FieldDropdown.CORNER_RADIUS * 2;
  var height = options.length * Blockly.ContextMenu.Y_HEIGHT + Blockly.FieldDropdown.CORNER_RADIUS + 1;
  svgShadow.setAttribute("width", width);
  svgShadow.setAttribute("height", height);
  svgBackground.setAttribute("width", width);
  svgBackground.setAttribute("height", height);
  var hexColour = Blockly.makeColour(this.sourceBlock_.getColour(), this.sourceBlock_.getSaturation(), this.sourceBlock_.getValue());
  svgBackground.setAttribute("fill", hexColour);
  var xy = Blockly.getSvgXY_((this.borderRect_));
  if(navigator.userAgent.indexOf("MSIE") >= 0 || navigator.userAgent.indexOf("Trident") >= 0) {
    this.borderRect_.style.display = "inline";
    var borderBBox = {x:this.borderRect_.getBBox().x, y:this.borderRect_.getBBox().y, width:this.borderRect_.scrollWidth, height:this.borderRect_.scrollHeight}
  }else {
    var borderBBox = this.borderRect_.getBBox()
  }
  var x;
  if(Blockly.RTL) {
    x = xy.x - maxWidth + Blockly.ContextMenu.X_PADDING + borderBBox.width - Blockly.BlockSvg.SEP_SPACE_X / 2
  }else {
    x = xy.x - Blockly.ContextMenu.X_PADDING + Blockly.BlockSvg.SEP_SPACE_X / 2
  }
  svgGroup.setAttribute("transform", "translate(" + x + ", " + (xy.y + borderBBox.height) + ")")
};
Blockly.FieldDropdown.prototype.trimOptions_ = function() {
  this.prefixTitle = null;
  this.suffixTitle = null;
  var options = this.menuGenerator_;
  if(!goog.isArray(options) || options.length < 2) {
    return
  }
  var strings = options.map(function(t) {
    return t[0]
  });
  var shortest = Blockly.shortestStringLength(strings);
  var prefixLength = Blockly.commonWordPrefix(strings, shortest);
  var suffixLength = Blockly.commonWordSuffix(strings, shortest);
  if(!prefixLength && !suffixLength) {
    return
  }
  if(shortest <= prefixLength + suffixLength) {
    return
  }
  if(prefixLength) {
    this.prefixTitle = strings[0].substring(0, prefixLength - 1)
  }
  if(suffixLength) {
    this.suffixTitle = strings[0].substr(1 - suffixLength)
  }
  var newOptions = [];
  for(var x = 0;x < options.length;x++) {
    var text = options[x][0];
    var value = options[x][1];
    text = text.substring(prefixLength, text.length - suffixLength);
    newOptions[x] = [text, value]
  }
  this.menuGenerator_ = newOptions
};
Blockly.FieldDropdown.prototype.getOptions_ = function() {
  if(goog.isFunction(this.menuGenerator_)) {
    return this.menuGenerator_.call(this)
  }
  return(this.menuGenerator_)
};
Blockly.FieldDropdown.prototype.getValue = function() {
  return this.value_
};
Blockly.FieldDropdown.prototype.setValue = function(newValue) {
  this.value_ = newValue;
  var options = this.getOptions_();
  for(var x = 0;x < options.length;x++) {
    if(options[x][1] == newValue) {
      this.setText(options[x][0]);
      return
    }
  }
  this.setText(newValue)
};
Blockly.FieldDropdown.prototype.setText = function(text) {
  if(this.sourceBlock_) {
    this.arrow_.style.fill = Blockly.makeColour(this.sourceBlock_.getColour(), this.sourceBlock_.getSaturation(), this.sourceBlock_.getValue())
  }
  if(text === null) {
    return
  }
  this.text_ = text;
  goog.dom.removeChildren((this.textElement_));
  text = text.replace(/\s/g, Blockly.Field.NBSP);
  if(!text) {
    text = Blockly.Field.NBSP
  }
  var textNode = document.createTextNode(text);
  this.textElement_.appendChild(textNode);
  if(Blockly.RTL) {
    this.textElement_.insertBefore(this.arrow_, this.textElement_.firstChild)
  }else {
    this.textElement_.appendChild(this.arrow_)
  }
  this.size_.width = 0;
  if(this.sourceBlock_ && this.sourceBlock_.rendered) {
    this.sourceBlock_.render();
    this.sourceBlock_.bumpNeighbours_();
    this.sourceBlock_.workspace.fireChangeEvent()
  }
};
Blockly.FieldDropdown.hide = function() {
  var svgGroup = Blockly.FieldDropdown.svgGroup_;
  if(svgGroup) {
    Blockly.addClass_(svgGroup, "blocklyHidden")
  }
  Blockly.FieldDropdown.openDropdown_ = null
};
goog.provide("Blockly.Msg");
goog.provide("goog.string.StringBuffer");
goog.string.StringBuffer = function(opt_a1, var_args) {
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.buffer_ = "";
goog.string.StringBuffer.prototype.set = function(s) {
  this.buffer_ = "" + s
};
goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
  this.buffer_ += a1;
  if(opt_a2 != null) {
    for(var i = 1;i < arguments.length;i++) {
      this.buffer_ += arguments[i]
    }
  }
  return this
};
goog.string.StringBuffer.prototype.clear = function() {
  this.buffer_ = ""
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.buffer_.length
};
goog.string.StringBuffer.prototype.toString = function() {
  return this.buffer_
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.object.createImmutableView = function(obj) {
  var result = obj;
  if(Object.isFrozen && !Object.isFrozen(obj)) {
    result = Object.create(obj);
    Object.freeze(result)
  }
  return result
};
goog.object.isImmutableView = function(obj) {
  return!!Object.isFrozen && Object.isFrozen(obj)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
  return(value)
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = goog.TRUSTED_SITE;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.count = function(arr, f, opt_obj) {
  var count = 0;
  goog.array.forEach(arr, function(element, index, arr) {
    if(f.call(opt_obj, element, index, arr)) {
      ++count
    }
  }, opt_obj);
  return count
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.toArray = function(object) {
  var length = object.length;
  if(length > 0) {
    var rv = new Array(length);
    for(var i = 0;i < length;i++) {
      rv[i] = object[i]
    }
    return rv
  }
  return[]
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && Object.prototype.hasOwnProperty.call(arr2, "callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || (!goog.isArrayLike(arr2) || arr1.length != arr2.length)) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.toObject = function(arr, keyFunc, opt_obj) {
  var ret = {};
  goog.array.forEach(arr, function(element, index) {
    ret[keyFunc.call(opt_obj, element, index, arr)] = element
  });
  return ret
};
goog.array.range = function(startOrEnd, opt_end, opt_step) {
  var array = [];
  var start = 0;
  var end = startOrEnd;
  var step = opt_step || 1;
  if(opt_end !== undefined) {
    start = startOrEnd;
    end = opt_end
  }
  if(step * (end - start) < 0) {
    return[]
  }
  if(step > 0) {
    for(var i = start;i < end;i += step) {
      array.push(i)
    }
  }else {
    for(var i = start;i > end;i += step) {
      array.push(i)
    }
  }
  return array
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.math");
goog.require("goog.array");
goog.require("goog.asserts");
goog.math.randomInt = function(a) {
  return Math.floor(Math.random() * a)
};
goog.math.uniformRandom = function(a, b) {
  return a + Math.random() * (b - a)
};
goog.math.clamp = function(value, min, max) {
  return Math.min(Math.max(value, min), max)
};
goog.math.modulo = function(a, b) {
  var r = a % b;
  return r * b < 0 ? r + b : r
};
goog.math.lerp = function(a, b, x) {
  return a + x * (b - a)
};
goog.math.nearlyEquals = function(a, b, opt_tolerance) {
  return Math.abs(a - b) <= (opt_tolerance || 1E-6)
};
goog.math.standardAngle = function(angle) {
  return goog.math.modulo(angle, 360)
};
goog.math.toRadians = function(angleDegrees) {
  return angleDegrees * Math.PI / 180
};
goog.math.toDegrees = function(angleRadians) {
  return angleRadians * 180 / Math.PI
};
goog.math.angleDx = function(degrees, radius) {
  return radius * Math.cos(goog.math.toRadians(degrees))
};
goog.math.angleDy = function(degrees, radius) {
  return radius * Math.sin(goog.math.toRadians(degrees))
};
goog.math.angle = function(x1, y1, x2, y2) {
  return goog.math.standardAngle(goog.math.toDegrees(Math.atan2(y2 - y1, x2 - x1)))
};
goog.math.angleDifference = function(startAngle, endAngle) {
  var d = goog.math.standardAngle(endAngle) - goog.math.standardAngle(startAngle);
  if(d > 180) {
    d = d - 360
  }else {
    if(d <= -180) {
      d = 360 + d
    }
  }
  return d
};
goog.math.sign = function(x) {
  return x == 0 ? 0 : x < 0 ? -1 : 1
};
goog.math.longestCommonSubsequence = function(array1, array2, opt_compareFn, opt_collectorFn) {
  var compare = opt_compareFn || function(a, b) {
    return a == b
  };
  var collect = opt_collectorFn || function(i1, i2) {
    return array1[i1]
  };
  var length1 = array1.length;
  var length2 = array2.length;
  var arr = [];
  for(var i = 0;i < length1 + 1;i++) {
    arr[i] = [];
    arr[i][0] = 0
  }
  for(var j = 0;j < length2 + 1;j++) {
    arr[0][j] = 0
  }
  for(i = 1;i <= length1;i++) {
    for(j = 1;j <= length1;j++) {
      if(compare(array1[i - 1], array2[j - 1])) {
        arr[i][j] = arr[i - 1][j - 1] + 1
      }else {
        arr[i][j] = Math.max(arr[i - 1][j], arr[i][j - 1])
      }
    }
  }
  var result = [];
  var i = length1, j = length2;
  while(i > 0 && j > 0) {
    if(compare(array1[i - 1], array2[j - 1])) {
      result.unshift(collect(i - 1, j - 1));
      i--;
      j--
    }else {
      if(arr[i - 1][j] > arr[i][j - 1]) {
        i--
      }else {
        j--
      }
    }
  }
  return result
};
goog.math.sum = function(var_args) {
  return(goog.array.reduce(arguments, function(sum, value) {
    return sum + value
  }, 0))
};
goog.math.average = function(var_args) {
  return goog.math.sum.apply(null, arguments) / arguments.length
};
goog.math.standardDeviation = function(var_args) {
  var sampleSize = arguments.length;
  if(sampleSize < 2) {
    return 0
  }
  var mean = goog.math.average.apply(null, arguments);
  var variance = goog.math.sum.apply(null, goog.array.map(arguments, function(val) {
    return Math.pow(val - mean, 2)
  })) / (sampleSize - 1);
  return Math.sqrt(variance)
};
goog.math.isInt = function(num) {
  return isFinite(num) && num % 1 == 0
};
goog.math.isFiniteNumber = function(num) {
  return isFinite(num) && !isNaN(num)
};
goog.math.safeFloor = function(num, opt_epsilon) {
  goog.asserts.assert(!goog.isDef(opt_epsilon) || opt_epsilon > 0);
  return Math.floor(num + (opt_epsilon || 2E-15))
};
goog.math.safeCeil = function(num, opt_epsilon) {
  goog.asserts.assert(!goog.isDef(opt_epsilon) || opt_epsilon > 0);
  return Math.ceil(num - (opt_epsilon || 2E-15))
};
goog.provide("goog.math.Coordinate");
goog.require("goog.math");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.magnitude = function(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y)
};
goog.math.Coordinate.azimuth = function(a) {
  return goog.math.angle(0, 0, a.x, a.y)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.math.Coordinate.prototype.ceil = function() {
  this.x = Math.ceil(this.x);
  this.y = Math.ceil(this.y);
  return this
};
goog.math.Coordinate.prototype.floor = function() {
  this.x = Math.floor(this.x);
  this.y = Math.floor(this.y);
  return this
};
goog.math.Coordinate.prototype.round = function() {
  this.x = Math.round(this.x);
  this.y = Math.round(this.y);
  return this
};
goog.math.Coordinate.prototype.translate = function(tx, opt_ty) {
  if(tx instanceof goog.math.Coordinate) {
    this.x += tx.x;
    this.y += tx.y
  }else {
    this.x += tx;
    if(goog.isNumber(opt_ty)) {
      this.y += opt_ty
    }
  }
  return this
};
goog.math.Coordinate.prototype.scale = function(sx, opt_sy) {
  var sy = goog.isNumber(opt_sy) ? opt_sy : sx;
  this.x *= sx;
  this.y *= sy;
  return this
};
goog.provide("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left
};
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x);
  for(var i = 1;i < arguments.length;i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x)
  }
  return box
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left)
};
if(goog.DEBUG) {
  goog.math.Box.prototype.toString = function() {
    return"(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)"
  }
}
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other)
};
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom, opt_left) {
  if(goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left
  }else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left
  }
  return this
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom)
};
goog.math.Box.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.top == b.top && (a.right == b.right && (a.bottom == b.bottom && a.left == b.left))
};
goog.math.Box.contains = function(box, other) {
  if(!box || !other) {
    return false
  }
  if(other instanceof goog.math.Box) {
    return other.left >= box.left && (other.right <= box.right && (other.top >= box.top && other.bottom <= box.bottom))
  }
  return other.x >= box.left && (other.x <= box.right && (other.y >= box.top && other.y <= box.bottom))
};
goog.math.Box.relativePositionX = function(box, coord) {
  if(coord.x < box.left) {
    return coord.x - box.left
  }else {
    if(coord.x > box.right) {
      return coord.x - box.right
    }
  }
  return 0
};
goog.math.Box.relativePositionY = function(box, coord) {
  if(coord.y < box.top) {
    return coord.y - box.top
  }else {
    if(coord.y > box.bottom) {
      return coord.y - box.bottom
    }
  }
  return 0
};
goog.math.Box.distance = function(box, coord) {
  var x = goog.math.Box.relativePositionX(box, coord);
  var y = goog.math.Box.relativePositionY(box, coord);
  return Math.sqrt(x * x + y * y)
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && (b.left <= a.right && (a.top <= b.bottom && b.top <= a.bottom))
};
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return a.left <= b.right + padding && (b.left <= a.right + padding && (a.top <= b.bottom + padding && b.top <= a.bottom + padding))
};
goog.math.Box.prototype.ceil = function() {
  this.top = Math.ceil(this.top);
  this.right = Math.ceil(this.right);
  this.bottom = Math.ceil(this.bottom);
  this.left = Math.ceil(this.left);
  return this
};
goog.math.Box.prototype.floor = function() {
  this.top = Math.floor(this.top);
  this.right = Math.floor(this.right);
  this.bottom = Math.floor(this.bottom);
  this.left = Math.floor(this.left);
  return this
};
goog.math.Box.prototype.round = function() {
  this.top = Math.round(this.top);
  this.right = Math.round(this.right);
  this.bottom = Math.round(this.bottom);
  this.left = Math.round(this.left);
  return this
};
goog.math.Box.prototype.translate = function(tx, opt_ty) {
  if(tx instanceof goog.math.Coordinate) {
    this.left += tx.x;
    this.right += tx.x;
    this.top += tx.y;
    this.bottom += tx.y
  }else {
    this.left += tx;
    this.right += tx;
    if(goog.isNumber(opt_ty)) {
      this.top += opt_ty;
      this.bottom += opt_ty
    }
  }
  return this
};
goog.math.Box.prototype.scale = function(sx, opt_sy) {
  var sy = goog.isNumber(opt_sy) ? opt_sy : sx;
  this.left *= sx;
  this.right *= sx;
  this.top *= sy;
  this.bottom *= sy;
  return this
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(sx, opt_sy) {
  var sy = goog.isNumber(opt_sy) ? opt_sy : sx;
  this.width *= sx;
  this.height *= sy;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.math.Rect");
goog.require("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.math.Rect = function(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.width = w;
  this.height = h
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height)
};
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top, right, bottom, this.left)
};
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top, box.right - box.left, box.bottom - box.top)
};
if(goog.DEBUG) {
  goog.math.Rect.prototype.toString = function() {
    return"(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)"
  }
}
goog.math.Rect.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.left == b.left && (a.width == b.width && (a.top == b.top && a.height == b.height))
};
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);
  if(x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);
    if(y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;
      return true
    }
  }
  return false
};
goog.math.Rect.intersection = function(a, b) {
  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);
  if(x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);
    if(y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0)
    }
  }
  return null
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && (b.left <= a.left + a.width && (a.top <= b.top + b.height && b.top <= a.top + a.height))
};
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect)
};
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if(!intersection || (!intersection.height || !intersection.width)) {
    return[a.clone()]
  }
  var result = [];
  var top = a.top;
  var height = a.height;
  var ar = a.left + a.width;
  var ab = a.top + a.height;
  var br = b.left + b.width;
  var bb = b.top + b.height;
  if(b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    height -= b.top - a.top
  }
  if(bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top
  }
  if(b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height))
  }
  if(br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height))
  }
  return result
};
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect)
};
goog.math.Rect.prototype.boundingRect = function(rect) {
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);
  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);
  this.width = right - this.left;
  this.height = bottom - this.top
};
goog.math.Rect.boundingRect = function(a, b) {
  if(!a || !b) {
    return null
  }
  var clone = a.clone();
  clone.boundingRect(b);
  return clone
};
goog.math.Rect.prototype.contains = function(another) {
  if(another instanceof goog.math.Rect) {
    return this.left <= another.left && (this.left + this.width >= another.left + another.width && (this.top <= another.top && this.top + this.height >= another.top + another.height))
  }else {
    return another.x >= this.left && (another.x <= this.left + this.width && (another.y >= this.top && another.y <= this.top + this.height))
  }
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height)
};
goog.math.Rect.prototype.ceil = function() {
  this.left = Math.ceil(this.left);
  this.top = Math.ceil(this.top);
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Rect.prototype.floor = function() {
  this.left = Math.floor(this.left);
  this.top = Math.floor(this.top);
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Rect.prototype.round = function() {
  this.left = Math.round(this.left);
  this.top = Math.round(this.top);
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Rect.prototype.translate = function(tx, opt_ty) {
  if(tx instanceof goog.math.Coordinate) {
    this.left += tx.x;
    this.top += tx.y
  }else {
    this.left += tx;
    if(goog.isNumber(opt_ty)) {
      this.top += opt_ty
    }
  }
  return this
};
goog.math.Rect.prototype.scale = function(sx, opt_sy) {
  var sy = goog.isNumber(opt_sy) ? opt_sy : sx;
  this.left *= sx;
  this.width *= sx;
  this.top *= sy;
  this.height *= sy;
  return this
};
goog.provide("goog.dom.vendor");
goog.require("goog.userAgent");
goog.dom.vendor.getVendorJsPrefix = function() {
  if(goog.userAgent.WEBKIT) {
    return"Webkit"
  }else {
    if(goog.userAgent.GECKO) {
      return"Moz"
    }else {
      if(goog.userAgent.IE) {
        return"ms"
      }else {
        if(goog.userAgent.OPERA) {
          return"O"
        }
      }
    }
  }
  return null
};
goog.dom.vendor.getVendorPrefix = function() {
  if(goog.userAgent.WEBKIT) {
    return"-webkit"
  }else {
    if(goog.userAgent.GECKO) {
      return"-moz"
    }else {
      if(goog.userAgent.IE) {
        return"-ms"
      }else {
        if(goog.userAgent.OPERA) {
          return"-o"
        }
      }
    }
  }
  return null
};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return goog.isString(className) && className.match(/\S+/g) || []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var expectedCount = classes.length + args.length;
  goog.dom.classes.add_(classes, args);
  goog.dom.classes.set(element, classes.join(" "));
  return classes.length == expectedCount
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var newClasses = goog.dom.classes.getDifference_(classes, args);
  goog.dom.classes.set(element, newClasses.join(" "));
  return newClasses.length == classes.length - args.length
};
goog.dom.classes.add_ = function(classes, args) {
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i])
    }
  }
};
goog.dom.classes.getDifference_ = function(arr1, arr2) {
  return goog.array.filter(arr1, function(item) {
    return!goog.array.contains(arr2, item)
  })
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    goog.dom.classes.set(element, classes.join(" "))
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      classes = goog.dom.classes.getDifference_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  goog.dom.classes.set(element, classes.join(" "))
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", ARTICLE:"ARTICLE", ASIDE:"ASIDE", AUDIO:"AUDIO", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDI:"BDI", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", COMMAND:"COMMAND", DATA:"DATA", DATALIST:"DATALIST", DD:"DD", DEL:"DEL", DETAILS:"DETAILS", DFN:"DFN", 
DIALOG:"DIALOG", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", EMBED:"EMBED", FIELDSET:"FIELDSET", FIGCAPTION:"FIGCAPTION", FIGURE:"FIGURE", FONT:"FONT", FOOTER:"FOOTER", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HEADER:"HEADER", HGROUP:"HGROUP", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", KEYGEN:"KEYGEN", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", 
MAP:"MAP", MARK:"MARK", MATH:"MATH", MENU:"MENU", META:"META", METER:"METER", NAV:"NAV", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", OUTPUT:"OUTPUT", P:"P", PARAM:"PARAM", PRE:"PRE", PROGRESS:"PROGRESS", Q:"Q", RP:"RP", RT:"RT", RUBY:"RUBY", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SECTION:"SECTION", SELECT:"SELECT", SMALL:"SMALL", SOURCE:"SOURCE", SPAN:"SPAN", STRIKE:"STRIKE", STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUMMARY:"SUMMARY", 
SUP:"SUP", SVG:"SVG", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TIME:"TIME", TITLE:"TITLE", TR:"TR", TRACK:"TRACK", TT:"TT", U:"U", UL:"UL", VAR:"VAR", VIDEO:"VIDEO", WBR:"WBR"};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || (goog.userAgent.IE && goog.userAgent.isDocumentMode(9) || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1")), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), CAN_USE_PARENT_ELEMENT_PROPERTY:goog.userAgent.IE || (goog.userAgent.OPERA || goog.userAgent.WEBKIT), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return!!(parent.querySelectorAll && parent.querySelector)
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            if(goog.string.startsWith(key, "aria-") || goog.string.startsWith(key, "data-")) {
              element.setAttribute(key, val)
            }else {
              element[key] = val
            }
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "frameborder":"frameBorder", "height":"height", "maxlength":"maxLength", "role":"role", "rowspan":"rowSpan", "type":"type", "usemap":"useMap", "valign":"vAlign", "width":"width"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || (goog.global || window);
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && (attributes && (attributes.name || attributes.type))) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      delete clone["type"];
      attributes = clone
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.toArray(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(String(content))
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return(elem.removeChild(elem.firstChild))
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return(tempDiv.removeChild(tempDiv.firstChild))
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.COMMAND:
    ;
    case goog.dom.TagName.EMBED:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.KEYGEN:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.SOURCE:
    ;
    case goog.dom.TagName.STYLE:
    ;
    case goog.dom.TagName.TRACK:
    ;
    case goog.dom.TagName.WBR:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return(element.removeNode(false))
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return(goog.dom.removeNode(element))
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return(node).firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return(node).lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return(node).nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return(node).previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return(node)
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isElement = function(obj) {
  return goog.isObject(obj) && obj.nodeType == goog.dom.NodeType.ELEMENT
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.getParentElement = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_PARENT_ELEMENT_PROPERTY) {
    return element.parentElement
  }
  var parent = element.parentNode;
  return goog.dom.isElement(parent) ? (parent) : null
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if(goog.userAgent.IE && !goog.userAgent.isDocumentMode(9)) {
    if(node1.nodeType == goog.dom.NodeType.DOCUMENT) {
      return-1
    }
    if(node2.nodeType == goog.dom.NodeType.DOCUMENT) {
      return 1
    }
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return(node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document)
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc = frame.contentDocument || frame.contentWindow.document;
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(String(text)))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    var child = root.firstChild;
    while(child) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
      child = child.nextSibling
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && (index >= 0 && index < 32768)
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.tabIndex = -1;
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.dom.BrowserFeature.CAN_USE_INNER_TEXT) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur = null;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  if(!opt_tag && !opt_class) {
    return null
  }
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return(goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true))
};
goog.dom.getAncestorByClass = function(element, className) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, className)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.getActiveElement = function(doc) {
  try {
    return doc && doc.activeElement
  }catch(e) {
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || (goog.global.document || document)
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(String(content))
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.getActiveElement = function(opt_doc) {
  return goog.dom.getActiveElement(opt_doc || this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.canHaveChildren = goog.dom.canHaveChildren;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.insertChildAt = goog.dom.insertChildAt;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getChildren = goog.dom.getChildren;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.isElement = goog.dom.isElement;
goog.dom.DomHelper.prototype.isWindow = goog.dom.isWindow;
goog.dom.DomHelper.prototype.getParentElement = goog.dom.getParentElement;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.compareNodeOrder = goog.dom.compareNodeOrder;
goog.dom.DomHelper.prototype.findCommonAncestor = goog.dom.findCommonAncestor;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.getOuterHtml = goog.dom.getOuterHtml;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.isFocusableTabIndex = goog.dom.isFocusableTabIndex;
goog.dom.DomHelper.prototype.setFocusableTabIndex = goog.dom.setFocusableTabIndex;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getNodeAtOffset = goog.dom.getNodeAtOffset;
goog.dom.DomHelper.prototype.isNodeList = goog.dom.isNodeList;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestorByClass = goog.dom.getAncestorByClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("goog.style");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.dom.vendor");
goog.require("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Rect");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.style.setStyle = function(element, style, opt_value) {
  if(goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style)
  }else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element))
  }
};
goog.style.setStyle_ = function(element, value, style) {
  var propertyName = goog.style.getVendorJsStyleName_(element, style);
  if(propertyName) {
    element.style[propertyName] = value
  }
};
goog.style.getVendorJsStyleName_ = function(element, style) {
  var camelStyle = goog.string.toCamelCase(style);
  if(element.style[camelStyle] === undefined) {
    var prefixedStyle = goog.dom.vendor.getVendorJsPrefix() + goog.string.toTitleCase(style);
    if(element.style[prefixedStyle] !== undefined) {
      return prefixedStyle
    }
  }
  return camelStyle
};
goog.style.getVendorStyleName_ = function(element, style) {
  var camelStyle = goog.string.toCamelCase(style);
  if(element.style[camelStyle] === undefined) {
    var prefixedStyle = goog.dom.vendor.getVendorJsPrefix() + goog.string.toTitleCase(style);
    if(element.style[prefixedStyle] !== undefined) {
      return goog.dom.vendor.getVendorPrefix() + "-" + style
    }
  }
  return style
};
goog.style.getStyle = function(element, property) {
  var styleValue = element.style[goog.string.toCamelCase(property)];
  if(typeof styleValue !== "undefined") {
    return styleValue
  }
  return element.style[goog.style.getVendorJsStyleName_(element, property)] || ""
};
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if(doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if(styles) {
      return styles[property] || (styles.getPropertyValue(property) || "")
    }
  }
  return""
};
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null
};
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) || (goog.style.getCascadedStyle(element, style) || element.style && element.style[style])
};
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, "position")
};
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, "backgroundColor")
};
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, "overflowX")
};
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, "overflowY")
};
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, "zIndex")
};
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, "textAlign")
};
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, "cursor")
};
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO && ((goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.isVersion("1.9"));
  if(arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y
  }else {
    x = arg1;
    y = opt_arg2
  }
  el.style.left = goog.style.getPixelStyleValue_((x), buggyGeckoSubPixelPos);
  el.style.top = goog.style.getPixelStyleValue_((y), buggyGeckoSubPixelPos)
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop)
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if(opt_node) {
    doc = goog.dom.getOwnerDocument(opt_node)
  }else {
    doc = goog.dom.getDocument()
  }
  if(goog.userAgent.IE && (!goog.userAgent.isDocumentMode(9) && !goog.dom.getDomHelper(doc).isCss1CompatMode())) {
    return doc.body
  }
  return doc.documentElement
};
goog.style.getViewportPageOffset = function(doc) {
  var body = doc.body;
  var documentElement = doc.documentElement;
  var scrollLeft = body.scrollLeft || documentElement.scrollLeft;
  var scrollTop = body.scrollTop || documentElement.scrollTop;
  return new goog.math.Coordinate(scrollLeft, scrollTop)
};
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  if(goog.userAgent.IE) {
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop
  }
  return(rect)
};
goog.style.getOffsetParent = function(element) {
  if(goog.userAgent.IE && !goog.userAgent.isDocumentMode(8)) {
    return element.offsetParent
  }
  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, "position");
  var skipStatic = positionStyle == "fixed" || positionStyle == "absolute";
  for(var parent = element.parentNode;parent && parent != doc;parent = parent.parentNode) {
    positionStyle = goog.style.getStyle_((parent), "position");
    skipStatic = skipStatic && (positionStyle == "static" && (parent != doc.documentElement && parent != doc.body));
    if(!skipStatic && (parent.scrollWidth > parent.clientWidth || (parent.scrollHeight > parent.clientHeight || (positionStyle == "fixed" || (positionStyle == "absolute" || positionStyle == "relative"))))) {
      return(parent)
    }
  }
  return null
};
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var documentElement = dom.getDocument().documentElement;
  var scrollEl = dom.getDocumentScrollElement();
  for(var el = element;el = goog.style.getOffsetParent(el);) {
    if((!goog.userAgent.IE || el.clientWidth != 0) && ((!goog.userAgent.WEBKIT || (el.clientHeight != 0 || el != body)) && (el != body && (el != documentElement && goog.style.getStyle_(el, "overflow") != "visible")))) {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x)
    }
  }
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  visibleRect.left = Math.max(visibleRect.left, scrollX);
  visibleRect.top = Math.max(visibleRect.top, scrollY);
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return visibleRect.top >= 0 && (visibleRect.left >= 0 && (visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left)) ? visibleRect : null
};
goog.style.getContainerOffsetToScrollInto = function(element, container, opt_center) {
  var elementPos = goog.style.getPageOffset(element);
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;
  var scrollLeft = container.scrollLeft;
  var scrollTop = container.scrollTop;
  if(opt_center) {
    scrollLeft += relX - spaceX / 2;
    scrollTop += relY - spaceY / 2
  }else {
    scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    scrollTop += Math.min(relY, Math.max(relY - spaceY, 0))
  }
  return new goog.math.Coordinate(scrollLeft, scrollTop)
};
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  var offset = goog.style.getContainerOffsetToScrollInto(element, container, opt_center);
  container.scrollLeft = offset.x;
  container.scrollTop = offset.y
};
goog.style.getClientLeftTop = function(el) {
  if(goog.userAgent.GECKO && !goog.userAgent.isVersion("1.9")) {
    var left = parseFloat(goog.style.getComputedStyle(el, "borderLeftWidth"));
    if(goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left - parseFloat(goog.style.getComputedStyle(el, "borderRightWidth"));
      left += scrollbarWidth
    }
    return new goog.math.Coordinate(left, parseFloat(goog.style.getComputedStyle(el, "borderTopWidth")))
  }
  return new goog.math.Coordinate(el.clientLeft, el.clientTop)
};
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, "position");
  goog.asserts.assertObject(el, "Parameter is required");
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && (doc.getBoxObjectFor && (!el.getBoundingClientRect && (positionStyle == "absolute" && ((box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0)))));
  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if(el == viewportElement) {
    return pos
  }
  if(el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y
  }else {
    if(doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
      box = doc.getBoxObjectFor(el);
      var vpBox = doc.getBoxObjectFor(viewportElement);
      pos.x = box.screenX - vpBox.screenX;
      pos.y = box.screenY - vpBox.screenY
    }else {
      var parent = el;
      do {
        pos.x += parent.offsetLeft;
        pos.y += parent.offsetTop;
        if(parent != el) {
          pos.x += parent.clientLeft || 0;
          pos.y += parent.clientTop || 0
        }
        if(goog.userAgent.WEBKIT && goog.style.getComputedPosition(parent) == "fixed") {
          pos.x += doc.body.scrollLeft;
          pos.y += doc.body.scrollTop;
          break
        }
        parent = parent.offsetParent
      }while(parent && parent != el);
      if(goog.userAgent.OPERA || goog.userAgent.WEBKIT && positionStyle == "absolute") {
        pos.y -= doc.body.offsetTop
      }
      for(parent = el;(parent = goog.style.getOffsetParent(parent)) && (parent != doc.body && parent != viewportElement);) {
        pos.x -= parent.scrollLeft;
        if(!goog.userAgent.OPERA || parent.tagName != "TR") {
          pos.y -= parent.scrollTop
        }
      }
    }
  }
  return pos
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPosition(currentEl);
    position.x += offset.x;
    position.y += offset.y
  }while(currentWin && (currentWin != relativeWin && ((currentEl = currentWin.frameElement) && (currentWin = currentWin.parent))));
  return position
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if(origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    if(goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll())
    }
    rect.left += pos.x;
    rect.top += pos.y
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y)
};
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if(el.nodeType == goog.dom.NodeType.ELEMENT) {
    el = (el);
    if(el.getBoundingClientRect) {
      var box = goog.style.getBoundingClientRect_(el);
      pos.x = box.left;
      pos.y = box.top
    }else {
      var scrollCoord = goog.dom.getDomHelper(el).getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(el);
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y
    }
    if(goog.userAgent.GECKO && !goog.userAgent.isVersion(12)) {
      pos = goog.math.Coordinate.sum(pos, goog.style.getCssTranslation(el))
    }
  }else {
    var isAbstractedEvent = goog.isFunction(el.getBrowserEvent);
    var targetEvent = el;
    if(el.targetTouches) {
      targetEvent = el.targetTouches[0]
    }else {
      if(isAbstractedEvent && el.getBrowserEvent().targetTouches) {
        targetEvent = el.getBrowserEvent().targetTouches[0]
      }
    }
    pos.x = targetEvent.clientX;
    pos.y = targetEvent.clientY
  }
  return pos
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  if(x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x
  }
  var dx = x - cur.x;
  var dy = opt_y - cur.y;
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy)
};
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if(w instanceof goog.math.Size) {
    h = w.height;
    w = w.width
  }else {
    if(opt_h == undefined) {
      throw Error("missing height argument");
    }
    h = opt_h
  }
  goog.style.setWidth(element, (w));
  goog.style.setHeight(element, (h))
};
goog.style.getPixelStyleValue_ = function(value, round) {
  if(typeof value == "number") {
    value = (round ? Math.round(value) : value) + "px"
  }
  return value
};
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, true)
};
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, true)
};
goog.style.getSize = function(element) {
  if(goog.style.getStyle_(element, "display") != "none") {
    return goog.style.getSizeWithDisplay_(element)
  }
  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var size = goog.style.getSizeWithDisplay_(element);
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return size
};
goog.style.getSizeWithDisplay_ = function(element) {
  var offsetWidth = element.offsetWidth;
  var offsetHeight = element.offsetHeight;
  var webkitOffsetsZero = goog.userAgent.WEBKIT && (!offsetWidth && !offsetHeight);
  if((!goog.isDef(offsetWidth) || webkitOffsetsZero) && element.getBoundingClientRect) {
    var clientRect = goog.style.getBoundingClientRect_(element);
    return new goog.math.Size(clientRect.right - clientRect.left, clientRect.bottom - clientRect.top)
  }
  return new goog.math.Size(offsetWidth, offsetHeight)
};
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height)
};
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector))
};
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector)
};
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = "";
  if("opacity" in style) {
    result = style.opacity
  }else {
    if("MozOpacity" in style) {
      result = style.MozOpacity
    }else {
      if("filter" in style) {
        var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
        if(match) {
          result = String(match[1] / 100)
        }
      }
    }
  }
  return result == "" ? result : Number(result)
};
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if("opacity" in style) {
    style.opacity = alpha
  }else {
    if("MozOpacity" in style) {
      style.MozOpacity = alpha
    }else {
      if("filter" in style) {
        if(alpha === "") {
          style.filter = ""
        }else {
          style.filter = "alpha(opacity=" + alpha * 100 + ")"
        }
      }
    }
  }
};
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(" + 'src="' + src + '", sizingMethod="crop")'
  }else {
    style.backgroundImage = "url(" + src + ")";
    style.backgroundPosition = "top left";
    style.backgroundRepeat = "no-repeat"
  }
};
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if("filter" in style) {
    style.filter = ""
  }else {
    style.backgroundImage = "none"
  }
};
goog.style.showElement = function(el, display) {
  el.style.display = display ? "" : "none"
};
goog.style.isElementShown = function(el) {
  return el.style.display != "none"
};
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;
  if(goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString)
  }else {
    var head = dh.getElementsByTagNameAndClass("head")[0];
    if(!head) {
      var body = dh.getElementsByTagNameAndClass("body")[0];
      head = dh.createDom("head");
      body.parentNode.insertBefore(head, body)
    }
    styleSheet = dh.createDom("style");
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet)
  }
  return styleSheet
};
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || (styleSheet.owningElement || (styleSheet));
  goog.dom.removeNode(node)
};
goog.style.setStyles = function(element, stylesString) {
  if(goog.userAgent.IE) {
    element.cssText = stylesString
  }else {
    element.innerHTML = stylesString
  }
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.whiteSpace = "pre";
    style.wordWrap = "break-word"
  }else {
    if(goog.userAgent.GECKO) {
      style.whiteSpace = "-moz-pre-wrap"
    }else {
      style.whiteSpace = "pre-wrap"
    }
  }
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.zoom = "1";
    style.display = "inline"
  }else {
    if(goog.userAgent.GECKO) {
      style.display = goog.userAgent.isVersion("1.9a") ? "inline-block" : "-moz-inline-box"
    }else {
      style.display = "inline-block"
    }
  }
};
goog.style.isRightToLeft = function(el) {
  return"rtl" == goog.style.getStyle_(el, "direction")
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  if(goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == "none"
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      return el.getAttribute("unselectable") == "on"
    }
  }
  return false
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = !opt_noRecurse ? el.getElementsByTagName("*") : null;
  var name = goog.style.unselectableStyle_;
  if(name) {
    var value = unselectable ? "none" : "";
    el.style[name] = value;
    if(descendants) {
      for(var i = 0, descendant;descendant = descendants[i];i++) {
        descendant.style[name] = value
      }
    }
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      var value = unselectable ? "on" : "";
      el.setAttribute("unselectable", value);
      if(descendants) {
        for(var i = 0, descendant;descendant = descendants[i];i++) {
          descendant.setAttribute("unselectable", value)
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight)
};
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom
    }else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "border-box")
  }
};
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if(ieCurrentStyle && (goog.dom.getDomHelper(doc).isCss1CompatMode() && (ieCurrentStyle.width != "auto" && (ieCurrentStyle.height != "auto" && !ieCurrentStyle.boxSizing)))) {
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width, "width", "pixelWidth");
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height, "height", "pixelHeight");
    return new goog.math.Size(width, height)
  }else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right, borderBoxSize.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom)
  }
};
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left + paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top + paddingBox.bottom + borderBox.bottom
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "content-box")
  }
};
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if(goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing
  }else {
    if(goog.userAgent.WEBKIT) {
      style.WebkitBoxSizing = boxSizing
    }else {
      style.boxSizing = boxSizing
    }
  }
  style.width = Math.max(size.width, 0) + "px";
  style.height = Math.max(size.height, 0) + "px"
};
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  if(/^\d+px?$/.test(value)) {
    return parseInt(value, 10)
  }else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue
  }
};
goog.style.getIePixelDistance_ = function(element, propName) {
  var value = goog.style.getCascadedStyle(element, propName);
  return value ? goog.style.getIePixelValue_(element, value, "left", "pixelLeft") : 0
};
goog.style.getBox_ = function(element, stylePrefix) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + "Left");
    var right = goog.style.getIePixelDistance_(element, stylePrefix + "Right");
    var top = goog.style.getIePixelDistance_(element, stylePrefix + "Top");
    var bottom = goog.style.getIePixelDistance_(element, stylePrefix + "Bottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = (goog.style.getComputedStyle(element, stylePrefix + "Left"));
    var right = (goog.style.getComputedStyle(element, stylePrefix + "Right"));
    var top = (goog.style.getComputedStyle(element, stylePrefix + "Top"));
    var bottom = (goog.style.getComputedStyle(element, stylePrefix + "Bottom"));
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, "padding")
};
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, "margin")
};
goog.style.ieBorderWidthKeywords_ = {"thin":2, "medium":4, "thick":6};
goog.style.getIePixelBorder_ = function(element, prop) {
  if(goog.style.getCascadedStyle(element, prop + "Style") == "none") {
    return 0
  }
  var width = goog.style.getCascadedStyle(element, prop + "Width");
  if(width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width]
  }
  return goog.style.getIePixelValue_(element, width, "left", "pixelLeft")
};
goog.style.getBorderBox = function(element) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, "borderLeft");
    var right = goog.style.getIePixelBorder_(element, "borderRight");
    var top = goog.style.getIePixelBorder_(element, "borderTop");
    var bottom = goog.style.getIePixelBorder_(element, "borderBottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = (goog.style.getComputedStyle(element, "borderLeftWidth"));
    var right = (goog.style.getComputedStyle(element, "borderRightWidth"));
    var top = (goog.style.getComputedStyle(element, "borderTopWidth"));
    var bottom = (goog.style.getComputedStyle(element, "borderBottomWidth"));
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = "";
  if(doc.body.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    try {
      font = range.queryCommandValue("FontName")
    }catch(e) {
      font = ""
    }
  }
  if(!font) {
    font = goog.style.getStyle_(el, "fontFamily")
  }
  var fontsArray = font.split(",");
  if(fontsArray.length > 1) {
    font = fontsArray[0]
  }
  return goog.string.stripQuotes(font, "\"'")
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {"cm":1, "in":1, "mm":1, "pc":1, "pt":1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {"em":1, "ex":1};
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, "fontSize");
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if(fontSize && "px" == sizeUnits) {
    return parseInt(fontSize, 10)
  }
  if(goog.userAgent.IE) {
    if(sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft")
    }else {
      if(el.parentNode && (el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_)) {
        var parentElement = (el.parentNode);
        var parentSize = goog.style.getStyle_(parentElement, "fontSize");
        return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft")
      }
    }
  }
  var sizeElement = goog.dom.createDom("span", {"style":"visibility:hidden;position:absolute;" + "line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if(keyValue.length == 2) {
      result[goog.string.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1]
    }
  });
  return result
};
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ":", value, ";")
  });
  return buffer.join("")
};
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = value
};
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || ""
};
goog.style.getScrollbarWidth = function(opt_className) {
  var outerDiv = goog.dom.createElement("div");
  if(opt_className) {
    outerDiv.className = opt_className
  }
  outerDiv.style.cssText = "overflow:auto;" + "position:absolute;top:0;width:100px;height:100px";
  var innerDiv = goog.dom.createElement("div");
  goog.style.setSize(innerDiv, "200px", "200px");
  outerDiv.appendChild(innerDiv);
  goog.dom.appendChild(goog.dom.getDocument().body, outerDiv);
  var width = outerDiv.offsetWidth - outerDiv.clientWidth;
  goog.dom.removeNode(outerDiv);
  return width
};
goog.style.MATRIX_TRANSLATION_REGEX_ = new RegExp("matrix\\([0-9\\.\\-]+, [0-9\\.\\-]+, " + "[0-9\\.\\-]+, [0-9\\.\\-]+, " + "([0-9\\.\\-]+)p?x?, ([0-9\\.\\-]+)p?x?\\)");
goog.style.getCssTranslation = function(element) {
  var property;
  if(goog.userAgent.IE) {
    property = "-ms-transform"
  }else {
    if(goog.userAgent.WEBKIT) {
      property = "-webkit-transform"
    }else {
      if(goog.userAgent.OPERA) {
        property = "-o-transform"
      }else {
        if(goog.userAgent.GECKO) {
          property = "-moz-transform"
        }
      }
    }
  }
  var transform;
  if(property) {
    transform = goog.style.getStyle_(element, property)
  }
  if(!transform) {
    transform = goog.style.getStyle_(element, "transform")
  }
  if(!transform) {
    return new goog.math.Coordinate(0, 0)
  }
  var matches = transform.match(goog.style.MATRIX_TRANSLATION_REGEX_);
  if(!matches) {
    return new goog.math.Coordinate(0, 0)
  }
  return new goog.math.Coordinate(parseFloat(matches[1]), parseFloat(matches[2]))
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF) {
    this.creationStack = (new Error).stack;
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.MonitoringMode = {OFF:0, PERMANENT:1, INTERACTIVE:2};
goog.Disposable.MONITORING_MODE = 0;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.onDisposeCallbacks_;
goog.Disposable.prototype.creationStack;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF) {
      var uid = goog.getUid(this);
      if(goog.Disposable.MONITORING_MODE == goog.Disposable.MonitoringMode.PERMANENT && !goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.registerDisposable = function(disposable) {
  this.addOnDisposeCallback(goog.partial(goog.dispose, disposable))
};
goog.Disposable.prototype.addOnDisposeCallback = function(callback, opt_scope) {
  if(!this.onDisposeCallbacks_) {
    this.onDisposeCallbacks_ = []
  }
  this.onDisposeCallbacks_.push(goog.bind(callback, opt_scope))
};
goog.Disposable.prototype.disposeInternal = function() {
  if(this.onDisposeCallbacks_) {
    while(this.onDisposeCallbacks_.length) {
      this.onDisposeCallbacks_.shift()()
    }
  }
};
goog.Disposable.isDisposed = function(obj) {
  if(obj && typeof obj.isDisposed == "function") {
    return obj.isDisposed()
  }
  return false
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.disposeAll = function(var_args) {
  for(var i = 0, len = arguments.length;i < len;++i) {
    var disposable = arguments[i];
    if(goog.isArrayLike(disposable)) {
      goog.disposeAll.apply(null, disposable)
    }else {
      goog.dispose(disposable)
    }
  }
};
goog.provide("goog.events.Event");
goog.provide("goog.events.EventLike");
goog.require("goog.Disposable");
goog.events.EventLike;
goog.events.Event = function(type, opt_target) {
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.events.Event.prototype.disposeInternal = function() {
};
goog.events.Event.prototype.dispose = function() {
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.defaultPrevented = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.defaultPrevented = true;
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.events.Listenable");
goog.provide("goog.events.ListenableKey");
goog.require("goog.events.EventLike");
goog.events.Listenable = function() {
};
goog.events.Listenable.USE_LISTENABLE_INTERFACE = false;
goog.events.Listenable.IMPLEMENTED_BY_PROP_ = "__closure_listenable";
goog.events.Listenable.addImplementation = function(cls) {
  cls.prototype[goog.events.Listenable.IMPLEMENTED_BY_PROP_] = true
};
goog.events.Listenable.isImplementedBy = function(obj) {
  return!!(obj && obj[goog.events.Listenable.IMPLEMENTED_BY_PROP_])
};
goog.events.Listenable.prototype.listen;
goog.events.Listenable.prototype.listenOnce;
goog.events.Listenable.prototype.unlisten;
goog.events.Listenable.prototype.unlistenByKey;
goog.events.Listenable.prototype.dispatchEvent;
goog.events.Listenable.prototype.removeAllListeners;
goog.events.Listenable.prototype.fireListeners;
goog.events.Listenable.prototype.getListeners;
goog.events.Listenable.prototype.getListener;
goog.events.Listenable.prototype.hasListener;
goog.events.ListenableKey = function() {
};
goog.events.ListenableKey.counter_ = 0;
goog.events.ListenableKey.reserveKey = function() {
  return++goog.events.ListenableKey.counter_
};
goog.events.ListenableKey.prototype.src;
goog.events.ListenableKey.prototype.type;
goog.events.ListenableKey.prototype.listener;
goog.events.ListenableKey.prototype.capture;
goog.events.ListenableKey.prototype.handler;
goog.events.ListenableKey.prototype.key;
goog.provide("goog.events.Listener");
goog.require("goog.events.ListenableKey");
goog.events.Listener = function() {
  if(goog.events.Listener.ENABLE_MONITORING) {
    this.creationStack = (new Error).stack
  }
};
goog.events.Listener.ENABLE_MONITORING = false;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.creationStack;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && (listener.handleEvent && goog.isFunction(listener.handleEvent))) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = goog.events.ListenableKey.reserveKey();
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), HAS_NAVIGATOR_ONLINE_PROPERTY:!goog.userAgent.WEBKIT || goog.userAgent.isVersion("528"), HAS_HTML5_NETWORK_EVENT_SUPPORT:goog.userAgent.GECKO && goog.userAgent.isVersion("1.9b") || (goog.userAgent.IE && goog.userAgent.isVersion("8") || (goog.userAgent.OPERA && 
goog.userAgent.isVersion("9.5") || goog.userAgent.WEBKIT && goog.userAgent.isVersion("528"))), HTML5_NETWORK_EVENTS_FIRE_ON_BODY:goog.userAgent.GECKO && !goog.userAgent.isVersion("8") || goog.userAgent.IE && !goog.userAgent.isVersion("9"), TOUCH_ENABLED:"ontouchstart" in goog.global || (!!(goog.global["document"] && (document.documentElement && "ontouchstart" in document.documentElement)) || !!(goog.global["navigator"] && goog.global["navigator"]["msMaxTouchPoints"]))};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.require("goog.asserts");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.monitors_ = [];
goog.debug.entryPointRegistry.monitorsMayExist_ = false;
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback;
  if(goog.debug.entryPointRegistry.monitorsMayExist_) {
    var monitors = goog.debug.entryPointRegistry.monitors_;
    for(var i = 0;i < monitors.length;i++) {
      callback(goog.bind(monitors[i].wrap, monitors[i]))
    }
  }
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = true;
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  goog.debug.entryPointRegistry.monitors_.push(monitor)
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var monitors = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(monitor == monitors[monitors.length - 1], "Only the most recent monitor can be unwrapped.");
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  monitors.length--
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAG:"drag", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", DRAGEND:"dragend", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", BEFOREUNLOAD:"beforeunload", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", 
POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", ONLINE:"online", OFFLINE:"offline", MESSAGE:"message", CONNECT:"connect", TRANSITIONEND:goog.userAgent.WEBKIT ? "webkitTransitionEnd" : goog.userAgent.OPERA ? "oTransitionEnd" : "transitionend", MSGESTURECHANGE:"MSGestureChange", MSGESTUREEND:"MSGestureEnd", MSGESTUREHOLD:"MSGestureHold", MSGESTURESTART:"MSGestureStart", MSGESTURETAP:"MSGestureTap", MSGOTPOINTERCAPTURE:"MSGotPointerCapture", 
MSINERTIASTART:"MSInertiaStart", MSLOSTPOINTERCAPTURE:"MSLostPointerCapture", MSPOINTERCANCEL:"MSPointerCancel", MSPOINTERDOWN:"MSPointerDown", MSPOINTERMOVE:"MSPointerMove", MSPOINTEROVER:"MSPointerOver", MSPOINTEROUT:"MSPointerOut", MSPOINTERUP:"MSPointerUp", TEXTINPUT:"textinput", COMPOSITIONSTART:"compositionstart", COMPOSITIONUPDATE:"compositionupdate", COMPOSITIONEND:"compositionend"};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = function(x) {
  goog.reflect.sinkValue[" "](x);
  return x
};
goog.reflect.sinkValue[" "] = goog.nullFunction;
goog.reflect.canAccessProperty = function(obj, prop) {
  try {
    goog.reflect.sinkValue(obj[prop]);
    return true
  }catch(e) {
  }
  return false
};
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = (e.target) || e.srcElement;
  this.currentTarget = (opt_currentTarget);
  var relatedTarget = (e.relatedTarget);
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      if(!goog.reflect.canAccessProperty(relatedTarget, "nodeName")) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = goog.userAgent.WEBKIT || e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = goog.userAgent.WEBKIT || e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  if(e.defaultPrevented) {
    this.preventDefault()
  }
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && (goog.userAgent.MAC && this.ctrlKey))
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
};
goog.provide("goog.events");
goog.provide("goog.events.Key");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.Listenable");
goog.require("goog.events.Listener");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.Key;
goog.events.ListenableType;
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var listenableKey;
  if(goog.events.Listenable.USE_LISTENABLE_INTERFACE && goog.events.Listenable.isImplementedBy(src)) {
    listenableKey = src.listen((type), goog.events.wrapListener_(listener), opt_capt, opt_handler)
  }else {
    listenableKey = goog.events.listen_((src), type, listener, false, opt_capt, opt_handler)
  }
  var key = listenableKey.key;
  goog.events.listeners_[key] = listenableKey;
  return key
};
goog.events.listen_ = function(src, type, listener, callOnce, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }
  var capture = !!opt_capt;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    map[type] = {count_:0, remaining_:0}
  }
  map = map[type];
  if(!(capture in map)) {
    map[capture] = {count_:0, remaining_:0};
    map.count_++
  }
  map = map[capture];
  var srcUid = goog.getUid(src);
  var listenerArray, listenerObj;
  map.remaining_++;
  if(!map[srcUid]) {
    listenerArray = map[srcUid] = [];
    map.count_++
  }else {
    listenerArray = map[srcUid];
    for(var i = 0;i < listenerArray.length;i++) {
      listenerObj = listenerArray[i];
      if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
        if(listenerObj.removed) {
          break
        }
        if(!callOnce) {
          listenerArray[i].callOnce = false
        }
        return listenerArray[i]
      }
    }
  }
  var proxy = goog.events.getProxy();
  listenerObj = new goog.events.Listener;
  listenerObj.init(listener, proxy, src, type, capture, opt_handler);
  listenerObj.callOnce = callOnce;
  proxy.src = src;
  proxy.listener = listenerObj;
  listenerArray.push(listenerObj);
  if(!goog.events.sources_[srcUid]) {
    goog.events.sources_[srcUid] = []
  }
  goog.events.sources_[srcUid].push(listenerObj);
  if(src.addEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.addEventListener(type, proxy, capture)
    }
  }else {
    src.attachEvent(goog.events.getOnString_(type), proxy)
  }
  return listenerObj
};
goog.events.getProxy = function() {
  var proxyCallbackFunction = goog.events.handleBrowserEvent_;
  var f = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ? function(eventObject) {
    return proxyCallbackFunction.call(f.src, f.listener, eventObject)
  } : function(eventObject) {
    var v = proxyCallbackFunction.call(f.src, f.listener, eventObject);
    if(!v) {
      return v
    }
  };
  return f
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var listenableKey;
  if(goog.events.Listenable.USE_LISTENABLE_INTERFACE && goog.events.Listenable.isImplementedBy(src)) {
    listenableKey = src.listenOnce((type), goog.events.wrapListener_(listener), opt_capt, opt_handler)
  }else {
    listenableKey = goog.events.listen_((src), type, listener, true, opt_capt, opt_handler)
  }
  var key = listenableKey.key;
  goog.events.listeners_[key] = listenableKey;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  if(goog.events.Listenable.USE_LISTENABLE_INTERFACE && goog.events.Listenable.isImplementedBy(src)) {
    return src.unlisten((type), goog.events.wrapListener_(listener), opt_capt, opt_handler)
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && (listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler)) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  var listener = goog.events.listeners_[key];
  if(!listener) {
    return false
  }
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  if(goog.events.Listenable.USE_LISTENABLE_INTERFACE && goog.events.Listenable.isImplementedBy(src)) {
    return src.unlistenByKey(listener)
  }
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(listenerArray) {
    listenerArray.needsCleanup_ = true;
    goog.events.cleanUp_(type, capture, srcUid, listenerArray)
  }
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp = function(listenableKey) {
  delete goog.events.listeners_[listenableKey.key]
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  if(!noObj) {
    if(goog.events.Listenable.USE_LISTENABLE_INTERFACE && (opt_obj && goog.events.Listenable.isImplementedBy(opt_obj))) {
      return opt_obj.removeAllListeners(opt_type)
    }
    var srcUid = goog.getUid((opt_obj));
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if(noType || opt_type == listener.type) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.listeners_, function(listener, key) {
      goog.events.unlistenByKey(key);
      count++
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  if(goog.events.Listenable.USE_LISTENABLE_INTERFACE && goog.events.Listenable.isImplementedBy(obj)) {
    return obj.getListeners(type, capture)
  }else {
    return goog.events.getListeners_(obj, type, capture) || []
  }
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  if(goog.events.Listenable.USE_LISTENABLE_INTERFACE && goog.events.Listenable.isImplementedBy(src)) {
    return src.getListener((type), goog.events.wrapListener_(listener), capture, opt_handler)
  }
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(!listenerArray[i].removed && (listenerArray[i].listener == listener && (listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler))) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  if(goog.events.Listenable.USE_LISTENABLE_INTERFACE && goog.events.Listenable.isImplementedBy(obj)) {
    return obj.hasListener(opt_type, opt_capture)
  }
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && (!!map[opt_capture] && objUid in map[opt_capture])
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  if(goog.events.Listenable.USE_LISTENABLE_INTERFACE && goog.events.Listenable.isImplementedBy(obj)) {
    return obj.fireListeners(type, capture, eventObject)
  }
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    var remaining = --map.remaining_;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      map.remaining_ = Math.max(remaining, map.remaining_);
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return listener.handleEvent(eventObject)
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  if(goog.events.Listenable.USE_LISTENABLE_INTERFACE) {
    return src.dispatchEvent(e)
  }
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event((type), src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && (i >= 0 && targetsMap.remaining_);i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && (i < ancestors.length && targetsMap.remaining_);i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && (current && targetsMap.remaining_);current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(listener, opt_evt) {
  if(listener.removed) {
    return true
  }
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt || (goog.getObjectByName("window.event"));
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = new goog.events.BrowserEvent;
    evt.init(ieEvent, (this));
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = [];
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && (i >= 0 && targetsMap.remaining_);i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && (i < ancestors.length && targetsMap.remaining_);i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0
      }
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, (this));
  retval = goog.events.fireListener(listener, be);
  return retval
};
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || (e.returnValue) == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.events.LISTENER_WRAPPER_PROP_ = "__closure_events_fn_" + (Math.random() * 1E9 >>> 0);
goog.events.wrapListener_ = function(listener) {
  if(goog.isFunction(listener)) {
    return listener
  }
  return listener[goog.events.LISTENER_WRAPPER_PROP_] || (listener[goog.events.LISTENER_WRAPPER_PROP_] = function(e) {
    return listener.handleEvent(e)
  })
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_)
});
goog.provide("goog.events.EventHandler");
goog.require("goog.Disposable");
goog.require("goog.array");
goog.require("goog.events");
goog.require("goog.events.EventWrapper");
goog.events.EventHandler = function(opt_handler) {
  goog.Disposable.call(this);
  this.handler_ = opt_handler;
  this.keys_ = []
};
goog.inherits(goog.events.EventHandler, goog.Disposable);
goog.events.EventHandler.typeArray_ = [];
goog.events.EventHandler.prototype.listen = function(src, type, opt_fn, opt_capture, opt_handler) {
  if(!goog.isArray(type)) {
    goog.events.EventHandler.typeArray_[0] = (type);
    type = goog.events.EventHandler.typeArray_
  }
  for(var i = 0;i < type.length;i++) {
    var key = (goog.events.listen(src, type[i], opt_fn || this, opt_capture || false, opt_handler || (this.handler_ || this)));
    this.keys_.push(key)
  }
  return this
};
goog.events.EventHandler.prototype.listenOnce = function(src, type, opt_fn, opt_capture, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      this.listenOnce(src, type[i], opt_fn, opt_capture, opt_handler)
    }
  }else {
    var key = (goog.events.listenOnce(src, type, opt_fn || this, opt_capture, opt_handler || (this.handler_ || this)));
    this.keys_.push(key)
  }
  return this
};
goog.events.EventHandler.prototype.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler || (this.handler_ || this), this);
  return this
};
goog.events.EventHandler.prototype.getListenerCount = function() {
  return this.keys_.length
};
goog.events.EventHandler.prototype.unlisten = function(src, type, opt_fn, opt_capture, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      this.unlisten(src, type[i], opt_fn, opt_capture, opt_handler)
    }
  }else {
    var listener = goog.events.getListener(src, type, opt_fn || this, opt_capture, opt_handler || (this.handler_ || this));
    if(listener) {
      var key = listener.key;
      goog.events.unlistenByKey(key);
      goog.array.remove(this.keys_, key)
    }
  }
  return this
};
goog.events.EventHandler.prototype.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler || (this.handler_ || this), this);
  return this
};
goog.events.EventHandler.prototype.removeAll = function() {
  goog.array.forEach(this.keys_, goog.events.unlistenByKey);
  this.keys_.length = 0
};
goog.events.EventHandler.prototype.disposeInternal = function() {
  goog.events.EventHandler.superClass_.disposeInternal.call(this);
  this.removeAll()
};
goog.events.EventHandler.prototype.handleEvent = function(e) {
  throw Error("EventHandler.handleEvent not implemented");
};
goog.provide("goog.ui.IdGenerator");
goog.ui.IdGenerator = function() {
};
goog.addSingletonGetter(goog.ui.IdGenerator);
goog.ui.IdGenerator.prototype.nextId_ = 0;
goog.ui.IdGenerator.prototype.getNextUniqueId = function() {
  return":" + (this.nextId_++).toString(36)
};
goog.ui.IdGenerator.instance = goog.ui.IdGenerator.getInstance();
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.require("goog.events.Event");
goog.require("goog.events.Listenable");
goog.require("goog.events.Listener");
goog.require("goog.object");
goog.events.EventTarget = function() {
  goog.Disposable.call(this);
  if(goog.events.Listenable.USE_LISTENABLE_INTERFACE) {
    this.eventTargetListeners_ = {};
    this.reallyDisposed_ = false;
    this.actualEventTarget_ = this
  }
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
if(goog.events.Listenable.USE_LISTENABLE_INTERFACE) {
  goog.events.Listenable.addImplementation(goog.events.EventTarget)
}
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  if(goog.events.Listenable.USE_LISTENABLE_INTERFACE) {
    if(this.reallyDisposed_) {
      return true
    }
    var ancestorsTree, ancestor = this.getParentEventTarget();
    if(ancestor) {
      ancestorsTree = [];
      for(;ancestor;ancestor = ancestor.getParentEventTarget()) {
        ancestorsTree.push(ancestor)
      }
    }
    return goog.events.EventTarget.dispatchEventInternal_(this.actualEventTarget_, e, ancestorsTree)
  }else {
    return goog.events.dispatchEvent(this, e)
  }
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  if(goog.events.Listenable.USE_LISTENABLE_INTERFACE) {
    this.removeAllListeners();
    this.reallyDisposed_ = true
  }else {
    goog.events.removeAll(this)
  }
  this.parentEventTarget_ = null
};
if(goog.events.Listenable.USE_LISTENABLE_INTERFACE) {
  goog.events.EventTarget.prototype.listen = function(type, listener, opt_useCapture, opt_listenerScope) {
    return this.listenInternal_(type, listener, false, opt_useCapture, opt_listenerScope)
  };
  goog.events.EventTarget.prototype.listenOnce = function(type, listener, opt_useCapture, opt_listenerScope) {
    return this.listenInternal_(type, listener, true, opt_useCapture, opt_listenerScope)
  };
  goog.events.EventTarget.prototype.listenInternal_ = function(type, listener, callOnce, opt_useCapture, opt_listenerScope) {
    goog.asserts.assert(!this.reallyDisposed_, "Can not listen on disposed object.");
    var listenerArray = this.eventTargetListeners_[type] || (this.eventTargetListeners_[type] = []);
    var listenerObj;
    var index = goog.events.EventTarget.findListenerIndex_(listenerArray, listener, opt_useCapture, opt_listenerScope);
    if(index > -1) {
      listenerObj = listenerArray[index];
      if(!callOnce) {
        listenerObj.callOnce = false
      }
      return listenerObj
    }
    listenerObj = new goog.events.Listener;
    listenerObj.init(listener, null, this, type, !!opt_useCapture, opt_listenerScope);
    listenerObj.callOnce = callOnce;
    listenerArray.push(listenerObj);
    return listenerObj
  };
  goog.events.EventTarget.prototype.unlisten = function(type, listener, opt_useCapture, opt_listenerScope) {
    if(!(type in this.eventTargetListeners_)) {
      return false
    }
    var listenerArray = this.eventTargetListeners_[type];
    var index = goog.events.EventTarget.findListenerIndex_(listenerArray, listener, opt_useCapture, opt_listenerScope);
    if(index > -1) {
      var listenerObj = listenerArray[index];
      goog.events.cleanUp(listenerObj);
      listenerObj.removed = true;
      return goog.array.removeAt(listenerArray, index)
    }
    return false
  };
  goog.events.EventTarget.prototype.unlistenByKey = function(key) {
    var type = key.type;
    if(!(type in this.eventTargetListeners_)) {
      return false
    }
    var removed = goog.array.remove(this.eventTargetListeners_[type], key);
    if(removed) {
      goog.events.cleanUp(key);
      key.removed = true
    }
    return removed
  };
  goog.events.EventTarget.prototype.removeAllListeners = function(opt_type, opt_capture) {
    var count = 0;
    for(var type in this.eventTargetListeners_) {
      if(!opt_type || type == opt_type) {
        var listenerArray = this.eventTargetListeners_[type];
        for(var i = 0;i < listenerArray.length;i++) {
          ++count;
          goog.events.cleanUp(listenerArray[i]);
          listenerArray[i].removed = true
        }
        listenerArray.length = 0
      }
    }
    return count
  };
  goog.events.EventTarget.prototype.fireListeners = function(type, capture, eventObject) {
    goog.asserts.assert(!this.reallyDisposed_, "Can not fire listeners after dispose() completed.");
    if(!(type in this.eventTargetListeners_)) {
      return true
    }
    var rv = true;
    var listenerArray = goog.array.clone(this.eventTargetListeners_[type]);
    for(var i = 0;i < listenerArray.length;++i) {
      var listener = listenerArray[i];
      if(listener && (!listener.removed && listener.capture == capture)) {
        if(listener.callOnce) {
          this.unlistenByKey(listener)
        }
        rv = listener.handleEvent(eventObject) !== false && rv
      }
    }
    return rv && eventObject.returnValue_ != false
  };
  goog.events.EventTarget.prototype.getListeners = function(type, capture) {
    var listenerArray = this.eventTargetListeners_[type];
    var rv = [];
    if(listenerArray) {
      for(var i = 0;i < listenerArray.length;++i) {
        var listenerObj = listenerArray[i];
        if(listenerObj.capture == capture) {
          rv.push(listenerObj)
        }
      }
    }
    return rv
  };
  goog.events.EventTarget.prototype.getListener = function(type, listener, capture, opt_listenerScope) {
    var listenerArray = this.eventTargetListeners_[type];
    var i = -1;
    if(listenerArray) {
      i = goog.events.EventTarget.findListenerIndex_(listenerArray, listener, capture, opt_listenerScope)
    }
    return i > -1 ? listenerArray[i] : null
  };
  goog.events.EventTarget.prototype.hasListener = function(opt_type, opt_capture) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    return goog.object.some(this.eventTargetListeners_, function(listenersArray, type) {
      for(var i = 0;i < listenersArray.length;++i) {
        if((!hasType || listenersArray[i].type == opt_type) && (!hasCapture || listenersArray[i].capture == opt_capture)) {
          return true
        }
      }
      return false
    })
  };
  goog.events.EventTarget.prototype.setTargetForTesting = function(target) {
    this.actualEventTarget_ = target
  };
  goog.events.EventTarget.dispatchEventInternal_ = function(target, e, opt_ancestorsTree) {
    var type = e.type || (e);
    if(goog.isString(e)) {
      e = new goog.events.Event(e, target)
    }else {
      if(!(e instanceof goog.events.Event)) {
        var oldEvent = e;
        e = new goog.events.Event(type, target);
        goog.object.extend(e, oldEvent)
      }else {
        e.target = e.target || target
      }
    }
    var rv = true, currentTarget;
    if(opt_ancestorsTree) {
      for(var i = opt_ancestorsTree.length - 1;!e.propagationStopped_ && i >= 0;i--) {
        currentTarget = e.currentTarget = opt_ancestorsTree[i];
        rv = currentTarget.fireListeners(type, true, e) && rv
      }
    }
    if(!e.propagationStopped_) {
      currentTarget = e.currentTarget = target;
      rv = currentTarget.fireListeners(type, true, e) && rv;
      if(!e.propagationStopped_) {
        rv = currentTarget.fireListeners(type, false, e) && rv
      }
    }
    if(opt_ancestorsTree) {
      for(i = 0;!e.propagationStopped_ && i < opt_ancestorsTree.length;i++) {
        currentTarget = e.currentTarget = opt_ancestorsTree[i];
        rv = currentTarget.fireListeners(type, false, e) && rv
      }
    }
    return rv
  };
  goog.events.EventTarget.findListenerIndex_ = function(listenerArray, listener, opt_useCapture, opt_listenerScope) {
    for(var i = 0;i < listenerArray.length;++i) {
      var listenerObj = listenerArray[i];
      if(listenerObj.listener == listener && (listenerObj.capture == !!opt_useCapture && listenerObj.handler == opt_listenerScope)) {
        return i
      }
    }
    return-1
  }
}
;goog.provide("goog.ui.Component");
goog.provide("goog.ui.Component.Error");
goog.provide("goog.ui.Component.EventType");
goog.provide("goog.ui.Component.State");
goog.require("goog.array");
goog.require("goog.array.ArrayLike");
goog.require("goog.dom");
goog.require("goog.events.EventHandler");
goog.require("goog.events.EventTarget");
goog.require("goog.object");
goog.require("goog.style");
goog.require("goog.ui.IdGenerator");
goog.ui.Component = function(opt_domHelper) {
  goog.events.EventTarget.call(this);
  this.dom_ = opt_domHelper || goog.dom.getDomHelper();
  this.rightToLeft_ = goog.ui.Component.defaultRightToLeft_
};
goog.inherits(goog.ui.Component, goog.events.EventTarget);
goog.ui.Component.prototype.idGenerator_ = goog.ui.IdGenerator.getInstance();
goog.ui.Component.defaultRightToLeft_ = null;
goog.ui.Component.EventType = {BEFORE_SHOW:"beforeshow", SHOW:"show", HIDE:"hide", DISABLE:"disable", ENABLE:"enable", HIGHLIGHT:"highlight", UNHIGHLIGHT:"unhighlight", ACTIVATE:"activate", DEACTIVATE:"deactivate", SELECT:"select", UNSELECT:"unselect", CHECK:"check", UNCHECK:"uncheck", FOCUS:"focus", BLUR:"blur", OPEN:"open", CLOSE:"close", ENTER:"enter", LEAVE:"leave", ACTION:"action", CHANGE:"change"};
goog.ui.Component.Error = {NOT_SUPPORTED:"Method not supported", DECORATE_INVALID:"Invalid element to decorate", ALREADY_RENDERED:"Component already rendered", PARENT_UNABLE_TO_BE_SET:"Unable to set parent component", CHILD_INDEX_OUT_OF_BOUNDS:"Child component index out of bounds", NOT_OUR_CHILD:"Child is not in parent component", NOT_IN_DOCUMENT:"Operation not supported while component is not in document", STATE_INVALID:"Invalid component state"};
goog.ui.Component.State = {ALL:255, DISABLED:1, HOVER:2, ACTIVE:4, SELECTED:8, CHECKED:16, FOCUSED:32, OPENED:64};
goog.ui.Component.getStateTransitionEvent = function(state, isEntering) {
  switch(state) {
    case goog.ui.Component.State.DISABLED:
      return isEntering ? goog.ui.Component.EventType.DISABLE : goog.ui.Component.EventType.ENABLE;
    case goog.ui.Component.State.HOVER:
      return isEntering ? goog.ui.Component.EventType.HIGHLIGHT : goog.ui.Component.EventType.UNHIGHLIGHT;
    case goog.ui.Component.State.ACTIVE:
      return isEntering ? goog.ui.Component.EventType.ACTIVATE : goog.ui.Component.EventType.DEACTIVATE;
    case goog.ui.Component.State.SELECTED:
      return isEntering ? goog.ui.Component.EventType.SELECT : goog.ui.Component.EventType.UNSELECT;
    case goog.ui.Component.State.CHECKED:
      return isEntering ? goog.ui.Component.EventType.CHECK : goog.ui.Component.EventType.UNCHECK;
    case goog.ui.Component.State.FOCUSED:
      return isEntering ? goog.ui.Component.EventType.FOCUS : goog.ui.Component.EventType.BLUR;
    case goog.ui.Component.State.OPENED:
      return isEntering ? goog.ui.Component.EventType.OPEN : goog.ui.Component.EventType.CLOSE;
    default:
  }
  throw Error(goog.ui.Component.Error.STATE_INVALID);
};
goog.ui.Component.setDefaultRightToLeft = function(rightToLeft) {
  goog.ui.Component.defaultRightToLeft_ = rightToLeft
};
goog.ui.Component.prototype.id_ = null;
goog.ui.Component.prototype.dom_;
goog.ui.Component.prototype.inDocument_ = false;
goog.ui.Component.prototype.element_ = null;
goog.ui.Component.prototype.googUiComponentHandler_;
goog.ui.Component.prototype.rightToLeft_ = null;
goog.ui.Component.prototype.model_ = null;
goog.ui.Component.prototype.parent_ = null;
goog.ui.Component.prototype.children_ = null;
goog.ui.Component.prototype.childIndex_ = null;
goog.ui.Component.prototype.wasDecorated_ = false;
goog.ui.Component.prototype.getId = function() {
  return this.id_ || (this.id_ = this.idGenerator_.getNextUniqueId())
};
goog.ui.Component.prototype.setId = function(id) {
  if(this.parent_ && this.parent_.childIndex_) {
    goog.object.remove(this.parent_.childIndex_, this.id_);
    goog.object.add(this.parent_.childIndex_, id, this)
  }
  this.id_ = id
};
goog.ui.Component.prototype.getElement = function() {
  return this.element_
};
goog.ui.Component.prototype.getElementStrict = function() {
  var el = this.element_;
  goog.asserts.assert(el, "Can not call getElementStrict before rendering/decorating.");
  return el
};
goog.ui.Component.prototype.setElementInternal = function(element) {
  this.element_ = element
};
goog.ui.Component.prototype.getElementsByClass = function(className) {
  return this.element_ ? this.dom_.getElementsByClass(className, this.element_) : []
};
goog.ui.Component.prototype.getElementByClass = function(className) {
  return this.element_ ? this.dom_.getElementByClass(className, this.element_) : null
};
goog.ui.Component.prototype.getHandler = function() {
  return this.googUiComponentHandler_ || (this.googUiComponentHandler_ = new goog.events.EventHandler(this))
};
goog.ui.Component.prototype.setParent = function(parent) {
  if(this == parent) {
    throw Error(goog.ui.Component.Error.PARENT_UNABLE_TO_BE_SET);
  }
  if(parent && (this.parent_ && (this.id_ && (this.parent_.getChild(this.id_) && this.parent_ != parent)))) {
    throw Error(goog.ui.Component.Error.PARENT_UNABLE_TO_BE_SET);
  }
  this.parent_ = parent;
  goog.ui.Component.superClass_.setParentEventTarget.call(this, parent)
};
goog.ui.Component.prototype.getParent = function() {
  return this.parent_
};
goog.ui.Component.prototype.setParentEventTarget = function(parent) {
  if(this.parent_ && this.parent_ != parent) {
    throw Error(goog.ui.Component.Error.NOT_SUPPORTED);
  }
  goog.ui.Component.superClass_.setParentEventTarget.call(this, parent)
};
goog.ui.Component.prototype.getDomHelper = function() {
  return this.dom_
};
goog.ui.Component.prototype.isInDocument = function() {
  return this.inDocument_
};
goog.ui.Component.prototype.createDom = function() {
  this.element_ = this.dom_.createElement("div")
};
goog.ui.Component.prototype.render = function(opt_parentElement) {
  this.render_(opt_parentElement)
};
goog.ui.Component.prototype.renderBefore = function(sibling) {
  this.render_((sibling.parentNode), sibling)
};
goog.ui.Component.prototype.render_ = function(opt_parentElement, opt_beforeNode) {
  if(this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  if(!this.element_) {
    this.createDom()
  }
  if(opt_parentElement) {
    opt_parentElement.insertBefore(this.element_, opt_beforeNode || null)
  }else {
    this.dom_.getDocument().body.appendChild(this.element_)
  }
  if(!this.parent_ || this.parent_.isInDocument()) {
    this.enterDocument()
  }
};
goog.ui.Component.prototype.decorate = function(element) {
  if(this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }else {
    if(element && this.canDecorate(element)) {
      this.wasDecorated_ = true;
      if(!this.dom_ || this.dom_.getDocument() != goog.dom.getOwnerDocument(element)) {
        this.dom_ = goog.dom.getDomHelper(element)
      }
      this.decorateInternal(element);
      this.enterDocument()
    }else {
      throw Error(goog.ui.Component.Error.DECORATE_INVALID);
    }
  }
};
goog.ui.Component.prototype.canDecorate = function(element) {
  return true
};
goog.ui.Component.prototype.wasDecorated = function() {
  return this.wasDecorated_
};
goog.ui.Component.prototype.decorateInternal = function(element) {
  this.element_ = element
};
goog.ui.Component.prototype.enterDocument = function() {
  this.inDocument_ = true;
  this.forEachChild(function(child) {
    if(!child.isInDocument() && child.getElement()) {
      child.enterDocument()
    }
  })
};
goog.ui.Component.prototype.exitDocument = function() {
  this.forEachChild(function(child) {
    if(child.isInDocument()) {
      child.exitDocument()
    }
  });
  if(this.googUiComponentHandler_) {
    this.googUiComponentHandler_.removeAll()
  }
  this.inDocument_ = false
};
goog.ui.Component.prototype.disposeInternal = function() {
  if(this.inDocument_) {
    this.exitDocument()
  }
  if(this.googUiComponentHandler_) {
    this.googUiComponentHandler_.dispose();
    delete this.googUiComponentHandler_
  }
  this.forEachChild(function(child) {
    child.dispose()
  });
  if(!this.wasDecorated_ && this.element_) {
    goog.dom.removeNode(this.element_)
  }
  this.children_ = null;
  this.childIndex_ = null;
  this.element_ = null;
  this.model_ = null;
  this.parent_ = null;
  goog.ui.Component.superClass_.disposeInternal.call(this)
};
goog.ui.Component.prototype.makeId = function(idFragment) {
  return this.getId() + "." + idFragment
};
goog.ui.Component.prototype.makeIds = function(object) {
  var ids = {};
  for(var key in object) {
    ids[key] = this.makeId(object[key])
  }
  return ids
};
goog.ui.Component.prototype.getModel = function() {
  return this.model_
};
goog.ui.Component.prototype.setModel = function(obj) {
  this.model_ = obj
};
goog.ui.Component.prototype.getFragmentFromId = function(id) {
  return id.substring(this.getId().length + 1)
};
goog.ui.Component.prototype.getElementByFragment = function(idFragment) {
  if(!this.inDocument_) {
    throw Error(goog.ui.Component.Error.NOT_IN_DOCUMENT);
  }
  return this.dom_.getElement(this.makeId(idFragment))
};
goog.ui.Component.prototype.addChild = function(child, opt_render) {
  this.addChildAt(child, this.getChildCount(), opt_render)
};
goog.ui.Component.prototype.addChildAt = function(child, index, opt_render) {
  if(child.inDocument_ && (opt_render || !this.inDocument_)) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  if(index < 0 || index > this.getChildCount()) {
    throw Error(goog.ui.Component.Error.CHILD_INDEX_OUT_OF_BOUNDS);
  }
  if(!this.childIndex_ || !this.children_) {
    this.childIndex_ = {};
    this.children_ = []
  }
  if(child.getParent() == this) {
    goog.object.set(this.childIndex_, child.getId(), child);
    goog.array.remove(this.children_, child)
  }else {
    goog.object.add(this.childIndex_, child.getId(), child)
  }
  child.setParent(this);
  goog.array.insertAt(this.children_, child, index);
  if(child.inDocument_ && (this.inDocument_ && child.getParent() == this)) {
    var contentElement = this.getContentElement();
    contentElement.insertBefore(child.getElement(), contentElement.childNodes[index] || null)
  }else {
    if(opt_render) {
      if(!this.element_) {
        this.createDom()
      }
      var sibling = this.getChildAt(index + 1);
      child.render_(this.getContentElement(), sibling ? sibling.element_ : null)
    }else {
      if(this.inDocument_ && (!child.inDocument_ && (child.element_ && (child.element_.parentNode && child.element_.parentNode.nodeType == goog.dom.NodeType.ELEMENT)))) {
        child.enterDocument()
      }
    }
  }
};
goog.ui.Component.prototype.getContentElement = function() {
  return this.element_
};
goog.ui.Component.prototype.isRightToLeft = function() {
  if(this.rightToLeft_ == null) {
    this.rightToLeft_ = goog.style.isRightToLeft(this.inDocument_ ? this.element_ : this.dom_.getDocument().body)
  }
  return(this.rightToLeft_)
};
goog.ui.Component.prototype.setRightToLeft = function(rightToLeft) {
  if(this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  this.rightToLeft_ = rightToLeft
};
goog.ui.Component.prototype.hasChildren = function() {
  return!!this.children_ && this.children_.length != 0
};
goog.ui.Component.prototype.getChildCount = function() {
  return this.children_ ? this.children_.length : 0
};
goog.ui.Component.prototype.getChildIds = function() {
  var ids = [];
  this.forEachChild(function(child) {
    ids.push(child.getId())
  });
  return ids
};
goog.ui.Component.prototype.getChild = function(id) {
  return this.childIndex_ && id ? (goog.object.get(this.childIndex_, id)) || null : null
};
goog.ui.Component.prototype.getChildAt = function(index) {
  return this.children_ ? this.children_[index] || null : null
};
goog.ui.Component.prototype.forEachChild = function(f, opt_obj) {
  if(this.children_) {
    goog.array.forEach(this.children_, f, opt_obj)
  }
};
goog.ui.Component.prototype.indexOfChild = function(child) {
  return this.children_ && child ? goog.array.indexOf(this.children_, child) : -1
};
goog.ui.Component.prototype.removeChild = function(child, opt_unrender) {
  if(child) {
    var id = goog.isString(child) ? child : child.getId();
    child = this.getChild(id);
    if(id && child) {
      goog.object.remove(this.childIndex_, id);
      goog.array.remove(this.children_, child);
      if(opt_unrender) {
        child.exitDocument();
        if(child.element_) {
          goog.dom.removeNode(child.element_)
        }
      }
      child.setParent(null)
    }
  }
  if(!child) {
    throw Error(goog.ui.Component.Error.NOT_OUR_CHILD);
  }
  return(child)
};
goog.ui.Component.prototype.removeChildAt = function(index, opt_unrender) {
  return this.removeChild(this.getChildAt(index), opt_unrender)
};
goog.ui.Component.prototype.removeChildren = function(opt_unrender) {
  var removedChildren = [];
  while(this.hasChildren()) {
    removedChildren.push(this.removeChildAt(0, opt_unrender))
  }
  return removedChildren
};
goog.provide("goog.Timer");
goog.require("goog.events.EventTarget");
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);
  this.interval_ = opt_interval || 1;
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;
  this.boundTick_ = goog.bind(this.tick_, this);
  this.last_ = goog.now()
};
goog.inherits(goog.Timer, goog.events.EventTarget);
goog.Timer.MAX_TIMEOUT_ = 2147483647;
goog.Timer.prototype.enabled = false;
goog.Timer.defaultTimerObject = goog.global;
goog.Timer.intervalScale = 0.8;
goog.Timer.prototype.timer_ = null;
goog.Timer.prototype.getInterval = function() {
  return this.interval_
};
goog.Timer.prototype.setInterval = function(interval) {
  this.interval_ = interval;
  if(this.timer_ && this.enabled) {
    this.stop();
    this.start()
  }else {
    if(this.timer_) {
      this.stop()
    }
  }
};
goog.Timer.prototype.tick_ = function() {
  if(this.enabled) {
    var elapsed = goog.now() - this.last_;
    if(elapsed > 0 && elapsed < this.interval_ * goog.Timer.intervalScale) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_ - elapsed);
      return
    }
    this.dispatchTick();
    if(this.enabled) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
      this.last_ = goog.now()
    }
  }
};
goog.Timer.prototype.dispatchTick = function() {
  this.dispatchEvent(goog.Timer.TICK)
};
goog.Timer.prototype.start = function() {
  this.enabled = true;
  if(!this.timer_) {
    this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
    this.last_ = goog.now()
  }
};
goog.Timer.prototype.stop = function() {
  this.enabled = false;
  if(this.timer_) {
    this.timerObject_.clearTimeout(this.timer_);
    this.timer_ = null
  }
};
goog.Timer.prototype.disposeInternal = function() {
  goog.Timer.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.timerObject_
};
goog.Timer.TICK = "tick";
goog.Timer.callOnce = function(listener, opt_delay, opt_handler) {
  if(goog.isFunction(listener)) {
    if(opt_handler) {
      listener = goog.bind(listener, opt_handler)
    }
  }else {
    if(listener && typeof listener.handleEvent == "function") {
      listener = goog.bind(listener.handleEvent, listener)
    }else {
      throw Error("Invalid listener argument");
    }
  }
  if(opt_delay > goog.Timer.MAX_TIMEOUT_) {
    return-1
  }else {
    return goog.Timer.defaultTimerObject.setTimeout(listener, opt_delay || 0)
  }
};
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId)
};
goog.provide("goog.a11y.aria");
goog.provide("goog.a11y.aria.LivePriority");
goog.provide("goog.a11y.aria.Role");
goog.provide("goog.a11y.aria.State");
goog.require("goog.dom");
goog.a11y.aria.State = {ACTIVEDESCENDANT:"activedescendant", ATOMIC:"atomic", AUTOCOMPLETE:"autocomplete", BUSY:"busy", CHECKED:"checked", CONTROLS:"controls", DESCRIBEDBY:"describedby", DISABLED:"disabled", DROPEFFECT:"dropeffect", EXPANDED:"expanded", FLOWTO:"flowto", GRABBED:"grabbed", HASPOPUP:"haspopup", HIDDEN:"hidden", INVALID:"invalid", LABEL:"label", LABELLEDBY:"labelledby", LEVEL:"level", LIVE:"live", MULTILINE:"multiline", MULTISELECTABLE:"multiselectable", ORIENTATION:"orientation", OWNS:"owns", 
POSINSET:"posinset", PRESSED:"pressed", READONLY:"readonly", RELEVANT:"relevant", REQUIRED:"required", SELECTED:"selected", SETSIZE:"setsize", SORT:"sort", VALUEMAX:"valuemax", VALUEMIN:"valuemin", VALUENOW:"valuenow", VALUETEXT:"valuetext"};
goog.a11y.aria.Role = {ALERT:"alert", ALERTDIALOG:"alertdialog", APPLICATION:"application", ARTICLE:"article", BANNER:"banner", BUTTON:"button", CHECKBOX:"checkbox", COLUMNHEADER:"columnheader", COMBOBOX:"combobox", COMPLEMENTARY:"complementary", DIALOG:"dialog", DIRECTORY:"directory", DOCUMENT:"document", FORM:"form", GRID:"grid", GRIDCELL:"gridcell", GROUP:"group", HEADING:"heading", IMG:"img", LINK:"link", LIST:"list", LISTBOX:"listbox", LISTITEM:"listitem", LOG:"log", MAIN:"main", MARQUEE:"marquee", 
MATH:"math", MENU:"menu", MENUBAR:"menubar", MENU_ITEM:"menuitem", MENU_ITEM_CHECKBOX:"menuitemcheckbox", MENU_ITEM_RADIO:"menuitemradio", NAVIGATION:"navigation", NOTE:"note", OPTION:"option", PRESENTATION:"presentation", PROGRESSBAR:"progressbar", RADIO:"radio", RADIOGROUP:"radiogroup", REGION:"region", ROW:"row", ROWGROUP:"rowgroup", ROWHEADER:"rowheader", SCROLLBAR:"scrollbar", SEARCH:"search", SEPARATOR:"separator", SLIDER:"slider", SPINBUTTON:"spinbutton", STATUS:"status", TAB:"tab", TAB_LIST:"tablist", 
TAB_PANEL:"tabpanel", TEXTBOX:"textbox", TIMER:"timer", TOOLBAR:"toolbar", TOOLTIP:"tooltip", TREE:"tree", TREEGRID:"treegrid", TREEITEM:"treeitem"};
goog.a11y.aria.LivePriority = {OFF:"off", POLITE:"polite", ASSERTIVE:"assertive"};
goog.a11y.aria.setRole = function(element, roleName) {
  element.setAttribute("role", roleName)
};
goog.a11y.aria.getRole = function(element) {
  return(element.getAttribute("role")) || ""
};
goog.a11y.aria.setState = function(element, state, value) {
  element.setAttribute("aria-" + state, value)
};
goog.a11y.aria.getState = function(element, stateName) {
  var attrb = (element.getAttribute("aria-" + stateName));
  if(attrb === true || attrb === false) {
    return attrb ? "true" : "false"
  }else {
    if(!attrb) {
      return""
    }else {
      return String(attrb)
    }
  }
};
goog.a11y.aria.getActiveDescendant = function(element) {
  var id = goog.a11y.aria.getState(element, goog.a11y.aria.State.ACTIVEDESCENDANT);
  return goog.dom.getOwnerDocument(element).getElementById(id)
};
goog.a11y.aria.setActiveDescendant = function(element, activeElement) {
  goog.a11y.aria.setState(element, goog.a11y.aria.State.ACTIVEDESCENDANT, activeElement ? activeElement.id : "")
};
goog.provide("goog.events.KeyCodes");
goog.require("goog.userAgent");
goog.events.KeyCodes = {WIN_KEY_FF_LINUX:0, MAC_ENTER:3, BACKSPACE:8, TAB:9, NUM_CENTER:12, ENTER:13, SHIFT:16, CTRL:17, ALT:18, PAUSE:19, CAPS_LOCK:20, ESC:27, SPACE:32, PAGE_UP:33, PAGE_DOWN:34, END:35, HOME:36, LEFT:37, UP:38, RIGHT:39, DOWN:40, PRINT_SCREEN:44, INSERT:45, DELETE:46, ZERO:48, ONE:49, TWO:50, THREE:51, FOUR:52, FIVE:53, SIX:54, SEVEN:55, EIGHT:56, NINE:57, FF_SEMICOLON:59, FF_EQUALS:61, QUESTION_MARK:63, A:65, B:66, C:67, D:68, E:69, F:70, G:71, H:72, I:73, J:74, K:75, L:76, M:77, 
N:78, O:79, P:80, Q:81, R:82, S:83, T:84, U:85, V:86, W:87, X:88, Y:89, Z:90, META:91, WIN_KEY_RIGHT:92, CONTEXT_MENU:93, NUM_ZERO:96, NUM_ONE:97, NUM_TWO:98, NUM_THREE:99, NUM_FOUR:100, NUM_FIVE:101, NUM_SIX:102, NUM_SEVEN:103, NUM_EIGHT:104, NUM_NINE:105, NUM_MULTIPLY:106, NUM_PLUS:107, NUM_MINUS:109, NUM_PERIOD:110, NUM_DIVISION:111, F1:112, F2:113, F3:114, F4:115, F5:116, F6:117, F7:118, F8:119, F9:120, F10:121, F11:122, F12:123, NUMLOCK:144, SCROLL_LOCK:145, FIRST_MEDIA_KEY:166, LAST_MEDIA_KEY:183, 
SEMICOLON:186, DASH:189, EQUALS:187, COMMA:188, PERIOD:190, SLASH:191, APOSTROPHE:192, TILDE:192, SINGLE_QUOTE:222, OPEN_SQUARE_BRACKET:219, BACKSLASH:220, CLOSE_SQUARE_BRACKET:221, WIN_KEY:224, MAC_FF_META:224, WIN_IME:229, PHANTOM:255};
goog.events.KeyCodes.isTextModifyingKeyEvent = function(e) {
  if(e.altKey && !e.ctrlKey || (e.metaKey || e.keyCode >= goog.events.KeyCodes.F1 && e.keyCode <= goog.events.KeyCodes.F12)) {
    return false
  }
  switch(e.keyCode) {
    case goog.events.KeyCodes.ALT:
    ;
    case goog.events.KeyCodes.CAPS_LOCK:
    ;
    case goog.events.KeyCodes.CONTEXT_MENU:
    ;
    case goog.events.KeyCodes.CTRL:
    ;
    case goog.events.KeyCodes.DOWN:
    ;
    case goog.events.KeyCodes.END:
    ;
    case goog.events.KeyCodes.ESC:
    ;
    case goog.events.KeyCodes.HOME:
    ;
    case goog.events.KeyCodes.INSERT:
    ;
    case goog.events.KeyCodes.LEFT:
    ;
    case goog.events.KeyCodes.MAC_FF_META:
    ;
    case goog.events.KeyCodes.META:
    ;
    case goog.events.KeyCodes.NUMLOCK:
    ;
    case goog.events.KeyCodes.NUM_CENTER:
    ;
    case goog.events.KeyCodes.PAGE_DOWN:
    ;
    case goog.events.KeyCodes.PAGE_UP:
    ;
    case goog.events.KeyCodes.PAUSE:
    ;
    case goog.events.KeyCodes.PHANTOM:
    ;
    case goog.events.KeyCodes.PRINT_SCREEN:
    ;
    case goog.events.KeyCodes.RIGHT:
    ;
    case goog.events.KeyCodes.SCROLL_LOCK:
    ;
    case goog.events.KeyCodes.SHIFT:
    ;
    case goog.events.KeyCodes.UP:
    ;
    case goog.events.KeyCodes.WIN_KEY:
    ;
    case goog.events.KeyCodes.WIN_KEY_RIGHT:
      return false;
    case goog.events.KeyCodes.WIN_KEY_FF_LINUX:
      return!goog.userAgent.GECKO;
    default:
      return e.keyCode < goog.events.KeyCodes.FIRST_MEDIA_KEY || e.keyCode > goog.events.KeyCodes.LAST_MEDIA_KEY
  }
};
goog.events.KeyCodes.firesKeyPressEvent = function(keyCode, opt_heldKeyCode, opt_shiftKey, opt_ctrlKey, opt_altKey) {
  if(!goog.userAgent.IE && !(goog.userAgent.WEBKIT && goog.userAgent.isVersion("525"))) {
    return true
  }
  if(goog.userAgent.MAC && opt_altKey) {
    return goog.events.KeyCodes.isCharacterKey(keyCode)
  }
  if(opt_altKey && !opt_ctrlKey) {
    return false
  }
  if(!opt_shiftKey && (opt_heldKeyCode == goog.events.KeyCodes.CTRL || (opt_heldKeyCode == goog.events.KeyCodes.ALT || goog.userAgent.MAC && opt_heldKeyCode == goog.events.KeyCodes.META))) {
    return false
  }
  if(goog.userAgent.WEBKIT && (opt_ctrlKey && opt_shiftKey)) {
    switch(keyCode) {
      case goog.events.KeyCodes.BACKSLASH:
      ;
      case goog.events.KeyCodes.OPEN_SQUARE_BRACKET:
      ;
      case goog.events.KeyCodes.CLOSE_SQUARE_BRACKET:
      ;
      case goog.events.KeyCodes.TILDE:
      ;
      case goog.events.KeyCodes.SEMICOLON:
      ;
      case goog.events.KeyCodes.DASH:
      ;
      case goog.events.KeyCodes.EQUALS:
      ;
      case goog.events.KeyCodes.COMMA:
      ;
      case goog.events.KeyCodes.PERIOD:
      ;
      case goog.events.KeyCodes.SLASH:
      ;
      case goog.events.KeyCodes.APOSTROPHE:
      ;
      case goog.events.KeyCodes.SINGLE_QUOTE:
        return false
    }
  }
  if(goog.userAgent.IE && (opt_ctrlKey && opt_heldKeyCode == keyCode)) {
    return false
  }
  switch(keyCode) {
    case goog.events.KeyCodes.ENTER:
      return!(goog.userAgent.IE && goog.userAgent.isDocumentMode(9));
    case goog.events.KeyCodes.ESC:
      return!goog.userAgent.WEBKIT
  }
  return goog.events.KeyCodes.isCharacterKey(keyCode)
};
goog.events.KeyCodes.isCharacterKey = function(keyCode) {
  if(keyCode >= goog.events.KeyCodes.ZERO && keyCode <= goog.events.KeyCodes.NINE) {
    return true
  }
  if(keyCode >= goog.events.KeyCodes.NUM_ZERO && keyCode <= goog.events.KeyCodes.NUM_MULTIPLY) {
    return true
  }
  if(keyCode >= goog.events.KeyCodes.A && keyCode <= goog.events.KeyCodes.Z) {
    return true
  }
  if(goog.userAgent.WEBKIT && keyCode == 0) {
    return true
  }
  switch(keyCode) {
    case goog.events.KeyCodes.SPACE:
    ;
    case goog.events.KeyCodes.QUESTION_MARK:
    ;
    case goog.events.KeyCodes.NUM_PLUS:
    ;
    case goog.events.KeyCodes.NUM_MINUS:
    ;
    case goog.events.KeyCodes.NUM_PERIOD:
    ;
    case goog.events.KeyCodes.NUM_DIVISION:
    ;
    case goog.events.KeyCodes.SEMICOLON:
    ;
    case goog.events.KeyCodes.FF_SEMICOLON:
    ;
    case goog.events.KeyCodes.DASH:
    ;
    case goog.events.KeyCodes.EQUALS:
    ;
    case goog.events.KeyCodes.FF_EQUALS:
    ;
    case goog.events.KeyCodes.COMMA:
    ;
    case goog.events.KeyCodes.PERIOD:
    ;
    case goog.events.KeyCodes.SLASH:
    ;
    case goog.events.KeyCodes.APOSTROPHE:
    ;
    case goog.events.KeyCodes.SINGLE_QUOTE:
    ;
    case goog.events.KeyCodes.OPEN_SQUARE_BRACKET:
    ;
    case goog.events.KeyCodes.BACKSLASH:
    ;
    case goog.events.KeyCodes.CLOSE_SQUARE_BRACKET:
      return true;
    default:
      return false
  }
};
goog.events.KeyCodes.normalizeGeckoKeyCode = function(keyCode) {
  switch(keyCode) {
    case goog.events.KeyCodes.FF_EQUALS:
      return goog.events.KeyCodes.EQUALS;
    case goog.events.KeyCodes.FF_SEMICOLON:
      return goog.events.KeyCodes.SEMICOLON;
    case goog.events.KeyCodes.MAC_FF_META:
      return goog.events.KeyCodes.META;
    case goog.events.KeyCodes.WIN_KEY_FF_LINUX:
      return goog.events.KeyCodes.WIN_KEY;
    default:
      return keyCode
  }
};
goog.provide("goog.ui.tree.BaseNode");
goog.provide("goog.ui.tree.BaseNode.EventType");
goog.require("goog.Timer");
goog.require("goog.a11y.aria");
goog.require("goog.asserts");
goog.require("goog.events.KeyCodes");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.style");
goog.require("goog.ui.Component");
goog.require("goog.userAgent");
goog.ui.tree.BaseNode = function(html, opt_config, opt_domHelper) {
  goog.ui.Component.call(this, opt_domHelper);
  this.config_ = opt_config || goog.ui.tree.TreeControl.defaultConfig;
  this.html_ = html
};
goog.inherits(goog.ui.tree.BaseNode, goog.ui.Component);
goog.ui.tree.BaseNode.EventType = {BEFORE_EXPAND:"beforeexpand", EXPAND:"expand", BEFORE_COLLAPSE:"beforecollapse", COLLAPSE:"collapse"};
goog.ui.tree.BaseNode.allNodes = {};
goog.ui.tree.BaseNode.prototype.selected_ = false;
goog.ui.tree.BaseNode.prototype.expanded_ = false;
goog.ui.tree.BaseNode.prototype.toolTip_ = null;
goog.ui.tree.BaseNode.prototype.afterLabelHtml_ = "";
goog.ui.tree.BaseNode.prototype.isUserCollapsible_ = true;
goog.ui.tree.BaseNode.prototype.depth_ = -1;
goog.ui.tree.BaseNode.prototype.disposeInternal = function() {
  goog.ui.tree.BaseNode.superClass_.disposeInternal.call(this);
  if(this.tree_) {
    this.tree_.removeNode(this);
    this.tree_ = null
  }
  this.setElementInternal(null)
};
goog.ui.tree.BaseNode.prototype.initAccessibility = function() {
  var el = this.getElement();
  if(el) {
    var label = this.getLabelElement();
    if(label && !label.id) {
      label.id = this.getId() + ".label"
    }
    goog.a11y.aria.setRole(el, "treeitem");
    goog.a11y.aria.setState(el, "selected", false);
    goog.a11y.aria.setState(el, "expanded", false);
    goog.a11y.aria.setState(el, "level", this.getDepth());
    if(label) {
      goog.a11y.aria.setState(el, "labelledby", label.id)
    }
    var img = this.getIconElement();
    if(img) {
      goog.a11y.aria.setRole(img, "presentation")
    }
    var ei = this.getExpandIconElement();
    if(ei) {
      goog.a11y.aria.setRole(ei, "presentation")
    }
    var ce = this.getChildrenElement();
    if(ce) {
      goog.a11y.aria.setRole(ce, "group");
      if(ce.hasChildNodes()) {
        var count = this.getChildCount();
        for(var i = 1;i <= count;i++) {
          var child = this.getChildAt(i - 1).getElement();
          goog.asserts.assert(child, "The child element cannot be null");
          goog.a11y.aria.setState(child, "setsize", count);
          goog.a11y.aria.setState(child, "posinset", i)
        }
      }
    }
  }
};
goog.ui.tree.BaseNode.prototype.createDom = function() {
  var sb = new goog.string.StringBuffer;
  this.toHtml(sb);
  var element = this.getDomHelper().htmlToDocumentFragment(sb.toString());
  this.setElementInternal((element))
};
goog.ui.tree.BaseNode.prototype.enterDocument = function() {
  goog.ui.tree.BaseNode.superClass_.enterDocument.call(this);
  goog.ui.tree.BaseNode.allNodes[this.getId()] = this;
  this.initAccessibility()
};
goog.ui.tree.BaseNode.prototype.exitDocument = function() {
  goog.ui.tree.BaseNode.superClass_.exitDocument.call(this);
  delete goog.ui.tree.BaseNode.allNodes[this.getId()]
};
goog.ui.tree.BaseNode.prototype.addChildAt = function(child, index, opt_render) {
  goog.asserts.assert(!child.getParent());
  var prevNode = this.getChildAt(index - 1);
  var nextNode = this.getChildAt(index);
  goog.ui.tree.BaseNode.superClass_.addChildAt.call(this, child, index);
  child.previousSibling_ = prevNode;
  child.nextSibling_ = nextNode;
  if(prevNode) {
    prevNode.nextSibling_ = child
  }else {
    this.firstChild_ = child
  }
  if(nextNode) {
    nextNode.previousSibling_ = child
  }else {
    this.lastChild_ = child
  }
  var tree = this.getTree();
  if(tree) {
    child.setTreeInternal(tree)
  }
  child.setDepth_(this.getDepth() + 1);
  if(this.getElement()) {
    this.updateExpandIcon();
    if(this.getExpanded()) {
      var el = this.getChildrenElement();
      if(!child.getElement()) {
        child.createDom()
      }
      var childElement = child.getElement();
      var nextElement = nextNode && nextNode.getElement();
      el.insertBefore(childElement, nextElement);
      if(this.isInDocument()) {
        child.enterDocument()
      }
      if(!nextNode) {
        if(prevNode) {
          prevNode.updateExpandIcon()
        }else {
          goog.style.showElement(el, true);
          this.setExpanded(this.getExpanded())
        }
      }
    }
  }
};
goog.ui.tree.BaseNode.prototype.add = function(child, opt_before) {
  goog.asserts.assert(!opt_before || opt_before.getParent() == this, "Can only add nodes before siblings");
  if(child.getParent()) {
    child.getParent().removeChild(child)
  }
  this.addChildAt(child, opt_before ? this.indexOfChild(opt_before) : this.getChildCount());
  return child
};
goog.ui.tree.BaseNode.prototype.removeChild = function(childNode, opt_unrender) {
  var child = (childNode);
  var tree = this.getTree();
  var selectedNode = tree ? tree.getSelectedItem() : null;
  if(selectedNode == child || child.contains(selectedNode)) {
    if(tree.hasFocus()) {
      this.select();
      goog.Timer.callOnce(this.onTimeoutSelect_, 10, this)
    }else {
      this.select()
    }
  }
  goog.ui.tree.BaseNode.superClass_.removeChild.call(this, child);
  if(this.lastChild_ == child) {
    this.lastChild_ = child.previousSibling_
  }
  if(this.firstChild_ == child) {
    this.firstChild_ = child.nextSibling_
  }
  if(child.previousSibling_) {
    child.previousSibling_.nextSibling_ = child.nextSibling_
  }
  if(child.nextSibling_) {
    child.nextSibling_.previousSibling_ = child.previousSibling_
  }
  var wasLast = child.isLastSibling();
  child.tree_ = null;
  child.depth_ = -1;
  if(tree) {
    tree.removeNode(this);
    if(this.isInDocument()) {
      var el = this.getChildrenElement();
      if(child.isInDocument()) {
        var childEl = child.getElement();
        el.removeChild(childEl);
        child.exitDocument()
      }
      if(wasLast) {
        var newLast = this.getLastChild();
        if(newLast) {
          newLast.updateExpandIcon()
        }
      }
      if(!this.hasChildren()) {
        el.style.display = "none";
        this.updateExpandIcon();
        this.updateIcon_()
      }
    }
  }
  return child
};
goog.ui.tree.BaseNode.prototype.remove = goog.ui.tree.BaseNode.prototype.removeChild;
goog.ui.tree.BaseNode.prototype.onTimeoutSelect_ = function() {
  this.select()
};
goog.ui.tree.BaseNode.prototype.getTree = goog.abstractMethod;
goog.ui.tree.BaseNode.prototype.getDepth = function() {
  var depth = this.depth_;
  if(depth < 0) {
    depth = this.computeDepth_();
    this.setDepth_(depth)
  }
  return depth
};
goog.ui.tree.BaseNode.prototype.computeDepth_ = function() {
  var parent = this.getParent();
  if(parent) {
    return parent.getDepth() + 1
  }else {
    return 0
  }
};
goog.ui.tree.BaseNode.prototype.setDepth_ = function(depth) {
  if(depth != this.depth_) {
    this.depth_ = depth;
    var row = this.getRowElement();
    if(row) {
      var indent = this.getPixelIndent_() + "px";
      if(this.isRightToLeft()) {
        row.style.paddingRight = indent
      }else {
        row.style.paddingLeft = indent
      }
    }
    this.forEachChild(function(child) {
      child.setDepth_(depth + 1)
    })
  }
};
goog.ui.tree.BaseNode.prototype.contains = function(node) {
  var current = node;
  while(current) {
    if(current == this) {
      return true
    }
    current = current.getParent()
  }
  return false
};
goog.ui.tree.BaseNode.EMPTY_CHILDREN_ = [];
goog.ui.tree.BaseNode.prototype.getChildAt;
goog.ui.tree.BaseNode.prototype.getChildren = function() {
  var children = [];
  this.forEachChild(function(child) {
    children.push(child)
  });
  return children
};
goog.ui.tree.BaseNode.prototype.getFirstChild = function() {
  return this.getChildAt(0)
};
goog.ui.tree.BaseNode.prototype.getLastChild = function() {
  return this.getChildAt(this.getChildCount() - 1)
};
goog.ui.tree.BaseNode.prototype.getPreviousSibling = function() {
  return this.previousSibling_
};
goog.ui.tree.BaseNode.prototype.getNextSibling = function() {
  return this.nextSibling_
};
goog.ui.tree.BaseNode.prototype.isLastSibling = function() {
  return!this.nextSibling_
};
goog.ui.tree.BaseNode.prototype.isSelected = function() {
  return this.selected_
};
goog.ui.tree.BaseNode.prototype.select = function() {
  var tree = this.getTree();
  if(tree) {
    tree.setSelectedItem(this)
  }
};
goog.ui.tree.BaseNode.prototype.deselect = goog.nullFunction;
goog.ui.tree.BaseNode.prototype.setSelectedInternal = function(selected) {
  if(this.selected_ == selected) {
    return
  }
  this.selected_ = selected;
  this.updateRow();
  var el = this.getElement();
  if(el) {
    goog.a11y.aria.setState(el, "selected", selected);
    if(selected) {
      var treeElement = this.getTree().getElement();
      goog.asserts.assert(treeElement, "The DOM element for the tree cannot be null");
      goog.a11y.aria.setState(treeElement, "activedescendant", this.getId())
    }
  }
};
goog.ui.tree.BaseNode.prototype.getExpanded = function() {
  return this.expanded_
};
goog.ui.tree.BaseNode.prototype.setExpandedInternal = function(expanded) {
  this.expanded_ = expanded
};
goog.ui.tree.BaseNode.prototype.setExpanded = function(expanded) {
  var isStateChange = expanded != this.expanded_;
  if(isStateChange) {
    var prevented = !this.dispatchEvent(expanded ? goog.ui.tree.BaseNode.EventType.BEFORE_EXPAND : goog.ui.tree.BaseNode.EventType.BEFORE_COLLAPSE);
    if(prevented) {
      return
    }
  }
  var ce;
  this.expanded_ = expanded;
  var tree = this.getTree();
  var el = this.getElement();
  if(this.hasChildren()) {
    if(!expanded && (tree && this.contains(tree.getSelectedItem()))) {
      this.select()
    }
    if(el) {
      ce = this.getChildrenElement();
      if(ce) {
        goog.style.showElement(ce, expanded);
        if(expanded && (this.isInDocument() && !ce.hasChildNodes())) {
          var sb = new goog.string.StringBuffer;
          this.forEachChild(function(child) {
            child.toHtml(sb)
          });
          ce.innerHTML = sb.toString();
          this.forEachChild(function(child) {
            child.enterDocument()
          })
        }
      }
      this.updateExpandIcon()
    }
  }else {
    ce = this.getChildrenElement();
    if(ce) {
      goog.style.showElement(ce, false)
    }
  }
  if(el) {
    this.updateIcon_();
    goog.a11y.aria.setState(el, "expanded", expanded)
  }
  if(isStateChange) {
    this.dispatchEvent(expanded ? goog.ui.tree.BaseNode.EventType.EXPAND : goog.ui.tree.BaseNode.EventType.COLLAPSE)
  }
};
goog.ui.tree.BaseNode.prototype.toggle = function() {
  this.setExpanded(!this.getExpanded())
};
goog.ui.tree.BaseNode.prototype.expand = function() {
  this.setExpanded(true)
};
goog.ui.tree.BaseNode.prototype.collapse = function() {
  this.setExpanded(false)
};
goog.ui.tree.BaseNode.prototype.collapseChildren = function() {
  this.forEachChild(function(child) {
    child.collapseAll()
  })
};
goog.ui.tree.BaseNode.prototype.collapseAll = function() {
  this.collapseChildren();
  this.collapse()
};
goog.ui.tree.BaseNode.prototype.expandChildren = function() {
  this.forEachChild(function(child) {
    child.expandAll()
  })
};
goog.ui.tree.BaseNode.prototype.expandAll = function() {
  this.expandChildren();
  this.expand()
};
goog.ui.tree.BaseNode.prototype.reveal = function() {
  var parent = this.getParent();
  if(parent) {
    parent.setExpanded(true);
    parent.reveal()
  }
};
goog.ui.tree.BaseNode.prototype.setIsUserCollapsible = function(isCollapsible) {
  this.isUserCollapsible_ = isCollapsible;
  if(!this.isUserCollapsible_) {
    this.expand()
  }
  if(this.getElement()) {
    this.updateExpandIcon()
  }
};
goog.ui.tree.BaseNode.prototype.isUserCollapsible = function() {
  return this.isUserCollapsible_
};
goog.ui.tree.BaseNode.prototype.toHtml = function(sb) {
  var tree = this.getTree();
  var hideLines = !tree.getShowLines() || tree == this.getParent() && !tree.getShowRootLines();
  var childClass = hideLines ? this.config_.cssChildrenNoLines : this.config_.cssChildren;
  var nonEmptyAndExpanded = this.getExpanded() && this.hasChildren();
  sb.append('<div class="', this.config_.cssItem, '" id="', this.getId(), '">', this.getRowHtml(), '<div class="', childClass, '" style="', this.getLineStyle(), nonEmptyAndExpanded ? "" : "display:none;", '">');
  if(nonEmptyAndExpanded) {
    this.forEachChild(function(child) {
      child.toHtml(sb)
    })
  }
  sb.append("</div></div>")
};
goog.ui.tree.BaseNode.prototype.getPixelIndent_ = function() {
  return Math.max(0, (this.getDepth() - 1) * this.config_.indentWidth)
};
goog.ui.tree.BaseNode.prototype.getRowHtml = function() {
  var sb = new goog.string.StringBuffer;
  sb.append('<div class="', this.getRowClassName(), '" style="padding-', this.isRightToLeft() ? "right:" : "left:", this.getPixelIndent_(), 'px">', this.getExpandIconHtml(), this.getIconHtml(), this.getLabelHtml(), "</div>");
  return sb.toString()
};
goog.ui.tree.BaseNode.prototype.getRowClassName = function() {
  var selectedClass;
  if(this.isSelected()) {
    selectedClass = " " + this.config_.cssSelectedRow
  }else {
    selectedClass = ""
  }
  return this.config_.cssTreeRow + selectedClass
};
goog.ui.tree.BaseNode.prototype.getLabelHtml = function() {
  var toolTip = this.getToolTip();
  var sb = new goog.string.StringBuffer;
  sb.append('<span class="', this.config_.cssItemLabel, '"', toolTip ? ' title="' + goog.string.htmlEscape(toolTip) + '"' : "", ">", this.getHtml(), "</span>", "<span>", this.getAfterLabelHtml(), "</span>");
  return sb.toString()
};
goog.ui.tree.BaseNode.prototype.getAfterLabelHtml = function() {
  return this.afterLabelHtml_
};
goog.ui.tree.BaseNode.prototype.setAfterLabelHtml = function(html) {
  this.afterLabelHtml_ = html;
  var el = this.getAfterLabelElement();
  if(el) {
    el.innerHTML = html
  }
};
goog.ui.tree.BaseNode.prototype.getIconHtml = function() {
  return'<span style="display:inline-block" class="' + this.getCalculatedIconClass() + '"></span>'
};
goog.ui.tree.BaseNode.prototype.getCalculatedIconClass = goog.abstractMethod;
goog.ui.tree.BaseNode.prototype.getExpandIconHtml = function() {
  return'<span type="expand" style="display:inline-block" class="' + this.getExpandIconClass() + '"></span>'
};
goog.ui.tree.BaseNode.prototype.getExpandIconClass = function() {
  var tree = this.getTree();
  var hideLines = !tree.getShowLines() || tree == this.getParent() && !tree.getShowRootLines();
  var config = this.config_;
  var sb = new goog.string.StringBuffer;
  sb.append(config.cssTreeIcon, " ", config.cssExpandTreeIcon, " ");
  if(this.hasChildren()) {
    var bits = 0;
    if(tree.getShowExpandIcons() && this.isUserCollapsible_) {
      if(this.getExpanded()) {
        bits = 2
      }else {
        bits = 1
      }
    }
    if(!hideLines) {
      if(this.isLastSibling()) {
        bits += 4
      }else {
        bits += 8
      }
    }
    switch(bits) {
      case 1:
        sb.append(config.cssExpandTreeIconPlus);
        break;
      case 2:
        sb.append(config.cssExpandTreeIconMinus);
        break;
      case 4:
        sb.append(config.cssExpandTreeIconL);
        break;
      case 5:
        sb.append(config.cssExpandTreeIconLPlus);
        break;
      case 6:
        sb.append(config.cssExpandTreeIconLMinus);
        break;
      case 8:
        sb.append(config.cssExpandTreeIconT);
        break;
      case 9:
        sb.append(config.cssExpandTreeIconTPlus);
        break;
      case 10:
        sb.append(config.cssExpandTreeIconTMinus);
        break;
      default:
        sb.append(config.cssExpandTreeIconBlank)
    }
  }else {
    if(hideLines) {
      sb.append(config.cssExpandTreeIconBlank)
    }else {
      if(this.isLastSibling()) {
        sb.append(config.cssExpandTreeIconL)
      }else {
        sb.append(config.cssExpandTreeIconT)
      }
    }
  }
  return sb.toString()
};
goog.ui.tree.BaseNode.prototype.getLineStyle = function() {
  return"background-position:" + this.getLineStyle2() + ";"
};
goog.ui.tree.BaseNode.prototype.getLineStyle2 = function() {
  return(this.isLastSibling() ? "-100" : (this.getDepth() - 1) * this.config_.indentWidth) + "px 0"
};
goog.ui.tree.BaseNode.prototype.getElement = function() {
  var el = goog.ui.tree.BaseNode.superClass_.getElement.call(this);
  if(!el) {
    el = this.getDomHelper().getElement(this.getId());
    this.setElementInternal(el)
  }
  return el
};
goog.ui.tree.BaseNode.prototype.getRowElement = function() {
  var el = this.getElement();
  return el ? (el.firstChild) : null
};
goog.ui.tree.BaseNode.prototype.getExpandIconElement = function() {
  var el = this.getRowElement();
  return el ? (el.firstChild) : null
};
goog.ui.tree.BaseNode.prototype.getIconElement = function() {
  var el = this.getRowElement();
  return el ? (el.childNodes[1]) : null
};
goog.ui.tree.BaseNode.prototype.getLabelElement = function() {
  var el = this.getRowElement();
  return el && el.lastChild ? (el.lastChild.previousSibling) : null
};
goog.ui.tree.BaseNode.prototype.getAfterLabelElement = function() {
  var el = this.getRowElement();
  return el ? (el.lastChild) : null
};
goog.ui.tree.BaseNode.prototype.getChildrenElement = function() {
  var el = this.getElement();
  return el ? (el.lastChild) : null
};
goog.ui.tree.BaseNode.prototype.setIconClass = function(s) {
  this.iconClass_ = s;
  if(this.isInDocument()) {
    this.updateIcon_()
  }
};
goog.ui.tree.BaseNode.prototype.getIconClass = function() {
  return this.iconClass_
};
goog.ui.tree.BaseNode.prototype.setExpandedIconClass = function(s) {
  this.expandedIconClass_ = s;
  if(this.isInDocument()) {
    this.updateIcon_()
  }
};
goog.ui.tree.BaseNode.prototype.getExpandedIconClass = function() {
  return this.expandedIconClass_
};
goog.ui.tree.BaseNode.prototype.setText = function(s) {
  this.setHtml(goog.string.htmlEscape(s))
};
goog.ui.tree.BaseNode.prototype.getText = function() {
  return goog.string.unescapeEntities(this.getHtml())
};
goog.ui.tree.BaseNode.prototype.setHtml = function(s) {
  this.html_ = s;
  var el = this.getLabelElement();
  if(el) {
    el.innerHTML = s
  }
  var tree = this.getTree();
  if(tree) {
    tree.setNode(this)
  }
};
goog.ui.tree.BaseNode.prototype.getHtml = function() {
  return this.html_
};
goog.ui.tree.BaseNode.prototype.setToolTip = function(s) {
  this.toolTip_ = s;
  var el = this.getLabelElement();
  if(el) {
    el.title = s
  }
};
goog.ui.tree.BaseNode.prototype.getToolTip = function() {
  return this.toolTip_
};
goog.ui.tree.BaseNode.prototype.updateRow = function() {
  var rowEl = this.getRowElement();
  if(rowEl) {
    rowEl.className = this.getRowClassName()
  }
};
goog.ui.tree.BaseNode.prototype.updateExpandIcon = function() {
  var img = this.getExpandIconElement();
  if(img) {
    img.className = this.getExpandIconClass()
  }
  var cel = this.getChildrenElement();
  if(cel) {
    cel.style.backgroundPosition = this.getLineStyle2()
  }
};
goog.ui.tree.BaseNode.prototype.updateIcon_ = function() {
  this.getIconElement().className = this.getCalculatedIconClass()
};
goog.ui.tree.BaseNode.prototype.onMouseDown = function(e) {
  var el = e.target;
  var type = el.getAttribute("type");
  if(type == "expand" && this.hasChildren()) {
    if(this.isUserCollapsible_) {
      this.toggle()
    }
    return
  }
  this.select();
  this.updateRow()
};
goog.ui.tree.BaseNode.prototype.onClick_ = goog.events.Event.preventDefault;
goog.ui.tree.BaseNode.prototype.onDoubleClick_ = function(e) {
  var el = e.target;
  var type = el.getAttribute("type");
  if(type == "expand" && this.hasChildren()) {
    return
  }
  if(this.isUserCollapsible_) {
    this.toggle()
  }
};
goog.ui.tree.BaseNode.prototype.onKeyDown = function(e) {
  var handled = true;
  switch(e.keyCode) {
    case goog.events.KeyCodes.RIGHT:
      if(e.altKey) {
        break
      }
      if(this.hasChildren()) {
        if(!this.getExpanded()) {
          this.setExpanded(true)
        }else {
          this.getFirstChild().select()
        }
      }
      break;
    case goog.events.KeyCodes.LEFT:
      if(e.altKey) {
        break
      }
      if(this.hasChildren() && (this.getExpanded() && this.isUserCollapsible_)) {
        this.setExpanded(false)
      }else {
        var parent = this.getParent();
        var tree = this.getTree();
        if(parent && (tree.getShowRootNode() || parent != tree)) {
          parent.select()
        }
      }
      break;
    case goog.events.KeyCodes.DOWN:
      var nextNode = this.getNextShownNode();
      if(nextNode) {
        nextNode.select()
      }
      break;
    case goog.events.KeyCodes.UP:
      var previousNode = this.getPreviousShownNode();
      if(previousNode) {
        previousNode.select()
      }
      break;
    default:
      handled = false
  }
  if(handled) {
    e.preventDefault();
    var tree = this.getTree();
    if(tree) {
      tree.clearTypeAhead()
    }
  }
  return handled
};
goog.ui.tree.BaseNode.prototype.onKeyPress_ = function(e) {
  if(!e.altKey && (e.keyCode >= goog.events.KeyCodes.LEFT && e.keyCode <= goog.events.KeyCodes.DOWN)) {
    e.preventDefault()
  }
};
goog.ui.tree.BaseNode.prototype.getLastShownDescendant = function() {
  if(!this.getExpanded() || !this.hasChildren()) {
    return this
  }
  return this.getLastChild().getLastShownDescendant()
};
goog.ui.tree.BaseNode.prototype.getNextShownNode = function() {
  if(this.hasChildren() && this.getExpanded()) {
    return this.getFirstChild()
  }else {
    var parent = this;
    var next;
    while(parent != this.getTree()) {
      next = parent.getNextSibling();
      if(next != null) {
        return next
      }
      parent = parent.getParent()
    }
    return null
  }
};
goog.ui.tree.BaseNode.prototype.getPreviousShownNode = function() {
  var ps = this.getPreviousSibling();
  if(ps != null) {
    return ps.getLastShownDescendant()
  }
  var parent = this.getParent();
  var tree = this.getTree();
  if(!tree.getShowRootNode() && parent == tree) {
    return null
  }
  return(parent)
};
goog.ui.tree.BaseNode.prototype.getClientData = goog.ui.tree.BaseNode.prototype.getModel;
goog.ui.tree.BaseNode.prototype.setClientData = goog.ui.tree.BaseNode.prototype.setModel;
goog.ui.tree.BaseNode.prototype.getConfig = function() {
  return this.config_
};
goog.ui.tree.BaseNode.prototype.setTreeInternal = function(tree) {
  if(this.tree_ != tree) {
    this.tree_ = tree;
    tree.setNode(this);
    this.forEachChild(function(child) {
      child.setTreeInternal(tree)
    })
  }
};
goog.provide("goog.ui.tree.TreeNode");
goog.require("goog.ui.tree.BaseNode");
goog.ui.tree.TreeNode = function(html, opt_config, opt_domHelper) {
  goog.ui.tree.BaseNode.call(this, html, opt_config, opt_domHelper)
};
goog.inherits(goog.ui.tree.TreeNode, goog.ui.tree.BaseNode);
goog.ui.tree.TreeNode.prototype.tree_ = null;
goog.ui.tree.TreeNode.prototype.getTree = function() {
  if(this.tree_) {
    return this.tree_
  }
  var parent = this.getParent();
  if(parent) {
    var tree = parent.getTree();
    if(tree) {
      this.setTreeInternal(tree);
      return tree
    }
  }
  return null
};
goog.ui.tree.TreeNode.prototype.getCalculatedIconClass = function() {
  var expanded = this.getExpanded();
  if(expanded && this.expandedIconClass_) {
    return this.expandedIconClass_
  }
  if(!expanded && this.iconClass_) {
    return this.iconClass_
  }
  var config = this.getConfig();
  if(this.hasChildren()) {
    if(expanded && config.cssExpandedFolderIcon) {
      return config.cssTreeIcon + " " + config.cssExpandedFolderIcon
    }else {
      if(!expanded && config.cssCollapsedFolderIcon) {
        return config.cssTreeIcon + " " + config.cssCollapsedFolderIcon
      }
    }
  }else {
    if(config.cssFileIcon) {
      return config.cssTreeIcon + " " + config.cssFileIcon
    }
  }
  return""
};
goog.provide("Blockly.ContextMenu");
Blockly.ContextMenu.X_PADDING = 20;
Blockly.ContextMenu.Y_HEIGHT = 20;
Blockly.ContextMenu.visible = false;
Blockly.ContextMenu.createDom = function() {
  var svgGroup = (Blockly.createSvgElement("g", {"class":"blocklyHidden"}, null));
  Blockly.ContextMenu.svgGroup = svgGroup;
  Blockly.ContextMenu.svgShadow = Blockly.createSvgElement("rect", {"class":"blocklyContextMenuShadow", "x":2, "y":-2, "rx":4, "ry":4}, svgGroup);
  Blockly.ContextMenu.svgBackground = Blockly.createSvgElement("rect", {"class":"blocklyContextMenuBackground", "y":-4, "rx":4, "ry":4}, svgGroup);
  Blockly.ContextMenu.svgOptions = Blockly.createSvgElement("g", {"class":"blocklyContextMenuOptions"}, svgGroup);
  return svgGroup
};
Blockly.ContextMenu.show = function(xy, options) {
  if(!options.length) {
    Blockly.ContextMenu.hide();
    return
  }
  goog.dom.removeChildren(Blockly.ContextMenu.svgOptions);
  Blockly.ContextMenu.svgGroup.style.display = "block";
  var maxWidth = 0;
  var resizeList = [Blockly.ContextMenu.svgBackground, Blockly.ContextMenu.svgShadow];
  for(var x = 0, option;option = options[x];x++) {
    var gElement = Blockly.ContextMenu.optionToDom(option.text);
    var rectElement = (gElement.firstChild);
    var textElement = (gElement.lastChild);
    Blockly.ContextMenu.svgOptions.appendChild(gElement);
    gElement.setAttribute("transform", "translate(0, " + x * Blockly.ContextMenu.Y_HEIGHT + ")");
    resizeList.push(rectElement);
    Blockly.bindEvent_(gElement, "mousedown", null, Blockly.noEvent);
    if(option.enabled) {
      Blockly.bindEvent_(gElement, "mouseup", null, option.callback);
      Blockly.bindEvent_(gElement, "mouseup", null, Blockly.ContextMenu.hide)
    }else {
      gElement.setAttribute("class", "blocklyMenuDivDisabled")
    }
    maxWidth = Math.max(maxWidth, textElement.getComputedTextLength())
  }
  maxWidth += Blockly.ContextMenu.X_PADDING * 2;
  for(var x = 0;x < resizeList.length;x++) {
    resizeList[x].setAttribute("width", maxWidth)
  }
  if(Blockly.RTL) {
    for(var x = 0, gElement;gElement = Blockly.ContextMenu.svgOptions.childNodes[x];x++) {
      var textElement = gElement.lastChild;
      textElement.setAttribute("text-anchor", "end");
      textElement.setAttribute("x", maxWidth - Blockly.ContextMenu.X_PADDING)
    }
  }
  Blockly.ContextMenu.svgBackground.setAttribute("height", options.length * Blockly.ContextMenu.Y_HEIGHT + 8);
  Blockly.ContextMenu.svgShadow.setAttribute("height", options.length * Blockly.ContextMenu.Y_HEIGHT + 10);
  var anchorX = xy.x;
  var anchorY = xy.y;
  if(navigator.userAgent.indexOf("MSIE") >= 0 || navigator.userAgent.indexOf("Trident") >= 0) {
    Blockly.ContextMenu.svgGroup.style.display = "inline";
    var bBox = {x:Blockly.ContextMenu.svgGroup.getBBox().x, y:Blockly.ContextMenu.svgGroup.getBBox().y, width:Blockly.ContextMenu.svgGroup.scrollWidth, height:Blockly.ContextMenu.svgGroup.scrollHeight}
  }else {
    var bBox = Blockly.ContextMenu.svgGroup.getBBox()
  }
  var svgSize = Blockly.svgSize();
  if(anchorY + bBox.height > svgSize.height) {
    anchorY -= bBox.height - 10
  }
  if(Blockly.RTL) {
    if(anchorX - bBox.width <= 0) {
      anchorX++
    }else {
      anchorX -= bBox.width
    }
  }else {
    if(anchorX + bBox.width > svgSize.width) {
      anchorX -= bBox.width
    }else {
      anchorX++
    }
  }
  Blockly.ContextMenu.svgGroup.setAttribute("transform", "translate(" + anchorX + ", " + anchorY + ")");
  Blockly.ContextMenu.visible = true
};
Blockly.ContextMenu.optionToDom = function(text) {
  var gElement = Blockly.createSvgElement("g", {"class":"blocklyMenuDiv"}, null);
  var rectElement = Blockly.createSvgElement("rect", {"height":Blockly.ContextMenu.Y_HEIGHT}, gElement);
  var textElement = Blockly.createSvgElement("text", {"class":"blocklyMenuText", "x":Blockly.ContextMenu.X_PADDING, "y":15}, gElement);
  var textNode = document.createTextNode(text);
  textElement.appendChild(textNode);
  return gElement
};
Blockly.ContextMenu.hide = function() {
  if(Blockly.ContextMenu.visible) {
    Blockly.ContextMenu.svgGroup.style.display = "none";
    Blockly.ContextMenu.visible = false
  }
};
Blockly.ContextMenu.callbackFactory = function(block, xml) {
  return function() {
    var newBlock = Blockly.Xml.domToBlock_(block.workspace, xml);
    var xy = block.getRelativeToSurfaceXY();
    if(Blockly.RTL) {
      xy.x -= Blockly.SNAP_RADIUS
    }else {
      xy.x += Blockly.SNAP_RADIUS
    }
    xy.y += Blockly.SNAP_RADIUS * 2;
    newBlock.moveBy(xy.x, xy.y);
    newBlock.select()
  }
};
goog.provide("Blockly.Bubble");
goog.require("Blockly.Workspace");
Blockly.Bubble = function(workspace, content, shape, anchorX, anchorY, bubbleWidth, bubbleHeight) {
  var angle = Blockly.Bubble.ARROW_ANGLE;
  if(Blockly.RTL) {
    angle = -angle
  }
  this.arrow_radians_ = angle / 360 * Math.PI * 2;
  this.workspace_ = workspace;
  this.content_ = content;
  this.shape_ = shape;
  var canvas = workspace.getBubbleCanvas();
  canvas.appendChild(this.createDom_(content, !!(bubbleWidth && bubbleHeight)));
  this.setAnchorLocation(anchorX, anchorY);
  if(!bubbleWidth || !bubbleHeight) {
    if(navigator.userAgent.indexOf("MSIE") >= 0 || navigator.userAgent.indexOf("Trident") >= 0) {
      this.content_.style.display = "inline";
      var bBox = {x:this.content_.getBBox().x, y:this.content_.getBBox().y, width:this.content_.scrollWidth, height:this.content_.scrollHeight}
    }else {
      var bBox = (this.content_).getBBox()
    }
    bubbleWidth = bBox.width + 2 * Blockly.Bubble.BORDER_WIDTH;
    bubbleHeight = bBox.height + 2 * Blockly.Bubble.BORDER_WIDTH
  }
  this.setBubbleSize(bubbleWidth, bubbleHeight);
  this.positionBubble_();
  this.renderArrow_();
  this.rendered_ = true;
  if(!Blockly.readOnly) {
    Blockly.bindEvent_(this.bubbleBack_, "mousedown", this, this.bubbleMouseDown_);
    if(this.resizeGroup_) {
      Blockly.bindEvent_(this.resizeGroup_, "mousedown", this, this.resizeMouseDown_)
    }
  }
};
Blockly.Bubble.BORDER_WIDTH = 6;
Blockly.Bubble.ARROW_THICKNESS = 10;
Blockly.Bubble.ARROW_ANGLE = 20;
Blockly.Bubble.ARROW_BEND = 4;
Blockly.Bubble.ANCHOR_RADIUS = 8;
Blockly.Bubble.onMouseUpWrapper_ = null;
Blockly.Bubble.onMouseMoveWrapper_ = null;
Blockly.Bubble.unbindDragEvents_ = function() {
  if(Blockly.Bubble.onMouseUpWrapper_) {
    Blockly.unbindEvent_(Blockly.Bubble.onMouseUpWrapper_);
    Blockly.Bubble.onMouseUpWrapper_ = null
  }
  if(Blockly.Bubble.onMouseMoveWrapper_) {
    Blockly.unbindEvent_(Blockly.Bubble.onMouseMoveWrapper_);
    Blockly.Bubble.onMouseMoveWrapper_ = null
  }
};
Blockly.Bubble.prototype.rendered_ = false;
Blockly.Bubble.prototype.anchorX_ = 0;
Blockly.Bubble.prototype.anchorY_ = 0;
Blockly.Bubble.prototype.relativeLeft_ = 0;
Blockly.Bubble.prototype.relativeTop_ = 0;
Blockly.Bubble.prototype.width_ = 0;
Blockly.Bubble.prototype.height_ = 0;
Blockly.Bubble.prototype.autoLayout_ = true;
Blockly.Bubble.prototype.createDom_ = function(content, hasResize) {
  this.bubbleGroup_ = Blockly.createSvgElement("g", {}, null);
  var bubbleEmboss = Blockly.createSvgElement("g", {"filter":"url(#blocklyEmboss)"}, this.bubbleGroup_);
  this.bubbleArrow_ = Blockly.createSvgElement("path", {}, bubbleEmboss);
  this.bubbleBack_ = Blockly.createSvgElement("rect", {"class":"blocklyDraggable", "x":0, "y":0, "rx":Blockly.Bubble.BORDER_WIDTH, "ry":Blockly.Bubble.BORDER_WIDTH}, bubbleEmboss);
  if(hasResize) {
    this.resizeGroup_ = Blockly.createSvgElement("g", {"class":Blockly.RTL ? "blocklyResizeSW" : "blocklyResizeSE"}, this.bubbleGroup_);
    var resizeSize = 2 * Blockly.Bubble.BORDER_WIDTH;
    Blockly.createSvgElement("polygon", {"points":"0,x x,x x,0".replace(/x/g, resizeSize.toString())}, this.resizeGroup_);
    Blockly.createSvgElement("line", {"class":"blocklyResizeLine", "x1":resizeSize / 3, "y1":resizeSize - 1, "x2":resizeSize - 1, "y2":resizeSize / 3}, this.resizeGroup_);
    Blockly.createSvgElement("line", {"class":"blocklyResizeLine", "x1":resizeSize * 2 / 3, "y1":resizeSize - 1, "x2":resizeSize - 1, "y2":resizeSize * 2 / 3}, this.resizeGroup_)
  }else {
    this.resizeGroup_ = null
  }
  this.bubbleGroup_.appendChild(content);
  return this.bubbleGroup_
};
Blockly.Bubble.prototype.bubbleMouseDown_ = function(e) {
  this.promote_();
  Blockly.Bubble.unbindDragEvents_();
  if(Blockly.isRightButton(e)) {
    return
  }else {
    if(Blockly.isTargetInput_(e)) {
      return
    }
  }
  Blockly.setCursorHand_(true);
  if(Blockly.RTL) {
    this.dragDeltaX = this.relativeLeft_ + e.clientX
  }else {
    this.dragDeltaX = this.relativeLeft_ - e.clientX
  }
  this.dragDeltaY = this.relativeTop_ - e.clientY;
  Blockly.Bubble.onMouseUpWrapper_ = Blockly.bindEvent_(document, "mouseup", this, Blockly.Bubble.unbindDragEvents_);
  Blockly.Bubble.onMouseMoveWrapper_ = Blockly.bindEvent_(document, "mousemove", this, this.bubbleMouseMove_);
  Blockly.hideChaff();
  e.stopPropagation()
};
Blockly.Bubble.prototype.bubbleMouseMove_ = function(e) {
  this.autoLayout_ = false;
  if(Blockly.RTL) {
    this.relativeLeft_ = this.dragDeltaX - e.clientX
  }else {
    this.relativeLeft_ = this.dragDeltaX + e.clientX
  }
  this.relativeTop_ = this.dragDeltaY + e.clientY;
  this.positionBubble_();
  this.renderArrow_()
};
Blockly.Bubble.prototype.resizeMouseDown_ = function(e) {
  this.promote_();
  Blockly.Bubble.unbindDragEvents_();
  if(Blockly.isRightButton(e)) {
    return
  }
  Blockly.setCursorHand_(true);
  if(Blockly.RTL) {
    this.resizeDeltaWidth = this.width_ + e.clientX
  }else {
    this.resizeDeltaWidth = this.width_ - e.clientX
  }
  this.resizeDeltaHeight = this.height_ - e.clientY;
  Blockly.Bubble.onMouseUpWrapper_ = Blockly.bindEvent_(document, "mouseup", this, Blockly.Bubble.unbindDragEvents_);
  Blockly.Bubble.onMouseMoveWrapper_ = Blockly.bindEvent_(document, "mousemove", this, this.resizeMouseMove_);
  Blockly.hideChaff();
  e.stopPropagation()
};
Blockly.Bubble.prototype.resizeMouseMove_ = function(e) {
  this.autoLayout_ = false;
  var w = this.resizeDeltaWidth;
  var h = this.resizeDeltaHeight + e.clientY;
  if(Blockly.RTL) {
    w -= e.clientX
  }else {
    w += e.clientX
  }
  this.setBubbleSize(w, h);
  if(Blockly.RTL) {
    this.positionBubble_()
  }
};
Blockly.Bubble.prototype.registerResizeEvent = function(thisObject, callback) {
  Blockly.bindEvent_(this.bubbleGroup_, "resize", thisObject, callback)
};
Blockly.Bubble.prototype.promote_ = function() {
  var svgGroup = this.bubbleGroup_.parentNode;
  svgGroup.appendChild(this.bubbleGroup_)
};
Blockly.Bubble.prototype.setAnchorLocation = function(x, y) {
  this.anchorX_ = x;
  this.anchorY_ = y;
  if(this.rendered_) {
    this.positionBubble_()
  }
};
Blockly.Bubble.prototype.layoutBubble_ = function() {
  var relativeLeft = -this.width_ / 4;
  var relativeTop = -this.height_ - Blockly.BlockSvg.MIN_BLOCK_Y;
  if(this.workspace_.scrollbar) {
    var metrics = this.workspace_.getMetrics();
    if(this.anchorX_ + relativeLeft < Blockly.BlockSvg.SEP_SPACE_X + metrics.viewLeft) {
      relativeLeft = Blockly.BlockSvg.SEP_SPACE_X + metrics.viewLeft - this.anchorX_
    }else {
      if(metrics.viewLeft + metrics.viewWidth < this.anchorX_ + relativeLeft + this.width_ + Blockly.BlockSvg.SEP_SPACE_X + Blockly.Scrollbar.scrollbarThickness) {
        relativeLeft = metrics.viewLeft + metrics.viewWidth - this.anchorX_ - this.width_ - Blockly.BlockSvg.SEP_SPACE_X - Blockly.Scrollbar.scrollbarThickness
      }
    }
    if(this.anchorY_ + relativeTop < Blockly.BlockSvg.SEP_SPACE_Y + metrics.viewTop) {
      if(navigator.userAgent.indexOf("MSIE") >= 0 || navigator.userAgent.indexOf("Trident") >= 0) {
        this.shape_.style.display = "inline";
        var bBox = {x:this.shape_.getBBox().x, y:this.shape_.getBBox().y, width:this.shape_.scrollWidth, height:this.shape_.scrollHeight}
      }else {
        var bBox = (this.shape_).getBBox()
      }
      relativeTop = bBox.height
    }
  }
  this.relativeLeft_ = relativeLeft;
  this.relativeTop_ = relativeTop
};
Blockly.Bubble.prototype.positionBubble_ = function() {
  var left;
  if(Blockly.RTL) {
    left = this.anchorX_ - this.relativeLeft_ - this.width_
  }else {
    left = this.anchorX_ + this.relativeLeft_
  }
  var top = this.relativeTop_ + this.anchorY_;
  this.bubbleGroup_.setAttribute("transform", "translate(" + left + ", " + top + ")")
};
Blockly.Bubble.prototype.getBubbleSize = function() {
  return{width:this.width_, height:this.height_}
};
Blockly.Bubble.prototype.setBubbleSize = function(width, height) {
  var doubleBorderWidth = 2 * Blockly.Bubble.BORDER_WIDTH;
  width = Math.max(width, doubleBorderWidth + 45);
  height = Math.max(height, doubleBorderWidth + Blockly.BlockSvg.TITLE_HEIGHT);
  this.width_ = width;
  this.height_ = height;
  this.bubbleBack_.setAttribute("width", width);
  this.bubbleBack_.setAttribute("height", height);
  if(this.resizeGroup_) {
    if(Blockly.RTL) {
      var resizeSize = 2 * Blockly.Bubble.BORDER_WIDTH;
      this.resizeGroup_.setAttribute("transform", "translate(" + resizeSize + ", " + (height - doubleBorderWidth) + ") scale(-1 1)")
    }else {
      this.resizeGroup_.setAttribute("transform", "translate(" + (width - doubleBorderWidth) + ", " + (height - doubleBorderWidth) + ")")
    }
  }
  if(this.rendered_) {
    if(this.autoLayout_) {
      this.layoutBubble_()
    }
    this.positionBubble_();
    this.renderArrow_()
  }
  Blockly.fireUiEvent(this.bubbleGroup_, "resize")
};
Blockly.Bubble.prototype.renderArrow_ = function() {
  var steps = [];
  var relBubbleX = this.width_ / 2;
  var relBubbleY = this.height_ / 2;
  var relAnchorX = -this.relativeLeft_;
  var relAnchorY = -this.relativeTop_;
  if(relBubbleX == relAnchorX && relBubbleY == relAnchorY) {
    steps.push("M " + relBubbleX + "," + relBubbleY)
  }else {
    var rise = relAnchorY - relBubbleY;
    var run = relAnchorX - relBubbleX;
    if(Blockly.RTL) {
      run *= -1
    }
    var hypotenuse = Math.sqrt(rise * rise + run * run);
    var angle = Math.acos(run / hypotenuse);
    if(rise < 0) {
      angle = 2 * Math.PI - angle
    }
    var rightAngle = angle + Math.PI / 2;
    if(rightAngle > Math.PI * 2) {
      rightAngle -= Math.PI * 2
    }
    var rightRise = Math.sin(rightAngle);
    var rightRun = Math.cos(rightAngle);
    var bubbleSize = this.getBubbleSize();
    var thickness = (bubbleSize.width + bubbleSize.height) / Blockly.Bubble.ARROW_THICKNESS;
    thickness = Math.min(thickness, bubbleSize.width, bubbleSize.height) / 2;
    var backoffRatio = 1 - Blockly.Bubble.ANCHOR_RADIUS / hypotenuse;
    relAnchorX = relBubbleX + backoffRatio * run;
    relAnchorY = relBubbleY + backoffRatio * rise;
    var baseX1 = relBubbleX + thickness * rightRun;
    var baseY1 = relBubbleY + thickness * rightRise;
    var baseX2 = relBubbleX - thickness * rightRun;
    var baseY2 = relBubbleY - thickness * rightRise;
    var swirlAngle = angle + this.arrow_radians_;
    if(swirlAngle > Math.PI * 2) {
      swirlAngle -= Math.PI * 2
    }
    var swirlRise = Math.sin(swirlAngle) * hypotenuse / Blockly.Bubble.ARROW_BEND;
    var swirlRun = Math.cos(swirlAngle) * hypotenuse / Blockly.Bubble.ARROW_BEND;
    steps.push("M" + baseX1 + "," + baseY1);
    steps.push("C" + (baseX1 + swirlRun) + "," + (baseY1 + swirlRise) + " " + relAnchorX + "," + relAnchorY + " " + relAnchorX + "," + relAnchorY);
    steps.push("C" + relAnchorX + "," + relAnchorY + " " + (baseX2 + swirlRun) + "," + (baseY2 + swirlRise) + " " + baseX2 + "," + baseY2)
  }
  steps.push("z");
  this.bubbleArrow_.setAttribute("d", steps.join(" "))
};
Blockly.Bubble.prototype.setColour = function(hexColour) {
  this.bubbleBack_.setAttribute("fill", hexColour);
  this.bubbleArrow_.setAttribute("fill", hexColour)
};
Blockly.Bubble.prototype.dispose = function() {
  Blockly.Bubble.unbindDragEvents_();
  goog.dom.removeNode(this.bubbleGroup_);
  this.bubbleGroup_ = null;
  this.workspace_ = null;
  this.content_ = null;
  this.shape_ = null
};
goog.provide("Blockly.Icon");
Blockly.Icon = function(block) {
  this.block_ = block
};
Blockly.Icon.RADIUS = 8;
Blockly.Icon.prototype.bubble_ = null;
Blockly.Icon.prototype.iconX_ = 0;
Blockly.Icon.prototype.iconY_ = 0;
Blockly.Icon.prototype.createIcon_ = function() {
  this.iconGroup_ = Blockly.createSvgElement("g", {}, null);
  this.block_.getSvgRoot().appendChild(this.iconGroup_);
  Blockly.bindEvent_(this.iconGroup_, "mouseup", this, this.iconClick_);
  this.updateEditable()
};
Blockly.Icon.prototype.dispose = function() {
  goog.dom.removeNode(this.iconGroup_);
  this.iconGroup_ = null;
  this.setVisible(false);
  this.block_ = null
};
Blockly.Icon.prototype.updateEditable = function() {
  if(this.block_.isEditable() && !this.block_.isInFlyout) {
    Blockly.addClass_((this.iconGroup_), "blocklyIconGroup")
  }else {
    Blockly.removeClass_((this.iconGroup_), "blocklyIconGroup")
  }
};
Blockly.Icon.prototype.isVisible = function() {
  return!!this.bubble_
};
Blockly.Icon.prototype.iconClick_ = function(e) {
  if(this.block_.isEditable() && !this.block_.isInFlyout) {
    this.setVisible(!this.isVisible())
  }
};
Blockly.Icon.prototype.updateColour = function() {
  if(this.isVisible()) {
    var hexColour = Blockly.makeColour(this.block_.getColour(), this.block_.getSaturation(), this.block_.getValue());
    this.bubble_.setColour(hexColour)
  }
};
Blockly.Icon.prototype.renderIcon = function(cursorX) {
  if(this.block_.isCollapsed()) {
    this.iconGroup_.setAttribute("display", "none");
    return cursorX
  }
  this.iconGroup_.setAttribute("display", "block");
  var TOP_MARGIN = 5;
  var diameter = 2 * Blockly.Icon.RADIUS;
  if(Blockly.RTL) {
    cursorX -= diameter
  }
  this.iconGroup_.setAttribute("transform", "translate(" + cursorX + ", " + TOP_MARGIN + ")");
  this.computeIconLocation();
  if(Blockly.RTL) {
    cursorX -= Blockly.BlockSvg.SEP_SPACE_X
  }else {
    cursorX += diameter + Blockly.BlockSvg.SEP_SPACE_X
  }
  return cursorX
};
Blockly.Icon.prototype.setIconLocation = function(x, y) {
  this.iconX_ = x;
  this.iconY_ = y;
  if(this.isVisible()) {
    this.bubble_.setAnchorLocation(x, y)
  }
};
Blockly.Icon.prototype.computeIconLocation = function() {
  var blockXY = this.block_.getRelativeToSurfaceXY();
  var iconXY = Blockly.getRelativeXY_(this.iconGroup_);
  var newX = blockXY.x + iconXY.x + Blockly.Icon.RADIUS;
  var newY = blockXY.y + iconXY.y + Blockly.Icon.RADIUS;
  if(newX !== this.iconX_ || newY !== this.iconY_) {
    this.setIconLocation(newX, newY)
  }
};
Blockly.Icon.prototype.getIconLocation = function() {
  return{x:this.iconX_, y:this.iconY_}
};
goog.provide("Blockly.Mutator");
goog.require("Blockly.Bubble");
goog.require("Blockly.Icon");
Blockly.Mutator = function(quarkNames) {
  Blockly.Mutator.superClass_.constructor.call(this, null);
  this.quarkXml_ = [];
  for(var x = 0;x < quarkNames.length;x++) {
    var element = goog.dom.createDom("block", {"type":quarkNames[x]});
    this.quarkXml_[x] = element
  }
};
goog.inherits(Blockly.Mutator, Blockly.Icon);
Blockly.Mutator.prototype.workspaceWidth_ = 0;
Blockly.Mutator.prototype.workspaceHeight_ = 0;
Blockly.Mutator.prototype.createIcon = function() {
  Blockly.Icon.prototype.createIcon_.call(this);
  var quantum = Blockly.Icon.RADIUS / 2;
  var iconShield = Blockly.createSvgElement("rect", {"class":"blocklyIconShield", "width":4 * quantum, "height":4 * quantum, "rx":quantum, "ry":quantum}, this.iconGroup_);
  this.iconMark_ = Blockly.createSvgElement("text", {"class":"blocklyIconMark", "x":Blockly.Icon.RADIUS, "y":2 * Blockly.Icon.RADIUS - 4}, this.iconGroup_);
  this.iconMark_.appendChild(document.createTextNode("\u2605"))
};
Blockly.Mutator.prototype.createEditor_ = function() {
  this.svgDialog_ = Blockly.createSvgElement("svg", {"x":Blockly.Bubble.BORDER_WIDTH, "y":Blockly.Bubble.BORDER_WIDTH}, null);
  this.svgBackground_ = Blockly.createSvgElement("rect", {"class":"blocklyMutatorBackground", "height":"100%", "width":"100%"}, this.svgDialog_);
  var mutator = this;
  this.workspace_ = new Blockly.Workspace(function() {
    return mutator.getFlyoutMetrics_()
  }, null);
  this.flyout_ = new Blockly.Flyout;
  this.flyout_.autoClose = false;
  this.svgDialog_.appendChild(this.flyout_.createDom());
  this.svgDialog_.appendChild(this.workspace_.createDom());
  return this.svgDialog_
};
Blockly.Mutator.prototype.resizeBubble_ = function() {
  var doubleBorderWidth = 2 * Blockly.Bubble.BORDER_WIDTH;
  if(navigator.userAgent.indexOf("MSIE") >= 0 || navigator.userAgent.indexOf("Trident") >= 0) {
    this.workspace_.getCanvas().style.display = "inline";
    var workspaceSize = {x:this.workspace_.getCanvas().getBBox().x, y:this.workspace_.getCanvas().getBBox().y, width:this.workspace_.getCanvas().scrollWidth, height:this.workspace_.getCanvas().scrollHeight}
  }else {
    var workspaceSize = this.workspace_.getCanvas().getBBox()
  }
  var flyoutMetrics = this.flyout_.getMetrics_();
  var width;
  if(Blockly.RTL) {
    width = -workspaceSize.x
  }else {
    width = workspaceSize.width + workspaceSize.x
  }
  var height = Math.max(workspaceSize.height + doubleBorderWidth * 3, flyoutMetrics.contentHeight + 20);
  width += doubleBorderWidth * 3;
  if(Math.abs(this.workspaceWidth_ - width) > doubleBorderWidth || Math.abs(this.workspaceHeight_ - height) > doubleBorderWidth) {
    this.workspaceWidth_ = width;
    this.workspaceHeight_ = height;
    this.bubble_.setBubbleSize(width + doubleBorderWidth, height + doubleBorderWidth);
    this.svgDialog_.setAttribute("width", this.workspaceWidth_);
    this.svgDialog_.setAttribute("height", this.workspaceHeight_)
  }
  if(Blockly.RTL) {
    var translation = "translate(" + this.workspaceWidth_ + ",0)";
    this.workspace_.getCanvas().setAttribute("transform", translation)
  }
};
Blockly.Mutator.prototype.setVisible = function(visible) {
  if(visible == this.isVisible()) {
    return
  }
  if(visible) {
    this.bubble_ = new Blockly.Bubble(this.block_.workspace, this.createEditor_(), this.block_.svg_.svgGroup_, this.iconX_, this.iconY_, null, null);
    var thisObj = this;
    this.flyout_.init(this.workspace_, false);
    this.flyout_.show(this.quarkXml_);
    this.rootBlock_ = this.block_.decompose(this.workspace_);
    var blocks = this.rootBlock_.getDescendants();
    for(var i = 0, child;child = blocks[i];i++) {
      child.render()
    }
    this.rootBlock_.setMovable(false);
    this.rootBlock_.setDeletable(false);
    var margin = this.flyout_.CORNER_RADIUS * 2;
    var x = this.flyout_.width_ + margin;
    if(Blockly.RTL) {
      x = -x
    }
    this.rootBlock_.moveBy(x, margin);
    if(this.block_.saveConnections) {
      this.block_.saveConnections(this.rootBlock_);
      this.sourceListener_ = Blockly.bindEvent_(this.block_.workspace.getCanvas(), "blocklyWorkspaceChange", this.block_, function() {
        thisObj.block_.saveConnections(thisObj.rootBlock_)
      })
    }
    this.resizeBubble_();
    Blockly.bindEvent_(this.workspace_.getCanvas(), "blocklyWorkspaceChange", this.block_, function() {
      thisObj.workspaceChanged_()
    });
    this.updateColour()
  }else {
    this.svgDialog_ = null;
    this.svgBackground_ = null;
    this.flyout_.dispose();
    this.flyout_ = null;
    this.workspace_.dispose();
    this.workspace_ = null;
    this.rootBlock_ = null;
    this.bubble_.dispose();
    this.bubble_ = null;
    this.workspaceWidth_ = 0;
    this.workspaceHeight_ = 0;
    if(this.sourceListener_) {
      Blockly.unbindEvent_(this.sourceListener_);
      this.sourceListener_ = null
    }
  }
};
Blockly.Mutator.prototype.workspaceChanged_ = function() {
  if(Blockly.Block.dragMode_ == 0) {
    var blocks = this.workspace_.getTopBlocks(false);
    var MARGIN = 20;
    for(var b = 0, block;block = blocks[b];b++) {
      var blockXY = block.getRelativeToSurfaceXY();
      var blockHW = block.getHeightWidth();
      if(Blockly.RTL ? blockXY.x > -this.flyout_.width_ + MARGIN : blockXY.x < this.flyout_.width_ - MARGIN) {
        block.dispose(false, true)
      }else {
        if(blockXY.y + blockHW.height < MARGIN) {
          block.moveBy(0, MARGIN - blockHW.height - blockXY.y)
        }
      }
    }
  }
  if(this.rootBlock_.workspace == this.workspace_) {
    var savedRendered = this.block_.rendered;
    this.block_.rendered = false;
    this.block_.compose(this.rootBlock_);
    this.block_.rendered = savedRendered;
    if(this.block_.rendered) {
      this.block_.render()
    }
    this.resizeBubble_();
    this.block_.workspace.fireChangeEvent()
  }
};
Blockly.Mutator.prototype.getFlyoutMetrics_ = function() {
  var left = 0;
  if(Blockly.RTL) {
    left += this.workspaceWidth_
  }
  return{viewHeight:this.workspaceHeight_, viewWidth:0, absoluteTop:0, absoluteLeft:left}
};
Blockly.Mutator.prototype.dispose = function() {
  this.block_.mutator = null;
  Blockly.Icon.prototype.dispose.call(this)
};
goog.provide("Blockly.Connection");
goog.provide("Blockly.ConnectionDB");
goog.require("Blockly.Workspace");
Blockly.Connection = function(source, type) {
  this.sourceBlock_ = source;
  this.targetConnection = null;
  this.type = type;
  this.x_ = 0;
  this.y_ = 0;
  this.inDB_ = false;
  this.dbList_ = this.sourceBlock_.workspace.connectionDBList
};
Blockly.Connection.prototype.dispose = function() {
  if(this.targetConnection) {
    throw"Disconnect connection before disposing of it.";
  }
  if(this.inDB_) {
    this.dbList_[this.type].removeConnection_(this)
  }
  this.inDB_ = false;
  if(Blockly.highlightedConnection_ == this) {
    Blockly.highlightedConnection_ = null
  }
  if(Blockly.localConnection_ == this) {
    Blockly.localConnection_ = null
  }
};
Blockly.Connection.prototype.isSuperior = function() {
  return this.type == Blockly.INPUT_VALUE || this.type == Blockly.NEXT_STATEMENT
};
Blockly.Connection.prototype.connect = function(otherConnection) {
  if(this.sourceBlock_ == otherConnection.sourceBlock_) {
    throw"Attempted to connect a block to itself.";
  }
  if(this.sourceBlock_.workspace !== otherConnection.sourceBlock_.workspace) {
    throw"Blocks are on different workspaces.";
  }
  if(Blockly.OPPOSITE_TYPE[this.type] != otherConnection.type) {
    throw"Attempt to connect incompatible types.";
  }
  if(this.type == Blockly.INPUT_VALUE || this.type == Blockly.OUTPUT_VALUE) {
    if(this.targetConnection) {
      throw"Source connection already connected (value).";
    }else {
      if(otherConnection.targetConnection) {
        var orphanBlock = otherConnection.targetBlock();
        orphanBlock.setParent(null);
        if(!orphanBlock.outputConnection) {
          throw"Orphan block does not have an output connection.";
        }
        var newBlock = this.sourceBlock_;
        var connection;
        while(connection = Blockly.Connection.singleConnection_((newBlock), orphanBlock)) {
          if(connection.targetBlock()) {
            newBlock = connection.targetBlock()
          }else {
            connection.connect(orphanBlock.outputConnection);
            orphanBlock = null;
            break
          }
        }
        if(orphanBlock) {
          window.setTimeout(function() {
            orphanBlock.outputConnection.bumpAwayFrom_(otherConnection)
          }, Blockly.BUMP_DELAY)
        }
      }
    }
  }else {
    if(this.targetConnection) {
      throw"Source connection already connected (block).";
    }else {
      if(otherConnection.targetConnection) {
        if(this.type != Blockly.PREVIOUS_STATEMENT) {
          throw"Can only do a mid-stack connection with the top of a block.";
        }
        var orphanBlock = otherConnection.targetBlock();
        orphanBlock.setParent(null);
        if(!orphanBlock.previousConnection) {
          throw"Orphan block does not have a previous connection.";
        }
        var newBlock = this.sourceBlock_;
        while(newBlock.nextConnection) {
          if(newBlock.nextConnection.targetConnection) {
            newBlock = newBlock.nextConnection.targetBlock()
          }else {
            newBlock.nextConnection.connect(orphanBlock.previousConnection);
            orphanBlock = null;
            break
          }
        }
        if(orphanBlock) {
          window.setTimeout(function() {
            orphanBlock.previousConnection.bumpAwayFrom_(otherConnection)
          }, Blockly.BUMP_DELAY)
        }
      }
    }
  }
  var parentBlock, childBlock;
  if(this.isSuperior()) {
    parentBlock = this.sourceBlock_;
    childBlock = otherConnection.sourceBlock_
  }else {
    parentBlock = otherConnection.sourceBlock_;
    childBlock = this.sourceBlock_
  }
  this.targetConnection = otherConnection;
  otherConnection.targetConnection = this;
  childBlock.setParent(parentBlock);
  if(parentBlock.rendered) {
    parentBlock.svg_.updateDisabled()
  }
  if(childBlock.rendered) {
    childBlock.svg_.updateDisabled()
  }
  if(parentBlock.rendered && childBlock.rendered) {
    if(this.type == Blockly.NEXT_STATEMENT || this.type == Blockly.PREVIOUS_STATEMENT) {
      childBlock.render()
    }else {
      parentBlock.render()
    }
  }
};
Blockly.Connection.singleConnection_ = function(block, orphanBlock) {
  var connection = false;
  for(var x = 0;x < block.inputList.length;x++) {
    var thisConnection = block.inputList[x].connection;
    if(thisConnection && (thisConnection.type == Blockly.INPUT_VALUE && orphanBlock.outputConnection.checkType_(thisConnection))) {
      if(connection) {
        return null
      }
      connection = thisConnection
    }
  }
  return connection
};
Blockly.Connection.prototype.disconnect = function() {
  var otherConnection = this.targetConnection;
  if(!otherConnection) {
    throw"Source connection not connected.";
  }else {
    if(otherConnection.targetConnection != this) {
      throw"Target connection not connected to source connection.";
    }
  }
  otherConnection.targetConnection = null;
  this.targetConnection = null;
  var parentBlock, childBlock;
  if(this.isSuperior()) {
    parentBlock = this.sourceBlock_;
    childBlock = otherConnection.sourceBlock_
  }else {
    parentBlock = otherConnection.sourceBlock_;
    childBlock = this.sourceBlock_
  }
  if(parentBlock.rendered) {
    parentBlock.render()
  }
  if(childBlock.rendered) {
    childBlock.svg_.updateDisabled();
    childBlock.render()
  }
};
Blockly.Connection.prototype.targetBlock = function() {
  if(this.targetConnection) {
    return this.targetConnection.sourceBlock_
  }
  return null
};
Blockly.Connection.prototype.bumpAwayFrom_ = function(staticConnection) {
  if(Blockly.Block.dragMode_ != 0) {
    return
  }
  var rootBlock = this.sourceBlock_.getRootBlock();
  if(rootBlock.isInFlyout) {
    return
  }
  var reverse = false;
  if(!rootBlock.isMovable()) {
    rootBlock = staticConnection.sourceBlock_.getRootBlock();
    if(!rootBlock.isMovable()) {
      return
    }
    staticConnection = this;
    reverse = true
  }
  rootBlock.getSvgRoot().parentNode.appendChild(rootBlock.getSvgRoot());
  var dx = staticConnection.x_ + Blockly.SNAP_RADIUS - this.x_;
  var dy = staticConnection.y_ + Blockly.SNAP_RADIUS * 2 - this.y_;
  if(reverse) {
    dy = -dy
  }
  if(Blockly.RTL) {
    dx = -dx
  }
  rootBlock.moveBy(dx, dy)
};
Blockly.Connection.prototype.moveTo = function(x, y) {
  if(this.inDB_) {
    this.dbList_[this.type].removeConnection_(this)
  }
  this.x_ = x;
  this.y_ = y;
  this.dbList_[this.type].addConnection_(this)
};
Blockly.Connection.prototype.moveBy = function(dx, dy) {
  this.moveTo(this.x_ + dx, this.y_ + dy)
};
Blockly.Connection.prototype.highlight = function() {
  var steps;
  if(this.type == Blockly.INPUT_VALUE || this.type == Blockly.OUTPUT_VALUE) {
    var tabWidth = Blockly.RTL ? -Blockly.BlockSvg.TAB_WIDTH : Blockly.BlockSvg.TAB_WIDTH;
    steps = "m 0,0 v 5 c 0,10 " + -tabWidth + ",-8 " + -tabWidth + ",7.5 s " + tabWidth + ",-2.5 " + tabWidth + ",7.5 v 5"
  }else {
    if(Blockly.RTL) {
      steps = "m 20,0 h -5 l -6,4 -3,0 -6,-4 h -5"
    }else {
      steps = "m -20,0 h 5 l 6,4 3,0 6,-4 h 5"
    }
  }
  var xy = this.sourceBlock_.getRelativeToSurfaceXY();
  var x = this.x_ - xy.x;
  var y = this.y_ - xy.y;
  Blockly.Connection.highlightedPath_ = Blockly.createSvgElement("path", {"class":"blocklyHighlightedConnectionPath", "d":steps, transform:"translate(" + x + ", " + y + ")"}, this.sourceBlock_.getSvgRoot())
};
Blockly.Connection.prototype.unhighlight = function() {
  goog.dom.removeNode(Blockly.Connection.highlightedPath_);
  delete Blockly.Connection.highlightedPath_
};
Blockly.Connection.prototype.tighten_ = function() {
  var dx = Math.round(this.targetConnection.x_ - this.x_);
  var dy = Math.round(this.targetConnection.y_ - this.y_);
  if(dx != 0 || dy != 0) {
    var block = this.targetBlock();
    var svgRoot = block.getSvgRoot();
    if(!svgRoot) {
      throw"block is not rendered.";
    }
    var xy = Blockly.getRelativeXY_(svgRoot);
    block.getSvgRoot().setAttribute("transform", "translate(" + (xy.x - dx) + ", " + (xy.y - dy) + ")");
    block.moveConnections_(-dx, -dy)
  }
};
Blockly.Connection.prototype.closest = function(maxLimit, dx, dy) {
  if(this.targetConnection) {
    return{connection:null, radius:maxLimit}
  }
  var oppositeType = Blockly.OPPOSITE_TYPE[this.type];
  var db = this.dbList_[oppositeType];
  var currentX = this.x_ + dx;
  var currentY = this.y_ + dy;
  var pointerMin = 0;
  var pointerMax = db.length - 2;
  var pointerMid = pointerMax;
  while(pointerMin < pointerMid) {
    if(db[pointerMid].y_ < currentY) {
      pointerMin = pointerMid
    }else {
      pointerMax = pointerMid
    }
    pointerMid = Math.floor((pointerMin + pointerMax) / 2)
  }
  pointerMin = pointerMid;
  pointerMax = pointerMid;
  var closestConnection = null;
  var sourceBlock = this.sourceBlock_;
  var thisConnection = this;
  if(db.length) {
    while(pointerMin >= 0 && checkConnection_(pointerMin)) {
      pointerMin--
    }
    do {
      pointerMax++
    }while(pointerMax < db.length && checkConnection_(pointerMax))
  }
  function checkConnection_(yIndex) {
    var connection = db[yIndex];
    if(connection.type == Blockly.OUTPUT_VALUE || connection.type == Blockly.PREVIOUS_STATEMENT) {
      if(connection.targetConnection) {
        return true
      }
    }
    if(!thisConnection.checkType_(connection)) {
      return true
    }
    var targetSourceBlock = connection.sourceBlock_;
    do {
      if(sourceBlock == targetSourceBlock) {
        return true
      }
      targetSourceBlock = targetSourceBlock.getParent()
    }while(targetSourceBlock);
    var dx = currentX - db[yIndex].x_;
    var dy = currentY - db[yIndex].y_;
    var r = Math.sqrt(dx * dx + dy * dy);
    if(r <= maxLimit) {
      closestConnection = db[yIndex];
      maxLimit = r
    }
    return dy < maxLimit
  }
  return{connection:closestConnection, radius:maxLimit}
};
Blockly.Connection.prototype.checkType_ = function(otherConnection) {
  if(!this.check_ || !otherConnection.check_) {
    return true
  }
  for(var x = 0;x < this.check_.length;x++) {
    if(otherConnection.check_.indexOf(this.check_[x]) != -1) {
      return true
    }
  }
  return false
};
Blockly.Connection.prototype.setCheck = function(check) {
  if(check) {
    if(!(check instanceof Array)) {
      check = [check]
    }
    this.check_ = check;
    if(this.targetConnection && !this.checkType_(this.targetConnection)) {
      if(this.isSuperior()) {
        this.targetBlock().setParent(null)
      }else {
        this.sourceBlock_.setParent(null)
      }
      this.sourceBlock_.bumpNeighbours_()
    }
  }else {
    this.check_ = null
  }
  return this
};
Blockly.Connection.prototype.neighbours_ = function(maxLimit) {
  var oppositeType = Blockly.OPPOSITE_TYPE[this.type];
  var db = this.dbList_[oppositeType];
  var currentX = this.x_;
  var currentY = this.y_;
  var pointerMin = 0;
  var pointerMax = db.length - 2;
  var pointerMid = pointerMax;
  while(pointerMin < pointerMid) {
    if(db[pointerMid].y_ < currentY) {
      pointerMin = pointerMid
    }else {
      pointerMax = pointerMid
    }
    pointerMid = Math.floor((pointerMin + pointerMax) / 2)
  }
  pointerMin = pointerMid;
  pointerMax = pointerMid;
  var neighbours = [];
  var sourceBlock = this.sourceBlock_;
  if(db.length) {
    while(pointerMin >= 0 && checkConnection_(pointerMin)) {
      pointerMin--
    }
    do {
      pointerMax++
    }while(pointerMax < db.length && checkConnection_(pointerMax))
  }
  function checkConnection_(yIndex) {
    var dx = currentX - db[yIndex].x_;
    var dy = currentY - db[yIndex].y_;
    var r = Math.sqrt(dx * dx + dy * dy);
    if(r <= maxLimit) {
      neighbours.push(db[yIndex])
    }
    return dy < maxLimit
  }
  return neighbours
};
Blockly.Connection.prototype.hideAll = function() {
  if(this.inDB_) {
    this.dbList_[this.type].removeConnection_(this)
  }
  if(this.targetConnection) {
    var blocks = this.targetBlock().getDescendants();
    for(var b = 0;b < blocks.length;b++) {
      var block = blocks[b];
      var connections = block.getConnections_(true);
      for(var c = 0;c < connections.length;c++) {
        var connection = connections[c];
        if(connection.inDB_) {
          this.dbList_[connection.type].removeConnection_(connection)
        }
      }
      var icons = block.getIcons();
      for(var x = 0;x < icons.length;x++) {
        icons[x].setVisible(false)
      }
    }
  }
};
Blockly.Connection.prototype.unhideAll = function() {
  if(!this.inDB_) {
    this.dbList_[this.type].addConnection_(this)
  }
  var renderList = [];
  if(this.type != Blockly.INPUT_VALUE && this.type != Blockly.NEXT_STATEMENT) {
    return renderList
  }
  var block = this.targetBlock();
  if(block) {
    var connections;
    if(block.isCollapsed()) {
      connections = [];
      block.outputConnection && connections.push(block.outputConnection);
      block.nextConnection && connections.push(block.nextConnection);
      block.previousConnection && connections.push(block.previousConnection)
    }else {
      connections = block.getConnections_(true)
    }
    for(var c = 0;c < connections.length;c++) {
      renderList = renderList.concat(connections[c].unhideAll())
    }
    if(renderList.length == 0) {
      renderList[0] = block
    }
  }
  return renderList
};
Blockly.ConnectionDB = function() {
};
Blockly.ConnectionDB.prototype = new Array;
Blockly.ConnectionDB.constructor = Blockly.ConnectionDB;
Blockly.ConnectionDB.prototype.addConnection_ = function(connection) {
  if(connection.inDB_) {
    throw"Connection already in database.";
  }
  var pointerMin = 0;
  var pointerMax = this.length;
  while(pointerMin < pointerMax) {
    var pointerMid = Math.floor((pointerMin + pointerMax) / 2);
    if(this[pointerMid].y_ < connection.y_) {
      pointerMin = pointerMid + 1
    }else {
      if(this[pointerMid].y_ > connection.y_) {
        pointerMax = pointerMid
      }else {
        pointerMin = pointerMid;
        break
      }
    }
  }
  this.splice(pointerMin, 0, connection);
  connection.inDB_ = true
};
Blockly.ConnectionDB.prototype.removeConnection_ = function(connection) {
  if(!connection.inDB_) {
    throw"Connection not in database.";
  }
  connection.inDB_ = false;
  var pointerMin = 0;
  var pointerMax = this.length - 2;
  var pointerMid = pointerMax;
  while(pointerMin < pointerMid) {
    if(this[pointerMid].y_ < connection.y_) {
      pointerMin = pointerMid
    }else {
      pointerMax = pointerMid
    }
    pointerMid = Math.floor((pointerMin + pointerMax) / 2)
  }
  pointerMin = pointerMid;
  pointerMax = pointerMid;
  while(pointerMin >= 0 && this[pointerMin].y_ == connection.y_) {
    if(this[pointerMin] == connection) {
      this.splice(pointerMin, 1);
      return
    }
    pointerMin--
  }
  do {
    if(this[pointerMax] == connection) {
      this.splice(pointerMax, 1);
      return
    }
    pointerMax++
  }while(pointerMax < this.length && this[pointerMax].y_ == connection.y_);
  throw"Unable to find connection in connectionDB.";
};
Blockly.ConnectionDB.init = function(workspace) {
  var dbList = [];
  dbList[Blockly.INPUT_VALUE] = new Blockly.ConnectionDB;
  dbList[Blockly.OUTPUT_VALUE] = new Blockly.ConnectionDB;
  dbList[Blockly.NEXT_STATEMENT] = new Blockly.ConnectionDB;
  dbList[Blockly.PREVIOUS_STATEMENT] = new Blockly.ConnectionDB;
  workspace.connectionDBList = dbList
};
goog.provide("Blockly.Blocks");
goog.provide("Blockly.Comment");
goog.require("Blockly.Bubble");
goog.require("Blockly.Icon");
Blockly.Comment = function(block) {
  Blockly.Comment.superClass_.constructor.call(this, block);
  this.createIcon_()
};
goog.inherits(Blockly.Comment, Blockly.Icon);
Blockly.Comment.prototype.text_ = "";
Blockly.Comment.prototype.width_ = 160;
Blockly.Comment.prototype.height_ = 80;
Blockly.Comment.prototype.createIcon_ = function() {
  Blockly.Icon.prototype.createIcon_.call(this);
  var iconShield = Blockly.createSvgElement("circle", {"class":"blocklyIconShield", "r":Blockly.Icon.RADIUS, "cx":Blockly.Icon.RADIUS, "cy":Blockly.Icon.RADIUS}, this.iconGroup_);
  this.iconMark_ = Blockly.createSvgElement("text", {"class":"blocklyIconMark", "x":Blockly.Icon.RADIUS, "y":2 * Blockly.Icon.RADIUS - 3}, this.iconGroup_);
  this.iconMark_.appendChild(document.createTextNode("?"))
};
Blockly.Comment.prototype.createEditor_ = function() {
  this.foreignObject_ = Blockly.createSvgElement("foreignObject", {"x":Blockly.Bubble.BORDER_WIDTH, "y":Blockly.Bubble.BORDER_WIDTH}, null);
  var body = document.createElementNS(Blockly.HTML_NS, "body");
  body.setAttribute("xmlns", Blockly.HTML_NS);
  body.className = "blocklyMinimalBody";
  this.textarea_ = document.createElementNS(Blockly.HTML_NS, "textarea");
  this.textarea_.className = "blocklyCommentTextarea";
  this.textarea_.setAttribute("dir", Blockly.RTL ? "RTL" : "LTR");
  body.appendChild(this.textarea_);
  this.foreignObject_.appendChild(body);
  Blockly.bindEvent_(this.textarea_, "mouseup", this, this.textareaFocus_);
  return this.foreignObject_
};
Blockly.Comment.prototype.resizeBubble_ = function() {
  var size = this.bubble_.getBubbleSize();
  var doubleBorderWidth = 2 * Blockly.Bubble.BORDER_WIDTH;
  this.foreignObject_.setAttribute("width", size.width - doubleBorderWidth);
  this.foreignObject_.setAttribute("height", size.height - doubleBorderWidth);
  this.textarea_.style.width = size.width - doubleBorderWidth - 4 + "px";
  this.textarea_.style.height = size.height - doubleBorderWidth - 4 + "px"
};
Blockly.Comment.prototype.setVisible = function(visible) {
  if(visible == this.isVisible()) {
    return
  }
  var text = this.getText();
  var size = this.getBubbleSize();
  if(visible) {
    this.bubble_ = new Blockly.Bubble((this.block_.workspace), this.createEditor_(), this.block_.svg_.svgGroup_, this.iconX_, this.iconY_, this.width_, this.height_);
    this.bubble_.registerResizeEvent(this, this.resizeBubble_);
    this.updateColour();
    this.text_ = null
  }else {
    this.bubble_.dispose();
    this.bubble_ = null;
    this.textarea_ = null;
    this.foreignObject_ = null
  }
  this.setText(text);
  this.setBubbleSize(size.width, size.height)
};
Blockly.Comment.prototype.textareaFocus_ = function(e) {
  this.bubble_.promote_();
  this.textarea_.focus()
};
Blockly.Comment.prototype.getBubbleSize = function() {
  if(this.isVisible()) {
    return this.bubble_.getBubbleSize()
  }else {
    return{width:this.width_, height:this.height_}
  }
};
Blockly.Comment.prototype.setBubbleSize = function(width, height) {
  if(this.isVisible()) {
    this.bubble_.setBubbleSize(width, height)
  }else {
    this.width_ = width;
    this.height_ = height
  }
};
Blockly.Comment.prototype.getText = function() {
  return this.isVisible() ? this.textarea_.value : this.text_
};
Blockly.Comment.prototype.setText = function(text) {
  if(this.isVisible()) {
    this.textarea_.value = text
  }else {
    this.text_ = text
  }
};
Blockly.Comment.prototype.dispose = function() {
  this.block_.comment = null;
  Blockly.Icon.prototype.dispose.call(this)
};
goog.provide("Blockly.Tooltip");
Blockly.Tooltip.visible = false;
Blockly.Tooltip.mouseOutPid_ = 0;
Blockly.Tooltip.showPid_ = 0;
Blockly.Tooltip.lastXY_ = {x:0, y:0};
Blockly.Tooltip.element_ = null;
Blockly.Tooltip.poisonedElement_ = null;
Blockly.Tooltip.svgGroup_ = null;
Blockly.Tooltip.svgText_ = null;
Blockly.Tooltip.svgBackground_ = null;
Blockly.Tooltip.svgShadow_ = null;
Blockly.Tooltip.OFFSET_X = 0;
Blockly.Tooltip.OFFSET_Y = 10;
Blockly.Tooltip.RADIUS_OK = 10;
Blockly.Tooltip.HOVER_MS = 1E3;
Blockly.Tooltip.MARGINS = 5;
Blockly.Tooltip.createDom = function() {
  var svgGroup = (Blockly.createSvgElement("g", {"class":"blocklyHidden"}, null));
  Blockly.Tooltip.svgGroup_ = svgGroup;
  Blockly.Tooltip.svgShadow_ = (Blockly.createSvgElement("rect", {"class":"blocklyTooltipShadow", "x":2, "y":2}, svgGroup));
  Blockly.Tooltip.svgBackground_ = (Blockly.createSvgElement("rect", {"class":"blocklyTooltipBackground"}, svgGroup));
  Blockly.Tooltip.svgText_ = (Blockly.createSvgElement("text", {"class":"blocklyTooltipText"}, svgGroup));
  return svgGroup
};
Blockly.Tooltip.bindMouseEvents = function(element) {
  Blockly.bindEvent_(element, "mouseover", null, Blockly.Tooltip.onMouseOver_);
  Blockly.bindEvent_(element, "mouseout", null, Blockly.Tooltip.onMouseOut_);
  Blockly.bindEvent_(element, "mousemove", null, Blockly.Tooltip.onMouseMove_)
};
Blockly.Tooltip.onMouseOver_ = function(e) {
  var element = e.target;
  while(!goog.isString(element.tooltip) && !goog.isFunction(element.tooltip)) {
    element = element.tooltip
  }
  if(Blockly.Tooltip.element_ != element) {
    Blockly.Tooltip.hide();
    Blockly.Tooltip.poisonedElement_ = null;
    Blockly.Tooltip.element_ = element
  }
  window.clearTimeout(Blockly.Tooltip.mouseOutPid_)
};
Blockly.Tooltip.onMouseOut_ = function(e) {
  Blockly.Tooltip.mouseOutPid_ = window.setTimeout(function() {
    Blockly.Tooltip.element_ = null;
    Blockly.Tooltip.poisonedElement_ = null;
    Blockly.Tooltip.hide()
  }, 1);
  window.clearTimeout(Blockly.Tooltip.showPid_)
};
Blockly.Tooltip.onMouseMove_ = function(e) {
  if(!Blockly.Tooltip.element_ || !Blockly.Tooltip.element_.tooltip) {
    return
  }else {
    if(Blockly.ContextMenu && Blockly.ContextMenu.visible || Blockly.Block.dragMode_ != 0) {
      return
    }
  }
  if(Blockly.Tooltip.visible) {
    var mouseXY = Blockly.mouseToSvg(e);
    var dx = Blockly.Tooltip.lastXY_.x - mouseXY.x;
    var dy = Blockly.Tooltip.lastXY_.y - mouseXY.y;
    var dr = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    if(dr > Blockly.Tooltip.RADIUS_OK) {
      Blockly.Tooltip.hide()
    }
  }else {
    if(Blockly.Tooltip.poisonedElement_ != Blockly.Tooltip.element_) {
      window.clearTimeout(Blockly.Tooltip.showPid_);
      Blockly.Tooltip.lastXY_ = Blockly.mouseToSvg(e);
      Blockly.Tooltip.showPid_ = window.setTimeout(Blockly.Tooltip.show_, Blockly.Tooltip.HOVER_MS)
    }
  }
};
Blockly.Tooltip.hide = function() {
  if(Blockly.Tooltip.visible) {
    Blockly.Tooltip.visible = false;
    if(Blockly.Tooltip.svgGroup_) {
      Blockly.Tooltip.svgGroup_.style.display = "none"
    }
  }
  window.clearTimeout(Blockly.Tooltip.showPid_)
};
Blockly.Tooltip.show_ = function() {
  Blockly.Tooltip.poisonedElement_ = Blockly.Tooltip.element_;
  if(!Blockly.Tooltip.svgGroup_) {
    return
  }
  goog.dom.removeChildren((Blockly.Tooltip.svgText_));
  var tip = Blockly.Tooltip.element_.tooltip;
  if(goog.isFunction(tip)) {
    tip = tip()
  }
  var lines = tip.split("\n");
  for(var i = 0;i < lines.length;i++) {
    var tspanElement = Blockly.createSvgElement("tspan", {"dy":"1em", "x":Blockly.Tooltip.MARGINS}, Blockly.Tooltip.svgText_);
    var textNode = document.createTextNode(lines[i]);
    tspanElement.appendChild(textNode)
  }
  Blockly.Tooltip.visible = true;
  Blockly.Tooltip.svgGroup_.style.display = "block";
  if(navigator.userAgent.indexOf("MSIE") >= 0 || navigator.userAgent.indexOf("Trident") >= 0) {
    Blockly.Tooltip.svgText_.style.display = "inline";
    var bBox = {x:Blockly.Tooltip.svgText_.getBBox().x, y:Blockly.Tooltip.svgText_.getBBox().y, width:Blockly.Tooltip.svgText_.scrollWidth, height:Blockly.Tooltip.svgText_.scrollHeight}
  }else {
    var bBox = Blockly.Tooltip.svgText_.getBBox()
  }
  var width = 2 * Blockly.Tooltip.MARGINS + bBox.width;
  var height = bBox.height;
  Blockly.Tooltip.svgBackground_.setAttribute("width", width);
  Blockly.Tooltip.svgBackground_.setAttribute("height", height);
  Blockly.Tooltip.svgShadow_.setAttribute("width", width);
  Blockly.Tooltip.svgShadow_.setAttribute("height", height);
  if(Blockly.RTL) {
    var maxWidth = bBox.width;
    for(var x = 0, textElement;textElement = Blockly.Tooltip.svgText_.childNodes[x];x++) {
      textElement.setAttribute("text-anchor", "end");
      textElement.setAttribute("x", maxWidth + Blockly.Tooltip.MARGINS)
    }
  }
  var anchorX = Blockly.Tooltip.lastXY_.x;
  if(Blockly.RTL) {
    anchorX -= Blockly.Tooltip.OFFSET_X + width
  }else {
    anchorX += Blockly.Tooltip.OFFSET_X
  }
  var anchorY = Blockly.Tooltip.lastXY_.y + Blockly.Tooltip.OFFSET_Y;
  var svgSize = Blockly.svgSize();
  if(anchorY + bBox.height > svgSize.height) {
    anchorY -= bBox.height + 2 * Blockly.Tooltip.OFFSET_Y
  }
  if(Blockly.RTL) {
    anchorX = Math.max(Blockly.Tooltip.MARGINS, anchorX)
  }else {
    if(anchorX + bBox.width > svgSize.width - 2 * Blockly.Tooltip.MARGINS) {
      anchorX = svgSize.width - bBox.width - 2 * Blockly.Tooltip.MARGINS
    }
  }
  Blockly.Tooltip.svgGroup_.setAttribute("transform", "translate(" + anchorX + "," + anchorY + ")")
};
goog.provide("Blockly.FieldLabel");
goog.require("Blockly.Field");
goog.require("Blockly.Tooltip");
Blockly.FieldLabel = function(text) {
  this.sourceBlock_ = null;
  this.textElement_ = Blockly.createSvgElement("text", {"class":"blocklyText"}, null);
  this.size_ = {height:25, width:0};
  this.setText(text)
};
goog.inherits(Blockly.FieldLabel, Blockly.Field);
Blockly.FieldLabel.prototype.EDITABLE = false;
Blockly.FieldLabel.prototype.init = function(block) {
  if(this.sourceBlock_) {
    throw"Text has already been initialized once.";
  }
  this.sourceBlock_ = block;
  block.getSvgRoot().appendChild(this.textElement_);
  this.textElement_.tooltip = this.sourceBlock_;
  Blockly.Tooltip && Blockly.Tooltip.bindMouseEvents(this.textElement_)
};
Blockly.FieldLabel.prototype.dispose = function() {
  goog.dom.removeNode(this.textElement_);
  this.textElement_ = null
};
Blockly.FieldLabel.prototype.getRootElement = function() {
  return(this.textElement_)
};
Blockly.FieldLabel.prototype.setTooltip = function(newTip) {
  this.textElement_.tooltip = newTip
};
goog.provide("Blockly.Input");
goog.require("Blockly.Connection");
goog.require("Blockly.FieldLabel");
Blockly.Input = function(type, name, block, connection) {
  this.type = type;
  this.name = name;
  this.sourceBlock_ = block;
  this.connection = connection;
  this.titleRow = [];
  this.align = Blockly.ALIGN_LEFT;
  this.visible_ = true
};
Blockly.Input.prototype.appendTitle = function(title, opt_name) {
  if(!title && !opt_name) {
    return this
  }
  if(goog.isString(title)) {
    title = new Blockly.FieldLabel((title))
  }
  if(this.sourceBlock_.svg_) {
    title.init(this.sourceBlock_)
  }
  title.name = opt_name;
  if(title.prefixTitle) {
    this.appendTitle(title.prefixTitle)
  }
  this.titleRow.push(title);
  if(title.suffixTitle) {
    this.appendTitle(title.suffixTitle)
  }
  if(this.sourceBlock_.rendered) {
    this.sourceBlock_.render();
    this.sourceBlock_.bumpNeighbours_()
  }
  return this
};
Blockly.Input.prototype.isVisible = function() {
  return this.visible_
};
Blockly.Input.prototype.setVisible = function(visible) {
  var renderList = [];
  if(this.visible_ == visible) {
    return renderList
  }
  this.visible_ = visible;
  var display = visible ? "block" : "none";
  for(var y = 0, title;title = this.titleRow[y];y++) {
    title.setVisible(visible)
  }
  if(this.connection) {
    if(visible) {
      renderList = this.connection.unhideAll()
    }else {
      renderList = this.connection.hideAll()
    }
    var child = this.connection.targetBlock();
    if(child) {
      child.svg_.getRootElement().style.display = display;
      if(!visible) {
        child.rendered = false
      }
    }
  }
  return renderList
};
Blockly.Input.prototype.setCheck = function(check) {
  if(!this.connection) {
    throw"This input does not have a connection.";
  }
  this.connection.setCheck(check);
  return this
};
Blockly.Input.prototype.setAlign = function(align) {
  this.align = align;
  if(this.sourceBlock_.rendered) {
    this.sourceBlock_.render()
  }
  return this
};
Blockly.Input.prototype.init = function() {
  for(var x = 0;x < this.titleRow.length;x++) {
    this.titleRow[x].init(this.sourceBlock_)
  }
};
Blockly.Input.prototype.dispose = function() {
  for(var i = 0, title;title = this.titleRow[i];i++) {
    title.dispose()
  }
  if(this.connection) {
    this.connection.dispose()
  }
  this.sourceBlock_ = null
};
goog.provide("Blockly.Warning");
goog.require("Blockly.Bubble");
goog.require("Blockly.Icon");
Blockly.Warning = function(block) {
  Blockly.Warning.superClass_.constructor.call(this, block);
  this.createIcon_()
};
goog.inherits(Blockly.Warning, Blockly.Icon);
Blockly.Warning.prototype.text_ = "";
Blockly.Warning.prototype.createIcon_ = function() {
  Blockly.Icon.prototype.createIcon_.call(this);
  var iconShield = Blockly.createSvgElement("path", {"class":"blocklyIconShield", "d":"M 2,15 Q -1,15 0.5,12 L 6.5,1.7 Q 8,-1 9.5,1.7 L 15.5,12 " + "Q 17,15 14,15 z"}, this.iconGroup_);
  this.iconMark_ = Blockly.createSvgElement("text", {"class":"blocklyIconMark", "x":Blockly.Icon.RADIUS, "y":2 * Blockly.Icon.RADIUS - 3}, this.iconGroup_);
  this.iconMark_.appendChild(document.createTextNode("!"))
};
Blockly.Warning.prototype.textToDom_ = function(text) {
  var paragraph = (Blockly.createSvgElement("text", {"class":"blocklyText", "y":Blockly.Bubble.BORDER_WIDTH}, null));
  var lines = text.split("\n");
  for(var i = 0;i < lines.length;i++) {
    var tspanElement = Blockly.createSvgElement("tspan", {"dy":"1em", "x":Blockly.Bubble.BORDER_WIDTH}, paragraph);
    var textNode = document.createTextNode(lines[i]);
    tspanElement.appendChild(textNode)
  }
  return paragraph
};
Blockly.Warning.prototype.setVisible = function(visible) {
  if(visible == this.isVisible()) {
    return
  }
  if(visible) {
    var paragraph = this.textToDom_(this.text_);
    this.bubble_ = new Blockly.Bubble((this.block_.workspace), paragraph, this.block_.svg_.svgGroup_, this.iconX_, this.iconY_, null, null);
    if(Blockly.RTL) {
      if(navigator.userAgent.indexOf("MSIE") >= 0 || navigator.userAgent.indexOf("Trident") >= 0) {
        paragraph.style.display = "inline";
        var bBox = {x:paragraph.getBBox().x, y:paragraph.getBBox().y, width:paragraph.scrollWidth, height:paragraph.scrollHeight};
        var maxWidth = bBox.width
      }else {
        var maxWidth = paragraph.getBBox().width
      }
      for(var x = 0, textElement;textElement = paragraph.childNodes[x];x++) {
        textElement.setAttribute("text-anchor", "end");
        textElement.setAttribute("x", maxWidth + Blockly.Bubble.BORDER_WIDTH)
      }
    }
    this.updateColour();
    var size = this.bubble_.getBubbleSize();
    this.bubble_.setBubbleSize(size.width, size.height)
  }else {
    this.bubble_.dispose();
    this.bubble_ = null;
    this.body_ = null;
    this.foreignObject_ = null
  }
};
Blockly.Warning.prototype.bodyFocus_ = function(e) {
  this.bubble_.promote_()
};
Blockly.Warning.prototype.setText = function(text) {
  this.text_ = text;
  if(this.isVisible()) {
    this.setVisible(false);
    this.setVisible(true)
  }
};
Blockly.Warning.prototype.dispose = function() {
  this.block_.warning = null;
  Blockly.Icon.prototype.dispose.call(this)
};
goog.provide("Blockly.Block");
goog.require("Blockly.BlockSvg");
goog.require("Blockly.Blocks");
goog.require("Blockly.Comment");
goog.require("Blockly.Connection");
goog.require("Blockly.ContextMenu");
goog.require("Blockly.Input");
goog.require("Blockly.Msg");
goog.require("Blockly.Mutator");
goog.require("Blockly.Warning");
goog.require("Blockly.Workspace");
goog.require("Blockly.Xml");
goog.require("goog.asserts");
goog.require("goog.string");
goog.require("goog.Timer");
Blockly.uidCounter_ = 0;
Blockly.Block = function(workspace, prototypeName, htmlId) {
  this.id = ++Blockly.uidCounter_;
  this.htmlId = htmlId;
  this.outputConnection = null;
  this.nextConnection = null;
  this.previousConnection = null;
  this.inputList = [];
  this.inputsInline = false;
  this.rendered = false;
  this.disabled = false;
  this.tooltip = "";
  this.contextMenu = false;
  this.parentBlock_ = null;
  this.childBlocks_ = [];
  this.deletable_ = true;
  this.movable_ = true;
  this.editable_ = true;
  this.collapsed_ = false;
  this.workspace = workspace;
  this.isInFlyout = workspace.isFlyout;
  this.colourSaturation_ = 0.45;
  this.colourValue_ = 0.65;
  workspace.addTopBlock(this);
  if(prototypeName) {
    this.type = prototypeName;
    var prototype = Blockly.Blocks[prototypeName];
    if(!prototype) {
      throw'Error: "' + prototypeName + '" is an unknown language block.';
    }
    goog.mixin(this, prototype)
  }
  if(goog.isFunction(this.init)) {
    this.init()
  }
  if(goog.isFunction(this.onchange)) {
    Blockly.bindEvent_(workspace.getCanvas(), "blocklyWorkspaceChange", this, this.onchange)
  }
};
Blockly.Block.prototype.svg_ = null;
Blockly.Block.prototype.mutator = null;
Blockly.Block.prototype.comment = null;
Blockly.Block.prototype.warning = null;
Blockly.Block.prototype.getIcons = function() {
  var icons = [];
  if(this.mutator) {
    icons.push(this.mutator)
  }
  if(this.comment) {
    icons.push(this.comment)
  }
  if(this.warning) {
    icons.push(this.warning)
  }
  return icons
};
Blockly.Block.prototype.initSvg = function() {
  this.svg_ = new Blockly.BlockSvg(this);
  this.svg_.init();
  if(!Blockly.readOnly) {
    Blockly.bindEvent_(this.svg_.getRootElement(), "mousedown", this, this.onMouseDown_)
  }
  this.workspace.getCanvas().appendChild(this.svg_.getRootElement())
};
Blockly.Block.prototype.getSvgRoot = function() {
  return this.svg_ && this.svg_.getRootElement()
};
Blockly.Block.dragMode_ = 0;
Blockly.Block.onMouseUpWrapper_ = null;
Blockly.Block.onMouseMoveWrapper_ = null;
Blockly.Block.terminateDrag_ = function() {
  if(Blockly.Block.onMouseUpWrapper_) {
    Blockly.unbindEvent_(Blockly.Block.onMouseUpWrapper_);
    Blockly.Block.onMouseUpWrapper_ = null
  }
  if(Blockly.Block.onMouseMoveWrapper_) {
    Blockly.unbindEvent_(Blockly.Block.onMouseMoveWrapper_);
    Blockly.Block.onMouseMoveWrapper_ = null
  }
  var selected = Blockly.selected;
  if(Blockly.Block.dragMode_ == 2) {
    if(selected) {
      var xy = selected.getRelativeToSurfaceXY();
      var dx = xy.x - selected.startDragX;
      var dy = xy.y - selected.startDragY;
      selected.moveConnections_(dx, dy);
      delete selected.draggedBubbles_;
      selected.setDragging_(false);
      selected.render();
      goog.Timer.callOnce(selected.bumpNeighbours_, Blockly.BUMP_DELAY, selected);
      Blockly.fireUiEvent(window, "resize")
    }
  }
  if(selected) {
    selected.workspace.fireChangeEvent()
  }
  Blockly.Block.dragMode_ = 0
};
Blockly.Block.prototype.select = function() {
  if(!this.svg_) {
    throw"Block is not rendered.";
  }
  if(Blockly.selected) {
    Blockly.selected.unselect()
  }
  Blockly.selected = this;
  this.svg_.addSelect();
  Blockly.fireUiEvent(this.workspace.getCanvas(), "blocklySelectChange")
};
Blockly.Block.prototype.unselect = function() {
  if(!this.svg_) {
    throw"Block is not rendered.";
  }
  Blockly.selected = null;
  this.svg_.removeSelect();
  Blockly.fireUiEvent(this.workspace.getCanvas(), "blocklySelectChange")
};
Blockly.Block.prototype.dispose = function(healStack, animate) {
  this.rendered = false;
  this.unplug(healStack);
  if(animate && this.svg_) {
    this.svg_.disposeUiEffect()
  }
  this.workspace.removeTopBlock(this);
  this.workspace = null;
  if(Blockly.selected == this) {
    Blockly.selected = null;
    Blockly.terminateDrag_()
  }
  for(var x = this.childBlocks_.length - 1;x >= 0;x--) {
    this.childBlocks_[x].dispose(false)
  }
  var icons = this.getIcons();
  for(var x = 0;x < icons.length;x++) {
    icons[x].dispose()
  }
  for(var x = 0, input;input = this.inputList[x];x++) {
    input.dispose()
  }
  this.inputList = [];
  var connections = this.getConnections_(true);
  for(var x = 0;x < connections.length;x++) {
    var connection = connections[x];
    if(connection.targetConnection) {
      connection.disconnect()
    }
    connections[x].dispose()
  }
  if(this.svg_) {
    this.svg_.dispose();
    this.svg_ = null
  }
};
Blockly.Block.prototype.unplug = function(healStack, bump) {
  bump = bump && !!this.getParent();
  if(this.outputConnection) {
    if(this.outputConnection.targetConnection) {
      this.setParent(null)
    }
  }else {
    var previousTarget = null;
    if(this.previousConnection && this.previousConnection.targetConnection) {
      previousTarget = this.previousConnection.targetConnection;
      this.setParent(null)
    }
    if(healStack && (this.nextConnection && this.nextConnection.targetConnection)) {
      var nextTarget = this.nextConnection.targetConnection;
      var nextBlock = this.nextConnection.targetBlock();
      nextBlock.setParent(null);
      if(previousTarget) {
        previousTarget.connect(nextTarget)
      }
    }
  }
  if(bump) {
    var dx = Blockly.SNAP_RADIUS * (Blockly.RTL ? -1 : 1);
    var dy = Blockly.SNAP_RADIUS * 2;
    this.moveBy(dx, dy)
  }
};
Blockly.Block.prototype.getRelativeToSurfaceXY = function() {
  var x = 0;
  var y = 0;
  if(this.svg_) {
    var element = this.svg_.getRootElement();
    do {
      var xy = Blockly.getRelativeXY_(element);
      x += xy.x;
      y += xy.y;
      element = element.parentNode
    }while(element && element != this.workspace.getCanvas())
  }
  return{x:x, y:y}
};
Blockly.Block.prototype.moveBy = function(dx, dy) {
  var xy = this.getRelativeToSurfaceXY();
  this.svg_.getRootElement().setAttribute("transform", "translate(" + (xy.x + dx) + ", " + (xy.y + dy) + ")");
  this.moveConnections_(dx, dy)
};
Blockly.Block.prototype.getHeightWidth = function() {
  try {
    if(Blockly.ieVersion() && Blockly.ieVersion() <= 10) {
      this.getSvgRoot().style.display = "inline"
    }
    var bBox = goog.object.clone(this.getSvgRoot().getBBox())
  }catch(e) {
    return{height:0, width:0}
  }
  if(Blockly.BROKEN_CONTROL_POINTS) {
    bBox.height -= 10;
    if(this.nextConnection) {
      bBox.height += 4
    }
  }
  bBox.height -= 1;
  return bBox
};
Blockly.Block.prototype.onMouseDown_ = function(e) {
  if(this.isInFlyout) {
    return
  }
  Blockly.svgResize();
  Blockly.terminateDrag_();
  this.select();
  Blockly.hideChaff();
  if(Blockly.isRightButton(e)) {
    if(Blockly.ContextMenu) {
      this.showContextMenu_(Blockly.mouseToSvg(e))
    }
  }else {
    if(!this.isMovable()) {
      return
    }else {
      Blockly.removeAllRanges();
      Blockly.setCursorHand_(true);
      var xy = this.getRelativeToSurfaceXY();
      this.startDragX = xy.x;
      this.startDragY = xy.y;
      this.startDragMouseX = e.clientX;
      this.startDragMouseY = e.clientY;
      Blockly.Block.dragMode_ = 1;
      Blockly.Block.onMouseUpWrapper_ = Blockly.bindEvent_(document, "mouseup", this, this.onMouseUp_);
      Blockly.Block.onMouseMoveWrapper_ = Blockly.bindEvent_(document, "mousemove", this, this.onMouseMove_);
      this.draggedBubbles_ = [];
      var descendants = this.getDescendants();
      for(var x = 0, descendant;descendant = descendants[x];x++) {
        var icons = descendant.getIcons();
        for(var y = 0;y < icons.length;y++) {
          var data = icons[y].getIconLocation();
          data.bubble = icons[y];
          this.draggedBubbles_.push(data)
        }
      }
    }
  }
  e.stopPropagation()
};
Blockly.Block.prototype.onMouseUp_ = function(e) {
  Blockly.terminateDrag_();
  if(Blockly.selected && Blockly.highlightedConnection_) {
    Blockly.localConnection_.connect(Blockly.highlightedConnection_);
    if(this.svg_) {
      var inferiorConnection;
      if(Blockly.localConnection_.isSuperior()) {
        inferiorConnection = Blockly.highlightedConnection_
      }else {
        inferiorConnection = Blockly.localConnection_
      }
      inferiorConnection.sourceBlock_.svg_.connectionUiEffect()
    }
    if(this.workspace.trashcan && this.workspace.trashcan.isOpen) {
      this.workspace.trashcan.close()
    }
  }else {
    if(this.workspace.trashcan && this.workspace.trashcan.isOpen) {
      var trashcan = this.workspace.trashcan;
      goog.Timer.callOnce(trashcan.close, 100, trashcan);
      Blockly.selected.dispose(false, true);
      Blockly.fireUiEvent(window, "resize")
    }
  }
  if(Blockly.highlightedConnection_) {
    Blockly.highlightedConnection_.unhighlight();
    Blockly.highlightedConnection_ = null
  }
};
Blockly.Block.prototype.showHelp_ = function() {
  var url = goog.isFunction(this.helpUrl) ? this.helpUrl() : this.helpUrl;
  if(url) {
    window.open(url)
  }
};
Blockly.Block.prototype.duplicate_ = function() {
  var xmlBlock = Blockly.Xml.blockToDom_(this);
  Blockly.Xml.deleteNext(xmlBlock);
  var newBlock = Blockly.Xml.domToBlock_((this.workspace), xmlBlock);
  var xy = this.getRelativeToSurfaceXY();
  if(Blockly.RTL) {
    xy.x -= Blockly.SNAP_RADIUS
  }else {
    xy.x += Blockly.SNAP_RADIUS
  }
  xy.y += Blockly.SNAP_RADIUS * 2;
  newBlock.moveBy(xy.x, xy.y);
  return newBlock
};
Blockly.Block.prototype.showContextMenu_ = function(xy) {
  if(Blockly.readOnly || !this.contextMenu) {
    return
  }
  var block = this;
  var options = [];
  if(this.isDeletable() && !block.isInFlyout) {
    var duplicateOption = {text:Blockly.Msg.DUPLICATE_BLOCK, enabled:true, callback:function() {
      block.duplicate_()
    }};
    if(this.getDescendants().length > this.workspace.remainingCapacity()) {
      duplicateOption.enabled = false
    }
    options.push(duplicateOption);
    if(Blockly.Comment && !this.collapsed_) {
      var commentOption = {enabled:true};
      if(this.comment) {
        commentOption.text = Blockly.Msg.REMOVE_COMMENT;
        commentOption.callback = function() {
          block.setCommentText(null)
        }
      }else {
        commentOption.text = Blockly.Msg.ADD_COMMENT;
        commentOption.callback = function() {
          block.setCommentText("")
        }
      }
      options.push(commentOption)
    }
    if(!this.collapsed_) {
      for(var i = 0;i < this.inputList.length;i++) {
        if(this.inputList[i].type == Blockly.INPUT_VALUE) {
          var inlineOption = {enabled:true};
          inlineOption.text = this.inputsInline ? Blockly.Msg.EXTERNAL_INPUTS : Blockly.Msg.INLINE_INPUTS;
          inlineOption.callback = function() {
            block.setInputsInline(!block.inputsInline)
          };
          options.push(inlineOption);
          break
        }
      }
    }
    if(Blockly.collapse) {
      if(this.collapsed_) {
        var expandOption = {enabled:true};
        expandOption.text = Blockly.Msg.EXPAND_BLOCK;
        expandOption.callback = function() {
          block.setCollapsed(false)
        };
        options.push(expandOption)
      }else {
        var collapseOption = {enabled:true};
        collapseOption.text = Blockly.Msg.COLLAPSE_BLOCK;
        collapseOption.callback = function() {
          block.setCollapsed(true)
        };
        options.push(collapseOption)
      }
    }
    var disableOption = {text:this.disabled ? Blockly.Msg.ENABLE_BLOCK : Blockly.Msg.DISABLE_BLOCK, enabled:!this.getInheritedDisabled(), callback:function() {
      block.setDisabled(!block.disabled)
    }};
    options.push(disableOption);
    var descendantCount = this.getDescendants().length;
    if(block.nextConnection && block.nextConnection.targetConnection) {
      descendantCount -= this.nextConnection.targetBlock().getDescendants().length
    }
    var deleteOption = {text:descendantCount == 1 ? Blockly.Msg.DELETE_BLOCK : Blockly.Msg.DELETE_X_BLOCKS.replace("%1", descendantCount), enabled:true, callback:function() {
      block.dispose(true, true)
    }};
    options.push(deleteOption)
  }
  var url = goog.isFunction(this.helpUrl) ? this.helpUrl() : this.helpUrl;
  var helpOption = {enabled:!!url};
  helpOption.text = Blockly.Msg.HELP;
  helpOption.callback = function() {
    block.showHelp_()
  };
  options.push(helpOption);
  if(this.customContextMenu && !block.isInFlyout) {
    this.customContextMenu(options)
  }
  Blockly.ContextMenu.show(xy, options)
};
Blockly.Block.prototype.getConnections_ = function(all) {
  var myConnections = [];
  if(all || this.rendered) {
    if(this.outputConnection) {
      myConnections.push(this.outputConnection)
    }
    if(this.nextConnection) {
      myConnections.push(this.nextConnection)
    }
    if(this.previousConnection) {
      myConnections.push(this.previousConnection)
    }
    if(all || !this.collapsed_) {
      for(var x = 0, input;input = this.inputList[x];x++) {
        if(input.connection) {
          myConnections.push(input.connection)
        }
      }
    }
  }
  return myConnections
};
Blockly.Block.prototype.moveConnections_ = function(dx, dy) {
  if(!this.rendered) {
    return
  }
  var myConnections = this.getConnections_(false);
  for(var x = 0;x < myConnections.length;x++) {
    myConnections[x].moveBy(dx, dy)
  }
  var icons = this.getIcons();
  for(var x = 0;x < icons.length;x++) {
    icons[x].computeIconLocation()
  }
  for(var x = 0;x < this.childBlocks_.length;x++) {
    this.childBlocks_[x].moveConnections_(dx, dy)
  }
};
Blockly.Block.prototype.setDragging_ = function(adding) {
  if(adding) {
    this.svg_.addDragging()
  }else {
    this.svg_.removeDragging()
  }
  for(var x = 0;x < this.childBlocks_.length;x++) {
    this.childBlocks_[x].setDragging_(adding)
  }
};
Blockly.Block.prototype.onMouseMove_ = function(e) {
  if(e.type == "mousemove" && (e.clientX <= 1 && (e.clientY == 0 && e.button == 0))) {
    e.stopPropagation();
    return
  }
  Blockly.removeAllRanges();
  var dx = e.clientX - this.startDragMouseX;
  var dy = e.clientY - this.startDragMouseY;
  if(Blockly.Block.dragMode_ == 1) {
    var dr = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    if(dr > Blockly.DRAG_RADIUS) {
      Blockly.Block.dragMode_ = 2;
      this.setParent(null);
      this.setDragging_(true)
    }
  }
  if(Blockly.Block.dragMode_ == 2) {
    var x = this.startDragX + dx;
    var y = this.startDragY + dy;
    this.svg_.getRootElement().setAttribute("transform", "translate(" + x + ", " + y + ")");
    for(var i = 0;i < this.draggedBubbles_.length;i++) {
      var commentData = this.draggedBubbles_[i];
      commentData.bubble.setIconLocation(commentData.x + dx, commentData.y + dy)
    }
    var myConnections = this.getConnections_(false);
    var closestConnection = null;
    var localConnection = null;
    var radiusConnection = Blockly.SNAP_RADIUS;
    for(var i = 0;i < myConnections.length;i++) {
      var myConnection = myConnections[i];
      var neighbour = myConnection.closest(radiusConnection, dx, dy);
      if(neighbour.connection) {
        closestConnection = neighbour.connection;
        localConnection = myConnection;
        radiusConnection = neighbour.radius
      }
    }
    if(Blockly.highlightedConnection_ && Blockly.highlightedConnection_ != closestConnection) {
      Blockly.highlightedConnection_.unhighlight();
      Blockly.highlightedConnection_ = null;
      Blockly.localConnection_ = null
    }
    if(closestConnection && closestConnection != Blockly.highlightedConnection_) {
      closestConnection.highlight();
      Blockly.highlightedConnection_ = closestConnection;
      Blockly.localConnection_ = localConnection
    }
    if(this.workspace.trashcan && this.isDeletable()) {
      this.workspace.trashcan.onMouseMove(e)
    }
  }
  e.stopPropagation()
};
Blockly.Block.prototype.bumpNeighbours_ = function() {
  if(Blockly.Block.dragMode_ != 0) {
    return
  }
  var rootBlock = this.getRootBlock();
  if(rootBlock.isInFlyout) {
    return
  }
  var myConnections = this.getConnections_(false);
  for(var x = 0;x < myConnections.length;x++) {
    var connection = myConnections[x];
    if(connection.targetConnection && connection.isSuperior()) {
      connection.targetBlock().bumpNeighbours_()
    }
    var neighbours = connection.neighbours_(Blockly.SNAP_RADIUS);
    for(var y = 0;y < neighbours.length;y++) {
      var otherConnection = neighbours[y];
      if(!connection.targetConnection || !otherConnection.targetConnection) {
        if(otherConnection.sourceBlock_.getRootBlock() != rootBlock) {
          if(connection.isSuperior()) {
            otherConnection.bumpAwayFrom_(connection)
          }else {
            connection.bumpAwayFrom_(otherConnection)
          }
        }
      }
    }
  }
};
Blockly.Block.prototype.getParent = function() {
  return this.parentBlock_
};
Blockly.Block.prototype.getSurroundParent = function() {
  var block = this;
  while(true) {
    do {
      var prevBlock = block;
      block = block.getParent();
      if(!block) {
        return null
      }
    }while(block.nextConnection && block.nextConnection.targetBlock() == prevBlock);
    return block
  }
};
Blockly.Block.prototype.getRootBlock = function() {
  var rootBlock;
  var block = this;
  do {
    rootBlock = block;
    block = rootBlock.parentBlock_
  }while(block);
  return rootBlock
};
Blockly.Block.prototype.getChildren = function() {
  return this.childBlocks_
};
Blockly.Block.prototype.setParent = function(newParent) {
  if(this.parentBlock_) {
    var children = this.parentBlock_.childBlocks_;
    for(var child, x = 0;child = children[x];x++) {
      if(child == this) {
        children.splice(x, 1);
        break
      }
    }
    var xy = this.getRelativeToSurfaceXY();
    this.workspace.getCanvas().appendChild(this.svg_.getRootElement());
    this.svg_.getRootElement().setAttribute("transform", "translate(" + xy.x + ", " + xy.y + ")");
    this.parentBlock_ = null;
    if(this.previousConnection && this.previousConnection.targetConnection) {
      this.previousConnection.disconnect()
    }
    if(this.outputConnection && this.outputConnection.targetConnection) {
      this.outputConnection.disconnect()
    }
  }else {
    this.workspace.removeTopBlock(this)
  }
  this.parentBlock_ = newParent;
  if(newParent) {
    newParent.childBlocks_.push(this);
    var oldXY = this.getRelativeToSurfaceXY();
    if(newParent.svg_ && this.svg_) {
      newParent.svg_.getRootElement().appendChild(this.svg_.getRootElement())
    }
    var newXY = this.getRelativeToSurfaceXY();
    this.moveConnections_(newXY.x - oldXY.x, newXY.y - oldXY.y)
  }else {
    this.workspace.addTopBlock(this)
  }
};
Blockly.Block.prototype.getDescendants = function() {
  var blocks = [this];
  for(var child, x = 0;child = this.childBlocks_[x];x++) {
    blocks = blocks.concat(child.getDescendants())
  }
  return blocks
};
Blockly.Block.prototype.isDeletable = function() {
  return this.deletable_ && !Blockly.readOnly
};
Blockly.Block.prototype.setDeletable = function(deletable) {
  this.deletable_ = deletable;
  this.svg_ && this.svg_.updateMovable()
};
Blockly.Block.prototype.isMovable = function() {
  return this.movable_ && !Blockly.readOnly
};
Blockly.Block.prototype.setMovable = function(movable) {
  this.movable_ = movable
};
Blockly.Block.prototype.isEditable = function() {
  return this.editable_ && !Blockly.readOnly
};
Blockly.Block.prototype.setEditable = function(editable) {
  this.editable_ = editable;
  for(var x = 0, input;input = this.inputList[x];x++) {
    for(var y = 0, title;title = input.titleRow[y];y++) {
      title.updateEditable()
    }
  }
  var icons = this.getIcons();
  for(var x = 0;x < icons.length;x++) {
    icons[x].updateEditable()
  }
};
Blockly.Block.prototype.setHelpUrl = function(url) {
  this.helpUrl = url
};
Blockly.Block.prototype.getColour = function() {
  return this.colourHue_
};
Blockly.Block.prototype.getSaturation = function() {
  return this.colourSaturation_
};
Blockly.Block.prototype.getValue = function() {
  return this.colourValue_
};
Blockly.Block.prototype.setColour = function(colourHue) {
  this.colourHue_ = colourHue;
  if(this.svg_) {
    this.svg_.updateColour()
  }
  var icons = this.getIcons();
  for(var x = 0;x < icons.length;x++) {
    icons[x].updateColour()
  }
  if(this.rendered) {
    for(var x = 0, input;input = this.inputList[x];x++) {
      for(var y = 0, title;title = input.titleRow[y];y++) {
        title.setText(null)
      }
    }
    this.render()
  }
};
Blockly.Block.prototype.setHSV = function(colourHue, colourSaturation, colourValue) {
  this.colourHue_ = colourHue;
  this.colourSaturation_ = colourSaturation;
  this.colourValue_ = colourValue;
  if(this.svg_) {
    this.svg_.updateColour()
  }
  var icons = this.getIcons();
  for(var x = 0;x < icons.length;x++) {
    icons[x].updateColour()
  }
  if(this.rendered) {
    for(var x = 0, input;input = this.inputList[x];x++) {
      for(var y = 0, title;title = input.titleRow[y];y++) {
        title.setText(null)
      }
    }
    this.render()
  }
};
Blockly.Block.prototype.getTitle_ = function(name) {
  for(var x = 0, input;input = this.inputList[x];x++) {
    for(var y = 0, title;title = input.titleRow[y];y++) {
      if(title.name === name) {
        return title
      }
    }
  }
  return null
};
Blockly.Block.prototype.getTitleValue = function(name) {
  var title = this.getTitle_(name);
  if(title) {
    return title.getValue()
  }
  return null
};
Blockly.Block.prototype.setTitleValue = function(newValue, name) {
  var title = this.getTitle_(name);
  if(title) {
    title.setValue(newValue)
  }else {
    throw'Title "' + name + '" not found.';
  }
};
Blockly.Block.prototype.setTooltip = function(newTip) {
  this.tooltip = newTip
};
Blockly.Block.prototype.setPreviousStatement = function(newBoolean, opt_check) {
  if(this.previousConnection) {
    if(this.previousConnection.targetConnection) {
      throw"Must disconnect previous statement before removing connection.";
    }
    this.previousConnection.dispose();
    this.previousConnection = null
  }
  if(newBoolean) {
    if(this.outputConnection) {
      throw"Remove output connection prior to adding previous connection.";
    }
    if(opt_check === undefined) {
      opt_check = null
    }
    this.previousConnection = new Blockly.Connection(this, Blockly.PREVIOUS_STATEMENT);
    this.previousConnection.setCheck(opt_check)
  }
  if(this.rendered) {
    this.render();
    this.bumpNeighbours_()
  }
};
Blockly.Block.prototype.setNextStatement = function(newBoolean, opt_check) {
  if(this.nextConnection) {
    if(this.nextConnection.targetConnection) {
      throw"Must disconnect next statement before removing connection.";
    }
    this.nextConnection.dispose();
    this.nextConnection = null
  }
  if(newBoolean) {
    if(opt_check === undefined) {
      opt_check = null
    }
    this.nextConnection = new Blockly.Connection(this, Blockly.NEXT_STATEMENT);
    this.nextConnection.setCheck(opt_check)
  }
  if(this.rendered) {
    this.render();
    this.bumpNeighbours_()
  }
};
Blockly.Block.prototype.setOutput = function(newBoolean, opt_check) {
  if(this.outputConnection) {
    if(this.outputConnection.targetConnection) {
      throw"Must disconnect output value before removing connection.";
    }
    this.outputConnection.dispose();
    this.outputConnection = null
  }
  if(newBoolean) {
    if(this.previousConnection) {
      throw"Remove previous connection prior to adding output connection.";
    }
    if(opt_check === undefined) {
      opt_check = null
    }
    this.outputConnection = new Blockly.Connection(this, Blockly.OUTPUT_VALUE);
    this.outputConnection.setCheck(opt_check)
  }
  if(this.rendered) {
    this.render();
    this.bumpNeighbours_()
  }
};
Blockly.Block.prototype.setInputsInline = function(newBoolean) {
  this.inputsInline = newBoolean;
  if(this.rendered) {
    this.render();
    this.bumpNeighbours_();
    this.workspace.fireChangeEvent()
  }
};
Blockly.Block.prototype.setDisabled = function(disabled) {
  if(this.disabled == disabled) {
    return
  }
  this.disabled = disabled;
  this.svg_.updateDisabled();
  this.workspace.fireChangeEvent()
};
Blockly.Block.prototype.getInheritedDisabled = function() {
  var block = this;
  while(true) {
    block = block.getSurroundParent();
    if(!block) {
      return false
    }else {
      if(block.disabled) {
        return true
      }
    }
  }
};
Blockly.Block.prototype.isCollapsed = function() {
  return this.collapsed_
};
Blockly.Block.prototype.setCollapsed = function(collapsed) {
  if(this.collapsed_ == collapsed) {
    return
  }
  this.collapsed_ = collapsed;
  var renderList = [];
  for(var x = 0, input;input = this.inputList[x];x++) {
    renderList = renderList.concat(input.setVisible(!collapsed))
  }
  var COLLAPSED_INPUT_NAME = "_TEMP_COLLAPSED_INPUT";
  if(collapsed) {
    var icons = this.getIcons();
    for(var x = 0;x < icons.length;x++) {
      icons[x].setVisible(false)
    }
    var text = this.toString(Blockly.COLLAPSE_CHARS);
    this.appendDummyInput(COLLAPSED_INPUT_NAME).appendTitle(text)
  }else {
    this.removeInput(COLLAPSED_INPUT_NAME)
  }
  if(!renderList.length) {
    renderList[0] = this
  }
  if(this.rendered) {
    for(var x = 0, block;block = renderList[x];x++) {
      block.render()
    }
    this.bumpNeighbours_()
  }
};
Blockly.Block.prototype.toString = function(opt_maxLength) {
  var text = [];
  for(var x = 0, input;input = this.inputList[x];x++) {
    for(var y = 0, title;title = input.titleRow[y];y++) {
      text.push(title.getText())
    }
    if(input.connection) {
      var child = input.connection.targetBlock();
      if(child) {
        text.push(child.toString())
      }else {
        text.push("?")
      }
    }
  }
  text = goog.string.trim(text.join(" ")) || "???";
  if(opt_maxLength) {
    text = goog.string.truncate(text, opt_maxLength)
  }
  return text
};
Blockly.Block.prototype.appendValueInput = function(name) {
  return this.appendInput_(Blockly.INPUT_VALUE, name)
};
Blockly.Block.prototype.appendStatementInput = function(name) {
  return this.appendInput_(Blockly.NEXT_STATEMENT, name)
};
Blockly.Block.prototype.appendDummyInput = function(opt_name) {
  return this.appendInput_(Blockly.DUMMY_INPUT, opt_name || "")
};
Blockly.Block.prototype.interpolateMsg = function(msg, var_args) {
  goog.asserts.assertString(msg);
  var dummyAlign = arguments.length - 1;
  goog.asserts.assertNumber(dummyAlign);
  var tokens = msg.split(/(%\d)/);
  for(var i = 0;i < tokens.length;i += 2) {
    var text = goog.string.trim(tokens[i]);
    var symbol = tokens[i + 1];
    if(symbol) {
      var digit = window.parseInt(symbol.charAt(1), 10);
      var tuple = arguments[digit];
      goog.asserts.assertArray(tuple, 'Message symbol "%s" is out of range.', symbol);
      this.appendValueInput(tuple[0]).setCheck(tuple[1]).setAlign(tuple[2]).appendTitle(text);
      arguments[digit] = null
    }else {
      if(text) {
        this.appendDummyInput().setAlign(dummyAlign).appendTitle(text)
      }
    }
  }
  for(var i = 1;i < arguments.length - 1;i++) {
    goog.asserts.assert(arguments[i] === null, 'Input "%%s" not used in message: "%s"', i, msg)
  }
  this.setInputsInline(!msg.match(/%1\s*$/))
};
Blockly.Block.prototype.appendInput_ = function(type, name) {
  var connection = null;
  if(type == Blockly.INPUT_VALUE || type == Blockly.NEXT_STATEMENT) {
    connection = new Blockly.Connection(this, type)
  }
  var input = new Blockly.Input(type, name, this, connection);
  this.inputList.push(input);
  if(this.rendered) {
    this.render();
    this.bumpNeighbours_()
  }
  return input
};
Blockly.Block.prototype.moveInputBefore = function(name, refName) {
  if(name == refName) {
    throw"Can't move \"" + name + '" to itself.';
  }
  var inputIndex = -1;
  var refIndex = -1;
  for(var x = 0, input;input = this.inputList[x];x++) {
    if(input.name == name) {
      inputIndex = x;
      if(refIndex != -1) {
        break
      }
    }else {
      if(input.name == refName) {
        refIndex = x;
        if(inputIndex != -1) {
          break
        }
      }
    }
  }
  if(inputIndex == -1) {
    throw'Named input "' + name + '" not found.';
  }
  if(refIndex == -1) {
    throw'Reference input "' + name + '" not found.';
  }
  this.inputList.splice(inputIndex, 1);
  if(inputIndex < refIndex) {
    refIndex--
  }
  this.inputList.splice(refIndex, 0, input);
  if(this.rendered) {
    this.render();
    this.bumpNeighbours_()
  }
};
Blockly.Block.prototype.removeInput = function(name) {
  for(var x = 0, input;input = this.inputList[x];x++) {
    if(input.name == name) {
      if(input.connection && input.connection.targetConnection) {
        input.connection.targetBlock().setParent(null)
      }
      input.dispose();
      this.inputList.splice(x, 1);
      if(this.rendered) {
        this.render();
        this.bumpNeighbours_()
      }
      return
    }
  }
  throw'Input "' + name + '" not found.';
};
Blockly.Block.prototype.getInput = function(name) {
  for(var x = 0, input;input = this.inputList[x];x++) {
    if(input.name == name) {
      return input
    }
  }
  return null
};
Blockly.Block.prototype.getInputTargetBlock = function(name) {
  var input = this.getInput(name);
  return input && (input.connection && input.connection.targetBlock())
};
Blockly.Block.prototype.setMutator = function(mutator) {
  if(this.mutator && this.mutator !== mutator) {
    this.mutator.dispose()
  }
  if(mutator) {
    mutator.block_ = this;
    this.mutator = mutator;
    if(this.svg_) {
      mutator.createIcon()
    }
  }
};
Blockly.Block.prototype.getCommentText = function() {
  if(this.comment) {
    var comment = this.comment.getText();
    return comment.replace(/\s+$/, "").replace(/ +\n/g, "\n")
  }
  return""
};
Blockly.Block.prototype.setCommentText = function(text) {
  if(!Blockly.Comment) {
    throw"Comments not supported.";
  }
  var changedState = false;
  if(goog.isString(text)) {
    if(!this.comment) {
      this.comment = new Blockly.Comment(this);
      changedState = true
    }
    this.comment.setText((text))
  }else {
    if(this.comment) {
      this.comment.dispose();
      changedState = true
    }
  }
  if(this.rendered) {
    this.render();
    if(changedState) {
      this.bumpNeighbours_()
    }
  }
};
Blockly.Block.prototype.setWarningText = function(text) {
  if(!Blockly.Warning) {
    throw"Warnings not supported.";
  }
  if(this.isInFlyout) {
    text = null
  }
  var changedState = false;
  if(goog.isString(text)) {
    if(!this.warning) {
      this.warning = new Blockly.Warning(this);
      changedState = true
    }
    this.warning.setText((text))
  }else {
    if(this.warning) {
      this.warning.dispose();
      changedState = true
    }
  }
  if(changedState && this.rendered) {
    this.render();
    this.bumpNeighbours_()
  }
};
Blockly.Block.prototype.render = function() {
  if(!this.svg_) {
    throw"Uninitialized block cannot be rendered.  Call block.initSvg()";
  }
  this.svg_.render()
};
goog.provide("Blockly.Flyout");
goog.require("Blockly.Block");
goog.require("Blockly.Comment");
Blockly.Flyout = function() {
  var flyout = this;
  this.workspace_ = new Blockly.Workspace(function() {
    return flyout.getMetrics_()
  }, function(ratio) {
    return flyout.setMetrics_(ratio)
  });
  this.workspace_.isFlyout = true;
  this.changeWrapper_ = null;
  this.width_ = 0;
  this.height_ = 0;
  this.buttons_ = [];
  this.listeners_ = []
};
Blockly.Flyout.prototype.autoClose = true;
Blockly.Flyout.prototype.CORNER_RADIUS = 8;
Blockly.Flyout.prototype.onResizeWrapper_ = null;
Blockly.Flyout.prototype.createDom = function() {
  this.svgGroup_ = Blockly.createSvgElement("g", {}, null);
  this.svgBackground_ = Blockly.createSvgElement("path", {"class":"blocklyFlyoutBackground"}, this.svgGroup_);
  this.svgGroup_.appendChild(this.workspace_.createDom());
  return this.svgGroup_
};
Blockly.Flyout.prototype.dispose = function() {
  this.hide();
  if(this.onResizeWrapper_) {
    Blockly.unbindEvent_(this.onResizeWrapper_);
    this.onResizeWrapper_ = null
  }
  if(this.changeWrapper_) {
    Blockly.unbindEvent_(this.changeWrapper_);
    this.changeWrapper_ = null
  }
  if(this.scrollbar_) {
    this.scrollbar_.dispose();
    this.scrollbar_ = null
  }
  this.workspace_ = null;
  if(this.svgGroup_) {
    goog.dom.removeNode(this.svgGroup_);
    this.svgGroup_ = null
  }
  this.svgBackground_ = null;
  this.targetWorkspace_ = null
};
Blockly.Flyout.prototype.getMetrics_ = function() {
  if(!this.isVisible()) {
    return null
  }
  var viewHeight = this.height_ - 2 * this.CORNER_RADIUS;
  var viewWidth = this.width_;
  try {
    if(Blockly.isMsie() || Blockly.isTrident()) {
      this.workspace_.getCanvas().style.display = "inline";
      var optionBox = {x:this.workspace_.getCanvas().getBBox().x, y:this.workspace_.getCanvas().getBBox().y, width:this.workspace_.getCanvas().scrollWidth, height:this.workspace_.getCanvas().scrollHeight}
    }else {
      var optionBox = this.workspace_.getCanvas().getBBox()
    }
  }catch(e) {
    var optionBox = {height:0, y:0}
  }
  return{viewHeight:viewHeight, viewWidth:viewWidth, contentHeight:optionBox.height + optionBox.y, viewTop:-this.workspace_.pageYOffset, contentTop:0, absoluteTop:this.CORNER_RADIUS, absoluteLeft:0}
};
Blockly.Flyout.prototype.setMetrics_ = function(yRatio) {
  var metrics = this.getMetrics_();
  if(goog.isNumber(yRatio.y)) {
    this.workspace_.pageYOffset = -metrics.contentHeight * yRatio.y - metrics.contentTop
  }
  var y = this.workspace_.pageYOffset + metrics.absoluteTop;
  this.workspace_.getCanvas().setAttribute("transform", "translate(0," + y + ")")
};
Blockly.Flyout.prototype.init = function(workspace, withScrollbar) {
  this.targetWorkspace_ = workspace;
  var flyout = this;
  if(withScrollbar) {
    this.scrollbar_ = new Blockly.Scrollbar(flyout.workspace_, false, false)
  }
  this.hide();
  this.onResizeWrapper_ = Blockly.bindEvent_(window, goog.events.EventType.RESIZE, this, this.position_);
  this.position_();
  this.changeWrapper_ = Blockly.bindEvent_(this.targetWorkspace_.getCanvas(), "blocklyWorkspaceChange", this, this.filterForCapacity_)
};
Blockly.Flyout.prototype.position_ = function() {
  if(!this.isVisible()) {
    return
  }
  var metrics = this.targetWorkspace_.getMetrics();
  if(!metrics) {
    return
  }
  var edgeWidth = this.width_ - this.CORNER_RADIUS;
  if(Blockly.RTL) {
    edgeWidth *= -1
  }
  var path = ["M " + (Blockly.RTL ? this.width_ : 0) + ",0"];
  path.push("h", edgeWidth);
  path.push("a", this.CORNER_RADIUS, this.CORNER_RADIUS, 0, 0, Blockly.RTL ? 0 : 1, Blockly.RTL ? -this.CORNER_RADIUS : this.CORNER_RADIUS, this.CORNER_RADIUS);
  path.push("v", Math.max(0, metrics.viewHeight - this.CORNER_RADIUS * 2));
  path.push("a", this.CORNER_RADIUS, this.CORNER_RADIUS, 0, 0, Blockly.RTL ? 0 : 1, Blockly.RTL ? this.CORNER_RADIUS : -this.CORNER_RADIUS, this.CORNER_RADIUS);
  path.push("h", -edgeWidth);
  path.push("z");
  this.svgBackground_.setAttribute("d", path.join(" "));
  var x = metrics.absoluteLeft;
  if(Blockly.RTL) {
    x += metrics.viewWidth;
    x -= this.width_
  }
  this.svgGroup_.setAttribute("transform", "translate(" + x + "," + metrics.absoluteTop + ")");
  this.height_ = metrics.viewHeight;
  if(this.scrollbar_) {
    this.scrollbar_.resize()
  }
};
Blockly.Flyout.prototype.isVisible = function() {
  return this.svgGroup_.style.display == "block"
};
Blockly.Flyout.prototype.hide = function() {
  if(!this.isVisible()) {
    return
  }
  this.svgGroup_.style.display = "none";
  for(var x = 0, listen;listen = this.listeners_[x];x++) {
    Blockly.unbindEvent_(listen)
  }
  this.listeners_.splice(0);
  if(this.reflowWrapper_) {
    Blockly.unbindEvent_(this.reflowWrapper_);
    this.reflowWrapper_ = null
  }
  var blocks = this.workspace_.getTopBlocks(false);
  for(var x = 0, block;block = blocks[x];x++) {
    if(block.workspace == this.workspace_) {
      block.dispose(false, false)
    }
  }
  for(var x = 0, rect;rect = this.buttons_[x];x++) {
    goog.dom.removeNode(rect)
  }
  this.buttons_.splice(0)
};
Blockly.Flyout.prototype.show = function(xmlList) {
  this.hide();
  var margin = this.CORNER_RADIUS;
  this.svgGroup_.style.display = "block";
  var blocks = [];
  var gaps = [];
  if(xmlList == Blockly.Variables.NAME_TYPE) {
    Blockly.Variables.flyoutCategory(blocks, gaps, margin, (this.workspace_))
  }else {
    if(xmlList == Blockly.Procedures.NAME_TYPE) {
      Blockly.Procedures.flyoutCategory(blocks, gaps, margin, (this.workspace_))
    }else {
      for(var i = 0, xml;xml = xmlList[i];i++) {
        if(xml.tagName && xml.tagName.toUpperCase() == "BLOCK") {
          var block = Blockly.Xml.domToBlock_((this.workspace_), xml);
          blocks.push(block);
          gaps.push(margin * 3)
        }
      }
    }
  }
  var cursorY = margin;
  for(var i = 0, block;block = blocks[i];i++) {
    var allBlocks = block.getDescendants();
    for(var j = 0, child;child = allBlocks[j];j++) {
      child.isInFlyout = true;
      Blockly.Comment && child.setCommentText(null)
    }
    block.render();
    var root = block.getSvgRoot();
    var blockHW = block.getHeightWidth();
    var x = Blockly.RTL ? 0 : margin + Blockly.BlockSvg.TAB_WIDTH;
    block.moveBy(x, cursorY);
    cursorY += blockHW.height + gaps[i];
    var rect = Blockly.createSvgElement("rect", {"fill-opacity":0}, null);
    this.workspace_.getCanvas().insertBefore(rect, block.getSvgRoot());
    block.flyoutRect_ = rect;
    this.buttons_[i] = rect;
    if(this.autoClose) {
      this.listeners_.push(Blockly.bindEvent_(root, "mousedown", null, this.createBlockFunc_(block)))
    }else {
      this.listeners_.push(Blockly.bindEvent_(root, "mousedown", null, this.blockMouseDown_(block)))
    }
    this.listeners_.push(Blockly.bindEvent_(root, "mouseover", block.svg_, block.svg_.addSelectNoMove));
    this.listeners_.push(Blockly.bindEvent_(root, "mouseout", block.svg_, block.svg_.removeSelect));
    this.listeners_.push(Blockly.bindEvent_(rect, "mousedown", null, this.createBlockFunc_(block)));
    this.listeners_.push(Blockly.bindEvent_(rect, "mouseover", block.svg_, block.svg_.addSelectNoMove));
    this.listeners_.push(Blockly.bindEvent_(rect, "mouseout", block.svg_, block.svg_.removeSelect))
  }
  this.width_ = 0;
  this.reflow();
  this.filterForCapacity_();
  Blockly.fireUiEvent(window, "resize");
  this.reflowWrapper_ = Blockly.bindEvent_(this.workspace_.getCanvas(), "blocklyWorkspaceChange", this, this.reflow);
  this.workspace_.fireChangeEvent()
};
Blockly.Flyout.prototype.reflow = function() {
  var flyoutWidth = 0;
  var margin = this.CORNER_RADIUS;
  var blocks = this.workspace_.getTopBlocks(false);
  for(var x = 0, block;block = blocks[x];x++) {
    var root = block.getSvgRoot();
    var blockHW = block.getHeightWidth();
    flyoutWidth = Math.max(flyoutWidth, blockHW.width)
  }
  flyoutWidth += margin + Blockly.BlockSvg.TAB_WIDTH + margin / 2 + Blockly.Scrollbar.scrollbarThickness;
  if(this.width_ != flyoutWidth) {
    for(var x = 0, block;block = blocks[x];x++) {
      var blockHW = block.getHeightWidth();
      var blockXY = block.getRelativeToSurfaceXY();
      if(Blockly.RTL) {
        var dx = flyoutWidth - margin - Blockly.BlockSvg.TAB_WIDTH - blockXY.x;
        block.moveBy(dx, 0);
        blockXY.x += dx
      }
      if(block.flyoutRect_) {
        block.flyoutRect_.setAttribute("width", blockHW.width);
        block.flyoutRect_.setAttribute("height", blockHW.height);
        block.flyoutRect_.setAttribute("x", Blockly.RTL ? blockXY.x - blockHW.width : blockXY.x);
        block.flyoutRect_.setAttribute("y", blockXY.y)
      }
    }
    this.width_ = flyoutWidth;
    Blockly.fireUiEvent(window, "resize")
  }
};
Blockly.Block.prototype.moveTo = function(x, y) {
  var oldXY = this.getRelativeToSurfaceXY();
  this.svg_.getRootElement().setAttribute("transform", "translate(" + x + ", " + y + ")");
  this.moveConnections_(x - oldXY.x, y - oldXY.y)
};
Blockly.Flyout.prototype.blockMouseDown_ = function(block) {
  var flyout = this;
  return function(e) {
    Blockly.terminateDrag_();
    Blockly.hideChaff();
    if(Blockly.isRightButton(e)) {
      if(Blockly.ContextMenu) {
        block.showContextMenu_(Blockly.mouseToSvg(e))
      }
    }else {
      Blockly.removeAllRanges();
      Blockly.setCursorHand_(true);
      Blockly.Flyout.startDragMouseX_ = e.clientX;
      Blockly.Flyout.startDragMouseY_ = e.clientY;
      Blockly.Flyout.startBlock_ = block;
      Blockly.Flyout.startFlyout_ = flyout;
      Blockly.Flyout.onMouseUpWrapper_ = Blockly.bindEvent_(document, "mouseup", this, Blockly.terminateDrag_);
      Blockly.Flyout.onMouseMoveWrapper_ = Blockly.bindEvent_(document, "mousemove", this, flyout.onMouseMove_)
    }
    e.stopPropagation()
  }
};
Blockly.Flyout.prototype.onMouseMove_ = function(e) {
  if(e.type == "mousemove" && (e.clientX <= 1 && (e.clientY == 0 && e.button == 0))) {
    e.stopPropagation();
    return
  }
  Blockly.removeAllRanges();
  var dx = e.clientX - Blockly.Flyout.startDragMouseX_;
  var dy = e.clientY - Blockly.Flyout.startDragMouseY_;
  var dr = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
  if(dr > Blockly.DRAG_RADIUS) {
    Blockly.Flyout.startFlyout_.createBlockFunc_(Blockly.Flyout.startBlock_)(e)
  }
};
Blockly.Flyout.prototype.createBlockFunc_ = function(originBlock) {
  var flyout = this;
  return function(e) {
    if(Blockly.isRightButton(e)) {
      return
    }
    if(originBlock.disabled) {
      return
    }
    var xml = Blockly.Xml.blockToDom_(originBlock);
    var block = Blockly.Xml.domToBlock_(flyout.targetWorkspace_, xml);
    var svgRootOld = originBlock.getSvgRoot();
    if(!svgRootOld) {
      throw"originBlock is not rendered.";
    }
    var xyOld = Blockly.getSvgXY_(svgRootOld);
    var svgRootNew = block.getSvgRoot();
    if(!svgRootNew) {
      throw"block is not rendered.";
    }
    var xyNew = Blockly.getSvgXY_(svgRootNew);
    block.moveBy(xyOld.x - xyNew.x, xyOld.y - xyNew.y);
    if(flyout.autoClose) {
      flyout.hide()
    }else {
      flyout.filterForCapacity_()
    }
    block.onMouseDown_(e)
  }
};
Blockly.Flyout.prototype.filterForCapacity_ = function() {
  var remainingCapacity = this.targetWorkspace_.remainingCapacity();
  var blocks = this.workspace_.getTopBlocks(false);
  for(var i = 0, block;block = blocks[i];i++) {
    var allBlocks = block.getDescendants();
    var disabled = allBlocks.length > remainingCapacity;
    block.setDisabled(disabled)
  }
};
Blockly.Flyout.terminateDrag_ = function() {
  if(Blockly.Flyout.onMouseUpWrapper_) {
    Blockly.unbindEvent_(Blockly.Flyout.onMouseUpWrapper_);
    Blockly.Flyout.onMouseUpWrapper_ = null
  }
  if(Blockly.Flyout.onMouseMoveWrapper_) {
    Blockly.unbindEvent_(Blockly.Flyout.onMouseMoveWrapper_);
    Blockly.Flyout.onMouseMoveWrapper_ = null
  }
  Blockly.Flyout.startDragMouseX_ = 0;
  Blockly.Flyout.startDragMouseY_ = 0;
  Blockly.Flyout.startBlock_ = null;
  Blockly.Flyout.startFlyout_ = null
};
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains((col), val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty((col))
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear((col))
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach((col), f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter((col), f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map((col), f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some((col), f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every((col), f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.structs.Trie");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Trie = function(opt_trie) {
  this.childNodes_ = {};
  if(opt_trie) {
    this.setAll(opt_trie)
  }
};
goog.structs.Trie.prototype.value_ = undefined;
goog.structs.Trie.prototype.set = function(key, value) {
  this.setOrAdd_(key, value, false)
};
goog.structs.Trie.prototype.add = function(key, value) {
  this.setOrAdd_(key, value, true)
};
goog.structs.Trie.prototype.setOrAdd_ = function(key, value, opt_add) {
  var node = this;
  for(var characterPosition = 0;characterPosition < key.length;characterPosition++) {
    var currentCharacter = key.charAt(characterPosition);
    if(!node.childNodes_[currentCharacter]) {
      node.childNodes_[currentCharacter] = new goog.structs.Trie
    }
    node = node.childNodes_[currentCharacter]
  }
  if(opt_add && node.value_ !== undefined) {
    throw Error('The collection already contains the key "' + key + '"');
  }else {
    node.value_ = value
  }
};
goog.structs.Trie.prototype.setAll = function(trie) {
  var keys = goog.structs.getKeys(trie);
  var values = goog.structs.getValues(trie);
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Trie.prototype.get = function(key) {
  var node = this;
  for(var characterPosition = 0;characterPosition < key.length;characterPosition++) {
    var currentCharacter = key.charAt(characterPosition);
    if(!node.childNodes_[currentCharacter]) {
      return undefined
    }
    node = node.childNodes_[currentCharacter]
  }
  return node.value_
};
goog.structs.Trie.prototype.getKeyAndPrefixes = function(key, opt_keyStartIndex) {
  var node = this;
  var matches = {};
  var characterPosition = opt_keyStartIndex || 0;
  if(node.value_ !== undefined) {
    matches[characterPosition] = node.value_
  }
  for(;characterPosition < key.length;characterPosition++) {
    var currentCharacter = key.charAt(characterPosition);
    if(!(currentCharacter in node.childNodes_)) {
      break
    }
    node = node.childNodes_[currentCharacter];
    if(node.value_ !== undefined) {
      matches[characterPosition] = node.value_
    }
  }
  return matches
};
goog.structs.Trie.prototype.getValues = function() {
  var allValues = [];
  this.getValuesInternal_(allValues);
  return allValues
};
goog.structs.Trie.prototype.getValuesInternal_ = function(allValues) {
  if(this.value_ !== undefined) {
    allValues.push(this.value_)
  }
  for(var childNode in this.childNodes_) {
    this.childNodes_[childNode].getValuesInternal_(allValues)
  }
};
goog.structs.Trie.prototype.getKeys = function(opt_prefix) {
  var allKeys = [];
  if(opt_prefix) {
    var node = this;
    for(var characterPosition = 0;characterPosition < opt_prefix.length;characterPosition++) {
      var currentCharacter = opt_prefix.charAt(characterPosition);
      if(!node.childNodes_[currentCharacter]) {
        return[]
      }
      node = node.childNodes_[currentCharacter]
    }
    node.getKeysInternal_(opt_prefix, allKeys)
  }else {
    this.getKeysInternal_("", allKeys)
  }
  return allKeys
};
goog.structs.Trie.prototype.getKeysInternal_ = function(keySoFar, allKeys) {
  if(this.value_ !== undefined) {
    allKeys.push(keySoFar)
  }
  for(var childNode in this.childNodes_) {
    this.childNodes_[childNode].getKeysInternal_(keySoFar + childNode, allKeys)
  }
};
goog.structs.Trie.prototype.containsKey = function(key) {
  return this.get(key) !== undefined
};
goog.structs.Trie.prototype.containsValue = function(value) {
  if(this.value_ === value) {
    return true
  }
  for(var childNode in this.childNodes_) {
    if(this.childNodes_[childNode].containsValue(value)) {
      return true
    }
  }
  return false
};
goog.structs.Trie.prototype.clear = function() {
  this.childNodes_ = {};
  this.value_ = undefined
};
goog.structs.Trie.prototype.remove = function(key) {
  var node = this;
  var parents = [];
  for(var characterPosition = 0;characterPosition < key.length;characterPosition++) {
    var currentCharacter = key.charAt(characterPosition);
    if(!node.childNodes_[currentCharacter]) {
      throw Error('The collection does not have the key "' + key + '"');
    }
    parents.push([node, currentCharacter]);
    node = node.childNodes_[currentCharacter]
  }
  var oldValue = node.value_;
  delete node.value_;
  while(parents.length > 0) {
    var currentParentAndCharacter = parents.pop();
    var currentParent = currentParentAndCharacter[0];
    var currentCharacter = currentParentAndCharacter[1];
    if(goog.object.isEmpty(currentParent.childNodes_[currentCharacter].childNodes_)) {
      delete currentParent.childNodes_[currentCharacter]
    }else {
      break
    }
  }
  return oldValue
};
goog.structs.Trie.prototype.clone = function() {
  return new goog.structs.Trie(this)
};
goog.structs.Trie.prototype.getCount = function() {
  return goog.structs.getCount(this.getValues())
};
goog.structs.Trie.prototype.isEmpty = function() {
  return this.value_ === undefined && goog.structs.isEmpty(this.childNodes_)
};
goog.provide("goog.ui.tree.TypeAhead");
goog.provide("goog.ui.tree.TypeAhead.Offset");
goog.require("goog.array");
goog.require("goog.events.KeyCodes");
goog.require("goog.string");
goog.require("goog.structs.Trie");
goog.ui.tree.TypeAhead = function() {
  this.nodeMap_ = new goog.structs.Trie
};
goog.ui.tree.TypeAhead.prototype.nodeMap_;
goog.ui.tree.TypeAhead.prototype.buffer_ = "";
goog.ui.tree.TypeAhead.prototype.matchingLabels_ = null;
goog.ui.tree.TypeAhead.prototype.matchingNodes_ = null;
goog.ui.tree.TypeAhead.prototype.matchingLabelIndex_ = 0;
goog.ui.tree.TypeAhead.prototype.matchingNodeIndex_ = 0;
goog.ui.tree.TypeAhead.Offset = {DOWN:1, UP:-1};
goog.ui.tree.TypeAhead.prototype.handleNavigation = function(e) {
  var handled = false;
  switch(e.keyCode) {
    case goog.events.KeyCodes.DOWN:
    ;
    case goog.events.KeyCodes.UP:
      if(e.ctrlKey) {
        this.jumpTo_(e.keyCode == goog.events.KeyCodes.DOWN ? goog.ui.tree.TypeAhead.Offset.DOWN : goog.ui.tree.TypeAhead.Offset.UP);
        handled = true
      }
      break;
    case goog.events.KeyCodes.BACKSPACE:
      var length = this.buffer_.length - 1;
      handled = true;
      if(length > 0) {
        this.buffer_ = this.buffer_.substring(0, length);
        this.jumpToLabel_(this.buffer_)
      }else {
        if(length == 0) {
          this.buffer_ = ""
        }else {
          handled = false
        }
      }
      break;
    case goog.events.KeyCodes.ESC:
      this.buffer_ = "";
      handled = true;
      break
  }
  return handled
};
goog.ui.tree.TypeAhead.prototype.handleTypeAheadChar = function(e) {
  var handled = false;
  if(!e.ctrlKey && !e.altKey) {
    var ch = String.fromCharCode(e.charCode || e.keyCode).toLowerCase();
    if(goog.string.isUnicodeChar(ch) && (ch != " " || this.buffer_)) {
      this.buffer_ += ch;
      handled = this.jumpToLabel_(this.buffer_)
    }
  }
  return handled
};
goog.ui.tree.TypeAhead.prototype.setNodeInMap = function(node) {
  var labelText = node.getText();
  if(labelText && !goog.string.isEmptySafe(labelText)) {
    labelText = labelText.toLowerCase();
    var previousValue = this.nodeMap_.get(labelText);
    if(previousValue) {
      previousValue.push(node)
    }else {
      var nodeList = [node];
      this.nodeMap_.set(labelText, nodeList)
    }
  }
};
goog.ui.tree.TypeAhead.prototype.removeNodeFromMap = function(node) {
  var labelText = node.getText();
  if(labelText && !goog.string.isEmptySafe(labelText)) {
    labelText = labelText.toLowerCase();
    var nodeList = (this.nodeMap_.get(labelText));
    if(nodeList) {
      goog.array.remove(nodeList, node);
      if(!!nodeList.length) {
        this.nodeMap_.remove(labelText)
      }
    }
  }
};
goog.ui.tree.TypeAhead.prototype.jumpToLabel_ = function(typeAhead) {
  var handled = false;
  var labels = this.nodeMap_.getKeys(typeAhead);
  if(labels && labels.length) {
    this.matchingNodeIndex_ = 0;
    this.matchingLabelIndex_ = 0;
    var nodes = (this.nodeMap_.get(labels[0]));
    if(handled = this.selectMatchingNode_(nodes)) {
      this.matchingLabels_ = labels
    }
  }
  return handled
};
goog.ui.tree.TypeAhead.prototype.jumpTo_ = function(offset) {
  var handled = false;
  var labels = this.matchingLabels_;
  if(labels) {
    var nodes = null;
    var nodeIndexOutOfRange = false;
    if(this.matchingNodes_) {
      var newNodeIndex = this.matchingNodeIndex_ + offset;
      if(newNodeIndex >= 0 && newNodeIndex < this.matchingNodes_.length) {
        this.matchingNodeIndex_ = newNodeIndex;
        nodes = this.matchingNodes_
      }else {
        nodeIndexOutOfRange = true
      }
    }
    if(!nodes) {
      var newLabelIndex = this.matchingLabelIndex_ + offset;
      if(newLabelIndex >= 0 && newLabelIndex < labels.length) {
        this.matchingLabelIndex_ = newLabelIndex
      }
      if(labels.length > this.matchingLabelIndex_) {
        nodes = (this.nodeMap_.get(labels[this.matchingLabelIndex_]))
      }
      if(nodes && (nodes.length && nodeIndexOutOfRange)) {
        this.matchingNodeIndex_ = offset == goog.ui.tree.TypeAhead.Offset.UP ? nodes.length - 1 : 0
      }
    }
    if(handled = this.selectMatchingNode_(nodes)) {
      this.matchingLabels_ = labels
    }
  }
  return handled
};
goog.ui.tree.TypeAhead.prototype.selectMatchingNode_ = function(nodes) {
  var node;
  if(nodes) {
    if(this.matchingNodeIndex_ < nodes.length) {
      node = nodes[this.matchingNodeIndex_];
      this.matchingNodes_ = nodes
    }
    if(node) {
      node.reveal();
      node.select()
    }
  }
  return!!node
};
goog.ui.tree.TypeAhead.prototype.clear = function() {
  this.buffer_ = ""
};
goog.provide("goog.events.KeyEvent");
goog.provide("goog.events.KeyHandler");
goog.provide("goog.events.KeyHandler.EventType");
goog.require("goog.events");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
goog.require("goog.events.KeyCodes");
goog.require("goog.userAgent");
goog.events.KeyHandler = function(opt_element, opt_capture) {
  goog.events.EventTarget.call(this);
  if(opt_element) {
    this.attach(opt_element, opt_capture)
  }
};
goog.inherits(goog.events.KeyHandler, goog.events.EventTarget);
goog.events.KeyHandler.prototype.element_ = null;
goog.events.KeyHandler.prototype.keyPressKey_ = null;
goog.events.KeyHandler.prototype.keyDownKey_ = null;
goog.events.KeyHandler.prototype.keyUpKey_ = null;
goog.events.KeyHandler.prototype.lastKey_ = -1;
goog.events.KeyHandler.prototype.keyCode_ = -1;
goog.events.KeyHandler.prototype.altKey_ = false;
goog.events.KeyHandler.EventType = {KEY:"key"};
goog.events.KeyHandler.safariKey_ = {3:goog.events.KeyCodes.ENTER, 12:goog.events.KeyCodes.NUMLOCK, 63232:goog.events.KeyCodes.UP, 63233:goog.events.KeyCodes.DOWN, 63234:goog.events.KeyCodes.LEFT, 63235:goog.events.KeyCodes.RIGHT, 63236:goog.events.KeyCodes.F1, 63237:goog.events.KeyCodes.F2, 63238:goog.events.KeyCodes.F3, 63239:goog.events.KeyCodes.F4, 63240:goog.events.KeyCodes.F5, 63241:goog.events.KeyCodes.F6, 63242:goog.events.KeyCodes.F7, 63243:goog.events.KeyCodes.F8, 63244:goog.events.KeyCodes.F9, 
63245:goog.events.KeyCodes.F10, 63246:goog.events.KeyCodes.F11, 63247:goog.events.KeyCodes.F12, 63248:goog.events.KeyCodes.PRINT_SCREEN, 63272:goog.events.KeyCodes.DELETE, 63273:goog.events.KeyCodes.HOME, 63275:goog.events.KeyCodes.END, 63276:goog.events.KeyCodes.PAGE_UP, 63277:goog.events.KeyCodes.PAGE_DOWN, 63289:goog.events.KeyCodes.NUMLOCK, 63302:goog.events.KeyCodes.INSERT};
goog.events.KeyHandler.keyIdentifier_ = {"Up":goog.events.KeyCodes.UP, "Down":goog.events.KeyCodes.DOWN, "Left":goog.events.KeyCodes.LEFT, "Right":goog.events.KeyCodes.RIGHT, "Enter":goog.events.KeyCodes.ENTER, "F1":goog.events.KeyCodes.F1, "F2":goog.events.KeyCodes.F2, "F3":goog.events.KeyCodes.F3, "F4":goog.events.KeyCodes.F4, "F5":goog.events.KeyCodes.F5, "F6":goog.events.KeyCodes.F6, "F7":goog.events.KeyCodes.F7, "F8":goog.events.KeyCodes.F8, "F9":goog.events.KeyCodes.F9, "F10":goog.events.KeyCodes.F10, 
"F11":goog.events.KeyCodes.F11, "F12":goog.events.KeyCodes.F12, "U+007F":goog.events.KeyCodes.DELETE, "Home":goog.events.KeyCodes.HOME, "End":goog.events.KeyCodes.END, "PageUp":goog.events.KeyCodes.PAGE_UP, "PageDown":goog.events.KeyCodes.PAGE_DOWN, "Insert":goog.events.KeyCodes.INSERT};
goog.events.KeyHandler.USES_KEYDOWN_ = goog.userAgent.IE || goog.userAgent.WEBKIT && goog.userAgent.isVersion("525");
goog.events.KeyHandler.SAVE_ALT_FOR_KEYPRESS_ = goog.userAgent.MAC && goog.userAgent.GECKO;
goog.events.KeyHandler.prototype.handleKeyDown_ = function(e) {
  if(goog.userAgent.WEBKIT) {
    if(this.lastKey_ == goog.events.KeyCodes.CTRL && !e.ctrlKey || (this.lastKey_ == goog.events.KeyCodes.ALT && !e.altKey || goog.userAgent.MAC && (this.lastKey_ == goog.events.KeyCodes.META && !e.metaKey))) {
      this.lastKey_ = -1;
      this.keyCode_ = -1
    }
  }
  if(this.lastKey_ == -1) {
    if(e.ctrlKey && e.keyCode != goog.events.KeyCodes.CTRL) {
      this.lastKey_ = goog.events.KeyCodes.CTRL
    }else {
      if(e.altKey && e.keyCode != goog.events.KeyCodes.ALT) {
        this.lastKey_ = goog.events.KeyCodes.ALT
      }else {
        if(e.metaKey && e.keyCode != goog.events.KeyCodes.META) {
          this.lastKey_ = goog.events.KeyCodes.META
        }
      }
    }
  }
  if(goog.events.KeyHandler.USES_KEYDOWN_ && !goog.events.KeyCodes.firesKeyPressEvent(e.keyCode, this.lastKey_, e.shiftKey, e.ctrlKey, e.altKey)) {
    this.handleEvent(e)
  }else {
    this.keyCode_ = goog.userAgent.GECKO ? goog.events.KeyCodes.normalizeGeckoKeyCode(e.keyCode) : e.keyCode;
    if(goog.events.KeyHandler.SAVE_ALT_FOR_KEYPRESS_) {
      this.altKey_ = e.altKey
    }
  }
};
goog.events.KeyHandler.prototype.resetState = function() {
  this.lastKey_ = -1;
  this.keyCode_ = -1
};
goog.events.KeyHandler.prototype.handleKeyup_ = function(e) {
  this.resetState();
  this.altKey_ = e.altKey
};
goog.events.KeyHandler.prototype.handleEvent = function(e) {
  var be = e.getBrowserEvent();
  var keyCode, charCode;
  var altKey = be.altKey;
  if(goog.userAgent.IE && e.type == goog.events.EventType.KEYPRESS) {
    keyCode = this.keyCode_;
    charCode = keyCode != goog.events.KeyCodes.ENTER && keyCode != goog.events.KeyCodes.ESC ? be.keyCode : 0
  }else {
    if(goog.userAgent.WEBKIT && e.type == goog.events.EventType.KEYPRESS) {
      keyCode = this.keyCode_;
      charCode = be.charCode >= 0 && (be.charCode < 63232 && goog.events.KeyCodes.isCharacterKey(keyCode)) ? be.charCode : 0
    }else {
      if(goog.userAgent.OPERA) {
        keyCode = this.keyCode_;
        charCode = goog.events.KeyCodes.isCharacterKey(keyCode) ? be.keyCode : 0
      }else {
        keyCode = be.keyCode || this.keyCode_;
        charCode = be.charCode || 0;
        if(goog.events.KeyHandler.SAVE_ALT_FOR_KEYPRESS_) {
          altKey = this.altKey_
        }
        if(goog.userAgent.MAC && (charCode == goog.events.KeyCodes.QUESTION_MARK && keyCode == goog.events.KeyCodes.WIN_KEY)) {
          keyCode = goog.events.KeyCodes.SLASH
        }
      }
    }
  }
  var key = keyCode;
  var keyIdentifier = be.keyIdentifier;
  if(keyCode) {
    if(keyCode >= 63232 && keyCode in goog.events.KeyHandler.safariKey_) {
      key = goog.events.KeyHandler.safariKey_[keyCode]
    }else {
      if(keyCode == 25 && e.shiftKey) {
        key = 9
      }
    }
  }else {
    if(keyIdentifier && keyIdentifier in goog.events.KeyHandler.keyIdentifier_) {
      key = goog.events.KeyHandler.keyIdentifier_[keyIdentifier]
    }
  }
  var repeat = key == this.lastKey_;
  this.lastKey_ = key;
  var event = new goog.events.KeyEvent(key, charCode, repeat, be);
  event.altKey = altKey;
  this.dispatchEvent(event)
};
goog.events.KeyHandler.prototype.getElement = function() {
  return this.element_
};
goog.events.KeyHandler.prototype.attach = function(element, opt_capture) {
  if(this.keyUpKey_) {
    this.detach()
  }
  this.element_ = element;
  this.keyPressKey_ = goog.events.listen(this.element_, goog.events.EventType.KEYPRESS, this, opt_capture);
  this.keyDownKey_ = goog.events.listen(this.element_, goog.events.EventType.KEYDOWN, this.handleKeyDown_, opt_capture, this);
  this.keyUpKey_ = goog.events.listen(this.element_, goog.events.EventType.KEYUP, this.handleKeyup_, opt_capture, this)
};
goog.events.KeyHandler.prototype.detach = function() {
  if(this.keyPressKey_) {
    goog.events.unlistenByKey(this.keyPressKey_);
    goog.events.unlistenByKey(this.keyDownKey_);
    goog.events.unlistenByKey(this.keyUpKey_);
    this.keyPressKey_ = null;
    this.keyDownKey_ = null;
    this.keyUpKey_ = null
  }
  this.element_ = null;
  this.lastKey_ = -1;
  this.keyCode_ = -1
};
goog.events.KeyHandler.prototype.disposeInternal = function() {
  goog.events.KeyHandler.superClass_.disposeInternal.call(this);
  this.detach()
};
goog.events.KeyEvent = function(keyCode, charCode, repeat, browserEvent) {
  goog.events.BrowserEvent.call(this, browserEvent);
  this.type = goog.events.KeyHandler.EventType.KEY;
  this.keyCode = keyCode;
  this.charCode = charCode;
  this.repeat = repeat
};
goog.inherits(goog.events.KeyEvent, goog.events.BrowserEvent);
goog.provide("goog.events.FocusHandler");
goog.provide("goog.events.FocusHandler.EventType");
goog.require("goog.events");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.EventTarget");
goog.require("goog.userAgent");
goog.events.FocusHandler = function(element) {
  goog.events.EventTarget.call(this);
  this.element_ = element;
  var typeIn = goog.userAgent.IE ? "focusin" : "focus";
  var typeOut = goog.userAgent.IE ? "focusout" : "blur";
  this.listenKeyIn_ = goog.events.listen(this.element_, typeIn, this, !goog.userAgent.IE);
  this.listenKeyOut_ = goog.events.listen(this.element_, typeOut, this, !goog.userAgent.IE)
};
goog.inherits(goog.events.FocusHandler, goog.events.EventTarget);
goog.events.FocusHandler.EventType = {FOCUSIN:"focusin", FOCUSOUT:"focusout"};
goog.events.FocusHandler.prototype.handleEvent = function(e) {
  var be = e.getBrowserEvent();
  var event = new goog.events.BrowserEvent(be);
  event.type = e.type == "focusin" || e.type == "focus" ? goog.events.FocusHandler.EventType.FOCUSIN : goog.events.FocusHandler.EventType.FOCUSOUT;
  this.dispatchEvent(event)
};
goog.events.FocusHandler.prototype.disposeInternal = function() {
  goog.events.FocusHandler.superClass_.disposeInternal.call(this);
  goog.events.unlistenByKey(this.listenKeyIn_);
  goog.events.unlistenByKey(this.listenKeyOut_);
  delete this.element_
};
goog.provide("goog.structs.Collection");
goog.structs.Collection = function() {
};
goog.structs.Collection.prototype.add;
goog.structs.Collection.prototype.remove;
goog.structs.Collection.prototype.contains;
goog.structs.Collection.prototype.getCount;
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach((iterable), f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      if(f.call(opt_obj, val, undefined, iterator)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      return f.call(opt_obj, val, undefined, iterator)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      if(dropping && f.call(opt_obj, val, undefined, iterator)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterator.next();
        if(f.call(opt_obj, val, undefined, iterator)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray((iterable))
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.iter.cycle = function(iterable) {
  var baseIterator = goog.iter.toIterator(iterable);
  var cache = [];
  var cacheIndex = 0;
  var iter = new goog.iter.Iterator;
  var useCache = false;
  iter.next = function() {
    var returnElement = null;
    if(!useCache) {
      try {
        returnElement = baseIterator.next();
        cache.push(returnElement);
        return returnElement
      }catch(e) {
        if(e != goog.iter.StopIteration || goog.array.isEmpty(cache)) {
          throw e;
        }
        useCache = true
      }
    }
    returnElement = cache[cacheIndex];
    cacheIndex = (cacheIndex + 1) % cache.length;
    return returnElement
  };
  return iter
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll((opt_map))
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return(this.keys_.concat())
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.structs.Set");
goog.require("goog.structs");
goog.require("goog.structs.Collection");
goog.require("goog.structs.Map");
goog.structs.Set = function(opt_values) {
  this.map_ = new goog.structs.Map;
  if(opt_values) {
    this.addAll(opt_values)
  }
};
goog.structs.Set.getKey_ = function(val) {
  var type = typeof val;
  if(type == "object" && val || type == "function") {
    return"o" + goog.getUid((val))
  }else {
    return type.substr(0, 1) + val
  }
};
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount()
};
goog.structs.Set.prototype.add = function(element) {
  this.map_.set(goog.structs.Set.getKey_(element), element)
};
goog.structs.Set.prototype.addAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.add(values[i])
  }
};
goog.structs.Set.prototype.removeAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.remove(values[i])
  }
};
goog.structs.Set.prototype.remove = function(element) {
  return this.map_.remove(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.clear = function() {
  this.map_.clear()
};
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty()
};
goog.structs.Set.prototype.contains = function(element) {
  return this.map_.containsKey(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.containsAll = function(col) {
  return goog.structs.every(col, this.contains, this)
};
goog.structs.Set.prototype.intersection = function(col) {
  var result = new goog.structs.Set;
  var values = goog.structs.getValues(col);
  for(var i = 0;i < values.length;i++) {
    var value = values[i];
    if(this.contains(value)) {
      result.add(value)
    }
  }
  return result
};
goog.structs.Set.prototype.difference = function(col) {
  var result = this.clone();
  result.removeAll(col);
  return result
};
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues()
};
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this)
};
goog.structs.Set.prototype.equals = function(col) {
  return this.getCount() == goog.structs.getCount(col) && this.isSubsetOf(col)
};
goog.structs.Set.prototype.isSubsetOf = function(col) {
  var colCount = goog.structs.getCount(col);
  if(this.getCount() > colCount) {
    return false
  }
  if(!(col instanceof goog.structs.Set) && colCount > 5) {
    col = new goog.structs.Set(col)
  }
  return goog.structs.every(this, function(value) {
    return goog.structs.contains(col, value)
  })
};
goog.structs.Set.prototype.__iterator__ = function(opt_keys) {
  return this.map_.__iterator__(false)
};
goog.provide("goog.debug");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs.Set");
goog.require("goog.userAgent");
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global;
  var oldErrorHandler = target.onerror;
  var retVal = !!opt_cancel;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("535.3")) {
    retVal = !retVal
  }
  target.onerror = function(message, url, line) {
    if(oldErrorHandler) {
      oldErrorHandler(message, url, line)
    }
    logFunc({message:message, fileName:url, line:line});
    return retVal
  }
};
goog.debug.expose = function(obj, opt_showFn) {
  if(typeof obj == "undefined") {
    return"undefined"
  }
  if(obj == null) {
    return"NULL"
  }
  var str = [];
  for(var x in obj) {
    if(!opt_showFn && goog.isFunction(obj[x])) {
      continue
    }
    var s = x + " = ";
    try {
      s += obj[x]
    }catch(e) {
      s += "*** " + e + " ***"
    }
    str.push(s)
  }
  return str.join("\n")
};
goog.debug.deepExpose = function(obj, opt_showFn) {
  var previous = new goog.structs.Set;
  var str = [];
  var helper = function(obj, space) {
    var nestspace = space + "  ";
    var indentMultiline = function(str) {
      return str.replace(/\n/g, "\n" + space)
    };
    try {
      if(!goog.isDef(obj)) {
        str.push("undefined")
      }else {
        if(goog.isNull(obj)) {
          str.push("NULL")
        }else {
          if(goog.isString(obj)) {
            str.push('"' + indentMultiline(obj) + '"')
          }else {
            if(goog.isFunction(obj)) {
              str.push(indentMultiline(String(obj)))
            }else {
              if(goog.isObject(obj)) {
                if(previous.contains(obj)) {
                  str.push("*** reference loop detected ***")
                }else {
                  previous.add(obj);
                  str.push("{");
                  for(var x in obj) {
                    if(!opt_showFn && goog.isFunction(obj[x])) {
                      continue
                    }
                    str.push("\n");
                    str.push(nestspace);
                    str.push(x + " = ");
                    helper(obj[x], nestspace)
                  }
                  str.push("\n" + space + "}")
                }
              }else {
                str.push(obj)
              }
            }
          }
        }
      }
    }catch(e) {
      str.push("*** " + e + " ***")
    }
  };
  helper(obj, "");
  return str.join("")
};
goog.debug.exposeArray = function(arr) {
  var str = [];
  for(var i = 0;i < arr.length;i++) {
    if(goog.isArray(arr[i])) {
      str.push(goog.debug.exposeArray(arr[i]))
    }else {
      str.push(arr[i])
    }
  }
  return"[ " + str.join(", ") + " ]"
};
goog.debug.exposeException = function(err, opt_fn) {
  try {
    var e = goog.debug.normalizeErrorObject(err);
    var error = "Message: " + goog.string.htmlEscape(e.message) + '\nUrl: <a href="view-source:' + e.fileName + '" target="_new">' + e.fileName + "</a>\nLine: " + e.lineNumber + "\n\nBrowser stack:\n" + goog.string.htmlEscape(e.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + goog.string.htmlEscape(goog.debug.getStacktrace(opt_fn) + "-> ");
    return error
  }catch(e2) {
    return"Exception trying to expose exception! You win, we lose. " + e2
  }
};
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName("window.location.href");
  if(goog.isString(err)) {
    return{"message":err, "name":"Unknown error", "lineNumber":"Not available", "fileName":href, "stack":"Not available"}
  }
  var lineNumber, fileName;
  var threwError = false;
  try {
    lineNumber = err.lineNumber || (err.line || "Not available")
  }catch(e) {
    lineNumber = "Not available";
    threwError = true
  }
  try {
    fileName = err.fileName || (err.filename || (err.sourceURL || (goog.global["$googDebugFname"] || href)))
  }catch(e) {
    fileName = "Not available";
    threwError = true
  }
  if(threwError || (!err.lineNumber || (!err.fileName || !err.stack))) {
    return{"message":err.message, "name":err.name, "lineNumber":lineNumber, "fileName":fileName, "stack":err.stack || "Not available"}
  }
  return err
};
goog.debug.enhanceError = function(err, opt_message) {
  var error = typeof err == "string" ? Error(err) : err;
  if(!error.stack) {
    error.stack = goog.debug.getStacktrace(arguments.callee.caller)
  }
  if(opt_message) {
    var x = 0;
    while(error["message" + x]) {
      ++x
    }
    error["message" + x] = String(opt_message)
  }
  return error
};
goog.debug.getStacktraceSimple = function(opt_depth) {
  var sb = [];
  var fn = arguments.callee.caller;
  var depth = 0;
  while(fn && (!opt_depth || depth < opt_depth)) {
    sb.push(goog.debug.getFunctionName(fn));
    sb.push("()\n");
    try {
      fn = fn.caller
    }catch(e) {
      sb.push("[exception trying to get caller]\n");
      break
    }
    depth++;
    if(depth >= goog.debug.MAX_STACK_DEPTH) {
      sb.push("[...long stack...]");
      break
    }
  }
  if(opt_depth && depth >= opt_depth) {
    sb.push("[...reached max depth limit...]")
  }else {
    sb.push("[end]")
  }
  return sb.join("")
};
goog.debug.MAX_STACK_DEPTH = 50;
goog.debug.getStacktrace = function(opt_fn) {
  return goog.debug.getStacktraceHelper_(opt_fn || arguments.callee.caller, [])
};
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];
  if(goog.array.contains(visited, fn)) {
    sb.push("[...circular reference...]")
  }else {
    if(fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
      sb.push(goog.debug.getFunctionName(fn) + "(");
      var args = fn.arguments;
      for(var i = 0;i < args.length;i++) {
        if(i > 0) {
          sb.push(", ")
        }
        var argDesc;
        var arg = args[i];
        switch(typeof arg) {
          case "object":
            argDesc = arg ? "object" : "null";
            break;
          case "string":
            argDesc = arg;
            break;
          case "number":
            argDesc = String(arg);
            break;
          case "boolean":
            argDesc = arg ? "true" : "false";
            break;
          case "function":
            argDesc = goog.debug.getFunctionName(arg);
            argDesc = argDesc ? argDesc : "[fn]";
            break;
          case "undefined":
          ;
          default:
            argDesc = typeof arg;
            break
        }
        if(argDesc.length > 40) {
          argDesc = argDesc.substr(0, 40) + "..."
        }
        sb.push(argDesc)
      }
      visited.push(fn);
      sb.push(")\n");
      try {
        sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited))
      }catch(e) {
        sb.push("[exception trying to get caller]\n")
      }
    }else {
      if(fn) {
        sb.push("[...long stack...]")
      }else {
        sb.push("[end]")
      }
    }
  }
  return sb.join("")
};
goog.debug.setFunctionResolver = function(resolver) {
  goog.debug.fnNameResolver_ = resolver
};
goog.debug.getFunctionName = function(fn) {
  if(goog.debug.fnNameCache_[fn]) {
    return goog.debug.fnNameCache_[fn]
  }
  if(goog.debug.fnNameResolver_) {
    var name = goog.debug.fnNameResolver_(fn);
    if(name) {
      goog.debug.fnNameCache_[fn] = name;
      return name
    }
  }
  var functionSource = String(fn);
  if(!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function ([^\(]+)/.exec(functionSource);
    if(matches) {
      var method = matches[1];
      goog.debug.fnNameCache_[functionSource] = method
    }else {
      goog.debug.fnNameCache_[functionSource] = "[Anonymous]"
    }
  }
  return goog.debug.fnNameCache_[functionSource]
};
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]")
};
goog.debug.fnNameCache_ = {};
goog.debug.fnNameResolver_;
goog.provide("goog.debug.LogRecord");
goog.debug.LogRecord = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber)
};
goog.debug.LogRecord.prototype.time_;
goog.debug.LogRecord.prototype.level_;
goog.debug.LogRecord.prototype.msg_;
goog.debug.LogRecord.prototype.loggerName_;
goog.debug.LogRecord.prototype.sequenceNumber_ = 0;
goog.debug.LogRecord.prototype.exception_ = null;
goog.debug.LogRecord.prototype.exceptionText_ = null;
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = true;
goog.debug.LogRecord.nextSequenceNumber_ = 0;
goog.debug.LogRecord.prototype.reset = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  if(goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS) {
    this.sequenceNumber_ = typeof opt_sequenceNumber == "number" ? opt_sequenceNumber : goog.debug.LogRecord.nextSequenceNumber_++
  }
  this.time_ = opt_time || goog.now();
  this.level_ = level;
  this.msg_ = msg;
  this.loggerName_ = loggerName;
  delete this.exception_;
  delete this.exceptionText_
};
goog.debug.LogRecord.prototype.getLoggerName = function() {
  return this.loggerName_
};
goog.debug.LogRecord.prototype.getException = function() {
  return this.exception_
};
goog.debug.LogRecord.prototype.setException = function(exception) {
  this.exception_ = exception
};
goog.debug.LogRecord.prototype.getExceptionText = function() {
  return this.exceptionText_
};
goog.debug.LogRecord.prototype.setExceptionText = function(text) {
  this.exceptionText_ = text
};
goog.debug.LogRecord.prototype.setLoggerName = function(loggerName) {
  this.loggerName_ = loggerName
};
goog.debug.LogRecord.prototype.getLevel = function() {
  return this.level_
};
goog.debug.LogRecord.prototype.setLevel = function(level) {
  this.level_ = level
};
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_
};
goog.debug.LogRecord.prototype.setMessage = function(msg) {
  this.msg_ = msg
};
goog.debug.LogRecord.prototype.getMillis = function() {
  return this.time_
};
goog.debug.LogRecord.prototype.setMillis = function(time) {
  this.time_ = time
};
goog.debug.LogRecord.prototype.getSequenceNumber = function() {
  return this.sequenceNumber_
};
goog.provide("goog.debug.LogBuffer");
goog.require("goog.asserts");
goog.require("goog.debug.LogRecord");
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(), "Cannot use goog.debug.LogBuffer without defining " + "goog.debug.LogBuffer.CAPACITY.");
  this.clear()
};
goog.debug.LogBuffer.getInstance = function() {
  if(!goog.debug.LogBuffer.instance_) {
    goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer
  }
  return goog.debug.LogBuffer.instance_
};
goog.debug.LogBuffer.CAPACITY = 0;
goog.debug.LogBuffer.prototype.buffer_;
goog.debug.LogBuffer.prototype.curIndex_;
goog.debug.LogBuffer.prototype.isFull_;
goog.debug.LogBuffer.prototype.addRecord = function(level, msg, loggerName) {
  var curIndex = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = curIndex;
  if(this.isFull_) {
    var ret = this.buffer_[curIndex];
    ret.reset(level, msg, loggerName);
    return ret
  }
  this.isFull_ = curIndex == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[curIndex] = new goog.debug.LogRecord(level, msg, loggerName)
};
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return goog.debug.LogBuffer.CAPACITY > 0
};
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = new Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = false
};
goog.debug.LogBuffer.prototype.forEachRecord = function(func) {
  var buffer = this.buffer_;
  if(!buffer[0]) {
    return
  }
  var curIndex = this.curIndex_;
  var i = this.isFull_ ? curIndex : -1;
  do {
    i = (i + 1) % goog.debug.LogBuffer.CAPACITY;
    func((buffer[i]))
  }while(i != curIndex)
};
goog.provide("goog.debug.LogManager");
goog.provide("goog.debug.Logger");
goog.provide("goog.debug.Logger.Level");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.debug");
goog.require("goog.debug.LogBuffer");
goog.require("goog.debug.LogRecord");
goog.debug.Logger = function(name) {
  this.name_ = name
};
goog.debug.Logger.prototype.parent_ = null;
goog.debug.Logger.prototype.level_ = null;
goog.debug.Logger.prototype.children_ = null;
goog.debug.Logger.prototype.handlers_ = null;
goog.debug.Logger.ENABLE_HIERARCHY = true;
if(!goog.debug.Logger.ENABLE_HIERARCHY) {
  goog.debug.Logger.rootHandlers_ = [];
  goog.debug.Logger.rootLevel_
}
goog.debug.Logger.Level = function(name, value) {
  this.name = name;
  this.value = value
};
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name
};
goog.debug.Logger.Level.OFF = new goog.debug.Logger.Level("OFF", Infinity);
goog.debug.Logger.Level.SHOUT = new goog.debug.Logger.Level("SHOUT", 1200);
goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level("SEVERE", 1E3);
goog.debug.Logger.Level.WARNING = new goog.debug.Logger.Level("WARNING", 900);
goog.debug.Logger.Level.INFO = new goog.debug.Logger.Level("INFO", 800);
goog.debug.Logger.Level.CONFIG = new goog.debug.Logger.Level("CONFIG", 700);
goog.debug.Logger.Level.FINE = new goog.debug.Logger.Level("FINE", 500);
goog.debug.Logger.Level.FINER = new goog.debug.Logger.Level("FINER", 400);
goog.debug.Logger.Level.FINEST = new goog.debug.Logger.Level("FINEST", 300);
goog.debug.Logger.Level.ALL = new goog.debug.Logger.Level("ALL", 0);
goog.debug.Logger.Level.PREDEFINED_LEVELS = [goog.debug.Logger.Level.OFF, goog.debug.Logger.Level.SHOUT, goog.debug.Logger.Level.SEVERE, goog.debug.Logger.Level.WARNING, goog.debug.Logger.Level.INFO, goog.debug.Logger.Level.CONFIG, goog.debug.Logger.Level.FINE, goog.debug.Logger.Level.FINER, goog.debug.Logger.Level.FINEST, goog.debug.Logger.Level.ALL];
goog.debug.Logger.Level.predefinedLevelsCache_ = null;
goog.debug.Logger.Level.createPredefinedLevelsCache_ = function() {
  goog.debug.Logger.Level.predefinedLevelsCache_ = {};
  for(var i = 0, level;level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];i++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[level.value] = level;
    goog.debug.Logger.Level.predefinedLevelsCache_[level.name] = level
  }
};
goog.debug.Logger.Level.getPredefinedLevel = function(name) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  return goog.debug.Logger.Level.predefinedLevelsCache_[name] || null
};
goog.debug.Logger.Level.getPredefinedLevelByValue = function(value) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  if(value in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[value]
  }
  for(var i = 0;i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length;++i) {
    var level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
    if(level.value <= value) {
      return level
    }
  }
  return null
};
goog.debug.Logger.getLogger = function(name) {
  return goog.debug.LogManager.getLogger(name)
};
goog.debug.Logger.logToProfilers = function(msg) {
  if(goog.global["console"]) {
    if(goog.global["console"]["timeStamp"]) {
      goog.global["console"]["timeStamp"](msg)
    }else {
      if(goog.global["console"]["markTimeline"]) {
        goog.global["console"]["markTimeline"](msg)
      }
    }
  }
  if(goog.global["msWriteProfilerMark"]) {
    goog.global["msWriteProfilerMark"](msg)
  }
};
goog.debug.Logger.prototype.getName = function() {
  return this.name_
};
goog.debug.Logger.prototype.addHandler = function(handler) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    if(!this.handlers_) {
      this.handlers_ = []
    }
    this.handlers_.push(handler)
  }else {
    goog.asserts.assert(!this.name_, "Cannot call addHandler on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootHandlers_.push(handler)
  }
};
goog.debug.Logger.prototype.removeHandler = function(handler) {
  var handlers = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ : goog.debug.Logger.rootHandlers_;
  return!!handlers && goog.array.remove(handlers, handler)
};
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_
};
goog.debug.Logger.prototype.getChildren = function() {
  if(!this.children_) {
    this.children_ = {}
  }
  return this.children_
};
goog.debug.Logger.prototype.setLevel = function(level) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    this.level_ = level
  }else {
    goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootLevel_ = level
  }
};
goog.debug.Logger.prototype.getLevel = function() {
  return this.level_
};
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if(!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_
  }
  if(this.level_) {
    return this.level_
  }
  if(this.parent_) {
    return this.parent_.getEffectiveLevel()
  }
  goog.asserts.fail("Root logger has no level set.");
  return null
};
goog.debug.Logger.prototype.isLoggable = function(level) {
  return level.value >= this.getEffectiveLevel().value
};
goog.debug.Logger.prototype.log = function(level, msg, opt_exception) {
  if(this.isLoggable(level)) {
    this.doLogRecord_(this.getLogRecord(level, msg, opt_exception))
  }
};
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception) {
  if(goog.debug.LogBuffer.isBufferingEnabled()) {
    var logRecord = goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_)
  }else {
    logRecord = new goog.debug.LogRecord(level, String(msg), this.name_)
  }
  if(opt_exception) {
    logRecord.setException(opt_exception);
    logRecord.setExceptionText(goog.debug.exposeException(opt_exception, arguments.callee.caller))
  }
  return logRecord
};
goog.debug.Logger.prototype.shout = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SHOUT, msg, opt_exception)
};
goog.debug.Logger.prototype.severe = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception)
};
goog.debug.Logger.prototype.warning = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception)
};
goog.debug.Logger.prototype.info = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.INFO, msg, opt_exception)
};
goog.debug.Logger.prototype.config = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.CONFIG, msg, opt_exception)
};
goog.debug.Logger.prototype.fine = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINE, msg, opt_exception)
};
goog.debug.Logger.prototype.finer = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINER, msg, opt_exception)
};
goog.debug.Logger.prototype.finest = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINEST, msg, opt_exception)
};
goog.debug.Logger.prototype.logRecord = function(logRecord) {
  if(this.isLoggable(logRecord.getLevel())) {
    this.doLogRecord_(logRecord)
  }
};
goog.debug.Logger.prototype.doLogRecord_ = function(logRecord) {
  goog.debug.Logger.logToProfilers("log:" + logRecord.getMessage());
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var target = this;
    while(target) {
      target.callPublish_(logRecord);
      target = target.getParent()
    }
  }else {
    for(var i = 0, handler;handler = goog.debug.Logger.rootHandlers_[i++];) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.callPublish_ = function(logRecord) {
  if(this.handlers_) {
    for(var i = 0, handler;handler = this.handlers_[i];i++) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.setParent_ = function(parent) {
  this.parent_ = parent
};
goog.debug.Logger.prototype.addChild_ = function(name, logger) {
  this.getChildren()[name] = logger
};
goog.debug.LogManager = {};
goog.debug.LogManager.loggers_ = {};
goog.debug.LogManager.rootLogger_ = null;
goog.debug.LogManager.initialize = function() {
  if(!goog.debug.LogManager.rootLogger_) {
    goog.debug.LogManager.rootLogger_ = new goog.debug.Logger("");
    goog.debug.LogManager.loggers_[""] = goog.debug.LogManager.rootLogger_;
    goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG)
  }
};
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_
};
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return(goog.debug.LogManager.rootLogger_)
};
goog.debug.LogManager.getLogger = function(name) {
  goog.debug.LogManager.initialize();
  var ret = goog.debug.LogManager.loggers_[name];
  return ret || goog.debug.LogManager.createLogger_(name)
};
goog.debug.LogManager.createFunctionForCatchErrors = function(opt_logger) {
  return function(info) {
    var logger = opt_logger || goog.debug.LogManager.getRoot();
    logger.severe("Error: " + info.message + " (" + info.fileName + " @ Line: " + info.line + ")")
  }
};
goog.debug.LogManager.createLogger_ = function(name) {
  var logger = new goog.debug.Logger(name);
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var lastDotIndex = name.lastIndexOf(".");
    var parentName = name.substr(0, lastDotIndex);
    var leafName = name.substr(lastDotIndex + 1);
    var parentLogger = goog.debug.LogManager.getLogger(parentName);
    parentLogger.addChild_(leafName, logger);
    logger.setParent_(parentLogger)
  }
  goog.debug.LogManager.loggers_[name] = logger;
  return logger
};
goog.provide("goog.ui.tree.TreeControl");
goog.require("goog.a11y.aria");
goog.require("goog.asserts");
goog.require("goog.debug.Logger");
goog.require("goog.dom.classes");
goog.require("goog.events.EventType");
goog.require("goog.events.FocusHandler");
goog.require("goog.events.KeyHandler");
goog.require("goog.events.KeyHandler.EventType");
goog.require("goog.ui.tree.BaseNode");
goog.require("goog.ui.tree.TreeNode");
goog.require("goog.ui.tree.TypeAhead");
goog.require("goog.userAgent");
goog.ui.tree.TreeControl = function(html, opt_config, opt_domHelper) {
  goog.ui.tree.BaseNode.call(this, html, opt_config, opt_domHelper);
  this.setExpandedInternal(true);
  this.setSelectedInternal(true);
  this.selectedItem_ = this;
  this.typeAhead_ = new goog.ui.tree.TypeAhead;
  if(goog.userAgent.IE) {
    try {
      document.execCommand("BackgroundImageCache", false, true)
    }catch(e) {
      this.logger_.warning("Failed to enable background image cache")
    }
  }
};
goog.inherits(goog.ui.tree.TreeControl, goog.ui.tree.BaseNode);
goog.ui.tree.TreeControl.prototype.keyHandler_ = null;
goog.ui.tree.TreeControl.prototype.focusHandler_ = null;
goog.ui.tree.TreeControl.prototype.logger_ = goog.debug.Logger.getLogger("goog.ui.tree.TreeControl");
goog.ui.tree.TreeControl.prototype.focused_ = false;
goog.ui.tree.TreeControl.prototype.focusedNode_ = null;
goog.ui.tree.TreeControl.prototype.showLines_ = true;
goog.ui.tree.TreeControl.prototype.showExpandIcons_ = true;
goog.ui.tree.TreeControl.prototype.showRootNode_ = true;
goog.ui.tree.TreeControl.prototype.showRootLines_ = true;
goog.ui.tree.TreeControl.prototype.getTree = function() {
  return this
};
goog.ui.tree.TreeControl.prototype.getDepth = function() {
  return 0
};
goog.ui.tree.TreeControl.prototype.reveal = function() {
};
goog.ui.tree.TreeControl.prototype.handleFocus_ = function(e) {
  this.focused_ = true;
  goog.dom.classes.add(this.getElement(), "focused");
  if(this.selectedItem_) {
    this.selectedItem_.select()
  }
};
goog.ui.tree.TreeControl.prototype.handleBlur_ = function(e) {
  this.focused_ = false;
  goog.dom.classes.remove(this.getElement(), "focused")
};
goog.ui.tree.TreeControl.prototype.hasFocus = function() {
  return this.focused_
};
goog.ui.tree.TreeControl.prototype.getExpanded = function() {
  return!this.showRootNode_ || goog.ui.tree.TreeControl.superClass_.getExpanded.call(this)
};
goog.ui.tree.TreeControl.prototype.setExpanded = function(expanded) {
  if(!this.showRootNode_) {
    this.setExpandedInternal(expanded)
  }else {
    goog.ui.tree.TreeControl.superClass_.setExpanded.call(this, expanded)
  }
};
goog.ui.tree.TreeControl.prototype.getExpandIconHtml = function() {
  return""
};
goog.ui.tree.TreeControl.prototype.getIconElement = function() {
  var el = this.getRowElement();
  return el ? (el.firstChild) : null
};
goog.ui.tree.TreeControl.prototype.getExpandIconElement = function() {
  return null
};
goog.ui.tree.TreeControl.prototype.updateExpandIcon = function() {
};
goog.ui.tree.TreeControl.prototype.getRowClassName = function() {
  return goog.ui.tree.TreeControl.superClass_.getRowClassName.call(this) + (this.showRootNode_ ? "" : " " + this.getConfig().cssHideRoot)
};
goog.ui.tree.TreeControl.prototype.getCalculatedIconClass = function() {
  var expanded = this.getExpanded();
  if(expanded && this.expandedIconClass_) {
    return this.expandedIconClass_
  }
  if(!expanded && this.iconClass_) {
    return this.iconClass_
  }
  var config = this.getConfig();
  if(expanded && config.cssExpandedRootIcon) {
    return config.cssTreeIcon + " " + config.cssExpandedRootIcon
  }else {
    if(!expanded && config.cssCollapsedRootIcon) {
      return config.cssTreeIcon + " " + config.cssCollapsedRootIcon
    }
  }
  return""
};
goog.ui.tree.TreeControl.prototype.setSelectedItem = function(node) {
  if(this.selectedItem_ == node) {
    return
  }
  var hadFocus = false;
  if(this.selectedItem_) {
    hadFocus = this.selectedItem_ == this.focusedNode_;
    this.selectedItem_.setSelectedInternal(false)
  }
  this.selectedItem_ = node;
  if(node) {
    node.setSelectedInternal(true);
    if(hadFocus) {
      node.select()
    }
  }
  this.dispatchEvent(goog.events.EventType.CHANGE)
};
goog.ui.tree.TreeControl.prototype.getSelectedItem = function() {
  return this.selectedItem_
};
goog.ui.tree.TreeControl.prototype.setShowLines = function(b) {
  if(this.showLines_ != b) {
    this.showLines_ = b;
    if(this.isInDocument()) {
      this.updateLinesAndExpandIcons_()
    }
  }
};
goog.ui.tree.TreeControl.prototype.getShowLines = function() {
  return this.showLines_
};
goog.ui.tree.TreeControl.prototype.updateLinesAndExpandIcons_ = function() {
  var tree = this;
  var showLines = tree.getShowLines();
  var showRootLines = tree.getShowRootLines();
  function updateShowLines(node) {
    var childrenEl = node.getChildrenElement();
    if(childrenEl) {
      var hideLines = !showLines || tree == node.getParent() && !showRootLines;
      var childClass = hideLines ? node.getConfig().cssChildrenNoLines : node.getConfig().cssChildren;
      childrenEl.className = childClass;
      var expandIconEl = node.getExpandIconElement();
      if(expandIconEl) {
        expandIconEl.className = node.getExpandIconClass()
      }
    }
    node.forEachChild(updateShowLines)
  }
  updateShowLines(this)
};
goog.ui.tree.TreeControl.prototype.setShowRootLines = function(b) {
  if(this.showRootLines_ != b) {
    this.showRootLines_ = b;
    if(this.isInDocument()) {
      this.updateLinesAndExpandIcons_()
    }
  }
};
goog.ui.tree.TreeControl.prototype.getShowRootLines = function() {
  return this.showRootLines_
};
goog.ui.tree.TreeControl.prototype.setShowExpandIcons = function(b) {
  if(this.showExpandIcons_ != b) {
    this.showExpandIcons_ = b;
    if(this.isInDocument()) {
      this.updateLinesAndExpandIcons_()
    }
  }
};
goog.ui.tree.TreeControl.prototype.getShowExpandIcons = function() {
  return this.showExpandIcons_
};
goog.ui.tree.TreeControl.prototype.setShowRootNode = function(b) {
  if(this.showRootNode_ != b) {
    this.showRootNode_ = b;
    if(this.isInDocument()) {
      var el = this.getRowElement();
      if(el) {
        el.className = this.getRowClassName()
      }
    }
    if(!b && (this.getSelectedItem() == this && this.getFirstChild())) {
      this.setSelectedItem(this.getFirstChild())
    }
  }
};
goog.ui.tree.TreeControl.prototype.getShowRootNode = function() {
  return this.showRootNode_
};
goog.ui.tree.TreeControl.prototype.initAccessibility = function() {
  goog.ui.tree.TreeControl.superClass_.initAccessibility.call(this);
  var elt = this.getElement();
  goog.asserts.assert(elt, "The DOM element for the tree cannot be null.");
  goog.a11y.aria.setRole(elt, "tree");
  goog.a11y.aria.setState(elt, "labelledby", this.getLabelElement().id)
};
goog.ui.tree.TreeControl.prototype.enterDocument = function() {
  goog.ui.tree.TreeControl.superClass_.enterDocument.call(this);
  var el = this.getElement();
  el.className = this.getConfig().cssRoot;
  el.setAttribute("hideFocus", "true");
  this.attachEvents_();
  this.initAccessibility()
};
goog.ui.tree.TreeControl.prototype.exitDocument = function() {
  goog.ui.tree.TreeControl.superClass_.exitDocument.call(this);
  this.detachEvents_()
};
goog.ui.tree.TreeControl.prototype.attachEvents_ = function() {
  var el = this.getElement();
  el.tabIndex = 0;
  var kh = this.keyHandler_ = new goog.events.KeyHandler(el);
  var fh = this.focusHandler_ = new goog.events.FocusHandler(el);
  this.getHandler().listen(fh, goog.events.FocusHandler.EventType.FOCUSOUT, this.handleBlur_).listen(fh, goog.events.FocusHandler.EventType.FOCUSIN, this.handleFocus_).listen(kh, goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent).listen(el, goog.events.EventType.MOUSEDOWN, this.handleMouseEvent_).listen(el, goog.events.EventType.CLICK, this.handleMouseEvent_).listen(el, goog.events.EventType.DBLCLICK, this.handleMouseEvent_)
};
goog.ui.tree.TreeControl.prototype.detachEvents_ = function() {
  this.keyHandler_.dispose();
  this.keyHandler_ = null;
  this.focusHandler_.dispose();
  this.focusHandler_ = null
};
goog.ui.tree.TreeControl.prototype.handleMouseEvent_ = function(e) {
  this.logger_.fine("Received event " + e.type);
  var node = this.getNodeFromEvent_(e);
  if(node) {
    switch(e.type) {
      case goog.events.EventType.MOUSEDOWN:
        node.onMouseDown(e);
        break;
      case goog.events.EventType.CLICK:
        node.onClick_(e);
        break;
      case goog.events.EventType.DBLCLICK:
        node.onDoubleClick_(e);
        break
    }
  }
};
goog.ui.tree.TreeControl.prototype.handleKeyEvent = function(e) {
  var handled = false;
  handled = this.typeAhead_.handleNavigation(e) || (this.selectedItem_ && this.selectedItem_.onKeyDown(e) || this.typeAhead_.handleTypeAheadChar(e));
  if(handled) {
    e.preventDefault()
  }
  return handled
};
goog.ui.tree.TreeControl.prototype.getNodeFromEvent_ = function(e) {
  var node = null;
  var target = e.target;
  while(target != null) {
    var id = target.id;
    node = goog.ui.tree.BaseNode.allNodes[id];
    if(node) {
      return node
    }
    if(target == this.getElement()) {
      break
    }
    target = target.parentNode
  }
  return null
};
goog.ui.tree.TreeControl.prototype.createNode = function(html) {
  return new goog.ui.tree.TreeNode(html || "", this.getConfig(), this.getDomHelper())
};
goog.ui.tree.TreeControl.prototype.setNode = function(node) {
  this.typeAhead_.setNodeInMap(node)
};
goog.ui.tree.TreeControl.prototype.removeNode = function(node) {
  this.typeAhead_.removeNodeFromMap(node)
};
goog.ui.tree.TreeControl.prototype.clearTypeAhead = function() {
  this.typeAhead_.clear()
};
goog.ui.tree.TreeControl.defaultConfig = {indentWidth:19, cssRoot:goog.getCssName("goog-tree-root") + " " + goog.getCssName("goog-tree-item"), cssHideRoot:goog.getCssName("goog-tree-hide-root"), cssItem:goog.getCssName("goog-tree-item"), cssChildren:goog.getCssName("goog-tree-children"), cssChildrenNoLines:goog.getCssName("goog-tree-children-nolines"), cssTreeRow:goog.getCssName("goog-tree-row"), cssItemLabel:goog.getCssName("goog-tree-item-label"), cssTreeIcon:goog.getCssName("goog-tree-icon"), 
cssExpandTreeIcon:goog.getCssName("goog-tree-expand-icon"), cssExpandTreeIconPlus:goog.getCssName("goog-tree-expand-icon-plus"), cssExpandTreeIconMinus:goog.getCssName("goog-tree-expand-icon-minus"), cssExpandTreeIconTPlus:goog.getCssName("goog-tree-expand-icon-tplus"), cssExpandTreeIconTMinus:goog.getCssName("goog-tree-expand-icon-tminus"), cssExpandTreeIconLPlus:goog.getCssName("goog-tree-expand-icon-lplus"), cssExpandTreeIconLMinus:goog.getCssName("goog-tree-expand-icon-lminus"), cssExpandTreeIconT:goog.getCssName("goog-tree-expand-icon-t"), 
cssExpandTreeIconL:goog.getCssName("goog-tree-expand-icon-l"), cssExpandTreeIconBlank:goog.getCssName("goog-tree-expand-icon-blank"), cssExpandedFolderIcon:goog.getCssName("goog-tree-expanded-folder-icon"), cssCollapsedFolderIcon:goog.getCssName("goog-tree-collapsed-folder-icon"), cssFileIcon:goog.getCssName("goog-tree-file-icon"), cssExpandedRootIcon:goog.getCssName("goog-tree-expanded-folder-icon"), cssCollapsedRootIcon:goog.getCssName("goog-tree-collapsed-folder-icon"), cssSelectedRow:goog.getCssName("selected")};
goog.provide("Blockly.Toolbox");
goog.require("Blockly.Flyout");
goog.require("goog.events.BrowserFeature");
goog.require("goog.style");
goog.require("goog.ui.tree.TreeControl");
goog.require("goog.ui.tree.TreeNode");
Blockly.Toolbox.width = 0;
Blockly.Toolbox.selectedOption_ = null;
Blockly.Toolbox.CONFIG_ = {indentWidth:19, cssRoot:"blocklyTreeRoot", cssHideRoot:"blocklyHidden", cssItem:"", cssTreeRow:"blocklyTreeRow", cssItemLabel:"blocklyTreeLabel", cssTreeIcon:"blocklyTreeIcon", cssExpandedFolderIcon:"blocklyTreeIconOpen", cssFileIcon:"blocklyTreeIconNone", cssSelectedRow:"blocklyTreeSelected"};
Blockly.Toolbox.createDom = function(svg, container) {
  Blockly.Toolbox.HtmlDiv = goog.dom.createDom("div", "blocklyToolboxDiv");
  Blockly.Toolbox.HtmlDiv.setAttribute("dir", Blockly.RTL ? "RTL" : "LTR");
  container.appendChild(Blockly.Toolbox.HtmlDiv);
  Blockly.Toolbox.flyout_ = new Blockly.Flyout;
  svg.appendChild(Blockly.Toolbox.flyout_.createDom());
  Blockly.bindEvent_(Blockly.Toolbox.HtmlDiv, "mousedown", null, function(e) {
    Blockly.fireUiEvent(window, "resize");
    if(Blockly.isRightButton(e) || e.target == Blockly.Toolbox.HtmlDiv) {
      Blockly.hideChaff(false)
    }else {
      Blockly.hideChaff(true)
    }
  })
};
Blockly.Toolbox.init = function() {
  Blockly.Toolbox.CONFIG_["cleardotPath"] = Blockly.assetUrl("media/1x1.gif");
  Blockly.Toolbox.CONFIG_["cssCollapsedFolderIcon"] = "blocklyTreeIconClosed" + (Blockly.RTL ? "Rtl" : "Ltr");
  var tree = new Blockly.Toolbox.TreeControl("root", Blockly.Toolbox.CONFIG_);
  Blockly.Toolbox.tree_ = tree;
  tree.setShowRootNode(false);
  tree.setShowLines(false);
  tree.setShowExpandIcons(false);
  tree.setSelectedItem(null);
  Blockly.Toolbox.HtmlDiv.style.display = "block";
  Blockly.Toolbox.flyout_.init(Blockly.mainWorkspace, true);
  Blockly.Toolbox.populate_();
  tree.render(Blockly.Toolbox.HtmlDiv);
  goog.events.listen(window, goog.events.EventType.RESIZE, Blockly.Toolbox.position_);
  Blockly.Toolbox.position_()
};
Blockly.Toolbox.position_ = function() {
  var treeDiv = Blockly.Toolbox.HtmlDiv;
  var svgBox = goog.style.getBorderBox(Blockly.svg);
  var svgSize = Blockly.svgSize();
  if(Blockly.RTL) {
    treeDiv.style.right = svgBox.right + "px"
  }else {
    treeDiv.style.marginLeft = svgBox.left
  }
  treeDiv.style.height = svgSize.height + 1 + "px";
  Blockly.Toolbox.width = treeDiv.offsetWidth;
  if(!Blockly.RTL) {
    Blockly.Toolbox.width -= 1
  }
};
Blockly.Toolbox.populate_ = function() {
  var rootOut = Blockly.Toolbox.tree_;
  rootOut.blocks = [];
  function syncTrees(treeIn, treeOut) {
    for(var i = 0, childIn;childIn = treeIn.childNodes[i];i++) {
      if(!childIn.tagName) {
        continue
      }
      var name = childIn.tagName.toUpperCase();
      if(name == "CATEGORY") {
        var childOut = rootOut.createNode(childIn.getAttribute("name"));
        childOut.blocks = [];
        treeOut.add(childOut);
        var custom = childIn.getAttribute("custom");
        if(custom) {
          childOut.blocks = custom
        }else {
          syncTrees(childIn, childOut)
        }
      }else {
        if(name == "BLOCK") {
          treeOut.blocks.push(childIn)
        }
      }
    }
  }
  syncTrees(Blockly.languageTree, Blockly.Toolbox.tree_);
  if(rootOut.blocks.length) {
    throw"Toolbox cannot have both blocks and categories in the root level.";
  }
  Blockly.fireUiEvent(window, "resize")
};
Blockly.Toolbox.clearSelection = function() {
  Blockly.Toolbox.tree_.setSelectedItem(null)
};
Blockly.Toolbox.TreeControl = function(html, opt_config, opt_domHelper) {
  goog.ui.tree.TreeControl.call(this, html, opt_config, opt_domHelper)
};
goog.inherits(Blockly.Toolbox.TreeControl, goog.ui.tree.TreeControl);
Blockly.Toolbox.TreeControl.prototype.enterDocument = function() {
  Blockly.Toolbox.TreeControl.superClass_.enterDocument.call(this);
  if(goog.events.BrowserFeature.TOUCH_ENABLED) {
    var el = this.getElement();
    Blockly.bindEvent_(el, goog.events.EventType.TOUCHSTART, this, this.handleTouchEvent_)
  }
};
Blockly.Toolbox.TreeControl.prototype.handleTouchEvent_ = function(e) {
  e.preventDefault();
  var node = this.getNodeFromEvent_(e);
  if(node && e.type === goog.events.EventType.TOUCHSTART) {
    window.setTimeout(function() {
      node.onMouseDown(e)
    }, 1)
  }
};
Blockly.Toolbox.TreeControl.prototype.createNode = function(html) {
  return new Blockly.Toolbox.TreeNode(html || "", this.getConfig(), this.getDomHelper())
};
Blockly.Toolbox.TreeControl.prototype.setSelectedItem = function(node) {
  if(this.selectedItem_ == node) {
    return
  }
  goog.ui.tree.TreeControl.prototype.setSelectedItem.call(this, node);
  if(node && (node.blocks && node.blocks.length)) {
    Blockly.Toolbox.flyout_.show(node.blocks)
  }else {
    Blockly.Toolbox.flyout_.hide()
  }
};
Blockly.Toolbox.TreeNode = function(html, opt_config, opt_domHelper) {
  goog.ui.tree.TreeNode.call(this, html, opt_config, opt_domHelper);
  var resize = function() {
    Blockly.fireUiEvent(window, "resize")
  };
  goog.events.listen(Blockly.Toolbox.tree_, goog.ui.tree.BaseNode.EventType.EXPAND, resize);
  goog.events.listen(Blockly.Toolbox.tree_, goog.ui.tree.BaseNode.EventType.COLLAPSE, resize)
};
goog.inherits(Blockly.Toolbox.TreeNode, goog.ui.tree.TreeNode);
Blockly.Toolbox.TreeNode.prototype.getExpandIconHtml = function() {
  return"<span></span>"
};
Blockly.Toolbox.TreeNode.prototype.getExpandIconElement = function() {
  return null
};
Blockly.Toolbox.TreeNode.prototype.onMouseDown = function(e) {
  if(this.hasChildren() && this.isUserCollapsible_) {
    this.toggle();
    this.select()
  }else {
    if(this.isSelected()) {
      this.getTree().setSelectedItem(null)
    }else {
      this.select()
    }
  }
  this.updateRow()
};
Blockly.Toolbox.TreeNode.prototype.onDoubleClick_ = function(e) {
};
goog.provide("Blockly.Variables");
goog.require("Blockly.Toolbox");
goog.require("Blockly.Workspace");
Blockly.Variables.NAME_TYPE = "VARIABLE";
Blockly.Variables.allVariables = function(opt_block) {
  var blocks;
  if(opt_block) {
    blocks = opt_block.getDescendants()
  }else {
    blocks = Blockly.mainWorkspace.getAllBlocks()
  }
  var variableHash = {};
  for(var x = 0;x < blocks.length;x++) {
    var func = blocks[x].getVars;
    if(func) {
      var blockVariables = func.call(blocks[x]);
      for(var y = 0;y < blockVariables.length;y++) {
        var varName = blockVariables[y];
        if(varName) {
          variableHash[Blockly.Names.PREFIX_ + varName.toLowerCase()] = varName
        }
      }
    }
  }
  var variableList = [];
  for(var name in variableHash) {
    variableList.push(variableHash[name])
  }
  return variableList
};
Blockly.Variables.renameVariable = function(oldName, newName) {
  var blocks = Blockly.mainWorkspace.getAllBlocks();
  for(var x = 0;x < blocks.length;x++) {
    var func = blocks[x].renameVar;
    if(func) {
      func.call(blocks[x], oldName, newName)
    }
  }
};
Blockly.Variables.flyoutCategory = function(blocks, gaps, margin, workspace) {
  var variableList = Blockly.Variables.allVariables();
  variableList.sort(goog.string.caseInsensitiveCompare);
  variableList.unshift(null);
  var defaultVariable = undefined;
  for(var i = 0;i < variableList.length;i++) {
    if(variableList[i] === defaultVariable) {
      continue
    }
    var getBlock = Blockly.Blocks.variables_get ? new Blockly.Block(workspace, "variables_get") : null;
    getBlock && getBlock.initSvg();
    var setBlock = Blockly.Blocks.variables_set ? new Blockly.Block(workspace, "variables_set") : null;
    setBlock && setBlock.initSvg();
    if(variableList[i] === null) {
      defaultVariable = (getBlock || setBlock).getVars()[0]
    }else {
      getBlock && getBlock.setTitleValue(variableList[i], "VAR");
      setBlock && setBlock.setTitleValue(variableList[i], "VAR")
    }
    setBlock && blocks.push(setBlock);
    getBlock && blocks.push(getBlock);
    if(getBlock && setBlock) {
      gaps.push(margin, margin * 3)
    }else {
      gaps.push(margin * 2)
    }
  }
};
Blockly.Variables.generateUniqueName = function() {
  var variableList = Blockly.Variables.allVariables();
  var newName = "";
  if(variableList.length) {
    variableList.sort(goog.string.caseInsensitiveCompare);
    var nameSuffix = 0, potName = "i", i = 0, inUse = false;
    while(!newName) {
      i = 0;
      inUse = false;
      while(i < variableList.length && !inUse) {
        if(variableList[i].toLowerCase() == potName) {
          inUse = true
        }
        i++
      }
      if(inUse) {
        if(potName[0] === "z") {
          nameSuffix++;
          potName = "a"
        }else {
          potName = String.fromCharCode(potName.charCodeAt(0) + 1);
          if(potName[0] == "l") {
            potName = String.fromCharCode(potName.charCodeAt(0) + 1)
          }
        }
        if(nameSuffix > 0) {
          potName += nameSuffix
        }
      }else {
        newName = potName
      }
    }
  }else {
    newName = "i"
  }
  return newName
};
goog.provide("Blockly.FieldVariable");
goog.require("Blockly.FieldDropdown");
goog.require("Blockly.Msg");
goog.require("Blockly.Variables");
Blockly.FieldVariable = function(varname, opt_changeHandler) {
  var changeHandler;
  if(opt_changeHandler) {
    var thisObj = this;
    changeHandler = function(value) {
      var retVal = Blockly.FieldVariable.dropdownChange.call(thisObj, value);
      var newVal;
      if(retVal === undefined) {
        newVal = value
      }else {
        if(retVal === null) {
          newVal = thisObj.getValue()
        }else {
          newVal = retVal
        }
      }
      opt_changeHandler.call(thisObj, newVal);
      return retVal
    }
  }else {
    changeHandler = Blockly.FieldVariable.dropdownChange
  }
  Blockly.FieldVariable.superClass_.constructor.call(this, Blockly.FieldVariable.dropdownCreate, changeHandler);
  if(varname) {
    this.setValue(varname)
  }else {
    this.setValue(Blockly.Variables.generateUniqueName())
  }
};
goog.inherits(Blockly.FieldVariable, Blockly.FieldDropdown);
Blockly.FieldVariable.prototype.getValue = function() {
  return this.getText()
};
Blockly.FieldVariable.prototype.setValue = function(text) {
  this.value_ = text;
  this.setText(text)
};
Blockly.FieldVariable.dropdownCreate = function() {
  var variableList = Blockly.Variables.allVariables();
  var name = this.getText();
  if(name && variableList.indexOf(name) == -1) {
    variableList.push(name)
  }
  variableList.sort(goog.string.caseInsensitiveCompare);
  variableList.push(Blockly.Msg.RENAME_VARIABLE);
  variableList.push(Blockly.Msg.NEW_VARIABLE);
  var options = [];
  for(var x = 0;x < variableList.length;x++) {
    options[x] = [variableList[x], variableList[x]]
  }
  return options
};
Blockly.FieldVariable.dropdownChange = function(text) {
  function promptName(promptText, defaultText) {
    Blockly.hideChaff();
    var newVar = window.prompt(promptText, defaultText);
    return newVar && newVar.replace(/[\s\xa0]+/g, " ").replace(/^ | $/g, "")
  }
  if(text == Blockly.Msg.RENAME_VARIABLE) {
    var oldVar = this.getText();
    text = promptName(Blockly.Msg.RENAME_VARIABLE_TITLE.replace("%1", oldVar), oldVar);
    if(text) {
      Blockly.Variables.renameVariable(oldVar, text)
    }
    return null
  }else {
    if(text == Blockly.Msg.NEW_VARIABLE) {
      text = promptName(Blockly.Msg.NEW_VARIABLE_TITLE, "");
      if(text) {
        Blockly.Variables.renameVariable(text, text);
        return text
      }
      return null
    }
  }
  return undefined
};
goog.provide("Blockly.Procedures");
goog.require("Blockly.FieldVariable");
goog.require("Blockly.Names");
goog.require("Blockly.Workspace");
Blockly.Procedures.NAME_TYPE = "PROCEDURE";
Blockly.Procedures.allProcedures = function() {
  var blocks = Blockly.mainWorkspace.getAllBlocks();
  var proceduresReturn = [];
  var proceduresNoReturn = [];
  for(var x = 0;x < blocks.length;x++) {
    var func = blocks[x].getProcedureDef;
    if(func) {
      var tuple = func.call(blocks[x]);
      if(tuple) {
        if(tuple[2]) {
          proceduresReturn.push(tuple)
        }else {
          proceduresNoReturn.push(tuple)
        }
      }
    }
  }
  proceduresNoReturn.sort(Blockly.Procedures.procTupleComparator_);
  proceduresReturn.sort(Blockly.Procedures.procTupleComparator_);
  return[proceduresNoReturn, proceduresReturn]
};
Blockly.Procedures.procTupleComparator_ = function(ta, tb) {
  var a = ta[0].toLowerCase();
  var b = tb[0].toLowerCase();
  if(a > b) {
    return 1
  }
  if(a < b) {
    return-1
  }
  return 0
};
Blockly.Procedures.findLegalName = function(name, block) {
  if(block.isInFlyout) {
    return name
  }
  while(!Blockly.Procedures.isLegalName(name, block.workspace, block)) {
    var r = name.match(/^(.*?)(\d+)$/);
    if(!r) {
      name += "2"
    }else {
      name = r[1] + (parseInt(r[2], 10) + 1)
    }
  }
  return name
};
Blockly.Procedures.isLegalName = function(name, workspace, opt_exclude) {
  var blocks = workspace.getAllBlocks();
  for(var x = 0;x < blocks.length;x++) {
    if(blocks[x] == opt_exclude) {
      continue
    }
    var func = blocks[x].getProcedureDef;
    if(func) {
      var procName = func.call(blocks[x]);
      if(Blockly.Names.equals(procName[0], name)) {
        return false
      }
    }
  }
  return true
};
Blockly.Procedures.rename = function(text) {
  text = text.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "");
  text = Blockly.Procedures.findLegalName(text, this.sourceBlock_);
  var blocks = this.sourceBlock_.workspace.getAllBlocks();
  for(var x = 0;x < blocks.length;x++) {
    var func = blocks[x].renameProcedure;
    if(func) {
      func.call(blocks[x], this.text_, text)
    }
  }
  return text
};
Blockly.Procedures.flyoutCategory = function(blocks, gaps, margin, workspace) {
  if(Blockly.Blocks.procedures_defnoreturn) {
    var block = new Blockly.Block(workspace, "procedures_defnoreturn");
    block.initSvg();
    blocks.push(block);
    gaps.push(margin * 2)
  }
  if(Blockly.Blocks.procedures_defreturn) {
    var block = new Blockly.Block(workspace, "procedures_defreturn");
    block.initSvg();
    blocks.push(block);
    gaps.push(margin * 2)
  }
  if(Blockly.Blocks.procedures_ifreturn) {
    var block = new Blockly.Block(workspace, "procedures_ifreturn");
    block.initSvg();
    blocks.push(block);
    gaps.push(margin * 2)
  }
  if(gaps.length) {
    gaps[gaps.length - 1] = margin * 3
  }
  function populateProcedures(procedureList, templateName) {
    for(var x = 0;x < procedureList.length;x++) {
      var block = new Blockly.Block(workspace, templateName);
      block.setTitleValue(procedureList[x][0], "NAME");
      var tempIds = [];
      for(var t = 0;t < procedureList[x][1].length;t++) {
        tempIds[t] = "ARG" + t
      }
      block.setProcedureParameters(procedureList[x][1], tempIds);
      block.initSvg();
      blocks.push(block);
      gaps.push(margin * 2)
    }
  }
  var tuple = Blockly.Procedures.allProcedures();
  populateProcedures(tuple[0], "procedures_callnoreturn");
  populateProcedures(tuple[1], "procedures_callreturn")
};
Blockly.Procedures.getCallers = function(name, workspace) {
  var callers = [];
  var blocks = workspace.getAllBlocks();
  for(var x = 0;x < blocks.length;x++) {
    var func = blocks[x].getProcedureCall;
    if(func) {
      var procName = func.call(blocks[x]);
      if(procName && Blockly.Names.equals(procName, name)) {
        callers.push(blocks[x])
      }
    }
  }
  return callers
};
Blockly.Procedures.disposeCallers = function(name, workspace) {
  var callers = Blockly.Procedures.getCallers(name, workspace);
  for(var x = 0;x < callers.length;x++) {
    callers[x].dispose(true, false)
  }
};
Blockly.Procedures.mutateCallers = function(name, workspace, paramNames, paramIds) {
  var callers = Blockly.Procedures.getCallers(name, workspace);
  for(var x = 0;x < callers.length;x++) {
    callers[x].setProcedureParameters(paramNames, paramIds)
  }
};
Blockly.Procedures.getDefinition = function(name, workspace) {
  var blocks = workspace.getAllBlocks();
  for(var x = 0;x < blocks.length;x++) {
    var func = blocks[x].getProcedureDef;
    if(func) {
      var tuple = func.call(blocks[x]);
      if(tuple && Blockly.Names.equals(tuple[0], name)) {
        return blocks[x]
      }
    }
  }
  return null
};
goog.provide("goog.color.names");
goog.color.names = {"aliceblue":"#f0f8ff", "antiquewhite":"#faebd7", "aqua":"#00ffff", "aquamarine":"#7fffd4", "azure":"#f0ffff", "beige":"#f5f5dc", "bisque":"#ffe4c4", "black":"#000000", "blanchedalmond":"#ffebcd", "blue":"#0000ff", "blueviolet":"#8a2be2", "brown":"#a52a2a", "burlywood":"#deb887", "cadetblue":"#5f9ea0", "chartreuse":"#7fff00", "chocolate":"#d2691e", "coral":"#ff7f50", "cornflowerblue":"#6495ed", "cornsilk":"#fff8dc", "crimson":"#dc143c", "cyan":"#00ffff", "darkblue":"#00008b", "darkcyan":"#008b8b", 
"darkgoldenrod":"#b8860b", "darkgray":"#a9a9a9", "darkgreen":"#006400", "darkgrey":"#a9a9a9", "darkkhaki":"#bdb76b", "darkmagenta":"#8b008b", "darkolivegreen":"#556b2f", "darkorange":"#ff8c00", "darkorchid":"#9932cc", "darkred":"#8b0000", "darksalmon":"#e9967a", "darkseagreen":"#8fbc8f", "darkslateblue":"#483d8b", "darkslategray":"#2f4f4f", "darkslategrey":"#2f4f4f", "darkturquoise":"#00ced1", "darkviolet":"#9400d3", "deeppink":"#ff1493", "deepskyblue":"#00bfff", "dimgray":"#696969", "dimgrey":"#696969", 
"dodgerblue":"#1e90ff", "firebrick":"#b22222", "floralwhite":"#fffaf0", "forestgreen":"#228b22", "fuchsia":"#ff00ff", "gainsboro":"#dcdcdc", "ghostwhite":"#f8f8ff", "gold":"#ffd700", "goldenrod":"#daa520", "gray":"#808080", "green":"#008000", "greenyellow":"#adff2f", "grey":"#808080", "honeydew":"#f0fff0", "hotpink":"#ff69b4", "indianred":"#cd5c5c", "indigo":"#4b0082", "ivory":"#fffff0", "khaki":"#f0e68c", "lavender":"#e6e6fa", "lavenderblush":"#fff0f5", "lawngreen":"#7cfc00", "lemonchiffon":"#fffacd", 
"lightblue":"#add8e6", "lightcoral":"#f08080", "lightcyan":"#e0ffff", "lightgoldenrodyellow":"#fafad2", "lightgray":"#d3d3d3", "lightgreen":"#90ee90", "lightgrey":"#d3d3d3", "lightpink":"#ffb6c1", "lightsalmon":"#ffa07a", "lightseagreen":"#20b2aa", "lightskyblue":"#87cefa", "lightslategray":"#778899", "lightslategrey":"#778899", "lightsteelblue":"#b0c4de", "lightyellow":"#ffffe0", "lime":"#00ff00", "limegreen":"#32cd32", "linen":"#faf0e6", "magenta":"#ff00ff", "maroon":"#800000", "mediumaquamarine":"#66cdaa", 
"mediumblue":"#0000cd", "mediumorchid":"#ba55d3", "mediumpurple":"#9370db", "mediumseagreen":"#3cb371", "mediumslateblue":"#7b68ee", "mediumspringgreen":"#00fa9a", "mediumturquoise":"#48d1cc", "mediumvioletred":"#c71585", "midnightblue":"#191970", "mintcream":"#f5fffa", "mistyrose":"#ffe4e1", "moccasin":"#ffe4b5", "navajowhite":"#ffdead", "navy":"#000080", "oldlace":"#fdf5e6", "olive":"#808000", "olivedrab":"#6b8e23", "orange":"#ffa500", "orangered":"#ff4500", "orchid":"#da70d6", "palegoldenrod":"#eee8aa", 
"palegreen":"#98fb98", "paleturquoise":"#afeeee", "palevioletred":"#db7093", "papayawhip":"#ffefd5", "peachpuff":"#ffdab9", "peru":"#cd853f", "pink":"#ffc0cb", "plum":"#dda0dd", "powderblue":"#b0e0e6", "purple":"#800080", "red":"#ff0000", "rosybrown":"#bc8f8f", "royalblue":"#4169e1", "saddlebrown":"#8b4513", "salmon":"#fa8072", "sandybrown":"#f4a460", "seagreen":"#2e8b57", "seashell":"#fff5ee", "sienna":"#a0522d", "silver":"#c0c0c0", "skyblue":"#87ceeb", "slateblue":"#6a5acd", "slategray":"#708090", 
"slategrey":"#708090", "snow":"#fffafa", "springgreen":"#00ff7f", "steelblue":"#4682b4", "tan":"#d2b48c", "teal":"#008080", "thistle":"#d8bfd8", "tomato":"#ff6347", "turquoise":"#40e0d0", "violet":"#ee82ee", "wheat":"#f5deb3", "white":"#ffffff", "whitesmoke":"#f5f5f5", "yellow":"#ffff00", "yellowgreen":"#9acd32"};
goog.provide("goog.color");
goog.require("goog.color.names");
goog.require("goog.math");
goog.color.Rgb;
goog.color.Hsv;
goog.color.Hsl;
goog.color.parse = function(str) {
  var result = {};
  str = String(str);
  var maybeHex = goog.color.prependHashIfNecessaryHelper(str);
  if(goog.color.isValidHexColor_(maybeHex)) {
    result.hex = goog.color.normalizeHex(maybeHex);
    result.type = "hex";
    return result
  }else {
    var rgb = goog.color.isValidRgbColor_(str);
    if(rgb.length) {
      result.hex = goog.color.rgbArrayToHex(rgb);
      result.type = "rgb";
      return result
    }else {
      if(goog.color.names) {
        var hex = goog.color.names[str.toLowerCase()];
        if(hex) {
          result.hex = hex;
          result.type = "named";
          return result
        }
      }
    }
  }
  throw Error(str + " is not a valid color string");
};
goog.color.isValidColor = function(str) {
  var maybeHex = goog.color.prependHashIfNecessaryHelper(str);
  return!!(goog.color.isValidHexColor_(maybeHex) || (goog.color.isValidRgbColor_(str).length || goog.color.names && goog.color.names[str.toLowerCase()]))
};
goog.color.parseRgb = function(str) {
  var rgb = goog.color.isValidRgbColor_(str);
  if(!rgb.length) {
    throw Error(str + " is not a valid RGB color");
  }
  return rgb
};
goog.color.hexToRgbStyle = function(hexColor) {
  return goog.color.rgbStyle_(goog.color.hexToRgb(hexColor))
};
goog.color.hexTripletRe_ = /#(.)(.)(.)/;
goog.color.normalizeHex = function(hexColor) {
  if(!goog.color.isValidHexColor_(hexColor)) {
    throw Error("'" + hexColor + "' is not a valid hex color");
  }
  if(hexColor.length == 4) {
    hexColor = hexColor.replace(goog.color.hexTripletRe_, "#$1$1$2$2$3$3")
  }
  return hexColor.toLowerCase()
};
goog.color.hexToRgb = function(hexColor) {
  hexColor = goog.color.normalizeHex(hexColor);
  var r = parseInt(hexColor.substr(1, 2), 16);
  var g = parseInt(hexColor.substr(3, 2), 16);
  var b = parseInt(hexColor.substr(5, 2), 16);
  return[r, g, b]
};
goog.color.rgbToHex = function(r, g, b) {
  r = Number(r);
  g = Number(g);
  b = Number(b);
  if(isNaN(r) || (r < 0 || (r > 255 || (isNaN(g) || (g < 0 || (g > 255 || (isNaN(b) || (b < 0 || b > 255)))))))) {
    throw Error('"(' + r + "," + g + "," + b + '") is not a valid RGB color');
  }
  var hexR = goog.color.prependZeroIfNecessaryHelper(r.toString(16));
  var hexG = goog.color.prependZeroIfNecessaryHelper(g.toString(16));
  var hexB = goog.color.prependZeroIfNecessaryHelper(b.toString(16));
  return"#" + hexR + hexG + hexB
};
goog.color.rgbArrayToHex = function(rgb) {
  return goog.color.rgbToHex(rgb[0], rgb[1], rgb[2])
};
goog.color.rgbToHsl = function(r, g, b) {
  var normR = r / 255;
  var normG = g / 255;
  var normB = b / 255;
  var max = Math.max(normR, normG, normB);
  var min = Math.min(normR, normG, normB);
  var h = 0;
  var s = 0;
  var l = 0.5 * (max + min);
  if(max != min) {
    if(max == normR) {
      h = 60 * (normG - normB) / (max - min)
    }else {
      if(max == normG) {
        h = 60 * (normB - normR) / (max - min) + 120
      }else {
        if(max == normB) {
          h = 60 * (normR - normG) / (max - min) + 240
        }
      }
    }
    if(0 < l && l <= 0.5) {
      s = (max - min) / (2 * l)
    }else {
      s = (max - min) / (2 - 2 * l)
    }
  }
  return[Math.round(h + 360) % 360, s, l]
};
goog.color.rgbArrayToHsl = function(rgb) {
  return goog.color.rgbToHsl(rgb[0], rgb[1], rgb[2])
};
goog.color.hueToRgb_ = function(v1, v2, vH) {
  if(vH < 0) {
    vH += 1
  }else {
    if(vH > 1) {
      vH -= 1
    }
  }
  if(6 * vH < 1) {
    return v1 + (v2 - v1) * 6 * vH
  }else {
    if(2 * vH < 1) {
      return v2
    }else {
      if(3 * vH < 2) {
        return v1 + (v2 - v1) * (2 / 3 - vH) * 6
      }
    }
  }
  return v1
};
goog.color.hslToRgb = function(h, s, l) {
  var r = 0;
  var g = 0;
  var b = 0;
  var normH = h / 360;
  if(s == 0) {
    r = g = b = l * 255
  }else {
    var temp1 = 0;
    var temp2 = 0;
    if(l < 0.5) {
      temp2 = l * (1 + s)
    }else {
      temp2 = l + s - s * l
    }
    temp1 = 2 * l - temp2;
    r = 255 * goog.color.hueToRgb_(temp1, temp2, normH + 1 / 3);
    g = 255 * goog.color.hueToRgb_(temp1, temp2, normH);
    b = 255 * goog.color.hueToRgb_(temp1, temp2, normH - 1 / 3)
  }
  return[Math.round(r), Math.round(g), Math.round(b)]
};
goog.color.hslArrayToRgb = function(hsl) {
  return goog.color.hslToRgb(hsl[0], hsl[1], hsl[2])
};
goog.color.validHexColorRe_ = /^#(?:[0-9a-f]{3}){1,2}$/i;
goog.color.isValidHexColor_ = function(str) {
  return goog.color.validHexColorRe_.test(str)
};
goog.color.normalizedHexColorRe_ = /^#[0-9a-f]{6}$/;
goog.color.isNormalizedHexColor_ = function(str) {
  return goog.color.normalizedHexColorRe_.test(str)
};
goog.color.rgbColorRe_ = /^(?:rgb)?\((0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2})\)$/i;
goog.color.isValidRgbColor_ = function(str) {
  var regExpResultArray = str.match(goog.color.rgbColorRe_);
  if(regExpResultArray) {
    var r = Number(regExpResultArray[1]);
    var g = Number(regExpResultArray[2]);
    var b = Number(regExpResultArray[3]);
    if(r >= 0 && (r <= 255 && (g >= 0 && (g <= 255 && (b >= 0 && b <= 255))))) {
      return[r, g, b]
    }
  }
  return[]
};
goog.color.prependZeroIfNecessaryHelper = function(hex) {
  return hex.length == 1 ? "0" + hex : hex
};
goog.color.prependHashIfNecessaryHelper = function(str) {
  return str.charAt(0) == "#" ? str : "#" + str
};
goog.color.rgbStyle_ = function(rgb) {
  return"rgb(" + rgb.join(",") + ")"
};
goog.color.hsvToRgb = function(h, s, brightness) {
  var red = 0;
  var green = 0;
  var blue = 0;
  if(s == 0) {
    red = brightness;
    green = brightness;
    blue = brightness
  }else {
    var sextant = Math.floor(h / 60);
    var remainder = h / 60 - sextant;
    var val1 = brightness * (1 - s);
    var val2 = brightness * (1 - s * remainder);
    var val3 = brightness * (1 - s * (1 - remainder));
    switch(sextant) {
      case 1:
        red = val2;
        green = brightness;
        blue = val1;
        break;
      case 2:
        red = val1;
        green = brightness;
        blue = val3;
        break;
      case 3:
        red = val1;
        green = val2;
        blue = brightness;
        break;
      case 4:
        red = val3;
        green = val1;
        blue = brightness;
        break;
      case 5:
        red = brightness;
        green = val1;
        blue = val2;
        break;
      case 6:
      ;
      case 0:
        red = brightness;
        green = val3;
        blue = val1;
        break
    }
  }
  return[Math.floor(red), Math.floor(green), Math.floor(blue)]
};
goog.color.rgbToHsv = function(red, green, blue) {
  var max = Math.max(Math.max(red, green), blue);
  var min = Math.min(Math.min(red, green), blue);
  var hue;
  var saturation;
  var value = max;
  if(min == max) {
    hue = 0;
    saturation = 0
  }else {
    var delta = max - min;
    saturation = delta / max;
    if(red == max) {
      hue = (green - blue) / delta
    }else {
      if(green == max) {
        hue = 2 + (blue - red) / delta
      }else {
        hue = 4 + (red - green) / delta
      }
    }
    hue *= 60;
    if(hue < 0) {
      hue += 360
    }
    if(hue > 360) {
      hue -= 360
    }
  }
  return[hue, saturation, value]
};
goog.color.rgbArrayToHsv = function(rgb) {
  return goog.color.rgbToHsv(rgb[0], rgb[1], rgb[2])
};
goog.color.hsvArrayToRgb = function(hsv) {
  return goog.color.hsvToRgb(hsv[0], hsv[1], hsv[2])
};
goog.color.hexToHsl = function(hex) {
  var rgb = goog.color.hexToRgb(hex);
  return goog.color.rgbToHsl(rgb[0], rgb[1], rgb[2])
};
goog.color.hslToHex = function(h, s, l) {
  return goog.color.rgbArrayToHex(goog.color.hslToRgb(h, s, l))
};
goog.color.hslArrayToHex = function(hsl) {
  return goog.color.rgbArrayToHex(goog.color.hslToRgb(hsl[0], hsl[1], hsl[2]))
};
goog.color.hexToHsv = function(hex) {
  return goog.color.rgbArrayToHsv(goog.color.hexToRgb(hex))
};
goog.color.hsvToHex = function(h, s, v) {
  return goog.color.rgbArrayToHex(goog.color.hsvToRgb(h, s, v))
};
goog.color.hsvArrayToHex = function(hsv) {
  return goog.color.hsvToHex(hsv[0], hsv[1], hsv[2])
};
goog.color.hslDistance = function(hsl1, hsl2) {
  var sl1, sl2;
  if(hsl1[2] <= 0.5) {
    sl1 = hsl1[1] * hsl1[2]
  }else {
    sl1 = hsl1[1] * (1 - hsl1[2])
  }
  if(hsl2[2] <= 0.5) {
    sl2 = hsl2[1] * hsl2[2]
  }else {
    sl2 = hsl2[1] * (1 - hsl2[2])
  }
  var h1 = hsl1[0] / 360;
  var h2 = hsl2[0] / 360;
  var dh = (h1 - h2) * 2 * Math.PI;
  return(hsl1[2] - hsl2[2]) * (hsl1[2] - hsl2[2]) + sl1 * sl1 + sl2 * sl2 - 2 * sl1 * sl2 * Math.cos(dh)
};
goog.color.blend = function(rgb1, rgb2, factor) {
  factor = goog.math.clamp(factor, 0, 1);
  return[Math.round(factor * rgb1[0] + (1 - factor) * rgb2[0]), Math.round(factor * rgb1[1] + (1 - factor) * rgb2[1]), Math.round(factor * rgb1[2] + (1 - factor) * rgb2[2])]
};
goog.color.darken = function(rgb, factor) {
  var black = [0, 0, 0];
  return goog.color.blend(black, rgb, factor)
};
goog.color.lighten = function(rgb, factor) {
  var white = [255, 255, 255];
  return goog.color.blend(white, rgb, factor)
};
goog.color.highContrast = function(prime, suggestions) {
  var suggestionsWithDiff = [];
  for(var i = 0;i < suggestions.length;i++) {
    suggestionsWithDiff.push({color:suggestions[i], diff:goog.color.yiqBrightnessDiff_(suggestions[i], prime) + goog.color.colorDiff_(suggestions[i], prime)})
  }
  suggestionsWithDiff.sort(function(a, b) {
    return b.diff - a.diff
  });
  return suggestionsWithDiff[0].color
};
goog.color.yiqBrightness_ = function(rgb) {
  return Math.round((rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1E3)
};
goog.color.yiqBrightnessDiff_ = function(rgb1, rgb2) {
  return Math.abs(goog.color.yiqBrightness_(rgb1) - goog.color.yiqBrightness_(rgb2))
};
goog.color.colorDiff_ = function(rgb1, rgb2) {
  return Math.abs(rgb1[0] - rgb2[0]) + Math.abs(rgb1[1] - rgb2[1]) + Math.abs(rgb1[2] - rgb2[2])
};
goog.provide("goog.ui.SelectionModel");
goog.require("goog.array");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
goog.ui.SelectionModel = function(opt_items) {
  goog.events.EventTarget.call(this);
  this.items_ = [];
  this.addItems(opt_items)
};
goog.inherits(goog.ui.SelectionModel, goog.events.EventTarget);
goog.ui.SelectionModel.prototype.selectedItem_ = null;
goog.ui.SelectionModel.prototype.selectionHandler_ = null;
goog.ui.SelectionModel.prototype.getSelectionHandler = function() {
  return this.selectionHandler_
};
goog.ui.SelectionModel.prototype.setSelectionHandler = function(handler) {
  this.selectionHandler_ = handler
};
goog.ui.SelectionModel.prototype.getItemCount = function() {
  return this.items_.length
};
goog.ui.SelectionModel.prototype.indexOfItem = function(item) {
  return item ? goog.array.indexOf(this.items_, item) : -1
};
goog.ui.SelectionModel.prototype.getFirst = function() {
  return this.items_[0]
};
goog.ui.SelectionModel.prototype.getLast = function() {
  return this.items_[this.items_.length - 1]
};
goog.ui.SelectionModel.prototype.getItemAt = function(index) {
  return this.items_[index] || null
};
goog.ui.SelectionModel.prototype.addItems = function(items) {
  if(items) {
    goog.array.forEach(items, function(item) {
      this.selectItem_(item, false)
    }, this);
    goog.array.extend(this.items_, items)
  }
};
goog.ui.SelectionModel.prototype.addItem = function(item) {
  this.addItemAt(item, this.getItemCount())
};
goog.ui.SelectionModel.prototype.addItemAt = function(item, index) {
  if(item) {
    this.selectItem_(item, false);
    goog.array.insertAt(this.items_, item, index)
  }
};
goog.ui.SelectionModel.prototype.removeItem = function(item) {
  if(item && goog.array.remove(this.items_, item)) {
    if(item == this.selectedItem_) {
      this.selectedItem_ = null;
      this.dispatchEvent(goog.events.EventType.SELECT)
    }
  }
};
goog.ui.SelectionModel.prototype.removeItemAt = function(index) {
  this.removeItem(this.getItemAt(index))
};
goog.ui.SelectionModel.prototype.getSelectedItem = function() {
  return this.selectedItem_
};
goog.ui.SelectionModel.prototype.getItems = function() {
  return goog.array.clone(this.items_)
};
goog.ui.SelectionModel.prototype.setSelectedItem = function(item) {
  if(item != this.selectedItem_) {
    this.selectItem_(this.selectedItem_, false);
    this.selectedItem_ = item;
    this.selectItem_(item, true)
  }
  this.dispatchEvent(goog.events.EventType.SELECT)
};
goog.ui.SelectionModel.prototype.getSelectedIndex = function() {
  return this.indexOfItem(this.selectedItem_)
};
goog.ui.SelectionModel.prototype.setSelectedIndex = function(index) {
  this.setSelectedItem(this.getItemAt(index))
};
goog.ui.SelectionModel.prototype.clear = function() {
  goog.array.clear(this.items_);
  this.selectedItem_ = null
};
goog.ui.SelectionModel.prototype.disposeInternal = function() {
  goog.ui.SelectionModel.superClass_.disposeInternal.call(this);
  delete this.items_;
  this.selectedItem_ = null
};
goog.ui.SelectionModel.prototype.selectItem_ = function(item, select) {
  if(item) {
    if(typeof this.selectionHandler_ == "function") {
      this.selectionHandler_(item, select)
    }else {
      if(typeof item.setSelected == "function") {
        item.setSelected(select)
      }
    }
  }
};
goog.provide("goog.ui.ControlRenderer");
goog.require("goog.a11y.aria");
goog.require("goog.a11y.aria.State");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.dom");
goog.require("goog.dom.classes");
goog.require("goog.object");
goog.require("goog.style");
goog.require("goog.ui.Component");
goog.require("goog.userAgent");
goog.ui.ControlRenderer = function() {
};
goog.addSingletonGetter(goog.ui.ControlRenderer);
goog.ui.ControlRenderer.getCustomRenderer = function(ctor, cssClassName) {
  var renderer = new ctor;
  renderer.getCssClass = function() {
    return cssClassName
  };
  return renderer
};
goog.ui.ControlRenderer.CSS_CLASS = goog.getCssName("goog-control");
goog.ui.ControlRenderer.IE6_CLASS_COMBINATIONS = [];
goog.ui.ControlRenderer.ARIA_STATE_MAP_;
goog.ui.ControlRenderer.prototype.getAriaRole = function() {
  return undefined
};
goog.ui.ControlRenderer.prototype.createDom = function(control) {
  var element = control.getDomHelper().createDom("div", this.getClassNames(control).join(" "), control.getContent());
  this.setAriaStates(control, element);
  return element
};
goog.ui.ControlRenderer.prototype.getContentElement = function(element) {
  return element
};
goog.ui.ControlRenderer.prototype.enableClassName = function(control, className, enable) {
  var element = (control.getElement ? control.getElement() : control);
  if(element) {
    if(goog.userAgent.IE && !goog.userAgent.isVersion("7")) {
      var combinedClasses = this.getAppliedCombinedClassNames_(goog.dom.classes.get(element), className);
      combinedClasses.push(className);
      var f = enable ? goog.dom.classes.add : goog.dom.classes.remove;
      goog.partial(f, element).apply(null, combinedClasses)
    }else {
      goog.dom.classes.enable(element, className, enable)
    }
  }
};
goog.ui.ControlRenderer.prototype.enableExtraClassName = function(control, className, enable) {
  this.enableClassName(control, className, enable)
};
goog.ui.ControlRenderer.prototype.canDecorate = function(element) {
  return true
};
goog.ui.ControlRenderer.prototype.decorate = function(control, element) {
  if(element.id) {
    control.setId(element.id)
  }
  var contentElem = this.getContentElement(element);
  if(contentElem && contentElem.firstChild) {
    control.setContentInternal(contentElem.firstChild.nextSibling ? goog.array.clone(contentElem.childNodes) : contentElem.firstChild)
  }else {
    control.setContentInternal(null)
  }
  var state = 0;
  var rendererClassName = this.getCssClass();
  var structuralClassName = this.getStructuralCssClass();
  var hasRendererClassName = false;
  var hasStructuralClassName = false;
  var hasCombinedClassName = false;
  var classNames = goog.dom.classes.get(element);
  goog.array.forEach(classNames, function(className) {
    if(!hasRendererClassName && className == rendererClassName) {
      hasRendererClassName = true;
      if(structuralClassName == rendererClassName) {
        hasStructuralClassName = true
      }
    }else {
      if(!hasStructuralClassName && className == structuralClassName) {
        hasStructuralClassName = true
      }else {
        state |= this.getStateFromClass(className)
      }
    }
  }, this);
  control.setStateInternal(state);
  if(!hasRendererClassName) {
    classNames.push(rendererClassName);
    if(structuralClassName == rendererClassName) {
      hasStructuralClassName = true
    }
  }
  if(!hasStructuralClassName) {
    classNames.push(structuralClassName)
  }
  var extraClassNames = control.getExtraClassNames();
  if(extraClassNames) {
    classNames.push.apply(classNames, extraClassNames)
  }
  if(goog.userAgent.IE && !goog.userAgent.isVersion("7")) {
    var combinedClasses = this.getAppliedCombinedClassNames_(classNames);
    if(combinedClasses.length > 0) {
      classNames.push.apply(classNames, combinedClasses);
      hasCombinedClassName = true
    }
  }
  if(!hasRendererClassName || (!hasStructuralClassName || (extraClassNames || hasCombinedClassName))) {
    goog.dom.classes.set(element, classNames.join(" "))
  }
  this.setAriaStates(control, element);
  return element
};
goog.ui.ControlRenderer.prototype.initializeDom = function(control) {
  if(control.isRightToLeft()) {
    this.setRightToLeft(control.getElement(), true)
  }
  if(control.isEnabled()) {
    this.setFocusable(control, control.isVisible())
  }
};
goog.ui.ControlRenderer.prototype.setAriaRole = function(element, opt_preferredRole) {
  var ariaRole = opt_preferredRole || this.getAriaRole();
  if(ariaRole) {
    goog.asserts.assert(element, "The element passed as a first parameter cannot be null.");
    goog.a11y.aria.setRole(element, ariaRole)
  }
};
goog.ui.ControlRenderer.prototype.setAriaStates = function(control, element) {
  goog.asserts.assert(control);
  goog.asserts.assert(element);
  if(!control.isVisible()) {
    goog.a11y.aria.setState(element, goog.a11y.aria.State.HIDDEN, !control.isVisible())
  }
  if(!control.isEnabled()) {
    this.updateAriaState(element, goog.ui.Component.State.DISABLED, !control.isEnabled())
  }
  if(control.isSupportedState(goog.ui.Component.State.SELECTED)) {
    this.updateAriaState(element, goog.ui.Component.State.SELECTED, control.isSelected())
  }
  if(control.isSupportedState(goog.ui.Component.State.CHECKED)) {
    this.updateAriaState(element, goog.ui.Component.State.CHECKED, control.isChecked())
  }
  if(control.isSupportedState(goog.ui.Component.State.OPENED)) {
    this.updateAriaState(element, goog.ui.Component.State.OPENED, control.isOpen())
  }
};
goog.ui.ControlRenderer.prototype.setAllowTextSelection = function(element, allow) {
  goog.style.setUnselectable(element, !allow, !goog.userAgent.IE && !goog.userAgent.OPERA)
};
goog.ui.ControlRenderer.prototype.setRightToLeft = function(element, rightToLeft) {
  this.enableClassName(element, goog.getCssName(this.getStructuralCssClass(), "rtl"), rightToLeft)
};
goog.ui.ControlRenderer.prototype.isFocusable = function(control) {
  var keyTarget;
  if(control.isSupportedState(goog.ui.Component.State.FOCUSED) && (keyTarget = control.getKeyEventTarget())) {
    return goog.dom.isFocusableTabIndex(keyTarget)
  }
  return false
};
goog.ui.ControlRenderer.prototype.setFocusable = function(control, focusable) {
  var keyTarget;
  if(control.isSupportedState(goog.ui.Component.State.FOCUSED) && (keyTarget = control.getKeyEventTarget())) {
    if(!focusable && control.isFocused()) {
      try {
        keyTarget.blur()
      }catch(e) {
      }
      if(control.isFocused()) {
        control.handleBlur(null)
      }
    }
    if(goog.dom.isFocusableTabIndex(keyTarget) != focusable) {
      goog.dom.setFocusableTabIndex(keyTarget, focusable)
    }
  }
};
goog.ui.ControlRenderer.prototype.setVisible = function(element, visible) {
  goog.style.showElement(element, visible);
  if(element) {
    goog.a11y.aria.setState(element, goog.a11y.aria.State.HIDDEN, !visible)
  }
};
goog.ui.ControlRenderer.prototype.setState = function(control, state, enable) {
  var element = control.getElement();
  if(element) {
    var className = this.getClassForState(state);
    if(className) {
      this.enableClassName(control, className, enable)
    }
    this.updateAriaState(element, state, enable)
  }
};
goog.ui.ControlRenderer.prototype.updateAriaState = function(element, state, enable) {
  if(!goog.ui.ControlRenderer.ARIA_STATE_MAP_) {
    goog.ui.ControlRenderer.ARIA_STATE_MAP_ = goog.object.create(goog.ui.Component.State.DISABLED, goog.a11y.aria.State.DISABLED, goog.ui.Component.State.SELECTED, goog.a11y.aria.State.SELECTED, goog.ui.Component.State.CHECKED, goog.a11y.aria.State.CHECKED, goog.ui.Component.State.OPENED, goog.a11y.aria.State.EXPANDED)
  }
  var ariaState = goog.ui.ControlRenderer.ARIA_STATE_MAP_[state];
  if(ariaState) {
    goog.asserts.assert(element, "The element passed as a first parameter cannot be null.");
    goog.a11y.aria.setState(element, ariaState, enable)
  }
};
goog.ui.ControlRenderer.prototype.setContent = function(element, content) {
  var contentElem = this.getContentElement(element);
  if(contentElem) {
    goog.dom.removeChildren(contentElem);
    if(content) {
      if(goog.isString(content)) {
        goog.dom.setTextContent(contentElem, content)
      }else {
        var childHandler = function(child) {
          if(child) {
            var doc = goog.dom.getOwnerDocument(contentElem);
            contentElem.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
          }
        };
        if(goog.isArray(content)) {
          goog.array.forEach(content, childHandler)
        }else {
          if(goog.isArrayLike(content) && !("nodeType" in content)) {
            goog.array.forEach(goog.array.clone((content)), childHandler)
          }else {
            childHandler(content)
          }
        }
      }
    }
  }
};
goog.ui.ControlRenderer.prototype.getKeyEventTarget = function(control) {
  return control.getElement()
};
goog.ui.ControlRenderer.prototype.getCssClass = function() {
  return goog.ui.ControlRenderer.CSS_CLASS
};
goog.ui.ControlRenderer.prototype.getIe6ClassCombinations = function() {
  return[]
};
goog.ui.ControlRenderer.prototype.getStructuralCssClass = function() {
  return this.getCssClass()
};
goog.ui.ControlRenderer.prototype.getClassNames = function(control) {
  var cssClass = this.getCssClass();
  var classNames = [cssClass];
  var structuralCssClass = this.getStructuralCssClass();
  if(structuralCssClass != cssClass) {
    classNames.push(structuralCssClass)
  }
  var classNamesForState = this.getClassNamesForState(control.getState());
  classNames.push.apply(classNames, classNamesForState);
  var extraClassNames = control.getExtraClassNames();
  if(extraClassNames) {
    classNames.push.apply(classNames, extraClassNames)
  }
  if(goog.userAgent.IE && !goog.userAgent.isVersion("7")) {
    classNames.push.apply(classNames, this.getAppliedCombinedClassNames_(classNames))
  }
  return classNames
};
goog.ui.ControlRenderer.prototype.getAppliedCombinedClassNames_ = function(classes, opt_includedClass) {
  var toAdd = [];
  if(opt_includedClass) {
    classes = classes.concat([opt_includedClass])
  }
  goog.array.forEach(this.getIe6ClassCombinations(), function(combo) {
    if(goog.array.every(combo, goog.partial(goog.array.contains, classes)) && (!opt_includedClass || goog.array.contains(combo, opt_includedClass))) {
      toAdd.push(combo.join("_"))
    }
  });
  return toAdd
};
goog.ui.ControlRenderer.prototype.getClassNamesForState = function(state) {
  var classNames = [];
  while(state) {
    var mask = state & -state;
    classNames.push(this.getClassForState((mask)));
    state &= ~mask
  }
  return classNames
};
goog.ui.ControlRenderer.prototype.getClassForState = function(state) {
  if(!this.classByState_) {
    this.createClassByStateMap_()
  }
  return this.classByState_[state]
};
goog.ui.ControlRenderer.prototype.getStateFromClass = function(className) {
  if(!this.stateByClass_) {
    this.createStateByClassMap_()
  }
  var state = parseInt(this.stateByClass_[className], 10);
  return(isNaN(state) ? 0 : state)
};
goog.ui.ControlRenderer.prototype.createClassByStateMap_ = function() {
  var baseClass = this.getStructuralCssClass();
  this.classByState_ = goog.object.create(goog.ui.Component.State.DISABLED, goog.getCssName(baseClass, "disabled"), goog.ui.Component.State.HOVER, goog.getCssName(baseClass, "hover"), goog.ui.Component.State.ACTIVE, goog.getCssName(baseClass, "active"), goog.ui.Component.State.SELECTED, goog.getCssName(baseClass, "selected"), goog.ui.Component.State.CHECKED, goog.getCssName(baseClass, "checked"), goog.ui.Component.State.FOCUSED, goog.getCssName(baseClass, "focused"), goog.ui.Component.State.OPENED, 
  goog.getCssName(baseClass, "open"))
};
goog.ui.ControlRenderer.prototype.createStateByClassMap_ = function() {
  if(!this.classByState_) {
    this.createClassByStateMap_()
  }
  this.stateByClass_ = goog.object.transpose(this.classByState_)
};
goog.provide("goog.ui.PaletteRenderer");
goog.require("goog.a11y.aria");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.dom.NodeType");
goog.require("goog.dom.classes");
goog.require("goog.style");
goog.require("goog.ui.ControlRenderer");
goog.require("goog.userAgent");
goog.ui.PaletteRenderer = function() {
  goog.ui.ControlRenderer.call(this)
};
goog.inherits(goog.ui.PaletteRenderer, goog.ui.ControlRenderer);
goog.addSingletonGetter(goog.ui.PaletteRenderer);
goog.ui.PaletteRenderer.cellId_ = 0;
goog.ui.PaletteRenderer.CSS_CLASS = goog.getCssName("goog-palette");
goog.ui.PaletteRenderer.prototype.createDom = function(palette) {
  var classNames = this.getClassNames(palette);
  return palette.getDomHelper().createDom("div", classNames ? classNames.join(" ") : null, this.createGrid((palette.getContent()), palette.getSize(), palette.getDomHelper()))
};
goog.ui.PaletteRenderer.prototype.createGrid = function(items, size, dom) {
  var rows = [];
  for(var row = 0, index = 0;row < size.height;row++) {
    var cells = [];
    for(var column = 0;column < size.width;column++) {
      var item = items && items[index++];
      cells.push(this.createCell(item, dom))
    }
    rows.push(this.createRow(cells, dom))
  }
  return this.createTable(rows, dom)
};
goog.ui.PaletteRenderer.prototype.createTable = function(rows, dom) {
  var table = dom.createDom("table", goog.getCssName(this.getCssClass(), "table"), dom.createDom("tbody", goog.getCssName(this.getCssClass(), "body"), rows));
  table.cellSpacing = 0;
  table.cellPadding = 0;
  goog.a11y.aria.setRole(table, "grid");
  return table
};
goog.ui.PaletteRenderer.prototype.createRow = function(cells, dom) {
  return dom.createDom("tr", goog.getCssName(this.getCssClass(), "row"), cells)
};
goog.ui.PaletteRenderer.prototype.createCell = function(node, dom) {
  var cell = dom.createDom("td", {"class":goog.getCssName(this.getCssClass(), "cell"), "id":goog.getCssName(this.getCssClass(), "cell-") + goog.ui.PaletteRenderer.cellId_++}, node);
  goog.a11y.aria.setRole(cell, "gridcell");
  return cell
};
goog.ui.PaletteRenderer.prototype.canDecorate = function(element) {
  return false
};
goog.ui.PaletteRenderer.prototype.decorate = function(palette, element) {
  return null
};
goog.ui.PaletteRenderer.prototype.setContent = function(element, content) {
  var items = (content);
  if(element) {
    var tbody = goog.dom.getElementsByTagNameAndClass("tbody", goog.getCssName(this.getCssClass(), "body"), element)[0];
    if(tbody) {
      var index = 0;
      goog.array.forEach(tbody.rows, function(row) {
        goog.array.forEach(row.cells, function(cell) {
          goog.dom.removeChildren(cell);
          if(items) {
            var item = items[index++];
            if(item) {
              goog.dom.appendChild(cell, item)
            }
          }
        })
      });
      if(index < items.length) {
        var cells = [];
        var dom = goog.dom.getDomHelper(element);
        var width = tbody.rows[0].cells.length;
        while(index < items.length) {
          var item = items[index++];
          cells.push(this.createCell(item, dom));
          if(cells.length == width) {
            var row = this.createRow(cells, dom);
            goog.dom.appendChild(tbody, row);
            cells.length = 0
          }
        }
        if(cells.length > 0) {
          while(cells.length < width) {
            cells.push(this.createCell("", dom))
          }
          var row = this.createRow(cells, dom);
          goog.dom.appendChild(tbody, row)
        }
      }
    }
    goog.style.setUnselectable(element, true, goog.userAgent.GECKO)
  }
};
goog.ui.PaletteRenderer.prototype.getContainingItem = function(palette, node) {
  var root = palette.getElement();
  while(node && (node.nodeType == goog.dom.NodeType.ELEMENT && node != root)) {
    if(node.tagName == "TD" && goog.dom.classes.has((node), goog.getCssName(this.getCssClass(), "cell"))) {
      return node.firstChild
    }
    node = node.parentNode
  }
  return null
};
goog.ui.PaletteRenderer.prototype.highlightCell = function(palette, node, highlight) {
  if(node) {
    var cell = (node.parentNode);
    goog.dom.classes.enable(cell, goog.getCssName(this.getCssClass(), "cell-hover"), highlight);
    var table = (palette.getElement().firstChild);
    goog.a11y.aria.setState(table, "activedescendent", cell.id)
  }
};
goog.ui.PaletteRenderer.prototype.selectCell = function(palette, node, select) {
  if(node) {
    var cell = (node.parentNode);
    goog.dom.classes.enable(cell, goog.getCssName(this.getCssClass(), "cell-selected"), select)
  }
};
goog.ui.PaletteRenderer.prototype.getCssClass = function() {
  return goog.ui.PaletteRenderer.CSS_CLASS
};
goog.provide("goog.ui.registry");
goog.require("goog.dom.classes");
goog.ui.registry.getDefaultRenderer = function(componentCtor) {
  var key;
  var rendererCtor;
  while(componentCtor) {
    key = goog.getUid(componentCtor);
    if(rendererCtor = goog.ui.registry.defaultRenderers_[key]) {
      break
    }
    componentCtor = componentCtor.superClass_ ? componentCtor.superClass_.constructor : null
  }
  if(rendererCtor) {
    return goog.isFunction(rendererCtor.getInstance) ? rendererCtor.getInstance() : new rendererCtor
  }
  return null
};
goog.ui.registry.setDefaultRenderer = function(componentCtor, rendererCtor) {
  if(!goog.isFunction(componentCtor)) {
    throw Error("Invalid component class " + componentCtor);
  }
  if(!goog.isFunction(rendererCtor)) {
    throw Error("Invalid renderer class " + rendererCtor);
  }
  var key = goog.getUid(componentCtor);
  goog.ui.registry.defaultRenderers_[key] = rendererCtor
};
goog.ui.registry.getDecoratorByClassName = function(className) {
  return className in goog.ui.registry.decoratorFunctions_ ? goog.ui.registry.decoratorFunctions_[className]() : null
};
goog.ui.registry.setDecoratorByClassName = function(className, decoratorFn) {
  if(!className) {
    throw Error("Invalid class name " + className);
  }
  if(!goog.isFunction(decoratorFn)) {
    throw Error("Invalid decorator function " + decoratorFn);
  }
  goog.ui.registry.decoratorFunctions_[className] = decoratorFn
};
goog.ui.registry.getDecorator = function(element) {
  var decorator;
  var classNames = goog.dom.classes.get(element);
  for(var i = 0, len = classNames.length;i < len;i++) {
    if(decorator = goog.ui.registry.getDecoratorByClassName(classNames[i])) {
      return decorator
    }
  }
  return null
};
goog.ui.registry.reset = function() {
  goog.ui.registry.defaultRenderers_ = {};
  goog.ui.registry.decoratorFunctions_ = {}
};
goog.ui.registry.defaultRenderers_ = {};
goog.ui.registry.decoratorFunctions_ = {};
goog.provide("goog.ui.decorate");
goog.require("goog.ui.registry");
goog.ui.decorate = function(element) {
  var decorator = goog.ui.registry.getDecorator(element);
  if(decorator) {
    decorator.decorate(element)
  }
  return decorator
};
goog.provide("goog.ui.ControlContent");
goog.ui.ControlContent;
goog.provide("goog.ui.Control");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.events.KeyCodes");
goog.require("goog.events.KeyHandler");
goog.require("goog.events.KeyHandler.EventType");
goog.require("goog.string");
goog.require("goog.ui.Component");
goog.require("goog.ui.Component.Error");
goog.require("goog.ui.Component.EventType");
goog.require("goog.ui.Component.State");
goog.require("goog.ui.ControlContent");
goog.require("goog.ui.ControlRenderer");
goog.require("goog.ui.decorate");
goog.require("goog.ui.registry");
goog.require("goog.userAgent");
goog.ui.Control = function(content, opt_renderer, opt_domHelper) {
  goog.ui.Component.call(this, opt_domHelper);
  this.renderer_ = opt_renderer || goog.ui.registry.getDefaultRenderer(this.constructor);
  this.setContentInternal(content)
};
goog.inherits(goog.ui.Control, goog.ui.Component);
goog.ui.Control.registerDecorator = goog.ui.registry.setDecoratorByClassName;
goog.ui.Control.getDecorator = (goog.ui.registry.getDecorator);
goog.ui.Control.decorate = (goog.ui.decorate);
goog.ui.Control.prototype.renderer_;
goog.ui.Control.prototype.content_ = null;
goog.ui.Control.prototype.state_ = 0;
goog.ui.Control.prototype.supportedStates_ = goog.ui.Component.State.DISABLED | goog.ui.Component.State.HOVER | goog.ui.Component.State.ACTIVE | goog.ui.Component.State.FOCUSED;
goog.ui.Control.prototype.autoStates_ = goog.ui.Component.State.ALL;
goog.ui.Control.prototype.statesWithTransitionEvents_ = 0;
goog.ui.Control.prototype.visible_ = true;
goog.ui.Control.prototype.keyHandler_;
goog.ui.Control.prototype.extraClassNames_ = null;
goog.ui.Control.prototype.handleMouseEvents_ = true;
goog.ui.Control.prototype.allowTextSelection_ = false;
goog.ui.Control.prototype.preferredAriaRole_ = null;
goog.ui.Control.prototype.isHandleMouseEvents = function() {
  return this.handleMouseEvents_
};
goog.ui.Control.prototype.setHandleMouseEvents = function(enable) {
  if(this.isInDocument() && enable != this.handleMouseEvents_) {
    this.enableMouseEventHandling_(enable)
  }
  this.handleMouseEvents_ = enable
};
goog.ui.Control.prototype.getKeyEventTarget = function() {
  return this.renderer_.getKeyEventTarget(this)
};
goog.ui.Control.prototype.getKeyHandler = function() {
  return this.keyHandler_ || (this.keyHandler_ = new goog.events.KeyHandler)
};
goog.ui.Control.prototype.getRenderer = function() {
  return this.renderer_
};
goog.ui.Control.prototype.setRenderer = function(renderer) {
  if(this.isInDocument()) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  if(this.getElement()) {
    this.setElementInternal(null)
  }
  this.renderer_ = renderer
};
goog.ui.Control.prototype.getExtraClassNames = function() {
  return this.extraClassNames_
};
goog.ui.Control.prototype.addClassName = function(className) {
  if(className) {
    if(this.extraClassNames_) {
      if(!goog.array.contains(this.extraClassNames_, className)) {
        this.extraClassNames_.push(className)
      }
    }else {
      this.extraClassNames_ = [className]
    }
    this.renderer_.enableExtraClassName(this, className, true)
  }
};
goog.ui.Control.prototype.removeClassName = function(className) {
  if(className && this.extraClassNames_) {
    goog.array.remove(this.extraClassNames_, className);
    if(this.extraClassNames_.length == 0) {
      this.extraClassNames_ = null
    }
    this.renderer_.enableExtraClassName(this, className, false)
  }
};
goog.ui.Control.prototype.enableClassName = function(className, enable) {
  if(enable) {
    this.addClassName(className)
  }else {
    this.removeClassName(className)
  }
};
goog.ui.Control.prototype.createDom = function() {
  var element = this.renderer_.createDom(this);
  this.setElementInternal(element);
  this.renderer_.setAriaRole(element, this.getPreferredAriaRole());
  if(!this.isAllowTextSelection()) {
    this.renderer_.setAllowTextSelection(element, false)
  }
  if(!this.isVisible()) {
    this.renderer_.setVisible(element, false)
  }
};
goog.ui.Control.prototype.getPreferredAriaRole = function() {
  return this.preferredAriaRole_
};
goog.ui.Control.prototype.setPreferredAriaRole = function(role) {
  this.preferredAriaRole_ = role
};
goog.ui.Control.prototype.getContentElement = function() {
  return this.renderer_.getContentElement(this.getElement())
};
goog.ui.Control.prototype.canDecorate = function(element) {
  return this.renderer_.canDecorate(element)
};
goog.ui.Control.prototype.decorateInternal = function(element) {
  element = this.renderer_.decorate(this, element);
  this.setElementInternal(element);
  this.renderer_.setAriaRole(element, this.getPreferredAriaRole());
  if(!this.isAllowTextSelection()) {
    this.renderer_.setAllowTextSelection(element, false)
  }
  this.visible_ = element.style.display != "none"
};
goog.ui.Control.prototype.enterDocument = function() {
  goog.ui.Control.superClass_.enterDocument.call(this);
  this.renderer_.initializeDom(this);
  if(this.supportedStates_ & ~goog.ui.Component.State.DISABLED) {
    if(this.isHandleMouseEvents()) {
      this.enableMouseEventHandling_(true)
    }
    if(this.isSupportedState(goog.ui.Component.State.FOCUSED)) {
      var keyTarget = this.getKeyEventTarget();
      if(keyTarget) {
        var keyHandler = this.getKeyHandler();
        keyHandler.attach(keyTarget);
        this.getHandler().listen(keyHandler, goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent).listen(keyTarget, goog.events.EventType.FOCUS, this.handleFocus).listen(keyTarget, goog.events.EventType.BLUR, this.handleBlur)
      }
    }
  }
};
goog.ui.Control.prototype.enableMouseEventHandling_ = function(enable) {
  var handler = this.getHandler();
  var element = this.getElement();
  if(enable) {
    handler.listen(element, goog.events.EventType.MOUSEOVER, this.handleMouseOver).listen(element, goog.events.EventType.MOUSEDOWN, this.handleMouseDown).listen(element, goog.events.EventType.MOUSEUP, this.handleMouseUp).listen(element, goog.events.EventType.MOUSEOUT, this.handleMouseOut);
    if(this.handleContextMenu != goog.nullFunction) {
      handler.listen(element, goog.events.EventType.CONTEXTMENU, this.handleContextMenu)
    }
    if(goog.userAgent.IE) {
      handler.listen(element, goog.events.EventType.DBLCLICK, this.handleDblClick)
    }
  }else {
    handler.unlisten(element, goog.events.EventType.MOUSEOVER, this.handleMouseOver).unlisten(element, goog.events.EventType.MOUSEDOWN, this.handleMouseDown).unlisten(element, goog.events.EventType.MOUSEUP, this.handleMouseUp).unlisten(element, goog.events.EventType.MOUSEOUT, this.handleMouseOut);
    if(this.handleContextMenu != goog.nullFunction) {
      handler.unlisten(element, goog.events.EventType.CONTEXTMENU, this.handleContextMenu)
    }
    if(goog.userAgent.IE) {
      handler.unlisten(element, goog.events.EventType.DBLCLICK, this.handleDblClick)
    }
  }
};
goog.ui.Control.prototype.exitDocument = function() {
  goog.ui.Control.superClass_.exitDocument.call(this);
  if(this.keyHandler_) {
    this.keyHandler_.detach()
  }
  if(this.isVisible() && this.isEnabled()) {
    this.renderer_.setFocusable(this, false)
  }
};
goog.ui.Control.prototype.disposeInternal = function() {
  goog.ui.Control.superClass_.disposeInternal.call(this);
  if(this.keyHandler_) {
    this.keyHandler_.dispose();
    delete this.keyHandler_
  }
  delete this.renderer_;
  this.content_ = null;
  this.extraClassNames_ = null
};
goog.ui.Control.prototype.getContent = function() {
  return this.content_
};
goog.ui.Control.prototype.setContent = function(content) {
  this.renderer_.setContent(this.getElement(), content);
  this.setContentInternal(content)
};
goog.ui.Control.prototype.setContentInternal = function(content) {
  this.content_ = content
};
goog.ui.Control.prototype.getCaption = function() {
  var content = this.getContent();
  if(!content) {
    return""
  }
  var caption = goog.isString(content) ? content : goog.isArray(content) ? goog.array.map(content, goog.dom.getRawTextContent).join("") : goog.dom.getTextContent((content));
  return goog.string.collapseBreakingSpaces(caption)
};
goog.ui.Control.prototype.setCaption = function(caption) {
  this.setContent(caption)
};
goog.ui.Control.prototype.setRightToLeft = function(rightToLeft) {
  goog.ui.Control.superClass_.setRightToLeft.call(this, rightToLeft);
  var element = this.getElement();
  if(element) {
    this.renderer_.setRightToLeft(element, rightToLeft)
  }
};
goog.ui.Control.prototype.isAllowTextSelection = function() {
  return this.allowTextSelection_
};
goog.ui.Control.prototype.setAllowTextSelection = function(allow) {
  this.allowTextSelection_ = allow;
  var element = this.getElement();
  if(element) {
    this.renderer_.setAllowTextSelection(element, allow)
  }
};
goog.ui.Control.prototype.isVisible = function() {
  return this.visible_
};
goog.ui.Control.prototype.setVisible = function(visible, opt_force) {
  if(opt_force || this.visible_ != visible && this.dispatchEvent(visible ? goog.ui.Component.EventType.SHOW : goog.ui.Component.EventType.HIDE)) {
    var element = this.getElement();
    if(element) {
      this.renderer_.setVisible(element, visible)
    }
    if(this.isEnabled()) {
      this.renderer_.setFocusable(this, visible)
    }
    this.visible_ = visible;
    return true
  }
  return false
};
goog.ui.Control.prototype.isEnabled = function() {
  return!this.hasState(goog.ui.Component.State.DISABLED)
};
goog.ui.Control.prototype.isParentDisabled_ = function() {
  var parent = this.getParent();
  return!!parent && (typeof parent.isEnabled == "function" && !parent.isEnabled())
};
goog.ui.Control.prototype.setEnabled = function(enable) {
  if(!this.isParentDisabled_() && this.isTransitionAllowed(goog.ui.Component.State.DISABLED, !enable)) {
    if(!enable) {
      this.setActive(false);
      this.setHighlighted(false)
    }
    if(this.isVisible()) {
      this.renderer_.setFocusable(this, enable)
    }
    this.setState(goog.ui.Component.State.DISABLED, !enable)
  }
};
goog.ui.Control.prototype.isHighlighted = function() {
  return this.hasState(goog.ui.Component.State.HOVER)
};
goog.ui.Control.prototype.setHighlighted = function(highlight) {
  if(this.isTransitionAllowed(goog.ui.Component.State.HOVER, highlight)) {
    this.setState(goog.ui.Component.State.HOVER, highlight)
  }
};
goog.ui.Control.prototype.isActive = function() {
  return this.hasState(goog.ui.Component.State.ACTIVE)
};
goog.ui.Control.prototype.setActive = function(active) {
  if(this.isTransitionAllowed(goog.ui.Component.State.ACTIVE, active)) {
    this.setState(goog.ui.Component.State.ACTIVE, active)
  }
};
goog.ui.Control.prototype.isSelected = function() {
  return this.hasState(goog.ui.Component.State.SELECTED)
};
goog.ui.Control.prototype.setSelected = function(select) {
  if(this.isTransitionAllowed(goog.ui.Component.State.SELECTED, select)) {
    this.setState(goog.ui.Component.State.SELECTED, select)
  }
};
goog.ui.Control.prototype.isChecked = function() {
  return this.hasState(goog.ui.Component.State.CHECKED)
};
goog.ui.Control.prototype.setChecked = function(check) {
  if(this.isTransitionAllowed(goog.ui.Component.State.CHECKED, check)) {
    this.setState(goog.ui.Component.State.CHECKED, check)
  }
};
goog.ui.Control.prototype.isFocused = function() {
  return this.hasState(goog.ui.Component.State.FOCUSED)
};
goog.ui.Control.prototype.setFocused = function(focused) {
  if(this.isTransitionAllowed(goog.ui.Component.State.FOCUSED, focused)) {
    this.setState(goog.ui.Component.State.FOCUSED, focused)
  }
};
goog.ui.Control.prototype.isOpen = function() {
  return this.hasState(goog.ui.Component.State.OPENED)
};
goog.ui.Control.prototype.setOpen = function(open) {
  if(this.isTransitionAllowed(goog.ui.Component.State.OPENED, open)) {
    this.setState(goog.ui.Component.State.OPENED, open)
  }
};
goog.ui.Control.prototype.getState = function() {
  return this.state_
};
goog.ui.Control.prototype.hasState = function(state) {
  return!!(this.state_ & state)
};
goog.ui.Control.prototype.setState = function(state, enable) {
  if(this.isSupportedState(state) && enable != this.hasState(state)) {
    this.renderer_.setState(this, state, enable);
    this.state_ = enable ? this.state_ | state : this.state_ & ~state
  }
};
goog.ui.Control.prototype.setStateInternal = function(state) {
  this.state_ = state
};
goog.ui.Control.prototype.isSupportedState = function(state) {
  return!!(this.supportedStates_ & state)
};
goog.ui.Control.prototype.setSupportedState = function(state, support) {
  if(this.isInDocument() && (this.hasState(state) && !support)) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  if(!support && this.hasState(state)) {
    this.setState(state, false)
  }
  this.supportedStates_ = support ? this.supportedStates_ | state : this.supportedStates_ & ~state
};
goog.ui.Control.prototype.isAutoState = function(state) {
  return!!(this.autoStates_ & state) && this.isSupportedState(state)
};
goog.ui.Control.prototype.setAutoStates = function(states, enable) {
  this.autoStates_ = enable ? this.autoStates_ | states : this.autoStates_ & ~states
};
goog.ui.Control.prototype.isDispatchTransitionEvents = function(state) {
  return!!(this.statesWithTransitionEvents_ & state) && this.isSupportedState(state)
};
goog.ui.Control.prototype.setDispatchTransitionEvents = function(states, enable) {
  this.statesWithTransitionEvents_ = enable ? this.statesWithTransitionEvents_ | states : this.statesWithTransitionEvents_ & ~states
};
goog.ui.Control.prototype.isTransitionAllowed = function(state, enable) {
  return this.isSupportedState(state) && (this.hasState(state) != enable && ((!(this.statesWithTransitionEvents_ & state) || this.dispatchEvent(goog.ui.Component.getStateTransitionEvent(state, enable))) && !this.isDisposed()))
};
goog.ui.Control.prototype.handleMouseOver = function(e) {
  if(!goog.ui.Control.isMouseEventWithinElement_(e, this.getElement()) && (this.dispatchEvent(goog.ui.Component.EventType.ENTER) && (this.isEnabled() && this.isAutoState(goog.ui.Component.State.HOVER)))) {
    this.setHighlighted(true)
  }
};
goog.ui.Control.prototype.handleMouseOut = function(e) {
  if(!goog.ui.Control.isMouseEventWithinElement_(e, this.getElement()) && this.dispatchEvent(goog.ui.Component.EventType.LEAVE)) {
    if(this.isAutoState(goog.ui.Component.State.ACTIVE)) {
      this.setActive(false)
    }
    if(this.isAutoState(goog.ui.Component.State.HOVER)) {
      this.setHighlighted(false)
    }
  }
};
goog.ui.Control.prototype.handleContextMenu = goog.nullFunction;
goog.ui.Control.isMouseEventWithinElement_ = function(e, elem) {
  return!!e.relatedTarget && goog.dom.contains(elem, e.relatedTarget)
};
goog.ui.Control.prototype.handleMouseDown = function(e) {
  if(this.isEnabled()) {
    if(this.isAutoState(goog.ui.Component.State.HOVER)) {
      this.setHighlighted(true)
    }
    if(e.isMouseActionButton()) {
      if(this.isAutoState(goog.ui.Component.State.ACTIVE)) {
        this.setActive(true)
      }
      if(this.renderer_.isFocusable(this)) {
        this.getKeyEventTarget().focus()
      }
    }
  }
  if(!this.isAllowTextSelection() && e.isMouseActionButton()) {
    e.preventDefault()
  }
};
goog.ui.Control.prototype.handleMouseUp = function(e) {
  if(this.isEnabled()) {
    if(this.isAutoState(goog.ui.Component.State.HOVER)) {
      this.setHighlighted(true)
    }
    if(this.isActive() && (this.performActionInternal(e) && this.isAutoState(goog.ui.Component.State.ACTIVE))) {
      this.setActive(false)
    }
  }
};
goog.ui.Control.prototype.handleDblClick = function(e) {
  if(this.isEnabled()) {
    this.performActionInternal(e)
  }
};
goog.ui.Control.prototype.performActionInternal = function(e) {
  if(this.isAutoState(goog.ui.Component.State.CHECKED)) {
    this.setChecked(!this.isChecked())
  }
  if(this.isAutoState(goog.ui.Component.State.SELECTED)) {
    this.setSelected(true)
  }
  if(this.isAutoState(goog.ui.Component.State.OPENED)) {
    this.setOpen(!this.isOpen())
  }
  var actionEvent = new goog.events.Event(goog.ui.Component.EventType.ACTION, this);
  if(e) {
    actionEvent.altKey = e.altKey;
    actionEvent.ctrlKey = e.ctrlKey;
    actionEvent.metaKey = e.metaKey;
    actionEvent.shiftKey = e.shiftKey;
    actionEvent.platformModifierKey = e.platformModifierKey
  }
  return this.dispatchEvent(actionEvent)
};
goog.ui.Control.prototype.handleFocus = function(e) {
  if(this.isAutoState(goog.ui.Component.State.FOCUSED)) {
    this.setFocused(true)
  }
};
goog.ui.Control.prototype.handleBlur = function(e) {
  if(this.isAutoState(goog.ui.Component.State.ACTIVE)) {
    this.setActive(false)
  }
  if(this.isAutoState(goog.ui.Component.State.FOCUSED)) {
    this.setFocused(false)
  }
};
goog.ui.Control.prototype.handleKeyEvent = function(e) {
  if(this.isVisible() && (this.isEnabled() && this.handleKeyEventInternal(e))) {
    e.preventDefault();
    e.stopPropagation();
    return true
  }
  return false
};
goog.ui.Control.prototype.handleKeyEventInternal = function(e) {
  return e.keyCode == goog.events.KeyCodes.ENTER && this.performActionInternal(e)
};
goog.ui.registry.setDefaultRenderer(goog.ui.Control, goog.ui.ControlRenderer);
goog.ui.registry.setDecoratorByClassName(goog.ui.ControlRenderer.CSS_CLASS, function() {
  return new goog.ui.Control(null)
});
goog.provide("goog.ui.Palette");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.events.EventType");
goog.require("goog.events.KeyCodes");
goog.require("goog.math.Size");
goog.require("goog.ui.Component");
goog.require("goog.ui.Control");
goog.require("goog.ui.PaletteRenderer");
goog.require("goog.ui.SelectionModel");
goog.ui.Palette = function(items, opt_renderer, opt_domHelper) {
  goog.base(this, items, opt_renderer || goog.ui.PaletteRenderer.getInstance(), opt_domHelper);
  this.setAutoStates(goog.ui.Component.State.CHECKED | goog.ui.Component.State.SELECTED | goog.ui.Component.State.OPENED, false)
};
goog.inherits(goog.ui.Palette, goog.ui.Control);
goog.ui.Palette.EventType = {AFTER_HIGHLIGHT:goog.events.getUniqueId("afterhighlight")};
goog.ui.Palette.prototype.size_ = null;
goog.ui.Palette.prototype.highlightedIndex_ = -1;
goog.ui.Palette.prototype.selectionModel_ = null;
goog.ui.Palette.prototype.disposeInternal = function() {
  goog.ui.Palette.superClass_.disposeInternal.call(this);
  if(this.selectionModel_) {
    this.selectionModel_.dispose();
    this.selectionModel_ = null
  }
  this.size_ = null
};
goog.ui.Palette.prototype.setContentInternal = function(content) {
  var items = (content);
  goog.ui.Palette.superClass_.setContentInternal.call(this, items);
  this.adjustSize_();
  if(this.selectionModel_) {
    this.selectionModel_.clear();
    this.selectionModel_.addItems(items)
  }else {
    this.selectionModel_ = new goog.ui.SelectionModel(items);
    this.selectionModel_.setSelectionHandler(goog.bind(this.selectItem_, this));
    this.getHandler().listen(this.selectionModel_, goog.events.EventType.SELECT, this.handleSelectionChange)
  }
  this.highlightedIndex_ = -1
};
goog.ui.Palette.prototype.getCaption = function() {
  return""
};
goog.ui.Palette.prototype.setCaption = function(caption) {
};
goog.ui.Palette.prototype.handleMouseOver = function(e) {
  goog.ui.Palette.superClass_.handleMouseOver.call(this, e);
  var item = this.getRenderer().getContainingItem(this, e.target);
  if(item && (e.relatedTarget && goog.dom.contains(item, e.relatedTarget))) {
    return
  }
  if(item != this.getHighlightedItem()) {
    this.setHighlightedItem(item)
  }
};
goog.ui.Palette.prototype.handleMouseOut = function(e) {
  goog.ui.Palette.superClass_.handleMouseOut.call(this, e);
  var item = this.getRenderer().getContainingItem(this, e.target);
  if(item && (e.relatedTarget && goog.dom.contains(item, e.relatedTarget))) {
    return
  }
  if(item == this.getHighlightedItem()) {
    this.getRenderer().highlightCell(this, item, false)
  }
};
goog.ui.Palette.prototype.handleMouseDown = function(e) {
  goog.ui.Palette.superClass_.handleMouseDown.call(this, e);
  if(this.isActive()) {
    var item = this.getRenderer().getContainingItem(this, e.target);
    if(item != this.getHighlightedItem()) {
      this.setHighlightedItem(item)
    }
  }
};
goog.ui.Palette.prototype.performActionInternal = function(e) {
  var item = this.getHighlightedItem();
  if(item) {
    this.setSelectedItem(item);
    return goog.base(this, "performActionInternal", e)
  }
  return false
};
goog.ui.Palette.prototype.handleKeyEvent = function(e) {
  var items = this.getContent();
  var numItems = items ? items.length : 0;
  var numColumns = this.size_.width;
  if(numItems == 0 || !this.isEnabled()) {
    return false
  }
  if(e.keyCode == goog.events.KeyCodes.ENTER || e.keyCode == goog.events.KeyCodes.SPACE) {
    return this.performActionInternal(e)
  }
  if(e.keyCode == goog.events.KeyCodes.HOME) {
    this.setHighlightedIndex(0);
    return true
  }else {
    if(e.keyCode == goog.events.KeyCodes.END) {
      this.setHighlightedIndex(numItems - 1);
      return true
    }
  }
  var highlightedIndex = this.highlightedIndex_ < 0 ? this.getSelectedIndex() : this.highlightedIndex_;
  switch(e.keyCode) {
    case goog.events.KeyCodes.LEFT:
      if(highlightedIndex == -1) {
        highlightedIndex = numItems
      }
      if(highlightedIndex > 0) {
        this.setHighlightedIndex(highlightedIndex - 1);
        e.preventDefault();
        return true
      }
      break;
    case goog.events.KeyCodes.RIGHT:
      if(highlightedIndex < numItems - 1) {
        this.setHighlightedIndex(highlightedIndex + 1);
        e.preventDefault();
        return true
      }
      break;
    case goog.events.KeyCodes.UP:
      if(highlightedIndex == -1) {
        highlightedIndex = numItems + numColumns - 1
      }
      if(highlightedIndex >= numColumns) {
        this.setHighlightedIndex(highlightedIndex - numColumns);
        e.preventDefault();
        return true
      }
      break;
    case goog.events.KeyCodes.DOWN:
      if(highlightedIndex == -1) {
        highlightedIndex = -numColumns
      }
      if(highlightedIndex < numItems - numColumns) {
        this.setHighlightedIndex(highlightedIndex + numColumns);
        e.preventDefault();
        return true
      }
      break
  }
  return false
};
goog.ui.Palette.prototype.handleSelectionChange = function(e) {
};
goog.ui.Palette.prototype.getSize = function() {
  return this.size_
};
goog.ui.Palette.prototype.setSize = function(size, opt_rows) {
  if(this.getElement()) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  this.size_ = goog.isNumber(size) ? new goog.math.Size(size, (opt_rows)) : size;
  this.adjustSize_()
};
goog.ui.Palette.prototype.getHighlightedIndex = function() {
  return this.highlightedIndex_
};
goog.ui.Palette.prototype.getHighlightedItem = function() {
  var items = this.getContent();
  return items && items[this.highlightedIndex_]
};
goog.ui.Palette.prototype.setHighlightedIndex = function(index) {
  if(index != this.highlightedIndex_) {
    this.highlightIndex_(this.highlightedIndex_, false);
    this.highlightedIndex_ = index;
    this.highlightIndex_(index, true);
    this.dispatchEvent(goog.ui.Palette.EventType.AFTER_HIGHLIGHT)
  }
};
goog.ui.Palette.prototype.setHighlightedItem = function(item) {
  var items = (this.getContent());
  this.setHighlightedIndex(items ? goog.array.indexOf(items, item) : -1)
};
goog.ui.Palette.prototype.getSelectedIndex = function() {
  return this.selectionModel_ ? this.selectionModel_.getSelectedIndex() : -1
};
goog.ui.Palette.prototype.getSelectedItem = function() {
  return this.selectionModel_ ? (this.selectionModel_.getSelectedItem()) : null
};
goog.ui.Palette.prototype.setSelectedIndex = function(index) {
  if(this.selectionModel_) {
    this.selectionModel_.setSelectedIndex(index)
  }
};
goog.ui.Palette.prototype.setSelectedItem = function(item) {
  if(this.selectionModel_) {
    this.selectionModel_.setSelectedItem(item)
  }
};
goog.ui.Palette.prototype.highlightIndex_ = function(index, highlight) {
  if(this.getElement()) {
    var items = this.getContent();
    if(items && (index >= 0 && index < items.length)) {
      this.getRenderer().highlightCell(this, items[index], highlight)
    }
  }
};
goog.ui.Palette.prototype.selectItem_ = function(item, select) {
  if(this.getElement()) {
    this.getRenderer().selectCell(this, item, select)
  }
};
goog.ui.Palette.prototype.adjustSize_ = function() {
  var items = this.getContent();
  if(items) {
    if(this.size_ && this.size_.width) {
      var minRows = Math.ceil(items.length / this.size_.width);
      if(!goog.isNumber(this.size_.height) || this.size_.height < minRows) {
        this.size_.height = minRows
      }
    }else {
      var length = Math.ceil(Math.sqrt(items.length));
      this.size_ = new goog.math.Size(length, length)
    }
  }else {
    this.size_ = new goog.math.Size(0, 0)
  }
};
goog.provide("goog.ui.ColorPalette");
goog.require("goog.array");
goog.require("goog.color");
goog.require("goog.dom");
goog.require("goog.style");
goog.require("goog.ui.Palette");
goog.require("goog.ui.PaletteRenderer");
goog.ui.ColorPalette = function(opt_colors, opt_renderer, opt_domHelper) {
  this.colors_ = opt_colors || [];
  goog.ui.Palette.call(this, null, opt_renderer || goog.ui.PaletteRenderer.getInstance(), opt_domHelper);
  this.setColors(this.colors_)
};
goog.inherits(goog.ui.ColorPalette, goog.ui.Palette);
goog.ui.ColorPalette.prototype.normalizedColors_ = null;
goog.ui.ColorPalette.prototype.getColors = function() {
  return this.colors_
};
goog.ui.ColorPalette.prototype.setColors = function(colors) {
  this.colors_ = colors;
  this.normalizedColors_ = null;
  this.setContent(this.createColorNodes())
};
goog.ui.ColorPalette.prototype.getSelectedColor = function() {
  var selectedItem = (this.getSelectedItem());
  if(selectedItem) {
    var color = goog.style.getStyle(selectedItem, "background-color");
    return goog.ui.ColorPalette.parseColor_(color)
  }else {
    return null
  }
};
goog.ui.ColorPalette.prototype.setSelectedColor = function(color) {
  var hexColor = goog.ui.ColorPalette.parseColor_(color);
  if(!this.normalizedColors_) {
    this.normalizedColors_ = goog.array.map(this.colors_, function(color) {
      return goog.ui.ColorPalette.parseColor_(color)
    })
  }
  this.setSelectedIndex(hexColor ? goog.array.indexOf(this.normalizedColors_, hexColor) : -1)
};
goog.ui.ColorPalette.prototype.createColorNodes = function() {
  return goog.array.map(this.colors_, function(color) {
    var swatch = this.getDomHelper().createDom("div", {"class":goog.getCssName(this.getRenderer().getCssClass(), "colorswatch"), "style":"background-color:" + color});
    swatch.title = color.charAt(0) == "#" ? "RGB (" + goog.color.hexToRgb(color).join(", ") + ")" : color;
    return swatch
  }, this)
};
goog.ui.ColorPalette.parseColor_ = function(color) {
  if(color) {
    try {
      return goog.color.parse(color).hex
    }catch(ex) {
    }
  }
  return null
};
goog.provide("goog.ui.ColorPicker");
goog.provide("goog.ui.ColorPicker.EventType");
goog.require("goog.ui.ColorPalette");
goog.require("goog.ui.Component");
goog.require("goog.ui.Component.State");
goog.ui.ColorPicker = function(opt_domHelper, opt_colorPalette) {
  goog.ui.Component.call(this, opt_domHelper);
  this.colorPalette_ = opt_colorPalette || null;
  this.getHandler().listen(this, goog.ui.Component.EventType.ACTION, this.onColorPaletteAction_)
};
goog.inherits(goog.ui.ColorPicker, goog.ui.Component);
goog.ui.ColorPicker.DEFAULT_NUM_COLS = 5;
goog.ui.ColorPicker.EventType = {CHANGE:"change"};
goog.ui.ColorPicker.prototype.focusable_ = true;
goog.ui.ColorPicker.prototype.getColors = function() {
  return this.colorPalette_ ? this.colorPalette_.getColors() : null
};
goog.ui.ColorPicker.prototype.setColors = function(colors) {
  if(!this.colorPalette_) {
    this.createColorPalette_(colors)
  }else {
    this.colorPalette_.setColors(colors)
  }
};
goog.ui.ColorPicker.prototype.addColors = function(colors) {
  this.setColors(colors)
};
goog.ui.ColorPicker.prototype.setSize = function(size) {
  if(!this.colorPalette_) {
    this.createColorPalette_([])
  }
  this.colorPalette_.setSize(size)
};
goog.ui.ColorPicker.prototype.getSize = function() {
  return this.colorPalette_ ? this.colorPalette_.getSize() : null
};
goog.ui.ColorPicker.prototype.setColumnCount = function(n) {
  this.setSize(n)
};
goog.ui.ColorPicker.prototype.getSelectedIndex = function() {
  return this.colorPalette_ ? this.colorPalette_.getSelectedIndex() : -1
};
goog.ui.ColorPicker.prototype.setSelectedIndex = function(ind) {
  if(this.colorPalette_) {
    this.colorPalette_.setSelectedIndex(ind)
  }
};
goog.ui.ColorPicker.prototype.getSelectedColor = function() {
  return this.colorPalette_ ? this.colorPalette_.getSelectedColor() : null
};
goog.ui.ColorPicker.prototype.setSelectedColor = function(color) {
  if(this.colorPalette_) {
    this.colorPalette_.setSelectedColor(color)
  }
};
goog.ui.ColorPicker.prototype.isFocusable = function() {
  return this.focusable_
};
goog.ui.ColorPicker.prototype.setFocusable = function(focusable) {
  this.focusable_ = focusable;
  if(this.colorPalette_) {
    this.colorPalette_.setSupportedState(goog.ui.Component.State.FOCUSED, focusable)
  }
};
goog.ui.ColorPicker.prototype.canDecorate = function(element) {
  return false
};
goog.ui.ColorPicker.prototype.enterDocument = function() {
  goog.ui.ColorPicker.superClass_.enterDocument.call(this);
  if(this.colorPalette_) {
    this.colorPalette_.render(this.getElement())
  }
  this.getElement().unselectable = "on"
};
goog.ui.ColorPicker.prototype.disposeInternal = function() {
  goog.ui.ColorPicker.superClass_.disposeInternal.call(this);
  if(this.colorPalette_) {
    this.colorPalette_.dispose();
    this.colorPalette_ = null
  }
};
goog.ui.ColorPicker.prototype.focus = function() {
  if(this.colorPalette_) {
    this.colorPalette_.getElement().focus()
  }
};
goog.ui.ColorPicker.prototype.onColorPaletteAction_ = function(e) {
  e.stopPropagation();
  this.dispatchEvent(goog.ui.ColorPicker.EventType.CHANGE)
};
goog.ui.ColorPicker.prototype.createColorPalette_ = function(colors) {
  var cp = new goog.ui.ColorPalette(colors, null, this.getDomHelper());
  cp.setSize(goog.ui.ColorPicker.DEFAULT_NUM_COLS);
  cp.setSupportedState(goog.ui.Component.State.FOCUSED, this.focusable_);
  this.addChild(cp);
  this.colorPalette_ = cp;
  if(this.isInDocument()) {
    this.colorPalette_.render(this.getElement())
  }
};
goog.ui.ColorPicker.createSimpleColorGrid = function(opt_domHelper) {
  var cp = new goog.ui.ColorPicker(opt_domHelper);
  cp.setSize(7);
  cp.setColors(goog.ui.ColorPicker.SIMPLE_GRID_COLORS);
  return cp
};
goog.ui.ColorPicker.SIMPLE_GRID_COLORS = ["#ffffff", "#cccccc", "#c0c0c0", "#999999", "#666666", "#333333", "#000000", "#ffcccc", "#ff6666", "#ff0000", "#cc0000", "#990000", "#660000", "#330000", "#ffcc99", "#ff9966", "#ff9900", "#ff6600", "#cc6600", "#993300", "#663300", "#ffff99", "#ffff66", "#ffcc66", "#ffcc33", "#cc9933", "#996633", "#663333", "#ffffcc", "#ffff33", "#ffff00", "#ffcc00", "#999900", "#666600", "#333300", "#99ff99", "#66ff99", "#33ff33", "#33cc00", "#009900", "#006600", "#003300", 
"#99ffff", "#33ffff", "#66cccc", "#00cccc", "#339999", "#336666", "#003333", "#ccffff", "#66ffff", "#33ccff", "#3366ff", "#3333ff", "#000099", "#000066", "#ccccff", "#9999ff", "#6666cc", "#6633ff", "#6600cc", "#333399", "#330099", "#ffccff", "#ff99ff", "#cc66cc", "#cc33cc", "#993399", "#663366", "#330033"];
goog.provide("Blockly.utils");
Blockly.addClass_ = function(element, className) {
  var classes = element.getAttribute("class") || "";
  if((" " + classes + " ").indexOf(" " + className + " ") == -1) {
    if(classes) {
      classes += " "
    }
    element.setAttribute("class", classes + className)
  }
};
Blockly.removeClass_ = function(element, className) {
  var classes = element.getAttribute("class");
  if((" " + classes + " ").indexOf(" " + className + " ") != -1) {
    var classList = classes.split(/\s+/);
    for(var i = 0;i < classList.length;i++) {
      if(!classList[i] || classList[i] == className) {
        classList.splice(i, 1);
        i--
      }
    }
    if(classList.length) {
      element.setAttribute("class", classList.join(" "))
    }else {
      element.removeAttribute("class")
    }
  }
};
Blockly.bindEvent_ = function(element, name, thisObject, func) {
  var bindData = [];
  var wrapFunc;
  if(!element.addEventListener) {
    throw"Element is not a DOM node with addEventListener.";
  }
  wrapFunc = function(e) {
    func.apply(thisObject, arguments)
  };
  element.addEventListener(name, wrapFunc, false);
  bindData.push([element, name, wrapFunc]);
  if(name in Blockly.bindEvent_.TOUCH_MAP) {
    wrapFunc = function(e) {
      var targetStyle = e.target.style;
      if(targetStyle.touchAction) {
        targetStyle.touchAction = "none"
      }else {
        if(targetStyle.msTouchAction) {
          targetStyle.msTouchAction = "none"
        }
      }
      var touchPoints = e.changedTouches || [e];
      for(var i = 0;i < touchPoints.length;++i) {
        e.clientX = touchPoints[i].clientX;
        e.clientY = touchPoints[i].clientY;
        func.apply(thisObject, arguments);
        e.preventDefault()
      }
    };
    element.addEventListener(Blockly.bindEvent_.TOUCH_MAP[name], wrapFunc, false);
    bindData.push([element, Blockly.bindEvent_.TOUCH_MAP[name], wrapFunc])
  }
  return bindData
};
Blockly.bindEvent_.TOUCH_MAP = {};
if("ontouchstart" in document.documentElement) {
  Blockly.bindEvent_.TOUCH_MAP = {mousedown:"touchstart", mousemove:"touchmove", mouseup:"touchend"}
}else {
  if(window.navigator.pointerEnabled) {
    Blockly.bindEvent_.TOUCH_MAP = {mousedown:"pointerdown", mousemove:"pointermove", mouseup:"pointerup"}
  }else {
    if(window.navigator.msPointerEnabled) {
      Blockly.bindEvent_.TOUCH_MAP = {mousedown:"MSPointerDown", mousemove:"MSPointerMove", mouseup:"MSPointerUp"}
    }
  }
}
Blockly.unbindEvent_ = function(bindData) {
  while(bindData.length) {
    var bindDatum = bindData.pop();
    var element = bindDatum[0];
    var name = bindDatum[1];
    var func = bindDatum[2];
    element.removeEventListener(name, func, false)
  }
  return func
};
Blockly.fireUiEvent = function(element, eventName) {
  var doc = document;
  if(doc.createEvent) {
    var evt = doc.createEvent("UIEvents");
    evt.initEvent(eventName, true, true);
    element.dispatchEvent(evt)
  }else {
    if(doc.createEventObject) {
      var evt = doc.createEventObject();
      element.fireEvent("on" + eventName, evt)
    }else {
      throw"FireEvent: No event creation mechanism.";
    }
  }
};
Blockly.noEvent = function(e) {
  e.preventDefault();
  e.stopPropagation()
};
Blockly.getRelativeXY_ = function(element) {
  var xy = {x:0, y:0};
  var x = element.getAttribute("x");
  if(x) {
    xy.x = parseInt(x, 10)
  }
  var y = element.getAttribute("y");
  if(y) {
    xy.y = parseInt(y, 10)
  }
  var transform = element.getAttribute("transform");
  var r = transform && transform.match(/translate\(\s*([-\d.]+)([ ,]\s*([-\d.]+)\s*\))?/);
  if(r) {
    xy.x += parseInt(r[1], 10);
    if(r[3]) {
      xy.y += parseInt(r[3], 10)
    }
  }
  return xy
};
Blockly.getSvgXY_ = function(element) {
  var x = 0;
  var y = 0;
  do {
    var xy = Blockly.getRelativeXY_(element);
    x += xy.x;
    y += xy.y;
    element = element.parentNode
  }while(element && element != Blockly.svg);
  return{x:x, y:y}
};
Blockly.getAbsoluteXY_ = function(element) {
  var xy = Blockly.getSvgXY_(element);
  return Blockly.convertCoordinates(xy.x, xy.y, false)
};
Blockly.createSvgElement = function(name, attrs, opt_parent) {
  var e = (document.createElementNS(Blockly.SVG_NS, name));
  for(var key in attrs) {
    e.setAttribute(key, attrs[key])
  }
  if(document.body.runtimeStyle) {
    e.runtimeStyle = e.currentStyle = e.style
  }
  if(opt_parent) {
    opt_parent.appendChild(e)
  }
  return e
};
Blockly.isRightButton = function(e) {
  return e.button == 2 || e.ctrlKey
};
Blockly.convertCoordinates = function(x, y, toSvg) {
  if(toSvg) {
    x -= window.pageXOffset;
    y -= window.pageYOffset
  }
  var svgPoint = Blockly.svg.createSVGPoint();
  svgPoint.x = x;
  svgPoint.y = y;
  var matrix = Blockly.svg.getScreenCTM();
  if(toSvg) {
    matrix = matrix.inverse()
  }
  var xy = svgPoint.matrixTransform(matrix);
  if(!toSvg) {
    xy.x += window.pageXOffset;
    xy.y += window.pageYOffset
  }
  return xy
};
Blockly.mouseToSvg = function(e) {
  return Blockly.convertCoordinates(e.clientX + window.pageXOffset, e.clientY + window.pageYOffset, true)
};
Blockly.shortestStringLength = function(array) {
  if(!array.length) {
    return 0
  }
  var len = array[0].length;
  for(var i = 1;i < array.length;i++) {
    len = Math.min(len, array[i].length)
  }
  return len
};
Blockly.commonWordPrefix = function(array, opt_shortest) {
  if(!array.length) {
    return 0
  }else {
    if(array.length == 1) {
      return array[0].length
    }
  }
  var wordPrefix = 0;
  var max = opt_shortest || Blockly.shortestStringLength(array);
  for(var len = 0;len < max;len++) {
    var letter = array[0][len];
    for(var i = 1;i < array.length;i++) {
      if(letter != array[i][len]) {
        return wordPrefix
      }
    }
    if(letter == " ") {
      wordPrefix = len + 1
    }
  }
  for(var i = 1;i < array.length;i++) {
    var letter = array[i][len];
    if(letter && letter != " ") {
      return wordPrefix
    }
  }
  return max
};
Blockly.commonWordSuffix = function(array, opt_shortest) {
  if(!array.length) {
    return 0
  }else {
    if(array.length == 1) {
      return array[0].length
    }
  }
  var wordPrefix = 0;
  var max = opt_shortest || Blockly.shortestStringLength(array);
  for(var len = 0;len < max;len++) {
    var letter = array[0].substr(-len - 1, 1);
    for(var i = 1;i < array.length;i++) {
      if(letter != array[i].substr(-len - 1, 1)) {
        return wordPrefix
      }
    }
    if(letter == " ") {
      wordPrefix = len + 1
    }
  }
  for(var i = 1;i < array.length;i++) {
    var letter = array[i].charAt(array[i].length - len - 1);
    if(letter && letter != " ") {
      return wordPrefix
    }
  }
  return max
};
Blockly.isNumber = function(str) {
  return!!str.match(/^\s*-?\d+(\.\d+)?\s*$/)
};
Blockly.isMsie = function() {
  return window.navigator.userAgent.indexOf("MSIE") >= 0
};
Blockly.isTrident = function() {
  return window.navigator.userAgent.indexOf("Trident") >= 0
};
Blockly.ieVersion = function() {
  return document.documentMode
};
goog.provide("Blockly.FieldColour");
goog.require("Blockly.Field");
goog.require("goog.ui.ColorPicker");
Blockly.FieldColour = function(colour, opt_changeHandler) {
  Blockly.FieldColour.superClass_.constructor.call(this, "\u00a0\u00a0\u00a0");
  this.changeHandler_ = opt_changeHandler;
  this.borderRect_.style.fillOpacity = 1;
  this.setValue(colour)
};
goog.inherits(Blockly.FieldColour, Blockly.Field);
Blockly.FieldColour.prototype.CURSOR = "default";
Blockly.FieldColour.prototype.dispose = function() {
  Blockly.WidgetDiv.hideIfField(this);
  Blockly.FieldColour.superClass_.dispose.call(this)
};
Blockly.FieldColour.prototype.getValue = function() {
  return this.colour_
};
Blockly.FieldColour.prototype.setValue = function(colour) {
  this.colour_ = colour;
  this.borderRect_.style.fill = colour;
  if(this.sourceBlock_ && this.sourceBlock_.rendered) {
    this.sourceBlock_.workspace.fireChangeEvent()
  }
};
Blockly.FieldColour.COLOURS = goog.ui.ColorPicker.SIMPLE_GRID_COLORS;
Blockly.FieldColour.COLUMNS = 7;
Blockly.FieldColour.prototype.showEditor_ = function() {
  Blockly.WidgetDiv.show(this, Blockly.FieldColour.dispose_);
  var div = Blockly.WidgetDiv.DIV;
  var picker = new goog.ui.ColorPicker;
  picker.setSize(Blockly.FieldColour.COLUMNS);
  picker.setColors(Blockly.FieldColour.COLOURS);
  picker.render(div);
  picker.setSelectedColor(this.getValue());
  var xy = Blockly.getAbsoluteXY_((this.borderRect_));
  if(navigator.userAgent.indexOf("MSIE") >= 0 || navigator.userAgent.indexOf("Trident") >= 0) {
    this.borderRect_.style.display = "inline";
    var borderBBox = {x:this.borderRect_.getBBox().x, y:this.borderRect_.getBBox().y, width:this.borderRect_.scrollWidth, height:this.borderRect_.scrollHeight}
  }else {
    var borderBBox = this.borderRect_.getBBox()
  }
  if(Blockly.RTL) {
    xy.x += borderBBox.width
  }
  xy.y += borderBBox.height - 1;
  if(Blockly.RTL) {
    xy.x -= div.offsetWidth
  }
  div.style.left = xy.x + "px";
  div.style.top = xy.y + "px";
  var thisObj = this;
  Blockly.FieldColour.changeEventKey_ = goog.events.listen(picker, goog.ui.ColorPicker.EventType.CHANGE, function(event) {
    var colour = event.target.getSelectedColor() || "#000000";
    Blockly.WidgetDiv.hide();
    if(thisObj.changeHandler_) {
      var override = thisObj.changeHandler_(colour);
      if(override !== undefined) {
        colour = override
      }
    }
    if(colour !== null) {
      thisObj.setValue(colour)
    }
  })
};
Blockly.FieldColour.dispose_ = function() {
  if(Blockly.FieldColour.changeEventKey_) {
    goog.events.unlistenByKey(Blockly.FieldColour.changeEventKey_)
  }
};
goog.provide("Blockly.FieldTextInput");
goog.require("Blockly.Field");
goog.require("Blockly.Msg");
goog.require("goog.asserts");
goog.require("goog.userAgent");
Blockly.FieldTextInput = function(text, opt_changeHandler) {
  Blockly.FieldTextInput.superClass_.constructor.call(this, text);
  this.changeHandler_ = opt_changeHandler
};
goog.inherits(Blockly.FieldTextInput, Blockly.Field);
Blockly.FieldTextInput.prototype.CURSOR = "text";
Blockly.FieldTextInput.prototype.dispose = function() {
  Blockly.WidgetDiv.hideIfField(this);
  Blockly.FieldTextInput.superClass_.dispose.call(this)
};
Blockly.FieldTextInput.prototype.setText = function(text) {
  if(text === null) {
    return
  }
  if(this.changeHandler_) {
    var validated = this.changeHandler_(text);
    if(validated !== null && validated !== undefined) {
      text = validated
    }
  }
  Blockly.Field.prototype.setText.call(this, text)
};
Blockly.FieldTextInput.prototype.showEditor_ = function() {
  if(goog.userAgent.MOBILE) {
    var newValue = window.prompt(Blockly.Msg.CHANGE_VALUE_TITLE, this.text_);
    if(this.changeHandler_) {
      var override = this.changeHandler_(newValue);
      if(override !== undefined) {
        newValue = override
      }
    }
    if(newValue !== null) {
      this.setText(newValue)
    }
    return
  }
  Blockly.WidgetDiv.show(this, this.dispose_());
  var div = Blockly.WidgetDiv.DIV;
  var htmlInput = goog.dom.createDom("input", "blocklyHtmlInput");
  Blockly.FieldTextInput.htmlInput_ = htmlInput;
  div.appendChild(htmlInput);
  htmlInput.value = htmlInput.defaultValue = this.text_;
  htmlInput.oldValue_ = null;
  this.validate_();
  this.resizeEditor_();
  htmlInput.focus();
  htmlInput.select();
  htmlInput.onKeyUpWrapper_ = Blockly.bindEvent_(htmlInput, "keyup", this, this.onHtmlInputChange_);
  htmlInput.onKeyPressWrapper_ = Blockly.bindEvent_(htmlInput, "keypress", this, this.onHtmlInputChange_);
  var workspaceSvg = this.sourceBlock_.workspace.getCanvas();
  htmlInput.onWorkspaceChangeWrapper_ = Blockly.bindEvent_(workspaceSvg, "blocklyWorkspaceChange", this, this.resizeEditor_)
};
Blockly.FieldTextInput.prototype.onHtmlInputChange_ = function(e) {
  var htmlInput = Blockly.FieldTextInput.htmlInput_;
  if(e.keyCode == 13) {
    Blockly.WidgetDiv.hide()
  }else {
    if(e.keyCode == 27) {
      this.setText(htmlInput.defaultValue);
      Blockly.WidgetDiv.hide()
    }else {
      var text = htmlInput.value;
      if(text !== htmlInput.oldValue_) {
        htmlInput.oldValue_ = text;
        this.setText(text);
        this.validate_()
      }else {
        if(goog.userAgent.WEBKIT) {
          this.sourceBlock_.render()
        }
      }
    }
  }
};
Blockly.FieldTextInput.prototype.validate_ = function() {
  var valid = true;
  goog.asserts.assertObject(Blockly.FieldTextInput.htmlInput_);
  var htmlInput = (Blockly.FieldTextInput.htmlInput_);
  if(this.changeHandler_) {
    valid = this.changeHandler_(htmlInput.value)
  }
  if(valid === null) {
    Blockly.addClass_(htmlInput, "blocklyInvalidInput")
  }else {
    Blockly.removeClass_(htmlInput, "blocklyInvalidInput")
  }
};
Blockly.FieldTextInput.prototype.resizeEditor_ = function() {
  var div = Blockly.WidgetDiv.DIV;
  if(navigator.userAgent.indexOf("MSIE") >= 0 || navigator.userAgent.indexOf("Trident") >= 0) {
    this.fieldGroup_.style.display = "inline";
    var bBox = {x:this.fieldGroup_.getBBox().x, y:this.fieldGroup_.getBBox().y, width:this.fieldGroup_.scrollWidth, height:this.fieldGroup_.scrollHeight}
  }else {
    var bBox = this.fieldGroup_.getBBox()
  }
  div.style.width = bBox.width + "px";
  var xy = Blockly.getAbsoluteXY_((this.borderRect_));
  if(Blockly.RTL) {
    if(navigator.userAgent.indexOf("MSIE") >= 0 || navigator.userAgent.indexOf("Trident") >= 0) {
      this.borderRect_.style.display = "inline";
      var borderBBox = {x:this.borderRect_.getBBox().x, y:this.borderRect_.getBBox().y, width:this.borderRect_.scrollWidth, height:this.borderRect_.scrollHeight}
    }else {
      var borderBBox = this.borderRect_.getBBox()
    }
    xy.x += borderBBox.width;
    xy.x -= div.offsetWidth
  }
  xy.y += 1;
  if(goog.userAgent.WEBKIT) {
    xy.y -= 3
  }
  div.style.left = xy.x + "px";
  div.style.top = xy.y + "px"
};
Blockly.FieldTextInput.prototype.dispose_ = function() {
  var thisField = this;
  return function() {
    var htmlInput = Blockly.FieldTextInput.htmlInput_;
    var text;
    text = htmlInput.value;
    if(thisField.changeHandler_) {
      text = thisField.changeHandler_(text);
      if(text === null) {
        text = htmlInput.defaultValue
      }
    }
    thisField.setText(text);
    thisField.sourceBlock_.render();
    Blockly.unbindEvent_(htmlInput.onKeyUpWrapper_);
    Blockly.unbindEvent_(htmlInput.onKeyPressWrapper_);
    Blockly.unbindEvent_(htmlInput.onWorkspaceChangeWrapper_);
    Blockly.FieldTextInput.htmlInput_ = null
  }
};
Blockly.FieldTextInput.numberValidator = function(text) {
  text = text.replace(/O/ig, "0");
  text = text.replace(/,/g, "");
  var n = parseFloat(text || 0);
  return isNaN(n) ? null : String(n)
};
Blockly.FieldTextInput.nonnegativeIntegerValidator = function(text) {
  var n = Blockly.FieldTextInput.numberValidator(text);
  if(n) {
    n = String(Math.max(0, Math.floor(n)))
  }
  return n
};
goog.provide("Blockly.CodeGenerator");
goog.provide("Blockly.Generator");
goog.require("Blockly.Block");
Blockly.Generator = {};
Blockly.Generator.NAME_TYPE = "generated_function";
Blockly.Generator.languages = {};
Blockly.Generator.get = function(name) {
  if(!(name in Blockly.Generator.languages)) {
    var generator = new Blockly.CodeGenerator(name);
    Blockly.Generator.languages[name] = generator
  }
  return Blockly.Generator.languages[name]
};
Blockly.Generator.workspaceToCode = function(name) {
  var code = [];
  var generator = Blockly.Generator.get(name);
  generator.init();
  var blocks = Blockly.mainWorkspace.getTopBlocks(true);
  for(var x = 0, block;block = blocks[x];x++) {
    var line = generator.blockToCode(block);
    if(line instanceof Array) {
      line = line[0]
    }
    if(line) {
      if(block.outputConnection && generator.scrubNakedValue) {
        line = generator.scrubNakedValue(line)
      }
      code.push(line)
    }
  }
  code = code.join("\n");
  code = generator.finish(code);
  code = code.replace(/^\s+\n/, "");
  code = code.replace(/\n\s+$/, "\n");
  code = code.replace(/[ \t]+\n/g, "\n");
  return code
};
Blockly.Generator.prefixLines = function(text, prefix) {
  return prefix + text.replace(/\n(.)/g, "\n" + prefix + "$1")
};
Blockly.Generator.allNestedComments = function(block) {
  var comments = [];
  var blocks = block.getDescendants();
  for(var x = 0;x < blocks.length;x++) {
    var comment = blocks[x].getCommentText();
    if(comment) {
      comments.push(comment)
    }
  }
  if(comments.length) {
    comments.push("")
  }
  return comments.join("\n")
};
Blockly.CodeGenerator = function(name) {
  this.name_ = name;
  this.RESERVED_WORDS_ = ""
};
Blockly.CodeGenerator.prototype.blockToCode = function(block) {
  if(!block) {
    return""
  }
  if(block.disabled) {
    var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    return this.blockToCode(nextBlock)
  }
  var func = this[block.type];
  if(!func) {
    throw'Language "' + this.name_ + '" does not know how to generate code ' + 'for block type "' + block.type + '".';
  }
  var code = func.call(block);
  if(code instanceof Array) {
    return[this.scrub_(block, code[0]), code[1]]
  }else {
    return this.scrub_(block, code)
  }
};
Blockly.CodeGenerator.prototype.valueToCode = function(block, name, order) {
  if(isNaN(order)) {
    throw'Expecting valid order from block "' + block.type + '".';
  }
  var targetBlock = block.getInputTargetBlock(name);
  if(!targetBlock) {
    return""
  }
  var tuple = this.blockToCode(targetBlock);
  if(tuple === "") {
    return""
  }
  if(!(tuple instanceof Array)) {
    throw'Expecting tuple from value block "' + targetBlock.type + '".';
  }
  var code = tuple[0];
  var innerOrder = tuple[1];
  if(isNaN(innerOrder)) {
    throw'Expecting valid order from value block "' + targetBlock.type + '".';
  }
  if(code && order <= innerOrder) {
    code = "(" + code + ")"
  }
  return code
};
Blockly.CodeGenerator.prototype.statementToCode = function(block, name) {
  var targetBlock = block.getInputTargetBlock(name);
  var code = this.blockToCode(targetBlock);
  if(!goog.isString(code)) {
    throw'Expecting code from statement block "' + targetBlock.type + '".';
  }
  if(code) {
    code = Blockly.Generator.prefixLines((code), "  ")
  }
  return code
};
Blockly.CodeGenerator.prototype.addReservedWords = function(words) {
  this.RESERVED_WORDS_ += words + ","
};
goog.provide("goog.cssom");
goog.provide("goog.cssom.CssRuleType");
goog.require("goog.array");
goog.require("goog.dom");
goog.cssom.CssRuleType = {STYLE:1, IMPORT:3, MEDIA:4, FONT_FACE:5, PAGE:6, NAMESPACE:7};
goog.cssom.getAllCssText = function(opt_styleSheet) {
  var styleSheet = opt_styleSheet || document.styleSheets;
  return(goog.cssom.getAllCss_(styleSheet, true))
};
goog.cssom.getAllCssStyleRules = function(opt_styleSheet) {
  var styleSheet = opt_styleSheet || document.styleSheets;
  return(goog.cssom.getAllCss_(styleSheet, false))
};
goog.cssom.getCssRulesFromStyleSheet = function(styleSheet) {
  var cssRuleList = null;
  try {
    cssRuleList = styleSheet.rules || styleSheet.cssRules
  }catch(e) {
    if(e.code == 15) {
      e.styleSheet = styleSheet;
      throw e;
    }
  }
  return cssRuleList
};
goog.cssom.getAllCssStyleSheets = function(opt_styleSheet, opt_includeDisabled) {
  var styleSheetsOutput = [];
  var styleSheet = opt_styleSheet || document.styleSheets;
  var includeDisabled = goog.isDef(opt_includeDisabled) ? opt_includeDisabled : false;
  if(styleSheet.imports && styleSheet.imports.length) {
    for(var i = 0, n = styleSheet.imports.length;i < n;i++) {
      goog.array.extend(styleSheetsOutput, goog.cssom.getAllCssStyleSheets(styleSheet.imports[i]))
    }
  }else {
    if(styleSheet.length) {
      for(var i = 0, n = styleSheet.length;i < n;i++) {
        goog.array.extend(styleSheetsOutput, goog.cssom.getAllCssStyleSheets(styleSheet[i]))
      }
    }else {
      var cssRuleList = goog.cssom.getCssRulesFromStyleSheet(styleSheet);
      if(cssRuleList && cssRuleList.length) {
        for(var i = 0, n = cssRuleList.length, cssRule;i < n;i++) {
          cssRule = cssRuleList[i];
          if(cssRule.styleSheet) {
            goog.array.extend(styleSheetsOutput, goog.cssom.getAllCssStyleSheets(cssRule.styleSheet))
          }
        }
      }
    }
  }
  if((styleSheet.type || (styleSheet.rules || styleSheet.cssRules)) && (!styleSheet.disabled || includeDisabled)) {
    styleSheetsOutput.push(styleSheet)
  }
  return styleSheetsOutput
};
goog.cssom.getCssTextFromCssRule = function(cssRule) {
  var cssText = "";
  if(cssRule.cssText) {
    cssText = cssRule.cssText
  }else {
    if(cssRule.style && (cssRule.style.cssText && cssRule.selectorText)) {
      var styleCssText = cssRule.style.cssText.replace(/\s*-closure-parent-stylesheet:\s*\[object\];?\s*/gi, "").replace(/\s*-closure-rule-index:\s*[\d]+;?\s*/gi, "");
      var thisCssText = cssRule.selectorText + " { " + styleCssText + " }";
      cssText = thisCssText
    }
  }
  return cssText
};
goog.cssom.getCssRuleIndexInParentStyleSheet = function(cssRule, opt_parentStyleSheet) {
  if(cssRule.style && cssRule.style["-closure-rule-index"]) {
    return cssRule.style["-closure-rule-index"]
  }
  var parentStyleSheet = opt_parentStyleSheet || goog.cssom.getParentStyleSheet(cssRule);
  if(!parentStyleSheet) {
    throw Error("Cannot find a parentStyleSheet.");
  }
  var cssRuleList = goog.cssom.getCssRulesFromStyleSheet(parentStyleSheet);
  if(cssRuleList && cssRuleList.length) {
    for(var i = 0, n = cssRuleList.length, thisCssRule;i < n;i++) {
      thisCssRule = cssRuleList[i];
      if(thisCssRule == cssRule) {
        return i
      }
    }
  }
  return-1
};
goog.cssom.getParentStyleSheet = function(cssRule) {
  return cssRule.parentStyleSheet || cssRule.style["-closure-parent-stylesheet"]
};
goog.cssom.replaceCssRule = function(cssRule, cssText, opt_parentStyleSheet, opt_index) {
  var parentStyleSheet = opt_parentStyleSheet || goog.cssom.getParentStyleSheet(cssRule);
  if(parentStyleSheet) {
    var index = opt_index >= 0 ? opt_index : goog.cssom.getCssRuleIndexInParentStyleSheet(cssRule, parentStyleSheet);
    if(index >= 0) {
      goog.cssom.removeCssRule(parentStyleSheet, index);
      goog.cssom.addCssRule(parentStyleSheet, cssText, index)
    }else {
      throw Error("Cannot proceed without the index of the cssRule.");
    }
  }else {
    throw Error("Cannot proceed without the parentStyleSheet.");
  }
};
goog.cssom.addCssRule = function(cssStyleSheet, cssText, opt_index) {
  var index = opt_index;
  if(index < 0 || index == undefined) {
    var rules = cssStyleSheet.rules || cssStyleSheet.cssRules;
    index = rules.length
  }
  if(cssStyleSheet.insertRule) {
    cssStyleSheet.insertRule(cssText, index)
  }else {
    var matches = /^([^\{]+)\{([^\{]+)\}/.exec(cssText);
    if(matches.length == 3) {
      var selector = matches[1];
      var style = matches[2];
      cssStyleSheet.addRule(selector, style, index)
    }else {
      throw Error("Your CSSRule appears to be ill-formatted.");
    }
  }
};
goog.cssom.removeCssRule = function(cssStyleSheet, index) {
  if(cssStyleSheet.deleteRule) {
    cssStyleSheet.deleteRule(index)
  }else {
    cssStyleSheet.removeRule(index)
  }
};
goog.cssom.addCssText = function(cssText, opt_domHelper) {
  var document = opt_domHelper ? opt_domHelper.getDocument() : goog.dom.getDocument();
  var cssNode = document.createElement("style");
  cssNode.type = "text/css";
  var head = document.getElementsByTagName("head")[0];
  head.appendChild(cssNode);
  if(cssNode.styleSheet) {
    cssNode.styleSheet.cssText = cssText
  }else {
    var cssTextNode = document.createTextNode(cssText);
    cssNode.appendChild(cssTextNode)
  }
  return cssNode
};
goog.cssom.getFileNameFromStyleSheet = function(styleSheet) {
  var href = styleSheet.href;
  if(!href) {
    return null
  }
  var matches = /([^\/\?]+)[^\/]*$/.exec(href);
  var filename = matches[1];
  return filename
};
goog.cssom.getAllCss_ = function(styleSheet, isTextOutput) {
  var cssOut = [];
  var styleSheets = goog.cssom.getAllCssStyleSheets(styleSheet);
  for(var i = 0;styleSheet = styleSheets[i];i++) {
    var cssRuleList = goog.cssom.getCssRulesFromStyleSheet(styleSheet);
    if(cssRuleList && cssRuleList.length) {
      if(!isTextOutput) {
        var ruleIndex = 0
      }
      for(var j = 0, n = cssRuleList.length, cssRule;j < n;j++) {
        cssRule = cssRuleList[j];
        if(isTextOutput && !cssRule.href) {
          var res = goog.cssom.getCssTextFromCssRule(cssRule);
          cssOut.push(res)
        }else {
          if(!cssRule.href) {
            if(cssRule.style) {
              if(!cssRule.parentStyleSheet) {
                cssRule.style["-closure-parent-stylesheet"] = styleSheet
              }
              cssRule.style["-closure-rule-index"] = ruleIndex
            }
            cssOut.push(cssRule)
          }
        }
        if(!isTextOutput) {
          ruleIndex++
        }
      }
    }
  }
  return isTextOutput ? cssOut.join(" ") : cssOut
};
goog.provide("Blockly.Css");
goog.require("goog.cssom");
Blockly.Css.inject = function() {
  var text = Blockly.Css.CONTENT.join("\n");
  text = text.replace("%HAND_OPEN_PATH%", Blockly.assetUrl("media/handopen.cur")).replace("%TREE_PATH%", Blockly.assetUrl("media/tree.png"));
  goog.cssom.addCssText(text)
};
Blockly.Css.CONTENT = [".blocklySvg {", "  cursor: pointer;", "  background-color: #fff;", "  border: 1px solid #ddd;", " -ms-touch-action: none;", " touch-action: none;", "}", ".blocklyWidgetDiv {", "  position: absolute;", "  display: none;", "  z-index: 999;", "}", ".blocklyDraggable {", "  /* Hotspot coordinates are baked into the CUR file, but they are still", "     required in the CSS due to a Chrome bug.", "     http://code.google.com/p/chromium/issues/detail?id=1446 */", "  cursor: url(%HAND_OPEN_PATH%) 8 5, auto;", 
"}", ".blocklyResizeSE {", "  fill: #aaa;", "  cursor: se-resize;", "}", ".blocklyResizeSW {", "  fill: #aaa;", "  cursor: sw-resize;", "}", ".blocklyResizeLine {", "  stroke-width: 1;", "  stroke: #888;", "}", ".blocklyHighlightedConnectionPath {", "  stroke-width: 4px;", "  stroke: #fc3;", "  fill: none;", "}", ".blocklyPathLight {", "  fill: none;", "  stroke-width: 2;", "  stroke-linecap: round;", "}", ".blocklySelected>.blocklyPath {", "  stroke-width: 3px;", "  stroke: #fc3;", "}", ".blocklySelected>.blocklyPathLight {", 
"  display: none;", "}", ".blocklyDragging>.blocklyPath,", ".blocklyDragging>.blocklyPathLight {", "  fill-opacity: 0.8;", "  stroke-opacity: 0.8;", "}", ".blocklyDragging>.blocklyPathDark {", "  display: none;", "}", ".blocklyDisabled>.blocklyPath {", "  fill-opacity: 0.50;", "  stroke-opacity: 0.50;", "}", ".blocklyDisabled>.blocklyPathLight,", ".blocklyDisabled>.blocklyPathDark {", "  display: none;", "}", ".blocklyText {", "  cursor: default;", "  font-family: sans-serif;", "  font-size: 11pt;", 
"  fill: #fff;", "}", ".blocklyNonEditableText>text {", "  pointer-events: none;", "}", ".blocklyNonEditableText>rect,", ".blocklyEditableText>rect {", "  fill: #fff;", "  fill-opacity: 0.6;", "}", ".blocklyNonEditableText>text,", ".blocklyEditableText>text {", "  fill: #000;", "}", ".blocklyEditableText:hover>rect {", "  stroke-width: 2;", "  stroke: #fff;", "}", "/*", " * Don't allow users to select text.  It gets annoying when trying to", " * drag a block and selected text moves instead.", " */", 
".blocklySvg text {", "  -moz-user-select: none;", "  -webkit-user-select: none;", "  user-select: none;", "  cursor: inherit;", "}", "", ".blocklyHidden {", "  display: none;", "}", ".blocklyFieldDropdown:not(.blocklyHidden) {", "  display: block;", "}", ".blocklyTooltipBackground {", "  fill: #ffffc7;", "  stroke-width: 1px;", "  stroke: #d8d8d8;", "}", ".blocklyTooltipShadow,", ".blocklyContextMenuShadow,", ".blocklyDropdownMenuShadow {", "  fill: #bbb;", "  filter: url(#blocklyShadowFilter);", 
"}", ".blocklyTooltipText {", "  font-family: sans-serif;", "  font-size: 9pt;", "  fill: #000;", "}", "", ".blocklyIconShield {", "  cursor: default;", "  fill: #00c;", "  stroke-width: 1px;", "  stroke: #ccc;", "}", ".blocklyIconGroup:hover>.blocklyIconShield {", "  fill: #00f;", "  stroke: #fff;", "}", ".blocklyIconGroup:hover>.blocklyIconMark {", "  fill: #fff;", "}", ".blocklyIconMark {", "  cursor: default !important;", "  font-family: sans-serif;", "  font-size: 9pt;", "  font-weight: bold;", 
"  fill: #ccc;", "  text-anchor: middle;", "}", ".blocklyWarningBody {", "}", ".blocklyMinimalBody {", "  margin: 0;", "  padding: 0;", "}", ".blocklyCommentTextarea {", "  margin: 0;", "  padding: 2px;", "  border: 0;", "  resize: none;", "  background-color: #ffc;", "}", ".blocklyHtmlInput {", "  font-family: sans-serif;", "  font-size: 11pt;", "  border: none;", "  outline: none;", "  width: 100%", "}", ".blocklyContextMenuBackground,", ".blocklyMutatorBackground {", "  fill: #fff;", "  stroke-width: 1;", 
"  stroke: #ddd;", "}", ".blocklyContextMenuOptions>.blocklyMenuDiv,", ".blocklyContextMenuOptions>.blocklyMenuDivDisabled,", ".blocklyDropdownMenuOptions>.blocklyMenuDiv {", "  fill: #fff;", "}", ".blocklyContextMenuOptions>.blocklyMenuDiv:hover>rect,", ".blocklyDropdownMenuOptions>.blocklyMenuDiv:hover>rect {", "  fill: #57e;", "}", ".blocklyMenuSelected>rect {", "  fill: #57e;", "}", ".blocklyMenuText {", "  cursor: default !important;", "  font-family: sans-serif;", "  font-size: 15px; /* All context menu sizes are based on pixels. */", 
"  fill: #000;", "}", ".blocklyContextMenuOptions>.blocklyMenuDiv:hover>.blocklyMenuText,", ".blocklyDropdownMenuOptions>.blocklyMenuDiv:hover>.blocklyMenuText {", "  fill: #fff;", "}", ".blocklyMenuSelected>.blocklyMenuText {", "  fill: #fff;", "}", ".blocklyMenuDivDisabled>.blocklyMenuText {", "  fill: #ccc;", "}", ".blocklyFlyoutBackground {", "  fill: #ddd;", "  fill-opacity: 0.8;", "}", ".blocklyColourBackground {", "  fill: #666;", "}", ".blocklyScrollbarBackground {", "  fill: #fff;", "  stroke-width: 1;", 
"  stroke: #e4e4e4;", "}", ".blocklyScrollbarKnob {", "  fill: #ccc;", "}", ".blocklyScrollbarBackground:hover+.blocklyScrollbarKnob,", ".blocklyScrollbarKnob:hover {", "  fill: #bbb;", "}", ".blocklyInvalidInput {", "  background: #faa;", "}", ".blocklyAngleCircle {", "  stroke: #444;", "  stroke-width: 1;", "  fill: #ddd;", "  fill-opacity: 0.8;", "}", ".blocklyAngleMarks {", "  stroke: #444;", "  stroke-width: 1;", "}", ".blocklyAngleGuage {", "  fill: #d00;", "  fill-opacity: 0.8;  ", "}", "", 
"/* Category tree in Toolbox. */", ".blocklyToolboxDiv {", "  background-color: #ddd;", "  display: none;", "  overflow-x: visible;", "  overflow-y: auto;", "  position: absolute;", "}", ".blocklyTreeRoot {", "  padding: 4px 0;", "}", ".blocklyTreeRoot:focus {", "  outline: none;", "}", ".blocklyTreeRow {", "  line-height: 22px;", "  height: 22px;", "  padding-right: 1em;", "  white-space: nowrap;", "}", '.blocklyToolboxDiv[dir="RTL"] .blocklyTreeRow {', "  padding-right: 0;", "  padding-left: 1em !important;", 
"}", ".blocklyTreeRow:hover {", "  background-color: #e4e4e4;", "}", ".blocklyTreeIcon {", "  height: 16px;", "  width: 16px;", "  vertical-align: middle;", "  background-image: url(%TREE_PATH%);", "}", ".blocklyTreeIconClosedLtr {", "  background-position: -32px -1px;", "}", ".blocklyTreeIconClosedRtl {", "  background-position: 0px -1px;", "}", ".blocklyTreeIconOpen {", "  background-position: -16px -1px;", "}", ".blocklyTreeIconNone {", "  background-position: -48px -1px;", "}", ".blocklyTreeSelected>.blocklyTreeIconClosedLtr {", 
"  background-position: -32px -17px;", "}", ".blocklyTreeSelected>.blocklyTreeIconClosedRtl {", "  background-position: 0px -17px;", "}", ".blocklyTreeSelected>.blocklyTreeIconOpen {", "  background-position: -16px -17px;", "}", ".blocklyTreeSelected>.blocklyTreeIconNone {", "  background-position: -48px -17px;", "}", ".blocklyTreeLabel {", "  cursor: default;", "  font-family: sans-serif;", "  font-size: 16px;", "  padding: 0 3px;", "  vertical-align: middle;", "}", ".blocklyTreeSelected  {", "  background-color: #57e !important;", 
"}", ".blocklyTreeSelected .blocklyTreeLabel {", "  color: #fff;", "}", ".blocklyArrow {", "   font-size: 80%;", " }", "", "/*", " * Copyright 2007 The Closure Library Authors. All Rights Reserved.", " *", " * Use of this source code is governed by the Apache License, Version 2.0.", " * See the COPYING file for details.", " */", "", "/* Author: pupius@google.com (Daniel Pupius) */", "", "/*", " Styles to make the colorpicker look like the old gmail color picker", " NOTE: without CSS scoping this will override styles defined in palette.css", 
"*/", ".goog-palette {", "  outline: none;", "  cursor: default;", "}", "", ".goog-palette-table {", "  border: 1px solid #666;", "  border-collapse: collapse;", "}", "", ".goog-palette-cell {", "  height: 25px;", "  width: 25px;", "  margin: 0;", "  border: 0;", "  text-align: center;", "  vertical-align: middle;", "  border-right: 1px solid #666;", "  font-size: 1px;", "}", "", ".goog-palette-colorswatch {", "  position: relative;", "  height: 25px;", "  width: 25px;", "  border: 1px solid #666;", 
"}", "", ".goog-palette-cell-hover .goog-palette-colorswatch {", "  border: 1px solid #FFF;", "}", "", ".goog-palette-cell-selected .goog-palette-colorswatch {", "  border: 1px solid #000;", "  color: #fff;", "}", ""];
goog.provide("Blockly.inject");
goog.require("Blockly.Css");
goog.require("goog.dom");
Blockly.inject = function(container, opt_options) {
  if(!goog.dom.contains(document, container)) {
    throw"Error: container is not in current document.";
  }
  if(opt_options) {
    goog.mixin(Blockly, Blockly.parseOptions_(opt_options))
  }
  Blockly.createDom_(container);
  Blockly.init_()
};
Blockly.parseOptions_ = function(options) {
  var readOnly = !!options["readOnly"];
  if(readOnly) {
    var hasCategories = false;
    var hasTrashcan = false;
    var hasCollapse = false;
    var tree = null
  }else {
    var tree = options["toolbox"];
    if(tree) {
      if(typeof tree != "string" && typeof XSLTProcessor == "undefined") {
        tree = tree.outerHTML
      }
      if(typeof tree == "string") {
        tree = Blockly.Xml.textToDom(tree)
      }
      var hasCategories = !!tree.getElementsByTagName("category").length
    }else {
      tree = null;
      var hasCategories = false
    }
    var hasTrashcan = options["trashcan"];
    if(hasTrashcan === undefined) {
      hasTrashcan = hasCategories
    }
    var hasCollapse = options["collapse"];
    if(hasCollapse === undefined) {
      hasCollapse = hasCategories
    }
  }
  if(tree && !hasCategories) {
    var hasScrollbars = false
  }else {
    var hasScrollbars = options["scrollbars"];
    if(hasScrollbars === undefined) {
      hasScrollbars = true
    }
  }
  return{RTL:!!options["rtl"], collapse:hasCollapse, readOnly:readOnly, maxBlocks:options["maxBlocks"] || Infinity, assetUrl:options["assetUrl"] || function(inPath) {
    return options["path"] + inPath
  }, hasCategories:hasCategories, hasScrollbars:hasScrollbars, hasTrashcan:hasTrashcan, languageTree:tree}
};
Blockly.createDom_ = function(container) {
  container.setAttribute("dir", "LTR");
  goog.ui.Component.setDefaultRightToLeft(Blockly.RTL);
  Blockly.Css.inject();
  var svg = Blockly.createSvgElement("svg", {"xmlns":"http://www.w3.org/2000/svg", "xmlns:html":"http://www.w3.org/1999/xhtml", "xmlns:xlink":"http://www.w3.org/1999/xlink", "version":"1.1", "class":"blocklySvg"}, null);
  goog.events.listen(svg, "selectstart", function() {
    return false
  });
  var defs = Blockly.createSvgElement("defs", {}, svg);
  var filter, feSpecularLighting, feMerge, pattern;
  filter = Blockly.createSvgElement("filter", {"id":"blocklyEmboss"}, defs);
  Blockly.createSvgElement("feGaussianBlur", {"in":"SourceAlpha", "stdDeviation":1, "result":"blur"}, filter);
  feSpecularLighting = Blockly.createSvgElement("feSpecularLighting", {"in":"blur", "surfaceScale":1, "specularConstant":0.5, "specularExponent":10, "lighting-color":"white", "result":"specOut"}, filter);
  Blockly.createSvgElement("fePointLight", {"x":-5E3, "y":-1E4, "z":2E4}, feSpecularLighting);
  Blockly.createSvgElement("feComposite", {"in":"specOut", "in2":"SourceAlpha", "operator":"in", "result":"specOut"}, filter);
  Blockly.createSvgElement("feComposite", {"in":"SourceGraphic", "in2":"specOut", "operator":"arithmetic", "k1":0, "k2":1, "k3":1, "k4":0}, filter);
  filter = Blockly.createSvgElement("filter", {"id":"blocklyTrashcanShadowFilter"}, defs);
  Blockly.createSvgElement("feGaussianBlur", {"in":"SourceAlpha", "stdDeviation":2, "result":"blur"}, filter);
  Blockly.createSvgElement("feOffset", {"in":"blur", "dx":1, "dy":1, "result":"offsetBlur"}, filter);
  feMerge = Blockly.createSvgElement("feMerge", {}, filter);
  Blockly.createSvgElement("feMergeNode", {"in":"offsetBlur"}, feMerge);
  Blockly.createSvgElement("feMergeNode", {"in":"SourceGraphic"}, feMerge);
  filter = Blockly.createSvgElement("filter", {"id":"blocklyShadowFilter"}, defs);
  Blockly.createSvgElement("feGaussianBlur", {"stdDeviation":2}, filter);
  pattern = Blockly.createSvgElement("pattern", {"id":"blocklyDisabledPattern", "patternUnits":"userSpaceOnUse", "width":10, "height":10}, defs);
  Blockly.createSvgElement("rect", {"width":10, "height":10, "fill":"#aaa"}, pattern);
  Blockly.createSvgElement("path", {"d":"M 0 0 L 10 10 M 10 0 L 0 10", "stroke":"#cc0"}, pattern);
  Blockly.mainWorkspace = new Blockly.Workspace(Blockly.getMainWorkspaceMetrics_, Blockly.setMainWorkspaceMetrics_);
  svg.appendChild(Blockly.mainWorkspace.createDom());
  Blockly.mainWorkspace.maxBlocks = Blockly.maxBlocks;
  if(!Blockly.readOnly) {
    if(Blockly.hasCategories) {
      Blockly.Toolbox.createDom(svg, container)
    }else {
      Blockly.mainWorkspace.flyout_ = new Blockly.Flyout;
      var flyout = Blockly.mainWorkspace.flyout_;
      var flyoutSvg = flyout.createDom();
      flyout.init(Blockly.mainWorkspace, true);
      flyout.autoClose = false;
      goog.dom.insertSiblingBefore(flyoutSvg, Blockly.mainWorkspace.svgGroup_);
      var workspaceChanged = function() {
        if(Blockly.Block.dragMode_ == 0) {
          var metrics = Blockly.mainWorkspace.getMetrics();
          if(metrics.contentTop < 0 || (metrics.contentTop + metrics.contentHeight > metrics.viewHeight + metrics.viewTop || (metrics.contentLeft < (Blockly.RTL ? metrics.viewLeft : 0) || metrics.contentLeft + metrics.contentWidth > metrics.viewWidth + (Blockly.RTL ? 2 : 1) * metrics.viewLeft))) {
            var MARGIN = 25;
            var blocks = Blockly.mainWorkspace.getTopBlocks(false);
            for(var b = 0, block;block = blocks[b];b++) {
              var blockXY = block.getRelativeToSurfaceXY();
              var blockHW = block.getHeightWidth();
              var overflow = metrics.viewTop + MARGIN - blockHW.height - blockXY.y;
              if(overflow > 0) {
                block.moveBy(0, overflow)
              }
              var overflow = metrics.viewTop + metrics.viewHeight - MARGIN - blockXY.y;
              if(overflow < 0) {
                block.moveBy(0, overflow)
              }
              var overflow = MARGIN + metrics.viewLeft - blockXY.x - (Blockly.RTL ? 0 : blockHW.width);
              if(overflow > 0) {
                block.moveBy(overflow, 0)
              }
              var overflow = metrics.viewLeft + metrics.viewWidth - MARGIN - blockXY.x + (Blockly.RTL ? blockHW.width : 0);
              if(overflow < 0) {
                block.moveBy(overflow, 0)
              }
              if(block.isDeletable() && (Blockly.RTL ? blockXY.x - 2 * metrics.viewLeft - metrics.viewWidth : -blockXY.x) > MARGIN * 2) {
                block.dispose(false, true)
              }
            }
          }
        }
      };
      Blockly.addChangeListener(workspaceChanged)
    }
  }
  Blockly.Tooltip && svg.appendChild(Blockly.Tooltip.createDom());
  if(!Blockly.readOnly && Blockly.FieldDropdown) {
    svg.appendChild(Blockly.FieldDropdown.createDom())
  }
  container.appendChild(svg);
  Blockly.svg = svg;
  Blockly.svgResize();
  Blockly.WidgetDiv.DIV = goog.dom.createDom("div", "blocklyWidgetDiv");
  document.body.appendChild(Blockly.WidgetDiv.DIV)
};
Blockly.init_ = function() {
  if(goog.userAgent.WEBKIT) {
    var path = Blockly.createSvgElement("path", {"d":"m 0,0 c 0,-5 0,-5 0,0 H 50 V 50 z"}, Blockly.svg);
    if(Blockly.isMsie() || Blockly.isTrident()) {
      path.style.display = "inline";
      path.bBox_ = {x:path.getBBox().x, y:path.getBBox().y, width:path.scrollWidth, height:path.scrollHeight}
    }else {
      path.bBox_ = path.getBBox()
    }
    if(path.bBox_.height > 50) {
      Blockly.BROKEN_CONTROL_POINTS = true
    }
    Blockly.svg.removeChild(path)
  }
  Blockly.bindEvent_(Blockly.svg, "mousedown", null, Blockly.onMouseDown_);
  Blockly.bindEvent_(Blockly.svg, "mousemove", null, Blockly.onMouseMove_);
  Blockly.bindEvent_(Blockly.svg, "contextmenu", null, Blockly.onContextMenu_);
  Blockly.bindEvent_(Blockly.svg, "mouseup", null, Blockly.onMouseUp_);
  if(!Blockly.documentEventsBound_) {
    Blockly.bindEvent_(window, "resize", document, Blockly.svgResize);
    Blockly.bindEvent_(document, "keydown", null, Blockly.onKeyDown_);
    if(goog.userAgent.IPAD) {
      Blockly.bindEvent_(window, "orientationchange", document, function() {
        Blockly.fireUiEvent(window, "resize")
      }, false)
    }
    Blockly.documentEventsBound_ = true
  }
  if(Blockly.languageTree) {
    if(Blockly.hasCategories) {
      Blockly.Toolbox.init()
    }else {
      Blockly.mainWorkspace.flyout_.init(Blockly.mainWorkspace, true);
      Blockly.mainWorkspace.flyout_.show(Blockly.languageTree.childNodes);
      Blockly.mainWorkspace.pageXOffset = Blockly.mainWorkspace.flyout_.width_;
      var translation = "translate(" + Blockly.mainWorkspace.pageXOffset + ", 0)";
      Blockly.mainWorkspace.getCanvas().setAttribute("transform", translation);
      Blockly.mainWorkspace.getBubbleCanvas().setAttribute("transform", translation)
    }
  }
  if(Blockly.hasScrollbars) {
    Blockly.mainWorkspace.scrollbar = new Blockly.ScrollbarPair(Blockly.mainWorkspace);
    Blockly.mainWorkspace.scrollbar.resize()
  }
  Blockly.mainWorkspace.addTrashcan();
  Blockly.loadAudio_([Blockly.assetUrl("media/click.mp3"), Blockly.assetUrl("media/click.wav"), Blockly.assetUrl("media/click.ogg")], "click");
  Blockly.loadAudio_([Blockly.assetUrl("media/delete.mp3"), Blockly.assetUrl("media/delete.ogg"), Blockly.assetUrl("media/delete.wav")], "delete")
};
goog.provide("Blockly.FieldCheckbox");
goog.require("Blockly.Field");
Blockly.FieldCheckbox = function(state, opt_changeHandler) {
  Blockly.FieldCheckbox.superClass_.constructor.call(this, "");
  this.changeHandler_ = opt_changeHandler;
  this.checkElement_ = Blockly.createSvgElement("text", {"class":"blocklyText", "x":-3}, this.fieldGroup_);
  var textNode = document.createTextNode("\u2713");
  this.checkElement_.appendChild(textNode);
  this.setValue(state)
};
goog.inherits(Blockly.FieldCheckbox, Blockly.Field);
Blockly.FieldCheckbox.prototype.CURSOR = "default";
Blockly.FieldCheckbox.prototype.getValue = function() {
  return String(this.state_).toUpperCase()
};
Blockly.FieldCheckbox.prototype.setValue = function(strBool) {
  var newState = strBool == "TRUE";
  if(this.state_ !== newState) {
    this.state_ = newState;
    this.checkElement_.style.display = newState ? "block" : "none";
    if(this.sourceBlock_ && this.sourceBlock_.rendered) {
      this.sourceBlock_.workspace.fireChangeEvent()
    }
  }
};
Blockly.FieldCheckbox.prototype.showEditor_ = function() {
  var newState = !this.state_;
  if(this.changeHandler_) {
    var override = this.changeHandler_(newState);
    if(override !== undefined) {
      newState = override
    }
  }
  if(newState !== null) {
    this.setValue(String(newState).toUpperCase())
  }
};
goog.provide("Blockly.WidgetDiv");
goog.require("Blockly.Css");
goog.require("goog.dom");
Blockly.WidgetDiv.DIV = null;
Blockly.WidgetDiv.field_ = null;
Blockly.WidgetDiv.dispose_ = null;
Blockly.WidgetDiv.show = function(newField, dispose) {
  Blockly.WidgetDiv.hide();
  Blockly.WidgetDiv.field_ = newField;
  Blockly.WidgetDiv.dispose_ = dispose;
  Blockly.WidgetDiv.DIV.style.display = "block"
};
Blockly.WidgetDiv.hide = function() {
  if(Blockly.WidgetDiv.field_) {
    Blockly.WidgetDiv.DIV.style.display = "none";
    Blockly.WidgetDiv.dispose_ && Blockly.WidgetDiv.dispose_();
    Blockly.WidgetDiv.field_ = null;
    Blockly.WidgetDiv.dispose_ = null;
    goog.dom.removeChildren(Blockly.WidgetDiv.DIV)
  }
};
Blockly.WidgetDiv.hideIfField = function(oldField) {
  if(Blockly.WidgetDiv.field_ == oldField) {
    Blockly.WidgetDiv.hide()
  }
};
goog.provide("Blockly.FieldImage");
goog.require("Blockly.Field");
goog.require("goog.userAgent");
Blockly.FieldImage = function(src, width, height) {
  this.sourceBlock_ = null;
  height = Number(height);
  width = Number(width);
  this.size_ = {height:height + 10, width:width};
  var offsetY = 6 - Blockly.BlockSvg.TITLE_HEIGHT;
  this.fieldGroup_ = Blockly.createSvgElement("g", {}, null);
  this.imageElement_ = Blockly.createSvgElement("image", {"height":height + "px", "width":width + "px", "y":offsetY}, this.fieldGroup_);
  this.setText(src);
  if(goog.userAgent.GECKO) {
    this.rectElement_ = Blockly.createSvgElement("rect", {"height":height + "px", "width":width + "px", "y":offsetY, "fill-opacity":0}, this.fieldGroup_)
  }
};
goog.inherits(Blockly.FieldImage, Blockly.Field);
Blockly.FieldImage.prototype.rectElement_ = null;
Blockly.FieldImage.prototype.EDITABLE = false;
Blockly.FieldImage.prototype.init = function(block) {
  if(this.sourceBlock_) {
    throw"Image has already been initialized once.";
  }
  this.sourceBlock_ = block;
  block.getSvgRoot().appendChild(this.fieldGroup_);
  var topElement = this.rectElement_ || this.imageElement_;
  topElement.tooltip = this.sourceBlock_;
  Blockly.Tooltip && Blockly.Tooltip.bindMouseEvents(topElement)
};
Blockly.FieldImage.prototype.dispose = function() {
  goog.dom.removeNode(this.fieldGroup_);
  this.fieldGroup_ = null;
  this.imageElement_ = null;
  this.rectElement_ = null
};
Blockly.FieldImage.prototype.setTooltip = function(newTip) {
  var topElement = this.rectElement_ || this.imageElement_;
  topElement.tooltip = newTip
};
Blockly.FieldImage.prototype.getText = function() {
  return this.src_
};
Blockly.FieldImage.prototype.setText = function(src) {
  if(src === null) {
    return
  }
  this.src_ = src;
  this.imageElement_.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", goog.isString(src) ? src : "")
};
goog.provide("Blockly.FieldAngle");
goog.require("Blockly.FieldTextInput");
Blockly.FieldAngle = function(text, opt_changeHandler) {
  var changeHandler;
  if(opt_changeHandler) {
    var thisObj = this;
    changeHandler = function(value) {
      value = Blockly.FieldAngle.angleValidator.call(thisObj, value);
      if(value !== null) {
        opt_changeHandler.call(thisObj, value)
      }
      return value
    }
  }else {
    changeHandler = Blockly.FieldAngle.angleValidator
  }
  this.symbol_ = Blockly.createSvgElement("tspan", {}, null);
  this.symbol_.appendChild(document.createTextNode("\u00b0"));
  Blockly.FieldAngle.superClass_.constructor.call(this, text, changeHandler)
};
goog.inherits(Blockly.FieldAngle, Blockly.FieldTextInput);
Blockly.FieldAngle.HALF = 100 / 2;
Blockly.FieldAngle.RADIUS = Blockly.FieldAngle.HALF - 1;
Blockly.FieldAngle.prototype.dispose_ = function() {
  var thisField = this;
  return function() {
    Blockly.FieldAngle.superClass_.dispose_.call(thisField)();
    thisField.gauge_ = null;
    if(thisField.clickWrapper_) {
      Blockly.unbindEvent_(thisField.clickWrapper_)
    }
    if(thisField.moveWrapper1_) {
      Blockly.unbindEvent_(thisField.moveWrapper1_)
    }
    if(thisField.moveWrapper2_) {
      Blockly.unbindEvent_(thisField.moveWrapper2_)
    }
  }
};
Blockly.FieldAngle.prototype.showEditor_ = function() {
  Blockly.FieldAngle.superClass_.showEditor_.call(this);
  var div = Blockly.WidgetDiv.DIV;
  if(!div.firstChild) {
    return
  }
  var svg = Blockly.createSvgElement("svg", {"xmlns":"http://www.w3.org/2000/svg", "xmlns:html":"http://www.w3.org/1999/xhtml", "xmlns:xlink":"http://www.w3.org/1999/xlink", "version":"1.1", "height":Blockly.FieldAngle.HALF * 2 + "px", "width":Blockly.FieldAngle.HALF * 2 + "px"}, div);
  var circle = Blockly.createSvgElement("circle", {"cx":Blockly.FieldAngle.HALF, "cy":Blockly.FieldAngle.HALF, "r":Blockly.FieldAngle.RADIUS, "class":"blocklyAngleCircle"}, svg);
  this.gauge_ = Blockly.createSvgElement("path", {"class":"blocklyAngleGuage"}, svg);
  for(var a = 0;a < 360;a += 15) {
    Blockly.createSvgElement("line", {"x1":Blockly.FieldAngle.HALF + Blockly.FieldAngle.RADIUS, "y1":Blockly.FieldAngle.HALF, "x2":Blockly.FieldAngle.HALF + Blockly.FieldAngle.RADIUS - (a % 45 == 0 ? 10 : 5), "y2":Blockly.FieldAngle.HALF, "class":"blocklyAngleMarks", "transform":"rotate(" + a + ", " + Blockly.FieldAngle.HALF + ", " + Blockly.FieldAngle.HALF + ")"}, svg)
  }
  svg.style.marginLeft = "-35px";
  this.clickWrapper_ = Blockly.bindEvent_(svg, "click", this, Blockly.WidgetDiv.hide);
  this.moveWrapper1_ = Blockly.bindEvent_(circle, "mousemove", this, this.onMouseMove);
  this.moveWrapper2_ = Blockly.bindEvent_(this.gauge_, "mousemove", this, this.onMouseMove);
  this.updateGraph()
};
Blockly.FieldAngle.prototype.onMouseMove = function(e) {
  var bBox = this.gauge_.ownerSVGElement.getBoundingClientRect();
  var dx = e.clientX - bBox.left - Blockly.FieldAngle.HALF;
  var dy = e.clientY - bBox.top - Blockly.FieldAngle.HALF;
  var angle = Math.atan(-dy / dx);
  if(isNaN(angle)) {
    return
  }
  angle = angle / Math.PI * 180;
  if(dx < 0) {
    angle += 180
  }else {
    if(dy > 0) {
      angle += 360
    }
  }
  angle = String(Math.round(angle));
  Blockly.FieldTextInput.htmlInput_.value = angle;
  this.setText(angle)
};
Blockly.FieldAngle.prototype.setText = function(text) {
  Blockly.FieldAngle.superClass_.setText.call(this, text);
  this.updateGraph();
  if(Blockly.RTL) {
    this.textElement_.insertBefore(this.symbol_, this.textElement_.firstChild)
  }else {
    this.textElement_.appendChild(this.symbol_)
  }
  this.size_.width = 0
};
Blockly.FieldAngle.prototype.updateGraph = function() {
  if(this.gauge_) {
    var angleRadians = Number(this.getText()) / 180 * Math.PI;
    if(isNaN(angleRadians)) {
      this.gauge_.setAttribute("d", "M " + Blockly.FieldAngle.HALF + ", " + Blockly.FieldAngle.HALF)
    }else {
      var x = Blockly.FieldAngle.HALF + Math.cos(angleRadians) * Blockly.FieldAngle.RADIUS;
      var y = Blockly.FieldAngle.HALF + Math.sin(angleRadians) * -Blockly.FieldAngle.RADIUS;
      var largeFlag = angleRadians > Math.PI ? 1 : 0;
      this.gauge_.setAttribute("d", "M " + Blockly.FieldAngle.HALF + ", " + Blockly.FieldAngle.HALF + " h " + Blockly.FieldAngle.RADIUS + " A " + Blockly.FieldAngle.RADIUS + "," + Blockly.FieldAngle.RADIUS + " 0 " + largeFlag + " 0 " + x + "," + y + " z")
    }
  }
};
Blockly.FieldAngle.angleValidator = function(text) {
  var n = Blockly.FieldTextInput.numberValidator(text);
  if(n !== null) {
    n = n % 360;
    if(n < 0) {
      n += 360
    }
    n = String(n)
  }
  return n
};
goog.provide("Blockly");
goog.require("Blockly.Block");
goog.require("Blockly.Connection");
goog.require("Blockly.FieldAngle");
goog.require("Blockly.FieldCheckbox");
goog.require("Blockly.FieldColour");
goog.require("Blockly.FieldDropdown");
goog.require("Blockly.FieldImage");
goog.require("Blockly.FieldTextInput");
goog.require("Blockly.FieldVariable");
goog.require("Blockly.Generator");
goog.require("Blockly.Msg");
goog.require("Blockly.Procedures");
goog.require("Blockly.Toolbox");
goog.require("Blockly.WidgetDiv");
goog.require("Blockly.Workspace");
goog.require("Blockly.inject");
goog.require("Blockly.utils");
goog.require("goog.dom");
goog.require("goog.color");
goog.require("goog.events");
goog.require("goog.string");
goog.require("goog.ui.ColorPicker");
goog.require("goog.ui.tree.TreeControl");
goog.require("goog.userAgent");
Blockly.assetUrl = undefined;
Blockly.SVG_NS = "http://www.w3.org/2000/svg";
Blockly.HTML_NS = "http://www.w3.org/1999/xhtml";
Blockly.HSV_SATURATION = 0.45;
Blockly.HSV_VALUE = 0.65;
Blockly.makeColour = function(hue, saturation, value) {
  return goog.color.hsvToHex(hue, saturation, value * 256)
};
Blockly.INPUT_VALUE = 1;
Blockly.OUTPUT_VALUE = 2;
Blockly.NEXT_STATEMENT = 3;
Blockly.PREVIOUS_STATEMENT = 4;
Blockly.DUMMY_INPUT = 5;
Blockly.ALIGN_LEFT = -1;
Blockly.ALIGN_CENTRE = 0;
Blockly.ALIGN_RIGHT = 1;
Blockly.OPPOSITE_TYPE = [];
Blockly.OPPOSITE_TYPE[Blockly.INPUT_VALUE] = Blockly.OUTPUT_VALUE;
Blockly.OPPOSITE_TYPE[Blockly.OUTPUT_VALUE] = Blockly.INPUT_VALUE;
Blockly.OPPOSITE_TYPE[Blockly.NEXT_STATEMENT] = Blockly.PREVIOUS_STATEMENT;
Blockly.OPPOSITE_TYPE[Blockly.PREVIOUS_STATEMENT] = Blockly.NEXT_STATEMENT;
Blockly.SOUNDS_ = {};
window.AudioContext = window.AudioContext || window.webkitAudioContext;
if(window.AudioContext) {
  Blockly.CONTEXT = new AudioContext
}
Blockly.selected = null;
Blockly.readOnly = false;
Blockly.highlightedConnection_ = null;
Blockly.localConnection_ = null;
Blockly.DRAG_RADIUS = 5;
Blockly.SNAP_RADIUS = 15;
Blockly.BUMP_DELAY = 250;
Blockly.COLLAPSE_CHARS = 30;
Blockly.mainWorkspace = null;
Blockly.clipboard_ = null;
Blockly.svgSize = function() {
  return{width:Blockly.svg.cachedWidth_, height:Blockly.svg.cachedHeight_}
};
Blockly.svgResize = function() {
  var svg = Blockly.svg;
  var style = window.getComputedStyle(svg);
  var borderWidth = 0;
  if(style) {
    borderWidth = parseInt(style.borderLeftWidth, 10) + parseInt(style.borderRightWidth, 10)
  }
  var div = svg.parentNode;
  var width = div.offsetWidth - borderWidth;
  var height = div.offsetHeight;
  if(svg.cachedWidth_ != width) {
    svg.setAttribute("width", width + "px");
    svg.cachedWidth_ = width
  }
  if(svg.cachedHeight_ != height) {
    svg.setAttribute("height", height + "px");
    svg.cachedHeight_ = height
  }
  if(Blockly.mainWorkspace.scrollbar) {
    Blockly.mainWorkspace.scrollbar.resize()
  }
};
Blockly.getWorkspaceWidth = function() {
  var metrics = Blockly.mainWorkspace.getMetrics();
  var width = metrics ? metrics.viewWidth : 0;
  return width
};
Blockly.getToolboxWidth = function() {
  var flyout = Blockly.mainWorkspace.flyout_ || Blockly.Toolbox.flyout_;
  var metrics = flyout.workspace_.getMetrics();
  var width = metrics ? metrics.viewWidth : 0;
  return width
};
Blockly.onMouseDown_ = function(e) {
  Blockly.terminateDrag_();
  Blockly.hideChaff();
  var isTargetSvg = e.target && (e.target.nodeName && e.target.nodeName.toLowerCase() == "svg");
  if(!Blockly.readOnly && (Blockly.selected && isTargetSvg)) {
    Blockly.selected.unselect()
  }
  if(Blockly.isRightButton(e)) {
    if(Blockly.ContextMenu) {
      Blockly.showContextMenu_(Blockly.mouseToSvg(e))
    }
  }else {
    if((Blockly.readOnly || isTargetSvg) && Blockly.mainWorkspace.scrollbar) {
      Blockly.mainWorkspace.dragMode = true;
      Blockly.mainWorkspace.startDragMouseX = e.clientX;
      Blockly.mainWorkspace.startDragMouseY = e.clientY;
      Blockly.mainWorkspace.startDragMetrics = Blockly.mainWorkspace.getMetrics();
      Blockly.mainWorkspace.startScrollX = Blockly.mainWorkspace.pageXOffset;
      Blockly.mainWorkspace.startScrollY = Blockly.mainWorkspace.pageYOffset
    }
  }
};
Blockly.onMouseUp_ = function(e) {
  Blockly.setCursorHand_(false);
  Blockly.mainWorkspace.dragMode = false
};
Blockly.onMouseMove_ = function(e) {
  if(Blockly.mainWorkspace.dragMode) {
    Blockly.removeAllRanges();
    var dx = e.clientX - Blockly.mainWorkspace.startDragMouseX;
    var dy = e.clientY - Blockly.mainWorkspace.startDragMouseY;
    var metrics = Blockly.mainWorkspace.startDragMetrics;
    var x = Blockly.mainWorkspace.startScrollX + dx;
    var y = Blockly.mainWorkspace.startScrollY + dy;
    x = Math.min(x, -metrics.contentLeft);
    y = Math.min(y, -metrics.contentTop);
    x = Math.max(x, metrics.viewWidth - metrics.contentLeft - metrics.contentWidth);
    y = Math.max(y, metrics.viewHeight - metrics.contentTop - metrics.contentHeight);
    Blockly.mainWorkspace.scrollbar.set(-x - metrics.contentLeft, -y - metrics.contentTop)
  }
};
Blockly.onKeyDown_ = function(e) {
  if(Blockly.isTargetInput_(e)) {
    return
  }
  if(e.keyCode == 27) {
    Blockly.hideChaff()
  }else {
    if(e.keyCode == 8 || e.keyCode == 46) {
      try {
        if(Blockly.selected && Blockly.selected.isDeletable()) {
          Blockly.hideChaff();
          Blockly.selected.dispose(true, true)
        }
      }finally {
        e.preventDefault()
      }
    }else {
      if(e.altKey || (e.ctrlKey || e.metaKey)) {
        if(Blockly.selected && (Blockly.selected.isDeletable() && Blockly.selected.workspace == Blockly.mainWorkspace)) {
          Blockly.hideChaff();
          if(e.keyCode == 67) {
            Blockly.copy_(Blockly.selected)
          }else {
            if(e.keyCode == 88) {
              Blockly.copy_(Blockly.selected);
              Blockly.selected.dispose(true, true)
            }
          }
        }
        if(e.keyCode == 86) {
          if(Blockly.clipboard_) {
            Blockly.mainWorkspace.paste(Blockly.clipboard_)
          }
        }
      }
    }
  }
};
Blockly.terminateDrag_ = function() {
  Blockly.Block.terminateDrag_();
  Blockly.Flyout.terminateDrag_()
};
Blockly.copy_ = function(block) {
  var xmlBlock = Blockly.Xml.blockToDom_(block);
  Blockly.Xml.deleteNext(xmlBlock);
  var xy = block.getRelativeToSurfaceXY();
  xmlBlock.setAttribute("x", Blockly.RTL ? -xy.x : xy.x);
  xmlBlock.setAttribute("y", xy.y);
  Blockly.clipboard_ = xmlBlock
};
Blockly.showContextMenu_ = function(xy) {
  if(Blockly.readOnly) {
    return
  }
  var options = [];
  if(Blockly.collapse) {
    var hasCollapsedBlocks = false;
    var hasExpandedBlocks = false;
    var topBlocks = Blockly.mainWorkspace.getTopBlocks(false);
    for(var i = 0;i < topBlocks.length;i++) {
      if(topBlocks[i].isCollapsed()) {
        hasCollapsedBlocks = true
      }else {
        hasExpandedBlocks = true
      }
    }
    var collapseOption = {enabled:hasExpandedBlocks};
    collapseOption.text = Blockly.Msg.COLLAPSE_ALL;
    collapseOption.callback = function() {
      for(var i = 0;i < topBlocks.length;i++) {
        topBlocks[i].setCollapsed(true)
      }
    };
    options.push(collapseOption);
    var expandOption = {enabled:hasCollapsedBlocks};
    expandOption.text = Blockly.Msg.EXPAND_ALL;
    expandOption.callback = function() {
      for(var i = 0;i < topBlocks.length;i++) {
        topBlocks[i].setCollapsed(false)
      }
    };
    options.push(expandOption)
  }
  var helpOption = {enabled:false};
  helpOption.text = Blockly.Msg.HELP;
  helpOption.callback = function() {
  };
  options.push(helpOption);
  Blockly.ContextMenu.show(xy, options)
};
Blockly.onContextMenu_ = function(e) {
  if(!Blockly.isTargetInput_(e) && Blockly.ContextMenu) {
    e.preventDefault()
  }
};
Blockly.hideChaff = function(opt_allowToolbox) {
  Blockly.Tooltip && Blockly.Tooltip.hide();
  Blockly.ContextMenu && Blockly.ContextMenu.hide();
  Blockly.FieldDropdown && Blockly.FieldDropdown.hide();
  Blockly.WidgetDiv.hide();
  if(!opt_allowToolbox && (Blockly.Toolbox.flyout_ && Blockly.Toolbox.flyout_.autoClose)) {
    Blockly.Toolbox.clearSelection()
  }
};
Blockly.removeAllRanges = function() {
  if(window.getSelection) {
    var sel = window.getSelection();
    if(sel && sel.removeAllRanges) {
      sel.removeAllRanges();
      window.setTimeout(function() {
        window.getSelection().removeAllRanges()
      }, 0)
    }
  }
};
Blockly.isTargetInput_ = function(e) {
  return e.target.type == "textarea" || e.target.type == "text"
};
Blockly.onSoundLoad_ = function(request, name) {
  var onload = function() {
    Blockly.CONTEXT.decodeAudioData(request.response, function(buffer) {
      Blockly.SOUNDS_[name] = Blockly.createSoundFromBuffer_({buffer:buffer})
    })
  };
  return onload
};
Blockly.createSoundFromBuffer_ = function(options) {
  var source = Blockly.CONTEXT.createBufferSource();
  source.buffer = options.buffer;
  source.loop = options.loop;
  var gainNode = Blockly.CONTEXT.createGain();
  source.connect(gainNode);
  gainNode.connect(Blockly.CONTEXT.destination);
  gainNode.gain.value = options.volume || 1;
  return source
};
Blockly.loadWebAudio_ = function(filename, name) {
  var request = new XMLHttpRequest;
  request.open("GET", filename, true);
  request.responseType = "arraybuffer";
  request.onload = Blockly.onSoundLoad_(request, name);
  request.send()
};
Blockly.loadAudio_ = function(filenames, name) {
  if(window.Audio && filenames.length) {
    var audioTest = new window.Audio;
    for(var i = 0, filename;filename = filenames[i];i++) {
      var ext = filename.match(/\.(\w+)(\?.*)?$/);
      if(ext && audioTest.canPlayType("audio/" + ext[1])) {
        break
      }
    }
    if(filename) {
      if(window.AudioContext) {
        Blockly.loadWebAudio_(filename, name)
      }else {
        var sound = new window.Audio(filename);
        if(sound && sound.play) {
          if(!goog.userAgent.isDocumentMode(9)) {
            sound.play();
            sound.pause()
          }
          Blockly.SOUNDS_[name] = sound
        }
      }
    }
  }
};
Blockly.playAudio = function(name, options) {
  var sound = Blockly.SOUNDS_[name];
  var options = options || {};
  if(sound) {
    if(window.AudioContext) {
      options.buffer = sound.buffer;
      var newSound = Blockly.createSoundFromBuffer_(options);
      newSound.start ? newSound.start(0) : newSound.noteOn(0);
      Blockly.SOUNDS_[name] = newSound
    }else {
      if(!goog.userAgent.MOBILE) {
        sound.volume = options.volume !== undefined ? options.volume : 1;
        sound.loop = options.loop;
        sound.play()
      }
    }
  }
};
Blockly.stopLoopingAudio = function(name) {
  var sound = Blockly.SOUNDS_[name];
  try {
    if(sound) {
      if(sound.stop) {
        sound.stop(0)
      }else {
        if(sound.noteOff) {
          sound.noteOff(0)
        }else {
          sound.pause()
        }
      }
    }
  }catch(e) {
    if(e.name === "InvalidStateError") {
    }else {
      throw e;
    }
  }
};
Blockly.setCursorHand_ = function(closed) {
  if(Blockly.readOnly) {
    return
  }
  var cursor = "";
  if(closed) {
    cursor = "url(" + Blockly.assetUrl("media/handclosed.cur") + ") 7 3, auto"
  }
  if(Blockly.selected) {
    Blockly.selected.getSvgRoot().style.cursor = cursor
  }
  Blockly.svg.style.cursor = cursor
};
Blockly.getMainWorkspaceMetrics_ = function() {
  var svgSize = Blockly.svgSize();
  svgSize.width -= Blockly.Toolbox.width;
  var viewWidth = svgSize.width - Blockly.Scrollbar.scrollbarThickness;
  var viewHeight = svgSize.height - Blockly.Scrollbar.scrollbarThickness;
  try {
    if(Blockly.isMsie() || Blockly.isTrident()) {
      Blockly.mainWorkspace.getCanvas().style.display = "inline";
      var blockBox = {x:Blockly.mainWorkspace.getCanvas().getBBox().x, y:Blockly.mainWorkspace.getCanvas().getBBox().y, width:Blockly.mainWorkspace.getCanvas().scrollWidth, height:Blockly.mainWorkspace.getCanvas().scrollHeight}
    }else {
      var blockBox = Blockly.mainWorkspace.getCanvas().getBBox()
    }
  }catch(e) {
    return null
  }
  if(Blockly.mainWorkspace.scrollbar) {
    var leftEdge = Math.min(blockBox.x - viewWidth / 2, blockBox.x + blockBox.width - viewWidth);
    var rightEdge = Math.max(blockBox.x + blockBox.width + viewWidth / 2, blockBox.x + viewWidth);
    var topEdge = Math.min(blockBox.y - viewHeight / 2, blockBox.y + blockBox.height - viewHeight);
    var bottomEdge = Math.max(blockBox.y + blockBox.height + viewHeight / 2, blockBox.y + viewHeight)
  }else {
    var leftEdge = blockBox.x;
    var rightEdge = leftEdge + blockBox.width;
    var topEdge = blockBox.y;
    var bottomEdge = topEdge + blockBox.height
  }
  var absoluteLeft = Blockly.RTL ? 0 : Blockly.Toolbox.width;
  return{viewHeight:svgSize.height, viewWidth:svgSize.width, contentHeight:bottomEdge - topEdge, contentWidth:rightEdge - leftEdge, viewTop:-Blockly.mainWorkspace.pageYOffset, viewLeft:-Blockly.mainWorkspace.pageXOffset, contentTop:topEdge, contentLeft:leftEdge, absoluteTop:0, absoluteLeft:absoluteLeft}
};
Blockly.setMainWorkspaceMetrics_ = function(xyRatio) {
  if(!Blockly.mainWorkspace.scrollbar) {
    throw"Attempt to set main workspace scroll without scrollbars.";
  }
  var metrics = Blockly.getMainWorkspaceMetrics_();
  if(goog.isNumber(xyRatio.x)) {
    Blockly.mainWorkspace.pageXOffset = -metrics.contentWidth * xyRatio.x - metrics.contentLeft
  }
  if(goog.isNumber(xyRatio.y)) {
    Blockly.mainWorkspace.pageYOffset = -metrics.contentHeight * xyRatio.y - metrics.contentTop
  }
  var translation = "translate(" + (Blockly.mainWorkspace.pageXOffset + metrics.absoluteLeft) + "," + (Blockly.mainWorkspace.pageYOffset + metrics.absoluteTop) + ")";
  Blockly.mainWorkspace.getCanvas().setAttribute("transform", translation);
  Blockly.mainWorkspace.getBubbleCanvas().setAttribute("transform", translation)
};
Blockly.addChangeListener = function(func) {
  return Blockly.bindEvent_(Blockly.mainWorkspace.getCanvas(), "blocklyWorkspaceChange", null, func)
};
Blockly.removeChangeListener = function(bindData) {
  Blockly.unbindEvent_(bindData)
};

