/*
Ce fichier gère le réseau affiché dans les deux modes : edition / résultats
*/

var testDebug;

var grid; //Variable stockant les données du réseau
var canvasGrid; //Variable stockant le canvas du réseau

var GRID_CENTER_X = 50, GRID_CENTER_Y = 50;
var GRID_LIMIT_MIN_X = -10, GRID_LIMIT_MAX_X = 110;
var GRID_LIMIT_MIN_Y = -10, GRID_LIMIT_MAX_Y = 110;

var pointSize = 3; //Rayon d'un bus (point)
var WIDTH_LINE = 1;
var selectionSize = 3; //Distance supplémentaire fictive pour faciliter la sélection

var IMAGE_WIDTH = 8; //% de la taille par rapport à la largeur
var CROSS_WIDTH = IMAGE_WIDTH / 2;
var POSITION_CROSS_X = 50, POSITION_CROSS_Y = -50;

var ANGLE_LIMIT_JAUGE = 120;

var LIMIT_SIDE_WINDOW_X = 75, LIMIT_SIDE_WINDOW_Y = 75;

var SHADOW_COLOR = 'lightgrey';

var ANIMATION_DISTANCE = 4;
var ANIMATION_DURATION = 2000;

var WIDTH_PARAMETRES = 20;
var WIDTH_JAUGE = 10;
var WIDTH_VARIABLES = 20;

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

	this.position = {x: GRID_CENTER_X, y: GRID_CENTER_Y};
	this.zoom = 1;

	this.draganddrop = false;
	this.addchart = false;
	this.newPicture = {type: '', x: '' , y: ''};

	this.statusPowerFlow = false;

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
		}, grid.lines, grid.bus, grid.images);

		if (instance.statusPowerFlow) {
			instance.lines.forEach(function(elmt) {
				resultats = JSON.parse(grid.simulation)['results'];
				let intensity = resultats['I'][2][instance.lines.indexOf(elmt)][2]; //[indice_heure][ligne][intensité de la ligne]				console.log(intensity)
				elmt.drawFlow(intensity);
			})
		}

		if(grid.draganddrop){
			var position = {x: grid.localX(grid.newPicture.x), y: grid.localY(grid.newPicture.y)};
			canvasGrid.drawStroke(position, mouse_position);
			canvasGrid.drawImage(grid.newPicture.type, position, 8);
		}
	}

	//Créer les interactions entre le canvas et l'utilisateur
	this.setInteractions = function() {
		$('#centerArea').on('mousedown', function(e) {
			if (e.button == 0) {
				grid.translating = true;
				e.handled = false;

				instance.forEach(function(elmt) {
					elmt.onMouseDown(e);
					grid.translating = grid.translating && !elmt.mouseDown;
				}, grid.bus, grid.lines, grid.images);

				if (grid.translating) {
					grid.positionTranslation = {
						x: grid.globalX(mouse_position.x),
						y: grid.globalY(mouse_position.y)
					}
				}
			}
		});
		$('#centerArea').on('mousemove', function(e) {
			e.handled = false;
			mouse_position = {x: canvasGrid.relativeX(e.offsetX), y: canvasGrid.relativeY(e.offsetY)}

			if (grid.translating) {
				grid.position.x = grid.positionTranslation.x + (GRID_CENTER_X - mouse_position.x);
				grid.position.x = Math.min(grid.position.x, GRID_LIMIT_MAX_X - GRID_CENTER_X);
				grid.position.x = Math.max(grid.position.x, GRID_LIMIT_MIN_X + GRID_CENTER_X);

				grid.position.y = grid.positionTranslation.y + (GRID_CENTER_X - mouse_position.y);
				grid.position.y = Math.min(grid.position.y, GRID_LIMIT_MAX_Y - GRID_CENTER_Y);
				grid.position.y = Math.max(grid.position.y, GRID_LIMIT_MIN_Y + GRID_CENTER_Y);
				grid.draw();
			}
			else {
				instance.forEach(function(elmt) {
					elmt.onMouseMove(e);
				}, grid.images, grid.bus, grid.lines);

				if (grid.draganddrop){
					grid.draw();
				};
			}
		});
		$('#centerArea').on('mouseup', function(e) {
			if (e.button == 0) {
				instance.forEach(function(elmt) {
					elmt.onMouseUp(e);
				}, grid.bus, grid.lines, grid.images);
				grid.translating = false;
			}
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
	this.forEach = function(f, arr1, arr2 = undefined, arr3 = undefined) {
		let status = false;
		for (let elmt of arr1) {
			status = status || f(elmt);
		}
		if (arr2 != undefined) {
			for (let elmt of arr2) {
				status = status || f(elmt);
			}
		}
		if (arr3 != undefined) {
			for (let elmt of arr3) {
				status = status || f(elmt);
			}
		}
	}

	this.localX = function(gX) {
		return (gX - this.position.x) * this.zoom + GRID_CENTER_X;
	}
	this.globalX = function(rX) {
		return (rX - GRID_CENTER_X) / this.zoom + this.position.x;
	}

	this.localY = function(gY) {
		return (gY - this.position.y) * this.zoom + GRID_CENTER_Y;
	}
	this.globalY = function(rY) {
		return (rY - GRID_CENTER_Y) / this.zoom + this.position.y;
	}
}

// Classe définissant un bus
function Bus(data) {

	let bus = new Element(data);
	bus.arrowPos = 0;

	// Affichage par défaut
	bus.default = function() {
		let pos = {x: grid.localX(data.x), y: grid.localY(data.y)}
		if (grid.draganddrop && (!bus.data.hasOwnProperty("attached") || !bus.data.attached)) {
			canvasGrid.drawPoint(pos, pointSize + selectionSize, "blue");
		}
		canvasGrid.drawPoint(pos, pointSize);
	}

	// Affichage lors du survol
	bus.hover = function() {
		canvasGrid.drawPoint({
			x: grid.localX(data.x),
			y: grid.localY(data.y)
		}, pointSize + selectionSize);
	}
	bus.draw = bus.default; // Variable stockant le type d'affichage

	// Indique si les coordonnées sont dans la zone de sélection de l'élément
	bus.inside = function() {
		let d = Math.pow(canvasGrid.absoluteX(grid.globalX(mouse_position.x) - data.x), 2);
		d += Math.pow(canvasGrid.absoluteY(grid.globalY(mouse_position.y) - data.y), 2);
		return d < Math.pow(pointSize + selectionSize, 2);
	}
	bus.onHover = function() {
		mouse_position.x = grid.localX(bus.data.x);
		mouse_position.y = grid.localY(bus.data.y);
	}
	bus.onClick = function() {
		if (($('body').attr('id') == 'edition') && grid.draganddrop && (!bus.data.hasOwnProperty("attached") || !bus.data.attached)) {
			let busIndex = grid.bus.indexOf(bus);
			bus.data.attached = true;
			picture = new Picture({
				bus: busIndex,
				type: grid.newPicture.type,
				x: grid.newPicture.x,
				y: grid.newPicture.y,
				noParameter: true
			})
			grid.images.push(picture);
			grid.draganddrop = false;
			grid.draw()

			mouse_position.x = picture.data.x;
			mouse_position.y = picture.data.y;
			picture.onClick()
		}
		if ($('body').attr('id') == 'resultats') {
			if (grid.addchart) {
				bus.selectVariable(function(variable) {
					console.log(grid.bus.indexOf(bus) + "; " + variable);
					createChart(grid.bus.indexOf(bus), variable, grid.number_chart);
				});
				grid.addchart = false;
			}
			else {
				bus.selectVariable(function(variable) {
					bus.displayJauge(variable);
				});
			}
		}
	}

	// Affiche la fenêtre d'ajout d'un jauge (est appelée lors du click dans le mode résultats)
	bus.selectVariable = function(f) {
		if (!bus.data.hasOwnProperty("hasSelectVariable") || !bus.data.hasSelectVariable) {
			$.ajax({
				url: '/selectVariable',
				type: 'POST',
				data: JSON.stringify({
					x: data.x + 1, //TEMPORAIRE// Position de la fenêtre en x
					y: data.y - 1, //TEMPORAIRE// Position de la fenêtre en y
					busID: grid.bus.indexOf(this),
					width: WIDTH_VARIABLES
				}),
				contentType: 'application/json',
				success: function(data) {
					// Ajout du html à la zone centrale
					$('#centerArea .panel.resultats').append(data);

					$('.window .close').on('click', function() {
						$(this).parents('.window').remove();
						bus.hasAddJauge = false;
					});

					// Ajout de l'interaction avec les boutons
					$('.addJauge .button').on('click', function() {
		    			let busID = $(this).parents('.addJauge').attr('busid');
		    			let variable = $(this).attr('id');

		    			f(variable);
		    			$(this).parents('.window').remove();
		    		});
				}
			});

			bus.hasSelectVariable = true;
		}
	}
	bus.displayJauge = function(variable) {
		$.ajax({
			url: '/jauge',
			type: 'POST',
			data: JSON.stringify({
				x: data.x + 1, //TEMPORAIRE// Position de la fenêtre en x
				y: data.y - 1, //TEMPORAIRE// Position de la fenêtre en y
				busID: grid.bus.indexOf(bus),
				variable: variable,
				width: WIDTH_JAUGE
			}),
			contentType: 'application/json',
			success: function(data) {
				// Ajout du html à la zone centrale
				$('#centerArea .panel.resultats').append(data);
				$('.time').trigger('input');

				/*$('.window .close').on('click', function() {
					$(this).parents('.window').remove();
					bus.hasAddJauge = false;
				});

				if (grid.addchart) {
					$('.selectVariable .button').on('click', function() {
						testDebug = $(this);
						console.log($(this).parents(".selectVariable"));
						var busID = $(this).parents('.selectVariable').attr('busid');
						var variableID = $(this).attr('id');
						console.log(grid.number_chart);
						createChart(busID,variableID,grid.number_chart);
					});
				}
				else {
					// Ajout de l'interaction avec les boutons
					$('.selectVariable .button').on('click', function() {
						let busID = $(this).parents('.selectVariable').attr('busid');
						let variable = $(this).attr('id');

						//Affichage de la Jauge et suppression de la fenêtre d'ajout d'une jauge
						grid.bus[busID].showJauge(variable);
						$(this).parents('.window').remove();
					});
				}*/
			}
		});
	}

	return bus;
}

// Classe définissant une ligne
function Line(data) {
	let line = new Element(data);

	line.default = function() {
		let bus1 = grid.bus[data.bus1], bus2 = grid.bus[data.bus2];
		let pos1 = {x: grid.localX(bus1.data.x), y: grid.localY(bus1.data.y)}
		let pos2 = {x: grid.localX(bus2.data.x), y: grid.localY(bus2.data.y)}

		if (line.data.aerien) {
			canvasGrid.drawStroke(pos1, pos2, 'blue');
		}
		else {
			canvasGrid.drawStroke(pos1, pos2, 'green');
		}
	}
	line.hover = function() {
		let bus1 = grid.bus[data.bus1], bus2 = grid.bus[data.bus2];
		let pos1 = {x: grid.localX(bus1.data.x), y: grid.localY(bus1.data.y)}
		let pos2 = {x: grid.localX(bus2.data.x), y: grid.localY(bus2.data.y)}

		canvasGrid.drawStroke(pos1, pos2, 'lightgrey', WIDTH_LINE + 2 * selectionSize);
		line.default();

		if (grid.draganddrop) {
			canvasGrid.drawPoint(mouse_position, pointSize + selectionSize, 'grey');
		}
	}
	line.draw = line.default;

	line.inside = function() {
		let bus1 = grid.bus[line.data.bus1], bus2 = grid.bus[line.data.bus2];
		let proj = projection(line);
		return (proj.x > 0 && proj.x < 1 && proj.y < pointSize + selectionSize && !bus1.inside() && !bus2.inside())
	}
	line.onHover = function() {
		if (grid.draganddrop) {
			let bus1 = grid.bus[line.data.bus1], bus2 = grid.bus[line.data.bus2];
			let proj = projection(line);
			mouse_position.x = grid.localX(bus1.data.x * (1 - proj.x) + bus2.data.x * proj.x);
			mouse_position.y = grid.localY(bus1.data.y * (1 - proj.x) + bus2.data.y * proj.x);
		}
	}
	line.onClick = function() {
		if (grid.draganddrop) {
			let bus1 = grid.bus[line.data.bus1], bus2 = grid.bus[line.data.bus2];
			let dMouse = Math.pow(grid.globalX(mouse_position.x) - bus1.data.x, 2) + Math.pow(grid.globalY(mouse_position.y) - bus1.data.y, 2);
			let dLigne = Math.pow(bus2.data.x - bus1.data.x, 2) + Math.pow(bus2.data.y - bus1.data.y, 2);
			let alpha =  Math.sqrt(dMouse / dLigne);

			let bus = new Bus({
				x: grid.globalX(mouse_position.x),
				y: grid.globalY(mouse_position.y),
				added: true
			});
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

			grid.bus[grid.bus.length - 1].onClick();
		}
	}
	line.drawFlow = function(intensity) {
		grid.bus[line.data.bus2].arrowPos = (grid.bus[line.data.bus1].arrowPos + ((intensity >= 0) ? line.data.length : -line.data.length)) % ANIMATION_DISTANCE;
		let startBus = (intensity >= 0) ? grid.bus[line.data.bus1] : grid.bus[line.data.bus2];
		let endBus = (intensity >= 0) ? grid.bus[line.data.bus2] : grid.bus[line.data.bus1];
		for (let d = (ANIMATION_DISTANCE - startBus.arrowPos) % ANIMATION_DISTANCE; d < line.data.length; d += ANIMATION_DISTANCE) {
			
			let a = d / line.data.length;
			canvasGrid.drawPoint({
				x: grid.localX(startBus.data.x * (1 - a) + endBus.data.x * a),
				y: grid.localY(startBus.data.y * (1 - a) + endBus.data.y * a)
			}, Math.sqrt(Math.abs(intensity)));
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
		let bus = grid.bus[data.bus];
		let ptPicture = {x: grid.localX(data.x), y: grid.localY(data.y)}
		let ptBus = {x: grid.localX(bus.data.x), y: grid.localY(bus.data.y)}
		canvasGrid.drawStroke(ptPicture, ptBus, 'black');

		if (picture.data.hasOwnProperty('noParameter') && picture.data.noParameter) {
			canvasGrid.drawRoundedSquare(ptPicture, IMAGE_WIDTH, IMAGE_WIDTH / 10, 'pink');
		}
		else {
			canvasGrid.drawRoundedSquare(ptPicture, IMAGE_WIDTH, IMAGE_WIDTH / 10, 'white');
		}
		canvasGrid.drawImage(data.type + '_withoutBG', ptPicture, IMAGE_WIDTH);
	}
	picture.hover = function() {
		let bus = grid.bus[data.bus];
		let ptPicture = {x: grid.localX(data.x), y: grid.localY(data.y)}
		let ptBus = {x: grid.localX(bus.data.x), y: grid.localY(bus.data.y)}
		canvasGrid.drawStroke(ptPicture, ptBus, 'black');

		if (picture.data.hasOwnProperty('noParameter') && picture.data.noParameter) {
			canvasGrid.drawRoundedSquare(ptPicture, IMAGE_WIDTH, IMAGE_WIDTH / 10, 'red');
		}
		else {
			canvasGrid.drawRoundedSquare(ptPicture, IMAGE_WIDTH, IMAGE_WIDTH / 10, 'lightgrey');
		}
		canvasGrid.drawImage(data.type + '_withoutBG', ptPicture, IMAGE_WIDTH);

		let posCross = {
			x: grid.localX(picture.data.x) + POSITION_CROSS_X/100 * IMAGE_WIDTH,
			y: grid.localY(picture.data.y) + POSITION_CROSS_Y/100 * canvasGrid.relativeY(canvasGrid.absoluteX(IMAGE_WIDTH))
		}
		if (picture.insideCross()) {
			canvasGrid.drawRoundedSquare(posCross, CROSS_WIDTH, CROSS_WIDTH / 10, 'grey');
		}
		canvasGrid.drawImage('croix', posCross, CROSS_WIDTH);
	}
	
	picture.del = function() {
		let line_before, line_after;

		console.log(grid.images);

		let idBus = picture.data.bus
		if (grid.bus[idBus].data.added) {
			for (let line of grid.lines) {

				if (idBus == line.data.bus1) {
					line_after = line;
				}
				else if (idBus == line.data.bus2) {
					line_before = line;
				}
			}

			let new_line=new Line({
				bus1: line_before.data.bus1,
				bus2: line_after.data.bus2,
				length: line_before.data.length + line_after.data.length
			});
			grid.lines.push(new_line);

			grid.lines.splice(grid.lines.indexOf(line_before), 1);
			grid.lines.splice(grid.lines.indexOf(line_after), 1);

			grid.bus.splice(idBus, 1);
		}
		else {
			grid.bus[idBus].data.attached = false;
		}

		console.log(grid.images);
		grid.images.splice(grid.images.indexOf(picture), 1);
		console.log(grid.images);

		grid.draw();
	}
	
	picture.draw = picture.default;

	picture.inside = function() {
		let relX = grid.globalX(mouse_position.x) - picture.data.x, relY = grid.globalY(mouse_position.y) - picture.data.y;
		let absSize = IMAGE_WIDTH;
		let insideElmt = ((Math.abs(relX) <= absSize / 2) && (canvasGrid.absoluteY(Math.abs(relY)) <= canvasGrid.absoluteX(absSize / 2)));
		return insideElmt || (picture.isHovered && picture.insideCross());
	}
	picture.insideCross = function() {
		let absSizeIm = canvasGrid.absoluteX(IMAGE_WIDTH);
		let posCross = {
			x: canvasGrid.absoluteX(picture.data.x) + POSITION_CROSS_X/100 * absSizeIm,
			y: canvasGrid.absoluteY(picture.data.y) + POSITION_CROSS_Y/100 * absSizeIm
		}
		let absPos = {
			x: canvasGrid.absoluteX(mouse_position.x) - posCross.x,
			y: canvasGrid.absoluteY(mouse_position.y) - posCross.y
		}
		let absSizeCross = canvasGrid.absoluteX(CROSS_WIDTH);
		return (Math.abs(absPos.x) <= absSizeCross / 2 && Math.abs(absPos.y) <= absSizeCross / 2)
	}

	picture.onDrag = function() {
		picture.dragPosition = {
			x: grid.localX(picture.data.x) - mouse_position.x,
			y: grid.localY(picture.data.y) - mouse_position.y
		}
	}
	picture.onClick = function() {
		if (picture.insideCross()) {
			picture.del();
		}
		else if ($('body').attr('id') == 'edition' && !picture.parametersOpened) {
			picture.showParameters();
		}

	}
	picture.dragEdit = function() {
		if ($('body').attr('id') == 'edition') {
			this.data.x = grid.globalX(mouse_position.x) + this.dragPosition.x;
			this.data.y = grid.globalY(mouse_position.y) + this.dragPosition.y;
			grid.redraw();
		}
	}

	// Affiche la fenêtre des paramètres de l'élément
	picture.showParameters = function() {
		let imageID = grid.images.indexOf(picture);
		let pos = {
			x: (data.x < LIMIT_SIDE_WINDOW_X) ? grid.localX(data.x) : grid.localX(data.x - 10),
			y: (data.y < LIMIT_SIDE_WINDOW_Y) ? grid.localY(data.y) : grid.localY(data.y - 10)
		}

		$.ajax({
			url: '/parametres',
			type: 'POST',
			data: JSON.stringify({
				x: pos.x,
				y: pos.y,
				imageID: imageID,
				data: picture.data,
				width: WIDTH_PARAMETRES
			}),
			contentType: 'application/json',
			success: function(data) {
				$('#centerArea .panel.edition').append(data);

				let window = $('.parametres[imageID="' + imageID + '"]').parents('.window');
				let numberParameters = window.find('.valeurs div').length

				window.find('.close').on('click', function() {
					window.remove();
					picture.parametersOpened = false;
				});
				window.find('.parametres input').on('change', function() {
					parameter = $(this).parent().attr('id');
					picture.data[parameter] = parseInt($(this).attr('value'));

					if (picture.data.noParameter && window.find('input:checked').length == numberParameters) {
						picture.data.noParameter = false;
						grid.draw();
					}
				})
			}
		});

		picture.parametersOpened = true;
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
		let gX = grid.globalX(canvasGrid.relativeX(e.offsetX)), gY = grid.globalY(canvasGrid.relativeY(e.offsetY));
		if (!e.handled && instance.inside()) {
			instance.mouseDown = true;

			if (instance.hasOwnProperty('onDrag')) {
				instance.onDrag();
				e.handled = true;;
			}
		}
	}
	instance.onMouseMove = function(e) {
		let gX = grid.globalX(canvasGrid.relativeX(e.offsetX)), gY = grid.localY(canvasGrid.relativeY(e.offsetY));
		if ((e.handled || !instance.inside()) && instance.isHovered) {
			instance.isHovered = false;

			if (instance.draw != instance.default) {
				instance.draw = instance.default;
				grid.draw();
			}
		}
		if (!e.handled && instance.inside() && !instance.mouseDown) {
			instance.isHovered = true;

			if (instance.hasOwnProperty('onHover')) {
				instance.onHover();
				e.handled = true;
			}
			if (instance.hasOwnProperty('hover')) {
				instance.draw = instance.hover;
				grid.draw();
				e.handled = true;
			}
		}
		else if (instance.mouseDown && instance.hasOwnProperty('dragEdit')) {
			instance.dragEdit();
			instance.isDragged = true;
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

var projection = function(line) {
	let bus1 = grid.bus[line.data.bus1], bus2 = grid.bus[line.data.bus2];
	let vecLine = {
		x: canvasGrid.absoluteX(bus2.data.x - bus1.data.x),
		y: canvasGrid.absoluteY(bus2.data.y - bus1.data.y)
	}
	let norm = Math.sqrt(Math.pow(vecLine.x, 2) + Math.pow(vecLine.y, 2));
	vecLine.x /= norm;
	vecLine.y /= norm;

	let vecMouse = {
		x: canvasGrid.absoluteX(grid.globalX(mouse_position.x) - bus1.data.x),
		y: canvasGrid.absoluteY(grid.globalY(mouse_position.y) - bus1.data.y)
	}

	return {
		x: (vecMouse.x * vecLine.x + vecMouse.y * vecLine.y) / norm,
		y: Math.abs(vecMouse.x * vecLine.y - vecMouse.y * vecLine.x)
	}
}