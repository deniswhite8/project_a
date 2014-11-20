var Avatar = require('../../../core/server/scripts/Avatar.js');

var Panzer = function () {
	Avatar.call(this);
};
Panzer.prototype = Object.create(Avatar.prototype);




Panzer.prototype.init = function () {

};

Panzer.prototype.update = function () {
    this.turretAngle = this.input.angle; 
};

module.exports = Panzer;