var ctx;
var images = {};
var reseau;

var pointSize = 3;
var selectionSize = 3;

var IMAGE_WIDTH = 8; //Max en % de la taille par rapport à la largeur
var IMAGE_HEIGHT = 14; //Max en % de la taille par rapport à la hauteur

var getReseau = new Promise(function(resolve, reject) {
	$.get('unScenario', function(data) {
		reseau = convertReseau(data.reseau);
		resolve();
	});
});

function convertReseau(data) {
	let reseau = {bus: [], lines: [], images: []};

	for (let bus of data.bus) {
		reseau.bus.push(new Bus(bus));
	}
	for (let line of data.lines) {
		reseau.lines.push(new Line(line));
	}
	for (let image of data.images) {
		reseau.images.push(new Picture(image));
	}

	return reseau
}

/* Affichage et interactions avec le réseau */

function createReseau() {
	let canvas = document.getElementById('reseau');
	ctx = canvas.getContext('2d');

	getReseau.then(function() {
		resizeCanvas();
		initInteractions();
	}).catch(function() {
		console.log("Impossible d'afficher le réseau");
	});
}

function resizeCanvas() {
	let centerArea = document.getElementById('centerArea');
	let canvas = document.getElementById('reseau');

	canvas.width = centerArea.offsetWidth;
	canvas.height = centerArea.offsetHeight;

	drawReseau(reseau);
}

function initInteractions() {
	$('#centerArea').on('mousemove', function(e) {
		for (let bus of reseau.bus) {
			if (bus.inside(e.offsetX, e.offsetY) && !bus.isHovered) {
				bus.setHover();
			}
			if (bus.isHovered && !bus.inside(e.offsetX, e.offsetY)) {
				bus.clearHover();
			}
		}

		for (let line of reseau.lines) {
			// Gestion des interactions avec les lignes
		}
	});

	$('#centerArea').on('mousedown', function(e) {

		setInteraction('edition', reseau.images, e, function(image) {
			if(!$('.parametres[imageid="' + reseau.images.indexOf(image) + '"]').length) {
				image.showParameters();
			}
		});

		setInteraction('resultats', reseau.bus, e, function(bus) {
			if(!$('.addJauge[busid="' + reseau.bus.indexOf(bus) + '"]').length) {
				bus.showAddJauge();
			}
		})
	});
}

function setInteraction(mode, triggers, event, callback) {
	if ($('body').attr('id') == mode) {
		for (let element of triggers) {
			if (element.inside(event.offsetX, event.offsetY)) {
				callback(element);
			}
		}
	}

	$('.window .close').on('click', function() {
		$(this).parents('.window').remove();
	})
}

function drawReseau() {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	for (let bus of reseau.bus) {
		bus.draw();
	}

	for (let line of reseau.lines) {
		line.draw();
	}

	for (let image of reseau.images) {
		image.draw();
	}
}

function Bus(data) {
	let bus = new Element(data);
	bus.default = function() {
		drawPoint(data, pointSize);
	}
	bus.hover = function() {
		drawPoint(data, pointSize + selectionSize);
	}
	bus.draw = bus.default;

	bus.inside = function(x, y) {
		return Math.pow(x - absoluteX(data.x), 2) + Math.pow(y - absoluteY(data.y), 2) < Math.pow(pointSize + selectionSize, 2);
	}
	bus.setHover = function() {
		this.isHovered = true;
		bus.draw = bus.hover;
		drawReseau();
	}
	bus.clearHover = function() {
		this.isHovered = false;
		bus.draw = bus.default;
		drawReseau();
	}
	bus.showAddJauge = function() {
		$.ajax({
			url: 'addJauge',
			type: 'POST',
			data: JSON.stringify({
				x: data.x + 1,
				y: data.y - 1,
				busID: reseau.bus.indexOf(this)
			}),
			contentType: 'application/json',
			success: function(data) {
				$('#centerArea .panel.resultats').append(data);

				$('.addJauge .button').on('click', function() {
	    			let busID = $(this).parents('.addJauge').attr('busid');
	    			let variable = $(this).attr('id');

	    			reseau.bus[busID].showJauge(variable);
	    			$(this).parents('.window').remove();
	    		})
			}
		});
	}
	bus.showJauge = function(variable) {
		console.log("Show Jauge : " + variable);
	}

	return bus;
}

function Line(data) {
	let line = new Element(data);
	line.default = function() {
		drawStroke(reseau.bus[data.bus1].data, reseau.bus[data.bus2].data);
	}
	line.draw = line.default;

	return line;
}

function Picture(data) {
	let picture = new Element(data);
	picture.draw = function() {
		drawStroke(data, reseau.bus[data.bus].data);
		drawImage(data.type, data);
	}
	picture.inside = function(x, y) {
		let relX = x - absoluteX(picture.data.x), relY = y - absoluteY(picture.data.y);
		let imSize = Math.min(absoluteX(IMAGE_WIDTH), absoluteY(IMAGE_HEIGHT));
		return ((Math.abs(relX) <= imSize / 2) && (Math.abs(relY) <= imSize / 2));
	}
	picture.showParameters = function() {
		$.ajax({
			url: 'parametres',
			type: 'POST',
			data: JSON.stringify({
				x: data.x + 5,
				y: data.y - 3,
				imageID: reseau.images.indexOf(this),
				data: this.data
			}),
			contentType: 'application/json',
			success: function(data) {
				$('#centerArea .panel.edition').append(data);
			}
		});
	}

	return picture;
}

function Element(data) {
	this.data = data;
	this.isHovered = false;
}

function drawPoint(position, size) {
	ctx.beginPath();
	ctx.arc(absoluteX(position.x), absoluteY(position.y), size, 0, 2 * Math.PI);
	ctx.fill();
}

function drawStroke(position1, position2) {
	ctx.beginPath();
	ctx.moveTo(absoluteX(position1.x), absoluteY(position1.y));
	ctx.lineTo(absoluteX(position2.x), absoluteY(position2.y));
	ctx.stroke();
}

function drawImage(imageName, position) {
	let imSize = Math.min(absoluteX(IMAGE_WIDTH), absoluteY(IMAGE_HEIGHT))

	if (!images.hasOwnProperty(imageName)) {
		let im = new Image();
		im.onload = function() {
			pre = document.createElement('canvas');
			pre.width = im.width;
			pre.height = im.height;
			preCtx = pre.getContext('2d');
			preCtx.drawImage(im, 0, 0);

			images[imageName] = pre;

			ctx.drawImage(pre, absoluteX(position.x) - imSize / 2, absoluteY(position.y) - imSize / 2, imSize, imSize);
		}
		im.src = '/static/' + imageName + '.png';
	}
	else {
		let pre = images[imageName]
		ctx.drawImage(pre, absoluteX(position.x) - imSize / 2, absoluteY(position.y) - imSize / 2, imSize, imSize);
	}
}

function absoluteX(x) {
	return x / 100 * ctx.canvas.width;
}

function absoluteY(y) {
	return y / 100 * ctx.canvas.height;
}