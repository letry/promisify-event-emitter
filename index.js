const {defaultEmitterMethodNames} = require('./config.json');
const PromiseEmitter = require('promise-event-emitter');
const getProps = (object, props) => props.find(prop => object[prop]);

module.exports = class PromisifyEventEmitter extends PromiseEmitter {
    constructor(emitter, {
        on = getProps(emitter, defaultEmitterMethodNames.on),
        off = getProps(emitter, defaultEmitterMethodNames.off),
        emit = getProps(emitter, defaultEmitterMethodNames.emit)
    } = {}) {
        super();
        Object.assign(this, {
            originalNames: {on, off, emit},
            eventCallbackMap: new Map(),
            emitter
        });
    }
    once(event, ...otherArgs) {
        const promise = super.once(event);

        if (!this.eventCallbackMap.get(event)) {
            const callback = (...args) => {
                this.emitter[this.originalNames.off](event, callback);
                this.eventCallbackMap.delete(event);        
                return super.emit(event, ...args);
            }
            this.eventCallbackMap.set(event, callback);
            this.emitter[this.originalNames.on](event, callback, ...otherArgs);
        }

        return promise;
    }
    off(event, {toEmitter = [], toPromiseEmitter = []} = {}) {
        const callback = this.eventCallbackMap.get(event) || (() => {});
        this.emitter[this.originalNames.off](event, callback, ...toEmitter);
        return this.eventCallbackMap.delete(event) && super.off(event, ...toPromiseEmitter);
    }
    emit(event, ...args) {
        return this.emitter[this.originalNames.emit](event, ...args);
    }
    static on(context, successEvents = [], rejectEvents = [], options) {
        return new PromisifyEventEmitter(context, options).on(successEvents, rejectEvents);
    }
}