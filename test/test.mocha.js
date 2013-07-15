describe('HTML Rendering', function() {

  it('renders an empty div', function() {
    var template = new saddle.Element('div');
    var html = template.getHtml();
    expect(html).to.eql('<div></div>');
  });

  it('renders a div with literal attributes', function() {
    var template = new saddle.Element('div', {
      id: new saddle.Attribute('page')
    , 'class': new saddle.Attribute('content fit')
    });
    var html = template.getHtml();
    expect(html).to.eql('<div id="page" class="content fit"></div>');
  });

  it('renders a void element', function() {
    var template = new saddle.Element('input', {
      value: new saddle.Attribute('hello')
    }, null, true);
    var html = template.getHtml();
    expect(html).to.eql('<input value="hello">');
  });

  it('renders nested elements', function() {
    var template = new saddle.Element('div', null, [
      new saddle.Element('div', null, [
        new saddle.Element('span')
      , new saddle.Element('span')
      ])
    ]);
    var html = template.getHtml();
    expect(html).to.eql('<div><div><span></span><span></span></div></div>');
  });

  it('renders a text node', function() {
    var template = new saddle.Text('Hi');
    var html = template.getHtml();
    expect(html).to.eql('Hi');
  });

  it('renders text nodes in an element', function() {
    var template = new saddle.Element('div', null, [
      new saddle.Text('Hello,')
    , new saddle.Text(' world.')
    ]);
    var html = template.getHtml();
    expect(html).to.eql('<div>Hello, world.</div>');
  });

  it('renders a comment', function() {
    var template = new saddle.Comment('Hi');
    var html = template.getHtml();
    expect(html).to.eql('<!--Hi-->');
  });

  it('renders a template', function() {
    var template = new saddle.Template([
      new saddle.Comment('Hi')
    , new saddle.Element('div', null, [
        new saddle.Text('Ho')
      ])
    ]);
    var html = template.getHtml();
    expect(html).to.eql('<!--Hi--><div>Ho</div>');
  });

});
