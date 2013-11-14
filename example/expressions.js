module.exports = {
  Expression: Expression
, ElseExpression: ElseExpression
, Context: Context
};

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
  return (this.source == null) ? context.data : context._get(this.source);
};
Expression.prototype.truthy = function(context) {
  return templateTruthy(this.get(context));
};
Expression.prototype.serialize = function() {
  return this.serializer({
    ctor: 'Expression',
    values: [this.source]
  });
};

function ElseExpression() {}
ElseExpression.prototype = new Expression();
ElseExpression.prototype.truthy = function() {
  return true;
};
ElseExpression.prototype.serialize = function() {
  return this.serializer({
    ctor: 'ElseExpression',
    values: []
  });
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
//   Context::addBinding(binding)
//   Context::removeBinding(binding)
//   Context::child(expression)
//   Context::eachChild(index)
function Context(meta, data, parent) {
  this.meta = meta;
  this.data = data;
  this.parent = parent;
}
Context.prototype.addBinding = function(binding) {
  this.meta.addBinding(binding);
};
Context.prototype.removeBinding = function(binding) {
  this.meta.removeBinding(binding);
};
Context.prototype.child = function(expression) {
  var data = expression.get(this);
  return new Context(this.meta, data, this);
};
Context.prototype.eachChild = function(index) {
  var data = this.data[index];
  return new Context(this.meta, data, this);
};
Context.prototype._get = function(property) {
  return (this.data && this.data.hasOwnProperty(property)) ?
    this.data[property] :
    this.parent && this.parent._get(property);
};
Context.prototype.serialize = function() {
  return this.serializer({
    ctor: 'Context',
    values: [this.meta, this.data, this.parent]
  });
};

