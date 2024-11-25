jQuery(document).ready(function($) {
    let currentParagraphIndex = 0;
    let storyData = {};
    let playerFacts = {}; // Хранилище фактов игрока
    let playerResources = {}; // Хранилище ресурсов игрока
    let resourceGroups = [];
    const gameStateHistory = [];
    const storyTitle = $('#story-title');
    const storyContent = $('#story-content');
    const storyActions = $('#story-actions');
    const nextButton = $('#next-paragraph');
    const storyMedia = $('#story-media'); // Элемент для отображения медиа

    function loadStory(storyId) {
        console.log('Loading story with ID:', storyId); // Отладка
        $.ajax({
            url: wp_vars.ajax_url,
            type: 'POST',
            data: {
                action: 'load_interactive_story_data', // Новое значение action
                story_id: storyId,
                nonce: wp_vars.nonce // Передача nonce для безопасности
            },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    storyData = response.data;
                    console.log('Loaded story data:', storyData);
                    console.log('Player resources:', playerResources);
    
                    displayParagraph(currentParagraphIndex);
                } else {
                    console.error('Error loading story:', response.data.message);
                    showErrorMessage('Ошибка загрузки истории: ' + response.data.message);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('AJAX Error:', textStatus, errorThrown);
                console.error('Response Text:', jqXHR.responseText);
                showErrorMessage('Ошибка AJAX: ' + textStatus);
            }
        });
    }
    $('.story-comment-form').on('submit', function(e) {
        e.preventDefault(); // Предотвращаем стандартное поведение формы
    
        var formData = $(this).serialize(); // Собираем данные формы
        formData += '&nonce=' + wp_vars.nonce; // Добавляем nonce для безопасности
    
        console.log('Отправка данных:', formData); // Логируем данные формы для отладки
    
        $.post(wp_vars.ajax_url, formData + '&action=add_story_comment', function(response) {
            console.log('Ответ от сервера:', response); // Логируем ответ от сервера
    
            if (response.success) {
                $('#comment-response').html('<p>' + response.data.message + '</p>'); // Отображаем успех
                $('.story-comment-form')[0].reset(); // Очищаем форму
            } else {
                $('#comment-response').html('<p>' + response.data.message + '</p>'); // Отображаем ошибку
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Ошибка при отправке:', textStatus, errorThrown); // Логируем ошибку
        });
    });
    function displayParagraph(index) {
        console.log('Displaying paragraph index:', index); // Отладка
        if (storyData.paragraphs && storyData.paragraphs[index]) {
            const paragraph = storyData.paragraphs[index];
            storyTitle.text(paragraph.title);
            storyContent.html(paragraph.text);
            storyActions.empty();
            storyMedia.empty();
            nextButton.hide();
    
            // Применение автоматических изменений
            if (paragraph.autoChanges && paragraph.autoChanges.length > 0) {
                applyAutoChanges(paragraph.autoChanges);
            }
    
            // Обновление отображения фактов игрока после применения автоматических изменений
            updatePlayerFactsDisplay();
    
            // Отображение изображений
            if (paragraph.images && paragraph.images.length > 0) {
                paragraph.images.forEach(imageUrl => {
                    const img = $('<img>')
                        .attr('src', imageUrl)
                        .attr('alt', 'Story image')
                        .css({ 'max-width': '100%', 'height': 'auto' });
                    storyMedia.append(img);
                });
            }
    
            // Отображение видео
            if (paragraph.videos && paragraph.videos.length > 0) {
                paragraph.videos.forEach(videoUrl => {
                    const video = $('<video controls>')
                        .attr('src', videoUrl)
                        .css({ 'max-width': '100%', 'height': 'auto' });
                    storyMedia.append(video);
                });
            }
    
            // Проверка наличия доступных действий
            let hasAvailableActions = false;
            if (paragraph.actions && paragraph.actions.length > 0) {
                paragraph.actions.forEach(action => {
                    const nextParagraphValue = action.nextParagraph;
                    const requiredFact = action.requiredFact;
                    const requiredResource = action.requiredResource;
                    const resourceQuantity = parseInt(action.resourceQuantity, 10);
                    let isActionAvailable = true;
    
                    if (requiredFact && !playerFacts[requiredFact]) {
                        isActionAvailable = false;
                    }
    
                    if (requiredResource) {
                        const availableQuantity = playerResources[requiredResource] || 0;
                        console.log(`Checking resource: ${requiredResource}, Required: ${resourceQuantity}, Available: ${availableQuantity}`);
                        if (availableQuantity < resourceQuantity) {
                            isActionAvailable = false;
                        }
                    }
    
                    // Генерация кнопки действия с учётом типа действия
                    const actionButton = $('<button>')
                        .text(action.title)
                        .prop('disabled', !isActionAvailable)
                        .on('click', function() {
                            // Проверка наличия требуемых фактов и ресурсов
                            if (requiredFact && !playerFacts[requiredFact]) {
                                showErrorMessage('Для выполнения этого действия нужен факт: ' + requiredFact);
                                return;
                            }
    
                            if (requiredResource) {
                                const availableQuantity = playerResources[requiredResource] || 0;
                                if (availableQuantity < resourceQuantity) {
                                    showErrorMessage(`Для выполнения этого действия нужно: ${requiredResource} в количестве ${resourceQuantity}`);
                                    return;
                                }
                                playerResources[requiredResource] -= resourceQuantity;
                                console.log(`Resource ${requiredResource} used, remaining: ${playerResources[requiredResource]}`);
                            }
    
                            // Переход к следующему параграфу
                            const nextParagraphIndex = parseInt(nextParagraphValue, 10);
                            if (!isNaN(nextParagraphIndex) && nextParagraphIndex >= 0) {
                                currentParagraphIndex = storyData.paragraphs.findIndex(p => p.index == nextParagraphIndex);
                                if (currentParagraphIndex !== -1) {
                                    displayParagraph(currentParagraphIndex);
                                } else {
                                    console.error('Invalid paragraph index:', nextParagraphIndex);
                                    showErrorMessage('Ошибка: Некорректный индекс следующего параграфа.');
                                }
                            } else {
                                console.error('Invalid nextParagraph value:', nextParagraphValue);
                                showErrorMessage('Ошибка: Некорректное значение nextParagraph.');
                            }
                        });
    
                    // В зависимости от типа действия показываем соответствующие формы
                    if (action.type === 'single-choice') {
                        const choicesContainer = $('<div>').addClass('choices-container');
                        action.choices.forEach(choice => {
                            const choiceButton = $('<button>')
                                .text(choice.title)
                                .on('click', function() {
                                    console.log(`Choice selected: ${choice.title}`);
                                    // Логика обработки выбора
                                    if (choice.nextParagraph) {
                                        displayParagraph(choice.nextParagraph);
                                    }
                                });
                            choicesContainer.append(choiceButton);
                        });
                        actionButton.after(choicesContainer);
                    } else if (action.type === 'multiple-choice') {
                        const multipleChoiceContainer = $('<div>').addClass('multiple-choice-container');
                        action.choices.forEach(choice => {
                            const checkbox = $('<input>')
                                .attr('type', 'checkbox')
                                .attr('name', 'multiple-choice')
                                .val(choice.title);
                            const label = $('<label>').text(choice.title);
                            multipleChoiceContainer.append(checkbox).append(label);
                        });
                        actionButton.after(multipleChoiceContainer);
                    } else if (action.type === 'matching') {
                        const matchingContainer = $('<div>').addClass('matching-container');
                        action.matching.forEach(item => {
                            const leftItem = $('<input>').val(item.left).prop('disabled', true);
                            const rightItem = $('<input>').val(item.right).prop('disabled', true);
                            matchingContainer.append(leftItem).append(rightItem);
                        });
                        actionButton.after(matchingContainer);
                    }
    
                    // Объединение кнопки действия и подсказки
                    const tooltipIcon = $('<span>')
                        .addClass('tooltip-icon')
                        .attr('title', action.text)
                        .text('ℹ️');
                    const actionContainer = $('<div>')
                        .addClass('action-container')
                        .append(actionButton)
                        .append(tooltipIcon);
    
                    storyActions.append(actionContainer);
                    if (isActionAvailable) {
                        hasAvailableActions = true;
                    }
                });
                storyActions.show();
            }
    
            if (!hasAvailableActions && !storyData.paragraphs[index + 1]) {
                storyContent.html('Вы проиграли. Конец истории.');
                storyActions.hide();
                nextButton.hide();
            } else if (!hasAvailableActions) {
                nextButton.show();
            }
        } else {
            storyContent.html('Нет больше контента.');
            storyActions.hide();
            nextButton.hide();
        }
    }
    // Функция для обновления отображения фактов игрока
    function updatePlayerFactsDisplay() {
        const factsContainer = $('#player-facts');
        factsContainer.empty(); // Очищаем предыдущие факты
    
        // Добавляем факты игрока в контейнер
        if (Object.keys(playerFacts).length > 0) {
            const factsList = $('<ul>');
            for (const fact in playerFacts) {
                if (playerFacts[fact]) {
                    factsList.append($('<li>').text(fact));
                }
            }
            factsContainer.append(factsList);
        } else {
            factsContainer.append('<p>У вас нет фактов.</p>');
        }
    }
    function findFactGroupByName(groupName) {
        if (storyData.factGroups && Array.isArray(storyData.factGroups)) {
            return storyData.factGroups.find(group => group.name === groupName);
        } else {
            console.warn('Fact groups are undefined or not an array.');
            return null;
        }
    }
    function findResourceGroupByIndex(index) {
        return storyData.resourceGroups.find(group => group.index === index);
    }
    
    
    function updateResourceDisplay() {
        const resourcesList = document.getElementById('resources-list');
        resourcesList.innerHTML = ''; // Очищаем старое содержимое
    
        // Проходим по всем ресурсам игрока и добавляем их в список
        for (const resource in playerResources) {
            if (playerResources.hasOwnProperty(resource)) {
                const resourceItem = document.createElement('li');
                resourceItem.textContent = `${resource}: ${playerResources[resource]}`;
                resourcesList.appendChild(resourceItem);
            }
        }
    }
    function findResourceByName(resourceName) {
        for (const group of storyData.resourceGroups) {
            const resource = group.resources.find(res => res.name === resourceName);
            if (resource) {
                return resource; // Возвращаем ресурс, если найден
            }
        }
        return null; // Если ресурс не найден
    }
    function findFormulaByName(formulaName) {
        return storyData.formulas.find(formula => formula.name === formulaName);
    }
    function saveGameState() {
        const currentState = {
            resources: JSON.parse(JSON.stringify(playerResources)),
            facts: JSON.parse(JSON.stringify(playerFacts)),
        };
        gameStateHistory.push(currentState);
    }
    
    function applyAutoChanges(autoChanges) {
        autoChanges.forEach(change => {
            const changeType = change.type;
            let changeParameters;
    
            // Пробуем выполнить JSON.parse, если это не простая строка
            try {
                // Если параметры выглядят как объект (например, содержат фигурные скобки), пробуем выполнить JSON.parse
                if (change.parameters.startsWith('{') || change.parameters.startsWith('[')) {
                    changeParameters = JSON.parse(change.parameters);
                } else {
                    changeParameters = change.parameters; // Это просто строка
                }
            } catch (error) {
                console.error('Error parsing parameters:', error);
                changeParameters = change.parameters; // Оставляем как строку на случай ошибки
            }
            let factGroupName, factGroup, resourceName, resourceValue, resourceGroup;
    
            switch (changeType) {
                // Изменения фактов
                case 'addFact':
                    const factName = change.parameters; 
                    if (factName) {
                        addFactToGame(factName);
                    } else {
                        console.warn('Fact name is undefined or null.');
                    }
                    break;
    
                case 'removeFact':
                    const removeFactName = change.parameters; 
                    if (removeFactName) {
                        removeFactFromGame(removeFactName);
                    } else {
                        console.warn('Fact name is undefined or null.');
                    }
                    break;
    
                case 'addRandomFact':
                    factGroupName = change.parameters;
                    factGroup = findFactGroupByName(factGroupName);
                    if (factGroup && Array.isArray(factGroup.facts)) {
                        addRandomFact(factGroup.facts);
                    } else {
                        console.warn('Fact group is undefined, null, or not an array.');
                    }
                    break;
    
                case 'removeRandomFact':
                    factGroupName = change.parameters;
                    factGroup = findFactGroupByName(factGroupName);
                    if (factGroup && Array.isArray(factGroup.facts)) {
                        removeRandomFact(factGroup.facts);
                    } else {
                        console.warn('Fact group is undefined, null, or not an array.');
                    }
                    break;
    
                case 'addAllFactsGroup':
                    factGroupName = change.parameters;
                    factGroup = findFactGroupByName(factGroupName);
                    if (factGroup && Array.isArray(factGroup.facts)) {
                        addAllFactsGroup(factGroup.facts);
                    } else {
                        console.warn('Fact group is undefined, null, or not an array.');
                    }
                    break;
                    case 'rollback':
                    try {
                        const rollbackSteps = parseInt(change.parameters, 10); // Получаем количество шагов для отката
                        if (!isNaN(rollbackSteps) && rollbackSteps > 0) {
                            console.log(`Откат на ${rollbackSteps} шагов назад.`); 
                            rollbackGameState(rollbackSteps); // Вызываем функцию для отката
                        } else {
                            console.warn('Некорректное значение для отката.');
                        }
                    } catch (error) {
                        console.error('Ошибка при разборе параметров отката:', error);
                    }
                    break;

                case 'removeAllFactsGroup':
                    factGroupName = change.parameters;
                    factGroup = findFactGroupByName(factGroupName);
                    if (factGroup && Array.isArray(factGroup.facts)) {
                        removeAllFactsGroup(factGroup.facts);
                    } else {
                        console.warn('Fact group is undefined, null, or not an array.');
                    }
                    break;
                    case 'setResourceValue':
                setResourceValue(changeParameters.resource, parseInt(changeParameters.value, 10));
                break;
                case 'subtractResourceValue':
                    const resourceNameSubtract = changeParameters.resource; // Получаем имя ресурса
                    const resourceValueSubtract = parseInt(changeParameters.value, 10); // Получаем значение для вычитания
                    if (resourceNameSubtract && !isNaN(resourceValueSubtract)) {
                        subtractResourceValue(resourceNameSubtract, resourceValueSubtract); // Вызываем функцию вычитания значения
                    }
                    break;


                    case 'subtractResourceValue':
                        try {
                            const resourceParams = JSON.parse(change.parameters); // Преобразуем строку параметров в объект
                            const resourceNameSubtract = resourceParams.resource; // Имя ресурса
                            const resourceValueSubtract = parseInt(resourceParams.value, 10); // Значение, которое нужно вычесть
                    
                            if (resourceNameSubtract && !isNaN(resourceValueSubtract)) {
                                subtractResourceValue(resourceNameSubtract, resourceValueSubtract); // Вызываем функцию вычитания
                            } else {
                                console.warn('Неверные параметры для вычитания ресурса.');
                            }
                        } catch (error) {
                            console.error('Ошибка при разборе параметров:', error);
                        }
                        break;
                    
        case 'equalizeResources':
            const resource1 = changeParameters.resource_one; // Получаем resource_one
            const resource2 = changeParameters.resource_two; // Получаем resource_two
            if (resource1 && resource2) {
                equalizeResources(resource1, resource2); // Уравниваем ресурсы
            }
            break;
        default:

        case 'addRandomResourceValue':
            try {
                const resourceParams = JSON.parse(change.parameters); // Преобразуем строку в объект
                const resourceName = resourceParams.resource; // Получаем имя ресурса
                const minValue = parseInt(resourceParams.min_value, 10); // Минимальное значение
                const maxValue = parseInt(resourceParams.max_value, 10); // Максимальное значение
        
                // Проверяем, есть ли ресурс у игрока
                if (playerResources.hasOwnProperty(resourceName)) {
                    const randomValue = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue; // Генерируем случайное значение
                    playerResources[resourceName] += randomValue; // Добавляем случайное количество ресурса
                    updateResourceDisplay(); // Обновляем интерфейс с отображением ресурсов
                    console.log(`Добавлено случайное значение ${randomValue} к ресурсу ${resourceName}. Текущее количество: ${playerResources[resourceName]}`);
                } else {
                    console.warn(`Ресурс "${resourceName}" не найден у игрока. Ничего не происходит.`);
                }
            } catch (error) {
                console.error('Error parsing parameters:', error);
            }
            break;
            case 'executeFormula':
    const formulaName = change.parameters; // Должно быть имя формулы, например "Тест"
    const formula = findFormulaByName(formulaName); // Проверяем, найдена ли формула

    if (formula && formula.autoChanges) {
        formula.autoChanges.forEach(autoChange => {
            applyAutoChanges([autoChange]); // Применяем автоизменения
        });
    } else {
        console.warn(`Формула с именем "${formulaName}" не найдена.`);
    }
    break;


            case 'subtractRandomResourceValue':
    try {
        const resourceParams = JSON.parse(change.parameters); // Преобразуем строку в объект
        const resourceName = resourceParams.resource; // Получаем имя ресурса
        const minValue = parseInt(resourceParams.minValue, 10); // Минимальное значение
        const maxValue = parseInt(resourceParams.maxValue, 10); // Максимальное значение

        // Проверяем, есть ли ресурс у игрока
        if (playerResources.hasOwnProperty(resourceName)) {
            const randomValue = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue; // Генерируем случайное значение
            subtractRandomResourceValue(resourceName, randomValue); // Вычитаем случайное количество ресурса
            updateResourceDisplay(); // Обновляем интерфейс с отображением ресурсов
        } else {
            console.warn(`Ресурс "${resourceName}" не найден у игрока. Ничего не происходит.`);
        }
    } catch (error) {
        console.error('Error parsing parameters:', error);
    }
    break;

            case 'subtractOtherResourceValue':
    try {
        const subtractParams = JSON.parse(change.parameters); // Преобразуем параметры в объект
        const resourceOne = subtractParams.resource_one; // Получаем имя первого ресурса
        const resourceTwo = subtractParams.resource_two; // Получаем имя второго ресурса

        // Проверяем, есть ли оба ресурса у игрока
        if (playerResources.hasOwnProperty(resourceOne) && playerResources.hasOwnProperty(resourceTwo)) {
            const valueToSubtract = playerResources[resourceTwo]; // Используем количество второго ресурса для вычитания
            subtractResourceValue(resourceOne, valueToSubtract); // Вычитаем у первого ресурса
        } else {
            console.warn(`Ресурс "${resourceOne}" или "${resourceTwo}" не найден у игрока. Ничего не происходит.`);
        }
    } catch (error) {
        console.error('Error parsing parameters:', error);
    }
    break;

            case 'addRandomGroupResourceValue':
                try {
                    const resourceParams = JSON.parse(change.parameters); // Преобразуем строку параметров в объект
                    const resourceGroupIndex = parseInt(resourceParams.resource_group, 10); // Получаем индекс группы ресурсов
                    const minValue = parseInt(resourceParams.min_value, 10); // Минимальное значение
                    const maxValue = parseInt(resourceParams.max_value, 10); // Максимальное значение
            
                    // Вызываем вспомогательную функцию для добавления случайных значений ресурсам
                    addRandomValuesToGroupResources(resourceGroupIndex, minValue, maxValue);
                } catch (error) {
                    console.error('Ошибка при разборе параметров:', error);
                }
                break;
                case 'subtractRandomGroupResourceValue':
                    try {
                        const resourceParams = JSON.parse(change.parameters); // Преобразуем строку параметров в объект
                        const resourceGroupIndex = parseInt(resourceParams.resourceGroup, 10); // Получаем индекс группы ресурсов
                        const minValue = parseInt(resourceParams.minValue, 10); // Минимальное значение
                        const maxValue = parseInt(resourceParams.maxValue, 10); // Максимальное значение
                
                        // Вызываем вспомогательную функцию для вычитания случайных значений из ресурсов группы
                        subtractRandomValuesFromGroupResources(resourceGroupIndex, minValue, maxValue);
                    } catch (error) {
                        console.error('Ошибка при разборе параметров:', error);
                    }
                    break;
                
        case 'addOtherResourceValue':
    // Разбираем параметры
    const resourceParams = JSON.parse(change.parameters); // Преобразуем строку в объект
    const sourceResource = resourceParams.resource_one; // Получаем ресурс 1
    const targetResource = resourceParams.resource_two; // Получаем ресурс 2

    console.log('Resource One:', sourceResource);
    console.log('Resource Two:', targetResource);

    // Проверяем существование ресурсов у игрока
    if (sourceResource && targetResource) {
        addOtherResourceValue(targetResource, sourceResource); // Меняем местами, чтобы добавлять к первому
    } else {
        console.warn('Resource one or two is undefined.');
    }
    break;



        

    case 'subtractRandomGroupResourceValue':
        const resourceGroupRandomSubtract = findResourceGroupByName(change.parameters.groupName); // Поиск по имени группы
        if (resourceGroupRandomSubtract && Array.isArray(resourceGroupRandomSubtract.resources)) {
            subtractRandomGroupResourceValue(resourceGroupRandomSubtract.resources);
        } else {
            console.warn('Resource group is undefined, null, or not an array.');
        }
        break;
        case 'multiplyResources':
    try {
        const resourceParams = JSON.parse(change.parameters); // Преобразуем строку параметров в объект
        const resourceOne = resourceParams.resource_one; // Получаем имя первого ресурса
        const resourceTwo = resourceParams.resource_two; // Получаем имя второго ресурса
        
        console.log(`Начало умножения ресурсов: ${resourceOne} и ${resourceTwo}`); // Отладочная информация
        
        // Вызываем функцию для умножения ресурсов
        multiplyResources(resourceOne, resourceTwo);
    } catch (error) {
        console.error('Ошибка при разборе параметров:', error);
    }
    break;
    case 'divideResources':
    try {
        const resourceParams = JSON.parse(change.parameters); // Преобразуем строку параметров в объект
        const resourceOne = resourceParams.resource_one; // Получаем имя ресурса, который будем делить
        const resourceTwo = resourceParams.resource_two; // Получаем имя ресурса, на который будем делить
        
        console.log(`Начало деления ресурсов: ${resourceOne} на ${resourceTwo}`); // Отладочная информация
        
        // Вызываем функцию для деления ресурсов
        divideResources(resourceOne, resourceTwo);
    } catch (error) {
        console.error('Ошибка при разборе параметров:', error);
    }
    break;
                // Добавление и удаление ресурсов
                case 'addResource':
                const params = JSON.parse(change.parameters);
                const resourceNameToAdd = params.resource; // Переименовываем переменную для добавления ресурса

                const resourceToAdd = findResourceByName(resourceNameToAdd); // Ищем ресурс по имени

                if (resourceToAdd) {
                    const resourceQuantity = parseInt(resourceToAdd.quantity, 10);
                    addResourceToGame(resourceNameToAdd, resourceQuantity); // Добавляем ресурс игроку
                } else {
                    console.warn('Resource not found:', resourceNameToAdd);
                }
                break;

                case 'deleteResource':
                const paramsDelete = JSON.parse(change.parameters);
                const resourceToDelete = paramsDelete.resource; // Получаем имя ресурса для удаления

                if (resourceToDelete) {
                    deleteResourceFromGame(resourceToDelete); // Удаляем ресурс
                }
                break;

                case 'addGroupResource':
                    const paramsAddGroup = JSON.parse(change.parameters);
                    const groupToAdd = findResourceGroupByIndex(parseInt(paramsAddGroup.resourceGroup, 10)); // Получаем группу по индексу
    
                    if (groupToAdd && Array.isArray(groupToAdd.resources)) {
                        groupToAdd.resources.forEach(resource => {
                            const resourceQuantity = parseInt(resource.quantity, 10); // Количество ресурса
                            addResourceToGame(resource.name, resourceQuantity); // Передаем имя ресурса и его количество
                        });
                        console.log(`Added resources from group ${paramsAddGroup.resourceGroup}:`, groupToAdd.resources);
                    } else {
                        console.warn('Resource group is undefined, null, or not an array.');
                    }
                    break;
    
                case 'deleteGroupResource':
                    const paramsDeleteGroup = JSON.parse(change.parameters);
                    const groupToDelete = findResourceGroupByIndex(parseInt(paramsDeleteGroup.resourceGroup, 10)); // Получаем группу по индексу
    
                    if (groupToDelete && Array.isArray(groupToDelete.resources)) {
                        groupToDelete.resources.forEach(resource => {
                            deleteResourceFromGame(resource.name); // Удаляем каждый ресурс из группы
                        });
                        console.log(`Deleted resources from group ${paramsDeleteGroup.resourceGroup}:`, groupToDelete.resources);
                    } else {
                        console.warn('Resource group is undefined, null, or not an array.');
                    }
                    break;
    
            }
        });
    
        console.log('Player facts after autoChanges:', playerFacts);
    }
    
    function rollbackGameState(steps) {
        if (steps > gameStateHistory.length) {
            console.warn('Невозможно выполнить откат: недостаточно сохранённых состояний.');
            return;
        }
    
        for (let i = 0; i < steps; i++) {
            gameStateHistory.pop(); // Удаляем последние состояния
        }
    
        // Восстанавливаем предыдущее состояние
        const previousState = gameStateHistory[gameStateHistory.length - 1];
        if (previousState) {
            playerResources = previousState.resources;
            playerFacts = previousState.facts;
            updateResourceDisplay(); // Обновляем интерфейс
            console.log('Откат выполнен. Текущее состояние:', previousState);
        } else {
            console.warn('Нет сохранённых состояний для восстановления.');
        }
    }

    function addFactToGame(factName) {
        if (!playerFacts[factName]) {
            playerFacts[factName] = true; // Добавляем факт игрока
            console.log(`Fact added: ${factName}`);
        }
    }

    function removeFactFromGame(factName) {
        if (playerFacts[factName]) {
            delete playerFacts[factName]; // Удаляем факт игрока
            console.log(`Fact removed: ${factName}`);
        }
    }
    function addRandomFact(factGroup) {
        const randomIndex = Math.floor(Math.random() * factGroup.length);
        const randomFact = factGroup[randomIndex];
        if (!playerFacts[randomFact]) {
            playerFacts[randomFact] = true; // Добавляем случайный факт игрока
            console.log(`Random fact added: ${randomFact}`);
        } else {
            console.log(`Random fact ${randomFact} already exists.`);
        }
    }
    
    function removeRandomFact(factGroup) {
        const availableFacts = factGroup.filter(fact => playerFacts[fact]);
        if (availableFacts.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableFacts.length);
            const randomFact = availableFacts[randomIndex];
            delete playerFacts[randomFact]; // Удаляем случайный факт
            console.log(`Random fact removed: ${randomFact}`);
        } else {
            console.log('No facts from the group to remove.');
        }
    }
    
    function addAllFactsGroup(factGroup) {
        factGroup.forEach(fact => {
            if (!playerFacts[fact]) {
                playerFacts[fact] = true; // Добавляем все факты из группы
                console.log(`Fact added: ${fact}`);
            }
        });
    }
    
    function removeAllFactsGroup(factGroup) {
        factGroup.forEach(fact => {
            if (playerFacts[fact]) {
                delete playerFacts[fact]; // Удаляем все факты из группы
                console.log(`Fact removed: ${fact}`);
            }
        });
    }
    function changeResource(resourceName, value) {
        if (playerResources.hasOwnProperty(resourceName)) {
            playerResources[resourceName] += value; // Изменяем текущее значение ресурса
        } else {
            playerResources[resourceName] = value; // Если ресурс не найден, создаем его
        }
        updateResourceDisplay(); // Обновляем отображение
    }
    function setResourceValue(resourceName, resourceValue) {
        if (playerResources.hasOwnProperty(resourceName)) {
            playerResources[resourceName] = resourceValue; // Устанавливаем новое значение
            console.log(`Resource ${resourceName} set to value: ${resourceValue}`);
            
            // Обновляем отображение ресурсов после изменения
            updateResourceDisplay();
        } else {
            console.warn(`Resource ${resourceName} not found for the player.`);
        }
    }
    
    function subtractRandomResourceValue(resourceName, randomValue) {
        // Проверяем, есть ли ресурс у игрока
        if (playerResources.hasOwnProperty(resourceName)) {
            // Вычитаем случайное значение из текущего количества ресурса
            playerResources[resourceName] -= randomValue;
    
            // Если количество ресурса стало <= 0, удаляем его
            if (playerResources[resourceName] <= 0) {
                delete playerResources[resourceName];
            }
    
            // Обновляем отображение ресурсов
            updateResourceDisplay();
            
            console.log(`Вычтено случайное значение ${randomValue} из ресурса ${resourceName}. Текущее количество: ${playerResources[resourceName]}`);
        } else {
            console.warn(`Ресурс "${resourceName}" не найден у игрока. Никаких изменений не сделано.`);
        }
    }
    function multiplyResources(resourceOne, resourceTwo) {
        // Проверяем наличие обоих ресурсов у игрока
        if (playerResources.hasOwnProperty(resourceOne) && playerResources.hasOwnProperty(resourceTwo)) {
            const originalValue = parseInt(playerResources[resourceOne], 10); // Преобразуем в число исходное значение
            const multiplierValue = parseInt(playerResources[resourceTwo], 10); // Преобразуем в число множитель
    
            console.log(`Перед умножением: resource_one: ${originalValue}, resource_two: ${multiplierValue}`); // Отладочная информация
            
            if (!isNaN(originalValue) && !isNaN(multiplierValue)) {
                // Умножаем количество первого ресурса на количество второго
                playerResources[resourceOne] = originalValue * multiplierValue;
    
                console.log(`Ресурс ${resourceOne} умножен на ${resourceTwo}. Исходное количество: ${originalValue}, множитель: ${multiplierValue}, новое количество: ${playerResources[resourceOne]}`);
            
                // Обновляем интерфейс отображения ресурсов
                updateResourceDisplay();
            } else {
                console.warn(`Не удалось преобразовать ресурсы в числа. resource_one: ${originalValue}, resource_two: ${multiplierValue}`);
            }
        } else {
            console.warn(`Один или оба ресурса не найдены у игрока. resource_one: ${resourceOne}, resource_two: ${resourceTwo}`);
        }
    }
    function addResourceValue(resourceName, resourceValue) {
        if (playerResources.hasOwnProperty(resourceName)) {
            playerResources[resourceName] += resourceValue; // Добавляем значение к текущему количеству
            console.log(`Resource ${resourceName} increased by ${resourceValue}. New value: ${playerResources[resourceName]}`);
            updateResourceDisplay(); // Обновляем отображение
        } else {
            console.warn(`Resource ${resourceName} not found for the player. No changes made.`);
        }
    }
    function subtractResourceValue(resourceName, resourceValue) {
        // Проверяем, есть ли у игрока данный ресурс
        if (playerResources.hasOwnProperty(resourceName)) {
            // Вычитаем значение из текущего количества ресурса
            playerResources[resourceName] -= resourceValue;
    
            // Если количество ресурса стало меньше или равно нулю, удаляем его
            if (playerResources[resourceName] <= 0) {
                delete playerResources[resourceName];
                console.log(`Resource ${resourceName} was removed, as its value is now ${playerResources[resourceName]}.`);
            } else {
                console.log(`Resource ${resourceName} decreased by ${resourceValue}. New value: ${playerResources[resourceName]}`);
            }
    
            // Обновляем отображение ресурсов
            updateResourceDisplay();
        } else {
            console.warn(`Resource ${resourceName} not found for the player. No changes made.`);
        }
    }
    
    function subtractRandomValuesFromGroupResources(groupIndex, minValue, maxValue) {
        // Находим группу ресурсов по индексу
        const resourceGroup = findResourceGroupByIndex(groupIndex);
    
        if (resourceGroup && Array.isArray(resourceGroup.resources)) {
            // Проходим по каждому ресурсу в группе
            resourceGroup.resources.forEach(resource => {
                const resourceName = resource.name;
    
                // Проверяем, есть ли у игрока этот ресурс
                if (playerResources.hasOwnProperty(resourceName)) {
                    // Генерируем случайное количество для этого ресурса
                    const randomValue = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
    
                    // Вычитаем случайное количество из текущего количества ресурса
                    playerResources[resourceName] -= randomValue;
    
                    // Если количество ресурса стало <= 0, удаляем его
                    if (playerResources[resourceName] <= 0) {
                        delete playerResources[resourceName];
                    }
    
                    console.log(`Вычтено случайное значение ${randomValue} из ресурса ${resourceName}. Текущее количество: ${playerResources[resourceName]}`);
                } else {
                    console.warn(`Ресурс "${resourceName}" из группы не найден у игрока. Пропускаем.`);
                }
            });
    
            // Обновляем интерфейс отображения ресурсов (если необходимо)
            updateResourceDisplay();
        } else {
            console.warn(`Группа ресурсов с индексом ${groupIndex} не найдена или не содержит ресурсов.`);
        }
    }
    
    // Функция для уравнивания значений ресурсов
    function equalizeResources(resource1, resource2) {
        if (playerResources.hasOwnProperty(resource1) && playerResources.hasOwnProperty(resource2)) {
            const value = playerResources[resource2]; // Берем значение resource_two
            playerResources[resource1] = value; // Устанавливаем resource_one равным resource_two
            console.log(`Resource ${resource1} is now equal to resource ${resource2} with value: ${value}`);
            updateResourceDisplay(); // Обновляем отображение
        } else {
            console.warn('One or both resources not found for equalization:', resource1, resource2);
        }
    }
    function subtractResourceValue(resourceName, value) {
        if (playerResources.hasOwnProperty(resourceName)) {
            playerResources[resourceName] -= value; // Вычитаем значение
            if (playerResources[resourceName] <= 0) {
                delete playerResources[resourceName]; // Если ресурс стал <= 0, удаляем его
            }
            updateResourceDisplay(); // Обновляем отображение ресурсов
        } else {
            console.warn(`Ресурс "${resourceName}" не найден для вычитания.`);
        }
    }
    
    function addRandomResourceValue(resourceName, minValue, maxValue) {
        // Проверяем, есть ли ресурс у игрока
        if (playerResources.hasOwnProperty(resourceName)) {
            // Генерируем случайное значение в пределах minValue и maxValue
            const randomValue = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
            
            // Добавляем это значение к существующему количеству ресурса
            playerResources[resourceName] += randomValue;
            
            // Обновляем отображение ресурсов (если необходимо)
            updateResourceDisplay();
            
            console.log(`Добавлено ${randomValue} к ресурсу ${resourceName}. Текущее количество: ${playerResources[resourceName]}`);
        } else {
            console.warn(`Ресурс "${resourceName}" не найден у игрока. Никаких изменений не сделано.`);
        }
    }
    function addRandomValuesToGroupResources(groupIndex, minValue, maxValue) {
        // Находим группу ресурсов по индексу
        const resourceGroup = findResourceGroupByIndex(groupIndex);
    
        if (resourceGroup && Array.isArray(resourceGroup.resources)) {
            // Проходим по каждому ресурсу в группе
            resourceGroup.resources.forEach(resource => {
                const resourceName = resource.name;
    
                // Проверяем, есть ли у игрока этот ресурс
                if (playerResources.hasOwnProperty(resourceName)) {
                    // Генерируем случайное количество для этого ресурса
                    const randomValue = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
    
                    // Добавляем случайное количество к существующему количеству ресурса у игрока
                    playerResources[resourceName] += randomValue;
    
                    console.log(`Добавлено случайное значение ${randomValue} к ресурсу ${resourceName}. Текущее количество: ${playerResources[resourceName]}`);
                } else {
                    console.warn(`Ресурс "${resourceName}" из группы не найден у игрока. Пропускаем.`);
                }
            });
    
            // Обновляем интерфейс отображения ресурсов (если необходимо)
            updateResourceDisplay();
        } else {
            console.warn(`Группа ресурсов с индексом ${groupIndex} не найдена или не содержит ресурсов.`);
        }
    }
    
    function addOtherResourceValue(sourceResource, targetResource) {
        // Проверяем наличие обоих ресурсов у игрока
        if (playerResources.hasOwnProperty(sourceResource) && playerResources.hasOwnProperty(targetResource)) {
            // Прибавляем значение ресурса 2 к ресурсу 1
        playerResources[targetResource] += playerResources[sourceResource]; // Добавляем значение
            updateResourceDisplay(); // Обновляем отображение ресурсов
        } else {
            console.warn('Один или оба ресурса не найдены для добавления:', sourceResource, targetResource);
        }
    }

    function subtractRandomGroupResourceValue(resources) {
        if (resources.length > 0) {
            const randomResource = resources[Math.floor(Math.random() * resources.length)];
            subtractResourceValue(randomResource.name, parseInt(randomResource.quantity, 10));
        }
    }
        
    function divideResources(resourceOne, resourceTwo) {
        // Проверяем наличие обоих ресурсов у игрока
        if (playerResources.hasOwnProperty(resourceOne) && playerResources.hasOwnProperty(resourceTwo)) {
            const dividendValue = parseInt(playerResources[resourceOne], 10); // Значение делимого
            const divisorValue = parseInt(playerResources[resourceTwo], 10); // Значение делителя
    
            console.log(`Перед делением: resource_one: ${dividendValue}, resource_two: ${divisorValue}`); // Отладочная информация
            
            if (!isNaN(dividendValue) && !isNaN(divisorValue) && divisorValue !== 0) {
                // Выполняем деление с округлением вниз
                playerResources[resourceOne] = Math.floor(dividendValue / divisorValue);
    
                console.log(`Ресурс ${resourceOne} разделен на ${resourceTwo}. Делимое: ${dividendValue}, делитель: ${divisorValue}, новое количество: ${playerResources[resourceOne]}`);
            
                // Обновляем интерфейс отображения ресурсов
                updateResourceDisplay();
            } else {
                console.warn(`Ошибка деления. Делимое: ${dividendValue}, делитель: ${divisorValue}. Делитель не должен быть нулем и значения должны быть числами.`);
            }
        } else {
            console.warn(`Один или оба ресурса не найдены у игрока. resource_one: ${resourceOne}, resource_two: ${resourceTwo}`);
        }
    }
    
    function addResourceToGame(resourceName, quantity) {
        if (!playerResources[resourceName]) {
            playerResources[resourceName] = 0; // Инициализируем, если ресурса еще нет
        }
        playerResources[resourceName] += quantity; // Добавляем количество
        console.log(`Resource added: ${resourceName}, Quantity: ${quantity}`);
        updateResourceDisplay();
    }
    function deleteResourceFromGame(resourceName) {
        if (playerResources[resourceName]) {
            delete playerResources[resourceName]; // Удаляем ресурс из объекта playerResources
            console.log(`Resource deleted: ${resourceName}`);
        } else {
            console.warn(`Resource not found for deletion: ${resourceName}`);
        }
    
        updateResourceDisplay(); // Обновляем отображение ресурсов на странице
    }
    
    function showErrorMessage(message) {
        storyContent.html(`<div class="error-message">${message}</div>`);
    }

    nextButton.on('click', function() {
        if (storyData.paragraphs[currentParagraphIndex + 1]) {
            currentParagraphIndex++;
            displayParagraph(currentParagraphIndex);
        } else {
            storyContent.html('Нет больше контента.');
            storyActions.hide();
            nextButton.hide();
        }
    });

    const storyId = $('#story-id').val();
    if (storyId) {
        loadStory(storyId);
    } else {
        console.error('Story ID is not defined.');
        showErrorMessage('Ошибка: ID истории не задан.');
    }
});
