var users = [],
	sid2uidData = {},
	avatarsManager = require('./avatar.js');

function User(id, login, passwd, primaryAvatar, foreignAvatar) {
	var socket = null;

	this.login = login;
	this.passwd = passwd;

	var selfSocket;

	this.getPrimaryAvatar = function () {
		return primaryAvatar;
	};

	this.getForeignAvatar = function () {
		return foreignAvatar;
	};

	this.setPrimaryAvatar = function (avatar) {
		primaryAvatar.user = null;
		avatar.user = this;

		primaryAvatar = avatar;

		socket.emit.call(selfSocket, 'ctrl', primaryAvatar.getId());
	};

	this.setForeignAvatar = function (avatar) {
		foreignAvatar.user = null;
		if(avatar) avatar.user = this;

		foreignAvatar = avatar;

		if(avatar) {
			socket.emit.call(selfSocket, 'ctrl', primaryAvatar.getId());
		} else {
			socket.emit(selfSocket, 'ctrl', foreignAvatar.getId());
		}
	};

	this.setSocket = function (_socket, self) {
		socket = _socket;
		selfSocket = self;

		if(foreignAvatar) this.setForeignAvatar(foreignAvatar);
		else this.setPrimaryAvatar(primaryAvatar);
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
			user = new User(id, login, passwd, avatarsManager.get(primaryAvatar), avatarsManager.get(foreignAvatar));
		users.push(user);
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