<?php
/*
Template Name: User Profile Page
*/
function enqueue_profile_page_assets() {
    // Подключаем CSS-стили
    wp_enqueue_style('profile-page-style', get_template_directory_uri() . '/css/profile-page.css');

    // Подключаем jQuery (WordPress включает jQuery по умолчанию)
    wp_enqueue_script('jquery');

    // Подключаем ваш собственный файл JavaScript
    wp_enqueue_script('profile-page-script', get_template_directory_uri() . '/js/profile-page.js', array('jquery'), null, true);

    // Передаем переменные в JavaScript
    wp_localize_script('profile-page-script', 'my_ajax_object', array(
        'ajaxurl' => admin_url('admin-ajax.php'), // URL для AJAX запросов
        'current_user_id' => get_current_user_id(),// ID текущего пользователя
        'unread_notifications_count' => get_unread_notifications_count(get_current_user_id())
    ));
}
add_action('wp_enqueue_scripts', 'enqueue_profile_page_assets');


get_header();
?>

<div class="profile-topbar">
    <div class="logo">
        <a href="<?php echo home_url(); ?>">
            <img src="<?php echo get_template_directory_uri(); ?>/images/logo.png" alt="Логотип">
        </a>
    </div>
    <nav class="top-navigation">
        <ul>
            <li><a href="<?php echo home_url(); ?>">Главная</a></li>
            <li><a href="<?php echo home_url('/about'); ?>">О нас</a></li>
            <li><a href="<?php echo home_url('/contact'); ?>">Контакты</a></li>
        </ul>
    </nav>
    <div class="top-icons">
    <a href="#dialogs" class="icon-dialogs">Диалоги</a>
    <a href="#balance" class="icon-balance">Баланс</a>
    <a href="#comments" class="icon-comments">Комментарии</a>
    <a href="#notifications" class="icon-notifications" id="notifications-tab">
    Уведомления
    <span id="notifications-count" class="notification-count" style="display:none;">0</span>
</a>

    <a href="#friends" class="icon-friends">Друзья</a>
</div>
</div>

<div class="container">
<aside class="profile-sidebar">
    <nav class="profile-navigation">
        <ul>
            <li><a href="#" data-section="contacts">Контакты</a></li>
            <li><a href="#" data-section="blog">Публикации</a></li>
            <li><a href="#" data-section="reviews">Рецензии</a></li>
            <li><a href="#" data-section="purchases">Покупки</a></li>
            <li><a href="#" data-section="account-settings">Учётная запись</a></li>
        </ul>
    </nav>
</aside>
    <div id="modal" class="modal" style="display: none;">
    <div class="modal-content">
        <span class="close-button">&times;</span>
        <div class="modal-section-content"></div>
    </div>
</div>
<!-- Модальное окно -->
<div id="modal" style="display: none;">
    <div class="modal-content">
        <span class="close-button">&times;</span>
        <div class="modal-section-content"></div>
    </div>
