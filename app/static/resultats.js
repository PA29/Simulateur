function resultatsJS() {
	$('#edit').on('click', function() {
		direct('edition');
	});

	$('.time').on("input", function() {
        $('.time').val($(this).val());
    });
}