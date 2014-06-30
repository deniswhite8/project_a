var chunks = [],
	conf,
	allAvatars = [],
	allAvatarsOldChunk = [],
	allUsers = [],
	avatarsManager,
	ioSockets;



function Chunk(json) {
	this.x = json.x;
	this.y = json.y;
	this.tiles = json.data;

	var avatars = {},
		users = {};

	this.addAvatar = function(avatar) {
		var avatarId = avatar.getId();

		avatars[avatarId] = avatar;
		allAvatars[avatarId] = avatar; 

		var user = avatar.user;
		this.addUser(user);
	};

	this.addUser = function(user) {
		if(user && !users[user.getId()]) {
			users[user.getId()] = user;
			allUsers[user.getId()] = user;
		}
	};

	this.removeAvatar = function(avatar) {
		delete avatars[avatar.getId()];
		delete allAvatars[avatar.getId()];

		var user = avatar.user;
		if(user) {
			delete users[user.getId()];
			delete allUsers[user.getId()];
		}
	};

	this.getAvatars = function() {
		return avatars
	};
}

function loadMap(path) {
	conf = require("./" + path + '/conf.json');

	require("fs").readdirSync("./" + path).forEach(function(file) {
		if(file != 'conf.json') {
			var chunk = require("./" + path + "/" + file);
			chunks[chunk.x + chunk.y * conf.CHUNK_COUNT] = new Chunk(chunk);
		}
	});
}

function getChunk(x, y) {
	return chunks[x + y * conf.CHUNK_COUNT];
}

function getAvatarChunkPos(avatar) {
	var avatarChunkX = Math.floor(avatar.x / (conf.CHUNK_SIZE * conf.TILE_SIZE)),
		avatarChunkY = Math.floor(avatar.y / (conf.CHUNK_SIZE * conf.TILE_SIZE));

	return {x: avatarChunkX, y: avatarChunkY};
}

function pointOutUser(avatar) {
	var avatarChunk = getAvatarChunkPos(avatar);
	getChunk(avatarChunk.x, avatarChunk.y).addUser(avatar.user);
}

function registerUser(user) {
	user.sendMapConf(conf);

	var avatarChunk = getUserChunk(user);

	for(var d_y = -1; d_y <= 1; d_y++)
	for(var d_x = -1; d_x <= 1; d_x++) {
		var chunk = getChunk(avatarChunk.x + d_x, avatarChunk.y + d_y);
		if(chunk) {
			user.sendNewChunk({
				x: (avatarChunk.x + d_x),
				y: (avatarChunk.y + d_y),
				data: chunk.tiles
			});

			user.getSocket().join((avatarChunk.x + d_x) + '_' + (avatarChunk.y + d_y));
			avatarsManager.sendMany(chunk.getAvatars(), 'both', user.emit2self);
		}
	}
}

function addAvatar(avatar) {
	var avatarChunk = getAvatarChunkPos(avatar);
	getChunk(avatarChunk.x, avatarChunk.y).addAvatar(avatar);
	allAvatarsOldChunk[avatar.getId()] = avatarChunk;

	avatarsManager.send('new', avatar, getEmit2allFn(avatarChunk, 'all'));
}

function removeAvatar(avatar) {
	var avatarChunk = getAvatarChunkPos(avatar);
	getChunk(avatarChunk.x, avatarChunk.y).removeAvatar(avatar);

	avatarsManager.send('del', avatar, getEmit2allFn(avatarChunk, 'all'));
}

function update() {
	allAvatars.forEach(function(avatar) {
		if(avatar) {
			var avatarChunk = getAvatarChunkPos(avatar),
				oldChunk = allAvatarsOldChunk[avatar.getId()];

			if (avatarChunk.x !== oldChunk.x || avatarChunk.y !== oldChunk.y) {
				var user = avatar.user;
				if(user) {
					sendSurroundings(avatarChunk.x, avatarChunk.y, avatarChunk.x - oldChunk.x, avatarChunk.y - oldChunk.y, user);
				}

				getChunk(oldChunk.x, oldChunk.y).removeAvatar(avatar);
				getChunk(avatarChunk.x, avatarChunk.y).addAvatar(avatar);


				avatarsManager.send('both', avatar, getEmit2allFn(avatarChunk, 'new', avatarChunk.x - oldChunk.x, avatarChunk.y - oldChunk.y));
				avatarsManager.send('del', avatar, getEmit2allFn(avatarChunk, 'del', avatarChunk.x - oldChunk.x, avatarChunk.y - oldChunk.y));

				allAvatarsOldChunk[avatar.getId()] = avatarChunk;
			}
		}
	});
}

