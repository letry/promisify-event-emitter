# promisify-event-emitter

Class for promisification EventEmitter like objects.

## Installation

[npm package](https://npmjs.org/package/promisify-event-emitter)

```
> npm install --save promisify-event-emitter
```

```javascript
const PromisifyEventEmitter = require('promisify-event-emitter');
```

## Quickstart

```js
const EventEmitter = require('events');
const emitter = new EventEmitter();

const eventPromise = PromisifyEmitter.on(emitter, 'connect', 'error')
    .then(([user, connection]) => {
        console.log(user, connection) // 'Ivan', {}
    })
    .catch(([reason]) => {
        console.error(reason) // connection refused
    });


emitter.emit('connect', 'Ivan', {}); // in this case eventPromise become fullfilled
emitter.emit('error', 'connection refused'); // in this case eventPromise become rejected
```
Use case in server context 
```js
const fs = require('fs');
const stream = fs.createWriteStream('file.json');

PromisifyEmitter.on(stream, 'end', 'error')
    .then(() => {
        console.log('finish');
    })
    .catch(([err]) => {
        console.error(err);
    });
```
Use case in browser context
```js
PromisifyEmitter.on(document, 'keydown')
    .then(console.log) // [Event]
```
## API
Package requires ES6 Promise and Map.
This class extends methods from [promise-event-emitter](https://github.com/letry/promise-event-emitter) class.
The examples above use simplified syntax, based on static method 'on'. Next, we describe the full syntax.

### constructor(emitter: EventEmitterLikeObject, {on: String, off: String, emit: String})
Create a new instance that will use emitter's native subscriptions and transform them to [promise-event-emitter](https://github.com/letry/promise-event-emitter) logic.

Second optional argument - object that define method names to access to EventEmitterLikeObject.
It should be define when you want promisification for nonstandard EventEmitterLikeObject.
By default, constructor will try to find in emitter the following well known methods:
- on: "addEventListener", "addListener", "on"
- off: "removeEventListener", "removeListener", "off"
- emit: "dispatchEvent", "emit"

```js
const http = require('http');
const server = http.createServer();
const emitter = new PromisifyEmitter(server);

void async function handleRequest() {
    try {
        const [req, res] = await emitter.on('request', 'clientError');
        res.end('Hello, World!')
    } catch ([err, socket]) {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
    return handleRequest();
}();

server.listen(5000);
```

### emitter.once(event: String, ...otherArgs) => Promise
 Subscribe to the event.
 Returns a promise that will be fulfill when the event will be emitted.
 otherArgs will be passed to original subscribe method of EventEmitterLikeObject.
  ```js
const emitter = new PromisifyEmitter(document);

// this recursive function will log all keydown events
void async function keydownLog() {
    const [{key}] = await emitter.once('keydown', { passive: true });
    console.log(key);
    return keydownLog();
}();
 ```
 
### emitter.off(event: String, {toEmitter: Array, toPromiseEmitter: Array}) => Boolean
 Second argument is optional.
 - Calls 'off' method of EventEmitterLikeObject with toEmitter arguments.
 - Removes the specified event from the event-callback map.
 - Returns call off method of [promise-event-emitter](https://github.com/letry/promise-event-emitter) with toPromiseEmitter arguments.

```js
const emitter = new PromisifyEmitter(document);

void async function keydownLog() {
    try {
        const [{key}] = await emitter.once('keydown', { passive: true });
        console.log(key);
        return keydownLog();
    } catch([e]) {
        console.error(e); // after click - 'handler removed'
    }
}();

emitter.once('click')
    .then(() => {
        emitter.off('keydown', {
            toEmitter: [{ passive: true }],
            toPromiseEmitter: ['reject', 'handler removed'] 
        });
    });
 ```

### emitter.emit(event: String, ...args) => Boolean
 Returns the result of the method call 'emit' of EventEmitterLikeObject.

### emitter.eventCallbackMap
Each instance of the promify-event-emitter class stores an event-callback Map.
This allows any type of data to be used as event.
```
const event = new Event('myEvent');
emitter.once(event).then(console.log); // [42];
emitter.emit(event, 42);
```
### emitter.emitter
Link to EventEmitterLikeObject that was passed to the constructor.
### PromisifyEventEmitter.on(emitter, successEvents: String || [String], rejectEvents: String || [String], options)
Static method. Instead of a thousand words: 
```js 
return new PromisifyEventEmitter(emitter, options).on(successEvents, rejectEvents);
```
## License

ISC © [Letry](https://github.com/letry)
