define(['graphicUtils'], function (graphicUtils) {

	var conf, chunks = {},
		pivot = new graphicUtils.DisplayObjectContainer();

	function setConf(_conf) {
		conf = _conf;
	}

	function addChunk(chunk) {
		var chunkId = chunk.x + chunk.y * conf.CHUNK_COUNT;
		var ch = chunks[chunkId];
		if (ch) deleteChunk({x: ch.x, y: ch.y});
		chunks[chunkId] = [];

		for (var dy = 0; dy < conf.CHUNK_SIZE; dy++)
		for (var dx = 0; dx < conf.CHUNK_SIZE; dx++) {
			var sprite = graphicUtils.load('tiles/' + chunk.data[dx + dy*conf.CHUNK_SIZE] + '.png');
			sprite.position.x = dx * conf.TILE_SIZE + chunk.x * conf.TILE_SIZE * conf.CHUNK_SIZE - 6;
			sprite.position.y = dy * conf.TILE_SIZE + chunk.y * conf.TILE_SIZE * conf.CHUNK_SIZE - 6;
			pivot.addChild(sprite);

			chunks[chunkId].push(sprite);
		}

	}

	function deleteChunk(pos) {
		var chunkId = pos.x + pos.y * conf.CHUNK_COUNT
		var ch = chunks[chunkId];

		if(ch)
			ch.forEach(function (e) {
				pivot.removeChild(e);
			});

		delete chunks[chunkId];
	}


	return {
		pivot: pivot,
		setConf: setConf,
		addChunk: addChunk,
		deleteChunk: deleteChunk
	};
});