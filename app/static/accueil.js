$(document).ready(function() {
    $(".dropButton").on("click", function () {
        $(this).siblings('.dropChoices').toggleClass('show');
    })

    $(".creer").on("click", function() {
    	document.location.href = "main";
    })
})