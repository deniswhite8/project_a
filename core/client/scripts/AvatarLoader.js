var classes = {},
	configs = {};

// @requireAvatarList
// @start
classes['Panzer'] = require('../../../avatars/Panzer/client/Panzer.js');
configs['Panzer'] = require('../../../avatars/Panzer/client/config.json');
// @end

var AvatarLoader = function() {
	
};

AvatarLoader.prototype.getClass = function(type) {
	return classes[type];
};

AvatarLoader.prototype.getConfig = function(type) {
	return configs[type];
};

module.exports = AvatarLoader;