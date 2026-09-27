# «Карабас-Барабас» — сайт театрального ресторана

Многостраничный сайт премиального театрального ресторана: главная, меню с карточками блюд и банкеты с калькулятором сметы. Чистые HTML/CSS/JS без сборщика: папку можно выложить на любой статический хостинг как есть или открыть `index.html` двойным кликом.

| Страница | Что внутри |
|---|---|
| `index.html` | Hero со сценой, легенда дома и карусель интерьеров, «Кухня / Бар / Лояльность» (4 уровня масок), команда, контакты, билет-пригласительный |
| `menu.html` | Табы «Всё меню» и 5 категорий (29 позиций), модалка блюда с фото, ценой, описанием, таблицей БЖУК и весом |
| `banquets.html` | Три зала, три готовых сета, калькулятор с липкой сметой, заявка на мероприятие |
| Все страницы | Липкий хедер, бургер-меню, модалка бронирования стола, футер |

## Структура проекта

```
.
├── index.html            главная
├── menu.html             меню
├── banquets.html         банкеты
├── css/
│   └── style.css         вся дизайн-система и стили (токены — в :root)
├── js/
│   ├── main.js           общая логика: хедер, бургер, модалки, валидация,
│   │                     toast, карусель, reveal-анимации, бронирование стола
│   ├── menu-data.js      ДАННЫЕ меню: категории и блюда
│   ├── menu.js           рендер табов, карточек и модалки блюда
│   ├── banquet-data.js   ДАННЫЕ банкетов: залы, сеты, позиции калькулятора
│   └── banquets.js       рендер, расчёт сметы, заявка
└── assets/
    ├── favicon.svg
    └── img/              фото (WebP), разложены по разделам:
        ├── hero-stage.webp, menu-hero.webp, banquets-hero.webp
        ├── interior/     карусель интерьеров на главной
        ├── cards/        карточки «Кухня / Бар / Лояльность»
        ├── team/         команда
        ├── halls/        залы
        ├── sets/         банкетные сеты
        └── menu/         блюда (имя файла = id блюда)
```

Данные отделены от логики: чтобы поменять цену, описание или добавить блюдо, достаточно править `js/menu-data.js` или `js/banquet-data.js`, а файлы рендера трогать не нужно.

## Как редактировать контент

**Блюдо в меню.** Добавьте объект в массив `items` в `js/menu-data.js`:

```js
{
  id: "new-dish",                 // латиница, уникальный
  category: "main",               // breakfast | main | desserts | bar | signature
  name: "Название «Роль»",
  price: 1990,                    // число в рублях — формат «1 990 ₽» сайт сделает сам
  weight: "300 г",                // для напитков «150 мл» — подпись сменится на «Объём»
  excerpt: "Коротко для карточки",
  desc: "2–3 предложения для модального окна.",
  kbzhu: { б: 20, ж: 15, у: 30, ккал: 350 },
  image: "assets/img/menu/new-dish.webp",
  badge: "Новинка"                // необязательно
}
```

Счётчики на табах и сетка обновятся автоматически. Новую категорию добавляют в `categories`.

**Сеты, залы и калькулятор** описаны в `js/banquet-data.js`: `pricePerGuest` — цена сета за гостя, `minGuests` — минимум гостей, `capacity` — вместимость зала. Вместимость используется в валидации заявки.

**Контакты и шапка.** Хедер, футер и модалка бронирования повторяются во всех трёх HTML-файлах. Меняйте одинаково в каждом (поиск по файлам: `000-12-34`, `Большая Дмитровка`, `hello@`).

## Как заменить фото на реальные

Сейчас на сайте стоковые фото с Unsplash, они отобраны вручную под каждое блюдо и хранятся локально, без внешних ссылок. Лицензия Unsplash разрешает коммерческое использование, но **портреты команды — это стоковые модели, а не сотрудники: перед запуском их нужно заменить** на реальные фото.

