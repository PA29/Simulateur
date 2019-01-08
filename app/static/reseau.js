var ctx;
var images = {};

/*var reseau = {
	transfo: {x: 50, y: 10},
	connections: [{x: 50, y: 50}, {x: 25, y: 75}, {x: 75, y: 75}],
	lines: [[null, 0], [0, 1], [0, 2]],
	bus: [{type: "transfo", x: 50, y: 90, line: 1, position: 0.9}]
};*/

var reseau = {
	bus: [{x: 50, y: 20}, {x: 50, y: 50}, {x: 25, y: 75}, {x: 75, y: 75}],
	lines: [{bus1: 0, bus2: 1, length: 10}, {bus1: 1, bus2: 2, length: 10}, {bus1: 1, bus2: 3, length: 10}],
	images: [{type: 'transfo', x: 50, y: 10, bus: 0}, {type: 'transfo', x: 50, y: 90, bus: 2}]
}

var pointSize = 3;


/* Affichage et interactions avec le réseau */

function initContext() {
	let canvas = document.getElementById('reseau');
	ctx = canvas.getContext('2d');
}

function resizeCanvas() {
	let centerArea = document.getElementById('centerArea');
	let canvas = document.getElementById('reseau');
	
	canvas.width = centerArea.offsetWidth;
	canvas.height = centerArea.offsetHeight;

	drawReseau(reseau);
}

function drawReseau(reseau) {
	drawImage('transfo', reseau.transfo);

	for (let bus of reseau.bus) {
		drawBus(bus);
	}

	for (let line of reseau.lines) {
		drawStroke(reseau.bus[line.bus1], reseau.bus[line.bus2]);
	}

	for (let image of reseau.images) {
		drawImage(image);
		drawStroke(image, reseau.bus[image.bus]);
	}
}

function drawBus(position) {
	ctx.beginPath();
	ctx.arc(absoluteX(position.x), absoluteY(position.y), pointSize, 0, 2 * Math.PI);
	ctx.fill();
}

function drawStroke(position1, position2) {
	ctx.beginPath();
	ctx.moveTo(absoluteX(position1.x), absoluteY(position1.y));
	ctx.lineTo(absoluteX(position2.x), absoluteY(position2.y));
	ctx.stroke();
}

function drawImage(image) {
	let im = new Image();
	im.onload = function() {
		ctx.drawImage(im, absoluteX(image.x) - im.width / 2, absoluteY(image.y) - im.height / 2);
	}
	im.src = '/static/' + image.type + '.png';
	images[image.type] = im;
}

function absoluteX(x) {
	return x / 100 * ctx.canvas.width;
}

function absoluteY(y) {
	return y / 100 * ctx.canvas.height;
}