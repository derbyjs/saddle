describe('HTML rendering', function() {
  testRenderedHtml(function test(options) {
    var html = options.template.getHtml();
    expect(html).equal(options.html);
  });
});

describe('Fragment rendering', function() {
  testRenderedHtml(function test(options) {
    var fragment = options.template.getFragment();
    options.fragment(fragment);
  });
});

function testRenderedHtml(test) {
  it('renders an empty div', function() {
    test({
      template: new saddle.Element('div')
    , html: '<div></div>'
    , fragment: function(fragment) {
        expect(fragment.childNodes.length).equal(1);
        expect(fragment.childNodes[0].tagName.toLowerCase()).equal('div');
      }
    });
  });

  it('renders a void element', function() {
    test({
      template: new saddle.Element('br')
    , html: '<br>'
    , fragment: function(fragment) {
        expect(fragment.childNodes.length).equal(1);
        expect(fragment.childNodes[0].tagName.toLowerCase()).equal('br');
      }
    });
  });

  it('renders a div with literal attributes', function() {
    test({
      template: new saddle.Element('div', new saddle.AttributesMap({
        id: new saddle.Attribute('page')
      , 'data-x': new saddle.Attribute('24')
      , 'class': new saddle.Attribute('content fit')
      }))
    , html: '<div id="page" data-x="24" class="content fit"></div>'
    , fragment: function(fragment) {
        expect(fragment.childNodes.length).equal(1);
        expect(fragment.childNodes[0].tagName.toLowerCase()).equal('div');
        expect(fragment.childNodes[0].id).equal('page');
        expect(fragment.childNodes[0].className).equal('content fit');
        expect(fragment.childNodes[0].getAttribute('data-x')).equal('24');
      }
    });
  });

  it('renders a true boolean attribute', function() {
    test({
      template: new saddle.Element('input', new saddle.AttributesMap({
        autofocus: new saddle.Attribute(true)
      }))
    , html: '<input autofocus>'
    , fragment: function(fragment) {
        expect(fragment.childNodes.length).equal(1);
        expect(fragment.childNodes[0].tagName.toLowerCase()).equal('input');
        expect(fragment.childNodes[0].getAttribute('autofocus')).not.eql(null);
      }
    });
  });

  it('renders a false boolean attribute', function() {
    test({
      template: new saddle.Element('input', new saddle.AttributesMap({
        autofocus: new saddle.Attribute(false)
      }))
    , html: '<input>'
    , fragment: function(fragment) {
        expect(fragment.childNodes.length).equal(1);
        expect(fragment.childNodes[0].tagName.toLowerCase()).equal('input');
        expect(fragment.childNodes[0].getAttribute('autofocus')).eql(null);
      }
    });
  });

  it('renders nested elements', function() {
    test({
      template: new saddle.Element('div', null, [
        new saddle.Element('div', null, [
          new saddle.Element('span')
        , new saddle.Element('span')
        ])
      ])
    , html: '<div><div><span></span><span></span></div></div>'
    , fragment: function(fragment) {
        expect(fragment.childNodes.length).equal(1);
        var node = fragment.childNodes[0];
        expect(node.tagName.toLowerCase()).equal('div');
        expect(node.childNodes.length).equal(1);
        var node = node.childNodes[0];
        expect(node.tagName.toLowerCase()).equal('div');
        expect(node.childNodes.length).equal(2);
        expect(node.childNodes[0].tagName.toLowerCase()).equal('span');
        expect(node.childNodes[0].childNodes.length).equal(0);
        expect(node.childNodes[1].tagName.toLowerCase()).equal('span');
        expect(node.childNodes[1].childNodes.length).equal(0);
      }
    });
  });

  it('renders a text node', function() {
    test({
      template: new saddle.Text('Hi')
    , html: 'Hi'
    , fragment: function(fragment) {
        expect(fragment.childNodes.length).equal(1);
        expect(fragment.childNodes[0].nodeType).equal(3);
        expect(fragment.childNodes[0].data).equal('Hi');
      }
    });
  });

  it('renders text nodes in an element', function() {
    test({
      template: new saddle.Element('div', null, [
        new saddle.Text('Hello, ')
      , new saddle.Text('world.')
      ])
    , html: '<div>Hello, world.</div>'
    , fragment: function(fragment) {
        expect(fragment.childNodes.length).equal(1);
        var node = fragment.childNodes[0];
        expect(node.tagName.toLowerCase()).equal('div');
        expect(node.childNodes.length).equal(2);
        expect(node.childNodes[0].nodeType).equal(3);
        expect(node.childNodes[0].data).equal('Hello, ');
        expect(node.childNodes[1].nodeType).equal(3);
        expect(node.childNodes[1].data).equal('world.');
      }
    });
  });

  it('renders a comment', function() {
    test({
      template: new saddle.Comment('Hi')
    , html: '<!--Hi-->'
    , fragment: function(fragment) {
        expect(fragment.childNodes.length).equal(1);
        expect(fragment.childNodes[0].nodeType).equal(8);
        expect(fragment.childNodes[0].data).equal('Hi');
      }
    });
  });

  it('renders a template', function() {
    test({
      template: new saddle.Template([
        new saddle.Comment('Hi')
      , new saddle.Element('div', null, [
          new saddle.Text('Ho')
        ])
      ])
    , html: '<!--Hi--><div>Ho</div>'
    , fragment: function(fragment) {
        expect(fragment.childNodes.length).equal(2);
        expect(fragment.childNodes[0].nodeType).equal(8);
        expect(fragment.childNodes[0].data).equal('Hi');
        var node = fragment.childNodes[1];
        expect(node.tagName.toLowerCase()).equal('div');
        expect(node.childNodes.length).equal(1);
        expect(node.childNodes[0].nodeType).equal(3);
        expect(node.childNodes[0].data).equal('Ho');
      }
    });
  });

  it('renders <input> value attribute', function() {
    test({
      template: new saddle.Element('input', new saddle.AttributesMap({
        value: new saddle.Attribute('hello')
      }))
    , html: '<input value="hello">'
    , fragment: function(fragment) {
        expect(fragment.childNodes[0].value).equal('hello');
        expect(fragment.childNodes[0].getAttribute('value')).equal('hello');
      }
    });
  });

  it('renders <input> checked attribute: true', function() {
    test({
      template: new saddle.Element('input', new saddle.AttributesMap({
        type: new saddle.Attribute('radio')
      , checked: new saddle.Attribute(true)
      }))
    , html: '<input type="radio" checked>'
    , fragment: function(fragment) {
        expect(fragment.childNodes[0].checked).equal(true);
      }
    });
  });
  it('renders <input> checked attribute: false', function() {
    test({
      template: new saddle.Element('input', new saddle.AttributesMap({
        type: new saddle.Attribute('radio')
      , checked: new saddle.Attribute(false)
      }))
    , html: '<input type="radio">'
    , fragment: function(fragment) {
        expect(fragment.childNodes[0].checked).equal(false);
      }
    });
  });
}

