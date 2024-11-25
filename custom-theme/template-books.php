<?php
/*
Template Name: Books Page
*/
get_header(); ?>

<div class="container">
    <h1>Книги</h1>
    
    <!-- Форма фильтрации -->
    <form id="book-filter-form" method="GET" action="">
        <label for="book-type">Тип книги:</label>
        <select id="book-type" name="book_type">
            <option value="">Все типы</option>
            <option value="story" <?php selected($_GET['book_type'], 'story'); ?>>История</option>
            <option value="novel" <?php selected($_GET['book_type'], 'novel'); ?>>Роман</option>
            <!-- Добавьте другие типы книг по необходимости -->
        </select>
        <button type="submit">Фильтровать</button>
    </form>
    
    <div class="content-section">
        <h2>Лучшие книги</h2>
        <div class="books-grid">
            <?php
            // Получение параметра фильтрации
            $book_type = isset($_GET['book_type']) ? sanitize_text_field($_GET['book_type']) : '';

            // Аргументы для WP_Query
            $args = array(
                'post_type' => 'book',
                'posts_per_page' => 6,
                'orderby' => 'date',
                'order' => 'DESC',
                'meta_query' => array(
                    'relation' => 'AND',
                ),
            );

            // Если выбран тип книги для фильтрации
            if ($book_type) {
                $args['meta_query'][] = array(
                    'key' => 'book_type',
                    'value' => $book_type,
                    'compare' => '=',
                );
            }

            // Выполнение запроса
            $query = new WP_Query($args);

            // Вывод записей
            if ($query->have_posts()) :
                while ($query->have_posts()) : $query->the_post(); ?>
                    <div class="book-item">
                        <h3><?php the_title(); ?></h3>
                        <div class="book-meta">
                            <p><strong>Автор:</strong> <?php echo esc_html(get_post_meta(get_the_ID(), 'book_author', true)); ?></p>
                            <p><strong>Жанр:</strong> <?php echo esc_html(get_post_meta(get_the_ID(), 'book_genre', true)); ?></p>
                            <p><strong>Поджанр:</strong> <?php echo esc_html(get_post_meta(get_the_ID(), 'book_subgenre1', true)); ?></p>
                            <p><strong>Аннотация:</strong> <?php echo esc_html(get_post_meta(get_the_ID(), 'book_annotation', true)); ?></p>
                        </div>
                        <div class="book-thumbnail">
                            <?php if (has_post_thumbnail()) {
                                the_post_thumbnail('medium');
                            } ?>
                        </div>
                        <div class="book-read">
                            <a href="<?php echo esc_url(get_permalink()); ?>" class="btn-secondary">Читать далее</a>
                        </div>
                    </div>
                <?php endwhile;
                wp_reset_postdata();
            else :
                echo '<p>Книги не найдены.</p>';
            endif;
            ?>
        </div>
    </div>
</div>

<?php get_footer(); ?>
