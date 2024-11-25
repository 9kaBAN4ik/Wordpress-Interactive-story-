<?php
class Interactive_Story_Resources {
    public static function adjust_resource($user_id, $story_id, $resource_name, $amount) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'interactive_story_resources';
        $current_amount = $wpdb->get_var($wpdb->prepare(
            "SELECT amount FROM $table_name WHERE user_id = %d AND story_id = %d AND resource_name = %s",
            $user_id, $story_id, $resource_name
        ));
        
        if ($current_amount === null) {
            $wpdb->insert($table_name, array(
                'user_id' => $user_id,
                'story_id' => $story_id,
                'resource_name' => $resource_name,
                'amount' => $amount
            ));
        } else {
            $new_amount = $current_amount + $amount;
            $wpdb->update($table_name, array('amount' => $new_amount), array(
                'user_id' => $user_id,
                'story_id' => $story_id,
                'resource_name' => $resource_name
            ));
        }
    }
}
?>