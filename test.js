const PromisifyEmitter = require('./index');
const EventEmitter = require('events');

const tests = {
    'empty listeners'(resolve, reject, emitter) {
        !emitter.off('event') &&
        !emitter.emit('event') &&
        !emitter.eventNames().length
            ? resolve() : reject();   
    },
    'event arguments'(resolve, reject, emitter) {
        const args = [1, 2, 3];
        emitter.once('event')
            .then(args => args.length === 3 ? resolve() : reject())
            .catch(reject);
        emitter.emit('event', ...args);
    },
    'once event'(resolve, reject, emitter) {
        const promise1 = emitter.once('event');
        const promise2 = emitter.once('event');
        if (promise1 === promise2) promise1.then(resolve, reject)
        emitter.emit('event');
    },
    'event resolve'(resolve, reject, emitter) {
        emitter.on('success', 'error')
            .then(resolve)
            .catch(reject);
        emitter.emit('success');
    },
    'event reject'(resolve, reject, emitter) {
        emitter.on('success', 'error')
            .then(reject)
            .catch(resolve);
        emitter.emit('error');
    },
    'multi event resolve'(resolve, reject, emitter) {
        emitter.on(['success', 'ok'], 'error')
            .then(resolve)
            .catch(reject);
        emitter.emit('ok');
    },
    'multi event reject'(resolve, reject, emitter) {
        emitter.on(['success', 'ok'], ['error', 'oops'])
            .then(reject)
            .catch(resolve);
        emitter.emit('oops');
    },
    'events all'(resolve, reject, emitter) {
        const steps = ['step1', 'step2', 'step3'];
        emitter.all(steps).then(resolve).catch(reject);
        steps.map(stepName => emitter.emit(stepName));
    },
    'remove listener'(resolve, reject, emitter) {
        emitter.once('event')
            .then(reject)
            .catch(resolve);
        emitter.off('event', {toPromiseEmitter: ['reject']});
    },
    'remove listeners'(resolve, reject, emitter) {
        Promise.all([
            emitter.once('event')
                .then(() => Promise.reject())
                .catch(() => Promise.resolve()),
            emitter.once('event')
                .then(() => Promise.reject())
                .catch(() => Promise.resolve()),
        ])
            .then(resolve)
            .catch(reject);
        
        emitter.off('event', {toPromiseEmitter: ['reject']});
    },
    'static subscribe resolve'(resolve, reject) {
        const emitter = new EventEmitter();
        PromisifyEmitter.on(emitter, 'success', 'error').then(resolve);
        emitter.emit('success');
    },
    'static subscribe reject'(resolve, reject) {
        const emitter = new EventEmitter();
        PromisifyEmitter.on(emitter, 'success', 'error').catch(resolve);
        emitter.emit('error');
    }
}

Promise.all(Object.keys(tests).map(testName => {
    const timeEnd = type => data => {
        console.timeEnd(testName);
        console[type](type === 'log' ? 'ok' : 'fail', type === 'error' ? data : '', '\n'); 
        return Promise[type === 'log' ? 'resolve' : 'reject'](data);
    };

    return new Promise((resolve, reject) => {
        console.time(testName);
        setTimeout(() => reject('timeout'), 700);
        tests[testName](resolve, reject, new PromisifyEmitter(new EventEmitter));
    })
        .then(timeEnd('log'))
        .catch(timeEnd('error'));
}))
    .then(() => console.log('All tests passed'))
    .catch(() => console.error('Some test failed'));