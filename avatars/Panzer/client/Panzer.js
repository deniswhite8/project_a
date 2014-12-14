var Avatar = require('../../../core/client/scripts/Avatar.js');

var Panzer = function() {
	Avatar.call(this);	
};
Panzer.prototype = Object.create(Avatar.prototype);

Panzer.prototype.init = function(params) {
	
};

Panzer.prototype.update = function(params) {
	this.body.children.turret.angle *= -1;
	this.body.children.border.children.line.tint = ((0xFF * params.health) << 8) + ((0xFF * (1-params.health)) << 16);
};

module.exports = Panzer;