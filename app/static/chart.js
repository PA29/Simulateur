var ctx;
var background;
var canvas = document.querySelector('#chart')
var imgName = "back_chart";
var chart;

var pointSizeBis = 2;
var selectionSizeBis = 1;
var images = {};

function absoluteXBis(x){
    return x / 100 * ctx.canvas.width;
}

function absoluteYBis(y) {
	return y / 100 * ctx.canvas.height;
}

function drawPointChart(position, size) {
	ctx.beginPath();
	ctx.arc(absoluteX(position.x), absoluteY(position.y), size, 0, 2 * Math.PI);
	ctx.fill();
}

function drawStrokeChart(position1, position2) {
	ctx.beginPath();
	ctx.moveTo(absoluteX(position1.x), absoluteY(position1.y));
	ctx.lineTo(absoluteX(position2.x), absoluteY(position2.y));
	ctx.stroke();
}

function drawImageChart(imageName) {
	console.log(images)
	console.log(imageName)
	if (!images.hasOwnProperty(imageName)) {
		let im = new Image();
		
		im.onload = function() {
			pre = document.createElement('canvas');
			pre.width = im.width;
			pre.height = im.height;
			preCtx = pre.getContext('2d');
			preCtx.drawImage(im, 0, 0);
			console.log("helloif")
			imageName = pre;
			console.log(imageName)

			ctx.drawImage(pre, 0, 0, 1000, 2000);
		}
		im.src = '/static/' + imageName + '.png';
	}
	else {
		console.log("Helloelse");
		let pre = images[imageName];
		ctx.drawImage(pre, absoluteX(position.x) - IMAGE_WIDTH / 2, absoluteY(position.y) - IMAGE_HEIGHT / 2, IMAGE_WIDTH, IMAGE_HEIGHT);
	}
}

function background_chart() {
	let picture = new Element();
	console.log("hello");
	console.log(imgName)
  picture.draw = function() {
		canvas.drawImageChart(imgName);
		console.log("draw");
    }
}
