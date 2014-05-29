var users = [],
	sid2uidData = {},
	avatarsManager = require('./avatar.js');

function User(id, login, passwd, primaryAvatar, foreignAvatar) {
	var socket = null;

	this.login = login;
	this.passwd = passwd;

	this.getPrimaryAvatar = function () {
		return avatarsManager.get(primaryAvatar);
	};

	this.setSocket = function (_socket) {
		socket = _socket;
	};

	this.getSocket = function () {
		return socket;
	};

	this.getId = function() {
		return id;
	};
}

module.exports = {
	add: function(login, passwd, primaryAvatar, foreignAvatar) {
		var id = users.length,
			user = new User(id, login, passwd, primaryAvatar, foreignAvatar);
		users.push(user);

		return user;
	},

	addAll: function(dbArray) {
		dbArray.forEach(function(e) {
			module.exports.add(e.login, e.passwd, e.primaryAvatar, e.foreignAvatar);
		});
	},

	login: function(login, passwd) {
		var id = null;

		users.forEach(function(user, i) {
	        if (user.login === login && user.passwd === passwd) {
	            id = i;
	        }
	    });

	    if(id === null) return null;
	    else return users[id];
	},

	setSid: function(user, sid) {
		sid2uidData[sid] = user.getId();
	},

	getBySid: function(sid) {
		var uid = sid2uidData[sid];
		return users[uid];
	}
};