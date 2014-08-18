define(['graphicUtils'], function (utils) {

	var load = utils.load;

	return function man() {
		var body = load('man.png'),
			hpCirlce = load('areal.png'),
			pivot = new utils.DisplayObjectContainer();

		this.radius = 10;

		this.init = function() {
			body.anchor.x = 0.5;
			body.anchor.y = 0.5;

			hpCirlce.anchor.x = 0.5;
			hpCirlce.anchor.y = 0.5;

			pivot.addChild(hpCirlce);
			pivot.addChild(body);

			pivot._z = 10;
			
			return pivot;
		};

		this.update = function(params) {
			pivot.position.x = params.x;
			pivot.position.y = params.y;
			pivot.rotation = params.angle;

			hpCirlce.tint = ((0xFF * params.hp) << 8) + ((0xFF * (1-params.hp)) << 16);
		};
	};
});