module.exports = passage;

function passage(args) {
	this.init(args, 10);
	this.phInit(false);

	this.newMessage = function() {
		return {
			id: this.id,
			name: this.name,
			params: {
				dir: this.dir,
				size: this.size,
				x: this.x,
				y: this.y
			}
		};
	};
}