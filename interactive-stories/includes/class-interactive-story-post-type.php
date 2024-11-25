<?php
class Interactive_Story_Post_Type {
    public static function register() {
        register_post_type('interactive_story',
            array(
                'labels' => array(
                    'name' => __('Интерактивные Сюжеты'),
                    'singular_name' => __('Интерактивный Сюжет')
                ),
                'public' => true,
                'has_archive' => true,
                'supports' => array('title', 'editor', 'thumbnail'),
                'rewrite' => array('slug' => 'interactive-stories'),
            )
        );
        add_action('add_meta_boxes', array(__CLASS__, 'add_meta_boxes'));
        add_action('save_post', array(__CLASS__, 'save_meta_box_data'));
    }

    public static function add_meta_boxes() {
        add_meta_box(
            'interactive_story_details',
            'Детали Интерактивного Сюжета',
            array(__CLASS__, 'render_details_meta_box'),
            'interactive_story'
        );
        add_meta_box(
            'interactive_story_paragraphs',
            'Параграфы',
            array(__CLASS__, 'render_paragraphs_meta_box'),
            'interactive_story'
        );
        add_meta_box(
            'interactive_story_facts_resources',
            'Факты и Ресурсы',
            array(__CLASS__, 'render_facts_resources_meta_box'),
            'interactive_story'
        );
        add_meta_box(
            'interactive_story_triggers',
            'Триггеры и Формулы',
            array(__CLASS__, 'render_triggers_meta_box'),
            'interactive_story'
        );
        add_meta_box(
            'interactive_story_reviews',
            'Рецензии и Оценки',
            array(__CLASS__, 'render_reviews_meta_box'),
            'interactive_story'
        );
    }

    public static function render_details_meta_box($post) {
        $price = get_post_meta($post->ID, '_interactive_story_price', true);
        $free_trials = get_post_meta($post->ID, '_interactive_story_free_trials', true);

        wp_nonce_field('interactive_story_details_nonce', 'interactive_story_details_nonce');

        echo '<label for="interactive_story_price">Цена: </label>';
        echo '<input type="text" id="interactive_story_price" name="interactive_story_price" value="' . esc_attr($price) . '" />';
        echo '<br/><br/>';

        echo '<label for="interactive_story_free_trials">Бесплатные попытки: </label>';
        echo '<input type="number" id="interactive_story_free_trials" name="interactive_story_free_trials" value="' . esc_attr($free_trials) . '" />';
    }

    public static function render_paragraphs_meta_box($post) {
        $paragraphs = get_post_meta($post->ID, '_interactive_story_paragraphs', true);

        if (is_serialized($paragraphs)) {
            $paragraphs = unserialize($paragraphs);
        }

        $paragraphs_json = json_encode($paragraphs, JSON_UNESCAPED_UNICODE);

        wp_nonce_field('interactive_story_paragraphs_nonce', 'interactive_story_paragraphs_nonce');

        echo '<h4>Параграфы</h4>';
        echo '<textarea name="interactive_story_paragraphs" id="interactive_story_paragraphs" rows="10" style="width: 100%">' . esc_textarea($paragraphs_json) . '</textarea>';
    }

    public static function render_facts_resources_meta_box($post) {
        $facts = get_post_meta($post->ID, '_interactive_story_fact_groups', true);
        $resources = get_post_meta($post->ID, '_interactive_story_resource_groups', true);

        $facts = is_serialized($facts) ? unserialize($facts) : [];
        $resources = is_serialized($resources) ? unserialize($resources) : [];

        wp_nonce_field('interactive_story_facts_resources_nonce', 'interactive_story_facts_resources_nonce');

        echo '<h4>Факты</h4>';
        echo '<textarea name="interactive_story_facts" id="interactive_story_facts" rows="5" style="width: 100%">' . esc_textarea(json_encode($facts, JSON_UNESCAPED_UNICODE)) . '</textarea>';
        echo '<h4>Ресурсы</h4>';
        echo '<textarea name="interactive_story_resources" id="interactive_story_resources" rows="5" style="width: 100%">' . esc_textarea(json_encode($resources, JSON_UNESCAPED_UNICODE)) . '</textarea>';
    }

