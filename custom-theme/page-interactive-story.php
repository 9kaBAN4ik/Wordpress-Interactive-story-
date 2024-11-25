<?php
/* Template Name: Interactive Story Constructor */
get_header();
?>
?>

<div id="primary" class="content-area">
    <main id="main" class="site-main">
        <?php if (is_user_logged_in()) : ?>
            <?php
            // Проверка на наличие post_id в URL
            $post_id = isset($_GET['post_id']) ? intval($_GET['post_id']) : 0;
            $is_edit_mode = ($post_id > 0);

            if ($is_edit_mode) {
                // Получаем данные истории по ID
                $story = get_post($post_id);

                // Проверка на существование сюжета
                if (!$story || $story->post_type != 'interactive_story') {
                    echo '<p>Сюжет не найден.</p>';
                    get_footer();
                    exit;
                }

                // Инициализация переменных
                $story_title = $story->post_title;
                $story_paragraphs = [];
                $story_facts = [];
                $story_resources = [];
                $story_formulas = [];
            } else {
                // Если создается новый сюжет
                $story_title = '';
                $story_paragraphs = [];
                $story_facts = [];
                $story_resources = [];
                $story_formulas = [];
            }
            ?>

            <div id="interactive-story-constructor" class="interactive-story-constructor">
                <h2><?php echo $is_edit_mode ? 'Редактировать интерактивный сюжет' : 'Создать интерактивный сюжет'; ?></h2>
                
                <!-- Кнопка для открытия модального окна с инструкциями -->
                <button id="help-btn" class="btn btn-info">?</button>
                
                <!-- Модальное окно с инструкциями -->
                <div id="help-modal" class="modal">
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <h2>Руководство</h2>
                        <p>Параграфы,для начала работы с ними,необходимо нажать на кнопку "Добавить параграф",далее заполнить все поля</p>
                    <p>Добавить действие - заполняете поля,выбираете доступно ли действие изначально или только при наличии определённого факта/расходника, а так же выбираете к какому параграфу должен переходить игрок после этого действия</p>
                    <p>Добавить автоизменение - выбираете,что вам необходимо,далее в выпадающих списках выбираете по логике,что вам необходимо и заполняете поля,если имеются </p>
                    <p>Добавить Факты/Расходники - необходимо заполнить все поля,которые появляются с нажатием на кнопки</p>
                    <p>Факт - работает по принципу есть или нет</p>
                    <p>Расходник - работает по принципу есть или нет + хватает либо нет</p>
                    <p>Формулы - набор автоизменений</p>
                    </div>
                </div>

                <form id="interactive-story-form" method="post">
                    <!-- Скрытое поле для проверки отправки формы -->
                    <input type="hidden" name="save_story" value="1">
                    
                    <!-- Название сюжета -->
                    <div class="form-group">
                        <label for="story-title">Название сюжета:</label>
                        <input type="text" id="story-title" name="story-title" class="form-control" value="<?php echo esc_attr($story_title); ?>" required>
                    </div>

                    <!-- Вкладки -->
                    <div class="tabs">
                        <button type="button" class="tab-link active" data-tab="paragraphs">Параграфы</button>
                        <button type="button" class="tab-link" data-tab="facts">Факты</button>
                        <button type="button" class="tab-link" data-tab="resources">Расходники</button>
                        <button type="button" class="tab-link" data-tab="formulas">Формулы</button>
                        <button type="button" class="tab-link" data-tab="illustration">Схема</button>
                    </div>

                    <!-- Секции вкладок -->
                    <div id="paragraphs" class="tab-content active">
                    <button type="button" id="add-paragraph-btn" class="btn btn-primary">Добавить параграф</button>
    <div id="story-paragraphs" class="story-paragraphs">
        <!-- Параграфы -->
        <div id="paragraph-list"></div> <!-- Переместите этот контейнер в нужное место на странице -->

    </div>
</div>

<div id="facts" class="tab-content">
    <button type="button" id="add-fact-group-btn" class="btn btn-primary">+ Группа фактов</button>
    <div id="fact-groups-container" class="fact-groups">
    </div>
</div>

                    <div id="resources" class="tab-content">
                        <button type="button" id="add-resource-group-btn" class="btn btn-primary">+ Группа расходников</button>
                        <div id="resource-groups" class="resource-groups">
                        </div>
                    </div>

                    <div id="formulas" class="tab-content">
                        <button type="button" id="add-formula-btn" class="btn btn-primary">Добавить формулу</button>
                        <div id="formulas-container" class="formulas-container">
                        </div>
                    </div>
                    <div id="illustration" class="tab-content">
    <div id="illustration-container">
        <div id="graph-container"></div>
    </div>
</div>
                    <div class="form-group">
                    <button type="button" id="savePlotButton" class="btn btn-success">Сохранить</button>
                    </div>
                </form>

            </div>

        <?php else : ?>
            <p>Пожалуйста, войдите в систему, чтобы использовать этот конструктор.</p>
        <?php endif; ?>
    </main><!-- #main -->
</div><!-- #primary -->
