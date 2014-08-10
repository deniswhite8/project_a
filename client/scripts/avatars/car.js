define(['graphicUtils'], function (utils) {

	var load = utils.load;

	return function car() {
		var turret = load('car_turret.png'),
			body   = load('car.png'),
			hpLine = load('car_hp_line.png');
			hpBorder = load('car_hp_border.png');

		this.radius = 15;

		this.init = function() {
			turret.anchor.x = 0.53;
			turret.anchor.y = 0.46;
			body.anchor.x = 0.5;
			body.anchor.y = 0.5;
			
			hpLine.anchor.y = 1;
			hpLine.position.x = 1;
			hpLine.position.y = 13;
			hpBorder.position.x = -4;
			hpBorder.position.y = -20;


			body.addChild(hpBorder);
			hpBorder.addChild(hpLine);
			body.addChild(turret);

			body._z = 10;

			return body;
		};

		this.update = function(params) {
			body.position.x = params.x;
			body.position.y = params.y;
			body.rotation = params.angle;
			turret.rotation = params.turretAngle - params.angle;

			hpLine.scale.y = params.hp;
			hpLine.tint = ((0xFF * params.hp) << 8) + ((0xFF * (1-params.hp)) << 16);
		};
	};
});