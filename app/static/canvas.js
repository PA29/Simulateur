/*
Ce fichier implémente la classe Canvas, utilisée dans les fichiers reseau.js et chart.js
La classe contient des méthodes pour dessiner l'ensemble du contenu graphique nécéssaire (pour l'instant surtout pour reseau.js)
*/

var images = {};

function Canvas(id) {
	this.canvas = document.getElementById(id); //Le canvas, comme objet HTML, récupéré par son identifiant
	this.ctx = this.canvas.getContext('2d'); //Le contexte associé au canvas. Nécéssaire pour dessiner sur le canvas

	this.drawPoint = function(position, size, color = 'black') {
		//Dessine un point à la position définie (en %) et de rayon size (en px)

		this.ctx.beginPath();
		this.ctx.arc(this.absoluteX(position.x), this.absoluteY(position.y), size, 0, 2 * Math.PI);
		this.ctx.fillStyle = color;
		this.ctx.fill();
	}

	this.drawStroke = function(position1, position2, color = 'black') {
		//Dessine un trait entre la position1 (en %) et la position2 (en %)

		this.ctx.beginPath();
		this.ctx.moveTo(this.absoluteX(position1.x), this.absoluteY(position1.y));
		this.ctx.lineTo(this.absoluteX(position2.x), this.absoluteY(position2.y));
		this.ctx.fillStyle = color;
		this.ctx.stroke();
	}

	this.drawRoundedSquare = function(position, size, radius, color) {
		let absPosition = {x: this.absoluteX(position.x), y: this.absoluteY(position.y)}
		let absSize = this.absoluteX(size);
		let absRadius = this.absoluteX(radius);

		this.ctx.beginPath();
		this.ctx.moveTo(absPosition.x - absSize / 2 + absRadius, absPosition.y - absSize / 2);

		this.ctx.lineTo(absPosition.x + absSize / 2 - absRadius, absPosition.y - absSize / 2);
		this.ctx.arc(absPosition.x + absSize / 2 - absRadius, absPosition.y - absSize / 2 + absRadius, absRadius, Math.PI * 3 / 2, 0);
		
		this.ctx.lineTo(absPosition.x + absSize / 2, absPosition.y + absSize / 2 - absRadius);
		this.ctx.arc(absPosition.x + absSize / 2 - absRadius, absPosition.y + absSize / 2 - absRadius, absRadius, 0, Math.PI / 2);
		
		this.ctx.lineTo(absPosition.x - absSize / 2 + absRadius, absPosition.y + absSize / 2);
		this.ctx.arc(absPosition.x - absSize / 2 + absRadius, absPosition.y + absSize / 2 - absRadius, absRadius, Math.PI / 2, Math.PI);
		
		this.ctx.lineTo(absPosition.x - absSize / 2, absPosition.y - absSize / 2 + absRadius);
		this.ctx.arc(absPosition.x - absSize / 2 + absRadius, absPosition.y - absSize / 2 + absRadius, absRadius, Math.PI, Math.PI * 3 / 2);
		
		this.ctx.fillStyle = color;
		this.ctx.fill();
	}

	this.drawImage = function(imageName, position, size) {
		/*Dessine l'image de nom 'imageName' centrée en une certaine position (en %)
		La fonction utilise la variable 'images' pour stocker les images chargées.
		Lorsqu'une image a déjà été utilisée, elle est récupérée à partir de la variable 'images'
		Cela évite de recharger plusieurs fois la même image*/
		let instance = this; //Permet de stocker l'instance de Canvas. La variable this change de valeur avec 'im.onload'

		let doDraw = function(pre, position, size) {
			let absPosition = {
				x: instance.absoluteX(position.x),
				y: instance.absoluteY(position.y)
			}, absSize = new Object();

			if (!isNaN(size)) {
				absSize.x = size / 100 * instance.canvas.width;
				absSize.y = absSize.x * pre.height / pre.width;
			}
			else {
				absSize.x = instance.absoluteX(size.x);
				absSize.y = instance.absoluteY(size.y);
			}

			if (!position.hasOwnProperty('corner') || !position.corner) {
				absPosition.x = instance.absoluteX(position.x) - absSize.x / 2;
				absPosition.y = instance.absoluteY(position.y) - absSize.y / 2;
			}
			
			instance.ctx.drawImage(pre, absPosition.x, absPosition.y, absSize.x, absSize.y);
		}


		if (!images.hasOwnProperty(imageName)) { // Si l'image n'est pas stockée dans 'images' (= si elle n'a pas déjà été chargée)
			let im = new Image();
			im.onload = function() { // Quand l'image est chargée
				pre = document.createElement('canvas'); // Sorte de sous-canvas permettant de pré-rendre l'image (gain en performances)
				pre.width = im.width;
				pre.height = im.height;
				preCtx = pre.getContext('2d');
				preCtx.drawImage(im, 0, 0); // L'image est rendue sur le sous-canvas

				// On stocke le sous-canvas si l'image doit être ré-utilisée
				images[imageName] = pre;

				// On affiche le sous-canvas sur le canvas visible à l'écran
				//instance.ctx.drawImage(pre, instance.absoluteX(position.x) - size.x * instance.canvas.width / 2, instance.absoluteY(position.y) - size / 2, size, size);
				doDraw(pre, position, size);
			}
			im.src = '/static/' + imageName + '.png'; //L'url de l'image est fourni (le chargement de l'image commence dès que cette ligne est executée)
		}
		else { // Si l'image avait déjà été chargée, on réutilise le sous-canvas (on ne recharge pas l'image)
			let pre = images[imageName]
			//this.ctx.drawImage(pre, this.absoluteX(position.x) - size / 2, this.absoluteY(position.y) - size / 2, size, size);
			doDraw(pre, position, size);
		}
	}

	// Conversion entre position relative (en %) et position absolue (en px)
	this.absoluteX = function(x) {
		return x / 100 * this.canvas.width;
	}

	this.absoluteY = function(y) {
		return y / 100 * this.canvas.height;
	}
}