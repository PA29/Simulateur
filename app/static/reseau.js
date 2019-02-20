/*
Ce fichier gère le réseau affiché dans les deux modes : edition / résultats
*/

var grid; //Variable stockant les données du réseau

var pointSize = 3; //Rayon d'un bus (point)
var selectionSize = 3; //Distance supplémentaire fictive pour faciliter la sélection

var IMAGE_WIDTH = 8; //Max en % de la taille par rapport à la largeur
var IMAGE_HEIGHT = 14; //Max en % de la taille par rapport à la hauteur

var ANIMATION_DISTANCE = 4;
var ANIMATION_DURATION = 2000;

var tempPower = [true, true, true]; //TEMP// Variable pour tester l'affichage des flux de puissance

//TEMPORAIRE// Chargement d'un réseau de base - Exécution dès le chargement du fichier
var getGrid = new Promise(function(resolve, reject) {
	$.get('unScenario', function(data) { //Requête GET pour obtenir la dernière sauvegarde du réseau
		grid = new Grid(data.grid); //Création de l'instance de la classe Grid avec les données récupérées
		resolve(); //Cette ligne appelle la fonction passée en paramètre de getGrid.then() : permet d'attendre que le réseau soit chargé
	});
});

// Créer le réseau (interactions + affichage)
function createGrid() {
	canvasGrid = new Canvas('grid'); //Création de l'instance de la classe Canvas

	getGrid.then(function() { //Quand le réseau est chargé (requête GET ligne 20)
		grid.setInteractions(); //Créer les interactions du réseau avec l'utilisateur (click, survol, etc.)
		grid.redraw(); //Dessine le réseau (en redimensionnant les éléments en fonction de la taille du canvas)
	}).catch(function() { //Si un problème s'est produit
		console.log("Impossible d'afficher le réseau");
	});
}

//Classe représentant le réseau
function Grid(data) {
	var instance = this;

	//Création de l'instance avec création des attributs bus, lines et images
	this.bus = [];
	for (let bus of data.bus) {
		instance.bus.push(new Bus(bus));
	}
	this.lines = [];
	for (let line of data.lines) {
		instance.lines.push(new Line(line));
	}
	this.images = [];
	for (let image of data.images) {
		instance.images.push(new Picture(image));
	}

	//Dessine le réseau en actualisant les dimensions du canvas
	this.redraw = function() {
		let centerArea = document.getElementById('centerArea');
		let canvas = document.getElementById('grid');

		canvasGrid.canvas.width = centerArea.offsetWidth;
		canvasGrid.canvas.height = centerArea.offsetHeight;

		instance.draw();
	}

	//Dessine le réseau
	this.draw = function() {
		canvasGrid.ctx.clearRect(0, 0, canvasGrid.canvas.width, canvasGrid.canvas.height); //Efface tout le contenu du canvas
		instance.forEach(function(elmt) { //Dessine chaque élément du réseau
			elmt.draw();
		});

		if ($('body').attr('id') == 'resultats') {
			instance.lines.forEach(function(elmt) {
				let intensity = (tempPower[grid.lines.indexOf(elmt)]) ? 1 : -1;
				elmt.drawFlow(intensity);
			})
		}
	}

	//Créer les interactions entre le canvas et l'utilisateur
	this.setInteractions = function() {
		$('#centerArea').on('mousedown', function(e) {
			instance.forEach(function(elmt) {
				elmt.onMouseDown(e);
			});
		});
		$('#centerArea').on('mousemove', function(e) {
			instance.forEach(function(elmt) {
				elmt.onMouseMove(e);
			});
		});
		$('#centerArea').on('mouseup', function(e) {
			instance.forEach(function(elmt) {
				elmt.onMouseUp(e);
			});
		});
	}

	//Démarre la boucle permettant d'animer le canvas autour de 60FPS
	this.startPowerFlow = function() {
		let t0 = (new Date()).getTime(), dt = 0;

		function refresh() {
			dt = (new Date()).getTime() - t0;
			t0 = (new Date()).getTime();

			grid.bus[0].arrowPos = (grid.bus[0].arrowPos - dt / ANIMATION_DURATION * ANIMATION_DISTANCE) % ANIMATION_DISTANCE;
			instance.draw();

			instance.request = requestAnimationFrame(refresh);
		}

		instance.request = requestAnimationFrame(refresh);
	}

	//Arrête la boucle
	this.stopPowerFlow = function() {
		cancelAnimationFrame(instance.request);
	}

	//Appelle la fonction f pour chaque élément du réseau
	this.forEach = function(f) {
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
	bus.arrowPos = 0;

	// Affichage par défaut
	bus.default = function() {
		canvasGrid.drawPoint(data, pointSize);
	}
	// Affichage lors du survol
	bus.hover = function() {
		canvasGrid.drawPoint(data, pointSize + selectionSize);
	}
	bus.draw = bus.default; // Variable stockant le type d'affichage

	// Indique si les coordonnées sont dans la zone de sélection de l'élément
	bus.inside = function(x, y) {
		return Math.pow(x - canvasGrid.absoluteX(data.x), 2) + Math.pow(y - canvasGrid.absoluteY(data.y), 2) < Math.pow(pointSize + selectionSize, 2);
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
		canvasGrid.drawStroke(grid.bus[data.bus1].data, grid.bus[data.bus2].data);
	}
	line.draw = line.default;

	line.drawFlow = function(intensity) {
		grid.bus[line.data.bus2].arrowPos = (grid.bus[line.data.bus1].arrowPos + ((intensity >= 0) ? line.data.length : -line.data.length)) % ANIMATION_DISTANCE;
		let startBus = (intensity >= 0) ? grid.bus[line.data.bus1] : grid.bus[line.data.bus2];
		let endBus = (intensity >= 0) ? grid.bus[line.data.bus2] : grid.bus[line.data.bus1];

		for (let d = (ANIMATION_DISTANCE - startBus.arrowPos) % ANIMATION_DISTANCE; d < line.data.length; d += ANIMATION_DISTANCE) {
			
			let a = d / line.data.length;
			canvasGrid.drawPoint({
				x: startBus.data.x * (1 - a) + endBus.data.x * a,
				y: startBus.data.y * (1 - a) + endBus.data.y * a
			}, pointSize);
		}
	}

	line.inside = function(x, y) {
		return false;
	}

	return line;
}

// Classe définissant un élément du réseau
function Picture(data) {
	let picture = new Element(data);
	picture.default = function() {
		canvasGrid.drawStroke(data, grid.bus[data.bus].data);
		canvasGrid.drawImage(data.type, data);
	}
	picture.draw = picture.default;

	picture.inside = function(x, y) {
		let absX = x - canvasGrid.absoluteX(picture.data.x), absY = y - canvasGrid.absoluteY(picture.data.y);
		let imSize = Math.min(canvasGrid.absoluteX(IMAGE_WIDTH), canvasGrid.absoluteY(IMAGE_HEIGHT));
		return ((Math.abs(absX) <= imSize / 2) && (Math.abs(absY) <= imSize / 2));
	}
	picture.onClick = function(x, y) {
		if ($('body').attr('id') == 'edition') {
			picture.showParameters();
		}
	}
	picture.dragEdit = function(x, y) {
		if ($('body').attr('id') == 'edition') {
			this.data.x = (x - this.mousedown.x) / canvasGrid.canvas.width * 100;
			this.data.y = (y - this.mousedown.y) / canvasGrid.canvas.height * 100;
			grid.redraw();
		}
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
				x: e.offsetX - canvasGrid.absoluteX(this.data.x),
				y: e.offsetY - canvasGrid.absoluteY(this.data.y)
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