jQuery(document).ready(function($) {
    $('#start-adventure').click(function(e) {
        e.preventDefault();

        if (frontPageData.isUserLoggedIn) {
            $('#modal-message').html('<p>Вы уже вошли в систему. Выберите историю ниже, чтобы начать свое приключение.</p>');
        } else {
            var customRegistrationUrl = 'http://u2743689.isp.regruhosting.ru/wordpress/register/';
            
            $('#modal-message').html('<p>Пожалуйста, зарегистрируйтесь, чтобы начать свое приключение.</p><a href="' + customRegistrationUrl + '" class="btn-secondary">Register</a>');
        }

        $('#modal').fadeIn();
    });

    $('.close').click(function() {
        $('#modal').fadeOut();
    });

    $(window).click(function(event) {
        if (event.target == document.getElementById('modal')) {
            $('#modal').fadeOut();
        }
    });
});
