define(['pixi'], function (PIXI) {

	var avatars = {},
		textures = {};

	function load(fileName) {
		if (!textures[fileName]) {
			textures[fileName] = PIXI.Texture.fromImage("./img/" + fileName);
		}
		var tx = textures[fileName];
		return new PIXI.Sprite(tx);
	}

	avatars.panzer = function() {
		var turret = load('turret.png'),
			body   = load('body.png'),
			hpBorder = load('border.png'),
			hpLine = load('line.png');

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

	avatars.man = function() {
		var body = load('man.png'),
			hpCirlce = load('areal.png'),
			pivot = new PIXI.DisplayObjectContainer();

		this.init = function() {
			body.anchor.x = 0.5;
			body.anchor.y = 0.5;

			hpCirlce.anchor.x = 0.5;
			hpCirlce.anchor.y = 0.5;

			pivot.addChild(hpCirlce);
			pivot.addChild(body);
			return pivot;
		};

		this.update = function(params) {
			pivot.position.x = params.x;
			pivot.position.y = params.y;
			pivot.rotation = params.bodyAngle;

			hpCirlce.tint = ((0xFF * params.hp) << 8) + ((0xFF * (1-params.hp)) << 16);
		};
	};

	return avatars;
});