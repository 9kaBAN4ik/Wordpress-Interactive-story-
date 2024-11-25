<?php
class Book_Menu {
    public static function add_menu() {
        add_menu_page(
            'Книги',
            'Книги',
            'manage_options',
            'book-menu',
            array(self::class, 'menu_page'),
            'dashicons-book-alt',
            6
        );
        add_submenu_page(
            'book-menu',
            'Редактор книги',
            'Редактор книги',
            'manage_options',
            'book-editor',
            array(self::class, 'editor_page')
        );
    }

    public static function menu_page() {
        echo '<div class="wrap"><h1>Управление книгами</h1></div>';
    }

    public static function editor_page() {
        $theme_name = 'custom-theme'; // Название темы
        $template_name = 'editor-template.php'; // Название файла шаблона

        $template_path = get_theme_root() . '/' . $theme_name . '/' . $template_name;

        if (file_exists($template_path)) {
            include $template_path;
        } else {
            echo '<div class="wrap"><h1>Шаблон редактора книги не найден в теме ' . esc_html($theme_name) . '.</h1></div>';
        }
    }
}

// Регистрация меню в админке
add_action('admin_menu', array('Book_Menu', 'add_menu'));
