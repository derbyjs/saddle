function Item() {}
Item.prototype.getFragment = function(context, binding) {
  var fragment = document.createDocumentFragment();
  this.appendTo(fragment, context, binding);
  return fragment;
};

function Text(data) {
  this.data = data;
}
Text.prototype = new Item();
Text.prototype.getHtml = function() {
  return this.data;
};
Text.prototype.appendTo = function(parent) {
  var node = document.createTextNode(this.data);
  parent.appendChild(node);
};
Text.prototype.update = noop;

function TextExpression(source) {
  this.source = source;
}
TextExpression.prototype = new Item();
TextExpression.prototype.getHtml = function(context) {
  return context.get(this.source);
};
TextExpression.prototype.appendTo = function(parent, context) {
  var data = context.get(this.source);
  var node = document.createTextNode(data);
  parent.appendChild(node);
  context.saddle.emitAdd(new NodeBinding(this, node));
};
TextExpression.prototype.update = function(context, binding) {
  binding.node.data = context.get(this.source);
};

function Comment(data) {
  this.data = data;
}
Comment.prototype = new Item();
Comment.prototype.getHtml = function() {
  return '<!--' + this.data + '-->';
};
Comment.prototype.appendTo = function(parent) {
  var node = document.createComment(this.data);
  parent.appendChild(node);
};
Comment.prototype.update = noop;

function CommentExpression(source) {
  this.source = source;
}
CommentExpression.prototype = new Item();
CommentExpression.prototype.getHtml = function(context) {
  return '<!--' + context.get(this.source) + '-->';
};
CommentExpression.prototype.appendTo = function(parent, context) {
  var data = context.get(this.source);
  var node = document.createComment(data);
  parent.appendChild(node);
  context.saddle.emitAdd(new NodeBinding(this, node));
};
CommentExpression.prototype.update = function(context, binding) {
  binding.node.data = context.get(this.source);
};

function Attribute(data) {
  this.data = data;
}
Attribute.prototype.getHtml = Attribute.prototype.get = function(context) {
  return this.data;
};
Attribute.prototype.update = noop;

function AttributeExpression(source) {
  this.source = source;
}
AttributeExpression.prototype.getHtml = function(context) {
  return context.get(this.source);
};
AttributeExpression.prototype.get = function(context, element, name) {
  context.saddle.emitAdd(new AttributeBinding(this, element, name));
  return context.get(this.source);
};
AttributeExpression.prototype.update = function(context, binding) {
  var value = this.get(context);
  if (value == null) {
    binding.element.removeAttribute(binding.name);
  } else {
    binding.element.setAttribute(value);
  }
};

function AttributesMap(object) {
  if (!object) return;
  for (var key in object) {
    this[key] = object[key];
  }
}

function Element(tag, attributes, contents) {
  this.tag = tag;
  this.attributes = attributes;
  this.contents = contents;
}
Element.prototype = new Item();
Element.prototype.getHtml = function(context) {
  var tagItems = [this.tag];
  for (var key in this.attributes) {
    var value = this.attributes[key].getHtml(context);
    if (value != null) tagItems.push(key + '="' + value + '"');
  }
  var startTag = '<' + tagItems.join(' ') + '>';
  var endTag = '</' + this.tag + '>';
  if (this.contents) {
    var inner = contentsHtml(this.contents, context);
    return startTag + inner + endTag;
  }
  return startTag + endTag;
};
Element.prototype.appendTo = function(parent, context) {
  var element = document.createElement(this.tag);
  for (var key in this.attributes) {
    var value = this.attributes[key].get(context, element, key);
    element.setAttribute(key, value);
  }
  if (this.contents) appendContents(element, this.contents, context);
  parent.appendChild(element);
};

function Block(source, contents) {
  this.source = source;
  this.ending = 'end ' + source;
  this.contents = contents;
}
Block.prototype = new Item();
Block.prototype.getHtml = function(context) {
  var blockContext = childContext(context, this.source);
  return '<!--' + this.source + '-->' +
    contentsHtml(this.contents, blockContext) +
    '<!--' + this.ending + '-->';
};
Block.prototype.appendTo = function(parent, context, binding) {
  var blockContext = childContext(context, this.source);
  var start = document.createComment(this.source);
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
  replaceRange(start, end, fragment);
};

function EachBlock(source, contents) {
  this.source = source;
  this.ending = 'end ' + source;
  this.contents = contents;
}
EachBlock.prototype = new Item();
EachBlock.prototype.getHtml = function(context) {
  var listContext = childContext(context, this.source);
  var items = listContext.get();
  var html = '<!--' + this.source + '-->';
  for (var i = 0, len = items.length; i < len; i++) {
    var itemContext = childContext(listContext, i);
    html += contentsHtml(this.contents, itemContext) || '<!--empty-->';
  }
  return html + '<!--' + this.ending + '-->';
};
EachBlock.prototype.appendItemTo = function(parent, context, index, binding) {
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
  updateRange(context, binding, this, start, end, index);
};
EachBlock.prototype.appendTo = function(parent, context, binding) {
  var listContext = childContext(context, this.source);
  var items = listContext.get();
  var start = document.createComment(this.source);
  var end = document.createComment(this.ending);
  parent.appendChild(start);
  for (var i = 0, len = items.length; i < len; i++) {
    var itemContext = childContext(listContext, i);
    this.appendItemTo(parent, itemContext, i);
  }
  parent.appendChild(end);
  updateRange(context, binding, this, start, end);
};
EachBlock.prototype.update = function(context, binding) {
  var start = binding.start;
  var end = binding.end;
  if (binding.index == null) {
    var fragment = this.getFragment(context, binding);
  } else {
    var fragment = document.createDocumentFragment();
    this.appendItemTo(fragment, context, binding.index, binding);
  }
  replaceRange(start, end, fragment);
};

