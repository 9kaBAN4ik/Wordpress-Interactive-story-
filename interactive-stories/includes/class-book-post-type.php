<?php
// Класс для работы с типом записи "Книга"
    
class Book_Post_Type {
    // Конструктор класса
    public function __construct() {
        // Инициализация действий для регистрации типа записи и мета-боксов
        add_action('init', array($this, 'register_book_post_type'));
        add_action('add_meta_boxes', array($this, 'add_book_meta_boxes'));
        add_action('save_post', array($this, 'save_book_meta_box_data'));
        // Обработка AJAX-запроса для создания книги
        add_action('wp_ajax_handle_create_book_form', array($this, 'handle_create_book_form'));
        add_action('wp_ajax_nopriv_handle_create_book_form', array($this, 'handle_create_book_form'));
        // Регистрация маршрута API
        add_action('rest_api_init', array($this, 'register_book_api_routes'));
    }

    // Регистрация пользовательского типа записи
    public function register_book_post_type() {
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

    // Добавление мета-боксов
    public function add_book_meta_boxes() {
        add_meta_box(
            'book_details',
            'Детали книги',
            array($this, 'display_book_meta_box'),
            'book',
            'normal',
            'high'
        );
    
        // Загружаем JavaScript, если это редактирование записи типа 'book'
        if (get_post_type() == 'book') {
            // Получаем значения метаполей
            $book_genre = get_post_meta(get_the_ID(), 'book_genre', true);
            $book_subgenre1 = get_post_meta(get_the_ID(), 'book_subgenre1', true);
            $book_subgenre2 = get_post_meta(get_the_ID(), 'book_subgenre2', true);
    
            // Передаем их в JavaScript через wp_localize_script
            wp_localize_script('custom-book-script', 'bookMetaData', array(
                'genre' => $book_genre,
                'subgenre1' => $book_subgenre1,
                'subgenre2' => $book_subgenre2,
            ));
        }
    }

    // Отображение мета-бокса
    public function display_book_meta_box($post) {
        // Получаем мета-данные
        $book_author = get_post_meta($post->ID, 'book_author', true);
        $book_cover = get_post_meta($post->ID, 'book_cover', true);
        $book_genre = get_post_meta($post->ID, 'book_genre', true);
        $book_annotation = get_post_meta($post->ID, 'book_annotation', true);
        $book_author_notes = get_post_meta($post->ID, 'book_author_notes', true);
        $book_tags = get_post_meta($post->ID, 'book_tags', true);
        $book_visibility = get_post_meta($post->ID, 'book_visibility', true);
        $book_is_adult = get_post_meta($post->ID, 'book_is_adult', true);
        $book_type = get_post_meta($post->ID, 'book_type', true);
        $book_subgenre1 = get_post_meta($post->ID, 'book_subgenre1', true);
        $book_subgenre2 = get_post_meta($post->ID, 'book_subgenre2', true);
        $book_coAuthor = get_post_meta($post->ID, 'book_coAuthor', true);
        $book_authorNote = get_post_meta($post->ID, 'book_authorNote', true);
        $book_description = get_post_meta($post->ID, 'book_description', true);
    
        // Получаем абзацы как JSON
        $book_paragraphs = get_post_meta($post->ID, 'book_paragraphs', true); 
    
        // Поля формы
        wp_nonce_field('save_book_meta_box_data', 'book_meta_box_nonce');
        ?>
        <!-- Поля для мета-бокса -->
        <p><label for="book_author">Автор:</label><input type="text" id="book_author" name="book_author" value="<?php echo esc_attr($book_author); ?>" /></p>
        <p><label for="book_cover">Обложка:</label><input type="text" id="book_cover" name="book_cover" value="<?php echo esc_attr($book_cover); ?>" /></p>
        <p><label for="book_genre">Жанр:</label><input type="text" id="book_genre" name="book_genre" value="<?php echo esc_attr($book_genre); ?>" /></p>
        <p><label for="book_annotation">Аннотация:</label><textarea id="book_annotation" name="book_annotation"><?php echo esc_textarea($book_annotation); ?></textarea></p>
        <p><label for="book_author_notes">Примечания автора:</label><textarea id="book_author_notes" name="book_author_notes"><?php echo esc_textarea($book_author_notes); ?></textarea></p>
        <p><label for="book_tags">Теги:</label><input type="text" id="book_tags" name="book_tags" value="<?php echo esc_attr($book_tags); ?>" /></p>
        <p><label for="book_visibility">Кто может видеть:</label><input type="text" id="book_visibility" name="book_visibility" value="<?php echo esc_attr($book_visibility); ?>" /></p>
        <p><label for="book_is_adult">Для взрослых:</label><input type="checkbox" id="book_is_adult" name="book_is_adult" value="1" <?php checked($book_is_adult, '1'); ?> /></p>
        <p><label for="book_type">Тип книги:</label><input type="text" id="book_type" name="book_type" value="<?php echo esc_attr($book_type); ?>" /></p>
        <p><label for="book_subgenre1">Поджанр 1:</label><input type="text" id="book_subgenre1" name="book_subgenre1" value="<?php echo esc_attr($book_subgenre1); ?>" /></p>
        <p><label for="book_subgenre2">Поджанр 2:</label><input type="text" id="book_subgenre2" name="book_subgenre2" value="<?php echo esc_attr($book_subgenre2); ?>" /></p>
        <p><label for="book_coAuthor">Соавтор:</label><input type="text" id="book_coAuthor" name="book_coAuthor" value="<?php echo esc_attr($book_coAuthor); ?>" /></p>
        <p><label for="book_authorNote">Примечания автора:</label><textarea id="book_authorNote" name="book_authorNote"><?php echo esc_textarea($book_authorNote); ?></textarea></p>
        <p><label for="book_description">Описание:</label><textarea id="book_description" name="book_description"><?php echo esc_textarea($book_description); ?></textarea></p>
    
        <!-- Новое поле для абзацев -->
        <p><label for="book_paragraphs">Абзацы книги (JSON):</label><textarea id="book_paragraphs" name="book_paragraphs"><?php echo esc_textarea($book_paragraphs); ?></textarea></p>
        <?php
    }

    // Сохранение данных мета-бокса
    public function save_book_meta_box_data($post_id) {
        // Проверка nonce
        if (!isset($_POST['book_meta_box_nonce']) || !wp_verify_nonce($_POST['book_meta_box_nonce'], 'save_book_meta_box_data')) {
            return;
        }
    
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
    
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }
    
        // Сохранение других полей (например, автора, жанра и т.д.)
        $fields = [
            'book_author' => sanitize_text_field,
            'book_cover' => sanitize_text_field,
            'book_genre' => sanitize_text_field,
            'book_annotation' => sanitize_textarea_field,
            'book_author_notes' => sanitize_textarea_field,
            'book_tags' => sanitize_text_field,
            'book_visibility' => sanitize_text_field,
            'book_is_adult' => function($value) { return isset($value) ? '1' : '0'; },
            'book_type' => sanitize_text_field,
            'book_subgenre1' => sanitize_text_field,
            'book_subgenre2' => sanitize_text_field,
            'book_coAuthor' => sanitize_text_field,
            'book_authorNote' => sanitize_textarea_field,
            'book_description' => sanitize_textarea_field,
        ];
    
        foreach ($fields as $key => $sanitize_function) {
            if (isset($_POST[$key])) {
                $value = $_POST[$key];
                if (is_callable($sanitize_function)) {
                    $value = $sanitize_function($value);
                }
                update_post_meta($post_id, $key, $value);
            }
        }
    
        // Обработка абзацев
        if (isset($_POST['book_paragraphs'])) {
            $book_paragraphs = $_POST['book_paragraphs'];
            // Сохраняем абзацы как строку JSON
            update_post_meta($post_id, 'book_paragraphs', wp_kses_post($book_paragraphs)); // Храним как строку JSON
        }
    }
    