describe('replaceBindings', function() {

  after(function() {
    var fixture = document.getElementById('fixture');
    fixture.innerHTML = '';
  });

  function renderAndReplace(template) {
    var fixture = document.getElementById('fixture');
    fixture.innerHTML = template.getHtml();
    var fragment = template.getFragment();
    saddle.replaceBindings(fragment, fixture);
  }

  it('traverses a simple, valid DOM tree', function() {
    var template = new saddle.Template([
      new saddle.Comment('Hi')
    , new saddle.Element('ul', null, [
        new saddle.Element('li', null, [
          new saddle.Text('Hi')
        ])
      ])
    ]);
    renderAndReplace(template);
  });

  it('traverses with comments in a table and select', function() {
    // IE fails to create comments in certain locations when parsing HTML
    var template = new saddle.Template([
      new saddle.Element('table', null, [
        new saddle.Comment('table comment')
      , new saddle.Element('tbody', null, [
          new saddle.Comment('tbody comment')
        , new saddle.Element('tr', null, [
            new saddle.Element('td')
          ])
        ])
      ])
    , new saddle.Element('select', null, [
        new saddle.Comment('select comment start')
      , new saddle.Element('option')
      , new saddle.Comment('select comment inner')
      , new saddle.Element('option')
      , new saddle.Comment('select comment end')
      , new saddle.Comment('select comment end 2')
      ])
    ]);
    renderAndReplace(template);
  });

  it('throws when fragment does not match HTML', function() {
    // This template is invalid HTML, and when it is parsed it will produce
    // a different tree structure than when the nodes are created one-by-one
    var template = new saddle.Template([
      new saddle.Element('table', null, [
        new saddle.Element('div', null, [
          new saddle.Element('td', null, [
            new saddle.Text('Hi')
          ])
        ])
      ])
    ]);
    expect(function() {
      renderAndReplace(template)
    }).to.throwException();
  });

});

