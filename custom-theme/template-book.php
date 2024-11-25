<?php
/*
Template Name: Book Template
*/
get_header(); ?>

<div class="container">
    <?php
    // Получение ID текущего поста (книги)
    if (have_posts()) :
        while (have_posts()) : the_post();
            $is_adult = get_post_meta(get_the_ID(), 'book_is_adult', true);
            $current_user = wp_get_current_user();
            $age = get_the_author_meta('age', $current_user->ID);

            // Проверка возраста пользователя
            if ($is_adult === '1' && ($age < 18 || !is_user_logged_in())) {
                echo '<p>Вы должны быть старше 18 лет для просмотра этого контента.</p>';
                get_footer();
                exit;
            }
            ?>
            <h1><?php the_title(); ?></h1>
            <div class="book-meta">
                <p><strong>Автор:</strong> <?php echo esc_html(get_post_meta(get_the_ID(), 'book_author', true)); ?></p>
                <p><strong>Жанр:</strong> <?php echo esc_html(get_post_meta(get_the_ID(), 'book_genre', true)); ?></p>
                <p><strong>Поджанр:</strong> <?php echo esc_html(get_post_meta(get_the_ID(), 'book_subgenre1', true)); ?></p>
                <p><strong>Аннотация:</strong> <?php echo esc_html(get_post_meta(get_the_ID(), 'book_annotation', true)); ?></p>
                <?php if ($is_adult === '1') : ?>
                    <p><strong>18+:</strong> Да</p>
                <?php else : ?>
                    <p><strong>18+:</strong> Нет</p>
                <?php endif; ?>
            </div>
            <div class="book-thumbnail">
                <?php if (has_post_thumbnail()) {
                    the_post_thumbnail('large');
                } ?>
            </div>
            <div class="book-content">
                <?php the_content(); // Отображение содержимого книги ?>
            </div>
            <?php
        endwhile;
    else :
        echo '<p>Книга не найдена.</p>';
    endif;
    ?>
</div>

<?php get_footer(); ?>
