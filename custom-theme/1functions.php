<?php
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
        wp_enqueue_script('jquery');
        wp_enqueue_script('register-page', get_template_directory_uri() . '/js/register-page.js', array('jquery'), null, true);
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
function handle_create_book_form() {
    // Логирование запроса для отладки
    error_log('Request received');
    error_log('POST Data: ' . print_r($_POST, true));
    error_log('FILES Data: ' . print_r($_FILES, true));

    // Проверка nonce для защиты от CSRF
    check_ajax_referer('create_book_nonce', 'nonce');

    // Получение и очистка данных из POST запроса
    $title = isset($_POST['book-title']) ? sanitize_text_field($_POST['book-title']) : '';
    $author = isset($_POST['book-author']) ? sanitize_text_field($_POST['book-author']) : '';
    $description = isset($_POST['book-description']) ? sanitize_textarea_field($_POST['book-description']) : '';
    $genre = isset($_POST['book-genre']) ? sanitize_text_field($_POST['book-genre']) : '';
    $subgenre1 = isset($_POST['book-subgenre1']) ? sanitize_text_field($_POST['book-subgenre1']) : '';
    $subgenre2 = isset($_POST['book-subgenre2']) ? sanitize_text_field($_POST['book-subgenre2']) : '';
    $coAuthor = isset($_POST['book-coAuthor']) ? sanitize_text_field($_POST['book-coAuthor']) : '';
    $annotation = isset($_POST['book-annotation']) ? sanitize_textarea_field($_POST['book-annotation']) : '';
    $authorNote = isset($_POST['book-authorNote']) ? sanitize_textarea_field($_POST['book-authorNote']) : '';
    $tags = isset($_POST['book-tags']) ? sanitize_text_field($_POST['book-tags']) : '';
    $visibility = isset($_POST['book-visibility']) ? sanitize_text_field($_POST['book-visibility']) : '';
    $downloadPermission = isset($_POST['book-downloadPermission']) ? sanitize_text_field($_POST['book-downloadPermission']) : '';
    $commentPermission = isset($_POST['book-commentPermission']) ? sanitize_text_field($_POST['book-commentPermission']) : '';
    $type = isset($_POST['book-type']) ? sanitize_text_field($_POST['book-type']) : ''; // Добавлено

    // Логирование полученных данных
    error_log("Title: $title");
    error_log("Author: $author");
    error_log("Description: $description");
    error_log("Genre: $genre");
    error_log("Subgenre1: $subgenre1");
    error_log("Subgenre2: $subgenre2");
    error_log("CoAuthor: $coAuthor");
    error_log("Annotation: $annotation");
    error_log("Author Note: $authorNote");
    error_log("Tags: $tags");
    error_log("Visibility: $visibility");
    error_log("Download Permission: $downloadPermission");
    error_log("Comment Permission: $commentPermission");
    error_log("Type: $type"); // Добавлено

    // Обработка загрузки файла обложки книги
    $cover_id = '';

    if (isset($_FILES['book-cover']) && !empty($_FILES['book-cover']['name'])) {
        $cover = $_FILES['book-cover'];

        // Проверка типа файла
        $allowed_mime_types = array('image/jpeg', 'image/png', 'image/gif');
        if (!in_array($cover['type'], $allowed_mime_types)) {
            error_log('Unsupported file type for cover.');
            wp_send_json_error(array('message' => 'Неподдерживаемый тип файла для обложки.'));
            wp_die();
        }

        // Загрузка файла
        $upload = wp_handle_upload($cover, array('test_form' => false));

        if (isset($upload['file'])) {
            $cover_id = wp_insert_attachment(array(
                'guid' => $upload['url'],
                'post_mime_type' => $upload['type'],
                'post_title' => sanitize_file_name($cover['name']),
                'post_content' => '',
                'post_status' => 'inherit'
            ), $upload['file']);

            if (!is_wp_error($cover_id)) {
                require_once(ABSPATH . 'wp-admin/includes/image.php');
                $attach_data = wp_generate_attachment_metadata($cover_id, $upload['file']);
                wp_update_attachment_metadata($cover_id, $attach_data);
            } else {
                error_log('Failed to insert attachment.');
                wp_send_json_error(array('message' => 'Не удалось загрузить обложку.'));
                wp_die();
            }
        } else {
            error_log('File upload error.');
            wp_send_json_error(array('message' => 'Ошибка при загрузке файла.'));
            wp_die();
        }
    }

    // Создание нового поста типа 'book'
    $new_post = array(
        'post_title'    => $title,
        'post_content'  => $description,
        'post_status'   => 'publish',
        'post_author'   => get_current_user_id(),
        'post_type'     => 'book',
        'meta_input'    => array(
            'book_author' => $author,
            'book_cover'  => $cover_id,
            'book_genre' => $genre,
            'book_subgenre1' => $subgenre1,
            'book_subgenre2' => $subgenre2,
            'book_coAuthor' => $coAuthor,
            'book_annotation' => $annotation,
            'book_authorNote' => $authorNote,
            'book_tags' => $tags,
            'book_visibility' => $visibility,
            'book_downloadPermission' => $downloadPermission,
            'book_commentPermission' => $commentPermission,
            'book_type' => $type // Добавлено
        )
    );

    $post_id = wp_insert_post($new_post);

    if (!is_wp_error($post_id)) {
        wp_send_json_success(array('message' => 'Книга успешно создана.'));
    } else {
        error_log('Failed to create post.');
        wp_send_json_error(array('message' => 'Не удалось создать книгу.'));
    }

    wp_die();
}
add_action('wp_ajax_handle_create_book_form', 'handle_create_book_form');
add_action('wp_ajax_nopriv_handle_create_book_form', 'handle_create_book_form');



// Добавление поля для возраста в профиль пользователя
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
        wp_enqueue_style('create-book-style', get_template_directory_uri() . '/css/create-book.css');
        wp_enqueue_script('create-book-script', get_template_directory_uri() . '/js/create-book.js', array('jquery'), null, true);

        wp_localize_script('create-book-script', 'create_book_vars', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce'    => wp_create_nonce('create_book_nonce'),
            'success_url' => get_permalink() . '?status=success',
            'error_url' => get_permalink() . '?status=error'
        ));
    }
}
add_action('wp_enqueue_scripts', 'enqueue_create_book_assets');
function theme_enqueue_assets() {
    // Подключение стилей
    wp_enqueue_style('theme-style', get_template_directory_uri() . '/css/book.css');

    // Подключение скриптов
    wp_enqueue_script('theme-scripts', get_template_directory_uri() . '/js/book.js', array('jquery'), '1.0', true);
}
add_action('wp_enqueue_scripts', 'theme_enqueue_assets');



?>