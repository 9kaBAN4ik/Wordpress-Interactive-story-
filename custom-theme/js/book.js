document.addEventListener('DOMContentLoaded', function() {
    // Пример: добавить обработчик событий для формы поиска, если необходимо
    const searchForm = document.querySelector('form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(event) {
            // Можно добавить дополнительную логику перед отправкой формы
            // Например, валидацию или манипуляцию данными

            console.log('Форма поиска отправлена');
        });
    }
});
