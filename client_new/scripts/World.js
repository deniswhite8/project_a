define(['AvatarLoader', 'stats', 'Graphics'], function(AvatarLoader, Stats, Graphics) {
   
    var World = function() {
        this._avatars = [];
        this._frameCounter = 0;
        this._stats = new Stats();
        this._graphics = new Graphics();
        this._controlAvatar = null;
        
        this._frameFrequencyInputSend = Math.floor(config.control.input.frequencySend * 60);
        if (this._frameFrequencyInputSend === 0) this._frameFrequencyInputSend = 1;
    };
    
        
    World.prototype.start = function() {
        this._stats.setMode(2);
        this._graphics.init('centerDiv', 640, 480, this._stats);
        this._step();
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
        
        var avatarClass = AvatarLoader.getClass(type),
            avatarConfig = AvatarLoader.getConfig(type);
            
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
			if (inputData) socket.emit('input', inputData);
		}

		if (this._controlAvatar) {
			this._graphics.viewPortFocus(this._controlAvatar.rootNode.x, this._controlAvatar.rootNode.y);
		}

		this._input.setOffset(this._graphics.getViewPortX(), this._graphics.getViewPortY());
		
		this._graphics.render();
    };
    
    return World;
});