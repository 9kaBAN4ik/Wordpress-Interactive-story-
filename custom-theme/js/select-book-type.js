document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('select-book-type-form');
    const continueButton = document.getElementById('continue-button');
    const radioButtons = form.querySelectorAll('input[name="book_type"]');

    radioButtons.forEach(button => {
        button.addEventListener('change', function() {
            continueButton.disabled = false;
        });
    });
});
