var SpriteLoader = require('SpriteLoader');

var Chunk = function(data) {
    this.x = data.x;
    this.y = data.y;
    this.id = data.id;
    this._tiles = data.tiles;
    
    this._rootGraphicsNode = null;
};

Chunk.prototype.createTiles = function() {
    var spriteLoader = new SpriteLoader(),
        self = this;
        
    this._rootGraphicsNode = spriteLoader.load();
    
    this._tiles.forEach(function(tile, i) {
        if (!tile) return;
        var tileSprite = spriteLoader.load(tile);
            
        tileSprite.position.x = (i % config.size) * config.chunk.tile.size;
        tileSprite.position.y = Math.floor(i / config.size) * config.chunk.tile.size;
        self._rootGraphicsNode.addChild(tileSprite);
    });
};

module.exports = SpriteLoader;