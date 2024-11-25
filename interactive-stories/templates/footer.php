<!-- footer.php -->
<footer>
    <div class="footer-content">
        <div class="footer-left">
            <p>&copy; <?php echo date('Y'); ?> Ваш Сайт. Все права защищены.</p>
        </div>
        <div class="footer-right">
            <ul>
                <li><a href="<?php echo esc_url(home_url('/privacy-policy')); ?>">Политика конфиденциальности</a></li>
                <li><a href="<?php echo esc_url(home_url('/terms-of-service')); ?>">Условия использования</a></li>
                <!-- Добавьте здесь другие ссылки, если необходимо -->
            </ul>
        </div>
    </div>
</footer>

<?php wp_footer(); ?>

</body>
</html>
