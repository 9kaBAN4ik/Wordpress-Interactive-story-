<?php
class Interactive_Story_Shortcode {
    public static function render($atts) {
        if (!is_user_logged_in()) {
            return '<p>Пожалуйста, <a href="' . wp_login_url(get_permalink()) . '">войдите</a> для доступа к этой истории.</p>';
        }

        $atts = shortcode_atts(array(
            'id' => '',
            'paragraph' => '1',
        ), $atts, 'interactive_story');

        $user_id = get_current_user_id();
        $post_id = intval($atts['id']);
        $paragraph_number = intval($atts['paragraph']);
        
        // Get progress and handle display logic
        global $wpdb;
        $table_name = $wpdb->prefix . 'interactive_story_users';
        $progress = $wpdb->get_var($wpdb->prepare(
            "SELECT progress FROM $table_name WHERE user_id = %d AND story_id = %d",
            $user_id, $post_id
        ));
        
        if ($progress === null) {
            $progress = $paragraph_number;
        }

        $paragraphs = get_post_meta($post_id, '_interactive_story_paragraphs', true);
        $actions = get_post_meta($post_id, '_interactive_story_actions', true);
        $price = get_post_meta($post_id, '_interactive_story_price', true);
        $free_trials = get_post_meta($post_id, '_interactive_story_free_trials', true);

        ob_start();
        echo '<div class="interactive-story">';
        echo '<h1>' . get_the_title($post_id) . '</h1>';
        
        if ($price > 0) {
            echo '<button class="purchase-button">Купить за ' . esc_html($price) . '</button>';
        }
        if ($free_trials > 0) {
            echo '<button class="free-trial-button">Попробовать бесплатно</button>';
        }
        
        if (empty($paragraphs) || !isset($paragraphs[$progress - 1])) {
            return '<p>Сюжет не найден или параграф не существует.</p>';
        }

        echo '<div class="paragraph">';
        echo '<p>' . esc_html($paragraphs[$progress - 1]) . '</p>';
        if (isset($actions[$progress - 1])) {
            echo '<div class="actions">';
            foreach ($actions[$progress - 1] as $action) {
                $next_paragraph = $action['next_paragraph'];
                $label = $action['label'];
                echo '<a href="' . esc_url(add_query_arg(array('story_id' => $post_id, 'paragraph' => $next_paragraph))) . '">' . esc_html($label) . '</a><br/>';
            }
            echo '</div>';
        }
        echo '</div>';
        
        echo '<button id="start-over">Начать заново</button>';
        echo '<button id="report-error">Сообщить об ошибке</button>';
    
        echo '</div>';
        return ob_get_clean();
    }
}
function story_playthrough_shortcode() {
    ob_start();
    ?>
    <div id="story-playthrough" class="story-playthrough-container">
        <h1 id="story-title">Story Title</h1>
        <div id="story-content">
            <!-- Content will be loaded here dynamically -->
        </div>
        <button id="next-paragraph" style="display: none;">Next</button>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('story_playthrough', 'story_playthrough_shortcode');
