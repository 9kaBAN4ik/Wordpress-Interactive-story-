<?php
function create_messages_table() {
    global $wpdb;

    // Имя таблицы
    $table_name = $wpdb->prefix . 'messages';

    // SQL запрос для создания таблицы, если она не существует
    $sql = "
    CREATE TABLE IF NOT EXISTS $table_name (
        id BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        sender_id BIGINT(20) UNSIGNED NOT NULL,
        recipient_id BIGINT(20) UNSIGNED NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME NOT NULL
    );
    ";

    // Выполняем SQL запрос
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// Запуск функции при активации темы или плагина
add_action('after_switch_theme', 'create_messages_table');

// Подключение стилей для страницы профиля
function enqueue_profile_page_styles() {
    if (is_page_template('profile-page.php')) {
        wp_enqueue_style('profile-page-style', get_template_directory_uri() . '/css/profile-page.css');
    }
}
add_action('wp_enqueue_scripts', 'enqueue_profile_page_styles');

// Добавление параметра для запроса
function add_query_vars($vars) {
    $vars[] = 'user_profile';
    return $vars;
}
add_filter('query_vars', 'add_query_vars');

// Обработка запроса для пользовательского профиля
function handle_user_profile_query() {
    global $wp_query;

    if (isset($wp_query->query_vars['user_profile'])) {
        $username = sanitize_text_field($wp_query->query_vars['user_profile']);
        $user = get_user_by('login', $username);

        if ($user) {
            include(get_template_directory() . '/profile-page.php'); 
            exit;
        } else {
            $wp_query->set_404();
            status_header(404);
            get_template_part('404');
            exit;
        }
    }
}
add_action('template_redirect', 'handle_user_profile_query');

// Подключение стилей и скриптов для страницы регистрации
function enqueue_custom_scripts() {
    if (is_page_template('register-page.php')) {
        // Подключаем jQuery
        wp_enqueue_script('jquery');
        
        // Подключаем скрипт для страницы регистрации
        wp_enqueue_script('register-page', get_template_directory_uri() . '/js/register-page.js', array('jquery'), null, true);

        // Подключаем CSS для страницы регистрации
        wp_enqueue_style('register-page-style', get_template_directory_uri() . '/css/register-page.css', array(), null);
    }
}
add_action('wp_enqueue_scripts', 'enqueue_custom_scripts');


// Подключение стилей и скриптов для страницы интерактивного сюжета
function enqueue_interactive_story_assets() {
    if (is_page_template('page-interactive-story.php')) {
        // Подключаем jQuery
        wp_enqueue_script('jquery');

        // Подключаем стили и скрипты Bootstrap
        wp_enqueue_style('bootstrap-css', 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css');
        wp_enqueue_script('bootstrap-js', 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js', array('jquery'), null, true);

        // Подключаем Font Awesome
        wp_enqueue_style('font-awesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css');

        // Подключаем D3.js
        wp_enqueue_script('d3-js', 'https://d3js.org/d3.v7.min.js', array(), null, true);

        // Подключаем собственные стили и скрипты
        wp_enqueue_style('interactive-story-style', get_template_directory_uri() . '/css/interactive-story.css');
        wp_enqueue_script('interactive-story-script', get_template_directory_uri() . '/js/interactive-story.js', array('jquery', 'bootstrap-js', 'd3-js'), null, true);

        // Проверяем, задан ли post_id в URL, и если да, используем его
        $post_id = isset($_GET['post_id']) ? intval($_GET['post_id']) : get_the_ID();

        // Локализация скрипта для передачи переменных в JS
        wp_localize_script('interactive-story-script', 'wp_vars', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce'    => wp_create_nonce('interactive_story_nonce'),
            'post_id'  => $post_id, // Передаем корректный post_id
        ));
    }
}
add_action('wp_enqueue_scripts', 'enqueue_interactive_story_assets');


function enqueue_story_playthrough_scripts() {
    if (is_page_template('page-story-playthrough.php') || (is_page() && get_query_var('story_id'))) {
        wp_enqueue_style('story-playthrough-style', get_stylesheet_directory_uri() . '/css/story-playthrough.css');
        wp_enqueue_script('story-playthrough-script', get_stylesheet_directory_uri() . '/js/story-playthrough.js', array('jquery'), null, true);

        wp_localize_script('story-playthrough-script', 'wp_vars', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce'    => wp_create_nonce('interactive_story_nonce')
        ));
    }
}
add_action('wp_enqueue_scripts', 'enqueue_story_playthrough_scripts');

add_action('wp_ajax_get_story_paragraphs', 'get_story_paragraphs');
add_action('wp_ajax_nopriv_get_story_paragraphs', 'get_story_paragraphs'); // Для неавторизованных пользователей
function get_story_data() {
    check_ajax_referer('interactive_story_nonce', 'nonce');

    $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;

    if ($post_id) {
        // Получаем параграфы
        $paragraphs = get_post_meta($post_id, '_interactive_story_paragraphs', true);
        $paragraphs = is_serialized($paragraphs) ? unserialize($paragraphs) : $paragraphs;

        // Получаем группы фактов
        $facts = get_post_meta($post_id, '_interactive_story_fact_groups', true);
        $facts = is_serialized($facts) ? unserialize($facts) : $facts;

        // Получаем ресурсы
        $resources = get_post_meta($post_id, '_interactive_story_resource_groups', true);
        $resources = is_serialized($resources) ? unserialize($resources) : $resources;

        // Получаем формулы
        $formulas = get_post_meta($post_id, '_interactive_story_formulas', true);
        $formulas = is_serialized($formulas) ? unserialize($formulas) : $formulas;

        // Проверяем, есть ли данные и фильтруем пустые параграфы
        if (is_array($paragraphs)) {
            $paragraphs = array_filter($paragraphs, function($paragraph) {
                return !empty($paragraph['title']) || !empty($paragraph['text']) || !empty($paragraph['actions']) || !empty($paragraph['autoChanges']);
            });
        }

        // Проверяем и очищаем факты
        if (!is_array($facts)) {
            $facts = []; // Устанавливаем пустой массив, если данные отсутствуют
        }

        // Проверяем, если факты - это массив, и подготавливаем их для отправки
        if (is_array($facts) && !empty($facts)) {
            $formattedFacts = [];
            foreach ($facts as $factGroup) {
                // Проверяем, если группа фактов корректная
                if (isset($factGroup['index'], $factGroup['name'], $factGroup['facts'])) {
                    $formattedFacts[] = [
                        'index' => $factGroup['index'],
                        'name' => $factGroup['name'],
                        'facts' => is_array($factGroup['facts']) ? $factGroup['facts'] : []
                    ];
                }
            }
            $facts = $formattedFacts; // Обновляем факты отформатированными данными
        } else {
            $facts = []; // Если фактов нет, устанавливаем пустой массив
        }

        // Отправляем ответ с данными
        wp_send_json_success(array(
            'paragraphs' => array_values($paragraphs),
            'facts' => $facts,
            'resources' => $resources,
            'formulas' => $formulas
        ));
    } else {
        wp_send_json_error(array('message' => 'Некорректный ID поста'));
    }

    wp_die();
}
add_action('wp_ajax_get_story_data', 'get_story_data');
// Пример для книги

function get_book_data() {
    check_ajax_referer('interactive_book_nonce', 'nonce');
    $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;

    if ($post_id) {
        // Получаем мета-данные для книги
        $book_data = get_post_meta($post_id, '_book_meta_key', true);

        // Обрабатываем полученные данные
        wp_send_json_success(array('book_data' => $book_data));
    } else {
        wp_send_json_error(array('message' => 'Некорректный ID поста'));
    }
    wp_die();
}
add_action('wp_ajax_get_book_data', 'get_book_data');
add_action('wp_ajax_get_book_data', 'get_book_data');
function check_book_meta($post_id) {
    $book_data = get_post_meta($post_id, '_book_data', true);
    if (!$book_data) {
        error_log("Book data not found for post_id: " . $post_id);
    }
}
add_action('save_post', 'check_book_meta');
function get_book_data_two() {
    // Проверка nonce для безопасности
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'create_book_nonce')) {
        wp_send_json_error(array('message' => 'Nonce не верен'));
    }

    // Получаем ID поста
    if (isset($_POST['post_id'])) {
        $post_id = intval($_POST['post_id']);
        $book = get_post($post_id);

        if (!$book) {
            wp_send_json_error(array('message' => 'Книга не найдена'));
        }

        // Собираем данные книги
        $book_data = array(
            'title' => get_the_title($post_id),
            'author' => get_post_meta($post_id, 'book_author', true),
            'description' => get_post_meta($post_id, 'book_description', true),
            'genre' => get_post_meta($post_id, 'book_genre', true),
            'subgenre1' => get_post_meta($post_id, 'book_subgenre1', true),
            'subgenre2' => get_post_meta($post_id, 'book_subgenre2', true),
            'coAuthor' => get_post_meta($post_id, 'book_coAuthor', true),
            'annotation' => get_post_meta($post_id, 'book_annotation', true),
            'authorNote' => get_post_meta($post_id, 'book_authorNote', true),
            'tags' => get_post_meta($post_id, 'book_tags', true),
            'visibility' => get_post_meta($post_id, 'book_visibility', true),
            'downloadPermission' => get_post_meta($post_id, 'book_downloadPermission', true),
            'commentPermission' => get_post_meta($post_id, 'book_commentPermission', true),
            'type' => get_post_meta($post_id, 'book_type', true)
        );

        // Получаем абзацы
        $paragraphs = get_post_meta($post_id, 'book_paragraphs', true);
        
        // Если абзацы существуют, добавляем их в данные
        if (!empty($paragraphs)) {
            $book_data['paragraphs'] = json_decode($paragraphs, true);
        } else {
            $book_data['paragraphs'] = []; // Пустой массив, если абзацев нет
        }

        // Логируем данные
        error_log('Данные книги: ' . print_r($book_data, true));

        // Возвращаем данные
        wp_send_json_success(array('data' => $book_data));
    } else {
        wp_send_json_error(array('message' => 'ID поста не передан'));
    }

    wp_die();
}
add_action('wp_ajax_get_book_data_v2', 'get_book_data_two');


