function resultatsJS() {
	createEmptyChart()

	$('#edit').on('click', function() {
		grid.stopPowerFlow();
		direct('edition');
	});

	$('.time').on("input", function() {
        $('.time').val($(this).val());
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