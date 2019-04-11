function resultatsJS() {
	createEmptyChart()

	$('#edit').on('click', function() {
		grid.stopPowerFlow();
		direct('edition');
	});

	$('.time').on("input", function() {
		let time = $(this).val();
        $('.time').val(time);

        let results = JSON.parse(grid.simulation).results;
        $('#centerArea .panel.resultats div.jauge').each(function() {
        	let value = results[$(this).attr('variable')][time][parseInt($(this).attr('busID'))];

        	let max = parseInt($(this).attr('max'));
        	let min = parseInt($(this).attr('min'));
        	let mean = (max + min) / 2;
        	let angle = (value - mean) / (max - mean) * ANGLE_LIMIT_JAUGE;
        	angle = Math.min(ANGLE_LIMIT_JAUGE, Math.max(-ANGLE_LIMIT_JAUGE, angle));

        	$(this).find('.arrow').attr("style", "transform: rotate(" + angle + "deg);")
        });

        for (line of grid.lines) {
			line.intensity = results['I'][time][grid.lines.indexOf(line)][2]; //[indice_heure][ligne][intensité de la ligne]
        }
	});

	$(".addGraph").on('click', function() {
		grid.addchart = true;
		grid.number_chart = $(this).parents(".graph_container").attr("nb");
		/*createChart(busID,variableID,number_chart);*/
	});
}


/*var canevas = document.getElementById("chart_");
	var ctx = canevas.getContext("2d");
	ctx.clearRect(0, 0, 300, 600);*/