add_action('wp_ajax_get_notifications_count', 'get_notifications_count');
function get_notifications_count() {
    if (!isset($_POST['user_id'])) {
        wp_send_json_error(array('message' => 'User ID not provided.'));
        return;
    }

    $user_id = intval($_POST['user_id']);
    
    // Пример получения количества уведомлений
    $notifications = get_user_meta($user_id, 'notifications', true); // Мета-данные пользователя, хранящие уведомления

    // Если уведомлений нет, вернуть 0
    if (!$notifications || !is_array($notifications)) {
        wp_send_json_success(array('notifications_count' => 0));
        return;
    }

    // Подсчитываем активные уведомления
    $active_notifications = array_filter($notifications, function($notification) {
        return $notification['status'] === 'active'; // Пример: только активные уведомления
    });

    wp_send_json_success(array('notifications_count' => count($active_notifications)));
}
// Пометить все уведомления как прочитанные
add_action('wp_ajax_mark_notifications_as_read', 'mark_notifications_as_read');
function mark_notifications_as_read() {
    // Проверяем наличие user_id в запросе
    if (isset($_POST['user_id'])) {
        $user_id = intval($_POST['user_id']);
        
        if ($user_id) {
            // Логика для пометки всех уведомлений пользователя как прочитанных
            // Вы можете изменить логику, если храните уведомления в базе данных как записи
            // Например, можно обновить мета-данные всех уведомлений для этого пользователя
            update_user_meta($user_id, 'notifications_read', true);

            // Пример обновления мета-данных уведомлений
            $notifications = get_posts([
                'post_type' => 'notification', // Убедитесь, что у вас правильный тип поста для уведомлений
                'meta_key' => 'user_id',
                'meta_value' => $user_id
            ]);

            foreach ($notifications as $notification) {
                update_post_meta($notification->ID, 'notification_read', true);
            }

            wp_send_json_success();  // Ответ об успешной операции
        }
    }
    wp_send_json_error();  // Если не удалось выполнить
}

