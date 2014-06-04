define(function () {
	var rendererRect = null,
		mouseAngle = 0,
		pressedKeys = [],
		width, height,
		arrayOfAvatars,
		oldInput = {},
		dx, dy,
		selectId;

	function keyIsPressed(keyCode) {
		if (typeof keyCode == 'string')
			keyCode = keyCode.charCodeAt(0);
		return pressedKeys[keyCode];
	}

	function getMouseAngle() {
		return mouseAngle;
	}

	function getSelectId() {
		return selectId;
	}

	return {
		setOffset: function(_dx, _dy) {
			dx = _dx;
			dy = _dy;
		},

		getSelectId: function() {
			return getSelectId();
		},

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
				var mouseX = e.clientX - rendererRect.left;
			    var mouseY = e.clientY - rendererRect.top;

			    selectId = null;
			   	for (var i in arrayOfAvatars) {
			   		var e = arrayOfAvatars[i];
			    	if( Math.pow(e._sprite.position.x - mouseX + dx, 2) + Math.pow(e._sprite.position.y - mouseY + dy, 2) < e.radius*e.radius ) {
			    		selectId = i;
			    		break;
			    	}
			    }
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
			
			var angle = getMouseAngle(),
				up = keyIsPressed('W'),
				down = keyIsPressed('S'),
				left = keyIsPressed('A'),
				right = keyIsPressed('D'),
				selectId = getSelectId();

			var newInput = {};

			if (oldInput.angle !== angle) oldInput.angle = newInput.angle = angle;
			if (oldInput.up !== up) oldInput.up = newInput.up = up;
			if (oldInput.down !== down) oldInput.down = newInput.down = down;
			if (oldInput.left !== left) oldInput.left = newInput.left = left;
			if (oldInput.right !== right) oldInput.right = newInput.right = right;
			if (oldInput.selectId !== selectId) oldInput.selectId = newInput.selectId = selectId;

			return newInput;
		}
	};
});