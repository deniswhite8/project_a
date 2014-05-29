var avatars = [];


var avatarsConf = {
	panzer: {
		speed: 1
	}
};

var inputUpdateData = {
    panzer: function(avatar, input) {
        if (input.angle !== undefined) avatar.params.turretAngle = input.angle;
        if (input.right !== undefined) avatar.params.bodyAngle += 0.02;
        if (input.left !== undefined) avatar.params.bodyAngle -= 0.02;

        var dir = 0;
        if (input.down !== undefined) dir++;
        if (input.up !== undefined) dir--;

        avatar.move(dir);
    }
};

function Avatar(id, name) {
	this.params = {};

	var active = true;

	this.message = function(type) {
		if (type == 'new') {
			return {
				id: id,
				name: name
			};
		} else if (type == 'upd') {
			return {
				id: id,
				params: this.params
			};
		}
	};

	this.getId = function() {
		return id;
	};

	this.enable = function() {
		active = true;
	};

	this.disable = function() {
		active = false;
	};

	this.isActive = function() {
		return active;
	};

	this.getName = function() {
		return name;
	};

	this.move = function(dir) {
		if (dir > 0) dir = 1;
		else if (dir < 0) dir = -1;
		else dir = 0;

		var angle = this.params.bodyAngle + Math.PI/2;

		this.params.x += Math.cos(angle) * avatarsConf[name].speed * dir;
		this.params.y += Math.sin(angle) * avatarsConf[name].speed * dir;
	};
}



module.exports = {
	add: function(name, params) {
		var id = avatars.length,
			avatar = new Avatar(id, name);
		avatar.params = params;
		avatars.push(avatar);

		return avatar;
	},

	addAll: function(dbArray) {
		dbArray.forEach(function(e, i) {
			var avatar = module.exports.add(e.name, e.params);
			if(!e.active) avatar.disable();
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
		if(type == 'both') {
			fn.call(self, 'new', avatars[id].message('new'));
			fn.call(self, 'upd', avatars[id].message('upd'));
		} else {
			fn.call(self, type, avatars[id].message(type));
		}
	},

	sendAll: function(type, fn, self) {
		avatars.forEach(function(e, i) {
			if(e.isActive()) {
				if(type == 'both') {
					console.log(e.message('new'));
					fn.call(self, 'new', e.message('new'));
					fn.call(self, 'upd', e.message('upd'));
				} else {
					fn.call(self, type, e.message(type));
				}
			}
		});
	},

	input: function(id, input) {
		var avatar = avatars[id],
			fn = inputUpdateData[avatar.getName()];
		fn(avatar, input);
	},

	get: function(id) {
		return avatars[id];
	}
};