// Пометить одно уведомление как прочитанное
add_action('wp_ajax_mark_notification_as_read', 'mark_notification_as_read');
function mark_notification_as_read() {
    if (isset($_POST['notification_id']) && isset($_POST['user_id'])) {
        $notification_id = intval($_POST['notification_id']);
        $user_id = intval($_POST['user_id']);

        if ($notification_id && $user_id) {
            // Логика для пометки одного уведомления как прочитанного
            update_post_meta($notification_id, 'notification_read', true);

            // Также можно обновить мета-данные для пользователя, если уведомление прочитано
            $notifications = get_user_meta($user_id, 'user_notifications', true);
            if (is_array($notifications) && in_array($notification_id, $notifications)) {
                // Удаляем уведомление из списка непрочитанных
                update_user_meta($user_id, 'user_notifications', array_diff($notifications, [$notification_id]));
            }

            wp_send_json_success();  // Ответ об успешной операции
        }
    }
    wp_send_json_error();  // Если не удалось выполнить
}

// Пометить запрос в друзья как прочитанный
add_action('wp_ajax_mark_friend_request_as_read', 'mark_friend_request_as_read');
function mark_friend_request_as_read() {
    if (isset($_POST['request_id']) && isset($_POST['user_id'])) {
        $request_id = intval($_POST['request_id']);
        $user_id = intval($_POST['user_id']);

        if ($request_id && $user_id) {
            // Логика для пометки запроса в друзья как прочитанного
            update_post_meta($request_id, 'friend_request_read', true);

            // Обновляем статус запроса в друзья у пользователя
            $friend_requests = get_user_meta($user_id, 'friend_requests', true);
            if (is_array($friend_requests) && in_array($request_id, $friend_requests)) {
                // Убираем запрос из списка непрочитанных
                update_user_meta($user_id, 'friend_requests', array_diff($friend_requests, [$request_id]));
            }

            wp_send_json_success();  // Ответ об успешной операции
        }
    }
    wp_send_json_error();  // Если не удалось выполнить
}
// Пример PHP функции для получения количества непрочитанных уведомлений
function get_unread_notifications_count($user_id) {
    global $wpdb;
    $count = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$wpdb->prefix}notifications WHERE user_id = %d AND read = 0", $user_id));
    return $count;
}

function handle_create_book_form() {
    // Проверка nonce для безопасности
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'create_book_nonce')) {
        wp_send_json_error(array('message' => 'Nonce не верен'));
    }

    // Логирование POST данных для отладки
    error_log('POST данные: ' . print_r($_POST, true));

    // Сбор и обработка данных из POST
    $title = sanitize_text_field($_POST['book-title']);
    $author = sanitize_text_field($_POST['book-author']);
    $description = wp_kses_post($_POST['book-description']);
    $genre = sanitize_text_field($_POST['book-genre']);
    $subgenre1 = sanitize_text_field($_POST['book-subgenre1']);
    $subgenre2 = sanitize_text_field($_POST['book-subgenre2']);
    $coAuthor = sanitize_text_field($_POST['book-coAuthor']);
    $annotation = sanitize_textarea_field($_POST['book-annotation']);
    $authorNote = sanitize_textarea_field($_POST['book-authorNote']);
    $tags = sanitize_text_field($_POST['book-tags']);
    $visibility = sanitize_text_field($_POST['book-visibility']);
    $downloadPermission = sanitize_text_field($_POST['book-downloadPermission']);
    $commentPermission = sanitize_text_field($_POST['book-commentPermission']);
    $type = sanitize_text_field($_POST['book-type']);
    $post_id = isset($_POST['post_id']) ? (int) $_POST['post_id'] : 0;  // Получение ID поста

    // Обработка абзацев
    $paragraphs_with_indexes = new stdClass();
    if (isset($_POST['paragraphs']) && is_array($_POST['paragraphs'])) {
        foreach ($_POST['paragraphs'] as $index => $paragraph) {
            $paragraphs_with_indexes->$index = [
                'title' => sanitize_text_field($paragraph['title']),
                'content' => wp_kses_post($paragraph['content'])
            ];
        }
    }
    // Преобразуем абзацы в JSON
    $paragraphs_json = json_encode($paragraphs_with_indexes);

    // Если $post_id существует, обновляем существующий пост, иначе создаем новый
    if ($post_id) {
        // Обновление существующего поста
        $post_data = array(
            'ID' => $post_id,  // ID существующего поста
            'post_title' => $title,
            'post_status' => 'publish', // Или 'draft', если необходимо
            'post_type' => 'book'
        );
        $post_id = wp_update_post($post_data); // Обновление поста
    } else {
        // Создание нового поста
        $post_data = array(
            'post_title' => $title,
            'post_status' => 'publish', // Или 'draft', если необходимо
            'post_type' => 'book'
        );
        $post_id = wp_insert_post($post_data); // Создание нового поста
    }

    // Проверка успешного создания или обновления поста
    if ($post_id) {
        // Очистка старых метаполей
        delete_post_meta($post_id, 'book_author');
        delete_post_meta($post_id, 'book_description');
        delete_post_meta($post_id, 'book_genre');
        delete_post_meta($post_id, 'book_subgenre1');
        delete_post_meta($post_id, 'book_subgenre2');
        delete_post_meta($post_id, 'book_coAuthor');
        delete_post_meta($post_id, 'book_annotation');
        delete_post_meta($post_id, 'book_authorNote');
        delete_post_meta($post_id, 'book_tags');
        delete_post_meta($post_id, 'book_visibility');
        delete_post_meta($post_id, 'book_downloadPermission');
        delete_post_meta($post_id, 'book_commentPermission');
        delete_post_meta($post_id, 'book_type');
        delete_post_meta($post_id, 'book_paragraphs');

        // Сохранение новых метаполей
        update_post_meta($post_id, 'book_author', $author);
        update_post_meta($post_id, 'book_description', $description);
        update_post_meta($post_id, 'book_genre', $genre);
        update_post_meta($post_id, 'book_subgenre1', $subgenre1);
        update_post_meta($post_id, 'book_subgenre2', $subgenre2);
        update_post_meta($post_id, 'book_coAuthor', $coAuthor);
        update_post_meta($post_id, 'book_annotation', $annotation);
        update_post_meta($post_id, 'book_authorNote', $authorNote);
        update_post_meta($post_id, 'book_tags', $tags);
        update_post_meta($post_id, 'book_visibility', $visibility);
        update_post_meta($post_id, 'book_downloadPermission', $downloadPermission);
        update_post_meta($post_id, 'book_commentPermission', $commentPermission);
        update_post_meta($post_id, 'book_type', $type);
        update_post_meta($post_id, 'book_paragraphs', $paragraphs_json); // Абзацы

        // Ответ на успешное сохранение/обновление книги
        wp_send_json_success(array('message' => 'Книга успешно сохранена!', 'post_id' => $post_id));
    } else {
        // Ошибка сохранения книги
        wp_send_json_error(array('message' => 'Произошла ошибка при сохранении книги'));
    }

    wp_die();
}
add_action('wp_ajax_handle_create_book_form', 'handle_create_book_form');




