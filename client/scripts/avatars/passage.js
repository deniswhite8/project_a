define(['graphicUtils'], function (utils) {

	var load = utils.load;

	return function passage() {
		var right = load('one_level.png'),
			upLevel = load('change_level.png');

		this.radius = 25;

		this.init = function(params) {
			var dir = params.dir,
				obj;

			if(dir == 'rigth' || dir == 'left' || dir == 'up' || dir == 'down') {
				var angles = {
					'right': 0,
					'left': Math.PI,
					'up': Math.PI/2,
					'down': -Math.PI/2
				};

				right.rotation = angles[dir];

				obj = right;
			} else if(dir == 'upLevel' || dir == 'downLevel') {
				var angles = {
					'upLevel': 0,
					'downLevel': Math.PI
				};

				upLevel.rotation = angles[dir];

				obj = upLevel;
			}

			obj.anchor.x = 0.5;
			obj.anchor.y = 0.5;
			obj.position.x = params.x;
			obj.position.y = params.y;

			return obj;
		};
	};
});