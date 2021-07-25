[![npm version](https://badge.fury.io/js/anystatejs.svg)](https://badge.fury.io/js/anystatejs)

# AnyStateJs

Fast, easy to use and flexible javascript state manager based on RxJs.

## Installation

### npm

```sh
npm install anystatejs
```

## Usage

```ts
import { StateManager } from "anystatejs";

const state = new StateManager({ prop: 'initial value', sayHello: 'hello world' });
state.createAction('setHello', (state, name) => ({ sayHello: `hello ${name}` }));

state.subscribe(value => console.log(value));

state.call('setHello', 'John');
state.update({ prop: 'new value' });

// Output:
// { prop: 'initial value', sayHello: 'hello world' } --> output on subscribe
// { prop: 'initial value', sayHello: 'hello John' } --> output on setHello
// { prop: 'new value', sayHello: 'hello John' } --> output on update
```
### Actions
Create actions for standard operations.
```ts
const state = new StateManager({ active: false, count: 0 });

state.createAction('Activate', () => ({ active: true }));
state.createAction('Add', ({ active, count }) => {
  return active ? { count: count + 1 } : { count };
});
state.createAction('AddNumber', ({ active, count }, n) => {
  return active ? { count: count + n } : { count };
});

state.subscribe(value => console.log(value));

state.call('Add');
state.call('Activate');
state.call('Add');
state.call('AddNumber', 10);

// Output:
// { active: false, count: 0 }
// { active: true, count: 0 }
// { active: true, count: 1 }
// { active: true, count: 11 }
```

### Child state

AnyStateJs allows you to split your state in smaller chunks easier to handle.
The `createChild` method returns a new `StateManager` object totally ignorant of the parent.

```ts
const state = new StateManager({ child: { count: 0 } });

const child = state.createChild('child');
child.createAction('addCount', (state) => ({ count: state.count + 1 }));

state.subscribe(value => console.log(value));

child.call('addCount');
child.call('addCount');

state.removeChild('child');

// Output:
// { child: { count: 0 } } 
// { child: { count: 1 } } 
// { child: { count: 2 } } 
```
Remember to remove the children you create after the usage in order to unsubscribe from all the children events.
```ts
state.removeChild('child');
```
Or
```ts
state.removeAllChildren();
```

### Listen to single properties
Simplify your code by listening to single properties.
```ts
const state = new StateManager({ count1: 0, count2: 0 });
state.getPropertyObservable('count1').subscribe(value => console.log(value));

state.update({ count1: 1 });
state.update({ count2: 4 });
state.update({ count2: 5 });
state.update({ count1: 2 });
state.update({ count1: 3 });

// Output:
// 0
// 1
// 2
// 3
```