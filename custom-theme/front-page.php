<?php
/*
Template Name: Front Page
*/
function enqueue_front_page_styles() {
    wp_enqueue_style('front-page-style', get_template_directory_uri() . '/css/front-page.css');
    wp_enqueue_script('front-page-script', get_template_directory_uri() . '/js/front-page.js', array('jquery'), null, true);
    
    wp_localize_script('front-page-script', 'frontPageData', array(
        'isUserLoggedIn' => is_user_logged_in(),
        'loginUrl' => wp_login_url(),
        'registrationUrl' => wp_registration_url(),
    ));
}
add_action('wp_enqueue_scripts', 'enqueue_front_page_styles');

get_header();
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="<?php echo esc_url(get_stylesheet_uri()); ?>">
    <link rel="stylesheet" href="<?php echo esc_url(get_template_directory_uri() . '/css/global.css'); ?>">
    <?php wp_head(); ?>
</head>
<body <?php body_class('front-page'); ?>>
<?php get_header(); ?>

<div class="content-section">
    <h2>Лучшие истории</h2>
    <div class="stories-grid">
        <?php
        $args = array(
            'post_type' => 'interactive_story',
            'posts_per_page' => 6,
            'orderby' => 'date',
            'order' => 'DESC'
        );
        $stories_query = new WP_Query($args);
        
        if ($stories_query->have_posts()) :
            while ($stories_query->have_posts()) : $stories_query->the_post();
                ?>
                <div class="story-item">
                    <h3><?php the_title(); ?></h3>
                    <p><?php the_excerpt(); ?></p>
                    <a href="<?php echo esc_url(home_url('/playthrough?story_id=' . get_the_ID())); ?>" class="btn-secondary">Читать далее</a>
                </div>
                <?php
            endwhile;
            wp_reset_postdata();
        else :
            echo '<p>Интерактивные сюжеты отсутствуют в базе.</p>';
        endif;
        ?>
    </div>
</div>

<div class="content-section">
    <h2>Лучшие книги</h2>
    <div class="stories-grid">
        <?php
        $args = array(
            'post_type' => 'book', // Убедитесь, что это правильный тип записи для книг
            'posts_per_page' => 6,
            'orderby' => 'date',
            'order' => 'DESC'
        );
        $books_query = new WP_Query($args);
        
        if ($books_query->have_posts()) :
            while ($books_query->have_posts()) : $books_query->the_post();
                ?>
                <div class="story-item">
                    <h3><?php the_title(); ?></h3>
                    <p><?php the_excerpt(); ?></p>
                    <a href="<?php the_permalink(); ?>" class="btn-secondary">Читать далее</a>
                </div>
                <?php
            endwhile;
            wp_reset_postdata();
        else :
            echo '<p>Книги отсутствуют в базе.</p>';
        endif;
        ?>
    </div>
</div>

<div id="modal" class="modal">
    <div class="modal-content">
        <span class="close">&times;</span>
        <div id="modal-message"></div>
    </div>
</div>

<footer>
    <p>&copy; <?php echo date('Y'); ?> Мой сайт. Все права защищены.</p>
</footer>

<?php wp_footer(); ?>
</body>
</html>