function get_subgenres() {
    check_ajax_referer('ajax-nonce', 'nonce');

    $genre = sanitize_text_field($_POST['genre']);
    if (!$genre) {
        wp_send_json_error(array('message' => 'Жанр не указан.'));
    }

    // Здесь вам нужно будет заменить этот массив на актуальные данные из вашей базы данных или другого источника.
    $subgenres = array(
        'Fantasy' => array('High Fantasy', 'Urban Fantasy', 'Dark Fantasy'),
        'Science Fiction' => array('Cyberpunk', 'Space Opera', 'Time Travel'),
        // Добавьте остальные жанры и поджанры
    );

    if (array_key_exists($genre, $subgenres)) {
        wp_send_json_success(array('subgenres' => $subgenres[$genre]));
    } else {
        wp_send_json_error(array('message' => 'Поджанры для данного жанра не найдены.'));
    }
}
add_action('wp_ajax_get_subgenres', 'get_subgenres');
add_action('wp_ajax_nopriv_get_subgenres', 'get_subgenres');


// Регистрация типа записи
function register_interactive_story_post_type() {
    $labels = array(
        'name' => 'Интерактивные сюжеты',
        'singular_name' => 'Интерактивный сюжет',
        'add_new' => 'Добавить новый',
        'add_new_item' => 'Добавить новый сюжет',
        'edit_item' => 'Редактировать сюжет',
        'new_item' => 'Новый сюжет',
        'view_item' => 'Просмотр сюжета',
        'search_items' => 'Поиск сюжетов',
        'not_found' => 'Сюжеты не найдены',
        'not_found_in_trash' => 'В корзине сюжетов не найдено',
        'parent_item_colon' => '',
        'menu_name' => 'Интерактивные сюжеты',
    );

    $args = array(
        'labels' => $labels,
        'public' => true,
        'publicly_queryable' => true,
        'show_ui' => true,
        'show_in_menu' => true,
        'query_var' => true,
        'rewrite' => array('slug' => 'interactive_story'),
        'capability_type' => 'post',
        'has_archive' => true,
        'hierarchical' => false,
        'menu_position' => 5,
        'supports' => array('title', 'editor', 'author', 'thumbnail', 'excerpt', 'comments'),
    );

    register_post_type('interactive_story', $args);
}
add_action('init', 'register_interactive_story_post_type');
function custom_user_profile_rewrite_rule() {
    add_rewrite_rule(
        '^user-profile/([^/]*)/?',
        'index.php?pagename=user-profile&user_profile=$matches[1]',
        'top'
    );
}
add_action('init', 'custom_user_profile_rewrite_rule');

function custom_user_profile_query_vars($vars) {
    $vars[] = 'user_profile';
    return $vars;
}
add_filter('query_vars', 'custom_user_profile_query_vars');


// Функция для логирования сообщений
function log_message($message) {
    $log_file = __DIR__ . '/debug.log'; 
    $date = date('Y-m-d H:i:s');
    $formatted_message = "[{$date}] {$message}\n";
    
    error_log($formatted_message, 3, $log_file);
}

