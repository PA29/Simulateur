function resultatsJS() {
	console.log("résultats ok")
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
		console.log(grid.number_chart)
		/*createChart(busID,variableID,number_chart);*/
	});
}