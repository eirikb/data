```
*   Value changed
!   Immediate callback if value exists
+   Value added
-   Value removed
=   Trigger only (no value set)

$   Named wildcard

{x,y,z} Ranged listener,
    triggers on any of the values when any of the values are set
```


```JavaScript
  import Data from '@eirikb/data';

  const data = Data();
  
  data.on('!+* hello', hello => console.log(hello));
  data.set('hello', 'world');
  // Prints 'world'
  
  console.log(data.get('hello'));
  // Prints 'world'
  
  data.on('= someTrigger', value => console.log(value));
  data.trigger('someTrigger', 'hello');
  // Prints 'hello'
  
  // set overwrites data
  data.set('players.p1',  {
    nick: 'Fury'
  });
  data.update('players.p1', {
    hp: 10
  });
  
  data.on('+ a', () => console.log('a added'));
  data.on('- a', () => console.log('a removed'));
  data.set('a', 'yes');
  // Prints 'a added
  data.unset('a');
  // Prints 'a removed
  
  const keyRef = data.on('+* test', console.log);
  data.off(keyRef);
  data.set('test', 'ing');
  // Prints nothing, listener removed
  
  data.alias('to.something', 'from.something');
  data.on('+* to.something', something => console.log(something));
  data.set('from.something', 'ping');
  // Prints 'ping'
  data.unalias('to.something');
  data.set('from.something', 'pong');
  // Prints nothing, alias removed
```