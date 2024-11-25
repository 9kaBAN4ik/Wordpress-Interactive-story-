<?php
class Interactive_Story_Facts {
    public static function add_fact($user_id, $story_id, $fact_name) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'interactive_story_facts';
        $wpdb->insert($table_name, array(
            'user_id' => $user_id,
            'story_id' => $story_id,
            'fact_name' => $fact_name,
            'created_at' => current_time('mysql')
        ));
    }

    public static function remove_fact($user_id, $story_id, $fact_name) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'interactive_story_facts';
        $wpdb->delete($table_name, array(
            'user_id' => $user_id,
            'story_id' => $story_id,
            'fact_name' => $fact_name
        ));
    }
}
?>