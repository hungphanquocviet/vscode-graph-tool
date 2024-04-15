// This file implements a basic MVC patterned after Flux and using JS
// closures. It's probably easier to use an existing framework rather than
// this one, but I originally used it because it had no depenencies. I'll see
// if I can make it more simple in another example.


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
	// Array of functions
	let _subscribers = [];

	// What I return is an object with two functions
	// These are essentially my public methods
	return {

		// Add my function to the list of subscribers
		add: function (s) {
			// e.g. [dothing1, dothing2]
			_subscribers.push(s);
		},

		// Notify each subscribed function with whatever args I give it
		notify: function (args) {
			for (let i = 0; i < _subscribers.length; i++) {
				// e.g. notify(12) -> call dothing1(12), dootherthing(12)
				_subscribers[i](args);
			}
		}
	};
}

// This is where I store my state. It's like the "State" variable I had 
// on the board.
let makeModel = function () {

	// My private members, including my own signaller
	let _x = 0
	let _y = 0
	let _observers = makeSignaller();

	// My return object has three methods in it that keep track of my internal
	// state (which is really just one variable, _count)
	return {

		// When I increment my variable, I notify anyone listening
		// When my position updates, keep track
		updatePosition: function (x, y) {
			_x = x;
			_y = y;
			_observers.notify();
		},

		// Accessors
		getX: function () {
			return _x;
		},

		getY: function () {
			return _y;
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

	// Listen for a mouse movement! I'm using the JS arrow function expression
	// here too so I can save some typing. Basically this says that on
	// mousemove, I'm going to execute the following commands.
	//
	// Note how I am updating state directly. I could just update my SVG
	// directly, but I want to save state in case I have other views in the
	// future that all need to use the same state.
	_svg.addEventListener('mousemove', (myEvent) => {
		model.updatePosition(
			myEvent.offsetX,
			myEvent.offsetY
		);
	});

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
			let x = model.getX();
			let y = model.getY();

			_makeCircle(x, y);
		}
	};
}

// This happens when the webpage loads
document.addEventListener("DOMContentLoaded", function (event) {
	// I create the model to hold my state
	let model = makeModel();

	// I create these different views that are based on model data
	let svgView = makeSVGView(model, 'svg');

	// All the render functions of the views register with the model. That
	// way, when the model updates, it will notify them to redraw.
	model.register(svgView.render);
});
