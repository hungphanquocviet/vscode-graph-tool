// I encapsulate my "global" variables in this object in case I use anything
// else.
let lec3 = {
    svgNS: 'http://www.w3.org/2000/svg',
    signal: {
        increment: 'INCREMENT'
    }
};


// This class just implements a simple subscriber model.
// Anyone can create their own signaller and add functions to it.
// When the update, they call notify() which causes all the callbacks to fire
//
// Here I am encapsulating everything in a function like it was a class.
let makeSignaller = function () {

    // "Private" member 
    let _subscribers = [];

    // What I return is an object with two functions
    // These are essentially my public methods
    return {

        // Add my function to the list of subscribers
        add: function (s) {
            _subscribers.push(s);
        },

        // Notify each subscribed function with whatever args I give it
        notify: function (args) {
            for (let i = 0; i < _subscribers.length; i++) {
                _subscribers[i](args);
            }
        }
    };
}

// This is where I store my state. It's like the "State" variable I had 
// on the board.
let makeModel = function () {

    // My private members, including my own signaller
    let _count = 0;
    let _observers = makeSignaller();

    // My return object has three methods in it that keep track of my internal
    // state (which is really just one variable, _count)
    return {

        // When I increment my variable, I notify anyone listening
        increment: function () {
            _count += 1;
            _observers.notify();
        },

        // Anyone can get the count from me with this.
        get: function () {
            return _count;
        },

        // How I let people register to listen for updates
        register: function (fxn) {
            _observers.add(fxn);
        }
    };
}

// Here's everything I'm allowing my SVG to do.
let makeSVGView = function (model, svgID) {

    // My internal reference to the DOM element
    let _svg = document.getElementById(svgID);

    // Delete everything! I use this before redrawing
    let _cleanSVG = function () {
        while (_svg.firstChild) {
            _svg.removeChild(_svg.firstChild);
        }
    }

    // Here's how I draw a circle at point x, y
    let _makeCircle = function (x, y) {
        let circle = document.createElementNS(lec3.svgNS, 'circle');

        circle.setAttributeNS(null, 'cx', x);
        circle.setAttributeNS(null, 'cy', y);
        circle.setAttributeNS(null, 'r', 15);
        circle.setAttributeNS(null, 'fill', 'blue');

        _svg.appendChild(circle);
    };

    // I only expose one function, "render" which draws based on the state
    return {
        render: function () {
            // Delete everything!
            _cleanSVG();

            // I'm going to draw based on the "state" of my model
            let count = model.get();

            // Draw the number of circles to fit in the SVG
            for (let i = 0; i < count; i++) {
                let y = Math.floor(i / 10);
                let x = i - (y * 10);
                _makeCircle(x * 30 + 15, y * 30 + 15);
            }
        }
    };
}

// Here's how I encapsulate a ButtonView so I can use it twice
let makeButtonView = function (model, btnID) {
    // Get the exact button from the DOM
    let _btn = document.getElementById(btnID);

    // I also have observers
    let _observers = makeSignaller();

    // I'm going to have an event that the controller listens for. That way
    // the controller can be between me and the model. Depending on what
    // framework you use, you might not need one of these.
    // Increment happens
    let _fireIncrementEvent = function () {
        _observers.notify({
            type: lec3.signal.increment // My argument tells me WHAT just happened

        })
        console.log("Shomething2")
    };

    // Initialization immediately sets the display to whatever is in the model
    _btn.setAttribute('value', model.get());

    // I add an event listener for a click event
    // You could do the same with your SVG with a mouse move event!
    _btn.addEventListener('click', _fireIncrementEvent);
    console.log("Shomething")

    return {
        // I render by updating the number.
        render: function () {
            _btn.setAttribute('value', model.get());
        },

        // I let people listen to my changes
        register: function (fxn) {
            _observers.add(fxn);
        }

    };
}

// This is my controller. It implements something similar to the pattern by
// Facebook's Flux framework.
let makeController = function (model) {

    // I have my own increment function. I could change it before the model
    // but basically it does the same thing. This indirection is not necessary
    // but just a demonstration.
    let _increment = function () {
        model.increment();
    }

    // In Flux, I have one call, dispatch. Dispatch listens for events and
    // then implements what should happen based on the event type.
    return {
        dispatch: function (evt) {
            switch (evt.type) {
                case lec3.signal.increment:
                    _increment();
                    break;
                default:
                    console.log('Unknown Event Type: ', evt);
            }
        }
    };
}

// This happens when the webpage loads
document.addEventListener("DOMContentLoaded", function (event) {
    // I create the model to hold my state
    let model = makeModel();

    // I create these different views that are based on model data
    let btnView = makeButtonView(model, 'button1');
    let btnView2 = makeButtonView(model, 'button2');
    let svgView = makeSVGView(model, 'svg');

    // I have a controller that is allowed to touch the model directly
    let controller = makeController(model);

    // All the render functions of the views register with the model. That
    // way, when the model updates, it will notify them to redraw.
    model.register(btnView.render);

    model.register(svgView.render);
    model.register(btnView2.render);

    // Since button views create new events, I register the controller
    // dispatch with them. That way the controller can handle the model
    // changes.
    btnView.register(controller.dispatch);
    btnView2.register(controller.dispatch);
});
