<?php
class Interactive_Story_Ratings {
    
    // Конструктор класса
    public function __construct() {
        // Регистрация действий и фильтров
        add_action('init', array($this, 'register_post_types'));
        add_action('save_post', array($this, 'save_rating_review'), 10, 2);
        add_action('wp_ajax_submit_review', array($this, 'handle_ajax_review'));
        add_action('wp_ajax_nopriv_submit_review', array($this, 'handle_ajax_review'));
        add_shortcode('interactive_story_ratings', array($this, 'render_ratings_shortcode'));
    }

    // Регистрация типа записи для рецензий
    public function register_post_types() {
        $labels = array(
            'name'               => _x('Рецензии', 'post type general name', 'textdomain'),
            'singular_name'      => _x('Рецензия', 'post type singular name', 'textdomain'),
            'menu_name'          => _x('Рецензии', 'admin menu', 'textdomain'),
            'name_admin_bar'     => _x('Рецензия', 'add new on admin bar', 'textdomain'),
            'add_new'            => __('Добавить новую', 'textdomain'),
            'add_new_item'       => __('Добавить новую рецензию', 'textdomain'),
            'new_item'           => __('Новая рецензия', 'textdomain'),
            'edit_item'          => __('Редактировать рецензию', 'textdomain'),
            'view_item'          => __('Просмотреть рецензию', 'textdomain'),
            'all_items'          => __('Все рецензии', 'textdomain'),
            'search_items'       => __('Поиск рецензий', 'textdomain'),
            'parent_item_colon'  => __('Родительские рецензии:', 'textdomain'),
            'not_found'          => __('Рецензии не найдены.', 'textdomain'),
            'not_found_in_trash' => __('В корзине рецензии не найдены.', 'textdomain'),
        );

        $args = array(
            'labels'             => $labels,
            'public'             => false,
            'publicly_queryable' => false,
            'show_ui'            => true,
            'show_in_menu'       => true,
            'query_var'          => true,
            'rewrite'            => array('slug' => 'review'),
            'capability_type'    => 'post',
            'has_archive'        => false,
            'hierarchical'       => false,
            'menu_position'      => 25,
            'supports'           => array('title', 'editor'),
        );

        register_post_type('interactive_story_review', $args);
    }

    // Сохранение рецензий и рейтингов
    public function save_rating_review($post_id, $post) {
        // Проверка типа записи
        if ($post->post_type != 'interactive_story_review') {
            return;
        }

        // Проверка nonce
        if (!isset($_POST['interactive_story_review_nonce']) || !wp_verify_nonce($_POST['interactive_story_review_nonce'], 'save_review')) {
            return;
        }

        // Обработка и сохранение данных
        if (isset($_POST['rating'])) {
            update_post_meta($post_id, 'rating', sanitize_text_field($_POST['rating']));
        }

        if (isset($_POST['review_text'])) {
            wp_update_post(array(
                'ID'           => $post_id,
                'post_content' => sanitize_textarea_field($_POST['review_text']),
            ));
        }
    }

    // Обработка AJAX-запроса для рецензий
    public function handle_ajax_review() {
        check_ajax_referer('submit_review_nonce', 'nonce');

        $story_id = isset($_POST['story_id']) ? intval($_POST['story_id']) : 0;
        $rating = isset($_POST['rating']) ? intval($_POST['rating']) : 0;
        $review_text = isset($_POST['review_text']) ? sanitize_textarea_field($_POST['review_text']) : '';

        if (!$story_id || $rating < 1 || $rating > 5) {
            wp_send_json_error(array('message' => 'Неверные данные.'));
        }

        $post_id = wp_insert_post(array(
            'post_title'   => 'Review for Story ID ' . $story_id,
            'post_content' => $review_text,
            'post_type'    => 'interactive_story_review',
            'post_status'  => 'publish',
        ));

        if ($post_id) {
            update_post_meta($post_id, 'rating', $rating);
            update_post_meta($post_id, 'story_id', $story_id);
            wp_send_json_success(array('message' => 'Рецензия успешно отправлена.'));
        } else {
            wp_send_json_error(array('message' => 'Не удалось сохранить рецензию.'));
        }
    }

    // Отображение рейтингов через шорткод
    public function render_ratings_shortcode($atts) {
        $atts = shortcode_atts(array(
            'story_id' => 0,
        ), $atts, 'interactive_story_ratings');

        if (!$atts['story_id']) {
            return '<p>Укажите идентификатор сюжета.</p>';
        }

        ob_start();
        ?>
        <div id="interactive-story-ratings">
            <h3>Оставьте рецензию</h3>
            <form id="rating-review-form">
                <?php wp_nonce_field('submit_review_nonce', 'nonce'); ?>
                <input type="hidden" name="story_id" value="<?php echo esc_attr($atts['story_id']); ?>">
                <label for="rating">Рейтинг:</label>
                <select name="rating" id="rating">
                    <?php for ($i = 1; $i <= 5; $i++) : ?>
                        <option value="<?php echo $i; ?>"><?php echo $i; ?> звезда(ы)</option>
                    <?php endfor; ?>
                </select>

                <label for="review_text">Комментарий:</label>
                <textarea name="review_text" id="review_text" rows="5"></textarea>

                <button type="submit">Отправить</button>
            </form>
            <div id="rating-review-response"></div>
        </div>
        <script>
            jQuery(document).ready(function($) {
                $('#rating-review-form').on('submit', function(e) {
                    e.preventDefault();

                    var form = $(this);
                    var data = form.serialize();

                    $.ajax({
                        url: '<?php echo admin_url('admin-ajax.php'); ?>',
                        type: 'POST',
                        data: data + '&action=submit_review',
                        success: function(response) {
                            if (response.success) {
                                $('#rating-review-response').html('<p>' + response.data.message + '</p>');
                            } else {
                                $('#rating-review-response').html('<p>' + response.data.message + '</p>');
                            }
                        }
                    });
                });
            });
        </script>
        <?php
        return ob_get_clean();
    }
}

// Инициализация класса
new Interactive_Story_Ratings();
