# Как сделать из проекта ссылку GitHub Pages

Проект уже подготовлен как статическая браузерная 3D-игра. Сборка не нужна: GitHub Pages может отдавать `index.html` напрямую.

## Вариант 1 — через сайт GitHub

1. Создай новый репозиторий на GitHub, например:

   `last-letter-3d-game`

2. Распакуй архив проекта.
3. Загрузи в репозиторий все файлы и папки из проекта:

   - `index.html`
   - `src/`
   - `assets/`
   - `docs/`
   - `.github/`
   - `.nojekyll`
   - `README.md`
   - `package.json`

4. Открой репозиторий → `Settings` → `Pages`.
5. В разделе `Build and deployment` выбери `GitHub Actions`.
6. Перейди во вкладку `Actions` и запусти workflow `Deploy static game to GitHub Pages`, если он не стартовал сам.
7. После успешного деплоя ссылка будет выглядеть примерно так:

   `https://ТВОЙ_НИК.github.io/last-letter-3d-game/`

## Вариант 2 — через Git на компьютере

```bash
git init
git add .
git commit -m "Initial 3D game prototype"
git branch -M main
git remote add origin https://github.com/ТВОЙ_НИК/last-letter-3d-game.git
git push -u origin main
```

Потом включи GitHub Pages через `Settings` → `Pages` → `GitHub Actions`.

## Как заменить текстуры и модели перед публикацией

Все заменяемые ассеты подписаны здесь:

- `docs/ASSET_MANIFEST.md`
- `assets/asset_manifest.csv`
- `assets/asset_manifest.json`
- `docs/INTERNET_ASSETS_TO_REPLACE.md`

Пример:

- хочешь заменить металл почтового ящика — меняешь файл `assets/textures/mailbox_metal.png`;
- хочешь заменить старую кровать — кладёшь модель в `assets/models/bed_old.glb` и дальше подключаешь её в коде;
- хочешь заменить бумагу письма — меняешь `assets/textures/letter_paper.png`.

## Важное ограничение

Сейчас игра использует процедурную 3D-сцену через WebGL без внешних библиотек. OBJ-файлы в `assets/models` лежат как подписанные слоты-заглушки. Они нужны, чтобы было понятно, какие модели заменить в будущей версии на `.glb/.gltf`.

## Проверка перед загрузкой

Перед публикацией локально открой:

```bash
python -m http.server 8000
```

И перейди по адресу:

```text
http://localhost:8000
```

Если игра запускается локально, она должна открыться и на GitHub Pages.
