<?php
/*
Plugin Name: Interactive Stories
Description: Плагин для создания интерактивных сюжетов.
Version: 1.0
Author: 9kaBANIT
*/

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
require_once plugin_dir_path(__FILE__) . 'includes/class-book-menu.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-book-post-type.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-book-shortcode.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-interactive-story-activator.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-interactive-story-post-type.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-interactive-story-shortcode.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-interactive-story-menu.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-interactive-story-ratings.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-interactive-story-review.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-interactive-story-payments.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-interactive-story-facts.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-interactive-story-resources.php';

register_activation_hook(__FILE__, array('Interactive_Story_Activator', 'activate'));
add_action('init', array('Interactive_Story_Post_Type', 'register'));
add_shortcode('interactive_story', array('Interactive_Story_Shortcode', 'render'));
add_action('admin_menu', array('Interactive_Story_Menu', 'add_menu'));
add_action('wp_ajax_handle_interactive_story', 'handle_interactive_story_ajax');
add_action('wp_ajax_nopriv_handle_interactive_story', 'handle_interactive_story_ajax');

function interactive_story_admin_assets($hook) {
    if ($hook != 'post.php' && $hook != 'post-new.php') {
        return;
    }
    wp_enqueue_script('interactive-story-admin', plugin_dir_url(__FILE__) . 'assets/admin.js', array('jquery'), null, true);
    wp_enqueue_style('interactive-story-admin-style', plugin_dir_url(__FILE__) . 'assets/style.css');
    wp_enqueue_script('interactive-story-frontend', plugin_dir_url(__FILE__) . 'assets/interactive-story.js', array('jquery'), null, true);
    wp_localize_script('interactive-story-frontend', 'wp_vars', array(
        'ajax_url' => admin_url('admin-ajax.php')
    ));
}
add_action('admin_enqueue_scripts', 'interactive_story_admin_assets');
add_action('wp_enqueue_scripts', 'interactive_story_admin_assets');
