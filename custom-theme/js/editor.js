document.addEventListener('DOMContentLoaded', function () {
    const editorContent = document.getElementById('editor-content');
    const boldBtn = document.getElementById('bold-btn');
    const italicBtn = document.getElementById('italic-btn');
    const underlineBtn = document.getElementById('underline-btn');
    const addImageBtn = document.getElementById('add-image-btn');
    const saveBtn = document.getElementById('save-btn');

    // Форматирование текста
    boldBtn.addEventListener('click', () => {
        document.execCommand('bold');
    });

    italicBtn.addEventListener('click', () => {
        document.execCommand('italic');
    });

    underlineBtn.addEventListener('click', () => {
        document.execCommand('underline');
    });

    // Вставка изображения
    addImageBtn.addEventListener('click', () => {
        const imageUrl = prompt('Введите URL изображения:');
        if (imageUrl) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.maxWidth = '100%';
            editorContent.appendChild(img);
        }
    });

    // Сохранение контента
    saveBtn.addEventListener('click', () => {
        const content = editorContent.innerHTML;
        alert('Сохранено: ' + content);
        // Здесь можно отправить данные на сервер через AJAX
    });
});
