// UPDATE_PROPERTIES map HTML attribute names to an Element DOM property that
// should be used for setting on bindings updates instead of setAttribute.
//
// https://github.com/jquery/jquery/blob/1.x-master/src/attributes/prop.js
// https://github.com/jquery/jquery/blob/master/src/attributes/prop.js
// http://webbugtrack.blogspot.com/2007/08/bug-242-setattribute-doesnt-always-work.html
var UPDATE_PROPERTIES = {
  checked: 'checked'
, disabled: 'disabled'
, selected: 'selected'
, type: 'type'
, value: 'value'
, 'class': 'className'
, 'for': 'htmlFor'
, tabindex: 'tabIndex'
, readonly: 'readOnly'
, maxlength: 'maxLength'
, cellspacing: 'cellSpacing'
, cellpadding: 'cellPadding'
, rowspan: 'rowSpan'
, colspan: 'colSpan'
, usemap: 'useMap'
, frameborder: 'frameBorder'
, contenteditable: 'contentEditable'
, enctype: 'encoding'
, id: 'id'
, title: 'title'
};
// CREATE_PROPERTIES map HTML attribute names to an Element DOM property that
// should be used for setting on Element rendering instead of setAttribute.
// input.defaultChecked and input.defaultValue affect the attribute, so we want
// to use these for initial dynamic rendering. For binding updates,
// input.checked and input.value are modified.
var CREATE_PROPERTIES = {};
mergeInto(UPDATE_PROPERTIES, CREATE_PROPERTIES);
CREATE_PROPERTIES.checked = 'defaultChecked';
CREATE_PROPERTIES.value = 'defaultValue';

// http://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
var VOID_ELEMENTS = {
  area: true
, base: true
, br: true
, col: true
, embed: true
, hr: true
, img: true
, input: true
, keygen: true
, link: true
, menuitem: true
, meta: true
, param: true
, source: true
, track: true
, wbr: true
};

