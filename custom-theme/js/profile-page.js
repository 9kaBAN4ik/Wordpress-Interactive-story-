jQuery(document).ready(function($) {
    const ajaxurl = my_ajax_object.ajaxurl;
    const current_user_id = parseInt(my_ajax_object.current_user_id); // Преобразование в число
    const profileAvatarImg = $('#profile-avatar-img');
    const profileAvatarInput = $('#profile-avatar-input');
    const updateAvatarIcon = $('#update-avatar-icon');
    const confirmAvatarUpdateBtn = $('#confirm-avatar-update');
    const avatarUpdateForm = $('#upload-avatar-form');

    console.log("AJAX URL:", ajaxurl);
    console.log("Current User ID:", current_user_id, "Тип:", typeof current_user_id);

    // Функция для отправки запроса на сервер для пометки всех уведомлений как прочитанных
    function markAllNotificationsAsRead(userId) {
        console.log("Отправка запроса на сервер для пометки всех уведомлений как прочитанных, User ID:", userId);
        $.ajax({
            url: ajaxurl,
            method: 'POST',
            data: {
                action: 'mark_notifications_as_read',
                user_id: userId
            },
            success: function(response) {
                if (response.success) {
                    console.log("Все уведомления помечены как прочитанные");
                    // Обновите интерфейс (например, уберите подсветку на вкладке уведомлений)
                    $('#notifications-tab').removeClass('has-new-notifications');
                    $('#notifications-count').hide(); // Скрываем индикатор
                } else {
                    console.error("Ошибка при пометке всех уведомлений");
                }
            },
            error: function(xhr, status, error) {
                console.error("Ошибка AJAX при пометке всех уведомлений:", error);
            }
        });
    }

    // Функция для отправки запроса на сервер для пометки одного уведомления как прочитанного
    function markNotificationAsRead(notificationId, userId) {
        console.log("Отправка запроса для пометки уведомления как прочитанного, Notification ID:", notificationId, "User ID:", userId);
        $.ajax({
            url: ajaxurl,
            method: 'POST',
            data: {
                action: 'mark_notification_as_read',
                notification_id: notificationId,
                user_id: userId
            },
            success: function(response) {
                if (response.success) {
                    console.log("Уведомление помечено как прочитанное");
                    // Обновите интерфейс (например, скрыть уведомление)
                    $(`#notification-${notificationId}`).fadeOut(); // Пример скрытия уведомления
                } else {
                    console.error("Ошибка при пометке уведомления");
                }
            },
            error: function(xhr, status, error) {
                console.error("Ошибка AJAX при пометке уведомления:", error);
            }
        });
    }

    // Функция для отправки запроса на сервер для пометки запроса в друзья как прочитанного
    function markFriendRequestAsRead(requestId, userId) {
        console.log("Отправка запроса для пометки запроса в друзья как прочитанного, Request ID:", requestId, "User ID:", userId);
        $.ajax({
            url: ajaxurl,
            method: 'POST',
            data: {
                action: 'mark_friend_request_as_read',
                request_id: requestId,
                user_id: userId
            },
            success: function(response) {
                if (response.success) {
                    console.log("Запрос в друзья помечен как прочитанный");
                    // Обновите интерфейс (например, скрыть запрос в друзья)
                    $(`#request-${requestId}`).fadeOut(); // Пример скрытия запроса
                } else {
                    console.error("Ошибка при пометке запроса в друзья");
                }
            },
            error: function(xhr, status, error) {
                console.error("Ошибка AJAX при пометке запроса в друзья:", error);
            }
        });
    }

    // Обработчик клика для кнопки "Написать сообщение"
    $(document).on('click', '.open-dialog-btn', function() {
        const friendId = parseInt($(this).data('friend-id')); // Преобразование в число
        console.log("Нажата кнопка 'Написать сообщение' для друга с ID:", friendId, "Тип:", typeof friendId);

        const dialogsSection = $('#dialogs');
        const modalDialogSection = $('#modal-dialog-section');
        if (!dialogsSection.length || !modalDialogSection.length) {
            console.error("Секция 'dialogs' или 'modal-dialog-section' не найдена.");
            return;
        }

        // Закрытие модального окна с друзьями
        $('#modal').hide();

        // Показываем секцию диалогов
        dialogsSection.show();
        modalDialogSection.show();

        let dialogFound = false;

        // Проверяем, есть ли уже диалог с этим другом
        $('.dialog-item').each(function() {
            const dialogWithId = $(this).data('dialog-with');
            console.log("Проверка диалога с ID:", dialogWithId);

            if (dialogWithId === friendId) {
                $(this).show();
                dialogFound = true;

                // Плавно прокручиваем страницу к диалогу
                $('html, body').animate({
                    scrollTop: $(this).offset().top - 100
                }, 500);
            } else {
                $(this).hide();
            }
        });

        // Если диалог не найден, создаем новый через AJAX
        if (!dialogFound) {
            console.warn("Диалог для друга с ID " + friendId + " не найден.");

            if (!friendId || !current_user_id) {
                console.error("Ошибка: отсутствует ID пользователя или друга.");
                return;
            }

            console.log("Отправка запроса для создания диалога:", {
                action: 'create_new_dialog',
                sender_id: current_user_id,
                recipient_id: friendId
            });

            $.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'create_new_dialog',
                    friend_id: friendId,
                    current_user_id: current_user_id,
                },
                success: function(response) {
                    console.log("Ответ от сервера при создании диалога:", response);
                    if (response.success) {
                        const newDialogHtml = `
                            <div class="dialog-item" data-dialog-with="${friendId}">
                                <div class="messages-container"></div>
                                <form class="message-form" data-dialog-with="${friendId}">
                                    <textarea class="message-input" placeholder="Напишите сообщение..."></textarea>
                                    <button type="submit" class="send-message-btn">Отправить</button>
                                </form>
                            </div>
                        `;
                        dialogsSection.append(newDialogHtml);

                        const newDialog = dialogsSection.find('.dialog-item[data-dialog-with="' + friendId + '"]');
                        newDialog.show();

                        $('html, body').animate({
                            scrollTop: newDialog.offset().top - 100
                        }, 500);

                        loadMessages(friendId);
                    } else {
                        console.error("Ошибка при создании диалога:", response.data.message);
                    }
                },
                error: function(xhr, status, error) {
                    console.error("Ошибка AJAX запроса при создании диалога:", error);
                    console.log('Подробности ошибки:', xhr.responseText);
                }
            });
        } else {
            loadMessages(friendId);
        }
    });

    // Функция для загрузки сообщений в диалог
    function loadMessages(friendId) {
        const dialogItem = $('.dialog-item[data-dialog-with="' + friendId + '"]');
        const messagesContainer = dialogItem.find('.messages-container');

        if (messagesContainer.children().length === 0) {
            console.log("Загрузка сообщений для диалога с другом с ID:", friendId);
            $.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'load_messages',
                    sender_id: current_user_id,
                    recipient_id: friendId
                },
                success: function(response) {
                    console.log("Ответ от сервера при загрузке сообщений:", response);
                    if (response.success) {
                        messagesContainer.html(response.data.messages_html);
                        messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
                    } else {
                        console.error("Ошибка при загрузке сообщений:", response.data.message);
                    }
                },
                error: function(xhr, status, error) {
                    console.error("Ошибка AJAX запроса при загрузке сообщений:", error);
                    console.log('Подробности ошибки:', xhr.responseText);
                }
            });
        }
    }

    // Обработчик отправки сообщения
    $(document).on('submit', '.message-form', function(e) {
        e.preventDefault();

        const form = $(this);
        const friendId = form.data('dialog-with');
        const messageInput = form.find('.message-input');
        const message = messageInput.val().trim();

        console.log("Отправка сообщения:", {
            sender_id: current_user_id,
            recipient_id: friendId,
            message: message
        });

        if (message) {
            $.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'send_message',
                    sender_id: current_user_id,
                    recipient_id: friendId,
                    message: message
                },
                success: function(response) {
                    console.log("Ответ от сервера при отправке сообщения:", response);
                    if (response.success) {
                        const newMessageHtml = `
                            <div class="message sent">${message}</div>
                        `;
                        form.before(newMessageHtml);

                        messageInput.val(''); // Очищаем поле ввода

                        $('html, body').animate({
                            scrollTop: form.offset().top + form.height()
                        }, 500);
                    } else {
                        console.error("Ошибка при отправке сообщения:", response.data.message);
                    }
                },
                error: function(xhr, status, error) {
                    console.error("Ошибка AJAX запроса при отправке сообщения:", error);
                    console.log('Подробности ошибки:', xhr.responseText);
                }
            });
        }
    });

    // Скрытие всех секций при загрузке страницы
    $('.profile-section').hide();

    // Обработчик клика для элементов меню профиля
    $('.profile-navigation a').click(function(e) {
        e.preventDefault();
        var targetSection = $(this).data('section');

        $('.profile-section').hide(); // Скрыть все секции
        $('#' + targetSection).show(); // Показать нужную секцию
    });

    // Обработчик клика для иконок верхнего меню
    $('.top-icons a').click(function(e) {
        e.preventDefault();
        var targetSection = $(this).attr('href').substring(1); // Убираем '#' из href

        // Убираем контент из модального окна, чтобы избежать дублирования
        $('.modal-section-content').empty();

        var modalContent = $('#' + targetSection).html(); // Получаем содержимое секции
        $('.modal-section-content').html(modalContent); // Вставляем содержимое в модальное окно
        $('#modal').show(); // Показываем модальное окно
    });

    // Закрытие модального окна
    $('.close-button').click(function() {
        $('#modal').hide();
    });

    // Открытие выбора файла для обновления аватара
    updateAvatarIcon.on('click', function() {
        profileAvatarInput.click();
    });

    // Предварительный просмотр выбранного аватара
    profileAvatarInput.on('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                profileAvatarImg.attr('src', e.target.result);
                confirmAvatarUpdateBtn.show();
                console.log("Предварительный просмотр аватара: ", e.target.result);
            }
            reader.readAsDataURL(file);
        }
    });

    // Обработчик клика для подтверждения обновления аватара
    confirmAvatarUpdateBtn.on('click', function() {
        console.log("Подтверждение обновления аватара...");
        $('#profile-avatar-file').prop('files', profileAvatarInput.prop('files'));
        avatarUpdateForm.submit();
    });

    // Логика для показа и скрытия комментариев по клику на заголовок
    $(document).on('click', '.story-title', function() {
        const commentsList = $(this).next('.comments-list');
        commentsList.toggle(); // Показываем или скрываем комментарии
    });

    // Проверка наличия новых уведомлений
    const notificationsTab = $('#notifications-tab');
    const notificationsCount = $('#notifications-count');

    if (notificationsCount.length && parseInt(notificationsCount.text()) > 0) {
        notificationsTab.addClass('has-new-notifications');
        notificationsCount.show();
    }

    // Обработчик клика для вкладки уведомлений
    notificationsTab.on('click', function() {
        $('#notifications-section').toggle(); // Показать или скрыть секцию уведомлений
        notificationsTab.removeClass('has-new-notifications'); // Убираем подсветку после клика
        notificationsCount.hide(); // Скрываем количество уведомлений

        // Помечаем все уведомления как прочитанные
        markAllNotificationsAsRead(current_user_id);
    });
});
