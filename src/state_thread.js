
export const StateThread = function () {

  const map = new WeakMap();
  const freezeList = [];

  const forUpdate = function (obj) {

    // If we already own obj or a copy of it, return the value we own.
    if (map.has(obj))
      return map.get(obj);

    // Make an updatable copy of an object or array.
    if (typeof obj === 'object') {
      let mine;
      if (Array.isArray(obj)) {
        mine = obj.slice();
        mine._ = _getter;
      } else {
        mine = Object.create(Object.getPrototypeOf(obj));
        Object.keys(obj).forEach(function (prop) {
          mine[prop] = obj[prop];
        });
        if (obj.__state_thread_enabled)
          setUp(mine);
        else
          mine._ = _getter;
      }
      map.set(obj, mine);
      map.set(mine, mine);
      freezeList.push(mine)
      return mine;
    }

    if (typeof obj === 'function')
      throw 'updatable functions are not supported';

    // Other types (string|number|boolean|undefined|symbol) are immutable.
    throw ('forUpdate called on immutable value ' + obj);
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
    obj.__thread = state_thread;
    obj.__changed = false;
  };

  const tearDown = function (obj, nested) {
    delete obj.__changed;
    delete obj.__thread;
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
    const that = thread.forUpdate(this);
    func.apply(that, arguments);
    const result = that.__changed ? that : this;
    thread.tearDown(that);
    thread.freeze();
    return result;
  };
};

export default StateThread;