</div>

    <div class="profile-content">
        <?php
        // Получаем ID пользователя по имени
        $username = get_query_var('user_profile');
        $user = get_user_by('login', $username);

        if ($user) {
            $profile_user_id = $user->ID;
            $current_user_id = get_current_user_id();
            $is_own_profile = ($current_user_id == $profile_user_id);
            ?>

            <!-- Информация о пользователе -->
            <<div class="profile-header">
            <div class="profile-avatar">
    <?php
    $avatar_url = get_user_meta($profile_user_id, 'profile_avatar', true);
    if ($avatar_url) {
        echo '<img id="profile-avatar-img" src="' . esc_url($avatar_url) . '" alt="Аватарка профиля" style="max-width: 150px; max-height: 150px;">';
    } else {
        echo '<img id="profile-avatar-img" src="' . esc_url(get_avatar_url($profile_user_id)) . '" alt="Аватарка профиля" style="max-width: 150px; max-height: 150px;">'; // Стандартный аватар
    }
    ?>
    <?php if ($current_user_id === $profile_user_id): // Отображаем кнопку обновления только для текущего пользователя ?>
        <div class="avatar-update">
            <input type="file" name="profile_avatar" id="profile-avatar-input" style="display:none;">
            <span class="update-icon" id="update-avatar-icon">🔄</span>
            <button id="confirm-avatar-update" style="display:none;">Подтвердить обновление</button>
        </div>
    <?php endif; ?>
</div>

<form id="upload-avatar-form" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" method="post" enctype="multipart/form-data" style="display:none;">
    <?php wp_nonce_field('upload_avatar', 'avatar_nonce'); ?>
    <input type="hidden" name="action" value="upload_avatar">
    <input type="file" name="profile_avatar_file" id="profile-avatar-file">
    <button type="submit" id="submit-avatar-form">Upload</button>
</form>


<?php
if (isset($_POST['upload_avatar'])) {
    if (!function_exists('wp_handle_upload')) {
        require_once(ABSPATH . 'wp-admin/includes/file.php');
    }

    $uploadedfile = $_FILES['profile_avatar'];
    $upload_overrides = array('test_form' => false);

    $movefile = wp_handle_upload($uploadedfile, $upload_overrides);

    if ($movefile && !isset($movefile['error'])) {
        $avatar_url = $movefile['url'];
        update_user_meta($current_user_id, 'profile_avatar', $avatar_url);
        echo '<p>Аватарка успешно обновлена.</p>';
        echo '<meta http-equiv="refresh" content="0">';
    } else {
        echo '<p>Ошибка загрузки файла: ' . $movefile['error'] . '</p>';
    }
}
?>


                <div class="profile-info">
                    <h2><?php echo get_the_author_meta('display_name', $profile_user_id); ?></h2>
                    <p>Адрес страницы: <a href="<?php echo get_author_posts_url($profile_user_id); ?>"><?php echo get_author_posts_url($profile_user_id); ?></a></p>
                    <p>Дата рождения: <?php echo get_user_meta($profile_user_id, 'birthday', true); ?></p>
                    <p>Пол: <?php echo get_user_meta($profile_user_id, 'gender', true); ?></p>
                    <p>Информация о себе: <?php echo get_user_meta($profile_user_id, 'description', true); ?></p>

                    <?php if (!$is_own_profile) : ?>
    <!-- Кнопка добавления в друзья / отмена запроса -->
    <?php
    $friend_requests = get_user_meta($current_user_id, 'friend_requests', true);
    $friends = get_user_meta($current_user_id, 'friends', true);
    if (!$friend_requests) {
        $friend_requests = [];
    }
    if (!$friends) {
        $friends = [];
    }

    $is_request_sent = in_array($profile_user_id, $friend_requests);
    $is_friend = in_array($profile_user_id, $friends);

    if ($is_friend) :
        echo '<p>Вы уже друзья.</p>';
    elseif ($is_request_sent) :
        echo '<p>Запрос на дружбу отправлен.</p>';
    else :
        ?>
        <form method="post" class="add-friend-form">
            <input type="hidden" name="target_user_id" value="<?php echo $profile_user_id; ?>">
            <input type="submit" name="send_friend_request" value="Добавить в друзья">
        </form>
        <?php
    endif;
    ?>

    <?php
    // Обработка отправки запроса на дружбу
    if (isset($_POST['send_friend_request'])) {
        if (isset($_POST['target_user_id'])) {
            $target_user_id = intval($_POST['target_user_id']); // ID пользователя, которому отправляется запрос

            // Проверка, что пользователь не отправляет запрос самому себе
            if ($current_user_id !== $target_user_id) {
                // Получаем текущие запросы на дружбу для целевого пользователя
                $target_requests = get_user_meta($target_user_id, 'friend_requests', true);
                if (!is_array($target_requests)) {
                    $target_requests = [];
                }

                // Проверяем, отправлен ли запрос уже
                if (!in_array($current_user_id, $target_requests)) {
                    // Добавляем ID отправителя в список запросов для целевого пользователя
                    $target_requests[] = $current_user_id; // Важно, чтобы мы добавляли к метаданным получателя
                    update_user_meta($target_user_id, 'friend_requests', $target_requests);
                    echo "<p>Запрос на дружбу отправлен пользователю {$target_user_id}!</p>";
                } else {
                    echo "<p>Вы уже отправили запрос этому пользователю.</p>";
                }
            } else {
                echo "<p>Вы не можете отправить запрос самому себе.</p>";
            }
        } else {
            echo "<p>Ошибка: не указан целевой пользователь для запроса на дружбу.</p>";
        }
    }
                        ?>
                    <?php endif; ?>
                </div>
            </div>

       
<div id="friends" class="profile-friends section" style="display: none;">
    <h3>Мои друзья</h3>
    <?php
    $current_user_id = get_current_user_id();
    $friends = get_user_meta($current_user_id, 'friends', true);
    if (!is_array($friends)) {
        $friends = [];
    }

    if (!empty($friends)) {
        foreach ($friends as $friend_id) {
            $friend_info = get_userdata($friend_id);
            if ($friend_info) {
                $friend_profile_url = home_url('/user-profile/' . $friend_info->user_nicename);

                $custom_avatar_url = get_user_meta($friend_id, 'profile_avatar', true);
                $friend_avatar = $custom_avatar_url 
                    ? '<img src="' . esc_url($custom_avatar_url) . '" alt="' . esc_attr($friend_info->display_name) . '" width="50" height="50">' 
                    : get_avatar($friend_id, 50);
                ?>
                <div class="friend">
                    <p>
                        <a href="<?php echo esc_url($friend_profile_url); ?>">
                            <?php echo $friend_avatar; ?>
                            <?php echo esc_html($friend_info->display_name); ?>
                        </a>
                        <form method="post" class="remove-friend-form" style="display:inline;">
                            <input type="hidden" name="remove_friend_id" value="<?php echo esc_attr($friend_id); ?>">
                            <input type="submit" name="remove_friend" value="Удалить" onclick="return confirm('Вы уверены, что хотите удалить этого друга?');">
                        </form>
                    </p>
                    
                    <!-- Кнопка для перехода к диалогу с пользователем -->
                    <button class="open-dialog-btn" data-friend-id="<?php echo esc_attr($friend_id); ?>">Написать сообщение</button>
                </div>
                <?php
            }
        }
    } else {
        echo '<p>У вас нет друзей.</p>';
    }

    // Обработка удаления друга
    if (isset($_POST['remove_friend'])) {
        $remove_friend_id = intval($_POST['remove_friend_id']);
        $friends = array_diff($friends, [$remove_friend_id]);
        update_user_meta($current_user_id, 'friends', $friends);
        
        $friend_friends = get_user_meta($remove_friend_id, 'friends', true);
        if (is_array($friend_friends)) {
            $friend_friends = array_diff($friend_friends, [$current_user_id]);
            update_user_meta($remove_friend_id, 'friends', $friend_friends);
        }

        echo '<meta http-equiv="refresh" content="0">';
    }
    ?>
</div>

            <!-- Контакты -->
            <div id="contacts" class="profile-section">
            <h3>Контакты</h3>
            <p>Телефон: <?php echo get_user_meta($profile_user_id, 'phone', true); ?></p>
            <p>Email: <?php echo get_the_author_meta('user_email', $profile_user_id); ?></p>
            <p>Сайт: <a href="<?php echo get_user_meta($profile_user_id, 'website', true); ?>" target="_blank"><?php echo get_user_meta($profile_user_id, 'website', true); ?></a></p>
        </div>

<div id="blog" class="profile-section" style="display: none;">
    <h3>Публикации</h3>
    <?php
    $args = array(
        'author' => $profile_user_id,
        'post_type' => array('book', 'interactive_story'), // Замените на ваши типы записей
        'posts_per_page' => 10,
        'paged' => get_query_var('paged') ? get_query_var('paged') : 1
    );
    $user_works = new WP_Query($args);
    if ($user_works->have_posts()) :
        while ($user_works->have_posts()) : $user_works->the_post();
            $post_type = get_post_type(); // Получаем тип записи
            $edit_url = '';

            // Устанавливаем URL для редактирования в зависимости от типа записи
            if ($post_type == 'interactive_story') {
                $edit_url = 'http://localhost:8080/wordpress/interactive-story-constuctor/?post_id=' . get_the_ID();
            } elseif ($post_type == 'book') {
                $edit_url = 'http://localhost:8080/wordpress/createbook/?post_id=' . get_the_ID();
            }

            echo '<h4><a href="' . get_permalink() . '">' . get_the_title() . '</a></h4>';
            the_excerpt();

            // Добавляем кнопку редактирования
            if ($edit_url) {
                echo '<a href="' . $edit_url . '" class="edit-button" style="display:inline-block; padding:5px 10px; background-color:green; color:white; border-radius:5px; text-decoration:none; margin-top:10px;">Редактировать</a>';
            }
        endwhile;

        echo paginate_links(array(
            'total' => $user_works->max_num_pages
        ));
    else :
        echo '<p>Нет произведений.</p>';
    endif;
    wp_reset_postdata();
    ?>
</div> <!-- Закрывающий тег для блока "Публикации" -->

<!-- Рецензии -->
<div id="reviews" class="profile-section" style="display: none;">
    <h3>Рецензии</h3>
    <?php
    $reviews = get_user_meta($profile_user_id, 'reviews', true);
    if ($reviews) {
        foreach ($reviews as $review) {
            ?>
            <div class="review-item">
                <h4><?php echo $review['title']; ?></h4>
                <p><?php echo $review['content']; ?></p>
            </div>
            <?php
        }
    } else {
        echo '<p>Нет рецензий.</p>';
    }
    ?>
</div>

            <!-- Покупки -->
            <div id="purchases" class="profile-section" style="display: none;">
                <h3>Покупки</h3>
                <?php
                $purchases = get_user_meta($profile_user_id, 'purchases', true);
                if ($purchases) { 
                    foreach ($purchases as $purchase) {
                        ?>
                        <div class="purchase-item">
                            <p>Название: <?php echo $purchase['title']; ?></p>
                            <p>Дата покупки: <?php echo $purchase['date']; ?></p>
                        </div>
                        <?php
                    }
                } else {
                    echo '<p>Нет покупок.</p>';
                }
                ?>
            </div>
            <div id="comments" class="profile-section">
    <h3>Комментарии к сюжетам</h3>

    <?php
    // Получаем комментарии пользователя
    $story_comments = get_user_meta($profile_user_id, 'story_comments', true);

    // Обработка ответа автора на комментарий
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_reply'])) {
        $comment_index = intval($_POST['comment_index']);
        $reply_content = sanitize_text_field($_POST['reply_content']);

        // Добавляем ответ в комментарий
        if (isset($story_comments[$comment_index])) {
            if (!isset($story_comments[$comment_index]['replies'])) {
                $story_comments[$comment_index]['replies'] = [];
            }
            $story_comments[$comment_index]['replies'][] = [
                'reply_content' => $reply_content,
                'reply_author' => $profile_user_id,
                'reply_date' => current_time('mysql')
            ];
            update_user_meta($profile_user_id, 'story_comments', $story_comments);
            echo '<p>Ответ добавлен.</p>';
        }
    }

    // Обновляем массив комментариев после обработки
    $story_comments = get_user_meta($profile_user_id, 'story_comments', true);

    if ($story_comments) {
        $grouped_comments = [];

        // Группируем комментарии по заголовкам
        foreach ($story_comments as $comment) {
            $story_title = esc_html($comment['story_title']);
            if (!isset($grouped_comments[$story_title])) {
                $grouped_comments[$story_title] = [];
            }
            $grouped_comments[$story_title][] = $comment;
        }

        // Вывод заголовков и комментариев
        foreach ($grouped_comments as $story_title => $comments) {
            ?>
            <div class="story-comment">
                <h4 class="story-title" style="cursor: pointer;"><?php echo $story_title; ?></h4>
                <div class="comments-list" style="display: none;">
                    <?php foreach ($comments as $comment_index => $comment) { ?>
                        <div class="comment-item">
                            <p>
                                <strong><?php echo get_userdata($comment['comment_author'])->display_name; ?>:</strong> 
                                <?php echo esc_html($comment['comment_content']); ?>
                            </p>
                            <form method="post" class="reply-form">
                                <textarea name="reply_content" rows="2" placeholder="Ваш ответ"></textarea>
                                <input type="submit" name="submit_reply" value="Ответить">
                                <input type="hidden" name="comment_index" value="<?php echo $comment_index; ?>">
                            </form>
                            <?php
                            // Вывод ответов
                            if (isset($comment['replies'])) {
                                echo '<div class="replies-list">';
                                foreach ($comment['replies'] as $reply) {
                                    ?>
                                    <div class="reply-item">
                                        <p>
                                            <strong><?php echo get_userdata($reply['reply_author'])->display_name; ?>:</strong> 
                                            <?php echo esc_html($reply['reply_content']); ?>
                                        </p>
                                    </div>
                                    <?php
                                }
                                echo '</div>'; // Закрываем блок ответов
                            }
                            ?>
                        </div>
                    <?php } ?>
                </div>
            </div>
            <?php
        }
    } else {
        echo '<p>Нет комментариев к сюжетам.</p>';
    }
    ?>
