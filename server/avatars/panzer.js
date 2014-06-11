module.exports = panzer;

function panzer(args) {
	var	turretAngle = args.turretAngle,
		speed = 5;

	this.init(args, 30);
	this.phInit(100, 55, 55, true);

	this.updMessage = function() {
		return {
			id: this.id,
			params: {
				x: this.x,
				y: this.y,
				bodyAngle: this.angle,
				turretAngle: turretAngle,
				hp: this.hp
			}
		};
	};

	this.input = function(input) {
		turretAngle = input.angle;
        if (input.right) this.rotate(this.angle + 0.02);
        if (input.left) this.rotate(this.angle - 0.02);

        var dy = 0;
        if (input.down) dy++;
        if (input.up) dy--;

        if(dy) this.move(this.angle + Math.atan2(dy, 0), speed);
        else this.stop();

        var inAvatar = input.inOut;
        if (inAvatar === null) {
        	var primaryAvatar = this.user.getPrimaryAvatar();
        	primaryAvatar.copyTransform(this);
        	this.user.setForeignAvatar(null);
        	this.stop();
        }
	};

	this.update = function() {
		this.phUpdate();
	};
}