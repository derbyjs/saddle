var exp = require('../index');
var expect = require('expect.js');

var expressions = require('../example/expressions');
exp.Expression = expressions.Expression;

describe('The Block Constructor', function() {

  it(
    'produces constructor when its serialize method is called ', 
    function() {

      var input = new exp.Block().serialize();
      var output = 'new Block()';
      expect(input).equal(output);
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
      expect(input).equal(output);
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
      expect(input).equal(output);
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
      expect(input).equal(output);
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
      expect(input).equal(output);
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
      expect(input).equal(output);
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

      expect(input).equal(output);
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
          new exp.Element('div', {
              'class': new exp.Attribute('body')
            },
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

      expect(input).equal(output);
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
      expect(input).equal(output);
    }
  );

  it(
    'should produce the same result when nested in Element attributes',
    function() {
      var input = new exp.Element(
        'div', {
          'class': new exp.Attribute('post')
        }
      ).serialize();
      var output = 'new Element(\'div\', {class: new Attribute(\'post\')})';
      expect(input).equal(output);
    }
  );

  it(
    'should produce the same result when nested in Element that is nested',
    function() {
      var input = new exp.Block(
        {},
        [
          new exp.Element(
            'div', {
              'class': new exp.Attribute('post')
            }
          )
        ]
      ).serialize();

      var output = 'new Block({}, [new Element(\'div\', {class: new Attribute(\'post\')})])';
      expect(input).equal(output);
    }
  );
});
