<?php
/*
Template Name: Register Page
*/

ob_start(); // Начало буферизации вывода

get_header();

// Функция для валидации данных формы регистрации
function validate_registration_form($data) {
    $errors = [];
    
    $username = sanitize_user($data['username']);
    $email = sanitize_email($data['email']);
    $password = $data['password'];
    $confirm_password = $data['confirm_password'];
    $description = sanitize_text_field($data['description']);
    
    if (empty($username) || empty($email) || empty($password)) {
        $errors[] = 'Пожалуйста, заполните все обязательные поля.';
    }
    
    if (!is_email($email)) {
        $errors[] = 'Некорректный email адрес.';
    }
    
    if (email_exists($email)) {
        $errors[] = 'Этот email уже используется.';
    }
    
    if ($password !== $confirm_password) {
        $errors[] = 'Пароли не совпадают.';
    }
    
    if (strlen(str_replace(' ', '', $description)) < 50) {
        $errors[] = 'Описание "О себе" должно содержать не менее 50 символов (пробелы не считаются).';
    }
    
    return $errors;
}

// Переименованная функция для создания пользователя
function custom_create_user($data) {
    $user_id = wp_create_user($data['username'], $data['password'], $data['email']);
    
    if (!is_wp_error($user_id)) {
        update_user_meta($user_id, 'first_name', sanitize_text_field($data['first_name']));
        update_user_meta($user_id, 'last_name', sanitize_text_field($data['last_name']));
        update_user_meta($user_id, 'birthday', sanitize_text_field($data['birthday']));
        update_user_meta($user_id, 'gender', sanitize_text_field($data['gender']));
        update_user_meta($user_id, 'vk', sanitize_text_field($data['vk']));
        update_user_meta($user_id, 'telegram', sanitize_text_field($data['telegram']));
        update_user_meta($user_id, 'website', esc_url($data['website']));
        update_user_meta($user_id, 'description', sanitize_text_field($data['description']));
        wp_update_user(array('ID' => $user_id, 'role' => 'subscriber'));
        
        return $user_id;
    }
    
    return $user_id;
}

// Обработка данных формы регистрации
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['register'])) {
    $errors = validate_registration_form($_POST);
    
    if (empty($errors)) {
        $user_id = custom_create_user($_POST);
        
        if (!is_wp_error($user_id)) {
            // Успешная регистрация
            if (!headers_sent()) {
                wp_redirect(home_url('/welcome'));
                exit;
            } else {
                error_log('Заголовки уже отправлены, не могу выполнить редирект.');
            }
        } else {
            $errors[] = 'Ошибка при создании пользователя: ' . $user_id->get_error_message();
        }
    }
}