</div>





<div id="notifications" class="profile-notifications" style="display:none;">
    <h3>Уведомления</h3>

    <?php
    // Получаем ID текущего пользователя
    $current_user_id = get_current_user_id();

    // Проверяем, находится ли пользователь в своем профиле
    if ($profile_user_id === $current_user_id) {
        // Получаем входящие запросы для текущего пользователя (т.е. для профиля)
        $incoming_requests = get_user_meta($current_user_id, 'friend_requests', true);
        if (!is_array($incoming_requests)) {
            $incoming_requests = [];
        }

        // Количество новых запросов
        $new_notifications_count = count($incoming_requests);

        // Получаем уведомления текущего пользователя
        $user_notifications = get_user_meta($current_user_id, 'notifications', true);
        if (!is_array($user_notifications)) {
            $user_notifications = [];
        }

        // Добавление уведомлений о новых комментариях
        // Вы можете обновлять мета-данные с уведомлениями, когда добавляется новый комментарий
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_reply'])) {
            $comment_index = intval($_POST['comment_index']);
            if (isset($story_comments[$comment_index])) {
                $story_title = esc_html($story_comments[$comment_index]['story_title']);
                $notification_content = "Добавлен новый комментарий к сюжету: {$story_title}";

                // Добавляем уведомление о новом комментарии в начало массива
                array_unshift($user_notifications, [
                    'notification_content' => $notification_content,
                    'notification_date' => current_time('mysql')
                ]);

                // Обновляем мета-данные с уведомлениями
                update_user_meta($current_user_id, 'notifications', $user_notifications);
            }
        }

        // Количество новых уведомлений
        $new_notifications_count += count($user_notifications);

        // Если есть новые уведомления, передаем их в JavaScript
        if ($new_notifications_count > 0) {
            echo "<script>var notificationsCount = {$new_notifications_count};</script>";
        }

        // Отображение запросов на дружбу только при наличии активных запросов
        if (!empty($incoming_requests)) {
            ?>
            <div class="friend-requests-section">
                <h4>Запросы на дружбу</h4>
                <?php
                foreach ($incoming_requests as $requester_id) {
                    $requester_info = get_userdata($requester_id);
                    if ($requester_info) {
                        ?>
                        <div class="friend-request">
                            <p><?php echo esc_html($requester_info->display_name); ?> хочет добавить вас в друзья.</p>
                            <form method="post">
                                <?php wp_nonce_field('friend_request_action', 'friend_request_nonce'); ?>
                                <input type="hidden" name="requester_id" value="<?php echo esc_attr($requester_id); ?>">
                                <input type="submit" name="accept_request" value="Принять">
                                <input type="submit" name="reject_request" value="Отклонить">
                            </form>
                        </div>
                        <?php
                    }
                }
                ?>
            </div>
            <?php
        }

        // Вывод уведомлений о новых комментариях
        if (!empty($user_notifications)) {
            echo '<div class="notification-list">';
            foreach ($user_notifications as $notification) {
                ?>
                <div class="notification-item">
                    <p><?php echo esc_html($notification['notification_content']); ?></p>
                    <p><small><?php echo esc_html($notification['notification_date']); ?></small></p>
                </div>
                <?php
            }
            echo '</div>';
        } else {
            echo '<p>Нет новых уведомлений.</p>';
        }

        // Обработка принятия или отклонения запроса на дружбу
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['friend_request_nonce']) && wp_verify_nonce($_POST['friend_request_nonce'], 'friend_request_action')) {
            $requester_id = intval($_POST['requester_id']);

            if (isset($_POST['accept_request'])) {
                // Добавляем пользователя в друзья
                $friends = get_user_meta($current_user_id, 'friends', true);
                if (!is_array($friends)) {
                    $friends = [];
                }
                if (!in_array($requester_id, $friends)) {
                    $friends[] = $requester_id;
                    update_user_meta($current_user_id, 'friends', $friends);

                    // Добавляем текущего пользователя в друзья отправителя запроса
                    $requester_friends = get_user_meta($requester_id, 'friends', true);
                    if (!is_array($requester_friends)) {
                        $requester_friends = [];
                    }
                    if (!in_array($current_user_id, $requester_friends)) {
                        $requester_friends[] = $current_user_id;
                        update_user_meta($requester_id, 'friends', $requester_friends);
                    }

                    // Удаляем запрос из списка входящих
                    $incoming_requests = array_diff($incoming_requests, [$requester_id]);
                    update_user_meta($current_user_id, 'friend_requests', $incoming_requests);
                    echo '<p>Запрос принят.</p>';
                } else {
                    echo '<p>Вы уже в друзьях с этим пользователем.</p>';
                }
            } elseif (isset($_POST['reject_request'])) {
                // Удаляем запрос из списка входящих
                $incoming_requests = array_diff($incoming_requests, [$requester_id]);
                update_user_meta($current_user_id, 'friend_requests', $incoming_requests);
                echo '<p>Запрос отклонен.</p>';
            }
        }
    } else {
        echo '<p>Нет новых уведомлений.</p>';
    }
    ?>
