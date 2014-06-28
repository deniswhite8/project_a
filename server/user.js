var users = [],
	sid2uidData = {},
	avatarsManager = require('./avatar.js');

function User(id, login, passwd, primaryAvatar, foreignAvatar) {
	var socket = null;

	this.login = login;
	this.passwd = passwd;

	var selfSocket, allSocket, this4socket;

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

		if(!_first) selfSocket.emit.call(this4socket, 'ctrl', primaryAvatar.getId());
	};

	this.setForeignAvatar = function (avatar, _first) {

		if(foreignAvatar) foreignAvatar.user = null;
		if(avatar) avatar.user = this;

		foreignAvatar = avatar;

		if(avatar) {
			primaryAvatar.disable();
			if(!_first) selfSocket.emit.call(this4socket, 'ctrl', foreignAvatar.getId());
			allSocket.emit.call(allSocket, 'del', primaryAvatar.getId());
		} else {
			primaryAvatar.enable();
            avatarsManager.send('both', allSocket.emit, primaryAvatar.getId(), allSocket);
			this.setPrimaryAvatar(primaryAvatar, _first);
		}
	};

	this.setSocket = function (_selfSocket, _allSocket, _this4socket) {
		selfSocket = _selfSocket;
		allSocket = _allSocket;
		this4socket = _this4socket;
	};


	this.sendNewChunk = function (obj) {
		selfSocket.emit.call(this4socket, 'new_c', obj);
	};

	this.sendDeleteChunk = function (obj) {
		selfSocket.emit.call(this4socket, 'del_c', obj);
	};

	this.sendMapConf = function (conf) {
		selfSocket.emit.call(this4socket, 'map_cnf', conf);
	};

	this.init = function() {
        if(foreignAvatar) {
        	foreignAvatar.enable();
        	avatarsManager.send('both', selfSocket.broadcast.emit, foreignAvatar.getId(), this4socket);
        }
		this.setForeignAvatar(foreignAvatar, true);

        avatarsManager.sendAll('both', selfSocket.emit, this4socket);

		if(foreignAvatar) selfSocket.emit.call(this4socket, 'ctrl', foreignAvatar.getId());
		else selfSocket.emit.call(this4socket, 'ctrl', primaryAvatar.getId());
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
			selfSocket.broadcast.emit.call(this4socket, 'del', foreignAvatar.getId());
		} else {
			primaryAvatar.disable();
			selfSocket.broadcast.emit.call(this4socket, 'del', primaryAvatar.getId());
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