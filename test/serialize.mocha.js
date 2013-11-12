var exp = require('../index');
var assert = require('better-assert');

describe('The Block Constructor', function() {

  it(
    'produces constructor when its serialize method is called', 
    function() {

      var input = new exp.Block();
      var output = 'new Block()';
      assert(input.serialize() == output);
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

      var output = 'new Block(null, [new Element(\'div\')])';

      assert(input == output);
    }
  );

});

describe('The Text Constructor', function() {
  it(
    'produces constructor with a string attribute when its' +
    'serialize method is called', 
    function() {

      var input = new exp.Text('test');
      var output = 'new Text(\'test\')';
      assert(input.serialize() == output);
    }
  );
});

describe('The Comment Constructor', function() {
  it(
    'produces constructor with a string attribute when its' +
    'serialize method is called', 
    function() {

      var input = new exp.Comment('test');
      var output = 'new Comment(\'test\')';
      assert(input.serialize() == output);
    }
  );
});

describe('The AttributesMap Constructor', function() {
  it(
    'produces constructor with an object attirbute when its' +
    'serialize method is called', 
    function() {

      var input = new exp.AttributesMap({ class: 'red' });
      var output = 'new AttributesMap({"class":"red"})';
      console.log(input.serialize());
      assert(input.serialize() == output);
    }
  );
});

