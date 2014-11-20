var Cached = require('../../common/Cached.js');

var Input = function() {
    this._dx = 0;
    this._dy = 0;
    this.mouseAngle = 0;
    this._pressedKeys = [];
    this._cached = new Cached();
};

Input.prototype.setOffset = function(dx, dy) {
	this._dx = dx;
	this._dy = dy;
};

Input.prototype.setSelfAvatar = function(avatar) {
	this._selfAvatar = avatar;
};

Input.prototype.getSelectAvatar = function() {
	return this._selectAvatar;
};

Input.prototype.init = function (viewElement, avatars) {
	var rendererRect = viewElement.getBoundingClientRect(),
		width = viewElement.width,
		height = viewElement.height,
        self = this;

	viewElement.addEventListener('mousemove', function(event) {
	    self.mouseX = event.clientX - rendererRect.left;
		self.mouseY = event.clientY - rendererRect.top;
	    self.mouseAngle = Math.atan2(self.mouseY - height/2, self.mouseX - width/2);
	}, false);

	viewElement.addEventListener('mousedown', function(event) {
		var mouseX = event.clientX - rendererRect.left,
		    mouseY = event.clientY - rendererRect.top;
		    
	    self._selectAvatar = null;
	   	avatars.some(function(avatar) {
	   	    if (avatar != self._selfAvatar &&
	   	        Math.pow(avatar.rootNode._sprite.position.x - mouseX + self._dx, 2) +
	   	        Math.pow(avatar.rootNode._sprite.position.y - mouseY + self.dy, 2) <
	   	        Math.pow(avatar.rootNode.radius, 2)) {
	   	            
	    		self._selfAvatar = avatar;
	    		return true;
	    	}
	   	});
    }, false);

    viewElement.addEventListener('mouseup', function(event) {

    }, false);

    window.addEventListener('keydown', function(event) {
        self._pressedKeys[event.keyCode] = true;
    }, false);

    window.addEventListener('keyup', function(event) {
        self._pressedKeys[event.keyCode] = false;
    }, false);
};

Input.prototype.keyIsPressed = function(keyCode) {
	if (typeof keyCode == 'string')
		keyCode = keyCode.toUpperCase().charCodeAt(0);
	return !!this._pressedKeys[keyCode];
};

Input.prototype.getInputData = function() {
	var input = {
		angle: this.mouseAngle,
		up: this.keyIsPressed('W'),
		down: this.keyIsPressed('S'),
		left: this.keyIsPressed('A'),
		right: this.keyIsPressed('D'),
		inOut: this.keyIsPressed('E') &&
			this.getSelectAvatar() &&
			this.getSelectAvatar().id
	};

	return this._cached.clean(input, 'input');
};

module.exports = Input;