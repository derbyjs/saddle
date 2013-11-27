var expect = require('expect.js');
var templates = require('../index');
var expressions = require('../example/expressions');

describe('The Block Constructor', function() {

  it(
    'produces constructor when its serialize method is called ', 
    function() {

      var input = new templates.Block().serialize();
      var output = 'new Block()';
      expect(input).equal(output);
    }
  );

  it(
    'produces a constructor and the arguments that were passed ' +
    'to it when its serialize method is called', 
    function() {

      var input = new templates.Block(
        null,
        [
          new templates.Element('div')
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

      var input = new templates.Text('test').serialize();
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

      var input = new templates.Element('test').serialize();
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

      var input = new expressions.Expression('test').serialize();
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

      var input = new templates.Comment('test').serialize();
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

      var input = new templates.ConditionalBlock(
        [new expressions.Expression('comments'), null]
      , [
          [new templates.Element('h1', null, [new templates.Text('Comments')]), new templates.Text('')]
        , [new templates.Element('h1', null, [new templates.Text('No comments')])]
        ]
      ).serialize();

      var output = [
        "new ConditionalBlock([new Expression('comments'), null],",
        " [[new Element('h1', null, [new Text('Comments')]), new Text('')], ",
        "[new Element('h1', null, [new Text('No comments')])]])"
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

      var input = new templates.EachBlock(
        new expressions.Expression('comments')
      , [
          new templates.Element('h2', null, [
            new templates.Text('By ')
          , new templates.Block(
              new expressions.Expression('nonsense')
            , [new templates.DynamicText(new expressions.Expression('author'))]
            )
          ])
        , new templates.Element('div', {
              'class': new templates.Attribute('body')
            }
          , [new templates.DynamicText(new expressions.Expression('body'))]
          )
        ]
      , [new templates.Text('Lamers')]
      ).serialize();

      var output =
        "new templates.EachBlock(" +
          "new expressions.Expression('comments')" +
        ", [" +
            "new templates.Element('h2', null, [" +
              "new templates.Text('By ')" +
            ", new templates.Block(" +
                "new expressions.Expression('nonsense')" +
              ", [new templates.DynamicText(new expressions.Expression('author'))]" +
              ")" +
            "])" +
          ", new templates.Element('div', {" +
                "'class': new templates.Attribute('body')" +
              "}" +
            ", [new templates.DynamicText(new expressions.Expression('body'))]" +
            ")" +
          "]" +
        ", [new templates.Text('Lamers')]" +
        ")";

      expect(input).equal(output);
    }
  );
});

describe('The Attribute Constructor', function() {
  it(
    'produces constructor with an object attirbute when its' +
    'serialize method is called', 
    function() {
    
      var input = new templates.Attribute('test').serialize();
      var output = 'new Attribute(\'test\')';
      expect(input).equal(output);
    }
  );

  it(
    'should produce the same result when nested in Element attributes',
    function() {
      var input = new templates.Element(
        'div', {
          'class': new templates.Attribute('post')
        }
      ).serialize();
      var output = 'new Element(\'div\', {class: new Attribute(\'post\')})';
      expect(input).equal(output);
    }
  );

  it(
    'should produce the same result when nested in Element that is nested',
    function() {
      var input = new templates.Block(
        {},
        [
          new templates.Element(
            'div', {
              'class': new templates.Attribute('post')
            }
          )
        ]
      ).serialize();

      var output = 'new Block({}, [new Element(\'div\', {class: new Attribute(\'post\')})])';
      expect(input).equal(output);
    }
  );
});
