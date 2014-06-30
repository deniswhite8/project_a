var users = [],
	sid2uidData = {},
	map = require('./map.js'),
	avatarsManager = require('./avatar.js');


function User(id, login, passwd, primaryAvatar, foreignAvatar) {

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

		this.emit2self('ctrl', primaryAvatar.getId());
	};

	this.setForeignAvatar = function (avatar) {

		if(foreignAvatar) foreignAvatar.user = null;
		if(avatar) avatar.user = this;

		foreignAvatar = avatar;

		if(avatar) {
			primaryAvatar.disable();
			this.emit2self('ctrl', foreignAvatar.getId());
			if(foreignAvatar.isActive()) map.pointOutUser(foreignAvatar);
		} else {
			this.setPrimaryAvatar(primaryAvatar);
			primaryAvatar.enable();
		}
	};

	this.setSocket = function (_selfSocket) {
		selfSocket = _selfSocket;
	};

	this.getSocket = function() {
		return selfSocket;
	};




	this.emit2self = function(msg, data) {
		selfSocket.emit.call(selfSocket, msg, data);
	};




	this.sendNewChunk = function (obj) {
		this.emit2self('new_c', obj);
	};

	this.sendDeleteChunk = function (obj) {
		this.emit2self('del_c', obj);
	};

	this.sendMapConf = function (conf) {
		this.emit2self('map_cnf', conf);
	};



	this.init = function() {
		this.setForeignAvatar(foreignAvatar);

        if(foreignAvatar) {
        	foreignAvatar.enable();
        }

		if(foreignAvatar) this.emit2self('ctrl', foreignAvatar.getId());
		else this.emit2self('ctrl', primaryAvatar.getId());
	};

	this.input = function(data) {
		if(foreignAvatar) foreignAvatar.input(data);
		else primaryAvatar.input(data);
	};

	this.getId = function() {
		return id;
	};

	this.disconnect = function() {
		if (foreignAvatar) {
			foreignAvatar.disable();
		} else {
			primaryAvatar.disable();
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