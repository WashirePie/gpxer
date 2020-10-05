
const bindInnerHTML = (element, observable) =>
{
    element.innerHTML = observable.value;
    observable.subscribe(() => element.innerHTML = observable.value);
}

const bindValue = (input, observable) => 
{
    input.value = observable.value;
    observable.subscribe(() => input.value = observable.value);
    input.onkeyup = () =>  observable.value = input.value;
};

const bindSelectValue = (select, observable) =>
{
    select.onchange = () => observable.value = select.value; ;
}

class Observable 
{
    constructor(value) 
    {
        this._listeners = [];
        this._value = value;
    }

    notify = () => { this._listeners.forEach(listener => listener(this._value)); }

    subscribe = (listener) => { this._listeners.push(listener); }

    get value() { return this._value; }

    set value(val) 
    {
        if (val !== this._value) 
        {
            this._value = val;
            this.notify();
        }
    }
}

class Computed extends Observable 
{
    constructor(value, deps) 
    {
        super(value());

        const listener = () => 
        {
            this._value = value();
            this.notify();
        }

        deps.forEach(dep => dep.subscribe(listener));
    }

    get value() { return this._value; }

    set value(_) { throw "Cannot set computed property"; }
}