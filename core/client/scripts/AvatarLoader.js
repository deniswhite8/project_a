var classes = {},
	configs = {};

// @_requireAvatarFolder
// @_start
// classes['Car'] = require('../../../avatars//Car/client/Car.js');
// configs['Car'] = require('../../../avatars//Car/client/config.json');
// classes['Man'] = require('../../../avatars//Man/client/Man.js');
// configs['Man'] = require('../../../avatars//Man/client/config.json');
classes['Panzer'] = require('../../../avatars//Panzer/client/Panzer.js');
configs['Panzer'] = require('../../../avatars//Panzer/client/config.json');
// classes['Passage'] = require('../../../avatars//Passage/client/Passage.js');
// configs['Passage'] = require('../../../avatars//Passage/client/config.json');
// @_end


var AvatarLoader = function() {
	
};

AvatarLoader.prototype.getClass = function(type) {
	return classes[type];
};

AvatarLoader.prototype.getConfig = function(type) {
	return configs[type];
};

module.exports = AvatarLoader;