// Обработка AJAX запроса для создания сюжета
if (!function_exists('handle_story_construction')) {
    function handle_story_construction() {
        check_ajax_referer('interactive_story_nonce', 'nonce');

        $title = sanitize_text_field($_POST['title']);
        $facts = isset($_POST['facts']) ? (array) $_POST['facts'] : [];
        $resources = isset($_POST['resources']) ? (array) $_POST['resources'] : [];

        $post_id = wp_insert_post(array(
            'post_title'   => $title,
            'post_type'    => 'interactive_story',
            'post_status'  => 'publish'
        ));

        if ($post_id) {
            update_post_meta($post_id, '_interactive_story_facts', serialize($facts));
            update_post_meta($post_id, '_interactive_story_resources', serialize($resources));

            wp_send_json_success(array('message' => 'Запрос обработан успешно.'));
        } else {
            wp_send_json_error(array('message' => 'Не удалось создать пост.'));
        }

        wp_die();
    }
}
add_action('wp_ajax_handle_story_construction', 'handle_story_construction');
add_action('wp_ajax_nopriv_handle_story_construction', 'handle_story_construction');

// Получение данных о сюжете
function load_interactive_story_data() { // Новое название функции
    check_ajax_referer('interactive_story_nonce', 'nonce'); // Проверка nonce

    // Получение story_id из POST-запроса
    $story_id = isset($_POST['story_id']) ? intval($_POST['story_id']) : 0;
    
    if ($story_id) {
        $story = get_post($story_id);
        if ($story && $story->post_type === 'interactive_story') {
            $story_data = array(
                'title' => $story->post_title,
                'content' => $story->post_content,
                'paragraphs' => unserialize(get_post_meta($story_id, '_interactive_story_paragraphs', true)),
                'factGroups' => unserialize(get_post_meta($story_id, '_interactive_story_fact_groups', true)),
                'resourceGroups' => unserialize(get_post_meta($story_id, '_interactive_story_resource_groups', true)),
                'formulas' => unserialize(get_post_meta($story_id, '_interactive_story_formulas', true)),
            );
            wp_send_json_success($story_data);
        } else {
            wp_send_json_error(array('message' => 'История не найдена.'));
        }
    } else {
        wp_send_json_error(array('message' => 'Некорректный идентификатор истории.'));
    }
}
add_action('wp_ajax_load_interactive_story_data', 'load_interactive_story_data'); // Новый action
add_action('wp_ajax_nopriv_load_interactive_story_data', 'load_interactive_story_data'); // Новый action для неавторизованных пользователей


// Подключение редактора книги в меню админки
function add_book_menu_page() {
    add_menu_page(
        'Управление книгами',
        'Управление книгами',
        'manage_options',
        'book-editor',
        'book_menu_page_callback'
    );
    add_submenu_page(
        'book-editor',
        'Редактор книг',
        'Редактор книг',
        'manage_options',
        'book-editor',
        'book_editor_page_callback'
    );
}
add_action('admin_menu', 'add_book_menu_page');

// Функция для отображения главного меню "Книги"
function book_menu_page_callback() {
    echo '<div class="wrap"><h1>Управление книгами</h1></div>';
}

// Функция для отображения страницы редактора книг
function book_editor_page_callback() {
    get_template_part('editor-template');
}

// Подключение стилей и скриптов для редактора книг
function enqueue_book_editor_assets() {
    if (is_admin() && isset($_GET['page']) && $_GET['page'] == 'book-editor') {
        wp_enqueue_style('book-editor-css', get_template_directory_uri() . '/css/books.css');
        wp_enqueue_script('book-editor-js', get_template_directory_uri() . '/js/editor.js', array('jquery'), null, true);
    }
}
add_action('admin_enqueue_scripts', 'enqueue_book_editor_assets');

function register_book_post_type() {
    $labels = array(
        'name'                  => 'Книги',
        'singular_name'         => 'Книга',
        'add_new'               => 'Добавить новую',
        'add_new_item'          => 'Добавить новую книгу',
        'edit_item'             => 'Редактировать книгу',
        'new_item'              => 'Новая книга',
        'view_item'             => 'Просмотреть книгу',
        'search_items'          => 'Искать книги',
        'not_found'             => 'Книги не найдены',
        'not_found_in_trash'    => 'В корзине книг не найдено',
        'parent_item_colon'     => '',
        'menu_name'             => 'Книги',
    );

    $args = array(
        'labels'                => $labels,
        'public'                => true,
        'publicly_queryable'    => true,
        'show_ui'               => true,
        'show_in_menu'          => true,
        'query_var'             => true,
        'rewrite'               => array('slug' => 'books'),
        'capability_type'       => 'post',
        'has_archive'           => true,
        'hierarchical'          => false,
        'menu_position'         => 6,
        'supports'              => array('title', 'editor', 'author', 'thumbnail', 'custom-fields'),
    );

    register_post_type('book', $args);
}
add_action('init', 'register_book_post_type');
function add_user_age_field($user) {
    ?>
    <h3>Дополнительная информация</h3>

    <table class="form-table">
        <tr>
            <th><label for="age">Возраст</label></th>
            <td>
                <input type="number" name="age" id="age" value="<?php echo esc_attr(get_the_author_meta('age', $user->ID)); ?>" class="regular-text" />
                <br /><span class="description">Введите ваш возраст.</span>
            </td>
        </tr>
    </table>
    <?php
}
add_action('show_user_profile', 'add_user_age_field');
add_action('edit_user_profile', 'add_user_age_field');

// Сохранение значения поля возраста
function save_user_age_field($user_id) {
    if (!current_user_can('edit_user', $user_id)) {
        return false;
    }
    update_usermeta($user_id, 'age', $_POST['age']);
}
add_action('personal_options_update', 'save_user_age_field');
add_action('edit_user_profile_update', 'save_user_age_field');



