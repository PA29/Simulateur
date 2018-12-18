$(document).ready(function() {
    $(".dropButton").on("click", function () {
        $(this).siblings('.dropChoices').toggleClass('show');
    })
})