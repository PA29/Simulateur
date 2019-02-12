var ctx;
var images = {};
var grid;

var pointSize = 3; //Rayon d'un bus (point)
var selectionSize = 3; //Distance supplémentaire fictive pour faciliter la sélection

var IMAGE_WIDTH = 8; //Max en % de la taille par rapport à la largeur
var IMAGE_HEIGHT = 14; //Max en % de la taille par rapport à la hauteur

//TEMPORAIRE// Chargement d'un réseau de base - Exécution dès le chargement du fichier
var getGrid = new Promise(function(resolve, reject) {
	$.get('unScenario', function(data) {
		grid = convertGrid(data.grid);
		resolve();
	});
});

//Transforme les objets JSON contenus dans 'data' en objets Bus, Line ou Picture
function convertGrid(data) {
	let grid = {bus: [], lines: [], images: []};

	for (let bus of data.bus) {
		grid.bus.push(new Bus(bus));
	}
	for (let line of data.lines) {
		grid.lines.push(new Line(line));
	}
	for (let image of data.images) {
		grid.images.push(new Picture(image));
	}

	return grid
}

/* Affichage et interactions avec le réseau */

// Créer le réseau (interactions + affichage)
function createGrid() {
	let canvas = document.getElementById('grid');
	ctx = canvas.getContext('2d');

	getGrid.then(function() {
		initInteractions();
		redrawGrid();
	}).catch(function() {
		console.log("Impossible d'afficher le réseau");
	});
}

// Redessine le réseau à partir des dimensions du canvas
function redrawGrid() {
	let centerArea = document.getElementById('centerArea');
	let canvas = document.getElementById('grid');

	canvas.width = centerArea.offsetWidth;
	canvas.height = centerArea.offsetHeight;

	drawGrid(grid);
}

// Active les intéractions avec le réseau (survol, click, drag, ...)
function initInteractions() {

	// Interactions liées au déplacement de la souris
	$('#centerArea').on('mousemove', function(e) {
		for (let bus of grid.bus) {
			if (bus.inside(e.offsetX, e.offsetY) && !bus.isHovered) {
				bus.setHover();
			}
			if (bus.isHovered && !bus.inside(e.offsetX, e.offsetY)) {
				bus.clearHover();
			}
		}

		for (let line of grid.lines) {
			// A DEVELOPPER - Survol des lignes
		}

		// A DEVELOPPER - Survol des images
	});

	// Interactions liées à l'appuis sur le bouton gauche de la souris (!= du click)
	$('#centerArea').on('mousedown', function(e) {

		// Interaction sur les images en mode édition
		setInteraction('edition', grid.images, e, function(image) {
			if(!$('.parametres[imageid="' + grid.images.indexOf(image) + '"]').length) {
				image.showParameters();
			}
		});

		// Interaction sur les bus en mode résultats
		setInteraction('resultats', grid.bus, e, function(bus) {
			if(!$('.addJauge[busid="' + grid.bus.indexOf(bus) + '"]').length) {
				bus.showAddJauge();
			}
		})
	});

	$('#centerArea').on('dragstart')
}

// Crée une interaction spécifique aux paramètres dans une nouvelle fenêtre
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

// Dessine le réseau
function drawGrid() {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	for (let bus of grid.bus) {
		bus.draw();
	}

	for (let line of grid.lines) {
		line.draw();
	}

	for (let image of grid.images) {
		image.draw();
	}
}

