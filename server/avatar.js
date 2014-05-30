var avatars = [],
	avatarNames = {};

avatarNames.panzer = function (args) {
	var	bodyAngle = args.bodyAngle,
		turretAngle = args.turretAngle,
		speed = 2;

	this.name = args.name;
	this.id = args.id;
	this.active = args.active;
	this.x = args.x;
	this.y = args.y;

	this.updMessage = function() {
		return {
			id: this.id,
			params: {
				x: this.x,
				y: this.y,
				bodyAngle: bodyAngle,
				turretAngle: turretAngle
			}
		};
	};

	this.input = function(input) {
		if (input.angle !== undefined) turretAngle = input.angle;
        if (input.right !== undefined) bodyAngle += 0.02;
        if (input.left !== undefined) bodyAngle -= 0.02;

        var dy = 0;
        if (input.down !== undefined) dy++;
        if (input.up !== undefined) dy--;

        if(dy) this.move(bodyAngle + Math.atan2(dy, 0), speed);
	};
};

avatarNames.man = function (args) {
	var	bodyAngle = args.bodyAngle,
		speed = 1;

	this.name = args.name;
	this.id = args.id;
	this.active = args.active;
	this.x = args.x;
	this.y = args.y;

	this.updMessage = function() {
		return {
			id: this.id,
			params: {
				x: this.x,
				y: this.y,
				bodyAngle: bodyAngle
			}
		};
	};

	this.input = function(input) {
		if (input.angle !== undefined) bodyAngle = input.angle;
        

        var dx = 0, dy = 0;
        if (input.down !== undefined) dy++;
        if (input.up !== undefined) dy--;
        if (input.right !== undefined) dx++;
        if (input.left !== undefined) dx--;

        if(dx || dy) this.move(bodyAngle + Math.atan2(dy, dx), speed);
	};
};

function inherit(A) {
	A.prototype.getId = function() {
		return this.id;
	};

	A.prototype.enable = function() {
		this.active = true;
	};

	A.prototype.disable = function() {
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

	A.prototype.move = function(angle, speed) {
		this.x += Math.cos(angle) * speed;
		this.y += Math.sin(angle) * speed;
	};
}

inherit(avatarNames.panzer);
inherit(avatarNames.man);


module.exports = {
	add: function(args) {
		var avatar = new avatarNames[args.name](args);
		avatars[args.id] = avatar;
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
	}
};