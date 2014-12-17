var SpriteLoader = require('./SpriteLoader'),
    config = null;

var Chunk = function(data) {
    this.x = data.x;
    this.y = data.y;
    this.id = data.id;
    this._tiles = data.tiles;
    this._rootGraphicsNode = null;
    config = window.config;
    
    this._createTiles();
};

Chunk.prototype._createTiles = function() {
    var spriteLoader = new SpriteLoader(),
        self = this;
        
    this._rootGraphicsNode = spriteLoader.get();
    this._rootGraphicsNode.position.x = this.x * config.map.chunk.size * config.map.chunk.tile.size;
    this._rootGraphicsNode.position.y = this.y * config.map.chunk.size * config.map.chunk.tile.size;
    
    this._tiles.forEach(function(tile, i) {
        if (!tile) return;
        var tileSprite = spriteLoader.getMapTile(tile);
            
        tileSprite.position.x = (i % config.map.chunk.size) * config.map.chunk.tile.size;
        tileSprite.position.y = Math.floor(i / config.map.chunk.size) * config.map.chunk.tile.size;
        self._rootGraphicsNode.addChild(tileSprite);
    });
};

module.exports = Chunk;