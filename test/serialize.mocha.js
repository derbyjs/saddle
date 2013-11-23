var exp = require('../index');

var assert = require('better-assert');
var expressions = require('../example/expressions');
exp.Expression = expressions.Expression;

describe('The Block Constructor', function() {

  it(
    'produces constructor when its serialize method is called ', 
    function() {

      var input = new exp.Block().serialize();
      var output = 'new Block()';
      assert(input == output);
    }
  );

  it(
    'produces a constructor and the arguments that were passed ' +
    'to it when its serialize method is called', 
    function() {

      var input = new exp.Block(
        null,
        [
          new exp.Element('div')
        ]
      ).serialize();

      var output = 'new Block(null, [new Element(\'div\')])';
      assert(input == output);
    }
  );

});

describe('The Text Constructor', function() {
  it(
    'produces constructor with a string attribute when its ' +
    'serialize method is called', 
    function() {

      var input = new exp.Text('test').serialize();
      var output = 'new Text(\'test\')';
      assert(input == output);
    }
  );
});

describe('The Element Constructor', function() {
  it(
    'produces constructor with a string attribute when its ' +
    'serialize method is called', 
    function() {

      var input = new exp.Element('test').serialize();
      var output = 'new Element(\'test\')';
      assert(input == output);
    }
  );
});

describe('The Expression Constructor', function() {
  it(
    'produces constructor with a string attribute when its ' +
    'serialize method is called', 
    function() {

      var input = new exp.Expression('test').serialize();
      var output = 'new Expression(\'test\')';
      assert(input == output);
    }
  );
});

describe('The Comment Constructor', function() {
  it(
    'produces constructor with a string attribute when its ' +
    'serialize method is called', 
    function() {

      var input = new exp.Comment('test').serialize();
      var output = 'new Comment(\'test\')';
      assert(input == output);
    }
  );
});

describe('The AttributesMap Constructor', function() {
  it(
    'produces constructor with an object attirbute when its' +
    'serialize method is called', 
    function() {

      var input = new exp.AttributesMap({ class: 'red' }).serialize();
      var output = "new AttributesMap({class: 'red'})";
      assert(input == output);
    }
  );
});

describe('The ConditionalBlock Constructor', function() {
  it(
    'produces constructor with an object attirbute when its' +
    'serialize method is called, it should resolve nested constructors',
    function() {

      var input = new exp.ConditionalBlock(
        [new exp.Expression('comments'), null],
        [
          [new exp.Element('h1', null, [new exp.Text('Comments')]), new exp.Text('')], 
          [new exp.Element('h1', null, [new exp.Text('No comments')])]
        ]
      ).serialize();

      var output = [
        "new ConditionalBlock([[new Expression('comments'), null],",
        " [[new Element('h1', null, [new Text('Comments')]), new Text('')], ",
        "[new Element('h1', null, [new Text('No comments')])]]])"
      ].join('');

      assert(input == output);
    }
  );
});


describe('The EachBlock Constructor', function() {
  it(
    'produces constructor with an object attirbute when its' +
    'serialize method is called, it should resolve nested constructors',
    function() {

      var input = new exp.EachBlock(
        new exp.Expression('comments'), [
          new exp.Element('h2', null, [
            new exp.Text('By '), 
            new exp.Block(
              new exp.Expression('nonsense'),
              [new exp.DynamicText(new exp.Expression('author'))]
            )
          ]), 
          new exp.Element('div', 
            new exp.AttributesMap({
              'class': new exp.Attribute('body')
            }), 
            [new exp.DynamicText(new exp.Expression('body'))]
          )
        ],
        [new exp.Text('Lamers')]
      ).serialize();

      var output = [
        "new Block(new Expression('comments'), ",
        "[new Element('h2', null, [new Text('By '), ",
        "new Block(new Expression('nonsense'), ",
        "[new DynamicText(new Expression('author'))])]), ",
        "new Element('div', {class: new Attribute('body')}, ",
        "[new DynamicText(new Expression('body'))])])"
      ].join('');

      assert(input == output);
    }
  );
});




          










describe('The Attribute Constructor', function() {
  it(
    'produces constructor with an object attirbute when its' +
    'serialize method is called', 
    function() {
    
      var input = new exp.Attribute('test').serialize();
      var output = 'new Attribute(\'test\')';
      assert(input == output);
    }
  );

  it(
    'should produce the same result when nested in an AttributesMap',
    function() {
      var input = new exp.Element(
        'div', 
        new exp.AttributesMap({
          'class': new exp.Attribute('post')
        })
      ).serialize();
      var output = 'new Element(\'div\', new AttributesMap({class: new Attribute(\'post\')})';
      assert(input, output);
    }
  );

  it(
    'should produce the same result when nested in an AttributesMap that is nested',
    function() {
      var input = new exp.Block(
        {},
        [
          new exp.Element(
            'div', 
            new exp.AttributesMap({
              'class': new exp.Attribute('post')
            })
          )
        ]
      ).serialize();

      var output = 'new Block({}, new Element(\'div\', new AttributesMap({"class": new Attribute(\'post\')}))';
      assert(input, output);
    }
  );
});
