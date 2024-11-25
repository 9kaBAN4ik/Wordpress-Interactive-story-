<?php
class Interactive_Story_Review {
    public static function add_review($post_id, $user_id, $review_text) {
        $review_post = array(
            'post_title' => 'Рецензия на ' . get_the_title($post_id),
            'post_content' => $review_text,
            'post_status' => 'pending',
            'post_author' => $user_id,
            'post_type' => 'review',
            'meta_input' => array(
                'reviewed_story_id' => $post_id
            )
        );
        wp_insert_post($review_post);
    }
}
?>