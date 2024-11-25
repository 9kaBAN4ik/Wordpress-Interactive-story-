document.addEventListener('DOMContentLoaded', () => {
    const storyId = new URLSearchParams(window.location.search).get('storyId');
    if (storyId) {
        loadStory(storyId);
    }

    document.getElementById('save-story-btn').addEventListener('click', saveStory);
    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        window.location.href = '/admin/stories'; // Переход к списку сюжетов
    });
});

function loadStory(storyId) {
    fetch(`/api/stories/${storyId}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('story-id').value = data.id;
            document.getElementById('story-title').value = data.title;
            populateParagraphs(data.paragraphs);
        })
        .catch(error => console.error('Error loading story:', error));
}

function populateParagraphs(paragraphs) {
    const container = document.getElementById('story-paragraphs');
    container.innerHTML = ''; // Очистить контейнер
    paragraphs.forEach((paragraph, index) => {
        const paragraphHtml = `
            <div class="story-paragraph" data-index="${index}">
                <h4>Параграф ${index + 1}</h4>
                <div class="form-group">
                    <label for="paragraph-title-${index}">Заголовок:</label>
                    <input type="text" id="paragraph-title-${index}" name="paragraphs[${index}][title]" class="form-control" value="${paragraph.title}">
                </div>
                <div class="form-group">
                    <label for="paragraph-text-${index}">Текст:</label>
                    <textarea id="paragraph-text-${index}" name="paragraphs[${index}][text]" class="form-control">${paragraph.text}</textarea>
                </div>
                <!-- Дополнительно: автоизменения и другие элементы -->
                <button type="button" class="btn btn-danger remove-paragraph-btn">Удалить параграф</button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', paragraphHtml);
    });

    // Добавить обработчики для кнопок "Удалить параграф"
    container.querySelectorAll('.remove-paragraph-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.closest('.story-paragraph').dataset.index;
            removeParagraph(index);
        });
    });
}

function saveStory() {
    const storyId = document.getElementById('story-id').value;
    const title = document.getElementById('story-title').value;
    const paragraphs = Array.from(document.querySelectorAll('.story-paragraph')).map(paragraph => {
        return {
            title: paragraph.querySelector('input[name^="paragraphs"][name$="[title]"]').value,
            text: paragraph.querySelector('textarea[name^="paragraphs"][name$="[text]"]').value,
        };
    });

    fetch(`/api/stories/${storyId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, paragraphs }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Сюжет сохранен.');
            window.location.href = '/admin/stories'; // Переход к списку сюжетов
        } else {
            alert('Ошибка сохранения сюжета.');
        }
    })
    .catch(error => console.error('Error saving story:', error));
}

function removeParagraph(index) {
    document.querySelector(`.story-paragraph[data-index="${index}"]`).remove();
}