// Подключение стилей и скриптов для страницы создания книги
function enqueue_create_book_assets() {
    if (is_page_template('create-book-page.php')) {
        // Подключение стилей и скриптов jQuery UI
        wp_enqueue_style('jquery-ui-css', 'https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css');
        wp_enqueue_script('jquery-ui-js', 'https://code.jquery.com/ui/1.13.2/jquery-ui.min.js', array('jquery'), null, true);

        // Подключение пользовательских стилей и скриптов
        wp_enqueue_style('create-book-style', get_template_directory_uri() . '/css/create-book.css');
        wp_enqueue_script('create-book-script', get_template_directory_uri() . '/js/create-book.js', array('jquery', 'jquery-ui-autocomplete'), null, true);
        
        // Получаем количество абзацев из метаполя
        $book_paragraphs = get_post_meta(get_the_ID(), 'book_paragraphs', true);
        $paragraph_index = is_array($book_paragraphs) ? count($book_paragraphs) : 0;

        // Локализация скрипта
        wp_localize_script('create-book-script', 'create_book_vars', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce'    => wp_create_nonce('create_book_nonce'),
            'success_url' => get_permalink() . '?status=success',
            'error_url' => get_permalink() . '?status=error',
            'paragraphIndex' => $paragraph_index, // Добавляем количество абзацев
        ));
    }
}
add_action('wp_enqueue_scripts', 'enqueue_create_book_assets');


// Хук для обработки запроса автозаполнения соавторов
add_action('wp_ajax_autocomplete_coauthors', 'autocomplete_coauthors');
add_action('wp_ajax_nopriv_autocomplete_coauthors', 'autocomplete_coauthors');

function autocomplete_coauthors() {
    // Проверка nonce для безопасности
    if ( !isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'create_book_nonce') ) {
        wp_send_json_error(array('message' => 'Ошибка безопасности nonce.'));
    }

    // Получаем термин для поиска (то, что введено в поле автозаполнения)
    $term = sanitize_text_field($_POST['term']);

    // Используем WPDB для поиска постов типа 'book', заголовков которых есть введенный термин
    global $wpdb;

    // Строим запрос для поиска
    $query = "
        SELECT DISTINCT post_title
        FROM $wpdb->posts
        WHERE post_title LIKE %s
        AND post_type = 'book'
        AND post_status = 'publish'
        ORDER BY post_title ASC
        LIMIT 10
    ";

    // Выполняем запрос с подстановкой термина
    $results = $wpdb->get_results($wpdb->prepare($query, '%' . $wpdb->esc_like($term) . '%'));

    // Если результаты есть, отправляем их в формате JSON
    if ($results) {
        $coauthors = array();
        foreach ($results as $result) {
            $coauthors[] = $result->post_title;
        }

        wp_send_json_success($coauthors);
    } else {
        // Если результатов нет, отправляем ошибку
        wp_send_json_error(array('message' => 'Нет совпадений для поиска.'));
    }
}

function theme_enqueue_assets() {
    // Подключение стилей
    wp_enqueue_style('theme-style', get_template_directory_uri() . '/css/book.css');

    // Подключение скриптов
    wp_enqueue_script('theme-scripts', get_template_directory_uri() . '/js/book.js', array('jquery'), '1.0', true);
}
add_action('wp_enqueue_scripts', 'theme_enqueue_assets');
add_action('wp_ajax_add_story_comment', 'add_story_comment');
add_action('wp_ajax_nopriv_add_story_comment', 'add_story_comment');

// AJAX обработчик для добавления комментария к истории
add_action('wp_ajax_add_story_comment', 'handle_add_story_comment');
add_action('wp_ajax_nopriv_add_story_comment', 'handle_add_story_comment'); // Для незарегистрированных пользователей

