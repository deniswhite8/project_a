define(['pixi'], function (PIXI) {

	var SpriteLoader = function() {
		
	};
	
	SpriteLoader._textures = {};
	
	SpriteLoader.load = function(fileName) {
		if (fileName) {
			if (!SpriteLoader._textures[fileName]) {
				SpriteLoader._textures[fileName] = PIXI.Texture.fromImage(fileName);
			}
			var texture = SpriteLoader._textures[fileName];
			return new PIXI.Sprite(texture);
		} else {
			return new PIXI.DisplayObjectContainer();
		}
	};

	return SpriteLoader;

});