    public static function render_triggers_meta_box($post) {
        $triggers = get_post_meta($post->ID, '_interactive_story_triggers', true);
        $triggers = is_serialized($triggers) ? unserialize($triggers) : [];

        // Отделяем формулы для отдельного поля
        $formulas = get_post_meta($post->ID, '_interactive_story_formulas', true);
        $formulas = is_serialized($formulas) ? unserialize($formulas) : [];

        wp_nonce_field('interactive_story_triggers_nonce', 'interactive_story_triggers_nonce');

        echo '<h4>Триггеры</h4>';
        echo '<textarea name="interactive_story_triggers" id="interactive_story_triggers" rows="10" style="width: 100%">' . esc_textarea(json_encode($triggers, JSON_UNESCAPED_UNICODE)) . '</textarea>';

        echo '<h4>Формулы</h4>';
        echo '<textarea name="interactive_story_formulas" id="interactive_story_formulas" rows="10" style="width: 100%">' . esc_textarea(json_encode($formulas, JSON_UNESCAPED_UNICODE)) . '</textarea>';
    }

    public static function render_reviews_meta_box($post) {
        $ratings = get_post_meta($post->ID, '_interactive_story_ratings', true);
        $reviews = get_post_meta($post->ID, '_interactive_story_reviews', true);

        wp_nonce_field('interactive_story_reviews_nonce', 'interactive_story_reviews_nonce');

        echo '<h4>Оценки</h4>';
        echo '<textarea name="interactive_story_ratings" rows="5" style="width: 100%">' . esc_textarea($ratings) . '</textarea>';
        echo '<h4>Рецензии</h4>';
        echo '<textarea name="interactive_story_reviews" rows="5" style="width: 100%">' . esc_textarea($reviews) . '</textarea>';
    }

    public static function save_meta_box_data($post_id) {
        if (!isset($_POST['interactive_story_details_nonce']) || !wp_verify_nonce($_POST['interactive_story_details_nonce'], 'interactive_story_details_nonce')) {
            return;
        }
    
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
    
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }
    
        // Определяем мета-данные для сохранения
        $meta_keys = [
            '_interactive_story_price' => 'interactive_story_price',
            '_interactive_story_free_trials' => 'interactive_story_free_trials',
            '_interactive_story_paragraphs' => 'interactive_story_paragraphs',
            '_interactive_story_fact_groups' => 'interactive_story_facts',
            '_interactive_story_resource_groups' => 'interactive_story_resources',
            '_interactive_story_triggers' => 'interactive_story_triggers',
            '_interactive_story_formulas' => 'interactive_story_formulas',
            '_interactive_story_ratings' => 'interactive_story_ratings',
            '_interactive_story_reviews' => 'interactive_story_reviews'
        ];
    
        foreach ($meta_keys as $meta_key => $post_key) {
            if (isset($_POST[$post_key])) {
                $value = is_array($_POST[$post_key]) ? json_decode(stripslashes($_POST[$post_key]), true) : sanitize_text_field($_POST[$post_key]);
                update_post_meta($post_id, $meta_key, $value);
            }
        }
    
        // Обработка изображений из блобов
        if (isset($_POST['story_data'])) {
            $story_data = json_decode(stripslashes($_POST['story_data']), true);
            
            foreach ($story_data as $index => $paragraph) {
                if (isset($paragraph['autoChanges'])) {
                    foreach ($paragraph['autoChanges'] as &$autoChange) {
                        if (isset($autoChange['parameters'])) {
                            $params = json_decode($autoChange['parameters'], true);
                            if (isset($params['achievement_image'])) {
                                // Сохраняем изображение как строку
                                $params['achievement_image'] = sanitize_text_field($params['achievement_image']);
                            }
                            $autoChange['parameters'] = json_encode($params);
                        }
                    }
                }
            }
    
            // Сохраняем обработанные данные
            update_post_meta($post_id, '_interactive_story_story_data', json_encode($story_data));
        }
    }
    
}
// Инициализация
add_action('init', array('Interactive_Story_Post_Type', 'register'));
add_action('wp_ajax_upload_achievement_image', 'upload_achievement_image');

