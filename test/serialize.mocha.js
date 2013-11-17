var exp = require('../index');

var assert = require('better-assert');

describe('The Block Constructor', function() {

  it(
    'produces constructor when its serialize method is called', 
    function() {

      var input = new exp.Block().serialize();
      var output = 'new Block()';
      assert(input == output);
    }
  );

  it(
    'produces a constructor and the arguments that were passed' +
    'to it when its serialize method is called', 
    function() {

      var input = new exp.Block(
        null,
        [
          new exp.Element('div')
        ]
      ).serialize();

      var output = 'new Block({  }, [new Element(\'div\')])';
      assert(input == output);
    }
  );

});

describe('The Text Constructor', function() {
  it(
    'produces constructor with a string attribute when its' +
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
    'produces constructor with a string attribute when its' +
    'serialize method is called', 
    function() {

      var input = new exp.Element('test');
      var output = 'new Element(\'test\')';
      assert(input.serialize() == output);
    }
  );
});

describe('The Comment Constructor', function() {
  it(
    'produces constructor with a string attribute when its' +
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
      var output = "new AttributesMap({ 'class': 'red' })";
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
    'should produce the same result when nested',
    function() {
      var input = new exp.Element('div', 
        new exp.AttributesMap({
          'class': new exp.Attribute('post')
        })
      ).serialize();
      var output = 'new Element(\'div\', new AttributesMap({"class": new Attribute(\'post\')})';
      assert(input, output);

    }
  );
    
      
});



var expressions = require('../example/expressions');
exp.Expression = expressions.Expression;

with(exp) {

  var _this = new Expression();
  _this.toString = function() {
    return 'this';
  };

  var template = new Block(
    _this, 
    [
      new Element(
        'div', 
        new AttributesMap({
          'class': new Attribute('post')
        }), 
        [
          new Element(
            'h1', 
            null, 
            [
              new Text('By '), 
              new DynamicText(new Expression('author'))
            ]
          ), 
          new Element(
            'div', 
            new AttributesMap({
              'class': new Attribute('body')
            }),
            [
              new DynamicText(new Expression('body'))
            ]
          ), 
          new Text(''), 
          new Comment('Go, go comment node!'), 
          new ConditionalBlock(
            [new Expression('comments'), _this], 
            [
              [
                new Element(
                  'h1', 
                  null, 
                  [
                    new Text('Comments')
                  ]
                ), 
                new Text('')
              ], 
              [
                new Element(
                  'h1', 
                  null, 
                  [
                    new Text('No comments')
                  ]
                )
              ]
            ]
          ), 
          new EachBlock(
            new Expression('comments'), 
            [
              new Element(
                'h2', 
                null, 
                [
                  new Text('By '), 
                  new Block(
                    new Expression('nonsense'), 
                    [
                      new DynamicText(new Expression('author'))
                    ]
                  )
                ]
              ), 
              new Element(
                'div', 
                new AttributesMap({
                  'class': new Attribute('body')
                }), 
                [
                  new DynamicText(new Expression('body'))
                ]
              )
            ], 
            [
              new Text('Lamers')
            ]
          )
        ])
    ]
  );

  console.log(template.serialize())

}   
