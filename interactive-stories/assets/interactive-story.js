jQuery(document).ready(function($) {
    function loadParagraph(paragraphNumber) {
        $.ajax({
            url: wp_vars.ajax_url,
            type: 'POST',
            data: {
                action: 'load_paragraph',
                paragraph: paragraphNumber,
                story_id: wp_vars.story_id
            },
            success: function(response) {
                if (response.success) {
                    $('.interactive-story .paragraph').html(response.data);
                } else {
                    $('.interactive-story .paragraph').html('<p>Ошибка загрузки параграфа.</p>');
                }
            },
            error: function() {
                $('.interactive-story .paragraph').html('<p>Ошибка при запросе данных.</p>');
            }
        });
    }

    $(document).on('click', '.interactive-story .actions a', function(e) {
        e.preventDefault();
        var paragraphNumber = $(this).attr('href').split('paragraph=')[1];
        loadParagraph(paragraphNumber);
    });
});
