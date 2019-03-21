/*
Ce fichier gère le réseau affiché dans les deux modes : edition / résultats
*/

var grid; //Variable stockant les données du réseau
var canvasGrid; //Variable stockant le canvas du réseau


var pointSize = 3; //Rayon d'un bus (point)
var WIDTH_LINE = 1;
var selectionSize = 3; //Distance supplémentaire fictive pour faciliter la sélection

var IMAGE_WIDTH = 8; //% de la taille par rapport à la largeur

var SHADOW_COLOR = 'lightgrey';

var ANIMATION_DISTANCE = 4;
var ANIMATION_DURATION = 2000;

var mouse_position;

var tempPower = [true, false, true]; //TEMP// Variable pour tester l'affichage des flux de puissance

// Créer le réseau (interactions + affichage)
function createGrid() {
	canvasGrid = new Canvas('grid'); //Création de l'instance de la classe Canvas

	let getGrid = new Promise(function(resolve, reject) {
		let applyGrid = function(data) {
			grid = new Grid(data.grid); //Création de l'instance de la classe Grid avec les données récupérées
			resolve(); //Cette ligne appelle la fonction passée en paramètre de getGrid.then() : permet d'attendre que le réseau soit chargé
		}
		
		if ($('#grid').attr('model') != undefined) {
			$.get('/reseau/model/' + $('#grid').attr('model'), applyGrid);
		}
		else if ($('#grid').attr('filename') != undefined) {
			$.get('/reseau/file/' + $('#grid').attr('filename'), applyGrid);
		}
		else {
			$.get('/reseau/nouveau', applyGrid);
		}
	});

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

	this.draganddrop = false;
	this.newPicture = {type: '', x: '' , y: ''};


	//this.selectedBus = 1;

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

			if(grid.draganddrop){

				var position = {x : grid.newPicture.x, y: grid.newPicture.y};

				canvasGrid.drawStroke(position, mouse_position);

				canvasGrid.drawImage(grid.newPicture.type, position, 8);
				
				//build_zone.addEventListener('mousemove',function(event){

					//mouse_position  = {x: event.layerX*100/canvasGrid.canvas.width, y : event.layerY*100/canvasGrid.canvas.height};

					//canvasGrid.drawStroke(position, mouse_position);

				//})

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
			mouse_position = {x : e.offsetX*100/canvasGrid.canvas.width , y : e.offsetY*100/canvasGrid.canvas.height}

			instance.forEach(function(elmt) {
				elmt.onMouseMove(e);
			});
			if (grid.draganddrop){
				grid.draw();
			};


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

	let bus = new Element(data);
	bus.arrowPos = 0;

	// Affichage par défaut
	bus.default = function() {
		canvasGrid.drawPoint(data, pointSize);
	}
	// Affichage lors du survol
	bus.hover = function() {
		canvasGrid.drawPoint(data, pointSize + selectionSize);
		mouse_position.x = bus.data.x;
		mouse_position.y = bus.data.y;
	}
	bus.draw = bus.default; // Variable stockant le type d'affichage

	// Indique si les coordonnées sont dans la zone de sélection de l'élément
	bus.inside = function() {
		let d = Math.pow(canvasGrid.absoluteX(mouse_position.x - data.x), 2) + Math.pow(canvasGrid.absoluteY(mouse_position.y - data.y), 2)
		return d < Math.pow(pointSize + selectionSize, 2);
	}
	bus.onClick = function() {
		if (($('body').attr('id') == 'edition') && grid.draganddrop) {
			let busIndex = grid.bus.indexOf(bus);
			picture = new Picture({bus: busIndex, type: grid.newPicture.type, x: grid.newPicture.x , y: grid.newPicture.y})
			grid.images.push(picture);
			grid.draganddrop = false;
			grid.draw()

			console.log("Modification de la position")
			mouse_position.x = picture.data.x;
			mouse_position.y = picture.data.y;
			picture.onClick()
		}
		if ($('body').attr('id') == 'resultats') {
			bus.showAddJauge();	
		}
	}

		
	//bus.onClick = function(event){

		//if (grid.draganddrop){
			
			//grid.selectedBus = grid.bus.indexOf(bus);
			//console.log(grid.selectedBus)

		//};

	//}

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
		if (line.data.aerien) {
			canvasGrid.drawStroke(grid.bus[data.bus1].data, grid.bus[data.bus2].data, 'blue');
		}
		else {
			canvasGrid.drawStroke(grid.bus[data.bus1].data, grid.bus[data.bus2].data, 'green');
		}
	}
	line.hover = function() {
		line.default();

		if (grid.draganddrop) {
			let bus1 = grid.bus[line.data.bus1], bus2 = grid.bus[line.data.bus2];
			let proj = projection(mouse_position, line);
			mouse_position.x = bus1.data.x * (1 - proj.x) + bus2.data.x * proj.x;
			mouse_position.y = bus1.data.y * (1 - proj.x) + bus2.data.y * proj.x;
			console.log(mouse_position);
			canvasGrid.drawPoint(mouse_position, pointSize + selectionSize, 'grey');
		}
	}
	line.draw = line.default;

	line.inside = function() {
		let bus1 = grid.bus[line.data.bus1], bus2 = grid.bus[line.data.bus2];
		let proj = projection(mouse_position, line);
		return (proj.x > 0 && proj.x < 1 && proj.y < pointSize + selectionSize && !bus1.inside() && !bus2.inside())
	}
	line.onClick = function() {
		if (grid.draganddrop) {
			let bus1 = grid.bus[line.data.bus1], bus2 = grid.bus[line.data.bus2];
			let alpha = (mouse_position.x - bus1.data.x) / (bus2.data.x - bus1.data.x);

			let bus = new Bus({
				x: mouse_position.x,
				y: mouse_position.y
			});
			bus.draw = bus.hover;
			grid.bus.push(bus);
			
			grid.lines.push(new Line({
				bus1: grid.bus.length - 1,
				bus2: line.data.bus2,
				r: line.data.r,
				x: line.data.x,
				length: (1 - alpha) * line.data.length
			}));
			line.data.bus2 = grid.bus.length - 1;
			line.data.length = alpha * line.data.length;
			console.log(grid);

			grid.bus[grid.bus.length - 1].onClick();
			console.log(grid);
		}
	}
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
		canvasGrid.drawStroke(data, grid.bus[data.bus].data, 'black');
		canvasGrid.drawRoundedSquare(data, IMAGE_WIDTH, IMAGE_WIDTH / 10, 'white');
		canvasGrid.drawImage(data.type + '_withoutBG', data, IMAGE_WIDTH);
	}
	picture.hover = function() {
		canvasGrid.drawStroke(data, grid.bus[data.bus].data, 'black');
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

	picture.inside = function() {
		let absX = mouse_position.x - picture.data.x, absY = mouse_position.y - picture.data.y;
		let absSize = IMAGE_WIDTH;
		return ((Math.abs(absX) <= absSize / 2) && (canvasGrid.absoluteY(Math.abs(absY)) <= canvasGrid.absoluteX(absSize / 2)));
	}
	picture.on_cross = function(x,y) {
		let absX = x - canvasGrid.absoluteX(picture.data.x), absY = y - canvasGrid.absoluteY(picture.data.y);
		let absSize = canvasGrid.absoluteX(IMAGE_WIDTH);
		(absX >= absSize/2 && absX <= 3*absSize/2) && (absY >= -3*absSize/2 && absY <= -absSize/2);
	}

	picture.onDrag = function() {
		picture.dragPosition = {
			x: picture.data.x - mouse_position.x,
			y: picture.data.y - mouse_position.y
		}
	}
	picture.onClick = function() {
		/*if (picture.on_cross(x,y)){
			//picture.del();
		}*/

		if ($('body').attr('id') == 'edition' && !picture.parametersOpened) {
			picture.showParameters();
		}

	}
	picture.dragEdit = function(x, y) {
		if ($('body').attr('id') == 'edition') {
			this.data.x = x + this.dragPosition.x;
			this.data.y = y + this.dragPosition.y;
			grid.redraw();
		}
	}

	// Affiche la fenêtre des paramètres de l'élément
	picture.showParameters = function() {
		let imageID = grid.images.indexOf(picture);
		picture.parametersOpened = true;

		$.ajax({
			url: '/parametres',
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
				window.find('.parametres input').on('change', function() {
					parameter = $(this).parent().attr('id');
					picture.data[parameter] = parseInt($(this).attr('value'));
				})
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
	instance.mouseDown = false;
	instance.isDragged = false;

	instance.onMouseDown = function(e) {
		let relX = canvasGrid.relativeX(e.offsetX), relY = canvasGrid.relativeY(e.offsetY);
		if (instance.inside()) {
			if (instance.hasOwnProperty('onDrag')) {
				instance.onDrag();
			}
			instance.mouseDown = true;
		}
	}
	instance.onMouseMove = function(e) {
		let relX = canvasGrid.relativeX(e.offsetX), relY = canvasGrid.relativeY(e.offsetY);
		if (instance.inside() && !instance.mouseDown) {
			instance.isHovered = true;

			if (instance.hasOwnProperty('hover')) {
				instance.draw = instance.hover;
				grid.draw();
			}
		}
		else if (instance.mouseDown && instance.hasOwnProperty('dragEdit')) {
			instance.dragEdit(relX, relY);
			instance.isDragged = true;
		}
		else if (!instance.inside(relX, relY) && instance.isHovered) {
			instance.isHovered = false;

			if (instance.draw != instance.default) {
				instance.draw = instance.default;
				grid.draw();
			}
		}
	}
	instance.onMouseUp = function(e) {
		if (instance.mouseDown && !instance.isDragged && instance.hasOwnProperty('onClick')) {
			instance.onClick();
		}
		instance.mouseDown = false;
		instance.isDragged = false;
	}
}

var projection = function(point, line) {
	let bus1 = grid.bus[line.data.bus1], bus2 = grid.bus[line.data.bus2];
	let vecLine = {
		x: canvasGrid.absoluteX(bus2.data.x - bus1.data.x),
		y: canvasGrid.absoluteY(bus2.data.y - bus1.data.y)
	}
	let norm = Math.sqrt(Math.pow(vecLine.x, 2) + Math.pow(vecLine.y, 2));
	vecLine.x /= norm;
	vecLine.y /= norm;

	return {
		x: (canvasGrid.absoluteX(point.x - bus1.data.x) * vecLine.x + canvasGrid.absoluteY(point.y - bus1.data.y) * vecLine.y) / norm,
		y: Math.abs(canvasGrid.absoluteX(point.x - bus1.data.x) * vecLine.y - canvasGrid.absoluteY(point.y - bus1.data.y) * vecLine.x)
	}
}