function sendUpdateAvatars() {
	allUsers.forEach(function (user) {
		var avatarChunk = getUserChunk(user);

		for(var d_y = -1; d_y <= 1; d_y++)
		for(var d_x = -1; d_x <= 1; d_x++) {
			var chunk = getChunk(avatarChunk.x + d_x, avatarChunk.y + d_y);
			if(chunk) {
				avatarsManager.sendMany(chunk.getAvatars(), 'upd', user.emit2self);
			}
		}
	});
}

function sendSurroundings(chunkX, chunkY, dX, dY, user) {
	for(var d_y = -1; d_y <= 1; d_y++)
	for(var d_x = -1; d_x <= 1; d_x++)
		if ((d_x !== 0 && d_x == dX) || (d_y !== 0 && d_y == dY)) {
			var chunk = getChunk(chunkX + d_x, chunkY + d_y);
			if(chunk) {
				user.sendNewChunk({
					x: (chunkX + d_x),
					y: (chunkY + d_y),
					data: chunk.tiles
				});

				user.getSocket().join((chunkX + d_x) + '_' + (chunkY + d_y));

				avatarsManager.sendMany(chunk.getAvatars(), 'both', user.emit2self);
			}

			chunk = getChunk(chunkX - 2*d_x, chunkY - 2*d_y);
			if(chunk) {
				user.sendDeleteChunk({
					x: chunkX - d_x*2,
					y: chunkY - d_y*2
				});

				user.getSocket().leave((chunkX - d_x*2) + '_' + (chunkY - d_y*2));

				avatarsManager.sendMany(chunk.getAvatars(), 'del', user.emit2self);
			}
		}
}

function getUserChunk(user) {
	var avatar = user.getForeignAvatar();
	if(!avatar) avatar = user.getPrimaryAvatar();

	return getAvatarChunkPos(avatar);
}

function emit2all(avatarChunk, msg, data, mode, dX, dY) {
	for(var d_y = -1; d_y <= 1; d_y++)
	for(var d_x = -1; d_x <= 1; d_x++) {

		if(mode == 'all') {
			var chunk = getChunk(avatarChunk.x + d_x, avatarChunk.y + d_y);
			if(chunk) ioSockets.in((avatarChunk.x + d_x) + '_' + (avatarChunk.y + d_y)).emit.call(ioSockets, msg, data);

		} else if(mode == 'new' && ((d_x !== 0 && d_x == dX) || (d_y !== 0 && d_y == dY))) {
			var chunk = getChunk(avatarChunk.x + d_x, avatarChunk.y + d_y);
			if(chunk) ioSockets.in((avatarChunk.x + d_x) + '_' + (avatarChunk.y + d_y)).emit.call(ioSockets, msg, data);

		} else if(mode == 'del' && ((d_x !== 0 && d_x == dX) || (d_y !== 0 && d_y == dY))) {
			var chunk = getChunk(avatarChunk.x - 2*d_x, avatarChunk.y - 2*d_y);
			if(chunk) ioSockets.in((avatarChunk.x - d_x*2) + '_' + (avatarChunk.y - d_y*2)).emit.call(ioSockets, msg, data);
		}
	}
}

function getEmit2allFn(avatarChunk, mode, dX, dY) {
	return function (msg, data) {
		emit2all(avatarChunk, msg, data, mode, dX, dY);
	};
}

module.exports.loadMap = loadMap;
module.exports.registerUser = registerUser;
module.exports.addAvatar = addAvatar;
module.exports.removeAvatar = removeAvatar;
module.exports.update = update;
module.exports.sendUpdateAvatars = sendUpdateAvatars;
module.exports.pointOutUser = pointOutUser;


module.exports.setAvatarsManager = function(_avatarsManager) {
	avatarsManager = _avatarsManager;
};

module.exports.setIoSockets = function(io) {
	ioSockets = io;
};