function upload_achievement_image() {
    check_ajax_referer('your_nonce_name', 'nonce');

    if (!isset($_FILES['file'])) {
        error_log('Файл не загружен.');
        wp_send_json_error(['message' => 'Файл не загружен.']);
    }

    if ($_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        error_log('Ошибка загрузки файла: ' . $_FILES['file']['error']);
        wp_send_json_error(['message' => 'Ошибка загрузки файла: ' . $_FILES['file']['error']]);
    }

    $file = $_FILES['file'];
    error_log('Файл загружается: ' . print_r($file, true)); // Отладка

    // Проверка допустимых типов файлов
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($file['type'], $allowed_types)) {
        error_log('Недопустимый тип файла: ' . $file['type']);
        wp_send_json_error(['message' => 'Недопустимый тип файла.']);
    }

    $upload = wp_handle_upload($file, ['test_form' => false]);

    if (isset($upload['error'])) {
        error_log('Ошибка обработки файла: ' . $upload['error']); // Отладка
        wp_send_json_error(['message' => 'Ошибка обработки файла: ' . $upload['error']]);
    }

    error_log('Файл успешно загружен: ' . $upload['url']); // Отладка
    wp_send_json_success(['url' => $upload['url']]);
}






// Обработка AJAX запроса
function handle_story_construction() {
    check_ajax_referer('interactive_story_nonce', 'nonce');

    $story_data = isset($_POST['story_data']) ? json_decode(stripslashes($_POST['story_data']), true) : null;

    if (!$story_data) {
        error_log("Полученные данные некорректны или пусты.");
        wp_send_json_error(array('message' => 'Некорректные данные.'));
        wp_die();
    }

    error_log("Полученные данные сюжета: " . print_r($story_data, true));

    $title = isset($story_data['title']) ? sanitize_text_field($story_data['title']) : '';
    $paragraphs = isset($story_data['paragraphs']) ? $story_data['paragraphs'] : [];
    $factGroups = isset($story_data['factGroups']) ? $story_data['factGroups'] : [];
    $resourceGroups = isset($story_data['resourceGroups']) ? $story_data['resourceGroups'] : [];
    $formulas = isset($story_data['formulas']) ? $story_data['formulas'] : [];

    error_log("Заголовок: " . $title);
    error_log("Параграфы: " . print_r($paragraphs, true));
    error_log("Факты: " . print_r($factGroups, true));
    error_log("Ресурсы: " . print_r($resourceGroups, true));
    error_log("Формулы: " . print_r($formulas, true));

    if (empty($title) || empty($paragraphs) || !is_array($paragraphs) || count($paragraphs) === 0) {
        wp_send_json_error(array('message' => 'Заголовок или параграфы не могут быть пустыми.'));
        wp_die();
    }

    // Проверка формул и их параметров
    foreach ($formulas as &$formula) {
        if (empty($formula['parameters'])) {
            $formula['parameters'] = 'пусто'; // или другой текст по умолчанию
        }
    }

    $post_id = wp_insert_post(array(
        'post_title'   => $title,
        'post_type'    => 'interactive_story',
        'post_status'  => 'publish'
    ));

    if ($post_id) {
        update_post_meta($post_id, '_interactive_story_paragraphs', serialize($paragraphs));
        update_post_meta($post_id, '_interactive_story_fact_groups', serialize($factGroups));
        update_post_meta($post_id, '_interactive_story_resource_groups', serialize($resourceGroups));
        update_post_meta($post_id, '_interactive_story_formulas', serialize($formulas));

        wp_send_json_success(array('message' => 'Сюжет успешно сохранен.'));
    } else {
        error_log("Ошибка создания поста: Заголовок - $title");
        wp_send_json_error(array('message' => 'Не удалось создать сюжет.'));
    }

    wp_die();
}

add_action('wp_ajax_handle_story_construction', 'handle_story_construction');
add_action('wp_ajax_nopriv_handle_story_construction', 'handle_story_construction');
?>