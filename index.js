module.exports = {
  Template: Template
, Text: Text
, TextExpression: TextExpression
, Comment: Comment
, CommentExpression: CommentExpression
, Element: Element
, Block: Block
, ConditionalBlock: ConditionalBlock
, EachBlock: EachBlock

, Attribute: Attribute
, AttributeExpression: AttributeExpression
, PropertyExpression: PropertyExpression
, AttributesMap: AttributesMap

, Binding: Binding
, NodeBinding: NodeBinding
, AttributeBinding: AttributeBinding
, RangeBinding: RangeBinding
, replaceBindings: replaceBindings

, Expression: Expression
, ThisExpression: ThisExpression
, IfExpression: IfExpression
, UnlessExpression: UnlessExpression
, EachExpression: EachExpression
, ContextMeta: ContextMeta
, Context: Context
};

function Template(contents) {
  this.contents = contents;
}
Template.prototype.getHtml = function(context) {
  return contentsHtml(this.contents, context);
};
Template.prototype.getFragment = function(context, binding) {
  var fragment = document.createDocumentFragment();
  this.appendTo(fragment, context, binding);
  return fragment;
};
Template.prototype.appendTo = function(parent, context) {
  appendContents(parent, this.contents, context);
};

function Text(data) {
  this.data = data;
}
Text.prototype = new Template();
Text.prototype.getHtml = function() {
  return this.data;
};
Text.prototype.appendTo = function(parent) {
  var node = document.createTextNode(this.data);
  parent.appendChild(node);
};

function TextExpression(expression) {
  this.expression = expression;
}
TextExpression.prototype = new Template();
TextExpression.prototype.getHtml = function(context) {
  return context.get(this.expression) || '';
};
TextExpression.prototype.appendTo = function(parent, context) {
  var data = context.get(this.expression) || '';
  var node = document.createTextNode(data);
  parent.appendChild(node);
  context.onAdd(new NodeBinding(this, node));
};
TextExpression.prototype.update = function(context, binding) {
  binding.node.data = context.get(this.expression) || '';
};

function Comment(data) {
  this.data = data;
}
Comment.prototype = new Template();
Comment.prototype.getHtml = function() {
  return '<!--' + this.data + '-->';
};
Comment.prototype.appendTo = function(parent) {
  var node = document.createComment(this.data);
  parent.appendChild(node);
};

function CommentExpression(expression) {
  this.expression = expression;
}
CommentExpression.prototype = new Template();
CommentExpression.prototype.getHtml = function(context) {
  return '<!--' + (context.get(this.expression) || '') + '-->';
};
CommentExpression.prototype.appendTo = function(parent, context) {
  var data = context.get(this.expression) || '';
  var node = document.createComment(data);
  parent.appendChild(node);
  context.onAdd(new NodeBinding(this, node));
};
CommentExpression.prototype.update = function(context, binding) {
  binding.node.data = context.get(this.expression) || '';
};

function Attribute(data) {
  this.data = data;
}
Attribute.prototype.getHtml = Attribute.prototype.get = function(context) {
  return this.data;
};

function AttributeExpression(expression) {
  this.expression = expression;
}
AttributeExpression.prototype.getHtml = function(context) {
  return context.get(this.expression);
};
AttributeExpression.prototype.get = function(context, element, name) {
  context.onAdd(new AttributeBinding(this, element, name));
  return context.get(this.expression);
};
AttributeExpression.prototype.update = function(context, binding) {
  var value = context.get(this.expression);
  if (value === false || value == null) {
    binding.element.removeAttribute(binding.name);
  } else if (value === true) {
    binding.element.setAttribute(binding.name, binding.name);
  } else {
    binding.element.setAttribute(binding.name, value);
  }
};

function PropertyExpression(expression, property) {
  this.expression = expression;
  this.property = property;
}
PropertyExpression.prototype = new AttributeExpression();
PropertyExpression.prototype.update = function(context, binding) {
  var value = context.get(this.expression);
  binding.element[this.property] = (value == null) ? '' : value;
};

function AttributesMap(object) {
  if (!object) return;
  for (var key in object) {
    this[key] = object[key];
  }
}

