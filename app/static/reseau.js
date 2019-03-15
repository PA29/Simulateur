/*
Ce fichier gère le réseau affiché dans les deux modes : edition / résultats
*/

var grid; //Variable stockant les données du réseau
var canvasGrid; //Variable stockant le canvas du réseau


var pointSize = 3; //Rayon d'un bus (point)
var selectionSize = 3; //Distance supplémentaire fictive pour faciliter la sélection

var IMAGE_WIDTH = 8; //% de la taille par rapport à la largeur

var SHADOW_COLOR = 'lightgrey';

var ANIMATION_DISTANCE = 4;
var ANIMATION_DURATION = 2000;

var tempPower = [true, false, true]; //TEMP// Variable pour tester l'affichage des flux de puissance

//TEMPORAIRE// Chargement d'un réseau de base - Exécution dès le chargement du fichier
var getGrid = new Promise(function(resolve, reject) {
	$.get('/unScenario', function(data) { //Requête GET pour obtenir la dernière sauvegarde du réseau
		console.log(data);
		grid = new Grid(data.grid); //Création de l'instance de la classe Grid avec les données récupérées
		resolve(); //Cette ligne appelle la fonction passée en paramètre de getGrid.then() : permet d'attendre que le réseau soit chargé
	});
});

// Créer le réseau (interactions + affichage)
function createGrid() {
	console.log(canvasGrid);
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

	this.statusPowerFlow = false;

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
	
///////////////////////////////////////////////////////////modification 
	this.dropped = {
		drop : '' ,
		type : '',
		position : {'x': '',
					'y':''
		} 		
	};
////////////////////////////////////////////////////////////////////////
	
	//Renvoie les données nécéssaires à la simulation
	this.simulationParam = function() {
		let param = {
			bus: [],
			lines: [],
			components: []
		}

		for (let bus of grid.bus) {
			param.bus.push(bus.data);
		}
		for (let line of grid.lines) {
			param.lines.push(line.data);
		}
		for (let component of grid.images) {
			param.components.push(component.data);
		}

		return param;
	}

	//Renvoie les données nécéssaires à la simulation
	this.simulationParam = function() {
		let param = {
			bus: [],
			lines: [],
			images: []
		}

		for (let bus of grid.bus) {
			param.bus.push(bus.data);
		}
		for (let line of grid.lines) {
			param.lines.push(line.data);
		}
		for (let image of grid.images) {
			param.images.push(image.data);
		}

		return param;
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

		if (instance.statusPowerFlow) {
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
		instance.statusPowerFlow = true;
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
		instance.statusPowerFlow = false;
		cancelAnimationFrame(instance.request);
		instance.draw();
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
	console.log(data)
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
	picture.parametersOpened = false;


	let imSize = function() {
		return Math.min(canvasGrid.absoluteX(IMAGE_WIDTH), canvasGrid.absoluteY(IMAGE_HEIGHT)); //TEMP?// On considère la plus forte des contraintes
	}


	picture.default = function() {
		canvasGrid.drawStroke(data, grid.bus[data.bus].data);
		canvasGrid.drawRoundedSquare(data, IMAGE_WIDTH, IMAGE_WIDTH / 10, 'white');
		canvasGrid.drawImage(data.type + '_withoutBG', data, IMAGE_WIDTH);
	}
	picture.hover = function() {
		canvasGrid.drawStroke(data, grid.bus[data.bus].data);
		canvasGrid.drawRoundedSquare(data, IMAGE_WIDTH, IMAGE_WIDTH / 10, 'lightgrey');
		canvasGrid.drawImage(data.type + '_withoutBG', data, IMAGE_WIDTH);
		canvasGrid.drawImage('croix', {'x':data.x+IMAGE_WIDTH/2,'y':data.y-IMAGE_WIDTH/2}, IMAGE_WIDTH/2);
	}
	
/*	picture.del = function() {
		let id_line_before=None;
		let deja_trouve=False;
		let uncite=True
		for (let i=0;i<grid.lines.lenght;i++) {
			if (id_line_before===line.bus1 && !deja_trouve) {
				deja_trouve=True;
				id_line_before=i;
			}
			if (id_line_before===line.bus1 && deja_trouve) {
				unicite=False;
			}
		}
		let id_line_after=None;
		deja_trouve=False;
		uncite=True
		for (let i=0;i<grid.lines.lenght;i++) {
			if (id_line_after===line.bus2 && !deja_trouve) {
				deja_trouve=True;
				id_line_after=i;
			}
			if (id_line_after===line.bus2 && deja_trouve) {
				unicite=False;
			}
		if (!unicite) {
			grid.bus[grid.lines[id_line_after].bus1.id].P=0;
			grid.bus[grid.lines[id_line_after].bus1.id].Q=0;
		}		
		if (unicite) {
			let new_line=new(Line);
			new_line.bus1=grid.lines[id_line_before].bus1;
			new_line.bus2=grid.lines[id_line_after].bus2;
			new_line.length=grid.lines[id_line_before].length+grid.lines[id_line_after].length;
			delete[grid.lines[id_line_before]];
			delete[grid.lines[id_line_after]];
			grid.lines.push(new_line);
			for (let bus in grid.bus) {
				if (bus.id===picture.bus){delete(grid.bus[bus]);}
		}
		for (let image in grid.images) {
			if (picture===image){delete(images[image]);}
		}
		grid.draw();
		}
	}
*/
	
	picture.draw = picture.default;

	picture.inside = function(x, y) {
		let absX = x - canvasGrid.absoluteX(picture.data.x), absY = y - canvasGrid.absoluteY(picture.data.y);
		let absSize = canvasGrid.absoluteX(IMAGE_WIDTH);
		return ((Math.abs(absX) <= absSize / 2) && (Math.abs(absY) <= absSize / 2));
	}

/*	picture.on_cross = function(x,y) {
		let absX = x - canvasGrid.absoluteX(picture.data.x), absY = y - canvasGrid.absoluteY(picture.data.y);
		let absSize = canvasGrid.absoluteX(IMAGE_WIDTH);
		(absX >= absSize/2 && absX <= 3*absSize/2) && (absY >= -3*absSize/2 && absY <= -absSize/2);
	}
*/
	picture.onClick = function(x, y) {
/*		if (picture.inside(x,y)){
			picture.del();
		}
*/
		if ($('body').attr('id') == 'edition' && !picture.parametersOpened) {
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
		let imageID = grid.images.indexOf(picture);
		picture.parametersOpened = true;

		$.ajax({
			url: 'parametres',
			type: 'POST',
			data: JSON.stringify({
				x: data.x + 5,
				y: data.y - 3,
				imageID: imageID,
				data: picture.data
			}),
			contentType: 'application/json',
			success: function(data) {
				$('#centerArea .panel.edition').append(data);

				let window = $('.parametres[imageID="' + imageID + '"]').parents('.window');
				window.find('.close').on('click', function() {
					window.remove();
					picture.parametersOpened = false;
				});
			}
		});
	}

	return picture;
}

// Classe générique pour Bus, Line et Picture
function Element(data) {
	let instance = this;
	instance.data = data;
	instance.isHovered = false;
	instance.isDragged = false;

	instance.onMouseDown = function(e) {
		if (instance.inside(e.offsetX, e.offsetY)) {
			instance.mousedown = {
				x: e.offsetX - canvasGrid.absoluteX(instance.data.x),
				y: e.offsetY - canvasGrid.absoluteY(instance.data.y)
			};
		}
	}
	instance.onMouseMove = function(e) {
		if (instance.inside(e.offsetX, e.offsetY) && !instance.hasOwnProperty('mousedown') && !instance.isHovered) {
			instance.isHovered = true;

			if (instance.hasOwnProperty('hover')) {
				instance.draw = instance.hover;
				grid.draw();
			}
		}
		else if (instance.hasOwnProperty('mousedown') && instance.hasOwnProperty('dragEdit')) {
			instance.dragEdit(e.offsetX, e.offsetY);
			instance.isDragged = true;
		}
		else if (!instance.inside(e.offsetX, e.offsetY) && instance.isHovered) {
			instance.isHovered = false;

			if (instance.draw != instance.default) {
				instance.draw = instance.default;
				grid.draw();
			}
		}
	}
	instance.onMouseUp = function(e) {
		if (instance.hasOwnProperty('mousedown') && !instance.isDragged && instance.hasOwnProperty('onClick')) {
			instance.onClick(instance.mousedown.x, instance.mousedown.y);
		}
		delete instance.mousedown;
		instance.isDragged = false;
	}
}