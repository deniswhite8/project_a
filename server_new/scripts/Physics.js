var cp = require('chipmunk');


var Physics = function() {
    this._space = null;
};

Physics.prototype.init = function() {
	this._space = new cp.Space();
	this._space.iterations = config.physics.iterations;
};

Physics.prototype.addBody = function(body) {
	if (body._active) return;

	body._active = true;
	var space = this._space;

	space.addBody(body._body);
	space.addBody(body._controlBody);
	space.addShape(body._shape);
	space.addConstraint(body._pivot);
	if(body._isRotated) space.addConstraint(body._gear);
};

Physics.prototype.removeBody = function(body) {
	if (!body || !(body instanceof PhysicsBody) || !body._active) return;

	body._active = false;
	var space = this._space;

	space.removeBody(body._body);
	space.removeBody(body._controlBody);
	space.removeShape(body._shape);
	space.removeConstraint(body._pivot);
	if (body._isRotated) space.removeConstraint(body._gear);
};

Physics.prototype.createBody = function(params) {
	var body = new PhysicsBody(params);
	this.addBody(body);
};

module.exports = Physics;