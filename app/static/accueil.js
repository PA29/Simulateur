$(document).ready(function() {
    $(".dropButton").on("click", function () {
        $(this).siblings('.dropChoices').toggleClass('show');
    })

    $(".creer").on("click", function() {
    	document.location.href = '/creer';
    });

    $(".choix").on("click", function() {
    	document.location.href = '/charger/' + $(this).attr('id');
    });
})