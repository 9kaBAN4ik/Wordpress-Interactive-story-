<?php
class Interactive_Story_Activator {
    public static function activate() {
        global $wpdb;

        $stories_table = $wpdb->prefix . 'interactive_stories';
        $users_table = $wpdb->prefix . 'interactive_story_users';
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS $stories_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            title varchar(255) NOT NULL,
            content text NOT NULL,
            PRIMARY KEY  (id)
        ) $charset_collate;";

        $sql .= "CREATE TABLE IF NOT EXISTS $users_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED NOT NULL,
            story_id mediumint(9) NOT NULL,
            progress int(11) NOT NULL DEFAULT 0,
            free_trials int(11) NOT NULL DEFAULT 0,
            UNIQUE KEY unique_user_story (user_id, story_id),
            PRIMARY KEY  (id)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
}
