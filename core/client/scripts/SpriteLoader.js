var PIXI = require('pixi.js'),
	tilesetConfigs = {},
	config = null,
	self = null;

// @requireTilesetConfigs
// @start
tilesetConfigs['map/tileset/default'] = require('../../../map/tileset/default.json');
tilesetConfigs['avatars/Panzer/media/tileset'] = require('../../../avatars/Panzer/media/tileset.json');
// @end

var SpriteLoader = function() {
	config = window.config;
	this._tilesetPathOnTilesetMainTexturePath = {};
	this._callback = null;
	self = this;
};

SpriteLoader._cropedTextures = {};

SpriteLoader.prototype.get = function(spritePath) {
	if (!spritePath) return new PIXI.DisplayObjectContainer();
	
	spritePath = this._preparePath(spritePath);
	if (SpriteLoader._cropedTextures[spritePath]) {
		return new PIXI.Sprite(SpriteLoader._cropedTextures[spritePath]);
	}
	
	return null;
};

SpriteLoader.prototype.getMapTile = function(tileId) {
	return this.get(config.map.path + '/' + config.map.tileset.path + '/' + tileId);
};

SpriteLoader.prototype.getAvatarNode = function(avatarType, nodeImage) {
	return this.get(config.avatar.path + '/' + avatarType + '/' + config.avatar.sprite.path + '/' +
		config.avatar.sprite.tileset + '/' + nodeImage);
};

SpriteLoader.prototype._preparePath = function(path) {
	return path.replace(/\/+/g, '/').replace(/\/$/, '');
};

SpriteLoader.prototype._getLowPath = function(path) {
	var lowPath = path.split('/');
	lowPath.pop();
	return lowPath.join('/');
};

SpriteLoader.prototype._generateTextures = function() {
	PIXI.TextureCache.each(function(mainTextureFilename, texture) {
		var tilesetPath = self._tilesetPathOnTilesetMainTexturePath[mainTextureFilename];
		
		tilesetConfigs[tilesetPath].frames.each(function(name, rectangle) {
	    	SpriteLoader._cropedTextures[tilesetPath + '/' + name] =
	    		new PIXI.Texture(
	    			texture,
	    			new PIXI.Rectangle(rectangle[0], rectangle[1], rectangle[2], rectangle[3])
	    		);
	    });
	});
	
	if ($.isFunction(self._callback)) self._callback();
};

SpriteLoader.prototype.preload = function(callback) {
	var tilesetImages = [];
	
	this._callback = callback;
		
	tilesetConfigs.each(function(spriteSheetPath, config) {
		var spriteSheetImagePath = self._getLowPath(spriteSheetPath) + '/' + config.img;
		spriteSheetImagePath = self._preparePath(spriteSheetImagePath);
		
		tilesetImages.push(spriteSheetImagePath);
		self._tilesetPathOnTilesetMainTexturePath[spriteSheetImagePath] = spriteSheetPath;
	});
	
	var loader = new PIXI.AssetLoader(tilesetImages, config.web.crossorigin);
	loader.onComplete = this._generateTextures;
	loader.load();
};

module.exports = SpriteLoader;