// Ваш существующий код функции
function add_story_comment() {
    $story_id = intval($_POST['story_id']);
    $comment_content = sanitize_text_field($_POST['story_comment_content']);
    $current_user_id = get_current_user_id();
    $author_id = get_post($story_id)->post_author;

    // Получаем существующие комментарии у автора сюжета
    $story_comments = get_user_meta($author_id, 'story_comments', true);
    if (!$story_comments) {
        $story_comments = [];
    }

    // Проверка на существование комментария, чтобы избежать дублирования
    $existing_comment = false;
    foreach ($story_comments as $comment) {
        if ($comment['comment_content'] === $comment_content && $comment['comment_author'] === $current_user_id) {
            $existing_comment = true;
            break;
        }
    }

    // Добавляем новый комментарий, если его ещё нет
    if (!$existing_comment) {
        $story_comments[] = [
            'story_id' => $story_id,
            'story_title' => get_the_title($story_id),
            'comment_content' => $comment_content,
            'comment_author' => $current_user_id,
            'comment_date' => current_time('mysql'),
            'replies' => [] // Инициализируем массив для ответов
        ];

        // Сохраняем комментарий
        update_user_meta($author_id, 'story_comments', $story_comments);
        echo '<p>Комментарий добавлен.</p>';
    } else {
        echo '<p>Вы уже отправили этот комментарий.</p>';
    }
    wp_die(); // Завершаем AJAX запрос
}
function handle_add_story_comment() {
    error_log('AJAX обработчик вызван');
    check_ajax_referer('interactive_story_nonce', 'nonce');

    // Проверка авторизации
    if (!is_user_logged_in()) {
        wp_send_json_error(array('message' => 'Вы должны быть авторизованы для добавления комментария.'));
        return;
    }

    // Получаем данные из запроса
    $story_id = isset($_POST['story_id']) ? intval($_POST['story_id']) : 0;
    $comment_content = isset($_POST['story_comment_content']) ? sanitize_text_field($_POST['story_comment_content']) : '';
    $current_user_id = get_current_user_id();

    error_log("story_id: $story_id, comment_content: $comment_content, current_user_id: $current_user_id");

    if ($story_id && !empty($comment_content)) {
        $story = get_post($story_id);
        if ($story && $story->post_type === 'interactive_story') {
            error_log('История найдена');
            $author_id = $story->post_author;

            // Получаем существующие комментарии
            $story_comments = get_user_meta($author_id, 'story_comments', true);
            if (!$story_comments) {
                $story_comments = [];
            }

            error_log("Текущие комментарии: " . print_r($story_comments, true));

            // Проверка на существование комментария
            $existing_comment = false;
            foreach ($story_comments as $comment) {
                if ($comment['comment_content'] === $comment_content && $comment['comment_author'] === $current_user_id) {
                    $existing_comment = true;
                    break;
                }
            }

            // Добавляем новый комментарий
            if (!$existing_comment) {
                $story_comments[] = [
                    'story_id' => $story_id,
                    'story_title' => $story->post_title,
                    'comment_content' => $comment_content,
                    'comment_author' => $current_user_id,
                    'comment_date' => current_time('mysql'),
                    'replies' => []
                ];

                // Сохраняем комментарий
                $update_result = update_user_meta($author_id, 'story_comments', $story_comments);
                if ($update_result === false) {
                    error_log('Ошибка при сохранении комментариев в user_meta: ' . print_r($story_comments, true));
                    wp_send_json_error(array('message' => 'Ошибка при сохранении комментария.'));
                } else {
                    error_log('Комментарий успешно сохранён');
                    wp_send_json_success(array('message' => 'Комментарий добавлен.'));
                }
            } else {
                wp_send_json_error(array('message' => 'Вы уже отправили этот комментарий.'));
            }
        } else {
            wp_send_json_error(array('message' => 'История не найдена.'));
        }
    } else {
        wp_send_json_error(array('message' => 'Некорректные данные.'));
    }
}
function add_story_reply() {
    check_ajax_referer('interactive_story_nonce', 'nonce');

    // Проверка авторизации
    if (!is_user_logged_in()) {
        wp_send_json_error(array('message' => 'Вы должны быть авторизованы для добавления ответа.'));
        return;
    }

    // Получаем данные из запроса
    $story_id = intval($_POST['story_id']);
    $comment_id = intval($_POST['comment_id']);
    $reply_content = sanitize_text_field($_POST['reply_content']);
    $current_user_id = get_current_user_id();

    // Получаем комментарии автора сюжета
    $story_comments = get_user_meta(get_post($story_id)->post_author, 'story_comments', true);
    
    if (!$story_comments) {
        wp_send_json_error(array('message' => 'Комментарий не найден.'));
        return;
    }

    // Поиск комментария по ID
    foreach ($story_comments as &$comment) {
        if ($comment['comment_id'] == $comment_id) {
            $comment['replies'][] = [
                'reply_content' => $reply_content,
                'reply_author' => $current_user_id,
                'reply_date' => current_time('mysql'),
            ];
            break;
        }
    }

    // Сохраняем обновленные комментарии
    update_user_meta(get_post($story_id)->post_author, 'story_comments', $story_comments);
    wp_send_json_success(array('message' => 'Ответ добавлен.'));
}
function handle_avatar_upload() {
    if (isset($_POST['avatar_nonce']) && wp_verify_nonce($_POST['avatar_nonce'], 'upload_avatar')) {
        if (isset($_FILES['profile_avatar_file']) && !$_FILES['profile_avatar_file']['error']) {
            $uploaded_file = $_FILES['profile_avatar_file'];

            $upload_overrides = array('test_form' => false);
            $movefile = wp_handle_upload($uploaded_file, $upload_overrides);

            if ($movefile && !isset($movefile['error'])) {
                $user_id = get_current_user_id();
                update_user_meta($user_id, 'profile_avatar', $movefile['url']);

                // Перенаправляем на профиль пользователя после успешного обновления
                wp_redirect(get_author_posts_url($user_id));
                exit;
            } else {
                echo "Error uploading file: " . $movefile['error'];
            }
        }
    }
}
add_action('admin_post_upload_avatar', 'handle_avatar_upload');
add_action('admin_post_nopriv_upload_avatar', 'handle_avatar_upload');
// Функция для сохранения нового диалога
// Функция для сохранения нового диалога
function handle_create_new_dialog() {
    error_log('Received POST data: ' . print_r($_POST, true));  // Логируем все переданные данные
    $friend_id = isset($_POST['friend_id']) ? intval($_POST['friend_id']) : 0;
    $current_user_id = isset($_POST['current_user_id']) ? intval($_POST['current_user_id']) : 0;

    if (!$friend_id || !$current_user_id) {
        wp_send_json_error(['message' => 'Некорректные данные: ID пользователя или друга отсутствует.']);
        return;
    }

    if ($friend_id === $current_user_id) {
        wp_send_json_error(['message' => 'Невозможно создать диалог с самим собой.']);
        return;
    }

    // Проверяем, что метаданные загружены корректно
    $dialogs = get_user_meta($current_user_id, 'dialogs', true);
    if (!is_array($dialogs)) {
        $dialogs = [];
    }

    // Проверяем наличие существующего диалога
    foreach ($dialogs as $dialog) {
        if (($dialog['sender_id'] == $current_user_id && $dialog['recipient_id'] == $friend_id) ||
            ($dialog['sender_id'] == $friend_id && $dialog['recipient_id'] == $current_user_id)) {
            wp_send_json_error(['message' => 'Диалог с этим другом уже существует.']);
            return;
        }
    }

    // Создаём новый диалог
    $new_dialog = [
        'sender_id' => $current_user_id,
        'recipient_id' => $friend_id,
        'content' => 'Привет, это твой первый диалог с этим другом!'
    ];

    $dialogs[] = $new_dialog;
    update_user_meta($current_user_id, 'dialogs', $dialogs);

    $recipient_dialogs = get_user_meta($friend_id, 'dialogs', true);
    if (!is_array($recipient_dialogs)) {
        $recipient_dialogs = [];
    }
    $recipient_dialogs[] = $new_dialog;
    update_user_meta($friend_id, 'dialogs', $recipient_dialogs);

    wp_send_json_success(['message' => 'Диалог успешно создан.']);
}

