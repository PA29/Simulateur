function resultatsJS() {
	$('#edit').on('click', function() {
		direct('edition');
	});

	$('.time').on("input", function() {
        $('.time').val($(this).val());
    });

    $('.addJauge .button').on('click', function() {
    	let busID = $(this).parents('.addJauge').attr('busid');
    	let variable = $(this).attr('id');
    	reseau.bus[busID].showJauge(variable);
    })
}