    // Обработка формы через AJAX (для создания книги через форму)
    public function handle_create_book_form() {
        // Пример обработчика формы
        // Данные формы поступают через $_POST и сохраняются через wp_insert_post и update_post_meta
    }

    // Регистрация маршрутов API для книги
    public function register_book_api_routes() {
        register_rest_route('books/v1', '/get_book_data/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_book_data'),
            'permission_callback' => '__return_true', // Можно настроить на более строгие правила доступа
        ));
    }

    // Получение данных о книге
    public function get_book_data($data) {
        $book_id = $data['id'];
        $book = get_post($book_id);
        
        if (!$book || $book->post_type !== 'book') {
            return new WP_Error('no_book', 'Книга не найдена', array('status' => 404));
        }

        $book_meta = get_post_meta($book_id);

        return rest_ensure_response(array(
            'title' => get_the_title($book_id),
            'author' => $book_meta['book_author'][0] ?? '',
            'cover' => $book_meta['book_cover'][0] ?? '',
            'genre' => $book_meta['book_genre'][0] ?? '',
            'annotation' => $book_meta['book_annotation'][0] ?? '',
            'author_notes' => $book_meta['book_author_notes'][0] ?? '',
            'tags' => $book_meta['book_tags'][0] ?? '',
            'visibility' => $book_meta['book_visibility'][0] ?? '',
            'is_adult' => $book_meta['book_is_adult'][0] ?? '',
            'type' => $book_meta['book_type'][0] ?? '',
            'subgenre1' => $book_meta['book_subgenre1'][0] ?? '',
            'subgenre2' => $book_meta['book_subgenre2'][0] ?? '',
            'coAuthor' => $book_meta['book_coAuthor'][0] ?? '',
            'authorNote' => $book_meta['book_authorNote'][0] ?? '',
            'description' => $book_meta['book_description'][0] ?? '',
        ));
    }
}

// Инициализация класса
new Book_Post_Type();