1. Подготовьте фото в пропорциях из таблицы и сохраните в WebP или JPG (качество 70–80):

   | Где | Пропорции | Рекомендуемый размер |
   |---|---|---|
   | Hero главной | любые горизонтальные | 2200 px по ширине |
   | Hero меню и банкетов | ~2:1 | 2000 × 1000 |
   | Интерьеры (карусель) | 4:5 | 900 × 1125 |
   | Карточки «Кухня/Бар/Лояльность», сеты | 16:10 | 1000 × 625 |
   | Залы | 4:3 | 1000 × 750 |
   | Команда | 3:4 | 600 × 800 |
   | Блюда | 1:1 | 1000 × 1000 |

2. Самый простой путь — положить новый файл **с тем же именем** поверх старого (например, `assets/img/menu/ribeye.webp`). Тогда код не трогаете вообще.
3. Если имя или формат другие — поменяйте путь: для блюд в поле `image` в `js/menu-data.js`, для залов и сетов — в `js/banquet-data.js`, для остального — в атрибуте `src` в HTML.
4. Картинки кадрируются через `object-fit: cover`, поэтому небольшое отклонение от пропорций не страшно.

**Защита от битых картинок.** Под каждым фото лежит стилизованная панель: тёмный градиент, тонкая сетка и золотая маска. Если файл не найдётся (опечатка в пути), гость увидит эту панель, а не иконку битого изображения.

## Деплой

Сборка не нужна: публикуется содержимое корня как есть.

### GitHub Pages

1. Создайте репозиторий на GitHub и загрузите файлы в корень:
   ```bash
   git init
   git add .
   git commit -m "Karabas-Barabas site"
   git branch -M main
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```
2. В репозитории откройте **Settings → Pages**.
3. В блоке **Build and deployment** выберите **Source: Deploy from a branch**, ветку `main`, папку `/ (root)`, нажмите **Save**.
4. Через 1–2 минуты сайт будет доступен по адресу `https://<user>.github.io/<repo>/`. Все пути в проекте относительные, поэтому сайт работает и в подпапке репозитория.

### Vercel

