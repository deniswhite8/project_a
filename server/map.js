var chunks = [],
	conf,
	users = [],
	usersOldChunk = [];

function loadMap(path) {
	conf = require("./" + path + '/conf.json');

	require("fs").readdirSync("./" + path).forEach(function(file) {
		if(file != 'conf.json') {
			var chunk = require("./" + path + "/" + file);
			chunks[chunk.x + chunk.y * conf.CHUNK_COUNT] = chunk.data;
		}
	});
}

function registerUser(user) {
	users[user.getId()] = user;
	sendConf(user);
}

function unregisterUser(user) {
	delete users[user.getId()];
}

function update() {
	users.forEach(function(user) {
		var avatar = user.getForeignAvatar();
		if (!avatar) avatar = user.getPrimaryAvatar();

		var userChunkX = Math.floor(avatar.x / (conf.CHUNK_SIZE * conf.TILE_SIZE)),
			userChunkY = Math.floor(avatar.y / (conf.CHUNK_SIZE * conf.TILE_SIZE));

		oldChunk = usersOldChunk[user.getId()];
		if(!oldChunk) oldChunk = {x: NaN, y: NaN};

		if (userChunkX !== oldChunk.x || userChunkY !== oldChunk.y) {
			sendSurroundings(userChunkX, userChunkY, userChunkX - oldChunk.x, userChunkY - oldChunk.y, user);
			usersOldChunk[user.getId()] = {x: userChunkX, y: userChunkY};
		}
	});
}

function sendConf(user) {
	user.sendMapConf(conf);
}

function sendSurroundings(chunkX, chunkY, dX, dY, user) {
	for(var d_y = -1; d_y <= 1; d_y++)
	for(var d_x = -1; d_x <= 1; d_x++)
		if (isNaN(dX) ||
			(!isNaN(dX) && ((d_x !== 0 && d_x == dX) || (d_y !== 0 && d_y == dY)))) {
				var chunk = chunks[(chunkY + d_y) * conf.CHUNK_COUNT + (chunkX + d_x)];
				if(chunk) {
					user.sendNewChunk({
						x: (chunkX + d_x),
						y: (chunkY + d_y),
						data: chunk
					});
				}
		}

	if(!isNaN(dX)) {
		for(var d_y = -1; d_y <= 1; d_y++)
		for(var d_x = -1; d_x <= 1; d_x++)
			if((d_x !== 0 && d_x == dX) || (d_y !== 0 && d_y == dY)) {
				var chunk = chunks[(chunkY - 2*d_y) * conf.CHUNK_COUNT + (chunkX - 2*d_x)];
				if(chunk) {
					user.sendDeleteChunk({
						x: chunkX - d_x*2,
						y: chunkY - d_y*2
					});
				}
			}
	}
}



module.exports.loadMap = loadMap;
module.exports.registerUser = registerUser;
module.exports.unregisterUser = unregisterUser;
module.exports.update = update;