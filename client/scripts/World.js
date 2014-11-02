var AvatarLoader = require('./AvatarLoader.js'),
    Stats = require('./stats.js'),
    Graphics = require('./Graphics.js'),
    Input = require('./Input.js'),
    Network = require('./Network.js'),
    Chunk = require('./Chunk.js');

var World = function() {
    this._avatars = [];
    this._frameCounter = 0;
    this._stats = new Stats();
    this._graphics = new Graphics();
    this._controlAvatar = null;
    this._input = new Input();
    this._network = new Network();
    this._chunks = [];
    
    this._frameFrequencyInputSend = Math.floor(config.control.input.frequencySend * 60);
    if (this._frameFrequencyInputSend === 0) this._frameFrequencyInputSend = 1;
};

World.prototype.start = function() {
    this._network.connect();
    this._stats.setMode(2);
    this._graphics.init('centerDiv', 640, 480, this._stats);
    this._input.init(this._graphics.getViewElement());
    
    this._network.on(config.message.newChunk, this.onNewChunk);
    this._network.on(config.message.removeChunk, this.onRemoveChunk);
    this._network.on(config.message.newAvatar, this.onNewAvatar);
    this._network.on(config.message.removeAvatar, this.onRemoveAvatar);
    this._network.on(config.message.setControlAvatar, this.onSetControlAvatar);
    
    this._network.send(config.message.userLogin, {
        login: 'denis',
        passwd: 'qwe'
    });
    
    this._step();
};




World.prototype.onNewChunk = function(data, socket) {
    if (!data || !data.id) return;
    if (this._chunks[data.id]) this.onRemoveChunk();
    
    var chunk = new Chunk(data);
    this._chunks[data.id] = chunk;
    this._graphics.addChunk(chunk);
};

World.prototype.onRemoveChunk = function(id, socket) {
    if (!id || !this._chunks[id]) return;
    
    this._graphics.removeAvatar(this._chunks[id]);
    delete this._chunks[id];
};

World.prototype.onNewAvatar = function(data, socket) {
    var avatar = this.createAvatar(data);
    this._graphics.addAvatar(avatar);
};

World.prototype.onRemoveAvatar = function(id, socket) {
    this.removeAvatar(id);
    this._graphics.removeAvatar(id);
};

World.prototype.onSetControlAvatar = function(avatarId, socket) {
    this._controlAvatar = this.getAvatar(avatarId);
};



World.prototype.getAvatar = function(id) {
    if (!id) return;
    
    return this._avatars[id];  
};

World.prototype.removeAvatar = function(id) {
    if (!id) return;
    
    delete this._avatars[id];  
};

World.prototype.createAvatar = function(params) {
    var type = params.type,
        id = params.id;
        
    if (!type || !id || this.getAvatar(id)) return;
    
    var avatarLoader = new AvatarLoader(),
        avatarClass = avatarLoader.getClass(type),
        avatarConfig = avatarLoader.getConfig(type);
        
    if (!avatarClass || !avatarConfig) return;
    
    var avatar = new avatarClass();
    
    avatar.init(params, avatarConfig);
};

World.prototype._step = function() {
    var self = this;
    
    window.requestAnimationFrame(function() {
        self._stats.begin();
        
        self._updateFunction();
        
        self._step();
        self._stats.end();
    });
};


World.prototype._updateFunction = function() {
    this._frameCounter++;
    
    if(this._frameCounter % this._frameFrequencyInputSend) {
		var inputData = this._input.getInputData();
		if (inputData) this._network.send(config.message.userInput, inputData);
	}

	if (this._controlAvatar) {
		this._graphics.viewPortFocus(this._controlAvatar.rootNode.x, this._controlAvatar.rootNode.y);
	}

	this._input.setOffset(this._graphics.getViewPortX(), this._graphics.getViewPortY());
	
	this._graphics.render();
};
    
module.exports = World;