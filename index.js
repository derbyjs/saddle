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

  // Template Classes
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

  // Binding Classes
, Binding: Binding
, NodeBinding: NodeBinding
, AttributeBinding: AttributeBinding
, RangeBinding: RangeBinding

, replaceBindings: replaceBindings
};

function Template(content) {
  this.content = content;
}
Template.prototype.get = function(context, unescaped) {
  return contentHtml(this.content, context, unescaped);
};
Template.prototype.getFragment = function(context, binding) {
  var fragment = document.createDocumentFragment();
  this.appendTo(fragment, context, binding);
  return fragment;
};
Template.prototype.appendTo = function(parent, context) {
  appendContent(parent, this.content, context);
};
Template.prototype.stringify = function(value) {
  return (value == null) ? '' : value + '';
};

function Text(data) {
  this.data = data;
  this.escaped = escapeHtml(data);
}
Text.prototype = new Template();
Text.prototype.get = function(context, unescaped) {
  return (unescaped) ? this.data : this.escaped;
};
Text.prototype.appendTo = function(parent) {
  var node = document.createTextNode(this.data);
  parent.appendChild(node);
};

function DynamicText(expression) {
  this.expression = expression;
}
DynamicText.prototype = new Template();
DynamicText.prototype.get = function(context, unescaped) {
  var value = this.expression.get(context);
  if (value instanceof Template) {
    return value.get(context, unescaped);
  }
  var data = this.stringify(value);
  return (unescaped) ? data : escapeHtml(data);
};
DynamicText.prototype.appendTo = function(parent, context) {
  var value = this.expression.get(context);
  if (value instanceof Template) {
    value.appendTo(parent, context);
    return;
  }
  var data = this.stringify(value);
  var node = document.createTextNode(data);
  parent.appendChild(node);
  context.onAdd(new NodeBinding(this, context, node));
};
DynamicText.prototype.update = function(context, binding) {
  binding.node.data = this.stringify(this.expression.get(context));
};

