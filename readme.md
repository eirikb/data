In-memory observable JavaScript object.  
Observe by type (added, changed, etc.), and some type of dynamic path.
```
     Flags:
     *   Value changed
     !   Immediate callback if value exists
     +   Value added
     -   Value removed
     =   Trigger only (no value set)
 
     Path:
     $x   Named wildcard
     *    Wildcard
     **   Recursive wildcard
 
     Example:
```

```JavaScript
import Data from '@eirikb/data';

const data = Data();

data.on('!+* teams.$teamId.players.$playerId.**', (player, { $teamId, $playerId, path, value }) => {
  console.log('Added or changed', path, player, $teamId, $playerId, value);
});

data.set('teams', { t1: { players: { p1: { nick: 'Nick' } } } });
data.set('teams.t1.players.p2', { nick: 'It' });
```