function Element(tag, attributes, contents, isVoid) {
  this.tag = tag;
  this.attributes = attributes;
  this.contents = contents;
  this.isVoid = isVoid;
}
Element.prototype = new Template();
Element.prototype.getHtml = function(context) {
  var tagItems = [this.tag];
  for (var key in this.attributes) {
    var value = this.attributes[key].getHtml(context);
    if (value === true) {
      tagItems.push(key);
    } else if (value !== false && value != null) {
      tagItems.push(key + '="' + value + '"');
    }
  }
  var startTag = '<' + tagItems.join(' ') + '>';
  var endTag = '</' + this.tag + '>';
  if (this.contents) {
    var inner = contentsHtml(this.contents, context);
    return startTag + inner + endTag;
  }
  return (this.isVoid) ? startTag : startTag + endTag;
};
Element.prototype.appendTo = function(parent, context) {
  var element = document.createElement(this.tag);
  for (var key in this.attributes) {
    var value = this.attributes[key].get(context, element, key);
    if (value === true) {
      element.setAttribute(key, key);
    } else if (value !== false && value != null) {
      element.setAttribute(key, value);
    }
  }
  if (this.contents) appendContents(element, this.contents, context);
  parent.appendChild(element);
};

function Block(expression, contents) {
  this.expression = expression;
  this.ending = '/' + expression;
  this.contents = contents;
}
Block.prototype = new Template();
Block.prototype.getHtml = function(context) {
  var blockContext = context.child(this.expression);
  return '<!--' + this.expression + '-->' +
    contentsHtml(this.contents, blockContext) +
    '<!--' + this.ending + '-->';
};
Block.prototype.appendTo = function(parent, context, binding) {
  var blockContext = context.child(this.expression);
  var start = document.createComment(this.expression);
  var end = document.createComment(this.ending);
  parent.appendChild(start);
  appendContents(parent, this.contents, blockContext);
  parent.appendChild(end);
  updateRange(context, binding, this, start, end);
};
Block.prototype.update = function(context, binding) {
  // Get start and end in advance, since binding is mutated in getFragment
  var start = binding.start;
  var end = binding.end;
  var fragment = this.getFragment(context, binding);
  replaceRange(context, start, end, fragment, binding);
};

function ConditionalBlock(expressions, contents) {
  this.expressions = expressions;
  this.beginning = expressions[0];
  this.ending = '/' + this.beginning;
  this.contents = contents;
}
ConditionalBlock.prototype = new Block();
ConditionalBlock.prototype.getHtml = function(context) {
  var html = '<!--' + this.beginning + '-->';
  for (var i = 0, len = this.expressions.length; i < len; i++) {
    var blockContext = context.child(this.expressions[i]);
    if (blockContext.get()) {
      html += contentsHtml(this.contents[i], blockContext);
      break;
    }
  }
  return html + '<!--' + this.ending + '-->';
};
ConditionalBlock.prototype.appendTo = function(parent, context, binding) {
  var blockContext = context.child(this.expression);
  var start = document.createComment(this.beginning);
  var end = document.createComment(this.ending);
  parent.appendChild(start);
  for (var i = 0, len = this.expressions.length; i < len; i++) {
    var blockContext = context.child(this.expressions[i]);
    if (blockContext.get()) {
      appendContents(parent, this.contents[i], blockContext);
      break;
    }
  }
  parent.appendChild(end);
  updateRange(context, binding, this, start, end);
};

