<?php
class Book_Shortcode {
    public static function render($atts) {
        $atts = shortcode_atts(array(
            'id' => null,
        ), $atts);

        if (!$atts['id']) {
            return 'Книга не найдена.';
        }

        $book = get_post($atts['id']);
        if (!$book || $book->post_type !== 'book') {
            return 'Книга не найдена.';
        }

        ob_start();
        ?>
        <div class="book-content">
            <h2><?php echo esc_html($book->post_title); ?></h2>
            <div><?php echo wpautop($book->post_content); ?></div>
        </div>
        <?php
        return ob_get_clean();
    }
}