**Через интерфейс:**
1. Зайдите на [vercel.com](https://vercel.com) → **Add New… → Project** → импортируйте репозиторий с GitHub.
2. **Framework Preset: Other**. Build Command и Output Directory оставьте пустыми.
3. Нажмите **Deploy**. Сайт появится на `https://<project>.vercel.app`.

**Через CLI (без GitHub):**
```bash
npm i -g vercel
cd путь/к/проекту
vercel          # предпросмотр
vercel --prod   # продакшен
```

### После деплоя

- Подключите свой домен (GitHub: Settings → Pages → Custom domain; Vercel: Project → Settings → Domains).
- Для красивых превью в мессенджерах добавьте в `<head>` абсолютную ссылку на обложку: `<meta property="og:image" content="https://ваш-домен/assets/img/hero-stage.webp">`.

## Что заменить перед запуском

- [ ] Телефон `+7 (495) 000-12-34`, почту `hello@karabas-theatre.ru`, адрес и часы работы — это демо-данные
- [ ] Ссылки соцсетей в футере сейчас ведут на главные страницы Telegram, VK и WhatsApp
- [ ] Фото команды (стоковые модели) и, по желанию, остальные фото
- [ ] Формы работают только на фронтенде: заявка валидируется и показывает экран «Спасибо», но никуда не отправляется. Точка подключения к бэкенду — колбэк `onSubmit` в `js/main.js` (бронирование) и `js/banquets.js` (банкет)
- [ ] Кнопки «Скачать PDF» показывают уведомление. Когда появится файл, замените кнопку на ссылку `<a href="menu.pdf" download>`

## Дизайн-система

- **Цвета** — CSS-переменные в `:root` (`css/style.css`): фон `--bg #2D2A26` и его вариации, текст `--white` / `--sand` / `--sand-dim`, золотой градиент `#F3D89A → #C9A24B → #8A6A2F`.
- **Шрифты** — Google Fonts с `preconnect`: Cormorant Garamond (H1, цены, акценты) и Inter (всё остальное). Для Cormorant включены обычные (lining) цифры, чтобы «1 100 ₽» не читалось как «I IOO».
- **Анимации** — единые параметры: кривая `cubic-bezier(0.16, 1, 0.3, 1)`, появление при скролле 0.85 с (opacity + translateY 36px) со стаггером `--i × 0.09 с`, кнопки 0.25 с (сдвиг градиента, подъём на 2px, тень), модалки 0.55 с (scale 0.92→1 + translateY 24px→0). Нигде нет `transition: all`. При системной настройке «уменьшить движение» анимации отключаются.
- **Брейкпоинты** — 1180 (уплотнение хедера), 980 (планшет: бургер, сетки в 2 колонки), 720 (мобильный: 1 колонка), 480/380 (мелкие правки).

## Логика сметы банкета

```
итог = (цена_сета × гостей, если сет выбран) + Σ (цена позиции × количество)
```

Позиции калькулятора **прибавляются** к сету, а не заменяют его. Итог пересчитывается мгновенно при выборе или снятии сета, при нажатии +/− и при изменении числа гостей: в поле формы или степпером в смете (оба синхронизированы). На мобильном внизу экрана появляется панель с текущей суммой. Валидация заявки учитывает вместимость выбранного зала и минимум гостей для сета.

## Проверка перед сдачей

Сайт проверен в Chromium (Playwright) на локальном сервере, автотест из 88 проверок пройден полностью:

- все 3 страницы открываются без ошибок в консоли и без неудачных сетевых запросов;
- ни одной битой картинки и ни одной SVG-иконки без символа в спрайте;
- каждый таб меню показывает ровно свои позиции; клик по последней карточке категории открывает модалку с данными именно этого блюда (название, цена, БЖУК, вес, фото); закрытие по Escape и по клику вне окна;
- калькулятор: «+» у рибая даёт ровно +4 900 ₽, сет «Премьера» прибавляет 6 500 × гостей к уже выбранным позициям, смена гостей в форме и в смете пересчитывает итог, бюджет в форме и мобильная панель совпадают с итогом;
- обе формы: пустая форма подсвечивает поля (`.field.is-invalid`) с текстом ошибки, короткий телефон, неверный email и превышение вместимости зала ловятся; при валидных данных **становится видимым** элемент `.form-success` с именем гостя;
- на 390 px нет горизонтального скролла на всех страницах, бургер открывается и закрывается (кнопкой и Escape); на 768, 990 и 1024 px хедер и страницы не переполняются;
- сайт работает и при открытии файлов напрямую с диска (`file://`).

## Авторы фотографий

Фото — [Unsplash](https://unsplash.com) (Unsplash License: бесплатно, в том числе для коммерческого использования, атрибуция не обязательна, но приятна).

<details>
<summary>Список фото и авторов (52)</summary>

| Файл | Автор | Оригинал |
|---|---|---|
| `assets/img/banquets-hero.webp` | [Jose Marroquin](https://unsplash.com/@josemarroquin) | [Unsplash](https://unsplash.com/photos/elegant-table-setting-with-candles-and-teacups-o9qZRZbdHow) |
| `assets/img/cards/bar.webp` | [Shawn DENG](https://unsplash.com/@dzshawn) | [Unsplash](https://unsplash.com/photos/a-dimly-lit-bar-with-stools-and-bottles-on-the-shelves-nsgzQHsxbXE) |
| `assets/img/cards/kitchen.webp` | [jirayu koontholjinda](https://unsplash.com/@armkntjnd) | [Unsplash](https://unsplash.com/photos/person-holding-stainless-steel-fork-and-knife-slicing-meat-on-black-ceramic-plate-gfraywnI42s) |
| `assets/img/cards/loyalty.webp` | [Fer Troulik](https://unsplash.com/@fertroulik) | [Unsplash](https://unsplash.com/photos/a-decorative-venetian-mask-with-a-jesters-hat-2947jb7vICU) |
| `assets/img/halls/main.webp` | [Filip Rankovic Grobgaard](https://unsplash.com/@filipgrobgaard) | [Unsplash](https://unsplash.com/photos/elegant-event-space-set-with-round-tables-for-dining-EJQnHC6GEe8) |
| `assets/img/halls/veranda.webp` | [Santiago Munoz](https://unsplash.com/@santiagomunz) | [Unsplash](https://unsplash.com/photos/a-dimly-lit-restaurant-with-tables-and-chairs-FGECxLbjpKg) |
| `assets/img/halls/vip.webp` | [Carson Masterson](https://unsplash.com/@carsonmasterson) | [Unsplash](https://unsplash.com/photos/brown-wooden-dining-table-yuxr5ohFB-g) |
| `assets/img/hero-stage.webp` | [nooooodles 1337](https://unsplash.com/@nooooodles) | [Unsplash](https://unsplash.com/photos/red-curtain-stage-m3th3rIQ9-w) |
| `assets/img/interior/candle-table.webp` | [Katie Puzatova](https://unsplash.com/@puzatova) | [Unsplash](https://unsplash.com/photos/a-beautifully-set-table-with-candles-and-flowers-G4tIbJ7wi0Q) |
| `assets/img/interior/chandelier.webp` | [Doon _MUC](https://unsplash.com/@doon_muc) | [Unsplash](https://unsplash.com/photos/elegant-chandelier-lights-a-luxurious-interior-with-floral-centerpiece--ubCiSPFlYM) |
| `assets/img/interior/evening-hall.webp` | [takahiro taguchi](https://unsplash.com/@tak_tag) | [Unsplash](https://unsplash.com/photos/lighted-lamps-in-room-8l_RuuZrOyY) |
| `assets/img/interior/grand-hall.webp` | [Dmitry Spravko](https://unsplash.com/@kaprion) | [Unsplash](https://unsplash.com/photos/a-restaurant-with-a-bunch-of-lights-hanging-from-the-ceiling-wrW1mQTja7w) |
| `assets/img/interior/loge.webp` | [Mari Neroli](https://unsplash.com/@fsmari) | [Unsplash](https://unsplash.com/photos/a-single-red-rose-on-a-table-xk4QS64-2TE) |
| `assets/img/interior/velvet-booths.webp` | [Carson Masterson](https://unsplash.com/@carsonmasterson) | [Unsplash](https://unsplash.com/photos/brown-wooden-dining-table-yuxr5ohFB-g) |
| `assets/img/menu-hero.webp` | [Mike Marrah](https://unsplash.com/@mikemarrah) | [Unsplash](https://unsplash.com/photos/clear-wine-glass-on-brown-wooden-table-1kCJYMKROiU) |
| `assets/img/menu/apple-tart.webp` | [Mila](https://unsplash.com/@imoflow_me) | [Unsplash](https://unsplash.com/photos/slice-of-apple-pie-with-fresh-apples-and-lavender-uYUooqpjsHI) |
| `assets/img/menu/avocado-toast.webp` | [Andrew Spencer](https://unsplash.com/@iam_aspencer) | [Unsplash](https://unsplash.com/photos/a-white-plate-topped-with-a-piece-of-toast-covered-in-avocado-P7oGUDHswIA) |
| `assets/img/menu/benedict.webp` | [Caramel](https://unsplash.com/@caramel_works) | [Unsplash](https://unsplash.com/photos/a-plate-of-food-on-a-wooden-table-dhpiee8rkTo) |
| `assets/img/menu/benefit-champagne.webp` | [Becky Fantham](https://unsplash.com/@hungrybecky) | [Unsplash](https://unsplash.com/photos/black-and-gray-bottle-SnSvmvUpQpU) |
| `assets/img/menu/borsch.webp` | [Catherine](https://unsplash.com/@icath) | [Unsplash](https://unsplash.com/photos/hearty-red-borscht-with-dill-bread-and-bacon-KngOB2xDEQQ) |
| `assets/img/menu/bourguignon.webp` | [nilufar nattaq](https://unsplash.com/@nillufar) | [Unsplash](https://unsplash.com/photos/a-bowl-of-stew-with-potatoes-carrots-and-meat-WgrOML7JhSU) |
| `assets/img/menu/creme-brulee.webp` | [Gianluca Gerardi](https://unsplash.com/@foodography) | [Unsplash](https://unsplash.com/photos/soup-bowl-TPCxbFFLlzw) |
| `assets/img/menu/duck.webp` | [Sebastian Coman Photography](https://unsplash.com/@sebastiancoman) | [Unsplash](https://unsplash.com/photos/cooked-meat-on-white-ceramic-plate-kFJ8tL53qcg) |
| `assets/img/menu/fondant.webp` | [Jordane Mathieu](https://unsplash.com/@mat_graphik) | [Unsplash](https://unsplash.com/photos/bundt-chocolate-cake-W1TOhhlbQpw) |
| `assets/img/menu/frittata.webp` | [Natalia Y.](https://unsplash.com/@foxfox) | [Unsplash](https://unsplash.com/photos/pizza-on-black-round-plate-cHgnxl9Gl5c) |
| `assets/img/menu/golden-key.webp` | [Dexter Fernandes](https://unsplash.com/@bleachedhuman) | [Unsplash](https://unsplash.com/photos/a-close-up-of-a-drink-on-a-table-zVZIsn0dQy8) |
| `assets/img/menu/granola.webp` | [Dessy Dimcheva](https://unsplash.com/@dessy_dmch) | [Unsplash](https://unsplash.com/photos/blue-ceramic-bowl-with-black-berries-VYjCc6hKkVo) |
| `assets/img/menu/karabas-beard.webp` | [Pinaak Kumar](https://unsplash.com/@pinaakkr) | [Unsplash](https://unsplash.com/photos/a-glass-filled-with-liquid-sitting-on-top-of-a-table-lVMkSj9oxkU) |
| `assets/img/menu/lamb.webp` | [Bao Menglong](https://unsplash.com/@__menglong) | [Unsplash](https://unsplash.com/photos/cooked-food-on-blue-and-white-floral-ceramic-plate-UQivC0NCVLw) |
| `assets/img/menu/malvina.webp` | [Timur Romanov](https://unsplash.com/@timromanov) | [Unsplash](https://unsplash.com/photos/blue-drink-in-wine-glass-on-corner-of-wooden-table-2DV8y3LU7Ac) |
| `assets/img/menu/millefeuille.webp` | [RJ Trazona](https://unsplash.com/@muzkafilms) | [Unsplash](https://unsplash.com/photos/a-white-plate-topped-with-a-piece-of-cake-7ATqt8Z-02Q) |
| `assets/img/menu/octopus.webp` | [Igor Rand](https://unsplash.com/@igorrand) | [Unsplash](https://unsplash.com/photos/a-black-plate-topped-with-an-octopus-and-other-food-items-Sw83v7HA1-U) |
| `assets/img/menu/pancakes.webp` | [Skyler Ewing](https://unsplash.com/@skylerewing) | [Unsplash](https://unsplash.com/photos/a-stack-of-pancakes-with-berries-on-top-x4lZtZxX9LY) |
| `assets/img/menu/pavlova.webp` | [Melody Zimmerman](https://unsplash.com/@prairiepilgrim) | [Unsplash](https://unsplash.com/photos/a-plate-of-food-with-fruit-on-top-of-it-oH4dgThgJqE) |
| `assets/img/menu/pumpkin-soup.webp` | [Max Griss](https://unsplash.com/@grissphoto) | [Unsplash](https://unsplash.com/photos/soup-in-white-ceramic-bowl-8mVLMZ0WW98) |
| `assets/img/menu/red-wine.webp` | [Subhajit Saha Photography](https://unsplash.com/@subhajit_saha_photography) | [Unsplash](https://unsplash.com/photos/a-full-red-wine-glass-next-to-a-broken-one-MG5VIb6o_8g) |
| `assets/img/menu/ribeye.webp` | [Sebastian Doll](https://unsplash.com/@sebonbali) | [Unsplash](https://unsplash.com/photos/a-close-up-of-a-plate-of-food-with-meat-wxt4m8ECpgM) |
| `assets/img/menu/risotto.webp` | [Max Griss](https://unsplash.com/@grissphoto) | [Unsplash](https://unsplash.com/photos/cooked-rice-with-green-vegetable-on-white-round-plate-D9fAmtjC284) |
| `assets/img/menu/scallops.webp` | [Andre Davis](https://unsplash.com/@drefotosatl) | [Unsplash](https://unsplash.com/photos/cooked-food-on-white-ceramic-plate-JFLQpW8HDmE) |
| `assets/img/menu/seabass.webp` | [Sung Jin Cho](https://unsplash.com/@mbuff) | [Unsplash](https://unsplash.com/photos/a-white-plate-topped-with-a-piece-of-fish-covered-in-sauce-ai3vWZtGFgw) |
| `assets/img/menu/spotlight.webp` | [Brandee Taylor](https://unsplash.com/@brandee35) | [Unsplash](https://unsplash.com/photos/a-martini-with-olives-on-a-wooden-surface-mb-CRfKZDFY) |
| `assets/img/menu/syrniki.webp` | [Max Nayman](https://unsplash.com/@maxniceman) | [Unsplash](https://unsplash.com/photos/brown-cookies-on-white-ceramic-plate-aUFPDI3n1_I) |
| `assets/img/menu/tartare.webp` | [Alexandra Tran](https://unsplash.com/@alexgoesglobal) | [Unsplash](https://unsplash.com/photos/a-plate-of-food-J2RQT7kJSMM) |
| `assets/img/menu/tasting.webp` | [Urban Gyllström](https://unsplash.com/@gyllstrom_photo) | [Unsplash](https://unsplash.com/photos/chef-pouring-sauce-over-plated-steak-MaWMfm-HCqQ) |
| `assets/img/sets/antrakt.webp` | [Anima Visual](https://unsplash.com/@animavisual) | [Unsplash](https://unsplash.com/photos/a-plate-of-sushi-krTKv3ThP30) |
| `assets/img/sets/benefis.webp` | [Cathrine Skovly](https://unsplash.com/@cathrinesk) | [Unsplash](https://unsplash.com/photos/a-plate-of-oysters-on-a-table-with-a-glass-of-wine-R3lPrDjKfSY) |
| `assets/img/sets/premiera.webp` | [Filip Rankovic Grobgaard](https://unsplash.com/@filipgrobgaard) | [Unsplash](https://unsplash.com/photos/a-formal-dinner-table-setting-with-black-tablecloth-vi6u8RcMSUU) |
| `assets/img/team/bartender.webp` | [Emily Andreeva](https://unsplash.com/@emiandreeva) | [Unsplash](https://unsplash.com/photos/person-holding-clear-wine-glass-with-white-liquid-hXg4gGjIfhw) |
| `assets/img/team/chef.webp` | [Tommaso Ubezio](https://unsplash.com/@tommasoubezio) | [Unsplash](https://unsplash.com/photos/chef-presents-a-beautiful-plate-of-food-9gjfxULJZOk) |
| `assets/img/team/karabas.webp` | [Mohammad Metri](https://unsplash.com/@mohammadmetri) | [Unsplash](https://unsplash.com/photos/man-wearing-black-suit-r8J8AfoHPz4) |
| `assets/img/team/pastry-chef.webp` | [Martin Baron](https://unsplash.com/@elmartinbaron) | [Unsplash](https://unsplash.com/photos/a-man-in-a-kitchen-preparing-food-on-a-plate-_Kdi9H3R1ik) |
| `assets/img/team/sommelier.webp` | [Kevin Kelly](https://unsplash.com/@shootervision) | [Unsplash](https://unsplash.com/photos/liquor-pours-in-wine-glass-PPneSBqfCCU) |

</details>
