var Chunk = function(x, y, chunks) {
	this._tiles = [];
	this._avatars = {};
	this._chunks = chunks;

	this.x = x;
	this.y = y;

	this.index = x + y * config.chunk.size;
};

Chunk.prototype.addAvatar = function(avatar) {
	if (!avatar || !avatar.id || this._avatars[avatar.id]) return;

	this._avatars[avatar.id] = avatar;
	avatar.enable();

	this.vicinityForeach(function(chunk) {
		chunk.broadcast(config.avatar.newAvatar, avatar.newMessage(), avatar);
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

Chunk.transferAvatar = function(avatar) {
	if (!avatar || !avatar.id) return;

	var oldChunk = avatar.chunk,
		newChunk = chunks[avatar.calcChunkIndexByPosition()];

	if (oldChunk == newChunk) return;

	avatar.chunk = newChunk;
	delete oldChunk._avatars[avatar.id];
	newChunk._avatars[avatar.id] = avatar;

	Chunk.symmetricDifferenceVicinityForeach(oldChunk, newChunk,
		function (chunk) {
			chunk.broadcast(config.avatar.removeAvatar, avatar.removeMessage(), avatar);
			chunk.sendData(avatar, 'remove');
		},
		function (chunk) {
			chunk.broadcast(config.avatar.newAvatar, avatar.newMessage(), avatar);
			chunk.sendData(avatar, 'new');
		}
	);
};

Chunk.prototype.broadcast = function(name, data, exceptAvatar) {
	var userId = avatar.user.id;

	this._avatars.forEach(function(avatar) {
		if (avatar.user.id !== userId) {
			avatar.user.send(name, data);
		}
	});
};

Chunk.prototype.sendData = function(recipientAvatar, type) {
	if (type == 'new') {
		recipientAvatar.user.send(config.message.newChunkTiles, this._tiles);

		this._avatars.forEach(function (avatar) {
			recipientAvatar.user.send(avatar.newMessage());
		});
	} else if (type == 'remove') {
		recipientAvatar.user.send(config.message.removeChunkTiles, this.index);

		this._avatars.forEach(function (avatar) {
			recipientAvatar.user.send(avatar.removeMessage());
		});
	}
};

Chunk.symmetricDifferenceVicinityForeach = function(first, second, callbackForFirst, callbackForSecond) {
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
	var groupRadius = config.chunk.groupRadius - 1;

	for(var x = this.x - groupRadius; x < this.x + groupRadius; x++)
		for(var y = this.y - groupRadius; y < this.y + groupRadius; y++) {
			var index = x + y * config.chunk.size;
			if (!this._chunks[index]) continue;
			callback(this._chunks[index]);
		}
};

Chunk.prototype._update = function(callback) {
	this._avatars.forEach(function (avatar) {
		if (avatar._update()) {
			Chunk.transferAvatar(avatar);
		}
	});
};

module.exports = Chunk;