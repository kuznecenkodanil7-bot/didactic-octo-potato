# Чек-лист загрузки на GitHub

## Что заливать в репозиторий

- [ ] `index.html` — главная страница игры.
- [ ] `src/game.js` — логика 3D-игры, письма, выборы, концовки.
- [ ] `src/styles.css` — интерфейс и экраны писем.
- [ ] `assets/textures/` — текстуры, которые можно заменить.
- [ ] `assets/models/` — подписанные слоты моделей.
- [ ] `docs/ASSET_MANIFEST.md` — описание каждого ассета.
- [ ] `docs/INTERNET_ASSETS_TO_REPLACE.md` — что искать в интернете для замены.
- [ ] `.github/workflows/deploy-pages.yml` — автоматическая публикация на GitHub Pages.
- [ ] `.nojekyll` — чтобы GitHub Pages не ломал пути к папкам.
- [ ] `README.md` — описание проекта.

## Что НЕ обязательно заливать

- [ ] `run_server.bat` — нужен только для локального запуска на Windows.
- [ ] `run_server.sh` — нужен только для локального запуска на Linux/Mac.

## После загрузки

- [ ] Включить GitHub Pages.
- [ ] Выбрать деплой через GitHub Actions.
- [ ] Проверить вкладку `Actions`.
- [ ] Дождаться зелёной галочки.
- [ ] Открыть ссылку вида `https://username.github.io/repository/`.
