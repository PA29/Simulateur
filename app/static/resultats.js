function resultatsJS() {
	$('#edit').on('click', function() {
		grid.stopPowerFlow();
		direct('edition');
	});

	$('.time').on("input", function() {
        $('.time').val($(this).val());
    });
}