</div>




            <!-- Баланс -->
            <div id="balance" class="profile-balance section" style="display: none;">
                <h3>Баланс</h3>
                <p><?php echo get_user_meta($profile_user_id, 'balance', true); ?> рублей</p>
            </div>
           <!-- Секция диалогов -->
           <div id="dialogs" class="profile-dialogs section" style="display: none;">
    <h3>Диалоги</h3>
    <?php
    // Получаем список всех диалогов текущего пользователя
    $dialogs = get_user_meta($current_user_id, 'dialogs', true);
    if ($dialogs) {
        foreach ($dialogs as $dialog) {
            $dialog_with_id = ($dialog['sender_id'] === $current_user_id) ? $dialog['recipient_id'] : $dialog['sender_id'];
            
            $friend = get_user_by('id', $dialog_with_id);
            if ($friend) {
                $friend_avatar = get_avatar_url($friend->ID);
                $friend_name = $friend->display_name;
            } else {
                $friend_avatar = 'default-avatar-url'; // или другой URL для аватара по умолчанию
                $friend_name = 'Unknown User';
            }
            ?>
            <div class="dialog-item" data-dialog-with="<?php echo esc_attr($dialog_with_id); ?>">
                <div class="dialog-header">
                    <img src="<?php echo esc_url($friend_avatar); ?>" alt="Avatar" class="friend-avatar">
                    <span class="friend-name"><?php echo esc_html($friend_name); ?></span>
                </div>
                <div class="messages-container">
                    <!-- Сообщения будут загружаться здесь -->
                </div>
                <form class="message-form" data-dialog-with="<?php echo esc_attr($dialog_with_id); ?>">
                    <textarea class="message-input" placeholder="Напишите сообщение..."></textarea>
                    <button type="submit" class="send-message-btn">Отправить</button>
                </form>
            </div>
            <?php
        }
    } else {
        echo '<p>Нет диалогов.</p>';
    }
    ?>
