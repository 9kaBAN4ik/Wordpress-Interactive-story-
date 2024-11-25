jQuery(document).ready(function ($) {
    $('#add-paragraph').click(function () {
        var newParagraph = $('<div class="paragraph-item">' +
            '<textarea name="paragraphs[]" rows="5" cols="50"></textarea>' +
            '<div class="actions-container">' +
            '<label>Действия для этого параграфа:</label><br/>' +
            '<div class="actions-list"></div>' +
            '<button type="button" class="add-action">Добавить действие</button>' +
            '</div>' +
            '</div>');
        $('#paragraphs-container').append(newParagraph);
    });

    $(document).on('click', '.add-action', function () {
        var actionsList = $(this).siblings('.actions-list');
        var actionIndex = actionsList.children('.action-item').length;
        var newAction = $('<div class="action-item">' +
            '<input type="text" name="actions[' + actionIndex + '][label][]" placeholder="Текст действия" />' +
            '<input type="number" name="actions[' + actionIndex + '][next_paragraph][]" placeholder="Следующий параграф" />' +
            '<button type="button" class="remove-action">Удалить действие</button><br/>' +
            '</div>');
        actionsList.append(newAction);
    });

    $(document).on('click', '.remove-action', function () {
        $(this).closest('.action-item').remove();
    });

    $('#save-story').click(function () {
        var storyData = {
            paragraphs: []
        };

        $('.paragraph-item').each(function () {
            var paragraphText = $(this).find('textarea').val();
            var actions = [];

            $(this).find('.action-item').each(function () {
                actions.push({
                    label: $(this).find('input[name$="[label][]"]').val(),
                    nextParagraph: $(this).find('input[name$="[next_paragraph][]"]').val()
                });
            });

            storyData.paragraphs.push({
                text: paragraphText,
                actions: actions
            });
        });

        $.ajax({
            url: wp_vars.ajax_url,
            type: 'POST',
            data: {
                action: 'save_story',
                story_id: wp_vars.story_id,
                story_data: storyData
            },
            success: function (response) {
                if (response.success) {
                    alert('Сюжет успешно сохранен!');
                } else {
                    alert('Ошибка при сохранении сюжета: ' + response.data.message);
                }
            },
            error: function () {
                alert('Ошибка при запросе данных.');
            }
        });
    });
});
