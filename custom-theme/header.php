<php?>
</php>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php wp_head(); ?>
    <style>
       header nav {
    background-color: #333; /* Темный фон для навигации */
    padding: 10px; /* Отступы вокруг навигации */
}

header nav ul {
    list-style-type: none; /* Убираем маркеры списка */
    margin: 0; /* Убираем внешние отступы */
    padding: 0; /* Убираем внутренние отступы */
    display: flex; /* Используем flexbox для горизонтального выравнивания */
    justify-content: center; /* Выравнивание по центру */
    position: relative; /* Для корректного отображения подменю */
}

header nav ul li {
    margin: 0 15px; /* Отступы между элементами списка */
    position: relative; /* Чтобы подменю отображалось относительно родителя */
}

header nav ul li a {
    color: white; /* Белый цвет текста для ссылок */
    text-decoration: none; /* Убираем подчеркивание */
    font-size: 16px; /* Размер шрифта */
    display: block; /* Для обеспечения кликабельной зоны вокруг ссылки */
    padding: 5px 10px; /* Отступы вокруг текста ссылки */
}

header nav ul li a:hover {
    background-color: #575757; /* Серый фон при наведении */
    border-radius: 4px; /* Скругление углов */
}

/* Стили для подменю */
.submenu {
    display: none;
    position: absolute;
    background-color: #fff; /* Белый фон подменю */
    border: 1px solid #ddd; /* Серая рамка подменю */
    list-style: none;
    padding: 0;
    margin: 0;
    top: 100%; /* Позиционируем подменю сразу под родителем */
    left: 0; /* Выравнивание по левому краю родителя */
    z-index: 1000; /* Помещаем подменю поверх остальных элементов */
}

.submenu li {
    padding: 0;
}

.submenu li a {
    padding: 8px 12px; /* Отступы внутри элементов подменю */
    color: #333; /* Темный цвет текста для подменю */
    display: block;
    white-space: nowrap; /* Предотвращение переноса текста */
}

.submenu li a:hover {
    background-color: #f0f0f0; /* Светло-серый фон при наведении */
}

/* Отображение подменю при наведении */
.menu-item:hover .submenu {
    display: block;
}

    </style>
</head>
<body <?php body_class(); ?>>
    <header>
        <nav>
            <ul>
                <li><a href="<?php echo esc_url(home_url('/')); ?>">Начальная страница</a></li>
                <?php if (is_user_logged_in()) : ?>
                    <?php
                    $current_user = wp_get_current_user();
                    $username = $current_user->user_login;
                    ?>
                    <li><a href="<?php echo esc_url(home_url('/user-profile/') . esc_attr($username)); ?>">Профиль</a></li>
                <?php else : ?>
                    <li><a href="<?php echo esc_url(home_url('/register')); ?>">Войти</a></li>
                <?php endif; ?>
                <li class="menu-item">
                    <a href="#">Конструктор историй</a>
                    <ul class="submenu">
                        <li><a href="<?php echo esc_url(home_url('/constructor')); ?>"">Интерактивные сюжеты</a></li>
                        <li><a href="<?php echo esc_url(home_url('/createbook')); ?>"">Книги</a></li>
                    </ul>
                </li>
            </ul>
        </nav>
    </header>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
    // Находим все ссылки в подменю
    const submenuLinks = document.querySelectorAll('.submenu a');

    // Обработчик клика по ссылке в подменю
    submenuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Отменяем стандартное поведение ссылки
            const href = this.getAttribute('href'); // Получаем значение href
            window.location.href = href; // Перенаправляем пользователя на нужную страницу
        });
    });
});

        </script>

<?php wp_footer(); ?>
</body>
</html>

