var cp = require('chipmunk');


var PhysicsBody = function(params) {
	this._create(params);
	this._active = false;
};

PhysicsBody.prototype._create = function(params) {
	var body = this._body = new cp.Body(params.mass, cp.momentForBox(params.mass, params.width, params.height));
	body.setPos(cp.v(params.x, params.y));

	this._isRotated = params.isRotated;
	if (this._isRotated) body.setAngle(params.angle);

	this._shape = new cp.BoxShape(body, params.width, params.height);

	var controlBody = this._controlBody = new cp.Body(Infinity, Infinity);

    var pivot = this._pivot = new cp.PivotJoint(controlBody, body, cp.vzero, cp.vzero);
    pivot.maxBias = 200;
    pivot.maxForce = params.mass*30;
    
    var gear = this._gear = null;

    if (this._isRotated) {
    	this._gear = gear = new cp.GearJoint(controlBody, body, 0, 1);
		gear.errorBias = 0;
		gear.maxBias = 1.2;
		gear.maxForce = 50000;
	}
};

PhysicsBody.prototype._update = function() {
	this._controlBody.setPos(cp.v.add(cp.v.sub(this._body.getPos(), this._body.getVel()), this._dir));
    if (this._isRotated) this._controlBody.setAngle(-this._body.getAngVel() - this._angle);

    var vel = this._body.getVel();
    if(vel.x * this._oldVel.x <= 0 && vel.y * this._oldVel.y <= 0 && vel.x + this._oldVel.x + vel.y + this._oldVel.y !== 0) {
    	this._body.setVel(cp.vzero);
    }
    this._oldVel = vel;

	var pos = this._body.getPos();
	this.x = pos.x;
	this.y = pos.y;
};

PhysicsBody.prototype.move = function(angle, speed) {
	this._dir = cp.v(Math.cos(angle) * speed, Math.sin(angle) * speed);
};

PhysicsBody.prototype.stop = function() {
	this._dir = cp.vzero;
};

PhysicsBody.prototype.rotate = function(angle) {
	this._angle = angle;
};

PhysicsBody.prototype.getParams = function() {
	return {
		x: this._body.getPos().x,
		y: this._body.getPos().y,
		angle: this._isRotated ? this._body.getAngle : this._angle
	};
};

module.exports = PhysicsBody;