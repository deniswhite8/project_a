var avatars = [],
	avatarNames = {},
	cp = require('chipmunk'),
	space = new cp.Space();

space.iterations = 10;

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
			if(e.isActive()) e.update();
		});
	},

	addClasses: function(path) {
		require("fs").readdirSync("./" + path).forEach(function(file) {
			var A = require("./" + path + "/" + file);
			avatarNames[A.name] = A;
			inherit(A);
		});
	}
};