function updateRange(context, binding, template, start, end, index) {
  if (binding) {
    binding.start = start;
    binding.end = end;
    start.$saddleStart = binding;
    end.$saddleEnd = binding;
  } else {
    context.saddle.emitAdd(new RangeBinding(template, start, end, index));
  }
}

function Template(contents) {
  this.contents = contents;
}
Template.prototype.getHtml = function(context) {
  return contentsHtml(this.contents, context);
};
Template.prototype.getFragment = function(context) {
  var fragment = document.createDocumentFragment();
  appendContents(fragment, this.contents, context);
  return fragment;
};

function appendContents(parent, contents, context) {
  for (var i = 0, len = contents.length; i < len; i++) {
    contents[i].appendTo(parent, context);
  }
}
function contentsHtml(contents, context) {
  if (context == null) return '';
  var html = '';
  for (var i = 0, len = contents.length; i < len; i++) {
    html += contents[i].getHtml(context);
  }
  return html;
}
function replaceRange(start, end, fragment) {
  var parent = start.parentNode;
  if (start === end) {
    parent.replaceChild(fragment, start);
    return;
  }
  // Remove all nodes from start to end, inclusive
  var node = start;
  var nextNode;
  while (node) {
    nextNode = node.nextSibling;
    parent.removeChild(node);
    if (node === end) break;
    node = nextNode;
  }
  // This also works if nextNode is null, by doing an append
  parent.insertBefore(fragment, nextNode);
}

function BindingsMap() {}
function noop() {}

function Saddle(options) {
  this.onAdd = (options && options.onAdd) || noop;
  this.onRemove = (options && options.onRemove) || noop;
  this.onUpdate = (options && options.onUpdate) || noop;
}
Saddle.prototype.emitAdd = function(binding) {
  this.onAdd(binding);
};
Saddle.prototype.emitRemove = function(binding) {
  this.onRemove(binding);
};
Saddle.prototype.emitUpdate = function(binding) {
  this.onUpdate(binding);
};
Saddle.prototype.createContext = function(data) {
  return new Context(this, data);
};
Saddle.prototype.update = function(binding, data) {
  binding.update(this.createContext(data));
};
Saddle.prototype.getHtml = function(item, data) {
  return item.getHtml(this.createContext(data));
};
Saddle.prototype.getFragment = function(item, data) {
  return item.getFragment(this.createContext(data));
};

function Binding() {}
Binding.prototype.update = function(context) {
  this.template.update(context, this);
  context.saddle.emitUpdate(this);
};

function NodeBinding(template, node) {
  this.template = template;
  this.node = node;
  node.$saddleNode = this;
}
NodeBinding.prototype = new Binding();

function AttributeBindingsMap() {}

function AttributeBinding(template, element, name) {
  this.template = template;
  this.element = element;
  this.name = name;
  var map = element.$saddleAttributes ||
    (element.$saddleAttributes = new AttributeBindingsMap());
  map[name] = this;
}
AttributeBinding.prototype = new Binding();

function RangeBinding(template, start, end, index) {
  this.template = template;
  this.start = start;
  this.end = end;
  this.index = index;
  start.$saddleStart = this;
  end.$saddleEnd = this;
}
RangeBinding.prototype = new Binding();

function Context(saddle, data, parent) {
  this.saddle = saddle;
  this.data = data;
  this.parent = parent;
}
Context.prototype.get = function(name) {
  if (name == null) return this.data;
  return this.data[name];
};

function childContext(parent, name) {
  var data = parent.get(name);
  return new Context(parent.saddle, data, parent);
}

function replaceBindings(fragment, mirror) {
  var node = fragment.firstChild;
  var mirrorNode = mirror.firstChild;
  var nextMirrorNode;
  do {
    nextMirrorNode = mirrorNode.nextSibling;

    // Move bindings on the fragment to the corresponding node on the mirror
    replaceNodeBindings(node, mirrorNode);

    // If ELEMENT_NODE
    if (node.nodeType === 1) {
      replaceBindings(node, mirrorNode);

    // If TEXT_NODE
    } else if (node.nodeType === 3) {
      if (node.data !== mirrorNode.data) {
        nextMirrorNode = mirrorNode.splitText(node.data.length);
      }
    }
    mirrorNode = nextMirrorNode;
    node = node.nextSibling;
  } while (node);
}

function replaceNodeBindings(node, mirrorNode) {
  var binding = node.$saddleNode;
  if (binding) {
    binding.node = mirrorNode;
    mirrorNode.$saddleNode = binding;
  }
  binding = node.$saddleStart;
  if (binding) {
    binding.start = mirrorNode;
    mirrorNode.$saddleStart = binding;
  }
  binding = node.$saddleEnd;
  if (binding) {
    binding.end = mirrorNode;
    mirrorNode.$saddleEnd = binding;
  }
  var attributes = node.$saddleAttributes;
  if (attributes) {
    for (var key in attributes) {
      attributes[key].element = mirrorNode;
    }
    mirrorNode.$saddleAttributes = attributes;
  }
}
