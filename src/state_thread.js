
export const StateThread = function () {

  const map = new WeakMap();
  const freezeList = [];

  const forUpdate = function (obj) {

    // If we already own obj or a copy of it, return the value we own.
    if (this.map.has(obj))
      return this.map.get(obj);

    // Make an updatable copy of an object or array.
    if (typeof obj === 'object') {
      let mine;
      if (Array.isArray(obj)) {
        mine = obj.slice();
        mine._ = getter;
      } else {
        if (obj.__state_thread_enabled) {
          mine = setUp(mine, state_thread);
        } else {
          mine = Object.create(Object.getPrototypeOf(obj));
          Object.keys(obj).forEach(function (prop) {
            mine[prop] = obj.prop;
          });
          mine._ = _getter;
        }
      }
      this.map.set(obj, mine);
      this.map.set(mine, mine);
      freezeList.push(mine)
      return mine;
    }

    if (typeof obj === 'function')
      throw 'updatable functions are not supported';

    // Other types (string|number|boolean|undefined|symbol) are immutable.
    throw 'forUpdate called on immutable value';
  };

  const freeze = function () {
    freezeList.forEach(function (obj) {
      if (obj.__state_thread_enabled) {
        tearDown(obj, state_thread, true);
      } else {
        delete obj._;
      }
      Object.freeze(obj);
    });
  };

  const setUp = function (obj) {
    const that = forUpdate(obj);
    that.__thread = state_thread;
    that.__original = obj;
    that.__changed = false;
    return that;
  };

  const tearDown = function (obj, nested) {
    const result = (nested || obj.__changed) ? obj : obj.__original;
    delete obj.__changed;
    delete obj.__original;
    delete obj.__thread;
    return result;
  };

  const _getter = function (key) {
    return this[key] = forUpdate(this[key]);
  };

  const state_thread = {forUpdate, freeze, setUp, tearDown};

  return state_thread;
};

StateThread.enable = function (constr, props) {

  Object.defineProperty(
    constr.prototype,
    '__state_thread_enabled',
    {
      value: true,
      writable: false,
      enumerable: false,
      configurable: false
    }
  );

  props.forEach(function (prop) {
    Object.defineProperty(constr.prototype, '_'+prop, {
      get: function () {
        const mine = this.__thread.forUpdate(this[prop]);
        this[prop] = mine;
        this.__changed = true;
        return mine;
      }
    });
  });

};

StateThread.run = function (func) {
  return function () {
    const thread = StateThread();
    const that = thread.setUp(this);
    func.apply(that, arguments);
    const result = thread.tearDown(that);
    thread.freeze();
    return result;
  };
};

export default StateThread;
