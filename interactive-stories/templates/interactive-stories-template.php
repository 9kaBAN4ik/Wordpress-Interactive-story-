<?php
/* Template Name: Interactive Story Constructor */
get_header();
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

                // Заполняем переменные данными сюжета из метаполей
                $story_title = $story->post_title;
                $story_paragraphs = get_post_meta($post_id, '_interactive_story_paragraphs', true);
                $story_facts = get_post_meta($post_id, '_interactive_story_fact_groups', true);
                $story_resources = get_post_meta($post_id, '_interactive_story_resource_groups', true);
                $story_formulas = get_post_meta($post_id, '_interactive_story_formulas', true);

                // Проверяем на наличие данных и устанавливаем значения по умолчанию
                $story_paragraphs = is_serialized($story_paragraphs) ? unserialize($story_paragraphs) : [];
                $story_facts = is_serialized($story_facts) ? unserialize($story_facts) : [];
                $story_resources = is_serialized($story_resources) ? unserialize($story_resources) : [];
                $story_formulas = is_serialized($story_formulas) ? unserialize($story_formulas) : [];
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
                    </div>

                    <!-- Секции вкладок -->
                    <div id="paragraphs" class="tab-content active">
                        <button type="button" id="add-paragraph-btn" class="btn btn-primary">Добавить параграф</button>
                        <div id="story-paragraphs" class="story-paragraphs">
                            <!-- Параграфы -->
                            <?php foreach ($story_paragraphs as $index => $paragraph) : ?>
                                <div class="story-paragraph" data-index="<?php echo esc_attr($index); ?>">
                                    <h3>Параграф <?php echo esc_html($index + 1); ?></h3>
                                    <div class="form-group">
                                        <label for="paragraph-title-<?php echo esc_attr($index); ?>">Заголовок параграфа:</label>
                                        <input type="text" id="paragraph-title-<?php echo esc_attr($index); ?>" name="paragraphs[<?php echo esc_attr($index); ?>][title]" class="form-control" value="<?php echo esc_attr($paragraph['title'] ?? ''); ?>" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="paragraph-text-<?php echo esc_attr($index); ?>">Текст параграфа:</label>
                                        <textarea id="paragraph-text-<?php echo esc_attr($index); ?>" name="paragraphs[<?php echo esc_attr($index); ?>][text]" class="form-control" rows="4" required><?php echo esc_textarea($paragraph['text'] ?? ''); ?></textarea>
                                    </div>
                                    <div class="form-group">
                                        <button type="button" class="btn btn-secondary add-action-btn" data-paragraph-index="<?php echo esc_attr($index); ?>">Добавить действие</button>
                                        <div class="actions-container"></div>
                                    </div>
                                    <div class="form-group">
                                        <button type="button" class="btn btn-secondary add-auto-change-btn" data-paragraph-index="<?php echo esc_attr($index); ?>">Добавить автоизменение</button>
                                        <div class="auto-changes-container"></div>
                                    </div>
                                    <button type="button" class="btn btn-danger remove-paragraph-btn">Удалить параграф</button>
                                    <hr>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>

                    <div id="facts" class="tab-content">
    <button type="button" id="add-fact-group-btn" class="btn btn-primary">+ Группа фактов</button>
    <div id="fact-groups-container" class="fact-groups">
        <!-- Группы фактов будут добавляться сюда -->
        <?php foreach ($story_facts as $index => $fact_group) : ?>
            <div class="fact-group" data-index="<?php echo esc_attr($index); ?>">
                <h4>Группа фактов <?php echo esc_html($index + 1); ?></h4>
                <div class="form-group">
                    <label for="fact-group-name-<?php echo esc_attr($index); ?>">Имя группы:</label>
                    <input type="text" id="fact-group-name-<?php echo esc_attr($index); ?>" name="fact-groups[<?php echo esc_attr($index); ?>][name]" class="form-control" value="<?php echo esc_attr($fact_group['name'] ?? ''); ?>" required>
                </div>
                <div class="form-group">
                    <label for="fact-group-visible-<?php echo esc_attr($index); ?>">Отображать игроку:</label>
                    <select id="fact-group-visible-<?php echo esc_attr($index); ?>" name="fact-groups[<?php echo esc_attr($index); ?>][visible]" class="form-control">
                        <option value="yes" <?php selected($fact_group['visible'] ?? 'yes', 'yes'); ?>>Да</option>
                        <option value="no" <?php selected($fact_group['visible'] ?? 'yes', 'no'); ?>>Нет</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="fact-group-limited-<?php echo esc_attr($index); ?>">Лимитированный:</label>
                    <select id="fact-group-limited-<?php echo esc_attr($index); ?>" name="fact-groups[<?php echo esc_attr($index); ?>][limited]" class="form-control fact-group-limited">
                        <option value="no" <?php selected($fact_group['limited'] ?? 'no', 'no'); ?>>Нет</option>
                        <option value="yes" <?php selected($fact_group['limited'] ?? 'no', 'yes'); ?>>Да</option>
                    </select>
                </div>
                <div class="form-group" id="fact-group-limit-container-<?php echo esc_attr($index); ?>" style="<?php echo ($fact_group['limited'] ?? 'no') === 'yes' ? 'display: block;' : 'display: none;'; ?>">
                    <label for="fact-group-limit-<?php echo esc_attr($index); ?>">Количество использований:</label>
                    <input type="number" id="fact-group-limit-<?php echo esc_attr($index); ?>" name="fact-groups[<?php echo esc_attr($index); ?>][limit]" class="form-control" value="<?php echo esc_attr($fact_group['limit'] ?? ''); ?>">
                </div>
                <div class="form-group">
                    <button type="button" class="btn btn-secondary add-fact-to-group-btn" data-fact-group-index="<?php echo esc_attr($index); ?>">Добавить факт</button>
                    <div class="facts-container"></div>
                </div>
                <button type="button" class="btn btn-danger remove-fact-group-btn">Удалить группу фактов</button>
                <hr>
            </div>
        <?php endforeach; ?>
    </div>
