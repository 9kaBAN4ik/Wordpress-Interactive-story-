jQuery(document).ready(function($) {
    $('#submit-button').on('click', function(e) {
        e.preventDefault();

        var data = {
            action: 'handle_story_construction',
            nonce: ajax_vars.nonce,
            title: $('#story-title').val(),
            facts: getFactsData(),
            resources: getResourcesData()
        };

        $.post(ajax_vars.ajax_url, data, function(response) {
            if (response.success) {
                alert(response.data.message);
            } else {
                alert(response.data.message);
            }
        });
    });

    function getFactsData() {
        return $('#facts-group').find('textarea').map(function() {
            return $(this).val();
        }).get();
    }

    function getResourcesData() {
        return $('#resources-group').find('textarea').map(function() {
            return $(this).val();
        }).get();
    }
});