</div>

<!-- Модальное окно для диалога (если оно нужно) -->
<div id="modal-dialog-section" style="display: none;">
    <!-- Здесь будет контент для выбранного диалога -->
</div>
        <?php
        } else {
            echo '<p>Пользователь не найден.</p>';
        }
        ?>
   
            <!-- Настройки аккаунта -->
<!-- Настройки аккаунта -->
<?php if ($is_own_profile) : ?>
    <div id="account-settings" class="profile-settings profile-section">
        <h3>Настройки аккаунта</h3>
        <form method="post">
            <label for="email">Email:</label>
            <input type="email" name="email" id="email" value="<?php echo esc_attr(get_the_author_meta('user_email', $profile_user_id)); ?>">

            <label for="password">Новый пароль:</label>
            <input type="password" name="password" id="password">

            <input type="submit" name="save_account_settings" value="Сохранить настройки">
        </form>

        <?php
        // Обработка сохранения настроек
        if (isset($_POST['save_account_settings'])) {
            $new_email = sanitize_email($_POST['email']);
            $new_password = $_POST['password'];

            if (!empty($new_email) && is_email($new_email)) {
                wp_update_user(array(
                    'ID' => $profile_user_id,
                    'user_email' => $new_email
                ));
                echo '<p>Email успешно обновлён.</p>';
            }

            if (!empty($new_password)) {
                wp_update_user(array(
                    'ID' => $profile_user_id,
                    'user_pass' => $new_password
                ));
                echo '<p>Пароль успешно обновлён.</p>';
            }
        }
        ?>
    </div>
<?php endif; ?>
<?php 
// Проверка пользователя
if ($user) { // Предполагая, что $user инициализирован где-то выше
    // Если $user существует, можно выполнять другие действия
} else {
    echo '<p>Пользователь не найден.</p>';
}
?>
 </div>
 </div>
<?php
get_footer();
?>