function EachBlock(expression, contents, elseContents) {
  this.expression = expression;
  this.ending = '/' + expression;
  this.contents = contents;
  this.elseContents = elseContents;
}
EachBlock.prototype = new Block();
EachBlock.prototype.getHtml = function(context) {
  var listContext = context.child(this.expression);
  var items = listContext.get();
  var html = '<!--' + this.expression + '-->';
  if (items && items.length) {
    for (var i = 0, len = items.length; i < len; i++) {
      var itemContext = listContext.child(i);
      html += contentsHtml(this.contents, itemContext) || '<!--empty-->';
    }
  } else if (this.elseContents) {
    html += contentsHtml(this.elseContents, listContext);
  }
  return html + '<!--' + this.ending + '-->';
};
EachBlock.prototype.appendTo = function(parent, context, binding) {
  var listContext = context.child(this.expression);
  var items = listContext.get();
  var start = document.createComment(this.expression);
  var end = document.createComment(this.ending);
  parent.appendChild(start);
  if (items && items.length) {
    for (var i = 0, len = items.length; i < len; i++) {
      var itemContext = listContext.child(i);
      this.appendItemTo(parent, itemContext);
    }
  } else if (this.elseContents) {
    appendContents(parent, this.elseContents, listContext);
  }
  parent.appendChild(end);
  updateRange(context, binding, this, start, end);
};
EachBlock.prototype.appendItemTo = function(parent, context, binding) {
  var before = parent.lastChild;
  var start, end;
  appendContents(parent, this.contents, context);
  if (before === parent.lastChild) {
    start = end = document.createComment('empty');
    parent.appendChild(start);
  } else {
    start = (before && before.nextSibling) || parent.firstChild;
    end = parent.lastChild;
  }
  updateRange(context, binding, this, start, end, true);
};
EachBlock.prototype.update = function(context, binding) {
  var start = binding.start;
  var end = binding.end;
  if (binding.isItem) {
    var fragment = document.createDocumentFragment();
    this.appendItemTo(fragment, context, binding);
  } else {
    var fragment = this.getFragment(context, binding);
  }
  replaceRange(context, start, end, fragment, binding);
};
EachBlock.prototype.insert = function(context, binding, index, howMany) {
  var listContext = context.child(this.expression);
  var items = listContext.get();
  var node = indexStartNode(binding.start, index, binding.end);
  var fragment = document.createDocumentFragment();
  for (var i = index, len = index + howMany; i < len; i++) {
    var itemContext = listContext.child(i);
    this.appendItemTo(fragment, itemContext);
  }
  binding.start.parentNode.insertBefore(fragment, node);
};
EachBlock.prototype.remove = function(context, binding, index, howMany) {
  var node = indexStartNode(binding.start, index, binding.end);
  var i = 0;
  var parent = binding.start.parentNode;
  while (node) {
    var nextNode = node.nextSibling;
    parent.removeChild(node);
    emitRemoved(context.events, node, binding);
    if (getNodeProperty(node, '$bindEnd')) {
      if (howMany === ++i) return;
    }
    node = nextNode;
  }
};
EachBlock.prototype.move = function(context, binding, from, to, howMany) {
  var node = indexStartNode(binding.start, from, binding.end);
  var fragment = document.createDocumentFragment();
  var i = 0;
  while (node) {
    var nextNode = node.nextSibling;
    fragment.appendChild(node);
    if (getNodeProperty(node, '$bindEnd')) {
      if (howMany === ++i) break;
    }
    node = nextNode;
  }
  node = indexStartNode(binding.start, to, binding.end);
  binding.start.parentNode.insertBefore(fragment, node);
};

function indexStartNode(node, index, endBound) {
  var i = 0;
  while (node = node.nextSibling) {
    if (node === endBound) return node;
    if (getNodeProperty(node, '$bindStart')) {
      if (index === i) return node;
      i++;
    }
  }
}

function updateRange(context, binding, template, start, end, isItem) {
  if (binding) {
    binding.start = start;
    binding.end = end;
    setNodeProperty(start, '$bindStart', binding);
    setNodeProperty(end, '$bindEnd', binding);
  } else {
    context.onAdd(new RangeBinding(template, start, end, isItem));
  }
}

function appendContents(parent, contents, context) {
  for (var i = 0, len = contents.length; i < len; i++) {
    contents[i].appendTo(parent, context);
  }
}
function contentsHtml(contents, context) {
  var html = '';
  for (var i = 0, len = contents.length; i < len; i++) {
    html += contents[i].getHtml(context);
  }
  return html;
}
function replaceRange(context, start, end, fragment, binding) {
  var parent = start.parentNode;
  if (start === end) {
    parent.replaceChild(fragment, start);
    emitRemoved(context, start, binding);
    return;
  }
  // Remove all nodes from start to end, inclusive
  var node = start;
  var nextNode;
  while (node) {
    nextNode = node.nextSibling;
    parent.removeChild(node);
    emitRemoved(context, node, binding);
    if (node === end) break;
    node = nextNode;
  }
  // This also works if nextNode is null, by doing an append
  parent.insertBefore(fragment, nextNode);
}
function emitRemoved(context, node, ignore) {
  var binding = getNodeProperty(node, '$bindNode');
  if (binding && binding !== ignore) context.onRemove(binding);
  binding = getNodeProperty(node, '$bindStart');
  if (binding && binding !== ignore) context.onRemove(binding);
  var attributes = getNodeProperty(node, '$bindAttributes');
  if (attributes) {
    for (var key in attributes) {
      context.onRemove(attributes[key]);
    }
  }
  for (node = node.firstChild; node; node = node.nextSibling) {
    emitRemoved(context, node, ignore);
  }
}