add_action('wp_ajax_create_new_dialog', 'handle_create_new_dialog');

function save_message($sender_id, $recipient_id, $message) {
    global $wpdb;

    // Подготовка данных для сохранения в таблице
    $data = [
        'sender_id' => $sender_id,
        'recipient_id' => $recipient_id,
        'message' => $message,
        'timestamp' => current_time('mysql'),
    ];

    // Вставка данных в таблицу сообщений
    $table = $wpdb->prefix . 'messages';
    $wpdb->insert($table, $data);

    return $wpdb->insert_id;  // Возвращаем ID вставленного сообщения
}
function load_messages() {
    $sender_id = intval($_POST['sender_id']);
    $recipient_id = intval($_POST['recipient_id']);

    // Получаем сообщения из базы данных
    global $wpdb;
    $table = $wpdb->prefix . 'messages';

    $messages = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM $table WHERE (sender_id = %d AND recipient_id = %d) OR (sender_id = %d AND recipient_id = %d) ORDER BY timestamp ASC",
        $sender_id, $recipient_id, $recipient_id, $sender_id
    ));

    if ($messages) {
        ob_start();
        foreach ($messages as $message) {
            // Выводим сообщение
            $message_class = $message->sender_id == $sender_id ? 'sent' : 'received';
            ?>
            <div class="message <?php echo $message_class; ?>">
                <?php echo esc_html($message->message); ?>
            </div>
            <?php
        }
        $messages_html = ob_get_clean();
        wp_send_json_success(['messages_html' => $messages_html]);
    } else {
        wp_send_json_success(['messages_html' => '<p>Нет сообщений.</p>']);
    }
}

add_action('wp_ajax_load_messages', 'load_messages');

function load_dialogs() {
    $current_user_id = get_current_user_id();
    $dialogs = get_user_meta($current_user_id, 'dialogs', true);

    if ($dialogs) {
        ob_start();  // Начинаем буферизацию вывода
        foreach ($dialogs as $dialog) {
            $dialog_with_id = ($dialog['sender_id'] === $current_user_id) ? $dialog['recipient_id'] : $dialog['sender_id'];

            // Получаем сообщения для этого диалога
            global $wpdb;
            $table = $wpdb->prefix . 'messages';
            $messages = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM $table WHERE (sender_id = %d AND recipient_id = %d) OR (sender_id = %d AND recipient_id = %d) ORDER BY timestamp ASC",
                $current_user_id, $dialog_with_id, $dialog_with_id, $current_user_id
            ));

            // Загружаем информацию о друге
            $friend = get_user_by('id', $dialog_with_id);
            $friend_avatar = $friend ? get_avatar_url($friend->ID) : 'default-avatar-url';
            $friend_name = $friend ? $friend->display_name : 'Unknown User';

            ?>
            <div class="dialog-item" data-dialog-with="<?php echo esc_attr($dialog_with_id); ?>">
                <div class="dialog-header">
                    <img src="<?php echo esc_url($friend_avatar); ?>" alt="Avatar" class="friend-avatar">
                    <span class="friend-name"><?php echo esc_html($friend_name); ?></span>
                </div>
                <div class="messages-container">
                    <?php
                    // Отображаем сообщения
                    if ($messages) {
                        foreach ($messages as $message) {
                            $message_class = $message->sender_id == $current_user_id ? 'sent' : 'received';
                            echo '<div class="message ' . esc_attr($message_class) . '">' . esc_html($message->message) . '</div>';
                        }
                    } else {
                        echo '<p>Нет сообщений.</p>';
                    }
                    ?>
                </div>
                <form class="message-form" data-dialog-with="<?php echo esc_attr($dialog_with_id); ?>">
                    <textarea class="message-input" placeholder="Напишите сообщение..."></textarea>
                    <button type="submit" class="send-message-btn">Отправить</button>
                </form>
            </div>
            <?php
        }
        $dialogs_html = ob_get_clean();  // Получаем буферизованный HTML

        wp_send_json_success(['dialogs_html' => $dialogs_html]);
    } else {
        wp_send_json_success(['dialogs_html' => '<p>Нет диалогов.</p>']);
    }
}


add_action('wp_ajax_load_dialogs', 'load_dialogs');

function send_message_function() {
    $sender_id = intval($_POST['sender_id']);
    $recipient_id = intval($_POST['recipient_id']);
    $message = sanitize_text_field($_POST['message']);
    
    // Проверка, что все данные переданы
    if (empty($sender_id) || empty($recipient_id) || empty($message)) {
        wp_send_json_error(['message' => 'Некорректные данные.']);
        return;
    }

    // Логика для сохранения сообщения в базе данных
    $message_id = save_message($sender_id, $recipient_id, $message);

    if ($message_id) {
        // Возвращаем успешный ответ с сообщением
        wp_send_json_success(['message' => $message]);
    } else {
        // Если произошла ошибка
        wp_send_json_error(['message' => 'Ошибка при сохранении сообщения в базе данных.']);
    }
}


add_action('wp_ajax_send_message', 'send_message_function');

?>