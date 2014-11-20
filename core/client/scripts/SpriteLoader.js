var PIXI = require('pixi');

var SpriteLoader = function() {
	
};

SpriteLoader._textures = {};

SpriteLoader.prototype.load = function(fileName) {
	if (fileName) {
		fileName = fileName.replace(/\/+/g, '/');
		
		if (!SpriteLoader._textures[fileName]) {
			SpriteLoader._textures[fileName] = PIXI.Texture.fromImage(fileName);
		}
		
		var texture = SpriteLoader._textures[fileName];
		return new PIXI.Sprite(texture);
	} else {
		return new PIXI.DisplayObjectContainer();
	}
};

module.exports = SpriteLoader;