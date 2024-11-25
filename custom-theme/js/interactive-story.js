jQuery(document).ready(function ($) {
    var postId = wp_vars.post_id; // Получаем ID поста из объекта wp_vars
    var nonce = wp_vars.nonce; // Получаем nonce из объекта wp_vars
    let factGroupIndex = 0;
    let resourceGroupIndex = 0;
    let formulaIndex = 0;
    let paragraphIndex = 0;
    let paragraphsData = [];
    let savedFacts = [];
    let savedResourceGroups = [];
    let achievementImageFile = null;
    const tabLinks = $('.tab-link');
    const tabContents = $('.tab-content');
    const helpBtn = $('#help-btn');
    const helpModal = $('#help-modal');
    const closeBtn = $('.close');
    var nodes = [];
    var links = [];

    console.log('ID поста:', postId); // Логирование ID поста

    if (postId) {
        console.log('Отправляемый post_id:', postId); // Логируем отправляемый ID поста

        // Запрос к AJAX для получения данных
        $.ajax({
            url: wp_vars.ajax_url, // Используем URL из wp_vars
            method: 'POST',
            data: {
                action: 'get_story_data', // Новый экшен для объединенного запроса
                post_id: postId,
                nonce: nonce // Передаем nonce для проверки безопасности
            },
            success: function (response) {
                console.log('Ответ сервера:', response); // Логирование успешного ответа
                if (response.success) {
                    const paragraphs = response.data.paragraphs;
                    const factGroups = response.data.facts; // Получаем группы фактов
                    savedFacts = factGroups.flatMap(group => group.facts); // Заполняем массив savedFacts
                    const resourceGroups = response.data.resources; // Получаем группы ресурсов
                    const autoChangesData = paragraphs.flatMap(paragraph => paragraph.autoChanges || []);
                    console.log('autoChangesData:', autoChangesData);
                    // Обработка параграфов
                    initializeParagraphs(paragraphs);

                    // Инициализация групп фактов
                    initializeFactGroups(factGroups); // Изменено на factGroups

                    // Инициализация групп ресурсов
                    initializeResourceGroups(resourceGroups);

                    // Обновляем интерфейс со списком параграфов (включает обновление всех выпадающих списков)
                    displayParagraphList();

                    updateAllNextParagraphOptions();
                } else {
                    console.error('Ошибка в ответе:', response.data.message);
                    alert('Ошибка: ' + response.data.message); // Сообщение для пользователя
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Ошибка AJAX:', jqXHR, textStatus, errorThrown); // Логирование ошибки
                alert('Произошла ошибка при запросе данных. Пожалуйста, попробуйте позже.'); // Уведомление для пользователя
            }
        });
    } else {
        console.error('ID поста не задан'); // Логирование, если postId не задан
        alert('ID поста не задан. Пожалуйста, проверьте настройки.'); // Уведомление для пользователя
    }
    function updateDropdowns() {
        const factsList = [];
        $('.fact-group').each(function () {
            $(this).find('.facts-container .form-group').each(function () {
                const factName = $(this).find('input[name^="fact-groups"]').val();
                if (factName) {
                    factsList.push(factName);
                }
            });
        });
        $('.fact-dropdown').each(function (index) {
            const dropdown = $(this);
            const dropdownName = `${dropdown.attr('name')}-${index}`; // Уникальный ключ для каждого списка

            // Сохранение текущего выбранного значения
            const currentValue = localStorage.getItem(dropdownName) || dropdown.val();

            dropdown.empty(); // Очистка dropdown перед добавлением опций
            factsList.forEach(function (fact) {
                const option = new Option(fact, fact);
                dropdown.append(option); // Добавление опций по одной
            });

            // Восстановление сохранённого значения
            if (currentValue) {
                dropdown.val(currentValue);
            }

            // Сохраняем выбранное значение в localStorage при изменении
            dropdown.off('change').on('change', function () {
                localStorage.setItem(dropdownName, dropdown.val());
            });
        });

        // Обновление выпадающего списка групп фактов
        const factGroupsList = [];
        $('.fact-group').each(function () {
            const groupName = $(this).find('input[name^="fact-group-name"]').val();
            if (groupName) {
                factGroupsList.push(groupName);
            }
        });
        $('.facts-group-dropdown').each(function (index) {
            const dropdown = $(this);
            const dropdownName = `${dropdown.attr('name')}-${index}`; // Уникальный ключ для каждого списка

            // Сохранение текущего выбранного значения
            const currentValue = localStorage.getItem(dropdownName) || dropdown.val();

            dropdown.empty(); // Очистка dropdown перед добавлением опций
            factGroupsList.forEach(function (group) {
                const option = new Option(group, group);
                dropdown.append(option); // Добавление опций по одной
            });

            // Восстановление сохранённого значения
            if (currentValue) {
                dropdown.val(currentValue);
            }

            // Сохраняем выбранное значение в localStorage при изменении
            dropdown.off('change').on('change', function () {
                localStorage.setItem(dropdownName, dropdown.val());
            });
        });

        // Обновление выпадающих списков ресурсов
        const savedResourceGroups = JSON.parse(localStorage.getItem('savedResourceGroups')) || [];
        const resourceListFromStorage = savedResourceGroups.flatMap(group => group.resources.map(resource => resource.name));

        $('.resource-dropdown').each(function (index) {
            const dropdown = $(this);
            const dropdownName = `${dropdown.attr('name')}-${index}`; // Уникальный ключ для каждого списка

            // Сохранение текущего выбранного значения
            const currentValue = localStorage.getItem(dropdownName) || dropdown.val();

            dropdown.empty(); // Очистка dropdown перед добавлением опций
            resourceListFromStorage.forEach(function (resource) {
                const option = new Option(resource, resource);
                dropdown.append(option); // Добавление опций по одной
            });

            // Восстановление сохранённого значения
            if (currentValue) {
                dropdown.val(currentValue);
            }

            // Сохраняем выбранное значение в localStorage при изменении
            dropdown.off('change').on('change', function () {
                localStorage.setItem(dropdownName, dropdown.val());
            });
        });

        // Обновление выпадающего списка групп ресурсов
        $('.resource-group-dropdown').each(function (index) {
            const dropdown = $(this);
            const dropdownName = `${dropdown.attr('name')}-${index}`; // Уникальный ключ для каждого списка

            // Сохранение текущего выбранного значения
            const currentValue = localStorage.getItem(dropdownName) || dropdown.val();

            dropdown.empty(); // Очистка dropdown перед добавлением опций
            savedResourceGroups.forEach(group => {
                const groupName = group.name;
                if (groupName) {
                    const option = new Option(groupName, group.index);
                    dropdown.append(option); // Добавление опций по одной
                }
            });

            // Восстановление сохранённого значения
            if (currentValue) {
                dropdown.val(currentValue);
            }

            // Сохраняем выбранное значение в localStorage при изменении
            dropdown.off('change').on('change', function () {
                localStorage.setItem(dropdownName, dropdown.val());
            });
        });

        // Обновление выпадающего списка формул
        const formulasList = [];
        $('.formula').each(function () {
            const formulaName = $(this).find('input[name^="formulas"]').val();
            if (formulaName) {
                formulasList.push(formulaName);
            }
        });
        $('.formula-dropdown').each(function (index) {
            const dropdown = $(this);
            const dropdownName = `${dropdown.attr('name')}-${index}`; // Уникальный ключ для каждого списка

            // Сохранение текущего выбранного значения
            const currentValue = localStorage.getItem(dropdownName) || dropdown.val();

            dropdown.empty(); // Очистка dropdown перед добавлением опций
            formulasList.forEach(function (formula) {
                const option = new Option(formula, formula);
                dropdown.append(option); // Добавление опций по одной
            });

            // Восстановление сохранённого значения
            if (currentValue) {
                dropdown.val(currentValue);
            }

            // Сохраняем выбранное значение в localStorage при изменении
            dropdown.off('change').on('change', function () {
                localStorage.setItem(dropdownName, dropdown.val());
            });
        });

        // Обновление выпадающего списка параграфов
        const paragraphList = paragraphsData.map((paragraph, index) => `Параграф ${index + 1}: ${paragraph.title || ''}`);

        $('.paragraph-dropdown').each(function (index) {
            const dropdown = $(this);
            const dropdownName = `${dropdown.attr('name')}-${index}`; // Уникальный ключ для каждого списка

            // Сохранение текущего выбранного значения
            const currentValue = localStorage.getItem(dropdownName) || dropdown.val();

            dropdown.empty(); // Очистка dropdown перед добавлением опций
            paragraphList.forEach(function (paragraph, index) {
                const option = new Option(paragraph, index);
                dropdown.append(option); // Добавление опций по одной
            });

            // Восстановление сохранённого значения
            if (currentValue) {
                dropdown.val(currentValue);
            }

            // Сохраняем выбранное значение в localStorage при изменении
            dropdown.off('change').on('change', function () {
                localStorage.setItem(dropdownName, dropdown.val());
            });
        });
    }
    function initializeParagraphs(paragraphs) {
        paragraphs.forEach((paragraph, index) => {
            addParagraph(); // Добавляем новый параграф на страницу

            // Заполняем последний добавленный параграф данными
            paragraphsData[index] = paragraph;

            // Устанавливаем значения в DOM-элементы
            $(`#paragraph-title-${index}`).val(paragraph.title);
            $(`#paragraph-text-${index}`).val(paragraph.text);

            // Инициализируем действия для текущего параграфа
            initializeActions(paragraph.actions, index);

            // Инициализируем автоизменения для текущего параграфа
            if (paragraph.autoChanges && paragraph.autoChanges.length > 0) {
                initializeAutoChanges(index, paragraph.autoChanges); // Передаем индекс и данные автоизменений
            } else {
                initializeAutoChanges(index, []); // Если нет автоизменений, передаем пустой массив
            }
        });
        updateDropdowns();
        updateLinksOnActionAdd();
        updateAutoIllustration();
    }



    function initializeActions(actions, index) {
        actions.forEach(action => {
            addActionForm(index); // Добавляем форму действия для текущего параграфа

            // Устанавливаем значения полей действия
            const $actionContainer = $(`.story-paragraph[data-index="${index}"] .actions-container .action-form`).last();
            $actionContainer.find(`#action-title-${index}`).val(action.title);
            $actionContainer.find(`#action-text-${index}`).val(action.text);
            $actionContainer.find(`#action-always-available-${index}`).val(action.alwaysAvailable);
            $actionContainer.find(`#action-requirement-type-${index}`).val(action.requirementType);
            $actionContainer.find(`#action-required-fact-${index}`).val(action.requiredFact);
            $actionContainer.find(`#action-required-resource-${index}`).val(action.requiredResource);
            $actionContainer.find(`#action-resource-quantity-${index}`).val(action.resourceQuantity);

            // Устанавливаем значение для выпадающего списка "Следующий параграф" после того, как опции добавлены
            const $nextParagraphDropdown = $actionContainer.find(`#action-next-paragraph-${index}`);

            // Проверяем наличие опции с нужным индексом перед установкой
            if ($nextParagraphDropdown.find(`option[value="${action.nextParagraph}"]`).length > 0) {
                $nextParagraphDropdown.val(action.nextParagraph);
            } else {
                // Если опции еще нет, добавляем ее временно или ждем появления опций
                $nextParagraphDropdown.append(new Option(`Параграф ${action.nextParagraph}`, action.nextParagraph, true, true));
            }
        });
    }

    function initializeFactGroups(factGroups) {
        if (Array.isArray(factGroups) && factGroups.length > 0) {
            factGroups.forEach(factGroup => {
                const groupIndex = factGroup.index; // Индекс группы
                addFactGroup(); // Создаем новую группу фактов

                const groupName = factGroup.name || ''; // Имя группы фактов
                $(`#fact-group-name-${groupIndex}`).val(groupName); // Устанавливаем имя группы

                // Инициализируем факты в группе
                if (Array.isArray(factGroup.facts)) {
                    initializeFactsInGroup(groupIndex, factGroup.facts); // Передаем факты
                }
            });
        } else {
            console.error('Данные групп фактов не являются массивом или не определены:', factGroups);
        }
        updateDropdowns();
    }
    function initializeFactsInGroup(factGroupIndex, facts) {
        if (Array.isArray(facts) && facts.length > 0) {
            facts.forEach(fact => {
                addFactToGroup(factGroupIndex, fact); // Передаем факт в addFactToGroup
            });
        } else {
            console.error('Факты не являются массивом или не определены:', facts);
        }
        updateDropdowns();
    }
    function initializeAutoChanges(paragraphIndex, autoChangesData = []) {
        // Очищаем контейнер автоизменений, если они есть
        const container = $(`.story-paragraph[data-index="${paragraphIndex}"] .auto-changes-container`);
        container.empty();

        // Если есть данные о существующих автоизменениях, создаем их
        if (autoChangesData.length > 0) {
            autoChangesData.forEach((autoChange, index) => {
                addAutoChangeForm(paragraphIndex); // Добавляем новую форму
                const form = container.find(`.auto-change[data-index="${paragraphIndex}"]:last`); // Получаем добавленную форму

                // Устанавливаем значения для каждого поля формы
                const typeSelect = form.find(`#auto-change-type-${paragraphIndex}`);
                typeSelect.val(autoChange.type); // Устанавливаем тип автоизменения

                // Инициализируем параметры для каждого типа автоизменения
                initializeAutoChangeParameters(form, autoChange.parameters);
            });
        } else {
            // Если автоизменений нет, добавляем одну пустую форму
            addAutoChangeForm(paragraphIndex);
        }

        // Привязываем обработчики для изменения типа автоизменений
        handleAutoChangeTypeChange();

        // Добавляем обработчик для удаления автоизменений
        $(document).on('click', `.remove-auto-change-btn`, function () {
            $(this).closest('.auto-change').remove();
        });
    }
    function initializeAutoChangeParameters(form, parameters) {
        const typeSelect = form.find('select.auto-change-type');

        // Если parameters — строка, преобразуем его в объект
        if (typeof parameters === 'string') {
            parameters = { fact: parameters };  // Преобразуем строку в объект с фактом
        }

        // Проверка типа автоизменения
        if (typeSelect.val() === 'addFact' || typeSelect.val() === 'removeFact') {
            if (!Array.isArray(savedFacts) || savedFacts.length === 0) {
                console.error('Нет сохраненных фактов для отображения.');
                return;
            }

            let selectedFact = String(parameters.fact || '');  // Убедитесь, что факт строковый
            console.log('selectedFact до установки:', selectedFact);  // Логирование

            let factOptions = '';
            savedFacts.forEach(fact => {
                fact = String(fact);  // Преобразование факта в строку
                console.log('Факт:', fact);
                factOptions += `<option value="${fact}" ${String(fact) === selectedFact ? 'selected' : ''}>${fact}</option>`;
            });

            if (!selectedFact && savedFacts.length > 0) {
                selectedFact = String(savedFacts[0]);
                parameters.fact = selectedFact;
            }

            // Обновляем HTML формы
            form.find('.auto-change-parameters').html(`
                <div class="form-group">
                    <label for="fact-select-${form.data('index')}">Выберите факт:</label>
                    <select class="form-control" name="fact">
                        <option value="">Выберите факт</option>
                        ${factOptions}
                    </select>
                </div>
            `);

            console.log('Добавлена форма с фактами.');
            console.log('HTML с фактами:', form.find('.auto-change-parameters').html());

            const selectElement = form.find('select[name="fact"]');
            console.log('Элемент select:', selectElement);

            // Устанавливаем значение и триггерим событие change
            setTimeout(() => {
                selectElement.val(selectedFact).trigger('change');
            }, 0);
            console.log('После .trigger(\'change\') - выбран факт:', selectElement.val());
        }
    }




    function initializeResourceGroups(resourceGroups) {
        // Проверяем, является ли resourceGroups массивом
        if (Array.isArray(resourceGroups) && resourceGroups.length > 0) {
            resourceGroups.forEach(resourceGroup => {
                const groupIndex = resourceGroup.index; // Получаем индекс группы
                addResourceGroup(); // Создаем новую группу расходников

                const groupName = resourceGroup.name || ''; // Имя группы расходников
                $(`#resource-group-name-${groupIndex}`).val(groupName); // Устанавливаем имя группы

                // Инициализируем ресурсы в группе
                if (Array.isArray(resourceGroup.resources)) {
                    resourceGroup.resources.forEach(resource => {
                        addResourceToGroup(groupIndex); // Добавляем ресурс в группу

                        // Устанавливаем значения для ресурса
                        $(`#resource-name-${groupIndex}`).last().val(resource.name); // Устанавливаем имя расходника
                        $(`#resource-quantity-${groupIndex}`).last().val(resource.quantity); // Устанавливаем количество
                    });
                }
            });
        }
        updateDropdowns();
    }
    // Автоматическая очистка localStorage и данных параграфов при загрузке страницы
    clearLocalStorage();
    clearParagraphsData();

    // Инициализация данных и обновление выпадающих списков
    clearDropdowns();
    loadInitialData();
    updateDropdowns();

    function clearLocalStorage() {
        localStorage.clear();
    }

    function clearParagraphsData() {
        paragraphsData = []; // Очищаем массив
        localStorage.removeItem('paragraphsData'); // Удаляем данные из localStorage
    }

    function clearDropdowns() {
        $('.formula-dropdown, .resource-dropdown, .resource-group-dropdown, .fact-dropdown, .fact-group-dropdown').each(function () {
            $(this).empty();
        });
    }

    function loadInitialData() {
        paragraphsData = JSON.parse(localStorage.getItem('paragraphsData')) || []; // загрузка параграфов из localStorage
        savedFacts = JSON.parse(localStorage.getItem('savedFacts')) || [];
        savedResourceGroups = JSON.parse(localStorage.getItem('savedResourceGroups')) || [];
        updateDropdowns();
    }


    function saveFacts() {
        savedFacts = [];
        $('.fact-group').each(function () {
            const groupIndex = $(this).data('index');
            const groupName = $(this).find('input[name^="fact-group-name"]').val();
            const groupFacts = [];
            $(this).find('.form-group').each(function () {
                const factName = $(this).find('input[name^="fact-groups"]').val();
                const factAccess = $(this).find('select[name^="fact-groups"]').val();
                groupFacts.push({ name: factName, access: factAccess });
            });
            savedFacts.push({ index: groupIndex, name: groupName, facts: groupFacts });
        });
        localStorage.setItem('savedFacts', JSON.stringify(savedFacts));
        updateDropdowns();
    }

    function openTab(tabName) {
        // Скрываем все табы
        tabContents.removeClass('active');
        // Показываем активный таб
        $(`#${tabName}`).addClass('active');

        // Убираем активный класс с всех ссылок
        tabLinks.removeClass('active');
        // Добавляем активный класс к текущей ссылке
        $(`.tab-link[data-tab="${tabName}"]`).addClass('active');

        // Проверяем вкладку и обновляем данные
        if (tabName === 'paragraphs') {
            saveFacts();
            updateFactDropdowns(); // Обновляем факты
            updateDropdowns();      // Обновляем выпадающие списки для параграфов
        } else if (tabName === 'facts') {
            // Обновляем выпадающие списки фактов при переходе на вкладку с фактами
            $('.fact-group').each(function () {
                const factGroupIndex = $(this).data('index');
                updateFactDropdowns(factGroupIndex);
            });
        } else if (tabName === 'resources') {
            // Обновляем выпадающие списки ресурсов при переходе на вкладку с ресурсами
            updateResourceDropdowns();
        }
    }

    // Обновление выпадающих списков, когда страница загружается
    $(document).ready(function () {
        updateDropdowns();
    });



    // Обработчик клика на табы
    tabLinks.on('click', function () {
        const tabName = $(this).data('tab');
        openTab(tabName);
    });

    // Обработчик открытия модального окна помощи
    helpBtn.on('click', function () {
        helpModal.show();
    });

    // Обработчик закрытия модального окна помощи
    closeBtn.on('click', function () {
        helpModal.hide();
    });

    // Закрытие модального окна при клике вне его
    $(window).on('click', function (event) {
        if ($(event.target).is(helpModal)) {
            helpModal.hide();
        }
    });

    // Открыть первую вкладку по умолчанию
    if (tabLinks.length > 0) {
        openTab(tabLinks.first().data('tab'));
    }

    function updateNextParagraphOptions($dropdown) {
        const paragraphList = paragraphsData.map((paragraph, index) => `Параграф ${index + 1}: ${paragraph.title || ''}`);

        $('.action-next-paragraph-dropdown').each(function (index) {
            const dropdown = $(this);
            const dropdownName = `${dropdown.attr('name')}-${index}`; // Уникальный ключ для каждого списка

            // Сохранение текущего выбранного значения
            const currentValue = localStorage.getItem(dropdownName) || dropdown.val();

            dropdown.empty(); // Очистка выпадающего списка

            paragraphList.forEach(function (paragraph, index) {
                const option = new Option(paragraph, index);
                dropdown.append(option); // Добавляем опции по одной
            });

            // Восстановление выбранного значения
            if (currentValue !== null && dropdown.find(`option[value='${currentValue}']`).length > 0) {
                dropdown.val(currentValue);
            }

            // Сохраняем выбранное значение в localStorage при изменении
            dropdown.off('change').on('change', function () {
                localStorage.setItem(dropdownName, dropdown.val());
            });
        });
    }





    function saveCurrentParagraph() {
        const index = $('#current-paragraph').data('index');
        const title = $(`#paragraph-title-${index}`).val();
        const text = $(`#paragraph-text-${index}`).val();

        paragraphsData[index] = {
            title: title,
            text: text,
        };

        localStorage.setItem('paragraphsData', JSON.stringify(paragraphsData));
        displayParagraphList(); // Обновляем список параграфов после сохранения
    }
    function displayParagraphList() {
        const $listContainer = $('#paragraph-list');
        $listContainer.empty();

        paragraphsData.forEach((paragraph, index) => {
            const paragraphButton = `<button type="button" class="btn btn-primary paragraph-btn" data-index="${index}">${paragraph.title ? paragraph.title : `Параграф ${index + 1}`}</button>`;
            $listContainer.append(paragraphButton);
        });

        updateDropdowns(); // Обновляем выпадающие списки при обновлении списка параграфов
    }


    function displayParagraph(index) {
        // Скрываем все параграфы
        $('.story-paragraph').hide();
        // Отображаем только выбранный параграф
        $(`.story-paragraph[data-index="${index}"]`).show();
    }
    let svgGroup; // Глобальная переменная для группы SVG
    let simulation; // Глобальная переменная для симуляции (если она используется)

    // Функция для обновления визуализации
    function updateLinksOnActionAdd() {
        links = []; // Стираем все старые связи

        // Создаем новые связи между параграфами
        for (let i = 0; i < paragraphsData.length - 1; i++) {
            // Добавляем только последовательные связи
            addNewLink(i, i + 1);
        }

        updateAutoIllustration(); // Обновляем визуализацию после обновления связей
    }


    // Обновлённая функция для добавления нового действия (связи)
    function addNewLink(sourceIndex, targetIndex) {
        // Проверяем, существует ли такая связь
        const existingLink = links.find(link => link.source === sourceIndex && link.target === targetIndex);
        if (!existingLink) {
            // Добавляем новую связь
            links.push({ source: sourceIndex, target: targetIndex });
        }

        // Обновляем визуализацию после добавления новой связи
        updateAutoIllustration();
    }
    // Функция для безопасного получения координаты
    function safeGetNodePosition(node, coordinate) {
        return (node && node[coordinate] !== undefined && !isNaN(node[coordinate])) ? node[coordinate] : 0;
    }
    // Функция для обновления визуализации
    // Функция для обновления визуализации
    function updateAutoIllustration() {
        const illustrationContainer = d3.select("#illustration-container");
        illustrationContainer.html(""); // Очищаем предыдущую иллюстрацию

        const width = 800;
        const height = 600;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 200; // Радиус для круговой диаграммы

        // Добавляем маркер-стрелку
        const svg = illustrationContainer.append("svg")
            .attr("width", width)
            .attr("height", height)
            .call(d3.zoom()
                .scaleExtent([0.1, 2])
                .on("zoom", (event) => {
                    svgGroup.attr("transform", event.transform);
                }))
            .append("g");

        svg.append("defs").append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "-0 -5 10 10")
            .attr("refX", 20) // Подходит для размера узла 20px
            .attr("refY", 0)
            .attr("orient", "auto")
            .attr("markerWidth", 8) // Увеличиваем ширину стрелки
            .attr("markerHeight", 8) // Увеличиваем высоту стрелки
            .attr("xoverflow", "visible")
            .append("path")
            .attr("d", "M 0,-5 L 10 ,0 L 0,5") // Стрелка
            .attr("fill", "#999")
            .style("stroke", "none");

        svgGroup = svg;

        nodes = paragraphsData.map((paragraph, index) => {
            const angle = (index / paragraphsData.length) * 2 * Math.PI;
            return {
                id: index,
                title: paragraph.title || `Параграф ${index + 1}`,
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
                fx: (nodes[index] && nodes[index].x) || centerX + radius * Math.cos(angle),
                fy: (nodes[index] && nodes[index].y) || centerY + radius * Math.sin(angle)
            };
        });

        simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(150))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .on("tick", ticked);

        // Добавляем линии и назначаем маркер стрелки
        const link = svgGroup.selectAll(".link")
            .data(links)
            .enter()
            .append("line")
            .attr("class", "link")
            .attr("stroke", "#999")
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#arrowhead)"); // Применяем стрелку

        const node = svgGroup.selectAll(".node")
            .data(nodes)
            .enter()
            .append("g") // Используем группу для узла и текста
            .attr("class", "node")
            .call(d3.drag()
                .on("start", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on("drag", (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on("end", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = d.x;
                    d.fy = d.y;
                }));

        // Добавляем круги узлов
        node.append("circle")
            .attr("r", 20)
            .attr("fill", "#69b3a2");

        // Добавляем текст узлов и предотвращаем его выделение
        const labels = node.append("text")
            .attr("class", "label")
            .text(d => d.title)
            .attr("text-anchor", "middle")
            .attr("dy", 5)
            .style("user-select", "none") // Запрещаем выделение текста
            .on("click", (event, d) => {
                // Вызываем функцию открытия вкладки
                openTab("paragraphs");
                displayParagraph(d.id); // Отображаем конкретный параграф
            });

        function ticked() {
            link
                .attr("x1", d => safeGetNodePosition(d.source, 'x'))
                .attr("y1", d => safeGetNodePosition(d.source, 'y'))
                .attr("x2", d => safeGetNodePosition(d.target, 'x'))
                .attr("y2", d => safeGetNodePosition(d.target, 'y'));

            node.attr("transform", d => `translate(${safeGetNodePosition(d, 'x')}, ${safeGetNodePosition(d, 'y')})`);
        }

        simulation.restart();
    }
    function addParagraph() {
        console.log("Добавление нового параграфа");
        saveCurrentParagraph(); // Сохраняем текущий параграф перед добавлением нового

        const newParagraphIndex = paragraphsData.length;

        var paragraphHtml = `
        <div class="story-paragraph" data-index="${newParagraphIndex}" style="display:none;">
            <h3>Параграф ${newParagraphIndex + 1}</h3>
            <div class="form-group">
                <label for="paragraph-title-${newParagraphIndex}">Заголовок параграфа:</label>
                <input type="text" id="paragraph-title-${newParagraphIndex}" name="paragraphs[${newParagraphIndex}][title]" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="paragraph-text-${newParagraphIndex}">Текст параграфа:</label>
                <textarea id="paragraph-text-${newParagraphIndex}" name="paragraphs[${newParagraphIndex}][text]" class="form-control" rows="4" required></textarea>
            </div>
            <div class="form-group">
                <button type="button" class="btn btn-secondary add-action-btn" data-paragraph-index="${newParagraphIndex}">Добавить действие</button>
                <div class="actions-container"></div>
            </div>
            <div class="form-group">
                <button type="button" class="btn btn-secondary add-auto-change-btn" data-paragraph-index="${newParagraphIndex}">Добавить автоизменение</button>
                <div class="auto-changes-container"></div>
            </div>
            <button type="button" class="btn btn-danger remove-paragraph-btn">Удалить параграф</button>
            <hr>
        </div>
    `;

        $('#story-paragraphs').append(paragraphHtml);

        paragraphsData.push({ title: '', text: '', actions: [] });
        localStorage.setItem('paragraphsData', JSON.stringify(paragraphsData));

        displayParagraphList();
        displayParagraph(newParagraphIndex);
        updateAutoIllustration();

        // Массовое обновление всех списков для нового параграфа
        updateAllNextParagraphOptions();
    }


    $(document).on('click', '.paragraph-btn', function () {
        const index = $(this).data('index');
        displayParagraph(index);
    });

    $(document).on('click', '.remove-paragraph-btn', function () {
        const index = $(this).data('paragraph-index');
        $(this).closest('.story-paragraph').remove();
        paragraphsData.splice(index, 1);
        localStorage.setItem('paragraphsData', JSON.stringify(paragraphsData));
        displayParagraphList(); // Обновляем список параграфов после удаления
    });

    $('#add-paragraph-btn').on('click', addParagraph);

    // Первоначальная загрузка данных и отображение первого параграфа
    loadInitialData();
    displayParagraphList();
    if (paragraphsData.length > 0) {
        displayParagraph(0);
    }
    function addActionForm(paragraphIndex) {
        console.log('Adding action form for paragraph index:', paragraphIndex);

        var actionHtml = `
            <div class="action-form">
                <div class="form-group">
                    <label for="action-type-${paragraphIndex}">Тип действия:</label>
                    <select id="action-type-${paragraphIndex}" name="paragraphs[${paragraphIndex}][actions][][type]" class="form-control action-type-select">
                        <option value="single-choice">Выбор одного варианта</option>
                        <option value="matching">Сопоставление вариантов</option>
                        <option value="multiple-choice">Выбор нескольких вариантов</option>
                    </select>
                </div>
                <!-- Поля, которые отображаются только для одиночного выбора -->
                <div class="single-choice-container" style="display: none;">
                    <div class="form-group">
                        <label for="action-title-${paragraphIndex}">Название действия:</label>
                        <input type="text" id="action-title-${paragraphIndex}" name="paragraphs[${paragraphIndex}][actions][][title]" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="action-text-${paragraphIndex}">Описание действия:</label>
                        <textarea id="action-text-${paragraphIndex}" name="paragraphs[${paragraphIndex}][actions][][text]" class="form-control" rows="4" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="action-always-available-${paragraphIndex}">Доступно в любом случае:</label>
                        <select id="action-always-available-${paragraphIndex}" name="paragraphs[${paragraphIndex}][actions][][always_available]" class="form-control">
                            <option value="1">Да</option>
                            <option value="0">Нет</option>
                        </select>
                    </div>
                    <div class="form-group requirement-type-container">
                        <label for="action-requirement-type-${paragraphIndex}">Тип требования:</label>
                        <select id="action-requirement-type-${paragraphIndex}" name="paragraphs[${paragraphIndex}][actions][][requirement_type]" class="form-control">
                            <option value="fact">Факт</option>
                            <option value="resource">Расходник</option>
                        </select>
                    </div>
                    <div class="form-group fact-container">
                        <label for="action-required-fact-${paragraphIndex}">Необходимый факт:</label>
                        <select id="action-required-fact-${paragraphIndex}" name="paragraphs[${paragraphIndex}][actions][][required_fact]" class="form-control fact-dropdown">
                            <option value="">Нет</option>
                        </select>
                    </div>
                    <div class="form-group resource-container" style="display: none;">
                        <label for="action-required-resource-${paragraphIndex}">Необходимый расходник:</label>
                        <select id="action-required-resource-${paragraphIndex}" name="paragraphs[${paragraphIndex}][actions][][required_resource]" class="form-control resource-dropdown">
                            <option value="">Нет</option>
                        </select>
                    </div>
                    <div class="form-group resource-quantity-container" style="display: none;">
                        <label for="action-resource-quantity-${paragraphIndex}">Количество расходника:</label>
                        <input type="number" id="action-resource-quantity-${paragraphIndex}" name="paragraphs[${paragraphIndex}][actions][][resource_quantity]" class="form-control" min="1" value="1">
                    </div>
                    <div class="form-group">
                        <label for="action-next-paragraph-${paragraphIndex}">Следующий параграф:</label>
                        <select id="action-next-paragraph-${paragraphIndex}" name="paragraphs[${paragraphIndex}][actions][][next_paragraph]" class="form-control action-next-paragraph-dropdown">
                        </select>
                    </div>
                </div>
                <!-- Поля для сопоставления вариантов -->
                <div class="form-group matching-container" style="display: none;">
                    <label for="action-matching-left-${paragraphIndex}">Левая группа:</label>
                    <input type="text" id="action-matching-left-${paragraphIndex}" name="paragraphs[${paragraphIndex}][actions][][matching_left]" class="form-control" placeholder="Введите элементы левой группы">
                    <button type="button" class="btn btn-primary add-matching-left" style="margin-top: 10px;">+ Добавить элемент в левую группу</button>
    
                    <label for="action-matching-right-${paragraphIndex}">Правая группа:</label>
                    <input type="text" id="action-matching-right-${paragraphIndex}" name="paragraphs[${paragraphIndex}][actions][][matching_right]" class="form-control" placeholder="Введите элементы правой группы">
                    <button type="button" class="btn btn-primary add-matching-right" style="margin-top: 10px;">+ Добавить элемент в правую группу</button>
    
                    <div class="matching-combinations-container" style="margin-top: 10px;">
                        <!-- Здесь будут добавляться комбинации левых и правых элементов -->
                    </div>
    
                    <div class="matching-right-list" style="margin-top: 10px;">
                        <!-- Здесь будут отображаться все добавленные элементы правой группы -->
                    </div>
                    <!-- Поле для баллов за правильное сопоставление -->
                    <div class="matching-points-container" style="display: none;">
                        <label for="action-matching-points-${paragraphIndex}">Баллы за правильное сопоставление:</label>
                        <input type="number" id="action-matching-points-${paragraphIndex}" name="paragraphs[${paragraphIndex}][actions][][matching_points]" class="form-control" min="1" value="1">
                    </div>
    
                    <!-- Кнопка для добавления условий перехода -->
                    <button type="button" class="btn btn-secondary add-transition-condition" style="margin-top: 10px;">+ Добавить условие перехода</button>
    
                    <!-- Контейнер для условий перехода -->
                    <div class="transition-conditions-container" style="margin-top: 10px;">
                        <!-- Условия будут добавляться сюда -->
                    </div>
                </div>
                <!-- Для выбора нескольких вариантов -->
                <!-- Для выбора нескольких вариантов -->
<div class="form-group multiple-choice-container" style="display: none;">
    <label for="action-multiple-choice-options-${paragraphIndex}">Варианты ответа:</label>

    <div class="multiple-choice-options-container" style="margin-top: 10px;">
        <!-- Здесь будут добавляться поля для выбора правильности и баллов -->
    </div>
    <button type="button" class="btn btn-primary add-multiple-choice-option">+ Добавить вариант</button>
    <!-- Кнопка для добавления перехода -->
<button type="button" class="btn btn-secondary add-transition-to-next-paragraph">+ Добавить переход к следующему параграфу</button>

<!-- Контейнер для перехода -->
<div class="form-group transition-to-next-paragraph-container" style="display: none;">
    <label for="action-next-paragraph-${paragraphIndex}">Следующий параграф:</label>
    <select id="action-next-paragraph-${paragraphIndex}" name="paragraphs[${paragraphIndex}][actions][][next_paragraph]" class="form-control action-next-paragraph-dropdown">
        <!-- Опции параграфов будут добавляться сюда -->
    </select>

    <label for="transition-points-${paragraphIndex}">Количество баллов за переход:</label>
    <input type="number" id="transition-points-${paragraphIndex}" name="paragraphs[${paragraphIndex}][actions][][transition_points]" class="form-control" min="1" value="1">
</div>
</div>
                <button type="button" class="btn btn-danger remove-action-btn">Удалить действие</button>
                <button type="button" class="btn btn-primary action-next-btn" style="display: none;">Далее</button>
                <hr>
            </div>
        `;

        var $actionsContainer = $(`.story-paragraph[data-index="${paragraphIndex}"] .actions-container`);

        // Добавляем новый action
        var $newAction = $(actionHtml);
        $actionsContainer.append($newAction);

        // Обновляем только список для последнего добавленного действия
        const $nextParagraphDropdown = $newAction.find('.action-next-paragraph-dropdown');
        updateNextParagraphOptions($nextParagraphDropdown);

        // Сразу вызываем обновление видимости в зависимости от типа действия
        const $actionTypeSelect = $newAction.find(`#action-type-${paragraphIndex}`);
        updateActionTypeVisibility($actionTypeSelect.val(), $newAction);
        initSingleChoiceVisibility($newAction);  // Передаем только добавленную форму

        // Слушаем изменения в выпадающем списке "Тип действия" только для текущего действия
        $newAction.on('change', '.action-type-select', function () {
            var actionType = $(this).val();
            var $currentActionForm = $(this).closest('.action-form');
            updateActionTypeVisibility(actionType, $currentActionForm);
        });

        // Обработчик для кнопки добавления элемента в левую группу
        $newAction.on('click', `.add-matching-left`, function () {
            var leftInput = $(this).closest('.matching-container').find('input[name*="matching_left"]');
            var leftValue = leftInput.val().trim();
            if (leftValue) {
                // Добавляем в комбинации
                $(this).closest('.matching-container').find('.matching-combinations-container').append(`
                    <div class="combination left-combination">
                        <span>${leftValue}</span>
                        <select class="form-control select-right-item" style="margin-top: 10px;">
                            <option value="">Выберите элемент из правой группы</option>
                        </select>
                        <label for="mark-correct-${paragraphIndex}">Правильное сочетание:</label>
                        <input type="checkbox" class="mark-correct" style="margin-top: 10px;">
                    </div>
                `);
                leftInput.val(''); // Очищаем поле ввода

                // Обновляем выпадающий список правых элементов для текущей комбинации
                updateRightSelectOptions($(this).closest('.matching-container'));
            }
        });

        // Обработчик для кнопки добавления элемента в правую группу
        $newAction.on('click', `.add-matching-right`, function () {
            var rightInput = $(this).closest('.matching-container').find('input[name*="matching_right"]');
            var rightValue = rightInput.val().trim();
            if (rightValue) {
                // Добавляем элемент в правую группу
                $(this).closest('.matching-container').find('.matching-right-list').append(`
                    <div class="right-item">${rightValue}</div>
                `);
                rightInput.val(''); // Очищаем поле ввода

                // Обновляем выпадающий список правых элементов для всех комбинаций
                updateRightSelectOptions($(this).closest('.matching-container'));
            }
        });
        $newAction.on('change', `.mark-correct`, function () {
            var $combination = $(this).closest('.combination');
            var isChecked = $(this).prop('checked');
            var $pointsContainer = $(this).closest('.matching-container').find('.matching-points-container');

            // Если галочка установлена, показываем поле для баллов
            if (isChecked) {
                $pointsContainer.show();
            } else {
                $pointsContainer.hide();
            }
        });
        // Обработчик для кнопки добавления варианта для выбора нескольких вариантов
        $newAction.on('click', `.add-multiple-choice-option`, function () {
            console.log('Adding multiple choice option');
            var optionsContainer = $(this).closest('.multiple-choice-container').find('.multiple-choice-options-container');
            optionsContainer.append(`
                <div class="form-group">
                    <input type="text" class="form-control" placeholder="Введите вариант">
                    <label>
                        <input type="checkbox" class="correct-option"> Правильный ответ
                    </label>
                    <input type="number" class="form-control points" placeholder="Баллы за правильный ответ" min="1" style="display: none;">
                    <button type="button" class="btn btn-danger remove-option" style="margin-top: 10px;">Удалить вариант</button>
                </div>
            `);
        });
        $newAction.on('change', '.correct-option', function () {
            var $checkbox = $(this);
            var $pointsInput = $checkbox.closest('.form-group').find('.points');

            // Показываем поле для баллов только если галочка установлена
            if ($checkbox.prop('checked')) {
                $pointsInput.show();
            } else {
                $pointsInput.hide();
            }
        });
        // Обработчик для удаления варианта для выбора нескольких вариантов
        $newAction.on('click', `.remove-multiple-choice-option`, function () {
            $(this).closest('.multiple-choice-option').remove();
        });

        // Обработчик для удаления действия
        $newAction.on('click', `.remove-action-btn`, function () {
            $(this).closest('.action-form').remove();
        });

        // Обработчик для добавления условия перехода
        $newAction.on('click', `.add-transition-condition`, function () {
            var transitionConditionHtml = `
                <div class="transition-condition">
                    <label for="min-points-${paragraphIndex}">Минимум баллов для перехода:</label>
                    <input type="number" id="min-points-${paragraphIndex}" name="paragraphs[${paragraphIndex}][actions][][min_points]" class="form-control" min="1" value="1">
    
                    <label for="next-paragraph-${paragraphIndex}">Следующий параграф для перехода:</label>
                    <select id="next-paragraph-${paragraphIndex}" name="paragraphs[${paragraphIndex}][actions][][next_paragraph]" class="form-control">
                        <!-- Опции для параграфов -->
                    </select>
    
                    <button type="button" class="btn btn-danger remove-transition-condition" style="margin-top: 10px;">Удалить условие</button>
                </div>
            `;
            $(this).closest('.matching-container').find('.transition-conditions-container').append(transitionConditionHtml);

            // Обновляем выпадающий список для параграфов
            const $transitionSelect = $(this).closest('.matching-container').find('.transition-conditions-container select').last();
            updateNextParagraphOptions($transitionSelect);
        });
        $newAction.on('click', '.add-transition-to-next-paragraph', function () {
            var $actionForm = $(this).closest('.action-form');

            // Показать контейнер для выбора следующего параграфа и ввода баллов
            $actionForm.find('.transition-to-next-paragraph-container').show();

            // Обновить выпадающий список для выбора следующего параграфа
            var $nextParagraphDropdown = $actionForm.find('.action-next-paragraph-dropdown');
            updateNextParagraphOptions($nextParagraphDropdown);
        });
        // Обработчик для удаления условия перехода
        $newAction.on('click', `.remove-transition-condition`, function () {
            $(this).closest('.transition-condition').remove();
        });
    }
    function initRequirementTypeVisibility($form) {
        var $requirementTypeSelect = $form.find('select[name$="[requirement_type]"]');
        var $factContainer = $form.find('.fact-container');
        var $resourceContainer = $form.find('.resource-container');
        var $resourceQuantityContainer = $form.find('.resource-quantity-container');

        $requirementTypeSelect.on('change', function () {
            var selectedType = $(this).val();
            if (selectedType === 'fact') {
                $factContainer.show();
                $resourceContainer.hide();
                $resourceQuantityContainer.hide();
            } else if (selectedType === 'resource') {
                $factContainer.hide();
                $resourceContainer.show();
                $resourceQuantityContainer.show();
            } else {
                $factContainer.hide();
                $resourceContainer.hide();
                $resourceQuantityContainer.hide();
            }
        }).trigger('change'); // Инициализируем видимость сразу при создании формы
    }
    function initVisibility($actionForm) {
        var $alwaysAvailableSelect = $actionForm.find('select[name$="[always_available]"]');
        var $requirementTypeContainer = $actionForm.find('.requirement-type-container');
        var $requirementTypeSelect = $actionForm.find('select[name$="[requirement_type]"]');
        var $factContainer = $actionForm.find('.fact-container');
        var $resourceContainer = $actionForm.find('.resource-container');
        var $factSelect = $actionForm.find('select[name$="[fact]"]');
        var $resourceSelect = $actionForm.find('select[name$="[resource]"]');

        function updateVisibility() {
            const isAlwaysAvailable = $alwaysAvailableSelect.val() === '1';

            // Если выбрано "Нет" (не всегда доступно), показываем выбор типа требования
            $requirementTypeContainer.toggle(!isAlwaysAvailable); // Показываем, если "Нет"

            if (isAlwaysAvailable) {
                // Если всегда доступно, скрываем все дополнительные поля
                $factContainer.hide();
                $resourceContainer.hide();
            } else {
                // Если выбрано "Нет", показываем выбор типа требования
                const isFactSelected = $requirementTypeSelect.val() === 'fact';

                // Показываем или скрываем контейнеры в зависимости от выбора типа требования
                $factContainer.toggle(isFactSelected); // Показываем для факта
                $resourceContainer.toggle(!isFactSelected); // Показываем для расходников
            }
        }

        // Инициализация видимости при загрузке страницы
        updateVisibility();

        // Обработчики изменения для выбора типа требования и доступности
        $alwaysAvailableSelect.off('change').on('change', updateVisibility);
        $requirementTypeSelect.off('change').on('change', updateVisibility);
    }

    function initFactVisibility($actionForm) {
        var $alwaysAvailableSelect = $actionForm.find('select[name$="[always_available]"]');
        var $factContainer = $actionForm.find('.fact-container');
        var $requirementTypeContainer = $actionForm.find('.requirement-type-container');
        var $requirementTypeSelect = $actionForm.find('select[name$="[requirement_type]"]');
        var $resourceContainer = $actionForm.find('.resource-container');
        var $resourceQuantityContainer = $actionForm.find('.resource-quantity-container');

        function updateVisibility() {
            const isAlwaysAvailable = $alwaysAvailableSelect.val() === '1'; // Проверяем, выбран ли "Always Available"

            // В зависимости от этого показываем/скрываем блок с выбором типа требования
            $requirementTypeContainer.toggle(!isAlwaysAvailable); // Если всегда доступно, скрываем этот блок

            if (isAlwaysAvailable) {
                // Если всегда доступно, скрываем все дополнительные поля
                $factContainer.hide();
                $resourceContainer.hide();
                $resourceQuantityContainer.hide();
            } else {
                // Если не всегда доступно, показываем поля, в зависимости от выбора типа требования
                const isFactSelected = $requirementTypeSelect.val() === 'fact';

                // Показываем/скрываем блоки в зависимости от того, выбран ли факт
                $factContainer.toggle(isFactSelected);
                $resourceContainer.toggle(!isFactSelected);
                $resourceQuantityContainer.toggle(!isFactSelected);
            }
        }

        // Инициализация видимости сразу при загрузке формы
        updateVisibility();

        // Обработчики изменения для выбора в select
        $alwaysAvailableSelect.off('change').on('change', updateVisibility);
        $requirementTypeSelect.off('change').on('change', updateVisibility);
    }
    function initSingleChoiceVisibility($form) {
        var $alwaysAvailableSelect = $form.find('select[name$="[always_available]"]');
        var $factContainer = $form.find('.fact-container');
        var $requirementTypeContainer = $form.find('.requirement-type-container');
        var $requirementTypeSelect = $form.find('select[name$="[requirement_type]"]');
        var $resourceContainer = $form.find('.resource-container');
        var $resourceQuantityContainer = $form.find('.resource-quantity-container');

        function updateVisibility() {
            const isAlwaysAvailable = $alwaysAvailableSelect.val() === '1'; // Проверяем, выбран ли "Always Available"

            // В зависимости от этого показываем/скрываем блок с выбором типа требования
            $requirementTypeContainer.toggle(!isAlwaysAvailable); // Если "Нет" в always_available, показываем это поле

            if (isAlwaysAvailable) {
                // Если всегда доступно, скрываем все дополнительные поля
                $factContainer.hide();
                $resourceContainer.hide();
                $resourceQuantityContainer.hide();
            } else {
                // Если не всегда доступно, показываем поля в зависимости от выбора типа требования
                const isFactSelected = $requirementTypeSelect.val() === 'fact';

                // Показываем или скрываем блоки для факта и ресурса
                $factContainer.toggle(isFactSelected);
                $resourceContainer.toggle(!isFactSelected);
                $resourceQuantityContainer.toggle(!isFactSelected);
            }
        }

        // Инициализация видимости сразу при добавлении формы
        updateVisibility();

        // Обработчики изменения
        $alwaysAvailableSelect.off('change').on('change', updateVisibility);
        $requirementTypeSelect.off('change').on('change', updateVisibility);
    }
    function updateActionTypeVisibility(actionType, $actionForm) {
        console.log('Обновляем видимость для типа:', actionType); // Для отладки
        $actionForm.find('.single-choice-container').hide();
        $actionForm.find('.matching-container').hide();
        $actionForm.find('.multiple-choice-container').hide();

        if (actionType === 'single-choice') {
            $actionForm.find('.single-choice-container').show();
        } else if (actionType === 'matching') {
            $actionForm.find('.matching-container').show();
        } else if (actionType === 'multiple-choice') {
            $actionForm.find('.multiple-choice-container').show();
        }
    }
    function updateRightSelectOptions($matchingContainer) {
        var rightOptions = $matchingContainer.find('.matching-right-list .right-item').map(function () {
            return $(this).text().trim();
        }).get();

        $matchingContainer.find('.select-right-item').each(function () {
            var $select = $(this);
            $select.empty(); // Очищаем текущие опции
            $select.append(`<option value="">Выберите элемент из правой группы</option>`);

            rightOptions.forEach(function (rightOption) {
                if (rightOption) {
                    $select.append(`<option value="${rightOption}">${rightOption}</option>`);
                }
            });
        });
    }

    function updateAllNextParagraphOptions() {
        const $dropdowns = $('.action-next-paragraph-dropdown');

        if ($dropdowns.length === 0) {
            //   console.error('Dropdown element is undefined or empty');
            return;
        }

        const paragraphList = paragraphsData.map((paragraph, index) => `Параграф ${index + 1}: ${paragraph.title || ''}`);

        $dropdowns.each(function () {
            const dropdown = $(this);
            const currentSelectedValue = dropdown.val();

            dropdown.empty(); // Очищаем выпадающий список

            paragraphList.forEach(function (paragraph, index) {
                const option = new Option(paragraph, index);
                dropdown.append(option);
            });

            dropdown.val(currentSelectedValue); // Восстанавливаем выбранное значение
        });
    }
    function updateNextParagraphOptions(dropdown) {
        if (!dropdown || dropdown.length === 0) {
            // console.error('Dropdown element is undefined or empty');
            return;
        }

        const paragraphList = paragraphsData.map((paragraph, index) => `Параграф ${index + 1}: ${paragraph.title || ''}`);
        console.log('Обновление выпадающего списка. Список параграфов:', paragraphList);

        const currentSelectedValue = dropdown.val(); // Сохраняем текущее значение
        dropdown.empty(); // Очищаем выпадающий список

        paragraphList.forEach(function (paragraph, index) {
            const option = new Option(paragraph, index);
            dropdown.append(option); // Добавляем опции по одной
        });

        dropdown.val(currentSelectedValue); // Восстанавливаем выбранное значение
    }





    function initActionForms() {
        $('.story-paragraph').each(function () {
            const paragraphIndex = $(this).data('index');
            $(this).find('.action-form').each(function () {
                initRequirementTypeVisibility($(this));
                initFactVisibility($(this));
            });
        });
    }

    // Вызов функции после загрузки документа
    $(document).ready(function () {
        initActionForms();
    });


    function updateNextParagraphOptionsForAction(paragraphIndex) {
        var paragraphOptionsHtml = '';
        $('.story-paragraph').each(function () {
            var index = $(this).data('index');
            var title = $(this).find('input[name^="paragraphs"][name$="[title]"]').val();
            if (index !== paragraphIndex && title) {
                paragraphOptionsHtml += `<option value="${index}">Параграф ${index + 1}: ${title}</option>`;
            }
        });
        $(`.story-paragraph[data-index="${paragraphIndex}"] .action-form select[name$="[next_paragraph]"]`).each(function () {
            $(this).empty().append(`<option value="">Выберите следующий параграф</option>` + paragraphOptionsHtml);
        });
    }
    function updateFactDropdowns(factGroupIndex) {
        const factOptions = [];

        // Получить все факты внутри конкретной группы
        $(`.fact-group[data-index="${factGroupIndex}"] .facts-container input[type="text"]`).each(function () {
            const factName = $(this).val();
            if (factName) {
                factOptions.push(`<option value="${factName}">${factName}</option>`);
            }
        });

        // Обновить dropdowns внутри этой же группы
        $(`.fact-group[data-index="${factGroupIndex}"] .fact-dropdown`).each(function () {
            const currentSelect = $(this);
            const selectedValue = currentSelect.val(); // Сохранить текущее выбранное значение

            currentSelect.empty(); // Очистить текущие опции
            currentSelect.append('<option value="">Выберите факт</option>'); // Добавить пустую опцию
            currentSelect.append(factOptions.join('')); // Добавить факты из списка

            // Если текущее значение всё ещё существует в новых опциях, сохранить его
            if (selectedValue && factOptions.includes(`<option value="${selectedValue}">${selectedValue}</option>`)) {
                currentSelect.val(selectedValue);
            }
        });
    }

    // Функция для добавления новой группы фактов
    // Добавление группы фактов
    function addFactGroup() {
        const factGroupHtml = `
        <div class="fact-group" data-index="${factGroupIndex}">
            <div class="fact-group-header">
                <h4>Группа фактов ${factGroupIndex + 1}</h4>
                <button type="button" class="remove-fact-group-btn" title="Удалить группу">
                    <i class="fas fa-trash"></i> <!-- Иконка корзины -->
                </button>
            </div>
            <div class="fact-group-parameters">
                <div class="form-group">
                    <label for="fact-group-name-${factGroupIndex}">Имя группы:</label>
                    <input type="text" id="fact-group-name-${factGroupIndex}" name="fact-group-name-${factGroupIndex}" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="fact-group-visible-${factGroupIndex}">Отображать игроку:</label>
                    <select id="fact-group-visible-${factGroupIndex}" name="fact-group-visible-${factGroupIndex}" class="form-control">
                        <option value="yes">Да</option>
                        <option value="no">Нет</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="fact-group-limited-${factGroupIndex}">Лимитированный:</label>
                    <select id="fact-group-limited-${factGroupIndex}" name="fact-group-limited-${factGroupIndex}" class="form-control fact-group-limited">
                        <option value="no">Нет</option>
                        <option value="yes">Да</option>
                    </select>
                </div>
            </div>
            <div class="form-group" id="fact-group-limit-container-${factGroupIndex}" style="display: none;">
                <label for="fact-group-limit-${factGroupIndex}">Количество использований:</label>
                <input type="number" id="fact-group-limit-${factGroupIndex}" name="fact-group-limit-${factGroupIndex}" class="form-control" min="1">
            </div>
            <button type="button" class="btn btn-secondary add-fact-to-group-btn">Добавить факт</button>
            <div class="facts-container"></div>
            <hr>
        </div>
    `;
        $('#fact-groups-container').append(factGroupHtml);
        factGroupIndex++;
    }
    function addFactToGroup(factGroupIndex, fact = '') {
        const factId = Date.now(); // Используем уникальный ID для факта (можно заменить на реальные данные)

        const factHtml = `
        <div class="fact-item">
            <div class="form-group">
                <label for="fact-name-${factGroupIndex}-${factId}">Факт:</label>
                <input type="text" id="fact-name-${factGroupIndex}-${factId}" name="fact-groups[${factGroupIndex}][facts][]" class="form-control fact-name" value="${fact}" required>
            </div>
            <div class="form-group">
                <label for="fact-access-${factGroupIndex}-${factId}">Доступен изначально:</label>
                <select id="fact-access-${factGroupIndex}-${factId}" name="fact-groups[${factGroupIndex}][access][]" class="form-control">
                    <option value="yes">Да</option>
                    <option value="no">Нет</option>
                </select>
            </div>
            <button type="button" class="remove-fact-btn" title="Удалить факт">
                <i class="fas fa-trash"></i> <!-- Иконка корзины -->
            </button>
        </div>
    `;
        $(`.fact-group[data-index="${factGroupIndex}"] .facts-container`).append(factHtml);
        updateFactDropdowns(factGroupIndex); // Обновить выпадающие списки доступа, если нужно
    }

    // Обработчик для удаления группы фактов
    $(document).on('click', '.remove-fact-group-btn', function () {
        $(this).closest('.fact-group').remove(); // Удаляем группу фактов
    });

    // Обработчик для удаления факта
    $(document).on('click', '.remove-fact-btn', function () {
        $(this).closest('.fact-item').remove(); // Удаляем отдельный факт
    });


    $(document).on('input', '.fact-name', function () {
        const factGroupIndex = $(this).closest('.fact-group').data('index');
        updateFactDropdowns(factGroupIndex);
    });
    function addResourceGroup() {
        const resourceGroupHtml = `
            <div class="resource-group" data-index="${resourceGroupIndex}">
                <div class="resource-group-header">
                    <div class="form-group">
                        <label for="resource-group-name-${resourceGroupIndex}">Название группы:</label>
                        <input type="text" id="resource-group-name-${resourceGroupIndex}" name="resource-group-name" class="form-control">
                    </div>
                    <button type="button" class="remove-resource-group-btn">
                        <i class="fas fa-trash"></i> <!-- Иконка корзины -->
                    </button>
                </div>
                <button type="button" class="btn btn-secondary add-resource-to-group-btn">Добавить расходник</button>
                <div class="resources-container"></div>
                <hr>
            </div>
        `;
        $('#resource-groups').append(resourceGroupHtml);
        resourceGroupIndex++;
        updateDropdowns(); // Обновляем выпадающий список после добавления группы
    }

    function addResourceToGroup(groupIndex) {
        var resourceHtml = `
            <div class="resource-item">
                <label for="resource-name-${groupIndex}">Название расходника:</label>
                <input type="text" id="resource-name-${groupIndex}" name="resource-name" class="form-control">
    
                <label for="resource-quantity-${groupIndex}">Количество:</label>
                <input type="number" id="resource-quantity-${groupIndex}" name="resource-quantity" class="form-control">
    
                <button type="button" class="remove-resource-btn">
                    <i class="fas fa-trash"></i> <!-- Иконка корзины -->
                </button>
            </div>
        `;
        $(`.resource-group[data-index="${groupIndex}"] .resources-container`).append(resourceHtml);
        saveResources(); // Сохраняем после добавления
    }


    $(document).on('click', '.remove-resource-btn', function () {
        $(this).closest('.resource-item').remove();
        saveResources(); // Сохраняем после удаления
    });

    function removeResourceGroup(groupIndex) {
        $(`.resource-group[data-index="${groupIndex}"]`).remove();
        updateDropdowns(); // Обновляем выпадающий список после удаления группы
    }

    function removeResourceFromGroup(groupIndex, resourceIndex) {
        $(`.resource-group[data-index="${groupIndex}"] .resource-item`).eq(resourceIndex).remove();
        saveResources(); // Сохраняем после удаления ресурса
    }

    function saveResources() {
        console.log('Saving resources...'); // Отладка
        const savedResourceGroups = [];

        // Проходим по всем группам ресурсов
        $('.resource-group').each(function () {
            const groupIndex = $(this).data('index');
            const groupName = $(this).find('input[name="resource-group-name"]').val().trim();
            const groupResources = [];

            // Проходим по всем ресурсам в группе
            $(this).find('.resource-item').each(function () {
                const resourceName = $(this).find('input[name="resource-name"]').val().trim();
                const resourceQuantity = $(this).find('input[name="resource-quantity"]').val().trim();

                // Добавляем ресурс, если название и количество не пустые
                if (resourceName && resourceQuantity) {
                    groupResources.push({ name: resourceName, quantity: resourceQuantity });
                }
            });

            // Добавляем группу ресурсов, если в ней есть ресурсы
            if (groupResources.length > 0) {
                savedResourceGroups.push({ index: groupIndex, name: groupName, resources: groupResources });
            }
        });

        console.log('Saved Resource Groups:', savedResourceGroups); // Отладка
        // Сохраняем в localStorage
        localStorage.setItem('savedResourceGroups', JSON.stringify(savedResourceGroups));
    }

    $(document).on('change input', '.resource-item input, .resource-group input', function () {
        saveResources(); // Сохраняем после изменений
    });

    function loadResources() {
        const savedResourceGroups = JSON.parse(localStorage.getItem('savedResourceGroups')) || [];
        $('#resource-groups').empty();
        savedResourceGroups.forEach(group => {
            addResourceGroup();
            const lastGroup = $('#resource-groups .resource-group').last();
            const groupIndex = group.index;
            lastGroup.find('input[name="resource-group-name"]').val(group.name);
            group.resources.forEach(resource => {
                addResourceToGroup(groupIndex);
                const lastResource = lastGroup.find('.resource-item').last();
                lastResource.find('input[name="resource-name"]').val(resource.name);
                lastResource.find('input[name="resource-quantity"]').val(resource.quantity);
            });
        });
        updateDropdowns(); // Обновляем выпадающие списки после загрузки
    }
    function updateParagraphsWithResources() {
        const resourceGroups = JSON.parse(localStorage.getItem('savedResourceGroups')) || [];
        const $paragraphResourceDisplay = $('#paragraph-resource-display');
        $paragraphResourceDisplay.empty();
        resourceGroups.forEach(group => {
            const groupHeader = `<h4>Группа расходников ${group.index + 1}</h4>`;
            $paragraphResourceDisplay.append(groupHeader);
            group.resources.forEach(resource => {
                const resourceHtml = `
                    <div class="resource-item">
                        <p>Название: ${resource.name}</p>
                        <p>Количество: ${resource.quantity}</p>
                    </div>
                `;
                $paragraphResourceDisplay.append(resourceHtml);
            });
        });
    }

    function updateAutoChangeParameters(formulaIndex, autoChangeType) {
        const parametersContainer = $(`#auto-change-parameters-${formulaIndex}`);
        parametersContainer.empty(); // Очищаем предыдущие параметры

        switch (autoChangeType) {
            case 'executeFormula':
                parametersContainer.append(`
                    <div class="form-group">
                        <label for="auto-change-formula-${formulaIndex}">Формула:</label>
                        <select id="auto-change-formula-${formulaIndex}" name="formulas[${formulaIndex}][formula]" class="form-control formula-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                `);
                updateDropdowns(); // Обновляем выпадающие списки
                break;

            // Добавьте другие случаи для других типов автоизменений, если необходимо

            default:
                break;
        }
    }
    function loadFormulasFromLocalStorage() {
        // Пример кода, который загружает формулы из localStorage
        const savedFormulas = JSON.parse(localStorage.getItem('savedFormulas')) || [];
        return savedFormulas;
    }

    function saveFormulasToLocalStorage(formulas) {
        // Пример кода, который сохраняет формулы в localStorage
        localStorage.setItem('savedFormulas', JSON.stringify(formulas));
    }

    function clearLocalStorage() {
        localStorage.removeItem('savedFormulas');
        localStorage.removeItem('savedResourceGroups');
        // Очистка других необходимых элементов localStorage, если нужно
    }
    function addFormula() {
        const formulaCount = $('.formula').length;
        const newFormulaIndex = formulaCount; // следующий индекс

        const formulaHtml = `
            <div class="formula" data-formula-index="${newFormulaIndex}">
                <div class="form-group">
                    <label for="formula-group-name-${newFormulaIndex}">Название группы формул:</label>
                    <input type="text" id="formula-group-name-${newFormulaIndex}" name="formulas[${newFormulaIndex}][groupName]" class="form-control" placeholder="Введите название группы формул">
                </div>
                <div class="auto-changes-container" id="auto-changes-container-${newFormulaIndex}">
                    <!-- Автоизменения будут добавлены здесь -->
                </div>
                <button type="button" class="add-auto-change-btn" data-formula-index="${newFormulaIndex}">Добавить автоизменение</button>
                <button type="button" class="remove-formula-btn" data-formula-index="${newFormulaIndex}">Удалить</button>
            </div>
        `;

        const formulasListContainer = $('#formulas-container');
        if (formulasListContainer.length === 0) {
            console.error('Контейнер для формул не найден');
            return;
        }

        formulasListContainer.append(formulaHtml);

        // Добавляем обработчик для кнопки добавления автоизменения
        $(`.add-auto-change-btn[data-formula-index="${newFormulaIndex}"]`).on('click', function () {
            addAutoChangeToFormula(newFormulaIndex);
        });

        // Добавляем обработчик для удаления формулы
        $(`.remove-formula-btn[data-formula-index="${newFormulaIndex}"]`).on('click', function () {
            $(this).closest('.formula').remove();
            updateDropdowns(); // Обновляем выпадающие списки после удаления формулы
        });

        updateDropdowns(); // Обновляем выпадающие списки
    }


    function addAutoChangeToFormula(formulaIndex) {
        const autoChangeIndex = $(`#auto-changes-container-${formulaIndex} .auto-change`).length;
        const autoChangeHtml = `
            <div class="auto-change" data-auto-change-index="${autoChangeIndex}">
                <label for="auto-change-type-${formulaIndex}-${autoChangeIndex}">Тип автоматического изменения:</label>
                <select id="auto-change-type-${formulaIndex}-${autoChangeIndex}" name="formulas[${formulaIndex}][autoChanges][${autoChangeIndex}][autoChangeType]" class="auto-change-type">
                    <option value="">Выберите тип</option>
                    <option value="addFact">Добавить факт</option>
                    <option value="removeFact">Удалить факт</option>
                    <option value="addRandomFact">Добавить случайный факт</option>
                    <option value="removeRandomFact">Удалить случайный факт</option>
                    <option value="addAllFactsGroup">Добавить всю группу фактов</option>
                    <option value="removeAllFactsGroup">Удалить всю группу фактов</option>
                    <option value="changeResource">Изменить ресурс</option>
                    <option value="setResourceValue">Установить значение ресурса</option>
                    <option value="addResourceValue">Добавить значение ресурса</option>
                    <option value="subtractResourceValue">Вычесть значение ресурса</option>
                    <option value="equalizeResources">Уравнять ресурсы</option>
                    <option value="addRandomResourceValue">Добавить случайное значение ресурса</option>
                    <option value="addRandomGroupResourceValue">Добавить случайное значение группы ресурсов</option>
                    <option value="addOtherResourceValue">Добавить значение другого ресурса</option>
                    <option value="subtractRandomGroupResourceValue">Вычесть случайное значение группы ресурсов</option>
                    <option value="multiplyResources">Умножить ресурсы</option>
                    <option value="divideResources">Разделить ресурсы</option>
                    <option value="executeFormula">Выполнить формулу</option>
                    <option value="rollback">Откат</option>
                    <option value="grantAchievement">Присвоить достижение</option>
                    <option value="savePoint">Точка сохранения</option>
                    <option value="explanation">Объяснение</option>
                </select>
                <div id="auto-change-parameters-${formulaIndex}-${autoChangeIndex}" class="auto-change-parameters">
                    <!-- Параметры автоматического изменения будут вставлены здесь в зависимости от выбора -->
                </div>
                <button type="button" class="remove-auto-change-btn">Удалить автоизменение</button>
            </div>
        `;

        $(`#auto-changes-container-${formulaIndex}`).append(autoChangeHtml);

        // Обработчик для изменения типа автоматического изменения
        $(`#auto-change-type-${formulaIndex}-${autoChangeIndex}`).change(function () {
            handleAutoChangeTypeChangeForFormula($(this));
        });

        // Обработчик для удаления автоизменения
        $(`#auto-changes-container-${formulaIndex} .remove-auto-change-btn`).last().on('click', function () {
            $(this).closest('.auto-change').remove();
        });

        updateDropdowns(); // Обновляем выпадающие списки после добавления параметров
    }

    function handleAutoChangeTypeChangeForFormula(element) {
        const selectedValue = element.val();
        const formulaIndex = element.closest('.formula').data('formula-index');
        console.log('Изменение типа автоизменения для:', selectedValue, 'в формуле с индексом:', formulaIndex);

        const parametersContainer = element.closest('.auto-change').find('.auto-change-parameters');
        parametersContainer.empty();

        switch (selectedValue) {
            case 'addFact':
            case 'removeFact':
                parametersContainer.append(`
                    <div class="form-group">
                        <label for="auto-change-fact-${formulaIndex}">Факт:</label>
                        <select id="auto-change-fact-${formulaIndex}" name="formulas[${formulaIndex}][fact]" class="form-control fact-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                `);
                break;

            case 'addRandomFact':
            case 'removeRandomFact':
            case 'addAllFactsGroup':
            case 'removeAllFactsGroup':
                parametersContainer.append(`
                    <div class="form-group">
                        <label for="auto-change-facts-group-${formulaIndex}">Группа фактов:</label>
                        <select id="auto-change-facts-group-${formulaIndex}" name="formulas[${formulaIndex}][facts_group]" class="form-control facts-group-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                `);
                break;

            case 'setResourceValue':
            case 'addResourceValue':
            case 'subtractResourceValue':
            case 'changeResource':
                parametersContainer.append(`
                    <div class="form-group">
                        <label for="auto-change-resource-${formulaIndex}">Расходник:</label>
                        <select id="auto-change-resource-${formulaIndex}" name="formulas[${formulaIndex}][resource]" class="form-control resource-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="auto-change-value-${formulaIndex}">Значение:</label>
                        <input type="number" id="auto-change-value-${formulaIndex}" name="formulas[${formulaIndex}][value]" class="form-control" placeholder="Введите значение">
                    </div>
                `);
                break;

            case 'equalizeResources':
                parametersContainer.append(`
                    <div class="form-group">
                        <label for="auto-change-resource-one-${formulaIndex}">Расходник 1:</label>
                        <select id="auto-change-resource-one-${formulaIndex}" name="formulas[${formulaIndex}][resource_one]" class="form-control resource-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="auto-change-resource-two-${formulaIndex}">Расходник 2:</label>
                        <select id="auto-change-resource-two-${formulaIndex}" name="formulas[${formulaIndex}][resource_two]" class="form-control resource-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                `);
                break;

            case 'addRandomResourceValue':
            case 'addOtherResourceValue':
                parametersContainer.append(`
                    <div class="form-group">
                        <label for="auto-change-resource-group-${formulaIndex}">Группа расходников:</label>
                        <select id="auto-change-resource-group-${formulaIndex}" name="formulas[${formulaIndex}][resource_group]" class="form-control resource-group-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                `);
                break;

            case 'addRandomGroupResourceValue':
            case 'subtractRandomGroupResourceValue':

            case 'multiplyResources':
            case 'divideResources':
                parametersContainer.append(`
                    <div class="form-group">
                        <label for="auto-change-resource-one-${formulaIndex}">Расходник 1:</label>
                        <select id="auto-change-resource-one-${formulaIndex}" name="formulas[${formulaIndex}][resource_one]" class="form-control resource-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="auto-change-resource-two-${formulaIndex}">Расходник 2:</label>
                        <select id="auto-change-resource-two-${formulaIndex}" name="formulas[${formulaIndex}][resource_two]" class="form-control resource-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="auto-change-result-resource-${formulaIndex}">Результирующий расходник:</label>
                        <select id="auto-change-result-resource-${formulaIndex}" name="formulas[${formulaIndex}][result_resource]" class="form-control resource-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                `);
                break;
            case 'executeFormula':
                parametersContainer.append(`
                    <div class="form-group">
                        <label for="execute-formula-name-${formulaIndex}">Формула:</label>
                        <select id="execute-formula-name-${formulaIndex}" name="formulas[${formulaIndex}][execute_formula]" class="form-control formula-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                `);
                break;

            case 'rollback':
                parametersContainer.append(`
                    <div class="form-group">
                        <label for="rollback-steps-${formulaIndex}">Шаги отката:</label>
                        <input type="number" id="rollback-steps-${formulaIndex}" name="formulas[${formulaIndex}][rollback_steps]" class="form-control" placeholder="Введите количество шагов">
                    </div>
                `);
                break;

            case 'grantAchievement':
                parametersContainer.append(`
                    <div class="form-group">
                        <label for="achievement-name-${formulaIndex}">Достижение:</label>
                        <input type="text" id="achievement-name-${formulaIndex}" name="formulas[${formulaIndex}][achievement]" class="form-control" placeholder="Введите название достижения">
                    </div>
                `);
                break;

            case 'savePoint':
                parametersContainer.append(`
                    <div class="form-group">
                        <label for="save-point-name-${formulaIndex}">Точка сохранения:</label>
                        <input type="text" id="save-point-name-${formulaIndex}" name="formulas[${formulaIndex}][save_point]" class="form-control" placeholder="Введите название точки сохранения">
                    </div>
                `);
                break;

            case 'explanation':
                parametersContainer.append(`
                    <div class="form-group">
                        <label for="explanation-text-${formulaIndex}">Объяснение:</label>
                        <textarea id="explanation-text-${formulaIndex}" name="formulas[${formulaIndex}][explanation]" class="form-control" placeholder="Введите объяснение"></textarea>
                    </div>
                `);
                break;

            default:
                console.error(`Неизвестный тип автоизменения: ${selectedValue}`);
                parametersContainer.empty(); // Очищаем контейнер для неизвестного типа
                break;
        }

        updateDropdowns(); // Обновляем выпадающие списки после добавления параметров
    }
    $(document).on('click', '.remove-formula-btn', function () {
        $(this).closest('.formula').remove();
        updateDropdowns(); // Обновляем выпадающие списки после удаления формулы
    });

    $(document).on('change', '.fact-dropdown', function () {
        const selectedFact = $(this).val();
        console.log('Выбран факт:', selectedFact);
    });

    $(document).on('change', '.resource-dropdown', function () {
        const selectedResource = $(this).val();
        console.log('Выбран расходник:', selectedResource);
    });

    $(document).on('change', '.resource-group-dropdown', function () {
        const selectedResourceGroup = $(this).val();
        console.log('Выбрана группа расходников:', selectedResourceGroup);
    });

    $(document).on('change', '.formula-dropdown', function () {
        const selectedFormula = $(this).val();
        console.log('Выбрана формула:', selectedFormula);
    });

    function gatherParametersForFormula(formulaElement) {
        const parameters = {};
        formulaElement.find('.auto-change').each(function () {
            const type = $(this).find('select[name$="[autoChangeType]"]').val();
            const paramContainer = $(this).find('.auto-change-parameters');

            console.log(`Собираем параметры для типа автоизменения: ${type}`);

            paramContainer.find('[name]').each(function () {
                const name = $(this).attr('name');
                const value = $(this).val();
                console.log(`Параметр: имя=${name}, значение=${value}`); // Логируем каждый параметр
                if (name && value !== undefined && value !== '') {
                    parameters[name] = value;
                }
            });
        });

        console.log('Собранные параметры:', parameters);
        return parameters;
    }
    function gatherFormData() {
        const formulas = [];

        $('.formula').each(function () {
            const formulaIndex = $(this).data('index');
            const name = $(this).find(`input[name="formulas[${formulaIndex}][name]"]`).val()?.trim() || '';
            const expression = $(this).find(`textarea[name="formulas[${formulaIndex}][expression]"]`).val()?.trim() || '';
            const autoChanges = $(this).find('.auto-change').map(function () {
                const type = $(this).find(`select[name$="[autoChangeType]"]`).val() || '';
                const parameters = gatherParametersForFormula($(this));
                return { type, parameters };
            }).get();

            if (name || autoChanges.length) {
                formulas.push({ index: formulaIndex, name, expression, autoChanges });
            }
        });

        console.log('Собранные данные:', formulas);
        return { formulas };
    }

    function addAutoChange() {
        const autoChangeHtml = `
            <div class="auto-change" data-index="${formulaIndex}">
                <h4>Автоизменение ${formulaIndex + 1}</h4>
                <div class="form-group">
                    <label for="auto-change-type-${formulaIndex}">Тип автоизменения:</label>
                    <select id="auto-change-type-${formulaIndex}" name="auto-changes[${formulaIndex}][type]" class="form-control auto-change-type">
                        <option value="">Выберите тип</option>
                        <option value="addFact">Добавить факт</option>
                        <option value="removeFact">Удалить факт</option>
                        <option value="addRandomFact">Добавить случайный факт</option>
                        <option value="removeRandomFact">Удалить случайный факт</option>
                        <option value="addAllFactsGroup">Добавить все факты группы</option>
                        <option value="removeAllFactsGroup">Удалить все факты группы</option>
                        <option value="setResourceValue">Установить значение расходника</option>
                        <option value="equalizeResources">Приравнять расходник к расходнику</option>
                        <option value="addResourceValue">Добавить значение расходника</option>
                        <option value="addOtherResourceValue">Добавить значение другого расходника</option>
                        <option value="addRandomResourceValue">Добавить случайное значение расходника</option>
                        <option value="addRandomGroupResourceValue">Добавить случайное значение группы расходника</option>
                        <option value="subtractResourceValue">Вычесть значение расходника</option>
                        <option value="subtractOtherResourceValue">Вычесть значение другого расходника</option>
                        <option value="subtractRandomResourceValue">Вычесть случайное значение расходника</option>
                        <option value="subtractRandomGroupResourceValue">Вычесть случайное значение группы расходника</option>
                        <option value="multiplyResources">Умножить расходник на расходник</option>
                        <option value="divideResources">Разделить расходник на расходник</option>
                        <option value="executeFormula">Выполнить формулу</option>
                        <option value="rollback">Откатиться на предыдущий параграф</option>
                        <option value="grantAchievement">Выдать достижение</option>
                        <option value="savePoint">Точка сохранения</option>
                        <option value="explanation">Пояснение</option>
                    </select>
                </div>
                <div class="auto-change-parameters"></div>
                <button type="button" class="btn btn-danger remove-auto-change-btn">Удалить автоизменение</button>
                <hr>
            </div>
        `;
        $('#auto-changes-list').append(autoChangeHtml);
        formulaIndex++;
    }

    function addAutoChangeForm(paragraphIndex) {
        var autoChangeHtml = `
        <div class="auto-change" data-index="${paragraphIndex}">
            <div class="form-group">
                <label for="auto-change-type-${paragraphIndex}">Тип автоизменения:</label>
                <select id="auto-change-type-${paragraphIndex}" name="paragraphs[${paragraphIndex}][auto_changes][][type]" class="form-control auto-change-type">
                    <option value="">Выберите тип</option>
                    <option value="addFact">Добавить факт</option>
                    <option value="removeFact">Удалить факт</option>
                    <option value="addRandomFact">Добавить случайный факт группы</option>
                    <option value="removeRandomFact">Удалить случайный факт группы</option>
                    <option value="addAllFactsGroup">Добавить все факты группы</option>
                    <option value="removeAllFactsGroup">Удалить все факты группы</option>
                    <option value ="addResource" > Добавить расходник</option>
                    <option value ="deleteResource" > Удалить расходник</option>
                    <option value ="addGroupResource" > Добавить группу расходника</option>
                    <option value ="deleteGroupResource" > Удалить группу расходника</option>
                    <option value="setResourceValue">Установить значение расходника</option>
                    <option value="equalizeResources">Приравнять расходник к расходнику</option>
                    <option value="addResourceValue">Добавить значение расходника</option>
                    <option value="addOtherResourceValue">Добавить значение другого расходника</option>
                    <option value="addRandomResourceValue">Добавить случайное значение расходника</option>
                    <option value="addRandomGroupResourceValue">Добавить случайное значение группы расходника</option>
                    <option value="subtractResourceValue">Вычесть значение расходника</option>
                    <option value="subtractOtherResourceValue">Вычесть значение другого расходника</option>
                    <option value="subtractRandomResourceValue">Вычесть случайное значение расходника</option>
                    <option value="subtractRandomGroupResourceValue">Вычесть случайное значение группы расходника</option>
                    <option value="multiplyResources">Умножить расходник на расходник</option>
                    <option value="divideResources">Разделить расходник на расходник</option>
                    <option value="executeFormula">Выполнить формулу</option>
                    <option value="rollback">Откатиться на предыдущий параграф</option>
                    <option value="grantAchievement">Выдать достижение</option>
                    <option value="savePoint">Точка сохранения</option>
                    <option value="explanation">Пояснение</option>
                </select>
            </div>
            <div class="auto-change-parameters"></div>
            <button type="button" class="btn btn-danger remove-auto-change-btn">Удалить автоизменение</button>
            <hr>
        </div>
    `;
        $(`.story-paragraph[data-index="${paragraphIndex}"] .auto-changes-container`).append(autoChangeHtml);
    }
    function previewImage(input, index) {
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = document.getElementById(`preview-image-${index}`);
                img.src = e.target.result;
                img.style.display = 'block';  // Показываем изображение
                img.style.maxWidth = '150px'; // Устанавливаем максимальную ширину
                img.style.maxHeight = '84px';  // Устанавливаем максимальную высоту
            }
            reader.readAsDataURL(file);
        }
    }

    function handleAutoChangeTypeChange(element) {
        // Обрабатываем изменение типа для автоизменений и формул
        $('#story-paragraphs, #formulas-list').on('change', '.auto-change-type', function () {
            var isFormula = $(this).closest('#formulas-list').length > 0; // Проверяем, является ли элемент частью формул
            var container = isFormula ? $(this).closest('.formula') : $(this).closest('.auto-change');
            var index = container.data('index'); // Получаем индекс элемента
            var type = $(this).val();
            var parametersContainer = container.find('.auto-change-parameters');
            parametersContainer.empty();

            // В зависимости от типа автоизменения обновляем интерфейс
            switch (type) {
                case 'addFact':
                case 'removeFact':
                    parametersContainer.append(`
                    <div class="form-group">
                        <label for="auto-change-fact-${index}">Факт:</label>
                        <select id="auto-change-fact-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][fact]" class="form-control fact-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                `);

                    // Передаем индекс для корректного обновления фактов внутри группы
                    updateFactDropdowns(index);
                    break;

                case 'addRandomFact':
                case 'removeRandomFact':
                case 'addAllFactsGroup':
                case 'removeAllFactsGroup':
                    parametersContainer.append(`
                    <div class="form-group">
                        <label for="auto-change-facts-group-${index}">Группа фактов:</label>
                        <select id="auto-change-facts-group-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][facts_group]" class="form-control facts-group-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                `);
                    break;

                case 'setResourceValue':
                case 'addResourceValue':
                case 'subtractResourceValue':
                    parametersContainer.append(`
                    <div class="form-group">
                        <label for="auto-change-resource-${index}">Расходник:</label>
                        <select id="auto-change-resource-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][resource]" class="form-control resource-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="auto-change-value-${index}">Значение:</label>
                        <input type="number" id="auto-change-value-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][value]" class="form-control" placeholder="Введите значение">
                    </div>
                `);
                    break;
                case 'addResource':
                case 'deleteResource':
                    parametersContainer.append(`
                            <div class="form-group">
                                <label for="auto-change-resource-${index}">Расходник:</label>
                                <select id="auto-change-resource-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][resource]" class="form-control resource-dropdown">
                                    <!-- Options will be populated динамически -->
                                </select>
                            </div>
                        `);
                    break;

                case 'addGroupResource':
                case 'deleteGroupResource':
                    parametersContainer.append(`
                            <div class="form-group">
                                <label for="auto-change-resource-group-${index}">Группа расходников:</label>
                                <select id="auto-change-resource-group-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][resource_group]" class="form-control resource-group-dropdown">
                                    <!-- Options will be populated динамически -->
                                </select>
                            </div>
                        `);
                    break;

                case 'equalizeResources':
                    parametersContainer.append(`
                    <div class="form-group">
                        <label for="auto-change-resource-one-${index}">Расходник 1:</label>
                        <select id="auto-change-resource-one-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][resource_one]" class="form-control resource-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="auto-change-resource-two-${index}">Расходник 2:</label>
                        <select id="auto-change-resource-two-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][resource_two]" class="form-control resource-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                `);
                    break;

                case 'addRandomResourceValue':
                    parametersContainer.append(`
                        <div class="form-group">
                            <label for="auto-change-resource-${index}">Расходник:</label>
                            <select id="auto-change-resource-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][resource]" class="form-control resource-dropdown">
                                <!-- Options will be populated dynamically -->
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="auto-change-min-value-${index}">Минимум:</label>
                            <input type="number" id="auto-change-min-value-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][min_value]" class="form-control" placeholder="Минимум">
                        </div>
                        <div class="form-group">
                            <label for="auto-change-max-value-${index}">Максимум:</label>
                            <input type="number" id="auto-change-max-value-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][max_value]" class="form-control" placeholder="Максимум">
                        </div>
                    `);
                    break;

                case 'addRandomGroupResourceValue':
                    parametersContainer.append(`
                    <div class="form-group">
                        <label for="auto-change-resource-group-${index}">Группа расходников:</label>
                        <select id="auto-change-resource-group-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][resource_group]" class="form-control resource-group-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="auto-change-min-value-${index}">Минимум:</label>
                        <input type="number" id="auto-change-min-value-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][min_value]" class="form-control" placeholder="Минимум">
                    </div>
                    <div class="form-group">
                        <label for="auto-change-max-value-${index}">Максимум:</label>
                        <input type="number" id="auto-change-max-value-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][max_value]" class="form-control" placeholder="Максимум">
                    </div>
                `);
                    break;

                case 'addOtherResourceValue':
                    // Создание элементов выбора ресурсов
                    parametersContainer.append(`
        <div class="form-group">
            <label for="auto-change-resource-one-${index}">Расходник 1:</label>
            <select id="auto-change-resource-one-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][resource_one]" class="form-control resource-dropdown">
                <!-- Options will be populated dynamically -->
            </select>
        </div>
        <div class="form-group">
            <label for="auto-change-resource-two-${index}">Расходник 2:</label>
            <select id="auto-change-resource-two-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][resource_two]" class="form-control resource-dropdown">
                <!-- Options will be populated dynamically -->
            </select>
        </div>
    `);
                    break;


                case 'subtractOtherResourceValue':
                    parametersContainer.append(`
            <div class="form-group">
                <label for="auto-change-resource-one-${index}">Расходник 1:</label>
                <select id="auto-change-resource-one-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][resource_one]" class="form-control resource-dropdown">
                    <!-- Options will be populated динамически -->
                </select>
            </div>
            <div class="form-group">
                <label for="auto-change-resource-two-${index}">Расходник 2:</label>
                <select id="auto-change-resource-two-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][resource_two]" class="form-control resource-dropdown">
                    <!-- Options will be populated динамически -->
                </select>
            </div>
        `);
                    break;


                case 'subtractRandomResourceValue':
                    parametersContainer.append(`
                    <div class="form-group">
                        <label for="auto-change-resource-${index}">Расходник:</label>
                        <select id="auto-change-resource-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][resource]" class="form-control resource-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="auto-change-min-value-${index}">Минимум:</label>
                        <input type="number" id="auto-change-min-value-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][min_value]" class="form-control" placeholder="Минимум">
                    </div>
                    <div class="form-group">
                        <label for="auto-change-max-value-${index}">Максимум:</label>
                        <input type="number" id="auto-change-max-value-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][max_value]" class="form-control" placeholder="Максимум">
                    </div>
                `);
                    break;

                case 'subtractRandomGroupResourceValue':
                    parametersContainer.append(`
                    <div class="form-group">
                        <label for="auto-change-resource-group-${index}">Группа расходников:</label>
                        <select id="auto-change-resource-group-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][resource_group]" class="form-control resource-group-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="auto-change-min-value-${index}">Минимум:</label>
                        <input type="number" id="auto-change-min-value-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][min_value]" class="form-control" placeholder="Минимум">
                    </div>
                    <div class="form-group">
                        <label for="auto-change-max-value-${index}">Максимум:</label>
                        <input type="number" id="auto-change-max-value-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][max_value]" class="form-control" placeholder="Максимум">
                    </div>
                `);
                    break;


                case 'multiplyResources':
                case 'divideResources':
                    parametersContainer.append(`
                    <div class="form-group">
                        <label for="auto-change-resource-one-${index}">Расходник 1:</label>
                        <select id="auto-change-resource-one-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][resource_one]" class="form-control resource-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="auto-change-resource-two-${index}">Расходник 2:</label>
                        <select id="auto-change-resource-two-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][resource_two]" class="form-control resource-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                `);
                    break;

                case 'executeFormula':
                    parametersContainer.append(`
                    <div class="form-group">
                        <label for="auto-change-formula-${index}">Формула:</label>
                        <select id="auto-change-formula-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][formula]" class="form-control formula-dropdown">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                `);
                    break;

                case 'rollback':
                    parametersContainer.append(`
                        <div class="form-group">
                            <label for="auto-change-steps-${index}">Шаги назад:</label>
                            <input type="text" id="auto-change-steps-${index}" name="paragraphs[${index}][auto_changes][][rollback_steps]" class="form-control">
                        </div>
                    `);
                    break;

                case 'grantAchievement':
                    parametersContainer.append(`
        <div class="form-group">
            <label for="auto-change-achievement-${index}">Достижение:</label>
            <input type="text" id="auto-change-achievement-${index}" name="auto-changes[${index}][achievement]" class="form-control" placeholder="Введите название достижения">
        </div>
        <div class="form-group">
            <label for="auto-change-achievement-description-${index}">Описание:</label>
            <input type="text" id="auto-change-achievement-description-${index}" name="auto-changes[${index}][achievement_description]" class="form-control" placeholder="Введите описание достижения">
        </div>
        <div class="form-group">
            <label for="auto-change-achievement-image-${index}">Изображение:</label>
            <input type="file" id="auto-change-achievement-image-${index}" name="auto-changes[${index}][achievement_image]" class="form-control">
            <img id="preview-image-${index}" class="max-image" style="display: none;" />
        </div>
        <div class="form-check">
            <input type="checkbox" id="auto-change-achievement-rounded-${index}" name="auto-changes[${index}][achievement_rounded]" class="form-check-input">
            <label for="auto-change-achievement-rounded-${index}" class="form-check-label">Закруглить изображение</label>
        </div>
        <div class="form-group" style="display: none;" id="radius-container-${index}">
            <label for="corner-radius-${index}">Радиус закругления:</label>
            <input type="range" id="corner-radius-${index}" name="corner-radius" min="0" max="50" value="0">
            <span id="radius-value-${index}">0px</span>
        </div>
    `);

                    // Привязываем обработчик для изменения изображения
                    $(document).on('change', `input[name="auto-changes[${index}][achievement_image]"]`, function () {
                        previewImage(this, index);
                    });

                    // Обработчик для чекбокса
                    $(document).on('change', `input[name="auto-changes[${index}][achievement_rounded]"]`, function () {
                        const img = $(`#preview-image-${index}`);
                        const radiusContainer = $(`#radius-container-${index}`);
                        if (this.checked) {
                            radiusContainer.show();
                            updateImageBorderRadius(img, index, $(this).prop('checked'));
                        } else {
                            radiusContainer.hide();
                            img.css('border-radius', '0');
                        }
                    });

                    // Обработчик для ползунка
                    $(document).on('input', `#corner-radius-${index}`, function () {
                        const img = $(`#preview-image-${index}`);
                        updateImageBorderRadius(img, index, true);
                    });

                    break;
                case 'savePoint':
                    parametersContainer.append(`
        <div class="form-group">
            <label for="auto-change-save-point-${index}">Название чекпоинта:</label>
            <input type="text" id="auto-change-save-point-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][save_point]" class="form-control" placeholder="Введите название чекпоинта">
        </div>
    `);
                    break;


                case 'explanation':
                    parametersContainer.append(`
                    <div class="form-group">
                        <label for="auto-change-explanation-${index}">Пояснение:</label>
                        <input type="text" id="auto-change-explanation-${index}" name="${isFormula ? 'formulas' : 'auto-changes'}[${index}][explanation]" class="form-control" placeholder="Введите пояснение">
                    </div>
                `);
                    break;
            }
            updateDropdowns();
        });
    }
    function updateImageBorderRadius(img, index, isRounded) {
        if (isRounded) {
            const radius = $(`#corner-radius-${index}`).val();
            img.css('border-radius', `${radius}px`);
            $(`#radius-value-${index}`).text(`${radius}px`);
        }
    }

    // Вызов функции для обработки изменений типа автоизменений


    function collectFormulasData() {
        const formulas = [];
        $('.formula').each(function () {
            const formulaIndex = $(this).data('formula-index');
            const formula = {
                index: formulaIndex,
                name: $(`#formula-group-name-${formulaIndex}`).val(),
                autoChanges: collectAutoChangesForFormula(formulaIndex)
            };
            formulas.push(formula);
        });
        console.log('Собранные формулы:', formulas);
        return formulas;
    }
    function updateSavePointParagraphOptions(index) {
        var paragraphOptionsHtml = '';
        console.log('Updating options for save point:', index);

        $('.story-paragraph').each(function () {
            var paragraphIndex = $(this).data('index');
            var title = $(this).find('input[name^="paragraphs"][name$="[title]"]').val();

            console.log('Found paragraph:', paragraphIndex, title);

            if (title) {
                paragraphOptionsHtml += `<option value="${paragraphIndex}">${title}</option>`;
            }
        });

        console.log('Generated options HTML:', paragraphOptionsHtml);

        $(`#auto-change-save-point-paragraph-${index}`).empty().append(paragraphOptionsHtml);
    }




    function collectAutoChangesForFormula(formulaIndex) {
        const autoChanges = [];
        $(`#auto-changes-container-${formulaIndex} .auto-change`).each(function () {
            const autoChangeIndex = $(this).data('auto-change-index');
            const autoChangeTypeElement = $(`#auto-change-type-${formulaIndex}-${autoChangeIndex}`);

            if (autoChangeTypeElement.length === 0) {
                console.error(`Element for autoChangeType not found: #auto-change-type-${formulaIndex}-${autoChangeIndex}`);
                return;
            }

            const autoChangeType = autoChangeTypeElement.val();
            console.log(`autoChangeType for formula ${formulaIndex}, index ${autoChangeIndex}:`, autoChangeType);

            if (!autoChangeType) {
                console.error(`Тип автоизменения пустой для формулы ${formulaIndex}, индекс автоизменения ${autoChangeIndex}`);
                return;
            }

            // Собираем параметры
            const parameters = collectParametersForAutoChange(formulaIndex, $(this), autoChangeType);

            autoChanges.push({
                type: autoChangeType,
                parameters: parameters
            });
        });
        return autoChanges;
    }

    function collectParametersForAutoChange(formulaIndex, element, autoChangeType) {
        let parameters = '';
        console.log('Collecting parameters for type:', autoChangeType);

        switch (autoChangeType) {
            case 'addFact':
            case 'removeFact':
                parameters = element.find(`select[name="formulas[${formulaIndex}][fact]"]`).val() || '';
                console.log('addFact/removeFact parameters:', parameters);
                break;
            case 'addRandomFact':
            case 'removeRandomFact':
            case 'addAllFactsGroup':
            case 'removeAllFactsGroup':
                parameters = element.find(`select[name="formulas[${formulaIndex}][facts_group]"]`).val() || '';
                console.log('addRandomFact/removeRandomFact/addAllFactsGroup/removeAllFactsGroup parameters:', parameters);
                break;
            case 'setResourceValue':
            case 'addResourceValue':
            case 'subtractResourceValue':
            case 'changeResource':
                parameters = {
                    resource: element.find(`select[name="formulas[${formulaIndex}][resource]"]`).val() || '',
                    value: element.find(`input[name="formulas[${formulaIndex}][value]"]`).val() || ''
                };
                console.log('setResourceValue/addResourceValue/subtractResourceValue parameters:', parameters);
                break;
            case 'equalizeResources':
                parameters = {
                    resource_one: element.find(`select[name="formulas[${formulaIndex}][resource_one]"]`).val() || '',
                    resource_two: element.find(`select[name="formulas[${formulaIndex}][resource_two]"]`).val() || ''
                };
                console.log('equalizeResources parameters:', parameters);
                break;
            case 'multiplyResources':
            case 'divideResources':
                parameters = {
                    resource_one: element.find(`select[name="formulas[${formulaIndex}][resource_one]"]`).val() || '',
                    resource_two: element.find(`select[name="formulas[${formulaIndex}][resource_two]"]`).val() || '',
                    result_resource: element.find(`select[name="formulas[${formulaIndex}][result_resource]"]`).val() || ''
                };
                console.log('multiplyResources/divideResources parameters:', parameters);
                break;
            case 'ifThen':
                parameters = {
                    condition: element.find(`input[name="formulas[${formulaIndex}][condition]"]`).val() || '',
                    then_formula: element.find(`select[name="formulas[${formulaIndex}][then_formula]"]`).val() || '',
                    else_formula: element.find(`select[name="formulas[${formulaIndex}][else_formula]"]`).val() || ''
                };
                console.log('ifThen parameters:', parameters);
                break;
            case 'executeFormula':
                parameters = element.find(`select[name="formulas[${formulaIndex}][execute_formula]"]`).val() || '';
                console.log('executeFormula parameters:', parameters);
                break;
            case 'rollback':
                parameters = element.find(`input[name="formulas[${formulaIndex}][rollback_steps]"]`).val() || '';
                console.log('rollback parameters:', parameters);
                break;
            case 'grantAchievement':
                parameters = element.find(`input[name="formulas[${formulaIndex}][achievement]"]`).val() || '';
                console.log('grantAchievement parameters:', parameters);
                break;
            case 'savePoint':
                parameters = element.find(`input[name="formulas[${formulaIndex}][save_point]"]`).val() || '';
                console.log('savePoint parameters:', parameters);
                break;
            case 'explanation':
                parameters = element.find(`textarea[name="formulas[${formulaIndex}][explanation]"]`).val() || '';
                console.log('explanation parameters:', parameters);
                break;
            default:
                console.warn(`Неизвестный тип автоизменения: ${autoChangeType}`);
                break;
        }

        return typeof parameters === 'object' ? JSON.stringify(parameters) : parameters;
    }

    function collectData() {
        console.log('Сбор данных...');
    
        const paragraphs = [];
        $('.story-paragraph').each(function () {
            const paragraphIndex = $(this).data('index');
            const paragraph = {
                index: paragraphIndex || 0,
                title: $(this).find(`input[name="paragraphs[${paragraphIndex}][title]"]`).val()?.trim() || '',
                text: $(this).find(`textarea[name="paragraphs[${paragraphIndex}][text]"]`).val()?.trim() || '',
                actions: [],
                autoChanges: []
            };
    
            $(this).find('.actions-container .action-form').each(function () {
                const actionType = $(this).find(`select[name^="paragraphs[${paragraphIndex}][actions][][type]"]`).val() || '';
                const action = {
                    type: actionType,
                    title: $(this).find(`input[name^="paragraphs[${paragraphIndex}][actions][][title]"]`).val()?.trim() || '',
                    text: $(this).find(`textarea[name^="paragraphs[${paragraphIndex}][actions][][text]"]`).val()?.trim() || '',
                    nextParagraph: $(this).find(`select[name^="paragraphs[${paragraphIndex}][actions][][next_paragraph]"]`).val() || '',
                    alwaysAvailable: $(this).find(`select[name^="paragraphs[${paragraphIndex}][actions][][always_available]"]`).val() || '',
                    requirementType: $(this).find(`select[name^="paragraphs[${paragraphIndex}][actions][][requirement_type]"]`).val() || '',
                    requiredFact: $(this).find(`select[name^="paragraphs[${paragraphIndex}][actions][][required_fact]"]`).val() || '',
                    requiredResource: $(this).find(`select[name^="paragraphs[${paragraphIndex}][actions][][required_resource]"]`).val() || '',
                    resourceQuantity: $(this).find(`input[name^="paragraphs[${paragraphIndex}][actions][][resource_quantity]"]`).val() || '',
                    matchingLeft: [],
                    matchingRight: [],
                    multipleChoiceOptions: [],
                    transitionConditions: []
                };
    
                if (action.alwaysAvailable === '1') {
                    action.requiredFact = '';
                    action.requirementType = '';
                    action.requiredResource = '';
                    action.resourceQuantity = '';
                }
    
                // Сбор данных для сопоставления вариантов
                if (actionType === 'matching') {
                    $(this).find('.matching-container .left-combination').each(function () {
                        action.matchingLeft.push({
                            value: $(this).find('span').text().trim(),
                            right: $(this).find('select.select-right-item').val(),
                            correct: $(this).find('.mark-correct').prop('checked')
                        });
                    });
                    $(this).find('.matching-container .right-item').each(function () {
                        action.matchingRight.push($(this).text().trim());
                    });
    
                    // Условия перехода для сопоставления
                    $(this).find('.transition-conditions-container .transition-condition').each(function () {
                        action.transitionConditions.push({
                            minPoints: $(this).find(`input[name^="paragraphs[${paragraphIndex}][actions][][min_points]"]`).val() || '',
                            nextParagraph: $(this).find(`select[name^="paragraphs[${paragraphIndex}][actions][][next_paragraph]"]`).val() || ''
                        });
                    });
                }
    
                // Сбор данных для выбора нескольких вариантов
                if (actionType === 'multiple-choice') {
                    $(this).find('.multiple-choice-options-container .form-group').each(function () {
                        action.multipleChoiceOptions.push({
                            option: $(this).find('input[type="text"]').val().trim(),
                            correct: $(this).find('.correct-option').prop('checked'),
                            points: $(this).find('.points').val() || ''
                        });
                    });
    
                    // Сбор данных для перехода к следующему параграфу
                    $(this).find('.transition-to-next-paragraph-container').each(function () {
                        action.transitionToNextParagraph = {
                            nextParagraph: $(this).find(`select[name^="paragraphs[${paragraphIndex}][actions][][next_paragraph]"]`).val(),
                            points: $(this).find(`input[name^="paragraphs[${paragraphIndex}][actions][][transition_points]"]`).val() || ''
                        };
                    });
                }
    
                // Сбор данных для выбора одного варианта
                if (actionType === 'single-choice') {
                    action.singleChoice = {
                        option: $(this).find(`input[name^="paragraphs[${paragraphIndex}][actions][][title]"]`).val()?.trim() || '',
                        correct: $(this).find('.correct-option').prop('checked'),
                        points: $(this).find('.points').val() || ''
                    };
                }
    
                console.log('Action:', action);
                paragraph.actions.push(action);
            });

    
            $(this).find('.auto-changes-container .auto-change').each(function () {
                console.log('AutoChange Full HTML:', $(this).html());  // Выводим весь HTML автоизменения

                const autoChangeIndex = $(this).index();  // Индекс автоизменения
                const autoChangeType = $(this).find(`select[name^="paragraphs[${paragraphIndex}][auto_changes][][type]"]`).val() || '';
                console.log('AutoChange Type:', autoChangeType);

                let autoChangeParameters = '';

                switch (autoChangeType) {
                    case 'addFact':
                    case 'removeFact':
                        // Упрощенный селектор для поиска фактов
                        const factSelect = $(this).find('select[name*="[fact]"]');
                        console.log('Fact Select Element:', factSelect);

                        if (factSelect.length === 0) {
                            console.error(`Ошибка: элемент выбора фактов не найден для автоизменения типа ${autoChangeType}.`);
                        } else {
                            // Получаем выбранное значение
                            const selectedFact = factSelect.val();
                            console.log('Selected Fact:', selectedFact);

                            // Если значение выбрано, сохраняем его в параметры
                            autoChangeParameters = selectedFact || '';
                        }
                        break;
                    case 'addResource':
                    case 'deleteResource':
                        const resourceSelect12 = $(this).find('select[name$="[resource]"]');
                        const resource = resourceSelect12.val() || '';
                        autoChangeParameters = JSON.stringify({ resource });
                        break;

                    case 'addGroupResource':
                    case 'deleteGroupResource':
                        const groupResourceSelect = $(this).find('select[name$="[resource_group]"]');
                        const resourceGroup = groupResourceSelect.val() || '';
                        autoChangeParameters = JSON.stringify({ resourceGroup });
                        break;
                    case 'addOtherResourceValue':
                        // Получение значений из выпадающих списков
                        const resourceOneSelect1 = $(this).find('select[name$="[resource_one]"]');
                        const resourceTwoSelect1 = $(this).find('select[name$="[resource_two]"]'); // Исправлено название переменной

                        console.log('Resource One Select Element:', resourceOneSelect1);
                        console.log('Resource Two Select Element:', resourceTwoSelect1);

                        // Проверка наличия элементов
                        if (resourceOneSelect1.length === 0 || resourceTwoSelect1.length === 0) {
                            console.error('Не найдены элементы для типа addOtherResourceValue.');
                        } else {
                            const resourceOne = resourceOneSelect1.val() || '';
                            const resourceTwo = resourceTwoSelect1.val() || ''; // Исправлено название переменной

                            autoChangeParameters = JSON.stringify({ resource_one: resourceOne, resource_two: resourceTwo });
                            console.log('Resource One and Two:', { resource_one: resourceOne, resource_two: resourceTwo });
                        }
                        break;


                    case 'addRandomFact':
                    case 'removeRandomFact':
                    case 'addAllFactsGroup':
                    case 'removeAllFactsGroup':
                        const factsGroupSelect = $(this).find('select[name$="[facts_group]"]');
                        console.log('Facts Group Select Element:', factsGroupSelect);
                        console.log('HTML of the container:', $(this).html());

                        if (factsGroupSelect.length === 0) {
                            console.error('Не найден элемент выбора группы фактов. Проверьте HTML и селектор.');
                        } else {
                            autoChangeParameters = factsGroupSelect.val() || '';
                            console.log('Selected Facts Group:', autoChangeParameters);
                        }
                        break;

                    case 'setResourceValue':
                    case 'addResourceValue':
                    case 'subtractResourceValue':
                        const resourceSelectForResourceValue = $(this).find('select[name$="[resource]"]');
                        const valueInputForResourceValue = $(this).find('input[name$="[value]"]');

                        console.log('Resource Select Element:', resourceSelectForResourceValue);
                        console.log('Value Input Element:', valueInputForResourceValue);

                        if (resourceSelectForResourceValue.length === 0 || valueInputForResourceValue.length === 0) {
                            console.error('Не найдены элементы выбора ресурса или значения. Проверьте HTML и селекторы.');
                        } else {
                            const resource = resourceSelectForResourceValue.val() || '';
                            const value = valueInputForResourceValue.val() || '';
                            autoChangeParameters = JSON.stringify({ resource, value });
                            console.log('Resource and Value:', { resource, value });
                        }
                        break;

                    case 'equalizeResources':
                        const resourceOneSelect = $(this).find('select[name$="[resource_one]"]');
                        const resourceTwoSelect = $(this).find('select[name$="[resource_two]"]');

                        console.log('Resource One Select Element:', resourceOneSelect);
                        console.log('Resource Two Select Element:', resourceTwoSelect);

                        if (resourceOneSelect.length === 0 || resourceTwoSelect.length === 0) {
                            console.error('Не найдены элементы выбора ресурса. Проверьте HTML и селекторы.');
                        } else {
                            const resourceOne = resourceOneSelect.val() || '';
                            const resourceTwo = resourceTwoSelect.val() || '';
                            autoChangeParameters = JSON.stringify({ resource_one: resourceOne, resource_two: resourceTwo });
                            console.log('Resources to Equalize:', { resource_one: resourceOne, resource_two: resourceTwo });
                        }
                        break;
                    case 'addRandomResourceValue':
                        const resourceSelect = $(this).find('select[name$="[resource]"]');
                        const minValueInput = $(this).find('input[name$="[min_value]"]');
                        const maxValueInput = $(this).find('input[name$="[max_value]"]');

                        console.log('Resource Select Element:', resourceSelect);
                        console.log('Min Value Input Element:', minValueInput);
                        console.log('Max Value Input Element:', maxValueInput);

                        if (resourceSelect.length === 0 || minValueInput.length === 0 || maxValueInput.length === 0) {
                            console.error('Не найдены элементы для типа addRandomResourceValue.');
                        } else {
                            const resource = resourceSelect.val() || '';
                            const minValue = minValueInput.val() || '';
                            const maxValue = maxValueInput.val() || '';
                            autoChangeParameters = JSON.stringify({ resource, min_value: minValue, max_value: maxValue });
                            console.log('Resource, Min Value, and Max Value:', { resource, min_value: minValue, max_value: maxValue });
                        }
                        break;
                    case 'addRandomGroupResourceValue':
                        const resourceGroupSelect = $(this).find('select[name$="[resource_group]"]');
                        const minValueInputForGroup = $(this).find('input[name$="[min_value]"]');
                        const maxValueInputForGroup = $(this).find('input[name$="[max_value]"]');

                        console.log('Resource Group Select Element:', resourceGroupSelect);
                        console.log('Min Value Input Element:', minValueInputForGroup);
                        console.log('Max Value Input Element:', maxValueInputForGroup);

                        if (resourceGroupSelect.length === 0 || minValueInputForGroup.length === 0 || maxValueInputForGroup.length === 0) {
                            console.error('Не найдены элементы для типа addRandomGroupResourceValue.');
                        } else {
                            const resourceGroup = resourceGroupSelect.val() || '';
                            const minValue = minValueInputForGroup.val() || '';
                            const maxValue = maxValueInputForGroup.val() || '';
                            autoChangeParameters = JSON.stringify({ resource_group: resourceGroup, min_value: minValue, max_value: maxValue });
                            console.log('Resource Group, Min Value, and Max Value:', { resource_group: resourceGroup, min_value: minValue, max_value: maxValue });
                        }
                        break;
                    case 'subtractOtherResourceValue':
                        // Получение значений из выпадающих списков для вычитания
                        const resourceOneSelectSubtract = $(this).find('select[name$="[resource_one]"]');
                        const resourceTwoSelectSubtract = $(this).find('select[name$="[resource_two]"]');

                        console.log('Resource One Select Element:', resourceOneSelectSubtract);
                        console.log('Resource Two Select Element:', resourceTwoSelectSubtract);

                        // Проверка наличия элементов
                        if (resourceOneSelectSubtract.length === 0 || resourceTwoSelectSubtract.length === 0) {
                            console.error('Не найдены элементы для типа subtractOtherResourceValue.');
                        } else {
                            const resourceOne = resourceOneSelectSubtract.val() || '';
                            const resourceTwo = resourceTwoSelectSubtract.val() || '';

                            autoChangeParameters = JSON.stringify({ resource_one: resourceOne, resource_two: resourceTwo });
                            console.log('Resource One and Two for subtract:', { resource_one: resourceOne, resource_two: resourceTwo });
                        }
                        break;

                    case 'subtractRandomResourceValue':
                        const resourceSelectForSubtractRandomResourceValue1 = $(this).find('select[name$="[resource]"]');
                        const minValueInputForSubtractRandomResourceValue = $(this).find('input[name$="[min_value]"]');
                        const maxValueInputForSubtractRandomResourceValue = $(this).find('input[name$="[max_value]"]');

                        console.log('Resource Select Element:', resourceSelectForSubtractRandomResourceValue1);
                        console.log('Min Value Input Element:', minValueInputForSubtractRandomResourceValue);
                        console.log('Max Value Input Element:', maxValueInputForSubtractRandomResourceValue);

                        if (resourceSelectForSubtractRandomResourceValue1.length === 0 ||
                            minValueInputForSubtractRandomResourceValue.length === 0 ||
                            maxValueInputForSubtractRandomResourceValue.length === 0) {
                            console.error('Не найдены элементы для типа subtractRandomResourceValue.');
                            // Дополнительные отладочные данные
                            console.error('HTML контент контейнера:', $(this).html());
                        } else {
                            const resource = resourceSelectForSubtractRandomResourceValue1.val() || '';
                            const minValue = minValueInputForSubtractRandomResourceValue.val() || '';
                            const maxValue = maxValueInputForSubtractRandomResourceValue.val() || '';
                            autoChangeParameters = JSON.stringify({ resource, minValue, maxValue });
                            console.log('Resource, Min Value, Max Value:', { resource, minValue, maxValue });
                        }
                        break;
                    case 'subtractRandomGroupResourceValue':
                    case 'subtractRandomGroupResourceValue':
                        const resourceGroupSelect2 = $(this).find('select[name$="[resource_group]"]');
                        const minValueInput2 = $(this).find('input[name$="[min_value]"]');
                        const maxValueInput2 = $(this).find('input[name$="[max_value]"]');

                        console.log('Resource Group Select Element:', resourceGroupSelect2);
                        console.log('Min Value Input Element:', minValueInput2);
                        console.log('Max Value Input Element:', maxValueInput2);

                        if (resourceGroupSelect2.length === 0 ||
                            minValueInput2.length === 0 ||
                            maxValueInput2.length === 0) {
                            console.error('Не найдены элементы для типа subtractRandomGroupResourceValue.');
                            console.error('HTML контент контейнера:', $(this).html());
                        } else {
                            const resourceGroup = resourceGroupSelect2.val() || '';
                            const minValue = minValueInput2.val() || '';
                            const maxValue = maxValueInput2.val() || '';
                            autoChangeParameters = JSON.stringify({ resourceGroup, minValue, maxValue });
                            console.log('Resource Group, Min Value, Max Value:', { resourceGroup, minValue, maxValue });
                        }
                        break;
                    case 'subtractRandomResourceValue':
                        const resourceSelectForSubtractRandomResourceValue = $(this).find('select[name$="[resource]"]');
                        const valueInputForSubtractRandomResourceValue = $(this).find('input[name$="[value]"]');

                        console.log('Resource Select Element:', resourceSelectForSubtractRandomResourceValue);
                        console.log('Value Input Element:', valueInputForSubtractRandomResourceValue);

                        if (resourceSelectForSubtractRandomResourceValue.length === 0 || valueInputForSubtractRandomResourceValue.length === 0) {
                            console.error('Не найдены элементы для типа subtractRandomResourceValue.');
                            // Дополнительные отладочные данные
                            console.error('HTML контент контейнера:', $(this).html());
                        } else {
                            const resource = resourceSelectForSubtractRandomResourceValue.val() || '';
                            const value = valueInputForSubtractRandomResourceValue.val() || '';
                            autoChangeParameters = JSON.stringify({ resource, value });
                            console.log('Resource and Value:', { resource, value });
                        }
                        break;
                    case 'multiplyResources':
                    case 'divideResources':
                        // Обновленные селекторы, соответствующие именам полей в HTML
                        autoChangeParameters = {
                            resource_one: $(this).find(`select[name="auto-changes[${paragraphIndex}][resource_one]"]`).val() || '',
                            resource_two: $(this).find(`select[name="auto-changes[${paragraphIndex}][resource_two]"]`).val() || '',
                        };
                        console.log('Resources for Operation:', autoChangeParameters);
                        break;
                    case 'ifThen':
                        autoChangeParameters = {
                            condition: $(this).find(`input[name^="paragraphs[${paragraphIndex}][auto_changes][][condition]"]`).val() || '',
                            then_formula: $(this).find(`select[name^="paragraphs[${paragraphIndex}][auto_changes][][then_formula]"]`).val() || '',
                            else_formula: $(this).find(`select[name^="paragraphs[${paragraphIndex}][auto_changes][][else_formula]"]`).val() || ''
                        };
                        console.log('If-Then Parameters:', autoChangeParameters);
                        break;

                    case 'executeFormula':
                        const formulaSelectForExecuteFormula = $(this).find('select[name$="[formula]"]');
                        console.log('Formula Select Element:', formulaSelectForExecuteFormula);
                        console.log('HTML of the container:', $(this).html()); // Дополнительная информация о контейнере

                        if (formulaSelectForExecuteFormula.length === 0) {
                            console.error('Не найден элемент выбора формулы. Проверьте HTML и селектор.');
                        } else {
                            autoChangeParameters = formulaSelectForExecuteFormula.val() || '';
                            console.log('Execute Formula:', autoChangeParameters);
                        }
                        break;

                    case 'rollback':
                        autoChangeParameters = $(this).find(`input[name^="paragraphs[${paragraphIndex}][auto_changes][][rollback_steps]"]`).val() || '';
                        console.log('Rollback Steps:', autoChangeParameters);
                        break;
                    case 'grantAchievement':
                        const achievementInput = $(this).find(`input[name^="auto-changes[${autoChangeIndex}][achievement]"]`);
                        const achievementDescriptionInput = $(this).find(`input[name^="auto-changes[${autoChangeIndex}][achievement_description]"]`);
                        const achievementImageInput = $(this).find(`input[name^="auto-changes[${autoChangeIndex}][achievement_image]"]`)[0]?.files[0];
                        const achievementRoundedInput = $(this).find(`input[name^="auto-changes[${autoChangeIndex}][achievement_rounded]"]`).is(':checked');
                        const cornerRadiusInput = $(this).find(`input[name^="corner-radius"]`).val() || '0';

                        if (!achievementInput.length || !achievementDescriptionInput.length) {
                            console.error('Не найдены необходимые поля для достижения.');
                            return; // Прерываем выполнение, если не нашли поля
                        }

                        const achievement = achievementInput.val().trim();
                        const achievementDescription = achievementDescriptionInput.val().trim();

                        // Сохраняем файл изображения, если он есть
                        achievementImageFile = achievementImageInput || achievementImageFile;

                        autoChangeParameters = JSON.stringify({
                            achievement,
                            achievement_description: achievementDescription,
                            achievement_image: achievementImageFile ? achievementImageFile.name : '', // Сохраняем только имя файла
                            achievement_rounded: achievementRoundedInput,
                            corner_radius: cornerRadiusInput
                        });
                        console.log('Achievement Parameters:', autoChangeParameters);
                        break;
                    case 'savePoint':
                        console.log('Текущий элемент для savePoint:', $(this));

                        const savePointInput = $(this).find(`input[id="auto-change-save-point-${autoChangeIndex}"]`);
                        console.log('Поле для названия чекпоинта:', savePointInput);

                        if (savePointInput.length) {
                            const savePointName = savePointInput.val()?.trim() || '';
                            if (!autoChangeParameters) {
                                autoChangeParameters = {}; // Инициализируем, если не существует
                            }
                            autoChangeParameters.savePoint = savePointName; // Теперь это будет работать
                            console.log('Собранный чекпоинт:', savePointName);
                        } else {
                            console.error(`Не найдено поле для названия чекпоинта с индексом ${autoChangeIndex}.`);
                        }
                        break;


                    case 'explanation':
                        autoChangeParameters = $(this).find(`textarea[name^="paragraphs[${paragraphIndex}][auto_changes][][explanation]"]`).val() || '';
                        console.log('Explanation:', autoChangeParameters);
                        break;

                    default:
                        console.warn(`Неизвестный тип автоизменения: ${autoChangeType}`);
                        return; // Не добавляем автоизменение с неизвестным типом
                }

                if (!autoChangeType) {
                    console.warn(`AutoChange для параграфа ${paragraphIndex} имеет пустой тип.`);
                    return; // Не добавляем автоизменение без типа
                }

                const autoChange = {
                    type: autoChangeType,
                    parameters: typeof autoChangeParameters === 'object' ? JSON.stringify(autoChangeParameters) : autoChangeParameters
                };

                console.log('AutoChange:', autoChange);
                paragraph.autoChanges.push(autoChange);
            });

            console.log('Paragraph:', paragraph);
            paragraphs.push(paragraph);
        });

        const factGroups = [];
        $('.fact-group').each(function () {
            const groupIndex = $(this).data('index');
            const factGroup = {
                index: groupIndex || 0,
                name: $(this).find(`input[name="fact-group-name-${groupIndex}"]`).val()?.trim() || '',
                facts: []
            };

            $(this).find('.facts-container .form-group').each(function () {
                const fact = $(this).find(`input[name^="fact-groups[${groupIndex}][facts][]"]`).val()?.trim() || '';
                if (fact) {
                    factGroup.facts.push(fact);
                }
            });

            if (factGroup.facts.length > 0) {
                console.log('FactGroup:', factGroup);
                factGroups.push(factGroup);
            }
        });

        const resourceGroups = [];
        $('.resource-group').each(function () {
            const groupIndex = $(this).data('index');

            // Проверка существования элемента input для имени группы ресурсов
            const resourceNameInput = $(this).find(`#resource-group-name-${groupIndex}`);
            if (!resourceNameInput.length) {
                console.log(`Input for resource group name not found for groupIndex: ${groupIndex}`);
            }

            const resourceGroup = {
                index: groupIndex || 0,
                name: resourceNameInput.val()?.trim() || '',
                resources: []
            };

            // Проверка и логирование имени группы ресурсов
            console.log(`Group Index: ${groupIndex}, Group Name: ${resourceGroup.name}`);

            $(this).find('.resources-container .resource-item').each(function () {
                // Проверка существования элементов input для ресурсов
                const resourceName = $(this).find('input[name="resource-name"]');
                const resourceQuantity = $(this).find('input[name="resource-quantity"]');

                if (!resourceName.length) {
                    console.log(`Input for resource name not found within groupIndex: ${groupIndex}`);
                }

                if (!resourceQuantity.length) {
                    console.log(`Input for resource quantity not found within groupIndex: ${groupIndex}`);
                }

                const resource = {
                    name: resourceName.val()?.trim() || '',
                    quantity: resourceQuantity.val() || ''
                };

                if (resource.name) {
                    resourceGroup.resources.push(resource);
                }
            });

            if (resourceGroup.resources.length > 0) {
                console.log('ResourceGroup:', resourceGroup);
                resourceGroups.push(resourceGroup);
            }
        });

        // Логирование собранных данных
        console.log('Collected Resource Groups:', resourceGroups);


        const formulas = collectFormulasData();

        console.log('Собранные данные:');
        console.log('Параграфы:', paragraphs);
        console.log('Группы фактов:', factGroups);
        console.log('Группы ресурсов:', resourceGroups);
        console.log('Формулы:', formulas);

        return {
            paragraphs: paragraphs,
            factGroups: factGroups,
            resourceGroups: resourceGroups,
            formulas: formulas
        };
    }
    async function sendDataToServer() {
        console.log('Функция sendDataToServer вызвана');
        const plotTitleElement = $('#story-title');
        const plotTitle = plotTitleElement.val().trim();

        const storyData = collectData();

        console.log('Заголовок:', plotTitle);
        console.log('Собранные данные:', storyData);

        if (!plotTitle || !storyData || !storyData.paragraphs || storyData.paragraphs.length === 0) {
            console.error('Заголовок или параграфы не могут быть пустыми.');
            return;
        }

        const data = {
            title: plotTitle,
            paragraphs: storyData.paragraphs,
            factGroups: storyData.factGroups,
            resourceGroups: storyData.resourceGroups,
            formulas: storyData.formulas
        };

        // Загрузка изображения
        if (achievementImageFile) {
            console.log('Файл для загрузки:', achievementImageFile);
            const formData = new FormData();
            formData.append('file', achievementImageFile);
            formData.append('action', 'upload_achievement_image');
            formData.append('nonce', wp_vars.nonce);

            try {
                const response = await fetch(wp_vars.ajax_url, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (!response.ok) {
                    console.error('Ошибка загрузки изображения:', data.message || 'Неизвестная ошибка');
                    console.error('Ответ сервера:', data);
                } else if (data.success) {
                    console.log('Изображение загружено:', data.data.url);
                } else {
                    console.error('Ошибка загрузки изображения:', data.data.message);
                }
            } catch (error) {
                console.error('Ошибка отправки изображения:', error);
            }
        }

        console.log('Отправка данных на сервер:', data);

        jQuery.ajax({
            url: wp_vars.ajax_url,
            type: 'POST',
            data: {
                action: 'handle_story_construction',
                nonce: wp_vars.nonce,
                story_data: JSON.stringify(data)
            },
            success: function (response) {
                if (response.success) {
                    console.log('Сюжет успешно сохранен:', response);
                } else {
                    console.error('Ошибка от сервера:', response.data.message);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Ошибка отправки данных:', textStatus, errorThrown);
                console.error('Детали ошибки:', jqXHR.responseText);
            }
        });
    }


    $(document).ready(function () {
        $('#savePlotButton').on('click', function (event) {
            console.log('Обработчик клика запущен');
            event.preventDefault(); // Предотвращаем стандартное поведение
            console.log('Кнопка сохранения нажата');
            sendDataToServer();
        });
    });




    function initializeEventHandlers() {


        $('#add-fact-group-btn').off('click').on('click', function () {
            addFactGroup();
        });


        $('#fact-groups-container').off('click', '.add-fact-to-group-btn').on('click', '.add-fact-to-group-btn', function () {
            const factGroupIndex = $(this).closest('.fact-group').data('index');
            addFactToGroup(factGroupIndex);
        });

        $('#fact-groups-container').on('change', '.fact-group-limited', function () {
            const factGroupIndex = $(this).closest('.fact-group').data('index');
            const isLimited = $(this).val() === 'yes';
            $(`#fact-group-limit-container-${factGroupIndex}`).toggle(isLimited);
        });


        $(document).ready(function () {
            $('#add-formula-btn').on('click', function () {
                console.log('Кнопка "Добавить формулу" нажата');
                addFormula();
            });

            $('#formulas').on('change', '.auto-change-type', function () {
                console.log('Тип автоизменения изменен:', $(this).val());
                handleAutoChangeTypeChangeForFormula($(this));
            });
        });


        $('#story-paragraphs').off('click', '.add-action-btn').on('click', '.add-action-btn', function () {
            var paragraphIndex = $(this).closest('.story-paragraph').data('index');
            addActionForm(paragraphIndex);
        });

        $('#story-paragraphs').off('click', '.remove-action-btn').on('click', '.remove-action-btn', function () {
            $(this).closest('.action-form').remove();
        });

        $('#story-paragraphs').off('click', '.remove-paragraph-btn').on('click', '.remove-paragraph-btn', function () {
            $(this).closest('.story-paragraph').remove();
            updateNextParagraphOptions();
        });
        $('#add-auto-change-btn').click(function () {
            addAutoChange();
        });
        $('#fact-groups').off('click', '.remove-fact-group-btn').on('click', '.remove-fact-group-btn', function () {
            $(this).closest('.fact-group').remove();
            updateDropdowns();
        });
        $('#resource-groups').off('click', '.remove-resource-group-btn').on('click', '.remove-resource-group-btn', function () {
            $(this).closest('.resource-group').remove();
            updateDropdowns();
        });
        $(document).on('click', '#add-resource-group-btn', function () {
            addResourceGroup();
        });
        $(document).on('click', '.add-resource-to-group-btn', function () {
            var groupIndex = $(this).closest('.resource-group').data('index');
            addResourceToGroup(groupIndex);
        });
        $(document).on('click', '.remove-resource-group-btn', function () {
            var groupIndex = $(this).closest('.resource-group').data('index');
            removeResourceGroup(groupIndex);
        });
        $(document).on('click', '.remove-resource-btn', function () {
            var groupIndex = $(this).closest('.resource-group').data('index');
            var resourceIndex = $(this).closest('.resource-item').index();
            removeResourceFromGroup(groupIndex, resourceIndex);
        });
        $(document).on('click', '#save-resources-btn', function () {
            saveResources();
        });
        $('#formulas-list').off('click', '.remove-formula-btn').on('click', '.remove-formula-btn', function () {
            $(this).closest('.formula').remove();
            updateDropdowns();
        });


        $('#formulas-list').on('change', '.auto-change-type', function () {
            const type = $(this).val();
            const formula = $(this).closest('.formula');
            const parametersContainer = formula.find('.auto-change-parameters');
            parametersContainer.empty();

            switch (type) {
                case 'addFact':
                case 'removeFact':
                case 'addRandomFact':
                case 'removeRandomFact':
                case 'addAllFactsGroup':
                case 'removeAllFactsGroup':
                    parametersContainer.append(`
                        <div class="form-group">
                            <label for="auto-change-fact-${formulaIndex}">Факт:</label>
                            <select id="auto-change-fact-${formulaIndex}" name="formulas[${formulaIndex}][fact]" class="form-control fact-dropdown">
                                <!-- Опции будут добавлены динамически -->
                            </select>
                        </div>
                    `);
                    break;

                case 'setResourceValue':
                case 'addResourceValue':
                case 'addOtherResourceValue':
                case 'addRandomResourceValue':
                case 'addRandomGroupResourceValue':
                case 'subtractResourceValue':
                case 'subtractOtherResourceValue':
                case 'subtractRandomResourceValue':
                case 'subtractRandomGroupResourceValue':
                case 'multiplyResources':
                case 'divideResources':
                    parametersContainer.append(`
                        <div class="form-group">
                            <label for="auto-change-resource-${formulaIndex}">Расходник:</label>
                            <select id="auto-change-resource-${formulaIndex}" name="formulas[${formulaIndex}][resource]" class="form-control resource-dropdown">
                                <!-- Опции будут добавлены динамически -->
                            </select>
                        </div>
                    `);
                    break;

                case 'executeFormula':
                    parametersContainer.append(`
                        <div class="form-group">
                            <label for="auto-change-formula-${formulaIndex}">Формула:</label>
                            <select id="auto-change-formula-${formulaIndex}" name="formulas[${formulaIndex}][formula]" class="form-control formula-dropdown">
                                <!-- Опции будут добавлены динамически -->
                            </select>
                        </div>
                    `);
                    break;
            }
        });

        $('#save-button').click(function () {
            saveResources();
            updateParagraphsWithResources();
        });
        $('#story-paragraphs').off('click', '.add-auto-change-btn').on('click', '.add-auto-change-btn', function () {
            var paragraphIndex = $(this).closest('.story-paragraph').data('index');
            addAutoChangeForm(paragraphIndex);
        });

        $('#story-paragraphs').off('click', '.remove-auto-change-btn').on('click', '.remove-auto-change-btn', function () {
            $(this).closest('.auto-change').remove();
        });
        $('#save-formulas-btn').click(function () {
            saveFormulas();
        });
    }
    updateNextParagraphOptions();
    initializeEventHandlers();
    updateDropdowns();
    handleAutoChangeTypeChange();
});