function Binding() {}
Binding.prototype.update = function(context) {
  this.template.update(context, this);
};

function NodeBinding(template, node) {
  this.template = template;
  this.node = node;
  setNodeProperty(node, '$bindNode', this);
  this.id = null;
}
NodeBinding.prototype = new Binding();

function AttributeBindingsMap() {}
function AttributeBinding(template, element, name) {
  this.template = template;
  this.element = element;
  this.name = name;
  var map = getNodeProperty(element, '$bindAttributes') ||
    (setNodeProperty(element, '$bindAttributes', new AttributeBindingsMap()));
  map[name] = this;
  this.id = null;
}
AttributeBinding.prototype = new Binding();

function RangeBinding(template, start, end, isItem) {
  this.template = template;
  this.start = start;
  this.end = end;
  this.isItem = isItem;
  setNodeProperty(start, '$bindStart', this);
  setNodeProperty(end, '$bindEnd', this);
  this.id = null;
}
RangeBinding.prototype = new Binding();
RangeBinding.prototype.insert = function(context, index, howMany) {
  this.template.insert(context, this, index, howMany);
};
RangeBinding.prototype.remove = function(context, index, howMany) {
  this.template.remove(context, this, index, howMany);
};
RangeBinding.prototype.move = function(context, from, to, howMany) {
  this.template.move(context, this, from, to, howMany);
};

// TODO: Detect if the DOM structures don't match and throw a useful error
function replaceBindings(fragment, mirror) {
  var node = fragment.firstChild;
  var mirrorNode = mirror.firstChild;
  var nextMirrorNode;
  do {
    nextMirrorNode = mirrorNode && mirrorNode.nextSibling;

    // If ELEMENT_NODE
    if (node.nodeType === 1) {
      replaceBindings(node, mirrorNode);

    // If TEXT_NODE
    } else if (node.nodeType === 3) {
      if (mirrorNode && mirrorNode.nodeType === 3) {
        if (node.data !== mirrorNode.data) {
          nextMirrorNode = splitData(mirrorNode, node.data.length);
        }
      } else {
        nextMirrorNode = mirrorNode;
        mirrorNode = document.createTextNode('');
        // Also works if nextMirrorNode is null
        mirror.insertBefore(mirrorNode, nextMirrorNode);
      }

    // If COMMENT_NODE
    } else if (node.nodeType === 8) {
      // IE sometimes doesn't create CommentNodes that are in HTML
      if (
        !mirrorNode ||
        (mirrorNode.nodeType !== 8) ||
        (node.data !== mirrorNode.data)
      ) {
        nextMirrorNode = mirrorNode;
        mirrorNode = node.cloneNode(false);
        mirror.insertBefore(mirrorNode, nextMirrorNode);
      }
    }

    // Move bindings on the fragment to the corresponding node on the mirror
    replaceNodeBindings(node, mirrorNode);

    mirrorNode = nextMirrorNode;
    node = node.nextSibling;
  } while (node);
}

function replaceNodeBindings(node, mirrorNode) {
  var binding = getNodeProperty(node, '$bindNode');
  if (binding) {
    binding.node = mirrorNode;
    setNodeProperty(node, '$bindNode', binding);
  }
  binding = getNodeProperty(node, '$bindStart');
  if (binding) {
    binding.start = mirrorNode;
    setNodeProperty(mirrorNode, '$bindStart', binding);
  }
  binding = getNodeProperty(node, '$bindEnd');
  if (binding) {
    binding.end = mirrorNode;
    setNodeProperty(mirrorNode, '$bindEnd', binding);
  }
  var attributes = getNodeProperty(node, '$bindAttributes');
  if (attributes) {
    for (var key in attributes) {
      attributes[key].element = mirrorNode;
    }
    setNodeProperty(mirrorNode, '$bindAttributes', attributes);
  }
}


// Expression & Context types should be implemented for the particular
// semantics of a templating language

function Expression(source) {
  this.source = source;
}
Expression.prototype.toString = function() {
  return this.source;
};
Expression.prototype.get = function(context) {
  return context.getProperty(this.source);
};

function ThisExpression() {}
ThisExpression.prototype.toString = function() {
  return 'this';
};
ThisExpression.prototype.get = function(context) {
  return context.get();
};

