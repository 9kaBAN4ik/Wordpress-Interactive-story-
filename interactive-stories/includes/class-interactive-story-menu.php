<?php
class Interactive_Story_Menu {
    public static function add_menu() {
        add_menu_page(
            'Интерактивные Сюжеты',
            'Интерактивные Сюжеты',
            'manage_options',
            'interactive-story-menu',
            array(__CLASS__, 'render_menu'),
            'dashicons-book',
            6
        );
    }

    public static function render_menu() {
        echo '<div class="wrap">';
        echo '<h1>Интерактивные Сюжеты</h1>';
        
        // Получаем все интерактивные сюжеты
        $args = array(
            'post_type' => 'interactive_story',
            'post_status' => 'publish',
            'posts_per_page' => -1
        );
        
        $stories = get_posts($args);
        
        if ($stories) {
            echo '<table class="widefat">';
            echo '<thead><tr><th>Название сюжета</th><th>Действие</th></tr></thead>';
            echo '<tbody>';
            foreach ($stories as $story) {
                echo '<tr>';
                echo '<td>' . esc_html($story->post_title) . '</td>';
                // Формируем ссылку для редактирования
                $edit_link = esc_url('http://localhost:8080/wordpress/interactive-story-constuctor/?post=' . $story->ID . '&action=edit');
                echo '<td><a href="' . $edit_link . '" class="button">Редактировать</a></td>';
                echo '</tr>';
            }
            echo '</tbody>';
            echo '</table>';
        } else {
            echo '<p>Нет доступных интерактивных сюжетов.</p>';
        }
        
        echo '</div>';
    }
}
