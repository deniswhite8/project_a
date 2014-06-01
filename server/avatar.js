var avatars = [],
	avatarNames = {},
	cp = require('chipmunk'),
	space = new cp.Space();

space.iterations = 10;


avatarNames.panzer = function (args) {
	var	turretAngle = args.turretAngle,
		speed = 5;

	this.init(args);
	this.phInit(100, 55, 55, true);


	this.updMessage = function() {
		return {
			id: this.id,
			params: {
				x: this.x,
				y: this.y,
				bodyAngle: this.angle,
				turretAngle: turretAngle
			}
		};
	};

	this.input = function(input) {
		if (input.angle !== undefined) turretAngle = input.angle;
        if (input.right) this.rotate(this.angle + 0.02);
        if (input.left) this.rotate(this.angle - 0.02);

        var dy = 0;
        if (input.down) dy++;
        if (input.up) dy--;

        if(dy) this.move(this.angle + Math.atan2(dy, 0), speed);
        else this.stop();
	};
};

avatarNames.man = function (args) {
	var	speed = 5;

	this.init(args);
	this.phInit(10, 20, 20, false);

	this.updMessage = function() {
		return {
			id: this.id,
			params: {
				x: this.x,
				y: this.y,
				bodyAngle: this.angle
			}
		};
	};

	this.input = function(input) {
		if (input.angle !== undefined) this.rotate(input.angle);
        

        var dx = 0, dy = 0;
        if (input.down) dy++;
        if (input.up) dy--;
        if (input.right) dx++;
        if (input.left) dx--;

        if(dx || dy) this.move(this.angle + Math.atan2(dy, dx), speed);
        else this.stop();
	};
};

function inherit(A) {

	A.prototype.init = function(args) {
		this.name = args.name;
		this.active = args.active;
		this.x = args.x;
		this.y = args.y;
		this.angle = args.angle;
	};

	A.prototype.getId = function() {
		return this.id;
	};

	A.prototype.enable = function() {
		space.addBody(this._phBody);
		space.addBody(this._phControlBody);
		space.addShape(this._phShape);
		space.addConstraint(this._phPivot);
		if(this._phUseAng) space.addConstraint(this._phGear);

		this.active = true;
	};

	A.prototype.disable = function() {
		space.removeBody(this._phBody);
		space.removeBody(this._phControlBody);
		space.removeShape(this._phShape);
		space.removeConstraint(this._phPivot);
		if(this._phUseAng) space.removeConstraint(this._phGear);

		this.active = false;
	};

	A.prototype.isActive = function() {
		return this.active;
	};

	A.prototype.getName = function() {
		return this.name;
	};

	A.prototype.newMessage = function() {
		return {
			id: this.id,
			name: this.name
		};
	};

	

	A.prototype.phInit = function(mass, width, height, useAngle) {
		this._phBody = new cp.Body(mass, cp.momentForBox(mass, width, height))
		this._phBody.setPos(cp.v(this.x, this.y));
		if(useAngle) this._phBody.setAngle(this.angle);

		this._phShape = new cp.BoxShape(this._phBody, width, height)

		this._phControlBody = new cp.Body(Infinity, Infinity);

	    this._phPivot = new cp.PivotJoint(this._phControlBody, this._phBody, cp.vzero, cp.vzero);
	    this._phPivot.maxBias = 200;
	    this._phPivot.maxForce = mass*30;
	    
	    this._phGear = null;
	    if (useAngle) {
	    	this._phGear = new cp.GearJoint(this._phControlBody, this._phBody, 0, 1);
			this._phGear.errorBias = 0;
			this._phGear.maxBias = 1.2;
			this._phGear.maxForce = 50000;
		}

		this._phDir = cp.vzero;
		this._phAng = 0;
		this._phUseAng = useAngle;
		this._phOldVel = cp.vzero;

		if (this.isActive()) this.enable();
	};

	A.prototype.move = function(angle, speed) {
		this._phDir = cp.v(Math.cos(angle) * speed, Math.sin(angle) * speed);
	};

	A.prototype.stop = function() {
		this._phDir = cp.vzero;
	};

	A.prototype.rotate = function(angle) {
		if(this._phUseAng) this._phAng = angle;
		else this.angle = angle;
	};

	A.prototype.phUpdate = function() {
		this._phControlBody.setPos(cp.v.add(cp.v.sub(this._phBody.getPos(), this._phBody.getVel()), this._phDir));
        if( this._phUseAng) this._phControlBody.setAngle(-this._phBody.getAngVel() - this._phAng);

        var vel = this._phBody.getVel();
        if(vel.x * this._phOldVel.x <= 0 && vel.y * this._phOldVel.y <= 0 && vel.x + this._phOldVel.x + vel.y + this._phOldVel.y != 0) {
        	this._phBody.setVel(cp.vzero);
        }
        this._phOldVel = vel;

		var pos = this._phBody.getPos();
		this.x = pos.x;
		this.y = pos.y;
		if( this._phUseAng) this.angle = this._phAng;
	};
}

inherit(avatarNames.panzer);
inherit(avatarNames.man);


module.exports = {
	add: function(args) {
		var id = avatars.length;
		var avatar = new avatarNames[args.name](args);
		avatar.id = id;
		avatars[id] = avatar;
	},

	addAll: function(dbArray) {
		dbArray.forEach(function(e) {
			module.exports.add(e);
		});
	},

	remove: function(id) {
		delete avatars[id];
	},

	enable: function(id) {
		avatars[id].enable();
	},

	disable: function(id) {
		avatars[id].disable();
	},

	send: function(type, fn, id, self) {
		if(type == 'new') 	   fn.call(self, 'new', avatars[id].newMessage());
		else if(type == 'upd') fn.call(self, 'upd', avatars[id].updMessage());
		else if(type == 'both') {
			fn.call(self, 'new', avatars[id].newMessage());
			fn.call(self, 'upd', avatars[id].updMessage());
		}
	},

	sendAll: function(type, fn, self) {
		avatars.forEach(function(e) {
			if(e.isActive()) {
				module.exports.send(type, fn, e.getId(), self);
			}
		});
	},

	input: function(id, input) {
		avatars[id].input(input);
	},

	get: function(id) {
		return avatars[id];
	},

	update: function(dt) {
		space.step(dt);
		avatars.forEach(function(e) {
			if(e.isActive()) e.phUpdate();
		});
	}
};