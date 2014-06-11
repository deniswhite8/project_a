module.exports = man;

function man(args) {
	var	speed = 5;

	this.init(args, 20);
	this.phInit(10, 20, 20, false);

	this.updMessage = function() {
		return {
			id: this.id,
			params: {
				x: this.x,
				y: this.y,
				bodyAngle: this.angle,
				hp: this.hp
			}
		};
	};

	this.input = function(input) {
		this.rotate(input.angle);
        
        var dx = 0, dy = 0;
        if (input.down) dy++;
        if (input.up) dy--;
        if (input.right) dx++;
        if (input.left) dx--;

        if(dx || dy) this.move(this.angle + Math.atan2(dy, dx), speed);
        else this.stop();

        var inAvatar = input.inOut;
        if (inAvatar !== null && inAvatar !== undefined && inAvatar.name == 'panzer' && this.reach(inAvatar) && inAvatar.user == null) {
        	this.user.setForeignAvatar(inAvatar);
        }
	};

	this.update = function() {
		this.phUpdate();
	};
}