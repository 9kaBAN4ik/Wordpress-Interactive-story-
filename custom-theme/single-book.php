<?php
get_header();
?>

<div class="container">
    <?php
    if (have_posts()) :
        while (have_posts()) : the_post(); ?>
            <div class="book-details">
                <h1><?php the_title(); ?></h1>
                <div class="book-thumbnail">
                    <?php if (has_post_thumbnail()) {
                        the_post_thumbnail('large');
                    } ?>
                </div>
                <div class="book-meta">
                    <p><strong>Автор:</strong> <?php echo esc_html(get_post_meta(get_the_ID(), 'book_author', true)); ?></p>
                    <p><strong>Жанр:</strong> <?php echo esc_html(get_post_meta(get_the_ID(), 'book_genre', true)); ?></p>
                    <p><strong>Поджанр:</strong> <?php echo esc_html(get_post_meta(get_the_ID(), 'book_subgenre1', true)); ?></p>
                    <p><strong>Аннотация:</strong> <?php echo esc_html(get_post_meta(get_the_ID(), 'book_annotation', true)); ?></p>
                    <p><strong>Примечания автора:</strong> <?php echo esc_html(get_post_meta(get_the_ID(), 'book_author_notes', true)); ?></p>
                </div>
                <div class="book-content">
                    <?php the_content(); ?>
                </div>
            </div>
        <?php endwhile;
    else :
        echo '<p>Книга не найдена.</p>';
    endif;
    ?>
</div>

<?php
get_footer();
?>
