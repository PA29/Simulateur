var images = {};

function Canvas(id) {
	this.canvas = document.getElementById(id);
	this.ctx = this.canvas.getContext('2d');

	this.drawPoint = function(position, size) {
		this.ctx.beginPath();
		this.ctx.arc(this.absoluteX(position.x), this.absoluteY(position.y), size, 0, 2 * Math.PI);
		this.ctx.fill();
	}

	this.drawStroke = function(position1, position2) {
		this.ctx.beginPath();
		this.ctx.moveTo(this.absoluteX(position1.x), this.absoluteY(position1.y));
		this.ctx.lineTo(this.absoluteX(position2.x), this.absoluteY(position2.y));
		this.ctx.stroke();
	}

	this.drawImage = function(imageName, position) {
		let imSize = Math.min(this.absoluteX(IMAGE_WIDTH), this.absoluteY(IMAGE_HEIGHT))

		if (!images.hasOwnProperty(imageName)) { // Si l'image n'est pas stocké dans 'images' (= si elle n'a oas déjà été chargée)
			let obj = this;
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
				obj.ctx.drawImage(pre, obj.absoluteX(position.x) - imSize / 2, obj.absoluteY(position.y) - imSize / 2, imSize, imSize);
			}
			im.src = '/static/' + imageName + '.png';
		}
		else { // Si l'image avait déjà été chargée, on réutilise le sous-canvas (on ne recharge pas l'image)
			let pre = images[imageName]
			this.ctx.drawImage(pre, this.absoluteX(position.x) - imSize / 2, this.absoluteY(position.y) - imSize / 2, imSize, imSize);
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