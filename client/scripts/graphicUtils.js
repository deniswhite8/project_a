define(['pixi'], function (PIXI) {

	var textures = {};

	function load(fileName) {
		if (!textures[fileName]) {
			textures[fileName] = PIXI.Texture.fromImage("./img/" + fileName);
		}
		var tx = textures[fileName];
		return new PIXI.Sprite(tx);
	}

	return {
		load: load,
		DisplayObjectContainer: PIXI.DisplayObjectContainer
	};

});