function resultatsJS() {
	$('#edit').on('click', function() {
		console.log("test");
		direct('edition');
	});

	$('.time').on("input", function() {
        $('.time').val($(this).val());
    });
}