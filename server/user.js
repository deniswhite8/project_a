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

	this.setPrimaryAvatar = function (avatar, _first) {
		primaryAvatar.user = null;
		avatar.user = this;

		primaryAvatar = avatar;

		if(!_first) socket.emit.call(selfSocket, 'ctrl', primaryAvatar.getId());
	};

	this.setForeignAvatar = function (avatar, _first) {
		if(foreignAvatar) foreignAvatar.user = null;
		if(avatar) avatar.user = this;

		foreignAvatar = avatar;

		if(avatar) {
			primaryAvatar.disable();
			if(!_first) socket.emit.call(selfSocket, 'ctrl', foreignAvatar.getId());
			socket.broadcast.emit.call(selfSocket, 'del', primaryAvatar.getId());
		} else {
			this.setPrimaryAvatar(primaryAvatar, true);
			primaryAvatar.enable();
            avatarsManager.send('both', socket.broadcast.emit, primaryAvatar.getId(), selfSocket);
		}
	};

	this.setSocket = function (_socket, self) {
		socket = _socket;
		selfSocket = self;
	};

	this.init = function() {
        if(foreignAvatar) {
        	foreignAvatar.enable();
        	avatarsManager.send('both', socket.broadcast.emit, foreignAvatar.getId(), selfSocket);
        }
		this.setForeignAvatar(foreignAvatar, true);

        avatarsManager.sendAll('both', socket.emit, selfSocket);

		if(foreignAvatar) socket.emit.call(selfSocket, 'ctrl', foreignAvatar.getId());
		else socket.emit.call(selfSocket, 'ctrl', primaryAvatar.getId());
	};

	this.input = function(data) {
		if(foreignAvatar) foreignAvatar.input(data);
		else primaryAvatar.input(data);
	};

	this.getSocket = function () {
		return socket;
	};

	this.getId = function() {
		return id;
	};

	this.disconnect = function() {
		if (foreignAvatar) {
			foreignAvatar.disable();
			socket.broadcast.emit.call(selfSocket, 'del', foreignAvatar.getId());
		} else {
			primaryAvatar.disable();
			socket.broadcast.emit.call(selfSocket, 'del', primaryAvatar.getId());
		}
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