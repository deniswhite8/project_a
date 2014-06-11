define(['graphicUtils'], function (utils) {

	var load = utils.load;

	return function panzer() {
		var turret = load('turret.png'),
			body   = load('body.png'),
			hpBorder = load('border.png'),
			hpLine = load('line.png');

		this.radius = 20;

		this.init = function() {
			turret.anchor.x = 0.5;
			turret.anchor.y = 0.8;
			body.anchor.x = 0.5;
			body.anchor.y = 0.5;

			hpLine.position.x = hpLine.position.y = 2;
			hpBorder.position.x = -25;
			hpBorder.position.y = -20;

			hpBorder.addChild(hpLine);
			body.addChild(hpBorder);
			body.addChild(turret);

			return body;
		};

		this.update = function(params) {
			body.position.x = params.x;
			body.position.y = params.y;
			body.rotation = params.bodyAngle;
			turret.rotation = params.turretAngle - params.bodyAngle;

			hpLine.scale.x = params.hp;
			hpLine.tint = ((0xFF * params.hp) << 8) + ((0xFF * (1-params.hp)) << 16);
		};
	};
});