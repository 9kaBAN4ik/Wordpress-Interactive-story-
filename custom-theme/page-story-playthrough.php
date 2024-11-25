<?php
/* Template Name: Story Playthrough */
ob_start(); // Начинаем буферизацию вывода
get_header();

$story_id = isset($_GET['story_id']) ? intval($_GET['story_id']) : 0;
$comment_error = '';

if ($story_id) {
    $story = get_post($story_id);
    if ($story && $story->post_type === 'interactive_story') {
        $story_data = array(
            'title' => $story->post_title,
            'content' => $story->post_content,
            'paragraphs' => unserialize(get_post_meta($story_id, '_interactive_story_paragraphs', true)),
            'factGroups' => unserialize(get_post_meta($story_id, '_interactive_story_fact_groups', true)),
            'resourceGroups' => unserialize(get_post_meta($story_id, '_interactive_story_resource_groups', true)),
            'formulas' => unserialize(get_post_meta($story_id, '_interactive_story_formulas', true)),
        );
        $author_id = $story->post_author;
    } else {
        echo '<p>История не найдена.</p>';
        get_footer();
        exit;
    }
} else {
    echo '<p>Некорректный идентификатор истории.</p>';
    get_footer();
    exit;
}
?>

<div id="story-playthrough" class="story-playthrough-container">
    <input type="hidden" id="story-id" value="<?php echo esc_attr($story_id); ?>">
    <h1 id="story-title"><?php echo esc_html($story_data['title']); ?></h1>
    <div class="content-and-sidebar">
        <div id="story-content">
            <?php echo wp_kses_post($story_data['content']); ?>
        </div>
        <div class="sidebar">
            <div class="facts-and-resources">
                <div id="player-facts">
                    <h3>Факты</h3>
                    <ul id="facts-list"></ul>
                </div>
                <div id="resources-display">
                    <h3>Ресурсы</h3>
                    <ul id="resources-list"></ul>
                </div>
            </div>
        </div>
    </div>
    <div id="story-actions" class="actions-container" style="display: none;"></div>
    <button id="next-paragraph" style="display: none;">Next</button>

    <div id="story-comments" class="story-comments-section">
        <h3>Комментарии к сюжету</h3>
        <div id="comment-response"></div> <!-- Элемент для отображения ответов -->

        <!-- Форма добавления комментария -->
        <form class="story-comment-form">
            <input type="hidden" name="story_id" value="<?php echo esc_attr($story_id); ?>">
            <textarea name="story_comment_content" rows="4" placeholder="Ваш комментарий" required></textarea>
            <input type="submit" value="Отправить">
        </form>

        <!-- Вывод существующих комментариев -->
        <?php
        $comments = get_user_meta($author_id, 'story_comments', true);
        if ($comments) {
            foreach ($comments as $comment) {
                if ($comment['story_id'] == $story_id) { ?>
                    <div class="comment-item">
                        <p><strong><?php echo get_userdata($comment['comment_author'])->display_name; ?>:</strong> <?php echo esc_html($comment['comment_content']); ?></p>
                        <small><?php echo date('d.m.Y H:i', strtotime($comment['comment_date'])); ?></small>
                    </div>
                <?php }
            }
        } else {
            echo '<p>Комментариев пока нет.</p>';
        }
        ?>
    </div>
</div>

<?php
get_footer();
ob_end_flush(); // Завершаем буферизацию вывода
?>
