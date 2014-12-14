var config = null,
	logger = null;

var Chunk = function(x, y, tiles, chunks) {
	config = global.config;
	logger = global.logger;
	
	this._tiles = tiles;
	this._avatars = {};
	this._chunks = chunks;

	this.x = x;
	this.y = y;

	this.id = x + y * config.map.size;
	
	if (!this.x || !this.y || !this.id) {
		logger.warn('Incorrect chunk position (x = ' + this.x + ', y = ' + this.y + ', id = ' + this.id + ')');
	}
};

Chunk.prototype.addAvatar = function(avatar) {
	if (!avatar || !avatar.id || this._avatars[avatar.id]) return;

	this._avatars[avatar.id] = avatar;
	avatar.enable();
	avatar.chunk = this;

	this.vicinityForeach(function(chunk) {
		chunk.broadcast(config.network.messages.newAvatar, avatar.newMessage(), avatar);
		chunk.sendData(avatar, 'new');
	});
};

Chunk.prototype.removeAvatar = function(avatar) {
	if (!avatar || !avatar.id || !this._avatars[avatar.id]) return;

	delete this._avatars[avatar.id];
	avatar.disable();

	this.vicinityForeach(function(chunk) {
		chunk.broadcast(config.avatar.removeAvatar, avatar.removeMessage(), avatar);
		chunk.sendData(avatar, 'remove');
	});
};

Chunk.prototype.transferAvatar = function(avatar) {
	if (!avatar || !avatar.id) return;

	var oldChunk = avatar.chunk,
		newChunk = this._chunks[avatar.calcChunkIdByPosition()];

	if (oldChunk == newChunk) return;

	avatar.chunk = newChunk;
	delete oldChunk._avatars[avatar.id];
	newChunk._avatars[avatar.id] = avatar;

	this.symmetricDifferenceVicinityForeach(oldChunk, newChunk,
		function (chunk) {
			chunk.broadcast(config.network.messages.removeAvatar, avatar.removeMessage(), avatar);
			chunk.sendData(avatar, 'remove');
		},
		function (chunk) {
			chunk.broadcast(config.network.messages.newAvatar, avatar.newMessage(), avatar);
			chunk.sendData(avatar, 'new');
		}
	);
};

Chunk.prototype.broadcast = function(name, data, exceptAvatar) {
	var userId = -1;
	if (exceptAvatar) userId = exceptAvatar.user.id;
	
	this._avatars.each(function(avatarId, avatar) {
		if (avatar.user.id !== userId) {
			avatar.user.send(name, data);
		}
	});
};

Chunk.prototype.broadcastAvatarUpdate = function(avatar) {
	var avatarUpdateData = avatar.updMessage(),
		updateAvatarId = avatarUpdateData.id;
		
	this.vicinityForeach(function(chunk) {
		chunk._avatars.each(function(avatarId, avatar) {
			var	user = avatar.user;
			var	data = user.cachingData(avatarUpdateData, 'avatarUpdateData_avatar' + updateAvatarId);
				
			if (!data.isEmpty()) data.id = updateAvatarId;
			user.send(config.network.messages.updateAvatar, data);
		});
	});
};

Chunk.prototype.sendData = function(recipientAvatar, type) {
	var data = {
			id: this.id,
			avatars: []
		}, msgName = null;
	
	if (type == 'new') {
		data.tiles = this._tiles;
		data.x = this.x;
		data.y = this.y;
		msgName = config.network.messages.newChunk;
	} else if (type == 'remove') {
		msgName = config.network.messages.removeChunk;
	}
	
	this._avatars.each(function(avatarId, avatar) {
		var avatarMsg;

		if (type == 'new') avatarMsg = avatar.newMessage();
		else if (type == 'remove') avatarMsg = avatar.removeMessage();
		
		data.avatars.push(avatarMsg);
	});
	
	recipientAvatar.user.send(msgName, data);
};

Chunk.prototype.symmetricDifferenceVicinityForeach = function(first, second, callbackForFirst, callbackForSecond) {
	var forFirst = [], forSecond = [];

	first.vicinityForeach(function (chunk) {
		forFirst.push(chunk);
	});

	second.vicinityForeach(function (chunk) {
		forSecond.push(chunk);
	});

	for (var i = 0; i < forFirst.length; i++) {
		for (var j = 0; j < forSecond.length; j++) {
			if (forFirst[i] == forSecond[j]) {
				delete forFirst[i];
				delete forSecond[j];
			}
		}
	}

	forFirst.forEach(callbackForFirst);
	forSecond.forEach(callbackForSecond);
};

Chunk.prototype.vicinityForeach = function(callback) {
	var groupRadius = config.map.groupRadius - 1;

	for(var x = this.x - groupRadius; x < this.x + groupRadius; x++)
		for(var y = this.y - groupRadius; y < this.y + groupRadius; y++) {
			var id = x + y * config.map.size;
			if (!this._chunks[id]) continue;
			callback(this._chunks[id]);
		}
};

Chunk.prototype._update = function(callback) {
	var self = this;
	this._avatars.each(function(avatarId, avatar) {
		if (avatar._update()) {
			self.transferAvatar(avatar);
		} else {
			self.broadcastAvatarUpdate(avatar);
		}
	});
};

module.exports = Chunk;