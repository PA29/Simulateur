var ctx;
var background;
var chart;

var pointSizeBis = 2;
var selectionSizeBis = 1;

function absoluteXBis(x){
    return x / 100 * ctx.canvas.width;
}

function absoluteYBis(y) {
	return y / 100 * ctx.canvas.height;
}

function drawPointBis(position, size) {
	ctx.beginPath();
	ctx.arc(absoluteX(position.x), absoluteY(position.y), size, 0, 2 * Math.PI);
	ctx.fill();
}

function drawStrokeBis(position1, position2) {
	ctx.beginPath();
	ctx.moveTo(absoluteX(position1.x), absoluteY(position1.y));
	ctx.lineTo(absoluteX(position2.x), absoluteY(position2.y));
	ctx.stroke();
}

function drawImageBis(imageName) {
	if (!images.hasOwnProperty(imageName)) {
		let im = new Image();
		im.onload = function() {
			pre = document.createElement('canvas');
			pre.width = im.width;
			pre.height = im.height;
			preCtx = pre.getContext('2d');
			preCtx.drawImage(im, 0, 0);

			imageName = pre;

			ctx.drawImage(pre, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
		}
		im.src = '/static/' + imageName + '.png';
	}
	else {
		let pre = images[imageName]
		ctx.drawImage(pre, absoluteX(position.x) - IMAGE_WIDTH / 2, absoluteY(position.y) - IMAGE_HEIGHT / 2, IMAGE_WIDTH, IMAGE_HEIGHT);
	}
}

function background_chart(back_chart) {
	let picture = new Element(back_chart);
	console.log("hello")
    picture.draw = function() {
        drawImage(back_chart)
    }
}