module.exports = car;

function car(args) {
	var	turretAngle = args.turretAngle,
		speed = 5;

	this.init(args, 20);
	this.phInit(50, 30, 55, true);

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

        var dy = 0;
        if (input.down) dy++;
        if (input.up) dy--;

        if(dy) this.move(this.angle + Math.atan2(dy, 0), speed);
        else this.stop();


	    if (input.right) this.rotate(this.angle - 0.02*dy);
	    if (input.left) this.rotate(this.angle + 0.02*dy);


        var inAvatar = input.inOut;
        if (inAvatar === null) {
        	var primaryAvatar = this.user.getPrimaryAvatar();
        	primaryAvatar.copyPosition(this);
        	this.user.setForeignAvatar(null);
        	this.stop();
        }

        if(inAvatar !== null && inAvatar !== undefined && inAvatar.name == 'passage' && inAvatar.size == 'big' && this.reach(inAvatar)) {
        	this.disable();
        	this.copyPositionById(inAvatar.pair);
        	this.enable();
        }
	};

	this.update = function() {
		this.phUpdate();
	};
}