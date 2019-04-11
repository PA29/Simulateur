$(document).ready(function() {
    $(".dropButton").on("click", function () {
        $(this).siblings('.dropChoices').toggleClass('show');
    })

    $(".creer").on("click", function() {
    	document.location.href = '/creer';
    });

    $(".scenario").on("click", function() {
    	document.location.href = '/charger/' + $(this).attr('id');
    });

    $("#personal").on("click", function() {
    	$("#personalFile").click();
    });

    $("#personalFile").on("change", function() {
    	var file = $(this)[0].files[0];

    	var formData = new FormData();
    	formData.append('save', file, file.name);

    	$.ajax({
			url: '/sendSave',
			type: 'POST',
			data: formData,
			cache: false,
			contentType: false,
			processData: false,
			success: function(data) {
				document.location.href = '/load/' + data.filename;
			}
		});
    })
})