// Обработка данных формы входа
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['login'])) {
    $login_errors = [];
    $login = isset($_POST['log']) ? sanitize_text_field($_POST['log']) : '';
    $password = isset($_POST['pwd']) ? $_POST['pwd'] : '';

    if (empty($login) || empty($password)) {
        $login_errors[] = 'Пожалуйста, заполните все обязательные поля.';
    } else {
        $creds = array(
            'user_login'    => $login,
            'user_password' => $password,
            'remember'      => true,
        );
        $user = wp_signon($creds, false);

        if (is_wp_error($user)) {
            $login_errors[] = 'Неверный логин или пароль.';
        } else {
            if (!headers_sent()) {
                wp_redirect(home_url());
                exit;
            } else {
                error_log('Заголовки уже отправлены, не могу выполнить редирект.');
            }
        }
    }
}
?>
   <div class="login-register-container">
    <div class="form-toggle">
        <button id="login-toggle" class="active">Вход</button>
        <button id="register-toggle">Регистрация</button>
    </div>

    <div id="login-form" class="form active">
        <h2>Вход</h2>
        <?php if (!empty($login_errors)) : ?>
            <div class="errors">
                <?php foreach ($login_errors as $error) : ?>
                    <p><?php echo $error; ?></p>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
        <form method="post" action="">
            <div class="input-field">
                <input type="text" name="log" id="log" value="<?php echo isset($_POST['log']) ? esc_attr($_POST['log']) : ''; ?>" required>
                <label for="log">Логин или Email</label>
            </div>
            <div class="input-field">
                <input type="password" name="pwd" id="pwd" required>
                <label for="pwd">Пароль</label>
            </div>
            <div class="forget">
                <label for="remember">
                    <input type="checkbox" id="remember">
                    <p>Запомнить меня</p>
                </label>
                <a href="#">Забыли пароль?</a>
            </div>
            <button type="submit" name="login">Войти</button>
        </form>
    </div>

    <div id="register-form" class="form">
        <h2>Регистрация</h2>
        <?php if (!empty($errors)) : ?>
            <div class="errors">
                <?php foreach ($errors as $error) : ?>
                    <p><?php echo $error; ?></p>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
        <form method="post" action="">
            <div class="input-field">
                <input type="text" name="username" id="username" value="<?php echo isset($_POST['username']) ? esc_attr($_POST['username']) : ''; ?>" required>
                <label for="username">Имя пользователя</label>
            </div>
            <div class="input-field">
                <input type="email" name="email" id="email" value="<?php echo isset($_POST['email']) ? esc_attr($_POST['email']) : ''; ?>" required>
                <label for="email">Email</label>
            </div>
            <div class="input-field">
                <input type="password" name="password" id="password" required>
                <label for="password">Пароль</label>
            </div>
            <div class="input-field">
                <input type="password" name="confirm_password" id="confirm_password" required>
                <label for="confirm_password">Подтвердите пароль</label>
            </div>
            <div class="input-field">
                <input type="text" name="first_name" id="first_name" value="<?php echo isset($_POST['first_name']) ? esc_attr($_POST['first_name']) : ''; ?>">
                <label for="first_name">Имя</label>
            </div>
            <div class="input-field">
                <input type="text" name="last_name" id="last_name" value="<?php echo isset($_POST['last_name']) ? esc_attr($_POST['last_name']) : ''; ?>">
                <label for="last_name">Фамилия</label>
            </div>
            <div class="input-field">
                <input type="date" name="birthday" id="birthday" value="<?php echo isset($_POST['birthday']) ? esc_attr($_POST['birthday']) : ''; ?>">
                <label for="birthday">Дата рождения</label>
            </div>
            <div class="input-field">
                <select name="gender" id="gender">
                    <option value="male" <?php selected('male', isset($_POST['gender']) ? $_POST['gender'] : ''); ?>>Мужской</option>
                    <option value="female" <?php selected('female', isset($_POST['gender']) ? $_POST['gender'] : ''); ?>>Женский</option>
                    <option value="other" <?php selected('other', isset($_POST['gender']) ? $_POST['gender'] : ''); ?>>Другой</option>
                </select>
                <label for="gender">Пол</label>
            </div>
            <div class="input-field">
                <input type="url" name="vk" id="vk" value="<?php echo isset($_POST['vk']) ? esc_attr($_POST['vk']) : ''; ?>">
                <label for="vk">ВКонтакте</label>
            </div>
            <div class="input-field">
                <input type="url" name="telegram" id="telegram" value="<?php echo isset($_POST['telegram']) ? esc_attr($_POST['telegram']) : ''; ?>">
                <label for="telegram">Telegram</label>
            </div>
            <div class="input-field">
                <input type="url" name="website" id="website" value="<?php echo isset($_POST['website']) ? esc_attr($_POST['website']) : ''; ?>">
                <label for="website">Сайт</label>
            </div>
            <div class="input-field">
                <textarea name="description" id="description"><?php echo isset($_POST['description']) ? esc_textarea($_POST['description']) : ''; ?></textarea>
                <label for="description">О себе</label>
            </div>
            <button type="submit" name="register">Зарегистрироваться</button>
        </form>
    </div>
</div>

<?php
get_footer();
ob_end_flush(); // Конец буферизации вывода
?>
