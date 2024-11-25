<?php
/*
Template Name: Create Book
*/

get_header();
$current_user = wp_get_current_user();
$current_user_nickname = $current_user->user_nicename;

$form = isset($_GET['form']) ? sanitize_text_field($_GET['form']) : '';
$step = isset($_GET['step']) ? sanitize_text_field($_GET['step']) : '';
$post_id = isset($_GET['post_id']) ? intval($_GET['post_id']) : '';

// Проверка наличия данных
if (empty($current_user_nickname)) {
    $current_user_nickname = 'Неизвестный автор';
}

?>

<div class="wrap">
    <h1><?php echo $post_id ? 'Редактирование книги' : 'Создание книги'; ?></h1>

    <div id="book-creation-form">
        <!-- Шаг 1: Выбор типа книги -->
        <div id="step-1" class="form-step" style="<?php echo $step === '' ? 'display: block;' : 'display: none;'; ?>">
            <h2>Выберите тип книги</h2>
            <form id="select-book-type-form" method="post">
                <input type="hidden" name="action" value="select_book_type">
                
                <label>
                    <input type="radio" name="book_type" value="story" required>
                    Рассказ
                </label>
                <label>
                    <input type="radio" name="book_type" value="novella">
                    Повесть
                </label>
                <label>
                    <input type="radio" name="book_type" value="novel">
                    Роман
                </label>
                <label>
                    <input type="radio" name="book_type" value="short_story_collection">
                    Сборник рассказов
                </label>
                <label>
                    <input type="radio" name="book_type" value="poetry_collection">
                    Сборник поэзии
                </label>

                <button type="button" id="continue-to-step-2">Продолжить</button>
            </form>
        </div>

        <!-- Шаг 2: Заполнение информации о книге -->
        <div id="step-2" class="form-step" style="<?php echo $step === 'create' || $post_id ? 'display: block;' : 'display: none;'; ?>">
            <h2><?php echo $post_id ? 'Редактирование книги' : 'Создание книги'; ?></h2>
            <form id="create-book-form" method="post" enctype="multipart/form-data">
                <input type="hidden" name="action" value="create_book">
                <input type="hidden" id="book-type-input" name="book_type" value="<?php echo esc_attr($form); ?>">
                <input type="hidden" id="book-id" name="book_id" value="<?php echo esc_attr($post_id); ?>">

                <label for="book-title">Название книги:</label>
                <input type="text" id="book-title" name="book-title" required value="<?php echo esc_attr($post_id ? get_post_meta($post_id, '_book_title', true) : ''); ?>">

                <label for="book-author">Автор:</label>
                <input type="text" id="book-author" name="book-author" value="<?php echo esc_attr($current_user_nickname); ?>" readonly>

                <label for="book-description">Описание:</label>
                <textarea id="book-description" name="book-description" rows="5" required><?php echo esc_textarea($post_id ? get_post_meta($post_id, '_book_description', true) : ''); ?></textarea>

                <label for="book-cover">Обложка книги:</label>
                <input type="file" id="book-cover" name="book-cover" accept="image/*">

                <label for="genre">Жанр:</label>
                <select id="genre" name="genre" required>
                    <option value="">Выберите жанр</option>
                    <option value="detective" <?php echo selected($post_id && get_post_meta($post_id, '_book_genre', true) === 'detective', true); ?>>Детектив</option>
                    <option value="fantasy" <?php echo selected($post_id && get_post_meta($post_id, '_book_genre', true) === 'fantasy', true); ?>>Фэнтези</option>
                    <option value="thriller" <?php echo selected($post_id && get_post_meta($post_id, '_book_genre', true) === 'thriller', true); ?>>Триллер</option>
                    <option value="horror" <?php echo selected($post_id && get_post_meta($post_id, '_book_genre', true) === 'horror', true); ?>>Хоррор</option>
                    <option value="science_fiction" <?php echo selected($post_id && get_post_meta($post_id, '_book_genre', true) === 'science_fiction', true); ?>>Научная фантастика</option>
                    <option value="romance" <?php echo selected($post_id && get_post_meta($post_id, '_book_genre', true) === 'romance', true); ?>>Романтика</option>
                    <option value="mystery" <?php echo selected($post_id && get_post_meta($post_id, '_book_genre', true) === 'mystery', true); ?>>Мистика</option>
                </select>

                <label for="subgenre1">Поджанр 1:</label>
                <select id="subgenre1" name="subgenre1"></select>

                <label for="subgenre2">Поджанр 2:</label>
                <select id="subgenre2" name="subgenre2"></select>

                <label for="co-author">Соавтор:</label>
                <input type="text" id="co-author" name="co-author" value="<?php echo esc_attr($post_id ? get_post_meta($post_id, '_book_coauthor', true) : ''); ?>">

                <label for="annotation">Аннотация:</label>
                <textarea id="annotation" name="annotation" rows="5"><?php echo esc_textarea($post_id ? get_post_meta($post_id, '_book_annotation', true) : ''); ?></textarea>

                <label for="author-note">Примечания автора:</label>
                <textarea id="author-note" name="author-note" rows="5"><?php echo esc_textarea($post_id ? get_post_meta($post_id, '_book_author_note', true) : ''); ?></textarea>

                <label for="tags">Тэги:</label>
                <input type="text" id="tags" name="tags" value="<?php echo esc_attr($post_id ? get_post_meta($post_id, '_book_tags', true) : ''); ?>" placeholder="Введите тэги (через запятую)">

                <div>
                    <label><input type="checkbox" name="adult_content" <?php echo checked($post_id && get_post_meta($post_id, '_book_adult_content', true), true); ?>> Для взрослых (18+)</label>
                </div>

                <div>
                    <label><input type="checkbox" name="show_paragraphs" <?php echo checked($post_id && get_post_meta($post_id, '_book_show_paragraphs', true), true); ?>> Отображать все абзацы с Красной строки</label>
                </div>

                <label for="visibility">Кто может видеть произведение:</label>
                <select id="visibility" name="visibility">
                    <option value="all" <?php echo selected($post_id && get_post_meta($post_id, '_book_visibility', true) === 'all', true); ?>>Все</option>
                    <option value="friends" <?php echo selected($post_id && get_post_meta($post_id, '_book_visibility', true) === 'friends', true); ?>>Только друзья</option>
                </select>

                <label for="download_permission">Кто может скачивать моё произведение:</label>
                <select id="download_permission" name="download_permission">
                    <option value="all" <?php echo selected($post_id && get_post_meta($post_id, '_book_download_permission', true) === 'all', true); ?>>Все</option>
                    <option value="friends" <?php echo selected($post_id && get_post_meta($post_id, '_book_download_permission', true) === 'friends', true); ?>>Только друзья</option>
                    <option value="none" <?php echo selected($post_id && get_post_meta($post_id, '_book_download_permission', true) === 'none', true); ?>>Никто</option>
                </select>

                <label for="comment_permission">Кто может комментировать произведение:</label>
                <select id="comment_permission" name="comment_permission">
                    <option value="all" <?php echo selected($post_id && get_post_meta($post_id, '_book_comment_permission', true) === 'all', true); ?>>Все</option>
                    <option value="friends" <?php echo selected($post_id && get_post_meta($post_id, '_book_comment_permission', true) === 'friends', true); ?>>Только друзья</option>
                    <option value="none" <?php echo selected($post_id && get_post_meta($post_id, '_book_comment_permission', true) === 'none', true); ?>>Никто</option>
                </select>

                <button type="button" id="continue-to-step-3">Продолжить</button>
            </form>
        </div>

        <!-- Шаг 3: Добавление абзацев -->
<div id="step-3" class="form-step" style="<?php echo $step === 'add_paragraphs' ? 'display: block;' : 'display: none;'; ?>">
    <h2>Добавление абзацев</h2>
    <form id="add-paragraphs-form" method="post">
        <input type="hidden" name="action" value="add_paragraphs">
        <input type="hidden" id="book-id" name="book_id" value="<?php echo esc_attr($post_id); ?>">

        <!-- Навигация по абзацам -->
        <div id="paragraph-navigation">
            <!-- Кнопки для выбора абзацев будут добавляться динамически -->
        </div>

        <!-- Список абзацев -->
        <div id="paragraphs-container">
            <!-- Абзацы добавляются сюда динамически -->
        </div>

        <!-- Кнопка добавления абзаца -->
        <button type="button" id="add-paragraph-button">Добавить абзац</button>
        <button type="submit" id="save-book">Сохранить книгу</button>
    </form>
</div>

    </div>
</div>

<?php
get_footer();
?>