function IfExpression(source) {
  this.source = source;
  this.expression = new Expression(source);
}
IfExpression.prototype = new Expression;
IfExpression.prototype.toString = function() {
  return 'if ' + this.source;
};
IfExpression.prototype.get = function(context) {
  var value = this.expression.get(context);
  return (Array.isArray(value) && value.length === 0) ? null : value;
};

function UnlessExpression(source) {
  this.source = source;
  this.expression = new IfExpression(source);
}
UnlessExpression.prototype = new Expression;
UnlessExpression.prototype.toString = function() {
  return 'unless ' + this.source;
};
UnlessExpression.prototype.get = function(context) {
  return !this.expression.get(context);
};

function EachExpression(source) {
  this.source = source;
  this.expression = new Expression(source);
}
EachExpression.prototype = new Expression;
EachExpression.prototype.toString = function() {
  return 'each ' + this.source;
};
EachExpression.prototype.get = function(context) {
  return this.expression.get(context);
};

function ContextMeta(options) {
  this.onAdd = options.onAdd || noop;
  this.onRemove = options.onRemove || noop;
}

// Contexts should be user defined.
//
// The only mandatory functions in the context class are .child() and .get().
function Context(meta, data, parent) {
  this.meta = meta;
  this.data = data;
  this.parent = parent;
}
Context.prototype.onAdd = function(binding) {
  this.meta.onAdd(binding);
};
Context.prototype.onRemove = function(binding) {
  this.meta.onRemove(binding);
};
Context.prototype.get = function(expression) {
  return (expression == null) ? this.data :
    (expression instanceof Expression) ? expression.get(this) :
    this.getProperty(expression);
};
Context.prototype.getProperty = function(property) {
  return (this.data && this.data.hasOwnProperty(property)) ?
    this.data[property] :
    this.parent && this.parent.getProperty(property);
};
Context.prototype.child = function(expression) {
  var data = this.get(expression);
  return new Context(this.meta, data, this);
};

var setNodeProperty = function(node, key, value) {
  return node[key] = value;
};
var getNodeProperty = function(node, key) {
  return node[key];
};

//// IE shims & workarounds ////

if (!Array.isArray) {
  Array.isArray = function(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  };
}

function ObjectMapKeys() {}
function ObjectMapValues() {}
function ObjectMap() {
  this.count = 0;
  this.keys = new ObjectMapKeys();
  this.values = new ObjectMapValues();
}
ObjectMap.prototype.keyId = function(key) {
  var keys = this.keys;
  for (var id in keys) {
    if (keys[id] === key) return id;
  }
};
ObjectMap.prototype.add = function(key, value) {
  var id = (++this.count).toString();
  this.keys[id] = key;
  this.values[id] = value;
};
ObjectMap.prototype.remove = function(key) {
  var id = this.keyId(key);
  if (!id) return;
  delete this.keys[id];
  delete this.values[id];
};
ObjectMap.prototype.get = function(key) {
  var id = this.keyId(key);
  return id && this.values[id];
};
function NodeProperties() {}

try {
  // TEXT_NODEs are not expando prior to IE9
  document.createTextNode('').$try = 0;
} catch (err) {
  setNodeProperty = function(node, key, value) {
    // If TEXT_NODE
    if (node.nodeType === 3) {
      var parent = node.parentNode;
      var objectMap = parent.$bindMap || (parent.$bindMap = new ObjectMap());
      var nodeProperties = objectMap.get(node);
      if (nodeProperties) {
        return nodeProperties[key] = value;
      }
      nodeProperties = new NodeProperties();
      objectMap.add(node, nodeProperties);
      return nodeProperties[key] = value;
    }
    return node[key] = value;
  };
  getNodeProperty = function(node, key) {
    // If TEXT_NODE
    if (node.nodeType === 3) {
      var objectMap = node.parentNode.$bindMap;
      var nodeProperties = objectMap && objectMap.get(node);
      return nodeProperties && nodeProperties[key];
    }
    return node[key];
  };
}

// Equivalent to textNode.splitText, which is buggy in IE <=9
function splitData(node, index) {
  var newNode = node.cloneNode(false);
  newNode.deleteData(0, index);
  node.deleteData(index, node.length - index);
  node.parentNode.insertBefore(newNode, node.nextSibling);
  return newNode;
}

function noop() {}
