define(function () {
	var rendererRect = null,
		mouseAngle = 0,
		pressedKeys = [],
		width, height,
		arrayOfAvatars,
		oldAngle = 0;

	function keyIsPressed(keyCode) {
		if (typeof keyCode == 'string')
			keyCode = keyCode.charCodeAt(0);
		return pressedKeys[keyCode];
	}

	function getMouseAngle() {
		return mouseAngle;
	}

	return {
		init: function (view, _arrayOfAvatars) {
			arrayOfAvatars = _arrayOfAvatars;

			rendererRect = view.getBoundingClientRect();
			width = view.width;
			height = view.height;

			view.addEventListener('mousemove', function(e) {
			    var mouseX = e.clientX - rendererRect.left;
			    var mouseY = e.clientY - rendererRect.top;
			    mouseAngle = Math.atan2(mouseY - height/2, mouseX - width/2) + Math.PI/2;
			}, false);

			view.addEventListener('mousedown', function(e) {

		    }, false);

		    view.addEventListener('mouseup', function(e) {

		    }, false);

		    window.addEventListener('keydown', function(e) {
		        pressedKeys[e.keyCode] = true;
		    }, false);

		    window.addEventListener('keyup', function(e) {
		        pressedKeys[e.keyCode] = false;
		    }, false);
		},

		getInputData: function() {
			var newInput = {};
			
			var angle = getMouseAngle();
			if (angle != oldAngle) {
				newInput.angle = angle;
				oldAngle = angle;
			}

			var up = keyIsPressed('W'),
				down = keyIsPressed('S'),
				left = keyIsPressed('A'),
				right = keyIsPressed('D');

			/*if (up)*/ newInput.up = up;
			/*if (down)*/ newInput.down = down;
			/*if (left)*/ newInput.left = left;
			/*if (right)*/ newInput.right = right;

			if (Object.keys(newInput).length == 0) newInput = null;
			return newInput;
		}
	};
});