describe('Binding updates', function() {

  var fixture = document.getElementById('fixture');
  after(function() {
    fixture.innerHTML = '';
  });

  function getContext(data, bindings) {
    var contextMeta = new saddle.ContextMeta({
      onAdd: function(binding) {
        bindings && bindings.push(binding);
      }
    });
    return new saddle.Context(contextMeta, data);
  }

  function render(template, data) {
    fixture.innerHTML = '';
    var bindings = [];
    var context = getContext(data, bindings);
    var fragment = template.getFragment(context);
    fixture.appendChild(fragment);
    return bindings;
  }

  it('updates a single TextNode', function() {
    var template = new saddle.Template([
      new saddle.DynamicText(new saddle.Expression('text'))
    ]);
    var bindings = render(template);
    expect(bindings.length).equal(1);
    expect(fixture.innerHTML).equal('');
    var context = getContext({text: 'Yo'});
    bindings[0].update(context);
    expect(fixture.innerHTML).equal('Yo');
  });

  it('updates sibling TextNodes', function() {
    var template = new saddle.Template([
      new saddle.DynamicText(new saddle.Expression('first'))
    , new saddle.DynamicText(new saddle.Expression('second'))
    ]);
    var bindings = render(template, {second: 2});
    expect(bindings.length).equal(2);
    expect(fixture.innerHTML).equal('2');
    var context = getContext({first: 'one', second: 'two'});
    bindings[0].update(context);
    expect(fixture.innerHTML).equal('one2');
    bindings[1].update(context);
    expect(fixture.innerHTML).equal('onetwo');
  });

  it('updates a CommentNode', function() {
    var template = new saddle.Template([
      new saddle.DynamicComment(new saddle.Expression('comment'))
    ]);
    var bindings = render(template, {comment: 'Hi'});
    expect(bindings.length).equal(1);
    expect(fixture.innerHTML).equal('<!--Hi-->');
    var context = getContext({comment: 'Bye'});
    bindings[0].update(context);
    expect(fixture.innerHTML).equal('<!--Bye-->');
  });

  it('updates an Element attribute', function() {
    var template = new saddle.Template([
      new saddle.Element('div', new saddle.AttributesMap({
        'class': new saddle.Attribute('message')
      , 'data-greeting': new saddle.DynamicAttribute('greeting')
      }))
    ]);
    var bindings = render(template);
    expect(bindings.length).equal(1);
    var node = fixture.firstChild;
    expect(node.className).equal('message');
    expect(node.getAttribute('data-greeting')).eql(null);
    // Set initial value
    var context = getContext({greeting: 'Yo'});
    bindings[0].update(context);
    expect(node.getAttribute('data-greeting')).equal('Yo');
    // Change value for same attribute
    var context = getContext({greeting: 'Hi'});
    bindings[0].update(context);
    expect(node.getAttribute('data-greeting')).equal('Hi');
    // Remove value
    var context = getContext();
    bindings[0].update(context);
    expect(node.getAttribute('data-greeting')).eql(null);
    // Dynamic updates don't affect static attribute
    expect(node.className).equal('message');
  });

  it('updates a Block', function() {
    var template = new saddle.Template([
      new saddle.Block(new saddle.Expression('author'), [
        new saddle.Element('h3', null, [
          new saddle.DynamicText(new saddle.Expression('name'))
        ])
      ])
    ]);
    var bindings = render(template);
    expect(bindings.length).equal(2);
    var children = getChildren(fixture);
    expect(children.length).equal(1);
    expect(children[0].tagName.toLowerCase()).equal('h3');
    expect(children[0].innerHTML).equal('');
    // Update entire block context
    var context = getContext({author: {name: 'John'}});
    bindings[1].update(context);
    var children = getChildren(fixture);
    expect(children.length).equal(1);
    expect(children[0].tagName.toLowerCase()).equal('h3');
    expect(children[0].innerHTML).equal('John');
    // Reset to no data
    var context = getContext();
    bindings[1].update(context);
    var children = getChildren(fixture);
    expect(children.length).equal(1);
    expect(children[0].tagName.toLowerCase()).equal('h3');
    expect(children[0].innerHTML).equal('');
  });

  it('updates a single condition ConditionalBlock', function() {
    var template = new saddle.Template([
      new saddle.ConditionalBlock([
        new saddle.Expression('show')
      ], [[
          new saddle.Text('shown')
        ]
      ])
    ]);
    var bindings = render(template);
    expect(bindings.length).equal(1);
    expect(getText(fixture)).equal('');
    // Update value
    var context = getContext({show: true});
    bindings[0].update(context);
    expect(getText(fixture)).equal('shown');
    // Reset to no data
    var context = getContext({show: false});
    bindings[0].update(context);
    expect(getText(fixture)).equal('');
  });

});

// IE <=8 return comments for Node.children
function getChildren(node) {
  var nodeChildren = node.children;
  var children = [];
  for (var i = 0, len = nodeChildren.length; i < len; i++) {
    var child = nodeChildren[i];
    if (child.nodeType === 1) children.push(child);
  }
  return children;
}

function getText(node) {
  return node.textContent || node.innerText;
}