</div>



                    <div id="resources" class="tab-content">
                        <button type="button" id="add-resource-group-btn" class="btn btn-primary">+ Группа расходников</button>
                        <div id="resource-groups" class="resource-groups">
                            <!-- Группы расходников -->
                            <?php foreach ($story_resources as $index => $resource_group) : ?>
                                <div class="resource-group" data-index="<?php echo esc_attr($index); ?>">
                                    <h4>Группа расходников <?php echo esc_html($index + 1); ?></h4>
                                    <div class="form-group">
                                        <label for="resource-group-description-<?php echo esc_attr($index); ?>">Описание группы:</label>
                                        <input type="text" id="resource-group-description-<?php echo esc_attr($index); ?>" name="resource-groups[<?php echo esc_attr($index); ?>][description]" class="form-control" value="<?php echo esc_attr($resource_group['description'] ?? ''); ?>" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="resource-group-visible-<?php echo esc_attr($index); ?>">Отображать игроку:</label>
                                        <select id="resource-group-visible-<?php echo esc_attr($index); ?>" name="resource-groups[<?php echo esc_attr($index); ?>][visible]" class="form-control">
                                            <option value="yes" <?php selected($resource_group['visible'] ?? 'yes', 'yes'); ?>>Да</option>
                                            <option value="no" <?php selected($resource_group['visible'] ?? 'yes', 'no'); ?>>Нет</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <button type="button" class="btn btn-secondary add-resource-btn" data-resource-group-index="<?php echo esc_attr($index); ?>">Добавить расходник</button>
                                        <div class="resources-container"></div>
                                    </div>
                                    <button type="button" class="btn btn-danger remove-resource-group-btn">Удалить группу расходников</button>
                                    <hr>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>

                    <div id="formulas" class="tab-content">
                        <button type="button" id="add-formula-btn" class="btn btn-primary">Добавить формулу</button>
                        <div id="formulas-container" class="formulas-container">
                            <!-- Формулы -->
                            <?php foreach ($story_formulas as $index => $formula) : ?>
                                <div class="formula" data-index="<?php echo esc_attr($index); ?>">
                                    <h4>Формула <?php echo esc_html($index + 1); ?></h4>
                                    <div class="form-group">
                                        <label for="formula-name-<?php echo esc_attr($index); ?>">Название формулы:</label>
                                        <input type="text" id="formula-name-<?php echo esc_attr($index); ?>" name="formulas[<?php echo esc_attr($index); ?>][name]" class="form-control" value="<?php echo esc_attr($formula['name'] ?? ''); ?>" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="formula-expression-<?php echo esc_attr($index); ?>">Выражение формулы:</label>
                                        <textarea id="formula-expression-<?php echo esc_attr($index); ?>" name="formulas[<?php echo esc_attr($index); ?>][expression]" class="form-control" rows="4" required><?php echo esc_textarea($formula['expression'] ?? ''); ?></textarea>
                                    </div>
                                    <button type="button" class="btn btn-danger remove-formula-btn">Удалить формулу</button>
                                    <hr>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>

                    <div class="form-group">
                    <button type="button" id="savePlotButton" class="btn btn-success">Сохранить</button>
                    </div>
                </form>

                <!-- Скрипт для передачи данных из PHP в JavaScript -->
                <script type="text/javascript">
                    document.addEventListener('DOMContentLoaded', function () {
                        var storyData = {
                            paragraphs: <?php echo json_encode($story_paragraphs); ?>,
                            facts: <?php echo json_encode($story_facts); ?>,
                            resources: <?php echo json_encode($story_resources); ?>,
                            formulas: <?php echo json_encode($story_formulas); ?>
                        };

                        // Пример использования данных
                        console.log(storyData);

                        // Используйте данные для заполнения форм и создания динамических элементов
                        // Здесь вы можете добавить логику для создания элементов на основе storyData
                    });
                </script>

            </div>

        <?php else : ?>
            <p>Пожалуйста, войдите в систему, чтобы использовать этот конструктор.</p>
        <?php endif; ?>
    </main><!-- #main -->
</div><!-- #primary -->

<script>
document.addEventListener('DOMContentLoaded', function() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeBtn = document.querySelector('.close');

    function openTab(tabName) {
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        document.querySelector(`#${tabName}`).classList.add('active');

        tabLinks.forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`.tab-link[data-tab="${tabName}"]`).classList.add('active');
    }

    tabLinks.forEach(link => link.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        openTab(tabName);
    }));

    helpBtn.addEventListener('click', function() {
        helpModal.style.display = 'block';
    });

    closeBtn.addEventListener('click', function() {
        helpModal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });

    if (tabLinks.length > 0) {
        openTab(tabLinks[0].getAttribute('data-tab'));
    }
});
</script>

<style>
/* Добавьте стили для вкладок и модального окна */
.tabs {
    margin-bottom: 1rem;
}

.tab-link {
    padding: 1rem;
    cursor: pointer;
}

.tab-link.active {
    background-color: #ddd;
}

.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
}

.modal {
    display: none;
    position: fixed;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgb(0,0,0);
    background-color: rgba(0,0,0,0.4);
    padding-top: 60px;
}

.modal-content {
    background-color: #fefefe;
    margin: 5% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
}

.close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
}

.close:hover,
.close:focus {
    color: black;
    text-decoration: none;
    cursor: pointer;
}
</style>

<?php get_footer(); ?>

