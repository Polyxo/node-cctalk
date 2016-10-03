'use strict';

function getPrototypeChain(prototype)
{
  var chain = [];
  
  while(prototype)
  {
    chain.push(prototype);
    prototype = Object.getPrototypeOf(prototype);
  }
  return chain;
}

function commonInChain(chainA, chainB)
{
  return chainA.find(function(aPrototype)
    {
      return chainB.find(function(bPrototype)
      {
        if(aPrototype._copyOf)
          aPrototype = aPrototype._copyOf;
        if(bPrototype._copyOf)
          bPrototype = bPrototype._copyOf;
        return aPrototype == bPrototype;
      });
    });
}

function commonPrototypeReducer(a, b)
{
  var chainA = getPrototypeChain(a);
  var chainB = getPrototypeChain(b);
  
  return commonInChain(chainA, chainB);
};

function commonPrototype()
{
  var prototypes = Array.prototype.map.call(arguments, function(x) { return x.prototype; });
  return prototypes.reduce(commonPrototypeReducer);
}

/*

Example of compose operations

Suppose there is a hierarchy of constructors whose prototypes are set like this:

A --> B --> Base (--> Object)
      ^       ^
C ----|       |
              |
D ------------

Then the the result of the following operations will be a constructor with a prototype chain like that:

* compose(A, B)

    (A --> B --> Base)
    Comment: The prototype chain already has the specified order

* compose(A, C)

    A new --> C new --> (B --> Base)

* compose(D, A)
    
    D new --> A new --> (B --> Base)

* compose(A, D)
    
    A new --> B new --> (D --> Base)

* compose(A, C, D)

    A new --> C new --> B new --> (D --> Base)

* compose(A, D, C)

    A new --> B new --> D new --> (C --> B --> Base)
    Warning: A duplicate clone of the prototype of "B" will be created
    One of the following two constructs will clarify the placement of "B" in the prototype chain

* compose(A, B, D, C)

    A new --> B new --> D new --> C new --> Base

* compose(A, D, C, B)

    A new --> D new --> (C --> B --> Base)

where "new" denotes a copy of the prototype with an altered prototype and () denotes the unaltered part of a prototype chain
*/

function chainToString(chain)
{
  return chain.map(function(C) { return C.test? C.test() : '?'; }).join(" --> ");
}

function filterChain(newChain, chain, prototypes)
{
  var base = commonInChain(newChain, chain);
  //console.log("Base of", chainToString(newChain), "and", chainToString(chain), "is", base.test ? base.test() : '?');
  var baseIndex = newChain.indexOf(base);
  var filteredChain = newChain.slice(0, baseIndex).filter(function(c)
  {
    return c == newChain[0] || prototypes.indexOf(c) == -1;
  });
  return filteredChain;
};

function createChain(chain)
{
  chain = chain.slice();
  
  var chainHead = chain.pop()
  
  while(chain.length > 0)
  {
    var current = chain.pop();
    
    if(Object.getPrototypeOf(current) == chainHead)
    {
      chainHead = current;
    }
    else
    {
      chainHead = Object.create(chainHead);
      Object.assign(chainHead, current);
      chainHead._copyOf = current;
    }
  }
  
  return chainHead;
};

function createConstructor(constructors)
{
  return function()
  {
    for(var i = constructors.length-1; i >= 0; i--)
    {
      constructors[i].apply(this, arguments);
    }
  };
};

function compose()
{
  var constructors = Array.prototype.slice.call(arguments);
  var prototypes = constructors.map(function(C) { return C.prototype; });
  
  var chain = [Object.getPrototypeOf({})];
  var previousChain = chain;

  constructors.reverse().forEach(function(C, i)
  {
    var currentChain = getPrototypeChain(C.prototype);
    
    var newChain = filterChain(currentChain, previousChain, prototypes);
    
    chain = newChain.concat(chain);
    previousChain = currentChain;
  });
  
  //console.log(chainToString(chain));
  
  var prototype = createChain(chain);
  var constructor = createConstructor(constructors);
  constructor.prototype = prototype;
  
  return constructor;
}

/*
// Test code

function Base()
{
}

Base.prototype =
{
  test: function() { return 'Base'; }
};

function B()
{
}

B.prototype = new Base();

B.prototype.test = function() { return 'B'; };

function A()
{
}

A.prototype = new B();

A.prototype.test = function() { return 'A'; };

function C()
{
}

C.prototype = new B();

C.prototype.test = function() { return 'C'; };

function D()
{
}

D.prototype = new Base();

D.prototype.test = function() { return 'D'; };


function testPrototypeChain(obj)
{
  var chain = [];
  while(obj && obj.test)
  {
    chain.push(obj.test());
    obj = Object.getPrototypeOf(obj);
  }
  console.log(chain.join(' '));
}

var prototype = commonPrototype(A, B);
console.log(prototype.test());
console.log(prototype);

console.log("A, B should produce A --> B --> Base");
testPrototypeChain(new (compose(A, B))());
console.log("A, C should produce A new --> C new --> (B --> Base)");
testPrototypeChain(new (compose(A, C))());
console.log("D, A should produce D new --> A new --> (B --> Base)");
testPrototypeChain(new (compose(D, A))());
console.log("A, D should produce  A new --> B new --> D new --> Base");
testPrototypeChain(new (compose(A, D))());
console.log("A, C, D should produce  A new --> C new --> B new --> D new --> Base");
testPrototypeChain(new (compose(A, C, D))());
console.log("A, D, C should produce A new --> B new --> D new --> C new --> B new --> Base");
testPrototypeChain(new (compose(A, D, C))());
console.log("A, B, D, C should produce A new --> B new --> D new --> C new --> Base");
testPrototypeChain(new (compose(A, B, D, C))());
console.log("A, D, C, B should produce A new --> D new --> C new --> B new --> Base");
testPrototypeChain(new (compose(A, D, C, B))());

*/

module.exports = compose;
