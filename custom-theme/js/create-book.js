jQuery(document).ready(function($) {
    const step1 = $('#step-1');
    const step2 = $('#step-2');
    const step3 = $('#step-3');
    const continueButtonStep1 = $('#continue-to-step-2');
    const continueButtonStep2 = $('#continue-to-step-3');
    const saveButton = $('#save-book');
    const form1 = $('#select-book-type-form');
    const bookTypeInput = $('#book-type-input');
    const genreSelect = $('#genre');
    const subgenre1Select = $('#subgenre1');
    const subgenre2Select = $('#subgenre2');
    const coAuthorInput = $('#co-author');
    const coAuthorSuggestions = $('#co-author-suggestions');
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post_id');
    var paragraphIndex = create_book_vars.paragraphIndex;
    var currentParagraphIndex = 0;

    // Локальные данные для поджанров
    const subgenres = {
        'detective': [
            { value: 'historical_detective', text: 'Исторический детектив' },
            { value: 'fantasy_detective', text: 'Фантастический детектив' },
            { value: 'spy_detective', text: 'Шпионский детектив' }
        ],
        'fantasy': [
            { value: 'dark_fantasy', text: 'Темное фэнтези' },
            { value: 'epic_fantasy', text: 'Эпическое фэнтези' },
            { value: 'humorous_fantasy', text: 'Юмористическое фэнтези' },
            { value: 'romantic_fantasy', text: 'Романтическое фэнтези' }
        ],
        'thriller': [
            { value: 'psychological_thriller', text: 'Психологический триллер' },
            { value: 'crime_thriller', text: 'Криминальный триллер' }
        ],
        'horror': [
            { value: 'gothic_horror', text: 'Готический хоррор' },
            { value: 'supernatural_horror', text: 'Сверхъестественный хоррор' }
        ],
        'science_fiction': [
            { value: 'cyberpunk', text: 'Киберпанк' },
            { value: 'space_opera', text: 'Космическая опера' }
        ],
        'romance': [
            { value: 'historical_romance', text: 'Историческая романтика' },
            { value: 'contemporary_romance', text: 'Современная романтика' }
        ],
        'mystery': [] // Мистика не имеет поджанров в этом примере
    };
    

    // Функция для загрузки данных книги, если post_id присутствует
    function loadBookData(postId) {
        if (!postId) {
            console.error('Ошибка: post_id не найден в URL!');
            return;
        }
    
        console.log('Загружаем данные для книги с postId:', postId);
        
        $.ajax({
            url: create_book_vars.ajax_url,
            method: 'POST',
            data: {
                action: 'get_book_data_v2',
                nonce: create_book_vars.nonce,
                post_id: postId
            },
            success: function(response) {
                console.log('Ответ от сервера:', response);
                if (response.success) {
                    const book = response.data.data;
                    console.log('Данные книги:', book);
    
                    if (book) {
                        // Заполняем форму данными книги
                        $('#book-title').val(book.title || '');
                        $('#book-author').val(book.author || '');
                        $('#book-description').val(book.description || '');
                        $('#genre').val(book.genre || '');
                        $('#subgenre1').val(book.subgenre1 || '');
                        $('#subgenre2').val(book.subgenre2 || '');
                        $('#co-author').val(book.coAuthor || '');
                        $('#annotation').val(book.annotation || '');
                        $('#author-note').val(book.authorNote || '');
                        $('#tags').val(book.tags || '');
                        $('#visibility').val(book.visibility || '');
                        $('#download_permission').val(book.downloadPermission || '');
                        $('#comment_permission').val(book.commentPermission || '');
                    }
    
                    if (book.type) {
                        $('#book-type-input').val(book.type);
                    }
    
                    if (book.genre && book.subgenre1 && book.subgenre2) {
                        updateSubgenres(book.genre, book.subgenre1, book.subgenre2);
                    }
    
                    // Обработка абзацев
                    if (book.paragraphs) {
                        if (Array.isArray(book.paragraphs) && book.paragraphs.length > 0) {
                            $('#paragraphs-container').empty();
                            paragraphIndex = book.paragraphs.length;  // Устанавливаем правильный индекс
                            book.paragraphs.forEach(function(paragraph, index) {
                                addParagraphToForm(paragraph, index);
                            });
                        } else {
                            console.log('Абзацы пусты или имеют неверный формат.');
                        }
                    }
                } else {
                    console.error('Ошибка при загрузке данных книги:', response.data.message);
                }
            },
            error: function(error) {
                console.error('Ошибка при запросе данных:', error);
            }
        });
    }
    
    function addParagraphToForm(paragraph, index) {
        // Индекс должен быть числовым, без ведущих нулей
        const paragraphHtml = `
            <div class="paragraph" style="display: none;" data-index="${index}">
                <p><strong>Абзац ${index + 1}:</strong></p>
                <label for="paragraph-title-${index}">Название абзаца:</label>
                <input type="text" id="paragraph-title-${index}" name="paragraphs[${index}][title]" value="${paragraph.title}" required>
                
                <label for="paragraph-content-${index}">Содержание абзаца:</label>
                <textarea id="paragraph-content-${index}" name="paragraphs[${index}][content]" rows="10" required>${paragraph.content}</textarea>
            </div>
        `;
        
        // Добавляем абзац в контейнер
        $('#paragraphs-container').append(paragraphHtml);
        
        // Добавляем кнопку навигации для нового абзаца
        addNavigationButton(index);
        
        // Показать новый абзац и обновить состояние навигации
        currentParagraphIndex = index;
        showParagraph(currentParagraphIndex);
    }   

// Функция для отображения абзаца
function showParagraph(index) {
    $('#paragraphs-container .paragraph').hide();
    $(`#paragraphs-container .paragraph[data-index="${index}"]`).show();
    $('#paragraph-navigation button').removeClass('active');
    $(`#paragraph-button-${index}`).addClass('active');
}

// Функция для добавления кнопки навигации
function addNavigationButton(index) {
    var navButton = `<button type="button" id="paragraph-button-${index}" class="paragraph-nav-button">Абзац ${index + 1}</button>`;
    $('#paragraph-navigation').append(navButton);

    // При клике на кнопку отображаем соответствующий абзац
    $(`#paragraph-button-${index}`).click(function() {
        currentParagraphIndex = index;
        showParagraph(currentParagraphIndex);
    });
}
$('#add-paragraph-button').click(function() {
    // Используем переменную paragraphIndex для корректного индекса
    var newParagraph = `
        <div class="paragraph" style="display: none;" data-index="${paragraphIndex}">
            <p><strong>Абзац ${paragraphIndex + 1}:</strong></p>
            <label for="paragraph-title-${paragraphIndex}">Название абзаца:</label>
            <input type="text" id="paragraph-title-${paragraphIndex}" name="paragraphs[${paragraphIndex}][title]" required>
            
            <label for="paragraph-content-${paragraphIndex}">Содержание абзаца:</label>
            <textarea id="paragraph-content-${paragraphIndex}" name="paragraphs[${paragraphIndex}][content]" rows="10" required></textarea>
        </div>
    `;
    $('#paragraphs-container').append(newParagraph);
    
    // Добавляем кнопку навигации для нового абзаца
    addNavigationButton(paragraphIndex);
    
    // Показать новый абзац и обновить состояние навигации
    currentParagraphIndex = paragraphIndex;
    showParagraph(currentParagraphIndex);

    // Увеличиваем paragraphIndex после добавления абзаца
    paragraphIndex++;
});


// Изначально показываем первый абзац, если он есть
if (paragraphIndex > 0) {
    showParagraph(currentParagraphIndex);
}
    // Если есть post_id, загружаем данные
    if (postId) {
        console.log('Параметр post_id найден, загружаем данные...');
        loadBookData(postId);
        step1.hide();
        step2.show(); // Переход ко второму шагу
    } else {
        console.error('Ошибка: post_id не найден в URL!');
    }

    // Функция проверки обязательных полей на каждом шаге
    function validateStep1() {
        const selectedBookType = form1.find('input[name="book_type"]:checked');
        if (!selectedBookType.length) {
            alert('Пожалуйста, выберите тип книги.');
        }
        return selectedBookType.length !== 0;
    }

    function validateStep2() {
        const bookTitle = $('#book-title').val().trim();
        const bookAuthor = $('#book-author').val().trim();
        const bookDescription = $('#book-description').val().trim();
        const genre = genreSelect.val().trim();

        let isValid = true;
        if (!bookTitle) {
            console.log('Не заполнено поле "Название книги".');
            isValid = false;
        }
        if (!bookAuthor) {
            console.log('Не заполнено поле "Автор книги".');
            isValid = false;
        }
        if (!bookDescription) {
            console.log('Не заполнено поле "Описание книги".');
            isValid = false;
        }
        if (!genre) {
            console.log('Не выбран жанр.');
            isValid = false;
        }

        return isValid;
    }

    function validateStep3() {
        const formData = collectFormData();
        if (!formData.title) {
            console.log('Не заполнено поле "Название".');
        }
        return formData.title !== '';
    }

    // Переключение между шагами
    continueButtonStep1.on('click', function() {
        if (validateStep1()) {
            const selectedBookType = form1.find('input[name="book_type"]:checked').val();
            bookTypeInput.val(selectedBookType);

            console.log('Тип книги установлен в:', bookTypeInput.val());

            // Обновляем URL с параметром типа книги
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('form', selectedBookType);
            newUrl.searchParams.set('step', 'create');
            window.history.pushState({}, '', newUrl);

            step1.hide();
            step2.show();
        }
    });

    continueButtonStep2.on('click', function() {
        if (validateStep2()) {
            // Обновляем URL с параметром на третий шаг
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('step', 'add_paragraphs');
            window.history.pushState({}, '', newUrl);

            step2.hide();
            step3.show();
        } else {
            alert('Пожалуйста, заполните все обязательные поля.');
        }
    });

    saveButton.on('click', function(event) {
        event.preventDefault();  // Предотвращаем стандартное поведение кнопки
        
        if (validateStep3()) {
            const formData = collectFormData(); // Собираем данные формы
            
            // Создание объекта FormData для отправки данных
            const form = new FormData();
            form.append('action', postId ? 'handle_create_book_form' : 'handle_create_book_form'); // Если post_id есть, то обновляем книгу
            form.append('nonce', create_book_vars.nonce);
            
            // Добавляем общие данные
            form.append('book-title', formData.title);
            form.append('book-author', formData.author);
            form.append('book-description', formData.description);
            form.append('book-genre', formData.genre);
            form.append('book-subgenre1', formData.subgenre1);
            form.append('book-subgenre2', formData.subgenre2);
            form.append('book-coAuthor', formData.coAuthor);
            form.append('book-annotation', formData.annotation);
            form.append('book-authorNote', formData.authorNote);
            form.append('book-tags', formData.tags);
            form.append('book-visibility', formData.visibility);
            form.append('book-downloadPermission', formData.downloadPermission);
            form.append('book-commentPermission', formData.commentPermission);
            form.append('book-type', formData.type);
            
            // Добавляем данные абзацев, если они есть
            if (formData.paragraphs && formData.paragraphs.length > 0) {
                formData.paragraphs.forEach((paragraph, index) => {
                    form.append(`paragraphs[${index}][title]`, paragraph.title);
                    form.append(`paragraphs[${index}][content]`, paragraph.content);
                });
            }
            
            if (postId) {
                form.append('post_id', postId);  // Добавляем post_id для обновления
            }
            
            // Логируем FormData для проверки
            form.forEach((value, key) => {
                console.log(`${key}: ${value}`);
            });
    
            // Отправка данных на сервер с помощью AJAX
            $.ajax({
                url: create_book_vars.ajax_url,
                method: 'POST',
                data: form,
                processData: false,
                contentType: false,
                success: function(response) {
                    console.log('Ответ от сервера:', response);
                    if (response.success) {
                        alert(postId ? 'Книга успешно обновлена!' : 'Книга успешно сохранена!');
                        // Здесь можно добавить редирект или другие действия, например:
                        // window.location.href = '/books'; // Перенаправление на страницу списка книг
                    } else {
                        const errorMessage = response.data && response.data.message 
                            ? response.data.message 
                            : 'Произошла ошибка, но нет сообщения об ошибке.';
                        alert('Ошибка при сохранении книги: ' + errorMessage);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Ошибка AJAX запроса:', error);
                    alert('Произошла ошибка при обработке запроса. Пожалуйста, попробуйте снова.');
                }                
            });
        } else {
            console.warn('Проверка формы не пройдена. Пожалуйста, исправьте ошибки.');
        }
    });
    
    

    function collectFormData() {
        let paragraphs = [];
        $('#paragraphs-container .paragraph').each(function(index) {
            let paragraphTitle = $(this).find(`input[name="paragraphs[${index}][title]"]`).val().trim();
            let paragraphContent = $(this).find(`textarea[name="paragraphs[${index}][content]"]`).val().trim();
            if (paragraphTitle || paragraphContent) {
                paragraphs.push({ title: paragraphTitle, content: paragraphContent });
            }
        });
    
        return {
            title: $('#book-title').val().trim(),
            author: $('#book-author').val().trim(),
            description: $('#book-description').val().trim(),
            genre: genreSelect.val().trim(),
            subgenre1: subgenre1Select.val().trim(),
            subgenre2: subgenre2Select.val().trim(),
            coAuthor: coAuthorInput.val().trim(),
            annotation: $('#annotation').val().trim(),
            authorNote: $('#author-note').val().trim(),
            tags: $('#tags').val().trim(),
            visibility: $('#visibility').val().trim(),
            downloadPermission: $('#download_permission').val().trim(),
            commentPermission: $('#comment_permission').val().trim(),
            type: bookTypeInput.val(), // Добавляем тип книги
            paragraphs: paragraphs // Добавляем абзацы
        };
    }
    


    // Обновление селектов поджанров в зависимости от выбранного жанра
    function updateSubgenres(genre, selectedSubgenre1, selectedSubgenre2) {
        subgenre1Select.empty().prop('disabled', true);
        subgenre2Select.empty().prop('disabled', true);
        const subgenreList = subgenres[genre];
        if (subgenreList && subgenreList.length > 0) {
            subgenreList.forEach(subgenre => {
                subgenre1Select.append(new Option(subgenre.text, subgenre.value));
                subgenre2Select.append(new Option(subgenre.text, subgenre.value));
            });
            subgenre1Select.prop('disabled', false);
            subgenre2Select.prop('disabled', false);
            if (selectedSubgenre1) subgenre1Select.val(selectedSubgenre1);
            if (selectedSubgenre2) subgenre2Select.val(selectedSubgenre2);
        }
    }

    genreSelect.on('change', function() {
        const selectedGenre = $(this).val();
        updateSubgenres(selectedGenre, null, null);
    });

    // Пример автозаполнения для соавторов
    coAuthorInput.autocomplete({
        source: function(request, response) {
            $.ajax({
                url: create_book_vars.ajax_url,
                method: 'POST',
                data: {
                    action: 'autocomplete_coauthors',
                    nonce: create_book_vars.nonce,
                    term: request.term
                },
                success: function(data) {
                    response(data);
                }
            });
        },
        minLength: 2,
        select: function(event, ui) {
            coAuthorInput.val(ui.item.value);
            return false;
        }
    });
});
