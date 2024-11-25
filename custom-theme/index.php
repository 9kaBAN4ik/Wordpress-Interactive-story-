<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php bloginfo('name'); ?> - <?php is_front_page() ? bloginfo('description') : wp_title(''); ?></title>
    <link rel="stylesheet" href="<?php bloginfo('stylesheet_url'); ?>">
</head>
<header>
    <nav>
        <ul>
            <li><a href="<?php echo esc_url(home_url('/')); ?>">Начальная страница</a></li>
            <?php if (is_user_logged_in()) : ?>
                <?php
                // Получаем текущего пользователя
                $current_user = wp_get_current_user();
                $username = $current_user->user_login; // Имя пользователя
                ?>
                <li><a href="<?php echo esc_url(home_url('/user-profile/') . esc_attr($username)); ?>">Профиль</a></li>
            <?php else : ?>
                <li><a href="<?php echo esc_url(home_url('/register')); ?>">Войти</a></li>
            <?php endif; ?>
            <li><a href="<?php echo esc_url(home_url('/interactive-story-constructor')); ?>">Конструктор историй</a></li>
        </ul>
    </nav>
</header>
<body>

<div class="container">
    <header>
        <h1><?php bloginfo('name'); ?></h1>
        <p><?php bloginfo('description'); ?></p>
        <button id="openLoginModal">Login / Register</button>
    </header>

    <main>
        <?php
        if ( have_posts() ) :
            while ( have_posts() ) : the_post();
                the_title('<h2>', '</h2>');
                the_content();
            endwhile;
        else :
            echo '<p>No content found</p>';
        endif;
        ?>
    </main>

    <footer>
        <p>&copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?></p>
    </footer>
</div>

<div id="loginModal" class="modal">
    <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>Login</h2>
        <form id="loginForm" method="post">
            <label for="username">Username</label>
            <input type="text" name="username" id="username" required>

            <label for="password">Password</label>
            <input type="password" name="password" id="password" required>

            <input type="submit" value="Login">
        </form>
        <p>
            Don't have an account? <a href="#" id="openRegisterModal">Register</a>
        </p>
    </div>
</div>

<div id="registerModal" class="modal">
    <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>Register</h2>
        <form id="registerForm" method="post">
            <label for="username">Username</label>
            <input type="text" name="username" id="reg_username" required>

            <label for="email">Email</label>
            <input type="email" name="email" id="reg_email" required>

            <label for="password">Password</label>
            <input type="password" name="password" id="reg_password" required>

            <label for="confirm_password">Confirm Password</label>
            <input type="password" name="confirm_password" id="reg_confirm_password" required>

            <input type="submit" value="Register">
        </form>
        <p>
            Already have an account? <a href="#" id="backToLogin">Login</a>
        </p>
    </div>
</div>

<script>
document.getElementById('openLoginModal').onclick = function() {
    document.getElementById('loginModal').style.display = 'block';
}

document.getElementById('openRegisterModal').onclick = function() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('registerModal').style.display = 'block';
}

document.getElementById('backToLogin').onclick = function() {
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('loginModal').style.display = 'block';
}

document.querySelectorAll('.close-modal').forEach(function(element) {
    element.onclick = function() {
        element.closest('.modal').style.display = 'none';
    }
});

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}
</script>

</body>
</html>
