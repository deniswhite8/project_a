define(['graphicUtils'], function (utils) {

	var load = utils.load;

	return function car() {
		var turret = load('car_turret.png'),
			body   = load('car.png'),
			hpLine = load('car_hp.png');

		this.radius = 15;

		this.init = function() {
			turret.anchor.x = 0.53;
			turret.anchor.y = 0.46;
			body.anchor.x = 0.5;
			body.anchor.y = 0.5;
			hpLine.anchor.x = 0.5;
			hpLine.anchor.y = 0.5;


			body.addChild(hpLine);
			body.addChild(turret);

			return body;
		};

		this.update = function(params) {
			body.position.x = params.x;
			body.position.y = params.y;
			body.rotation = params.bodyAngle;
			turret.rotation = params.turretAngle - params.bodyAngle;

			hpLine.tint = ((0xFF * params.hp) << 8) + ((0xFF * (1-params.hp)) << 16);
		};
	};
});