let test = {
    svgNS: 'http://www.w3.org/2000/svg',
    signal: {
        increment: 'INCREMENT',
        decrement: 'DECREMENT'
    }
};


let makeSignaller = function () {
    let _subscribers = [];
    return {
        add: function (s) {
            _subscribers.push(s);
        },

        notify: function (args) {
            for (let i = 0; i < _subscribers.length; i++) {
                _subscribers[i](args);
            }
        }
    };
}

let makeModel = function () {
    let _x = 0;
    let _y = 0;
    let _count = 0;

    let _observers = makeSignaller();

    return {
        // Position changing
        updatePosition: function (x, y) {
            _x = x;
            _y = y;
            _observers.notify();
        },

        getX: function () {
            return _x;
        },

        getY: function () {
            return _y;
        },

        getCount: function () {
            return _count;
        },

        increment: function () {
            _count += 1;
            _observers.notify();
        },

        decrement: function () {
            _count -= 1;
            _observers.notify();
        },

        get: function () {
            return _count;
        },
        // Register to listener events
        register: function (fxn) {
            _observers.add(fxn);
        }
    };
}

let makeSVGView = function (model, svgID) {
    let _svg = document.getElementById(svgID);
    _svg.addEventListener('mousemove', (myEvent) => {
        model.updatePosition(
            myEvent.offsetX,
            myEvent.offsetY
        );
    });

    let _cleanSVG = function () {
        while (_svg.firstChild) {
            _svg.removeChild(_svg.firstChild);
        }
    }

    let _makeCircle = function (x, y) {
        let circle = document.createElementNS(test.svgNS, 'circle');

        circle.setAttributeNS(null, 'cx', x);
        circle.setAttributeNS(null, 'cy', y);
        circle.setAttributeNS(null, 'r', 15);
        circle.setAttributeNS(null, 'fill', 'blue');

        _svg.appendChild(circle);
    };

    return {
        render: function () {
            _cleanSVG();
            let count1 = model.getCount();
            let x = model.getX();
            let y = model.getY();
            // TODO: make it so that only create a circle when clicked in btnview
            if (count1 > 0)
                _makeCircle(x, y);
        }
    };
}

// Increment button
let makeButtonView = function (model, btnID) {
    let _btn = document.getElementById(btnID);

    let _observers = makeSignaller();

    // Fire event
    let _fireIncrementEvent = function () {
        _observers.notify({
            type: test.signal.increment
        })
    };

    _btn.addEventListener('click', _fireIncrementEvent);

    return {
        render: function () {
            _btn.setAttribute('value', model.get());
        },

        register: function (fxn) {
            _observers.add(fxn);
        }
    };
}

// Decrement button
let makeButtonView2 = function (model, btnID) {
    let _btn = document.getElementById(btnID);

    let _observers = makeSignaller();

    // Fire event
    let _fireDecrementEvent = function () {
        _observers.notify({
            type: test.signal.decrement
        })
    };

    _btn.addEventListener('click', _fireDecrementEvent);

    return {
        render: function () {
            _btn.setAttribute('value', model.get());
        },

        register: function (fxn) {
            _observers.add(fxn);
        }
    };
}

let makeController = function (model) {
    let _increment = function () {
        model.increment();
    }

    let _decrement = function () {
        model.decrement();
    }

    return {
        dispatch: function (evt) {
            switch (evt.type) {
                case test.signal.decrement:
                    _decrement();
                    break;
                case test.signal.increment:
                    _increment();
                    break;
                default:
                    console.log('Unknown Event Type: ', evt);
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", function (event) {
    let model = makeModel();

    let btnView = makeButtonView(model, 'button1');
    let btnView2 = makeButtonView2(model, 'button2');
    let svgView = makeSVGView(model, 'svg');

    let controller = makeController(model);

    model.register(btnView.render);
    model.register(btnView2.render);
    model.register(svgView.render);

    btnView.register(controller.dispatch);
    btnView2.register(controller.dispatch);
});