function Comment(data) {
  this.data = data;
}
Comment.prototype = new Template();
Comment.prototype.get = function() {
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
DynamicComment.prototype.get = function(context) {
  var value = getUnescapedValue(this.expression, context);
  return '<!--' + this.stringify(value) + '-->';
};
DynamicComment.prototype.appendTo = function(parent, context) {
  var value = getUnescapedValue(this.expression, context);
  var node = document.createComment(this.stringify(value));
  parent.appendChild(node);
  context.onAdd(new NodeBinding(this, context, node));
};
DynamicComment.prototype.update = function(context, binding) {
  var value = getUnescapedValue(this.expression, context);
  binding.node.data = this.stringify(value);
};

function Attribute(data) {
  this.data = data;
}
Attribute.prototype.get = Attribute.prototype.getBound = function(context) {
  return this.data;
};

function DynamicAttribute(template) {
  // In attributes, template may be an instance of Template or Expression
  this.template = template;
}
DynamicAttribute.prototype.get = function(context) {
  return getUnescapedValue(this.template, context);
};
DynamicAttribute.prototype.getBound = function(context, element, name) {
  context.onAdd(new AttributeBinding(this, context, element, name));
  return getUnescapedValue(this.template, context);
};
DynamicAttribute.prototype.update = function(context, binding) {
  var value = getUnescapedValue(this.template, context);
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

function getUnescapedValue(expression, context) {
  var unescaped = true;
  var value = expression.get(context, unescaped);
  while (value instanceof Template) {
    value = value.get(context, unescaped);
  }
  return value;
}

function AttributesMap(object) {
  if (object) mergeInto(object, this);
}

function Element(tag, attributes, content) {
  this.tag = tag;
  this.attributes = attributes;
  this.content = content;
  this.isVoid = VOID_ELEMENTS[tag.toLowerCase()];
}
Element.prototype = new Template();
Element.prototype.get = function(context) {
  var tagItems = [this.tag];
  for (var key in this.attributes) {
    var value = this.attributes[key].get(context);
    if (value === true) {
      tagItems.push(key);
    } else if (value !== false && value != null) {
      tagItems.push(key + '="' + escapeAttribute(value) + '"');
    }
  }
  var startTag = '<' + tagItems.join(' ') + '>';
  var endTag = '</' + this.tag + '>';
  if (this.content) {
    var inner = contentHtml(this.content, context);
    return startTag + inner + endTag;
  }
  return (this.isVoid) ? startTag : startTag + endTag;
};
Element.prototype.appendTo = function(parent, context) {
  var element = document.createElement(this.tag);
  for (var key in this.attributes) {
    var value = this.attributes[key].getBound(context, element, key);
    var propertyName = CREATE_PROPERTIES[key];
    if (propertyName) {
      element[propertyName] = value;
    } else if (value === true) {
      element.setAttribute(key, key);
    } else if (value !== false && value != null) {
      element.setAttribute(key, value);
    }
  }
  if (this.content) appendContent(element, this.content, context);
  parent.appendChild(element);
};

function Block(expression, content) {
  this.expression = expression;
  this.ending = '/' + expression;
  this.content = content;
}
Block.prototype = new Template();
Block.prototype.get = function(context, unescaped) {
  var blockContext = context.child(this.expression);
  return contentHtml(this.content, blockContext, unescaped);
};
Block.prototype.appendTo = function(parent, context, binding) {
  var blockContext = context.child(this.expression);
  var start = document.createComment(this.expression);
  var end = document.createComment(this.ending);
  parent.appendChild(start);
  appendContent(parent, this.content, blockContext);
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
ConditionalBlock.prototype.get = function(context, unescaped) {
  var html = '';
  for (var i = 0, len = this.expressions.length; i < len; i++) {
    var expression = this.expressions[i];
    if (expression.truthy(context)) {
      html += contentHtml(this.contents[i], context.child(expression), unescaped);
      break;
    }
  }
  return html;
};
ConditionalBlock.prototype.appendTo = function(parent, context, binding) {
  var start = document.createComment(this.beginning);
  var end = document.createComment(this.ending);
  parent.appendChild(start);
  for (var i = 0, len = this.expressions.length; i < len; i++) {
    var expression = this.expressions[i];
    if (expression.truthy(context)) {
      appendContent(parent, this.contents[i], context.child(expression));
      break;
    }
  }
  parent.appendChild(end);
  updateRange(context, binding, this, start, end);
};

function EachBlock(expression, content, elseContent) {
  this.expression = expression;
  this.ending = '/' + expression;
  this.content = content;
  this.elseContent = elseContent;
}
EachBlock.prototype = new Block();
EachBlock.prototype.get = function(context, unescaped) {
  var items = this.expression.get(context);
  var listContext = context.child(this.expression);
  if (items && items.length) {
    var html = '';
    for (var i = 0, len = items.length; i < len; i++) {
      var itemContext = listContext.eachChild(i);
      html += contentHtml(this.content, itemContext, unescaped);
    }
    return html;
  } else if (this.elseContent) {
    return contentHtml(this.elseContent, listContext, unescaped);
  }
  return '';
};
EachBlock.prototype.appendTo = function(parent, context, binding) {
  var items = this.expression.get(context);
  var listContext = context.child(this.expression);
  var start = document.createComment(this.expression);
  var end = document.createComment(this.ending);
  parent.appendChild(start);
  if (items && items.length) {
    for (var i = 0, len = items.length; i < len; i++) {
      var itemContext = listContext.eachChild(i);
      this.appendItemTo(parent, itemContext);
    }
  } else if (this.elseContent) {
    appendContent(parent, this.elseContent, listContext);
  }
  parent.appendChild(end);
  updateRange(context, binding, this, start, end);
};
EachBlock.prototype.appendItemTo = function(parent, context, binding) {
  var before = parent.lastChild;
  var start, end;
  appendContent(parent, this.content, context);
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
  var items = this.expression.get(context);
  var listContext = context.child(this.expression);
  var node = indexStartNode(binding.start, index, binding.end);
  var fragment = document.createDocumentFragment();
  for (var i = index, len = index + howMany; i < len; i++) {
    var itemContext = listContext.eachChild(i);
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
    emitRemoved(context, node, binding);
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
    context.onAdd(new RangeBinding(template, context, start, end, isItem));
  }
}

function appendContent(parent, content, context) {
  for (var i = 0, len = content.length; i < len; i++) {
    content[i].appendTo(parent, context);
  }
}
function contentHtml(content, context, unescaped) {
  var html = '';
  for (var i = 0, len = content.length; i < len; i++) {
    html += content[i].get(context, unescaped);
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
Binding.prototype.update = function() {
  this.template.update(this.context, this);
};

function NodeBinding(template, context, node) {
  this.template = template;
  this.context = context;
  this.node = node;
  setNodeProperty(node, '$bindNode', this);
}
NodeBinding.prototype = new Binding();

function AttributeBindingsMap() {}
function AttributeBinding(template, context, element, name) {
  this.template = template;
  this.context = context;
  this.element = element;
  this.name = name;
  var map = element.$bindAttributes ||
    (element.$bindAttributes = new AttributeBindingsMap());
  map[name] = this;
}
AttributeBinding.prototype = new Binding();

function RangeBinding(template, context, start, end, isItem) {
  this.template = template;
  this.context = context;
  this.start = start;
  this.end = end;
  this.isItem = isItem;
  setNodeProperty(start, '$bindStart', this);
  setNodeProperty(end, '$bindEnd', this);
}
RangeBinding.prototype = new Binding();
RangeBinding.prototype.insert = function(index, howMany) {
  this.template.insert(this.context, this, index, howMany);
};
RangeBinding.prototype.remove = function(index, howMany) {
  this.template.remove(this.context, this, index, howMany);
};
RangeBinding.prototype.move = function(from, to, howMany) {
  this.template.move(this.context, this, from, to, howMany);
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

function escapeHtml(string) {
  return string.replace(/[&<]/g, function(match) {
    return (match === '&') ? '&amp;' : '&lt;';
  });
}

function escapeAttribute(string) {
  return string.replace(/[&"]/g, function(match) {
    return (match === '&') ? '&amp;' : '&quot;';
  });
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