module.exports = {
  CREATE_PROPERTIES: CREATE_PROPERTIES
, UPDATE_PROPERTIES: UPDATE_PROPERTIES
, VOID_ELEMENTS: VOID_ELEMENTS

, Template: Template
, Text: Text
, DynamicText: DynamicText
, Comment: Comment
, DynamicComment: DynamicComment
, Element: Element
, Block: Block
, ConditionalBlock: ConditionalBlock
, EachBlock: EachBlock

, Attribute: Attribute
, DynamicAttribute: DynamicAttribute
, AttributesMap: AttributesMap

, Binding: Binding
, NodeBinding: NodeBinding
, AttributeBinding: AttributeBinding
, RangeBinding: RangeBinding
, replaceBindings: replaceBindings

, Expression: Expression
, ElseExpression: ElseExpression
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

function DynamicText(expression) {
  this.expression = expression;
}
DynamicText.prototype = new Template();
DynamicText.prototype.getHtml = function(context) {
  return context.get(this.expression) || '';
};
DynamicText.prototype.appendTo = function(parent, context) {
  var data = context.get(this.expression) || '';
  var node = document.createTextNode(data);
  parent.appendChild(node);
  context.onAdd(new NodeBinding(this, node));
};
DynamicText.prototype.update = function(context, binding) {
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

function DynamicComment(expression) {
  this.expression = expression;
}
DynamicComment.prototype = new Template();
DynamicComment.prototype.getHtml = function(context) {
  return '<!--' + (context.get(this.expression) || '') + '-->';
};
DynamicComment.prototype.appendTo = function(parent, context) {
  var data = context.get(this.expression) || '';
  var node = document.createComment(data);
  parent.appendChild(node);
  context.onAdd(new NodeBinding(this, node));
};
DynamicComment.prototype.update = function(context, binding) {
  binding.node.data = context.get(this.expression) || '';
};

function Attribute(data) {
  this.data = data;
}
Attribute.prototype.getHtml = Attribute.prototype.get = function(context) {
  return this.data;
};

function DynamicAttribute(expression) {
  this.expression = expression;
}
DynamicAttribute.prototype.getHtml = function(context) {
  return context.get(this.expression);
};
DynamicAttribute.prototype.get = function(context, element, name) {
  context.onAdd(new AttributeBinding(this, element, name));
  return context.get(this.expression);
};
DynamicAttribute.prototype.update = function(context, binding) {
  var value = context.get(this.expression);
  var propertyName = UPDATE_PROPERTIES[binding.name];
  if (propertyName) {
    binding.element[propertyName] = value;
  } else if (value === false || value == null) {
    binding.element.removeAttribute(binding.name);
  } else if (value === true) {
    binding.element.setAttribute(binding.name, binding.name);
  } else {
    binding.element.setAttribute(binding.name, value);
  }
};

function AttributesMap(object) {
  if (object) mergeInto(object, this);
}

function Element(tag, attributes, contents) {
  this.tag = tag;
  this.attributes = attributes;
  this.contents = contents;
  this.isVoid = VOID_ELEMENTS[tag.toLowerCase()];
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
    var propertyName = CREATE_PROPERTIES[key];
    if (propertyName) {
      element[propertyName] = value;
    } else if (value === true) {
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
  return contentsHtml(this.contents, blockContext);
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
  var html = '';
  for (var i = 0, len = this.expressions.length; i < len; i++) {
    var expression = this.expressions[i];
    if (expression.truthy(context)) {
      html += contentsHtml(this.contents[i], context.child(expression));
      break;
    }
  }
  return html;
};
ConditionalBlock.prototype.appendTo = function(parent, context, binding) {
  var blockContext = context.child(this.expression);
  var start = document.createComment(this.beginning);
  var end = document.createComment(this.ending);
  parent.appendChild(start);
  for (var i = 0, len = this.expressions.length; i < len; i++) {
    var expression = this.expressions[i];
    if (expression.truthy(context)) {
      appendContents(parent, this.contents[i], context.child(expression));
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
  if (items && items.length) {
    var html = '';
    for (var i = 0, len = items.length; i < len; i++) {
      var itemContext = listContext.child(i);
      html += contentsHtml(this.contents, itemContext);
    }
    return html;
  } else if (this.elseContents) {
    return contentsHtml(this.elseContents, listContext);
  }
  return '';
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
    if (node.$bindEnd) {
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
    if (node.$bindEnd) {
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
    if (node.$bindStart) {
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
    emitRemoved(context, node, binding);
    parent.removeChild(node);
    if (node === end) break;
    node = nextNode;
  }
  // This also works if nextNode is null, by doing an append
  parent.insertBefore(fragment, nextNode);
}
function emitRemoved(context, node, ignore) {
  var binding = node.$bindNode;
  if (binding && binding !== ignore) context.onRemove(binding);
  binding = node.$bindStart;
  if (binding && binding !== ignore) context.onRemove(binding);
  var attributes = node.$bindAttributes;
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
  var map = element.$bindAttributes ||
    (element.$bindAttributes = new AttributeBindingsMap());
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


//// HTML page initialization ////

function replaceBindings(fragment, mirror) {
  var node = fragment.firstChild;
  var mirrorNode = mirror.firstChild;
  var nextMirrorNode;
  do {
    nextMirrorNode = mirrorNode && mirrorNode.nextSibling;

    // Split or create empty TextNodes as needed
    if (node.nodeType === 3) {
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

    // Create missing CommentNodes. Comments are used as DOM location markers
    // when rendering bindings, but not when rendering HTML. In addition, old
    // versions of IE fail to create some CommentNodes when parsing HTML
    } else if (node.nodeType === 8) {
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

    // Verify that the nodes are equivalent
    if (mismatchedNodes(node, mirrorNode)) {
      throw new Error('Attaching bindings failed, because HTML structure ' +
        'does not match client rendering'
      );
    }

    // Move bindings on the fragment to the corresponding node on the mirror
    replaceNodeBindings(node, mirrorNode);

    // Recursively traverse within Elements
    if (node.nodeType === 1 && node.hasChildNodes()) {
      replaceBindings(node, mirrorNode);
    }

    mirrorNode = nextMirrorNode;
    node = node.nextSibling;
  } while (node);
}

function mismatchedNodes(node, mirrorNode) {
  // Check that nodes are of matching types
  if (!node || !mirrorNode) return true;
  var type = node.nodeType;
  if (type !== mirrorNode.nodeType) return true;

  // Check that elements are of the same element type
  if (type === 1) {
    if (node.tagName !== mirrorNode.tagName) return true;

  // Check that TextNodes and CommentNodes have the same content
  } else if (type === 3 || type === 8) {
    if (node.data !== mirrorNode.data) return true;
  }
}

function replaceNodeBindings(node, mirrorNode) {
  var binding = node.$bindNode;
  if (binding) {
    binding.node = mirrorNode;
    setNodeProperty(node, '$bindNode', binding);
  }
  binding = node.$bindStart;
  if (binding) {
    binding.start = mirrorNode;
    setNodeProperty(mirrorNode, '$bindStart', binding);
  }
  binding = node.$bindEnd;
  if (binding) {
    binding.end = mirrorNode;
    setNodeProperty(mirrorNode, '$bindEnd', binding);
  }
  var attributes = node.$bindAttributes;
  if (attributes) {
    for (var key in attributes) {
      attributes[key].element = mirrorNode;
    }
    mirrorNode.$bindAttributes = attributes;
  }
}


//// Utility functions ////

function noop() {}

function mergeInto(from, to) {
  for (var key in from) {
    to[key] = from[key];
  }
}


//// Example framework-specific classes ////

// Expression classes should be implemented specific to the containing
// framework's data model and expression semantics. They are created when
// templates are instantiated, so any source string parsing that can be done
// once should be performed by the Expression constructor. This is an example
// set of expresions, but a framework can have an arbitrary number of
// expression types.
//
// The required interface methods are:
//   Expression(source)
//   Expression::toString()
//   Expression::get(context)
//   Expression::truthy(context)
function Expression(source) {
  this.source = source;
}
Expression.prototype.toString = function() {
  return this.source;
};
Expression.prototype.get = function(context) {
  return (this.source) ?
    context._getProperty(this.source) :
    context.get();
};
Expression.prototype.truthy = function(context) {
  return templateTruthy(this.get(context));
};

function ElseExpression() {}
ElseExpression.prototype = new Expression();
ElseExpression.prototype.truthy = function() {
  return true;
};

function templateTruthy(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value != null && value !== false && value !== '';
}

// Context classes should be implemented specific to the containing framework's
// data model and expression semantics. Context objects are created at render
// and binding update time, so they should be fast and minimally complex.
// Framework specific work, such as parsing template language specific syntax,
// should be done in Expression object instantiation whenever possible.
//
// The required interface methods are:
//   Context::onAdd(binding)
//   Context::onRemove(binding)
//   Context::child(object)
//   Context::get(object)
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
Context.prototype.child = function(value) {
  var data = this.get(value);
  return new Context(this.meta, data, this);
};
Context.prototype.get = function(value) {
  return (value == null) ? this.data :
    (value instanceof Expression) ? value.get(this) :
    this._getProperty(value);
};
Context.prototype._getProperty = function(property) {
  return (this.data && this.data.hasOwnProperty(property)) ?
    this.data[property] :
    this.parent && this.parent._getProperty(property);
};
function ContextMeta(options) {
  this.onAdd = options.onAdd || noop;
  this.onRemove = options.onRemove || noop;
}


//// IE shims & workarounds ////

if (!Array.isArray) {
  Array.isArray = function(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
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

// Defined so that it can be overriden in IE <=8
function setNodeProperty(node, key, value) {
  return node[key] = value;
}

(function() {
  // Don't try to shim in Node.js environment
  if (typeof document === 'undefined') return;

  // TODO: Shim setAttribute('style'), which doesn't work in IE <=7
  // http://webbugtrack.blogspot.com/2007/10/bug-245-setattribute-style-does-not.html

  // TODO: Investigate whether input name attribute works in IE <=7. We could
  // override Element::appendTo to use IE's alternative createElement syntax:
  // document.createElement('<input name="xxx">')
  // http://webbugtrack.blogspot.com/2007/10/bug-235-createelement-is-broken-in-ie.html

  // In IE, input.defaultValue doesn't work correctly, so use input.value,
  // which mistakenly but conveniently sets both the value property and attribute.
  // 
  // Surprisingly, in IE <=7, input.defaultChecked must be used instead of
  // input.checked before the input is in the document.
  // http://webbugtrack.blogspot.com/2007/11/bug-299-setattribute-checked-does-not.html
  var input = document.createElement('input');
  input.defaultValue = 'x';
  if (input.value !== 'x') {
    CREATE_PROPERTIES.value = 'value';
  }

  try {
    // TextNodes are not expando in IE <=8
    document.createTextNode('').$try = 0;
  } catch (err) {
    setNodeProperty = function(node, key, value) {
      // If trying to set a property on a TextNode, create a proxy CommentNode
      // and set the property on that node instead. Put the proxy after the
      // TextNode if marking the end of a range, and before otherwise.
      if (node.nodeType === 3) {
        var proxyNode;
        if (key === '$bindEnd') {
          proxyNode = node.nextSibling;
          if (!proxyNode || proxyNode.$bindProxy !== node) {
            proxyNode = document.createComment('proxy');
            proxyNode.$bindProxy = node;
            node.parentNode.insertBefore(proxyNode, node.nextSibling);
          }
        } else {
          proxyNode = node.previousSibling;
          if (!proxyNode || proxyNode.$bindProxy !== node) {
            proxyNode = document.createComment('proxy');
            proxyNode.$bindProxy = node;
            node.parentNode.insertBefore(proxyNode, node);
          }
        }
        return proxyNode[key] = value;
      }
      // Set the property directly on other node types
      return node[key] = value;
    };
  }
})();
