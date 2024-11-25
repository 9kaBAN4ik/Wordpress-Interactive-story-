jQuery(document).ready(function($) {
    // Показываем форму входа по умолчанию
    $('#register-form').hide();

    $('#login-toggle').click(function() {
        $('#register-form').hide();
        $('#login-form').show();
        $('#form-toggle button').removeClass('active');
        $('#login-toggle').addClass('active');
    });

    $('#register-toggle').click(function() {
        $('#login-form').hide();
        $('#register-form').show();
        $('#form-toggle button').removeClass('active');
        $('#register-toggle').addClass('active');
    });
});
