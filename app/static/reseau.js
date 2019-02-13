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
		//grid = convertGrid(data.grid);
		grid = new Grid(data.grid);
		resolve();
	});
});

/* Affichage et interactions avec le réseau */

// Créer le réseau (interactions + affichage)
function createGrid() {
	let canvas = document.getElementById('grid');
	ctx = canvas.getContext('2d');

	getGrid.then(function() {
		//initInteractions();
		//redrawGrid();
		grid.setInteractions();
		grid.redraw();
	}).catch(function() {
		console.log("Impossible d'afficher le réseau");
	});
}

// Active les intéractions avec le réseau (survol, click, drag, ...)
function initInteractions() {

	// Interactions liées à l'appui sur le bouton gauche de la souris
	$('#centerArea').on('mousedown', function(e) {
		for (let bus of grid.bus) {
			bus.onMouseDown();
		}
	});

	// Interactions liées au déplacement de la souris
	$('#centerArea').on('mousemove', function(e) {

	});

	// Interactions liées à la relache du bouton gauche de la souris
	$('#centerArea').on('mousemove', function(e) {
		
	});
}

function Grid(data) {

	this.bus = [];
	for (let bus of data.bus) {
		this.bus.push(new Bus(bus));
	}
	this.lines = [];
	for (let line of data.lines) {
		this.lines.push(new Line(line));
	}
	this.images = [];
	for (let image of data.images) {
		this.images.push(new Picture(image));
	}

	this.redraw = function() {
		let centerArea = document.getElementById('centerArea');
		let canvas = document.getElementById('grid');

		canvas.width = centerArea.offsetWidth;
		canvas.height = centerArea.offsetHeight;

		this.draw();
	}

	this.draw = function() {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		this.forAll(function(elmt) {
			elmt.draw();
		})
	}

	this.setInteractions = function() {
		thisElmt = this;
		$('#centerArea').on('mousedown', function(e) {
			thisElmt.forAll(function(elmt) {
				elmt.onMouseDown(e);
			});
		});
		$('#centerArea').on('mousemove', function(e) {
			thisElmt.forAll(function(elmt) {
				elmt.onMouseMove(e);
			});
		});
		$('#centerArea').on('mouseup', function(e) {
			thisElmt.forAll(function(elmt) {
				elmt.onMouseUp(e);
			});
		});
	}

	this.forAll = function(f) {
		for (let bus of grid.bus) {
			f(bus);
		}
		for (let line of grid.lines) {
			f(line);
		}
		for (let image of grid.images) {
			f(image);
		}
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
		grid.redraw();
	}
	// Fonction appelée quand l'élément cesse d'être survolé
	bus.clearHover = function() {
		this.isHovered = false;
		bus.draw = bus.default;
		grid.redraw();
	}
	bus.onClick = function(x, y) {
		if ($('body').attr('id') == 'resultats') {
			bus.showAddJauge();
		}
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

				$('.window .close').on('click', function() {
					$(this).parents('.window').remove();
				});

				// Ajout de l'interaction avec les boutons
				$('.addJauge .button').on('click', function() {
	    			let busID = $(this).parents('.addJauge').attr('busid');
	    			let variable = $(this).attr('id');

	    			//Affichage de la Jauge et suppression de la fenêtre d'ajout d'une jauge
	    			grid.bus[busID].showJauge(variable);
	    			$(this).parents('.window').remove();
	    		});
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

	line.inside = function(x, y) {
		return false;
	}

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
		let absX = x - absoluteX(picture.data.x), absY = y - absoluteY(picture.data.y);
		let imSize = Math.min(absoluteX(IMAGE_WIDTH), absoluteY(IMAGE_HEIGHT));
		return ((Math.abs(absX) <= imSize / 2) && (Math.abs(absY) <= imSize / 2));
	}
	picture.onClick = function(x, y) {
		if ($('body').attr('id') == 'edition') {
			picture.showParameters();
		}
	}
	picture.dragEdit = function(x, y) {
		this.data.x = (x - this.mousedown.x) / ctx.canvas.width * 100;
		this.data.y = (y - this.mousedown.y) / ctx.canvas.height * 100;
		grid.redraw();
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

				$('.window .close').on('click', function() {
					$(this).parents('.window').remove();
				});
			}
		});
	}

	return picture;
}

// Classe générique pour Bus, Line et Picture
function Element(data) {
	this.data = data;
	this.isHovered = false;
	this.isDragged = false;

	this.onMouseDown = function(e) {
		if (this.inside(e.offsetX, e.offsetY)) {
			this.mousedown = {
				x: e.offsetX - absoluteX(this.data.x),
				y: e.offsetY - absoluteY(this.data.y)
			};
		}
	}
	this.onMouseMove = function(e) {
		if (this.inside(e.offsetX, e.offsetY) && !this.hasOwnProperty('mousedown') && !this.isHovered && this.hasOwnProperty('setHover')) {
			this.setHover();
		}
		else if (this.hasOwnProperty('mousedown') && this.hasOwnProperty('dragEdit')) {
			this.dragEdit(e.offsetX, e.offsetY);
			this.isDragged = true;
		}
		else if (!this.inside(e.offsetX, e.offsetY) && this.isHovered && this.hasOwnProperty('clearHover')) {
			this.clearHover();
		}
	}
	this.onMouseUp = function(e) {
		if (this.hasOwnProperty('mousedown') && !this.isDragged && this.hasOwnProperty('onClick')) {
			this.onClick(this.mousedown.x, this.mousedown.y);
		}
		delete this.mousedown;
		this.isDragged = false;
	}
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

function relativeX(x) {
	return x / ctx.canvas.width * 100;
}

function relativeY(y) {
	return y / ctx.canvas.height * 100;
}