define(['AvatarLoader'], function(AvatarLoader) {
   
    var World = function() {
        this._avatars = [];
        this._frameCounter = 0;
    };
    
        
    World.prototype.start = function() {
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
        
        requestAnimationFrame(function() {
            self._updateFunction();
        });
    };
    
    
    World.prototype._updateFunction = function() {
        this._frameCounter++;
        
        
        
        this._step();
    };
});