// Classe définissant un bus
function Bus(data) {
	let bus = new Element(data);

	// Affichage par défaut
	bus.default = function() {
		drawPoint(data, pointSize);
	}
	// Affichage lors du survol
	bus.hover = function() {
		drawPoint(data, pointSize + selectionSize);
	}
	bus.draw = bus.default; // Variable stockant le type d'affichage

	// Indique si les coordonnées sont dans la zone de sélection de l'élément
	bus.inside = function(x, y) {
		return Math.pow(x - absoluteX(data.x), 2) + Math.pow(y - absoluteY(data.y), 2) < Math.pow(pointSize + selectionSize, 2);
	}
	// Fonction appelée quand l'élément commence à être survolé
	bus.setHover = function() {
		this.isHovered = true;
		bus.draw = bus.hover;
		drawGrid();
	}
	// Fonction appelée quand l'élément cesse d'être survolé
	bus.clearHover = function() {
		this.isHovered = false;
		bus.draw = bus.default;
		drawGrid();
	}
	// Affiche la fenêtre d'ajout d'un jauge (est appelée lors du click dans le mode résultats)
	bus.showAddJauge = function() {
		$.ajax({
			url: 'addJauge',
			type: 'POST',
			data: JSON.stringify({
				x: data.x + 1, //TEMPORAIRE// Position de la fenêtre en x
				y: data.y - 1, //TEMPORAIRE// Position de la fenêtre en y
				busID: grid.bus.indexOf(this)
			}),
			contentType: 'application/json',
			success: function(data) {
				// Ajout du html à la zone centrale
				$('#centerArea .panel.resultats').append(data);

				// Ajout de l'interaction avec les boutons
				$('.addJauge .button').on('click', function() {
	    			let busID = $(this).parents('.addJauge').attr('busid');
	    			let variable = $(this).attr('id');

	    			//Affichage de la Jauge et suppression de la fenêtre d'ajout d'une jauge
	    			grid.bus[busID].showJauge(variable);
	    			$(this).parents('.window').remove();
	    		})
			}
		});
	}
	// Affiche la jauge associé au bus (est appelée lors du click sur un bouton de la fenêtre d'ajout d'une jauge)
	bus.showJauge = function(variable) {
		console.log("Show Jauge : " + variable);
	}

	return bus;
}

// Classe définissant une ligne
function Line(data) {
	let line = new Element(data);
	line.default = function() {
		drawStroke(grid.bus[data.bus1].data, grid.bus[data.bus2].data);
	}
	line.draw = line.default;

	return line;
}

// Classe définissant un élément du réseau
function Picture(data) {
	let picture = new Element(data);
	picture.default = function() {
		drawStroke(data, grid.bus[data.bus].data);
		drawImage(data.type, data);
	}
	picture.draw = picture.default;

	picture.inside = function(x, y) {
		let relX = x - absoluteX(picture.data.x), relY = y - absoluteY(picture.data.y);
		let imSize = Math.min(absoluteX(IMAGE_WIDTH), absoluteY(IMAGE_HEIGHT));
		return ((Math.abs(relX) <= imSize / 2) && (Math.abs(relY) <= imSize / 2));
	}
	// Affiche la fenêtre des paramètres de l'élément
	picture.showParameters = function() {
		$.ajax({
			url: 'parametres',
			type: 'POST',
			data: JSON.stringify({
				x: data.x + 5,
				y: data.y - 3,
				imageID: grid.images.indexOf(this),
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

// Classe générique pour Bus, Line et Picture
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

	if (!images.hasOwnProperty(imageName)) { // Si l'image n'est pas stocké dans 'images' (= si elle n'a oas déjà été chargée)
		let im = new Image();
		im.onload = function() { // Quand l'image sera chargée
			pre = document.createElement('canvas'); // Sorte de sous-canvas permettant de pré-rendre l'image (gain en performances)
			pre.width = im.width;
			pre.height = im.height;
			preCtx = pre.getContext('2d');
			preCtx.drawImage(im, 0, 0); // L'image est rendue sur le sous-canvas

			// On stocke le sous-canvas si l'image doit être ré-utilisée
			images[imageName] = pre;

			// On affiche le sous-canvas sur le canvas visible à l'écran
			ctx.drawImage(pre, absoluteX(position.x) - imSize / 2, absoluteY(position.y) - imSize / 2, imSize, imSize);
		}
		im.src = '/static/' + imageName + '.png';
	}
	else { // Si l'image avait déjà été chargée, on réutilise le sous-canvas (on ne recharge pas l'image)
		let pre = images[imageName]
		ctx.drawImage(pre, absoluteX(position.x) - imSize / 2, absoluteY(position.y) - imSize / 2, imSize, imSize);
	}
}

// Conversion entre position relative (en %) et position absolue (en px)
function absoluteX(x) {
	return x / 100 * ctx.canvas.width;
}

function absoluteY(y) {
	return y / 100 * ctx.canvas.height;
}