
-- =============================================
-- Seed data for Landing Constructor
-- Template: profession (Психолог-консультант)
-- =============================================

-- Insert block definitions

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'hero_stats',
  'Hero: статистика и УТП',
  'Hero и УТП',
  'Карточки с ключевыми цифрами: №1, 450 часов, 2 диплома и т.д.',
  '  <div class="section s4_hg8ap7v1d section-page pt-0">
    <div class="container-main">
      <div class="s4-wrapper_hg8ap7v1d">
        <div class="program-top program-top_block program-top_psychologist-consultant program-top_psychologist-consultant-new">
          <div class="program-top__content">
            <h1 class="size-48 mb-40 font-Atyp mb-20-m line-h-09">
              <span class="color-black-50">Профессия</span><br />
              психолог-<br />консультант
            </h1>
            <p class="mb-30 size-18 fw-400"><b>Освойте профессию под руководством практикующих экспертов</b> и начните уверенно работать с клиентами уже во время обучения</p>
            <a href="#go-form" class="button button-purple"> Оставить заявку </a>
          </div>
          <div class="program-top__pic">
            <img src="img/psy-v3/Image-hero_hg8ap7v1d.png" alt="" width="680" height="567" />
          </div>
        </div>
        <div class="s4-grid-hg8ap7v1d">
          <div class="s4-card-hg8ap7v1d s4-card-1-hg8ap7v1d">
            <h3 class="s4-card__title-hg8ap7v1d">№1</h3>
            <p class="s4-card__text-hg8ap7v1d">лидеры в подготовке специалистов помогающих профессий по качеству образования и количеству студентов</p>
          </div>
          <div class="s4-card-hg8ap7v1d s4-card-2-hg8ap7v1d">
            <h3 class="s4-card__title-hg8ap7v1d">450 часов</h3>
            <p class="s4-card__text-hg8ap7v1d">реальной практики</p>
          </div>
          <div class="s4-card-hg8ap7v1d s4-card-3-hg8ap7v1d">
            <h3 class="s4-card__title-hg8ap7v1d">2 диплома</h3>
            <p class="s4-card__text-hg8ap7v1d">профпереподготовки РФ,  международный MBA + международные сертификаты IPHM и CPD</p>
          </div>
          <div class="s4-card-hg8ap7v1d s4-card-4-hg8ap7v1d">
            <h3 class="s4-card__title-hg8ap7v1d">
              Звездный состав преподавателей
              <img src="img/psy-v3/s1-1.png" alt="" />
            </h3>
            <p class="s4-card__text-hg8ap7v1d">Эксперты, которые практикуют каждый день, пишут статьи, выступают на ТВ и радио</p>
          </div>
          <div class="s4-card-hg8ap7v1d s4-card-5-hg8ap7v1d">
            <h3 class="s4-card__title-hg8ap7v1d"><img src="img/psy-v3/star_hg8ap7v1d.png" alt="" />4,9+</h3>
            <p class="s4-card__text-hg8ap7v1d">рейтинг курса на Яндекс, Tutortop и Сравни</p>
          </div>
          <div class="s4-card-hg8ap7v1d s4-card-6-hg8ap7v1d">
            <h3 class="s4-card__title-hg8ap7v1d">10 гарантированных обращений </h3>
            <p class="s4-card__text-hg8ap7v1d">от реальных клиентов</p>
          </div>
          <div class="s4-card-hg8ap7v1d s4-card-7-hg8ap7v1d">
            <h3 class="s4-card__title-hg8ap7v1d">Мини-группы</h3>
            <p class="s4-card__text-hg8ap7v1d">Где преподаватель знает вас по имени, отслеживает личный прогресс, ведёт вас от первого урока до первого клиента</p>
          </div>
        </div>
      </div>
    </div>
  </div>',
  '[{"field":"stats_cards","type":"repeater","label":"Карточки статистики","fields":[{"field":"title","type":"text","label":"Заголовок (число)"},{"field":"text","type":"text","label":"Описание"}]}]'::jsonb,
  '{"is_dark_section":false}'::jsonb,
  3,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'audience_market',
  'Аудитория и рынок',
  'Hero и УТП',
  '«Для кого программа» + статистика спроса + слайдер преимуществ',
  '  <section class="s1 section pt-0">
    <div class="container-main">
      <div id="whom" class="s1-content-hg8ap7v1d">
        <div class="s1-left-hg8ap7v1d">
          <h2 class="size-48 font-Atyp fw-500 line-h-1-1 mb-30">
            Развивайтесь, оставаясь собой, <span class="color-purple-hg8ap7v1d"><span class="nowrap">и приносите</span> пользу людям</span>
          </h2>
          <p class="s1-left__desc s1-left__desc_hg8ap7v1d">Программа создана для обучения с нуля и не требует специального образования</p>
        </div>
        <picture>
          <source srcset="img/psy-v3/s1-3-hg8ap7v1d.webp" type="image/webp" />
          <img src="img/psy-v3/s1-3-hg8ap7v1d.jpg" alt="" loading="lazy" class="s1-content__img-hg8ap7v1d" />
        </picture>
      </div>
      <div class="s1-content-hg8ap7v1d s1-content-center-hg8ap7v1d">
        <div class="s1-left-hg8ap7v1d">
          <h3 class="size-36 font-Atyp fw-500 line-h-1-1 mb-30">Спрос на психологическую помощь <span class="color-gray-3">стабильно растет</span><img src="img/psy-v3/s1-icon_hg8ap7v1d.svg" alt="" /></h3>
        </div>
        <div class="s1-right-hg8ap7v1d">
          <p class="s1-right-text-hg8ap7v1d">Это подтверждают данные рынка и крупных исследовательских центров</p>
          <div class="s1-right-icons-hg8ap7v1d">
            <img src="img/psy-v3/s1-icon-brand-1_hg8ap7v1d.png" alt="" />
            <img src="img/psy-v3/s1-icon-brand-2_hg8ap7v1d.png" alt="" />
            <img src="img/psy-v3/s1-icon-brand-3_hg8ap7v1d.png" alt="" />
            <img src="img/psy-v3/s1-icon-brand-4_hg8ap7v1d.png" alt="" />
          </div>
        </div>
      </div>
      <h3 class="s1-subtitle-hg8ap7v1d">С профессией психолога-консультанта</h3>
      <div class="s1-swiper-container-hg8ap7v1d">
        <div class="swiper s1-swiper-hg8ap7v1d">
          <div class="s1-flex-list-hg8ap7v1d swiper-wrapper">
            <div class="s1-flex-item-hg8ap7v1d swiper-slide">
              <img src="img/psy-v3/s1-item-1-hg8ap7v1d.png" alt="" />
              <p>ваш путь и опыт становятся <b>профессиональной опорой</b>, а не грузом</p>
            </div>
            <div class="s1-flex-item-hg8ap7v1d swiper-slide">
              <img src="img/psy-v3/s1-item-2-hg8ap7v1d.png" alt="" />
              <p>личный рост идёт <b>параллельно с освоением профессии</b> - это часть процесса</p>
            </div>
            <div class="s1-flex-item-hg8ap7v1d swiper-slide">
              <img src="img/psy-v3/s1-item-3-hg8ap7v1d.png" alt="" />
              <p>новая карьера подстраивается под <b>ваш стиль жизни</b> - не наоборот</p>
            </div>
            <div class="s1-flex-item-hg8ap7v1d swiper-slide">
              <img src="img/psy-v3/s1-item-4-hg8ap7v1d.png" alt="" />
              <p>работайте из <b>любой точки мира</b> в своем графике</p>
            </div>
          </div>
          <div class="swiper-pagination"></div>
        </div>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"textarea","label":"Заголовок"},{"field":"subtitle","type":"text","label":"Подзаголовок"},{"field":"description","type":"text","label":"Описание программы"},{"field":"images.main","type":"image","label":"Основное изображение"},{"field":"market_title","type":"textarea","label":"Заголовок рынка"},{"field":"market_text","type":"text","label":"Текст о рынке"},{"field":"advantages","type":"repeater","label":"Преимущества (слайдер)","fields":[{"field":"icon","type":"image","label":"Иконка"},{"field":"text","type":"textarea","label":"Текст"}]}]'::jsonb,
  '{}'::jsonb,
  4,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'social_proof_stat',
  'Социальное доказательство (статистика)',
  'Hero и УТП',
  'Фиолетовый баннер «25% студентов начинают зарабатывать ещё в процессе обучения»',
  '  <section class="s2-hg8ap7v1d">
    <div class="container-main">
      <div class="s2-wrapper-hg8ap7v1d">
        <p class="s2-text-hg8ap7v1d font-Atyp fw-500">
          Мы нацелены<br />
          на качество и результаты
        </p>
        <p class="s2-tittle-hg8ap7v1d size-48 font-Atyp fw-500">25% студентов</p>
        <p class="s2-text-hg8ap7v1d font-Atyp fw-500">
          каждого потока приходят учиться<br />
          по рекомендациям наших выпускников
        </p>
      </div>
    </div>
  </section>',
  '[{"field":"text_before","type":"textarea","label":"Текст до числа"},{"field":"stat_number","type":"text","label":"Число/статистика"},{"field":"text_after","type":"textarea","label":"Текст после числа"}]'::jsonb,
  '{"background_color":"#7835FF","text_color":"#ffffff"}'::jsonb,
  5,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'learning_format',
  'Формат обучения (мини-группы)',
  'Формат обучения',
  '«Создали формат мини-групп» — описание формата + список преимуществ',
  '  <section class="s9-hg8ap7v1d section">
    <div class="container-main">
      <h2 class="size-48 font-Atyp fw-500 mb-60">Создали <span class="color-black-50">максимально удобный формат обучения,</span> где <span class="color-black-50">мотивация и интерес к психологии</span> растут с каждым уроком</h2>
      <div class="flex-block flex-block_column-mobile mb-40">
        <div class="flex-column flex-column_10 mt-20-m">
          <div class="s9-left-wrapper-hg8ap7v1d">
            <picture>
              <source srcset="img/psy-v3/zoom.webp" type="image/webp" />
              <img loading="lazy" src="img/psy-v3/zoom.png" alt="" />
            </picture>
            <div>
              <img src="img/psy-v3/img-check-hg8ap7v1d.png" alt="" />
              <p class="s9-left-text-hg8ap7v1d fw-400 size-20 line-h-1-5">
                Мы — <span class="fw-700">единственные в онлайн образовании</span>, кто учит будущих психологов <span class="color-red fw-700">в мини-группах.<br /></span> Это принципиально меняет результат
              </p>
            </div>
          </div>
        </div>
        <div class="flex-column flex-column_10">
          <h2 class="size-28 fw-500 mb-20 line-h-1 font-Atyp">Преподаватель видит каждого, а вы учитесь в живой среде, где есть групповая динамика и персональная обратная связь</h2>
          <div class="s9-right-list-hg8ap7v1d">
            <div class="s9-right-item-hg8ap7v1d">
              <p class="s9-right-item-title-hg8ap7v1d line-h-1-5 fw-700 size-20">Преподаватель работает с вами персонально</p>
              <p class="s9-right-item-text-hg8ap7v1d size-20">Знает ваш запрос, цели, темп и прогресс, ведёт вас по профессии</p>
            </div>
            <div class="s9-right-item-hg8ap7v1d">
              <p class="s9-right-item-title-hg8ap7v1d line-h-1-5 fw-700 size-20">Вы формируете круг коллег и единомышленников</p>
              <p class="s9-right-item-text-hg8ap7v1d size-20">С кем можно обсуждать инструменты, разбирать кейсы, расти вместе, отрабатывать профессиональные навыки</p>
            </div>
            <div class="s9-right-item-hg8ap7v1d">
              <p class="s9-right-item-title-hg8ap7v1d line-h-1-5 fw-700 size-20">Комьюнити остаётся с вами надолго</p>
              <p class="s9-right-item-text-hg8ap7v1d size-20">Группы продолжают общаться и поддерживать друг друга уже как практикующие специалисты</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"textarea","label":"Заголовок"},{"field":"subtitle","type":"textarea","label":"Подзаголовок"},{"field":"description","type":"textarea","label":"Описание"},{"field":"images.main","type":"image","label":"Фото"},{"field":"features","type":"repeater","label":"Преимущества","fields":[{"field":"title","type":"text","label":"Заголовок"},{"field":"text","type":"text","label":"Описание"}]}]'::jsonb,
  '{}'::jsonb,
  6,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'platform_comfort',
  'Комфортное обучение',
  'Формат обучения',
  '«Комфортное обучение в вашем ритме» — видео платформы + 3 карточки',
  '  <section class="s8-hg8ap7v1d section pt-0">
    <div class="container-main">
      <div class="flex-block flex-block_column-mobile mb-40">
        <div id="advantages" class="flex-column flex-column_10">
          <h2 class="s8-title-hg8ap7v1d size-48 mb-40">Комфортное обучение <span>в вашем ритме</span></h2>
          <p class="size-20">Собственна платформа, где учиться удобно и приятно. Простая навигация и логика — все интуитивно понятно, <span class="s8-text-nowrap-hg8ap7v1d">даже если</span> вы никогда не учились онлайн</p>
        </div>
        <div class="flex-column flex-column_10 flex-column_pic mt-20-m">
          <video playsinline autoplay="" loop="" muted="">
            <data-src src="https://talentsy.ruhttps://talentsy.ru/wp-content/themes/talentsy/img/video/video-5.mp4?shorts=true" type="video/mp4"></data-src>
          </video>
        </div>
      </div>
      <div class="s8-list-hg8ap7v1d">
        <div class="s8-item-hg8ap7v1d">
          <p class="s8-text-hg8ap7v1d font-bold">
            Доступ к курсу<br />
            и все его обновления<br> остаются с вами навсегда
          </p>
          <img src="img/psy-v3/img-check-hg8ap7v1d.svg" alt="" class="s8-img-hg8ap7v1d" />
        </div>
        <div class="s8-item-hg8ap7v1d">
          <p class="s8-text-hg8ap7v1d"><b>Доступ 24/7</b> - смотрите лекции <span class="nowrap">и выполняйте</span> домашние задания <span class="nowrap">в удобное</span> время</p>
          <img src="img/psy-v3/img-check-hg8ap7v1d.svg" alt="" class="s8-img-hg8ap7v1d" />
        </div>
        <div class="s8-item-hg8ap7v1d">
          <p class="s8-text-hg8ap7v1d"><b>Резидент Сколково</b> разрабатываем IT-решения для онлайн-образования</p>
          <img src="img/psy-v3/sk.svg" alt="" class="s8-img-hg8ap7v1d" />
        </div>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"textarea","label":"Заголовок"},{"field":"description","type":"text","label":"Описание"},{"field":"video_url","type":"text","label":"URL видео"},{"field":"features","type":"repeater","label":"Карточки","fields":[{"field":"text","type":"textarea","label":"Текст"},{"field":"icon","type":"image","label":"Иконка"}]}]'::jsonb,
  '{}'::jsonb,
  7,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'video_lectures',
  'Видеолекции',
  'Формат обучения',
  '«Видеолекции 15–40 минут» — описание формата видеоуроков',
  '  <section class="section pt-0">
    <div class="container-main">
      <div class="flex-block">
        <div class="flex-column flex-column_pic flex-column_10 mt-20-m">
          <video playsinline autoplay="" loop="" muted="">
            <data-src src="https://talentsy.ruhttps://talentsy.ru/wp-content/themes/talentsy/img/video/video-6.mp4?shorts=true" type="video/mp4"></data-src>
          </video>
          <!--   <div style="position: relative; padding-top: 66.1%; width: 100%"><iframe src="https://kinescope.io/embed/wjdmPRuU4jCxNepNd17TJ1" allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write;" frameborder="0" allowfullscreen style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;"></iframe></div>
                    -->
        </div>
        <div class="flex-column flex-column_10">
          <h2 class="size-48 mb-40">Видеолекции 15–40 минут</h2>
          <p class="size-20">Только самая суть - без воды с уважением к вашему времени. Занимайтесь в своем темпе, смотрите на удобной скорости. Материал от простого к сложному, разберется даже новичок.</p>
        </div>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"text","label":"Заголовок"},{"field":"description","type":"textarea","label":"Описание"},{"field":"video_url","type":"text","label":"URL видео"}]'::jsonb,
  '{}'::jsonb,
  8,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'additional_materials',
  'Дополнительные материалы',
  'Формат обучения',
  '«Дополнительные материалы к урокам» — конспекты, чек-листы, тесты',
  '  <section class="s3-hg8ap7v1d section s3 pt-0">
    <div class="container-main">
      <div class="grid-column-2">
        <div class="block-grey-50">
          <h3 class="s3-title-hg8ap7v1d size-36 text-center">Дополнительные материалы к урокам</h3>
          <p class="size-20 text-center">В PDF-формате - удобно скачать, распечатать, повторить</p>
          <picture>
            <source srcset="img/psy-v3/s3-1.webp" type="image/webp" />
            <img src="img/psy-v3/s3-1.png" alt="" loading="lazy" />
          </picture>
        </div>
        <div class="block-grey-50">
          <h3 class="s3-title-hg8ap7v1d size-36 text-center">100+ дополнительных материалов</h3>
          <p class="size-20 text-center">Полезных шаблонов, схем, гайдов и шпаргалок для вашей практики</p>
          <picture>
            <source srcset="img/psy-v3/s3-2.webp" type="image/webp" />
            <img src="img/psy-v3/s3-2.png" alt="" loading="lazy" />
          </picture>
        </div>
      </div>
    </div>
  </section>',
  '[{"field":"items","type":"repeater","label":"Блоки материалов","fields":[{"field":"title","type":"text","label":"Заголовок"},{"field":"text","type":"text","label":"Описание"},{"field":"image","type":"image","label":"Изображение"}]}]'::jsonb,
  '{}'::jsonb,
  9,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'practice_approaches',
  'Подходы и практика',
  'Практика и подходы',
  'Список подходов с чекмарками (КПТ, психоанализ, гештальт и т.д.)',
  '  <section class="s24-hg8ap7v1d section s24 pt-0">
    <div class="container-main">
      <div class="s24-wrapper-hg8ap7v1d">
        <div class="s24-left-hg8ap7v1d">
          <h2 class="s24-title-hg8ap7v1d size-36 fw-500 line-h-1 mb-20 mb-10-m">
            10 психологических<br />
            подходов
          </h2>
          <p class="s24-text-hg8ap7v1d size-20 fw-400 line-h-1">вы попробуете на практике за 1 год обучения</p>
        </div>
        <img src="img/psy-v3/s24-img-hg8ap7v1d.png" alt="" />
      </div>
      <div class="s24-inner-hg8ap7v1d">
        <p class="s24-inner-text-hg8ap7v1d size-20 size-18-mobile fw-400 line-h-1-5 mb-40">Вы формируете профессиональный кругозор и выбираете лучший метод для конкретного запроса и ситуации</p>
        <div class="s24-list-hg8ap7v1d">
          <p class="s24-item-hg8ap7v1d">Интегративный подход</p>
          <p class="s24-item-hg8ap7v1d">Клиент-центрированный подход</p>
          <p class="s24-item-hg8ap7v1d">Основы когнитивно-поведенческого подхода</p>
          <p class="s24-item-hg8ap7v1d">Основы телесно-ориентированного подхода</p>
          <p class="s24-item-hg8ap7v1d">Психоаналитический подход</p>
          <p class="s24-item-hg8ap7v1d">Гештальт-терапия</p>
          <p class="s24-item-hg8ap7v1d">Экзистенциальный подход</p>
          <p class="s24-item-hg8ap7v1d">Основы ориентированной на решение краткосрочной терапии</p>
          <p class="s24-item-hg8ap7v1d">Краткосрочный фокусный подход (на примере коучинга)</p>
          <p class="s24-item-hg8ap7v1d">Основы арт-терапии (изотерапия, танцевально-двигательная терапия, метафорические ассоциативные карты)</p>
        </div>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"textarea","label":"Заголовок"},{"field":"subtitle","type":"text","label":"Подзаголовок"},{"field":"description","type":"textarea","label":"Описание"},{"field":"images.main","type":"image","label":"Изображение"},{"field":"approaches","type":"repeater","label":"Подходы","fields":[{"field":"name","type":"text","label":"Название подхода"}]}]'::jsonb,
  '{}'::jsonb,
  10,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'weekly_practice',
  'Еженедельная практика',
  'Практика и подходы',
  '«Каждую неделю вы практикуетесь» — описание практических занятий (слайдер)',
  '  <section class="s25-hg8ap7v1d section s25 pt-0">
    <div class="container-main">
      <div class="s25-wrapper-hg8ap7v1d d-only-hg8ap7v1d">
        <h2 class="size-48 fw-500 line-h-1 mb-30">Каждую неделю вы практикуетесь под руководством мастера:</h2>
        <p class="size-20 fw-400 line-h-1-5 mb-30">отрабатываете техники, консультируете в тройках, участвуете в мастерских и смотрите разборы реальных сессий</p>
        <div class="s25-grid-wrap-1-hg8ap7v1d">
          <div class="s25-card-hg8ap7v1d s25-card-1-hg8ap7v1d">
            <p class="s25-card-title-hg8ap7v1d">Тройки</p>
            <p class="s25-card-text-hg8ap7v1d">Вы по очереди практикуетесь в ролях психолога, клиента и наблюдателя.</p>
            <div class="s25-card-bottom-hg8ap7v1d">
              <p class="title">Для чего</p>
              <p class="text">Формируется навык работы и уверенность и понимание консультации с трёх ключевых позиций</p>
            </div>
          </div>
          <div class="s25-card-hg8ap7v1d s25-card-2-hg8ap7v1d">
            <p class="s25-card-title-hg8ap7v1d">Мастерские</p>
            <p class="s25-card-text-hg8ap7v1d">Отрабатываете технику: формирование запроса, рамку, контакт, работу с чувствами</p>
            <div class="s25-card-bottom-hg8ap7v1d">
              <p class="title">Для чего</p>
              <p class="text">профессиональные инструменты отрабатываются последовательно и надежно</p>
            </div>
          </div>
          <div class="s25-card-hg8ap7v1d s25-card-3-hg8ap7v1d">
            <img src="img/psy-v3/s25-card-3-img-hg8ap7v1d.jpg" alt="" />
            <p class="s25-card-title-hg8ap7v1d">Разборы демо-сессий мастеров</p>
            <p class="s25-card-text-hg8ap7v1d">Смотрите консультации опытных психологов и анализируете каждое профессиональное решение</p>
            <div class="s25-card-bottom-hg8ap7v1d">
              <p class="title">Для чего</p>
              <p class="text">понимаете логику работы мастеров и формируете собственный стиль</p>
            </div>
          </div>
          <div class="s25-card-hg8ap7v1d s25-card-4-hg8ap7v1d">
            <div class="s25-card-wrap-hg8ap7v1d">
              <p class="s25-card-title-hg8ap7v1d">Лаборатории консультирования</p>
              <p class="s25-card-text-hg8ap7v1d">Проводите учебные консультации в безопасной среде под руководством преподавателя</p>
            </div>
            <div class="s25-card-bottom-hg8ap7v1d">
              <p class="title">Для чего</p>
              <p class="text">нарабатываете живой опыт, можете пробовать, ошибаться и сразу закреплять корректные решения</p>
            </div>
          </div>
        </div>
        <div class="s25-grid-wrap-2-hg8ap7v1d">
          <div class="s25-card-hg8ap7v1d s25-card-5-hg8ap7v1d">
            <img src="img/psy-v3/s25-card-3-img2-hg8ap7v1d.jpg" alt="" />
            <p class="s25-card-title-hg8ap7v1d">Интервизии</p>
            <p class="s25-card-text-hg8ap7v1d">Совместно разбираете учебные случаи и формируете разные профессиональные гипотезы</p>
            <div class="s25-card-bottom-hg8ap7v1d">
              <p class="title">Для чего</p>
              <p class="text">растёт аналитическое мышление и умение видеть ситуацию «с разных сторон»</p>
            </div>
          </div>
          <div class="s25-card-hg8ap7v1d s25-card-6-hg8ap7v1d">
            <p class="s25-card-title-hg8ap7v1d">Психодиагностика</p>
            <p class="s25-card-text-hg8ap7v1d">Осваиваете методы оценки индивидуально-психологических особенностей личности</p>
            <div class="s25-card-bottom-hg8ap7v1d">
              <p class="title">Для чего</p>
              <p class="text">формируется профессиональный взгляд на клиента и понимание динамики его состояния</p>
            </div>
          </div>
          <div class="s25-card-hg8ap7v1d s25-card-7-hg8ap7v1d">
            <p class="s25-card-title-hg8ap7v1d">Учебные супервизии (аквариум)</p>
            <p class="s25-card-text-hg8ap7v1d">Проводите консультацию на занятии и получает обратную связь от преподавателя и группы</p>
            <div class="s25-card-bottom-hg8ap7v1d">
              <p class="title">Для чего</p>
              <p class="text">разбираете реальные кейсы и нарабатываете опыт безопасно</p>
            </div>
          </div>
          <div class="s25-card-hg8ap7v1d s25-card-8-hg8ap7v1d">
            <div class="s25-card-wrap-hg8ap7v1d">
              <p class="s25-card-title-hg8ap7v1d">Клиентская практика</p>
              <p class="s25-card-text-hg8ap7v1d">С 2 месяца проходите консультации у выпускников, а после 8 месяца — можете брать первых клиентов на платформе</p>
            </div>
            <div class="s25-card-bottom-hg8ap7v1d">
              <p class="title">Для чего</p>
              <p class="text">получаете опыт консультаций и понимание процесса с позиции клиента и психолога</p>
            </div>
          </div>
        </div>
        <div class="s25-grid-wrap-3-hg8ap7v1d">
          <div class="s25-card-hg8ap7v1d s25-card-9-hg8ap7v1d">
            <p class="s25-card-title-hg8ap7v1d">ИИ-тренажёры</p>
            <p class="s25-card-text-hg8ap7v1d">Отрабатываете элементы консультативной коммуникации в симулированных сценариях</p>
            <div class="s25-card-bottom-hg8ap7v1d">
              <p class="title">Для чего</p>
              <p class="text">безопасно закрепляете навыки перед переходом к реальной практике</p>
            </div>
          </div>
          <div class="s25-card-hg8ap7v1d s25-card-10-hg8ap7v1d">
            <p class="s25-card-title-hg8ap7v1d">Самостоятельные задания между занятиями</p>
            <p class="s25-card-text-hg8ap7v1d">Выполняете небольшие упражнения и разборы материалов для закрепления теории</p>
            <div class="s25-card-bottom-hg8ap7v1d">
              <p class="title">Для чего</p>
              <p class="text">поддерживаете ритм обучения и лучше готовитесь к живой практике</p>
            </div>
          </div>
        </div>
      </div>

      <div class="s25-wrapper-hg8ap7v1d m-only-hg8ap7v1d">
        <h2 class="size-48 fw-500 line-h-1 mb-30">Каждую неделю вы практикуетесь под руководством мастера:</h2>
        <p class="size-20 fw-400 line-h-1-5 mb-30">отрабатываете техники, консультируете в тройках, участвуете в мастерских и смотрите разборы реальных сессий</p>
        <div class="s25-grid-wrap-1-hg8ap7v1d">
          <div class="s25-swiper-container-hg8ap7v1d">
            <div class="swiper s25-swiper-hg8ap7v1d">
              <div class="swiper-wrapper">
                <div class="s25-card-hg8ap7v1d s25-card-4-hg8ap7v1d swiper-slide">
                  <div class="s25-card-wrap-hg8ap7v1d">
                    <p class="s25-card-title-hg8ap7v1d">Лаборатории консультирования</p>
                    <p class="s25-card-text-hg8ap7v1d">Проводите учебные консультации в безопасной среде под руководством преподавателя</p>
                  </div>
                  <div class="s25-card-bottom-hg8ap7v1d">
                    <p class="title">Для чего</p>
                    <p class="text">нарабатываете живой опыт, можете пробовать, ошибаться и сразу закреплять корректные решения</p>
                  </div>
                </div>
                <div class="s25-card-hg8ap7v1d s25-card-1-hg8ap7v1d swiper-slide">
                  <p class="s25-card-title-hg8ap7v1d">Тройки</p>
                  <p class="s25-card-text-hg8ap7v1d">Вы по очереди практикуетесь в ролях психолога, клиента и наблюдателя.</p>
                  <div class="s25-card-bottom-hg8ap7v1d">
                    <p class="title">Для чего</p>
                    <p class="text">Формируется навык работы и уверенность и понимание консультации с трёх ключевых позиций</p>
                  </div>
                </div>
                <div class="s25-card-hg8ap7v1d s25-card-2-hg8ap7v1d swiper-slide">
                  <p class="s25-card-title-hg8ap7v1d">Мастерские</p>
                  <p class="s25-card-text-hg8ap7v1d">Отрабатываете технику: формирование запроса, рамку, контакт, работу с чувствами</p>
                  <div class="s25-card-bottom-hg8ap7v1d">
                    <p class="title">Для чего</p>
                    <p class="text">профессиональные инструменты отрабатываются последовательно и надежно</p>
                  </div>
                </div>
                <div class="s25-card-hg8ap7v1d s25-card-3-hg8ap7v1d swiper-slide">
                  <img src="img/psy-v3/s25-card-3-img-hg8ap7v1d.jpg" alt="" />
                  <p class="s25-card-title-hg8ap7v1d">Разборы демо-сессий мастеров</p>
                  <p class="s25-card-text-hg8ap7v1d">Смотрите консультации опытных психологов и анализируете каждое профессиональное решение</p>
                  <div class="s25-card-bottom-hg8ap7v1d">
                    <p class="title">Для чего</p>
                    <p class="text">понимаете логику работы мастеров и формируете собственный стиль</p>
                  </div>
                </div>
                <div class="s25-card-hg8ap7v1d s25-card-5-hg8ap7v1d swiper-slide">
                  <img src="img/psy-v3/s25-card-3-img2-hg8ap7v1d.jpg" alt="" />
                  <p class="s25-card-title-hg8ap7v1d">Интервизии</p>
                  <p class="s25-card-text-hg8ap7v1d">Совместно разбираете учебные случаи и формируете разные профессиональные гипотезы</p>
                  <div class="s25-card-bottom-hg8ap7v1d">
                    <p class="title">Для чего</p>
                    <p class="text">растёт аналитическое мышление и умение видеть ситуацию «с разных сторон»</p>
                  </div>
                </div>
                <div class="s25-card-hg8ap7v1d s25-card-6-hg8ap7v1d swiper-slide">
                  <p class="s25-card-title-hg8ap7v1d">Психодиагностика</p>
                  <p class="s25-card-text-hg8ap7v1d">Осваиваете методы оценки индивидуально-психологических особенностей личности</p>
                  <div class="s25-card-bottom-hg8ap7v1d">
                    <p class="title">Для чего</p>
                    <p class="text">формируется профессиональный взгляд на клиента и понимание динамики его состояния</p>
                  </div>
                </div>
                <div class="s25-card-hg8ap7v1d s25-card-7-hg8ap7v1d swiper-slide">
                  <p class="s25-card-title-hg8ap7v1d">Учебные супервизии (аквариум)</p>
                  <p class="s25-card-text-hg8ap7v1d">Проводите консультацию на занятии и получает обратную связь от преподавателя и группы</p>
                  <div class="s25-card-bottom-hg8ap7v1d">
                    <p class="title">Для чего</p>
                    <p class="text">разбираете реальные кейсы и нарабатываете опыт безопасно</p>
                  </div>
                </div>
                <div class="s25-card-hg8ap7v1d s25-card-8-hg8ap7v1d swiper-slide">
                  <div class="s25-card-wrap-hg8ap7v1d">
                    <p class="s25-card-title-hg8ap7v1d">Клиентская практика</p>
                    <p class="s25-card-text-hg8ap7v1d">С 2 месяца проходите консультации у выпускников, а после 8 месяца — можете брать первых клиентов на платформе</p>
                  </div>
                  <div class="s25-card-bottom-hg8ap7v1d">
                    <p class="title">Для чего</p>
                    <p class="text">получаете опыт консультаций и понимание процесса с позиции клиента и психолога</p>
                  </div>
                </div>
                <div class="s25-card-hg8ap7v1d s25-card-9-hg8ap7v1d swiper-slide">
                  <p class="s25-card-title-hg8ap7v1d">ИИ-тренажёры</p>
                  <p class="s25-card-text-hg8ap7v1d">Отрабатываете элементы консультативной коммуникации в симулированных сценариях</p>
                  <div class="s25-card-bottom-hg8ap7v1d">
                    <p class="title">Для чего</p>
                    <p class="text">безопасно закрепляете навыки перед переходом к реальной практике</p>
                  </div>
                </div>
                <div class="s25-card-hg8ap7v1d s25-card-10-hg8ap7v1d swiper-slide">
                  <p class="s25-card-title-hg8ap7v1d">Самостоятельные задания между занятиями</p>
                  <p class="s25-card-text-hg8ap7v1d">Выполняете небольшие упражнения и разборы материалов для закрепления теории</p>
                  <div class="s25-card-bottom-hg8ap7v1d">
                    <p class="title">Для чего</p>
                    <p class="text">поддерживаете ритм обучения и лучше готовитесь к живой практике</p>
                  </div>
                </div>
              </div>
              <div class="swiper-pagination"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"textarea","label":"Заголовок"},{"field":"slides","type":"repeater","label":"Слайды практики","fields":[{"field":"title","type":"text","label":"Название"},{"field":"text","type":"textarea","label":"Описание"},{"field":"image","type":"image","label":"Изображение"}]}]'::jsonb,
  '{}'::jsonb,
  11,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'cta_form_consultation',
  'CTA: Форма консультации',
  'CTA и формы',
  '«Расскажите о своих целях» — форма с полями (имя, телефон, email)',
  '  <section class="section pt-0">
    <div class="container-main">
      <form data-target="axFormRequest" class="form-get form-get_new form-get_inherit ajaxForm">
        <div class="form-get__start form-get__start_between">
          <div>
            <h3 class="size-40 line-h-1-2 fw-500 font-Atyp mb-20 letter-1">Расскажите о своих целях </h3>
            <div class="size-20">Наш специалист честно разберет, подойдет ли программа под ваш темп и задачи</div>
          </div>
        </div>
        <div class="form-get__main">
          <div class="form-item">
            <input type="text" name="Name" class="input input-light" required placeholder="Ваше имя" />
          </div>
          <div class="form-item">
            <input type="number" class="input input-light" placeholder="Номер телефона" maxlength="18" pattern="^[0-9]{3,18}$" name="Phone" data-mask="tel" required />
          </div>
          <div class="form-item">
            <input type="email" name="Email" class="input input-light" placeholder="Почта" required />
          </div>
          <div class="form-flex">
            <button type="submit" class="form-button-hg8ap7v1d button h-62 button-main button-purple button-p-32">Обсудить цели</button>
          </div>

          <noindex>
        <div class="agreed__block agreed footer-agreed">
        <input type="checkbox" name="form_agreed" required class="agreed__checkbox checkbox-required" id="user_confirmed_16940811573842">
        <label class="agreed_label error-check checkbox-off" for="user_confirmed_16940811573842"></label>

        <div class="agreed_message">
            <span class="agreed__text">
                Отправляя данную форму, вы соглашаетесь с условиями <a class="agreed__link" href="https://talentsy.ru/legal/oferta/">оферты</a> и <a class="agreed__link" href="https://talentsy.ru/legal/policy/">политики обработки персональных данных</a>. Я даю свое согласие на <a class="agreed__link" href="https://talentsy.ru/legal/pd-agreement/">обработку персональных данных</a>.
            </span>
            <div class="error_agreed agreed__text">Вам нужно принять политику конфиденциальности</div>
        </div>
    </div>

        <div class="agreed__block agreed footer-agreed">
        <input type="hidden" name="form_agreed_2" value="nosms">
        <input type="checkbox" name="form_agreed_2" class="agreed__checkbox" value="sms" id="user_confirmed_28624578415896">
        <label class="agreed_label unreq checkbox-off" for="user_confirmed_28624578415896"></label>

        <div class="agreed_message">
            <span class="agreed__text">
                Я даю свое <a href="https://talentsy.ru/legal/mailing-agreement/" class="agreed__link">согласие</a> на получение рекламных и информационных рассылок.
            </span>
            <div class="error_agreed agreed__text" style="display: none;">Вам нужно выдать согласие</div>
        </div>
    </div>
</noindex>        </div>
      </form>
    </div>
  </section>',
  '[{"field":"title","type":"text","label":"Заголовок"},{"field":"description","type":"text","label":"Описание"},{"field":"button_text","type":"text","label":"Текст кнопки"}]'::jsonb,
  '{}'::jsonb,
  12,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'career_paths',
  'Карьерные пути',
  'Карьера и заработок',
  'Визуальные карточки с направлениями карьеры выпускника',
  '  <section class="s26-hg8ap7v1d section section-grey">
    <div class="container-main">
      <div class="s26-block-hg8ap7v1d flex-block flex-block_column-mobile flex-block_inherit mb-40">
        <div class="flex-column flex-column_between flex-column_10">
          <div>
            <p class="s26-pinned-hg8ap7v1d mb-30">закреплено в договоре</p>
            <h2 class="size-45 font-Atyp fw-500 line-h-1 mb-30 mb-30_mobile">
              <span class="color-purple-2">Гарантируем<br />
                10 обращений</span>
              <span class="nowrap">от реальных</span> клиентов
            </h2>
            <div class="get-client get-client_column get-client_10 mt-0 size-18 line-h-1-5 no-br-mobile mb-30">
              <p class="s26-get-client__text-hg8ap7v1d">через наш сервис видео-консультаций <span class="s26-img-hg8ap7v1d">
                <img src="img/psy-v3/s26-icon-hg8ap7v1d.png" alt="" /> <b>pomogayu.ru</b>
              </span> после окончания курса</p>
              <div class="s26-get-client__item-hg8ap7v1d">
                <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.625 0H1.875C1.37772 0 0.900805 0.19755 0.549177 0.549177C0.19755 0.900805 0 1.37772 0 1.875V20.625C0 21.1223 0.19755 21.5992 0.549177 21.9509C0.900805 22.3024 1.37772 22.5 1.875 22.5H20.625C21.1223 22.5 21.5992 22.3024 21.9509 21.9509C22.3024 21.5992 22.5 21.1223 22.5 20.625V1.875C22.5 1.37772 22.3024 0.900805 21.9509 0.549177C21.5992 0.19755 21.1223 0 20.625 0ZM17.8125 12.1875H12.1875V17.8125C12.1875 18.0611 12.0888 18.2996 11.9129 18.4754C11.7371 18.6513 11.4986 18.75 11.25 18.75C11.0014 18.75 10.7629 18.6513 10.5871 18.4754C10.4112 18.2996 10.3125 18.0611 10.3125 17.8125V12.1875H4.6875C4.43885 12.1875 4.20041 12.0888 4.02458 11.9129C3.84877 11.7371 3.75 11.4986 3.75 11.25C3.75 11.0014 3.84877 10.7629 4.02458 10.5871C4.20041 10.4112 4.43885 10.3125 4.6875 10.3125H10.3125V4.6875C10.3125 4.43885 10.4112 4.20041 10.5871 4.02458C10.7629 3.84877 11.0014 3.75 11.25 3.75C11.4986 3.75 11.7371 3.84877 11.9129 4.02458C12.0888 4.20041 12.1875 4.43885 12.1875 4.6875V10.3125H17.8125C18.0611 10.3125 18.2996 10.4112 18.4754 10.5871C18.6513 10.7629 18.75 11.0014 18.75 11.25C18.75 11.4986 18.6513 11.7371 18.4754 11.9129C18.2996 12.0888 18.0611 12.1875 17.8125 12.1875Z" fill="#7835FF" />
                </svg>
                <p>безлимитное количество обращений на сервисе для стажировки уже во время обучения</p>
              </div>
              <div class="get-client__item">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
                  <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                  <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                <span>Вы начинаете практиковать
                  <b>в реальных условиях, но не одни:</b>
                  рядом помощь супервизора и поддержка группы</span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-column flex-column_10 mt-20-m">
          <picture>
            <source srcset="img/psy-v3/s1-4.webp" type="image/webp" />
            <img loading="lazy" src="img/psy-v3/s1-4.png" alt="" width="590" height="576" />
          </picture>
        </div>
      </div>
      
    </div>
  </section>',
  '[{"field":"title","type":"textarea","label":"Заголовок"},{"field":"subtitle","type":"textarea","label":"Подзаголовок"},{"field":"images.main","type":"image","label":"Изображение"},{"field":"features","type":"repeater","label":"Направления карьеры","fields":[{"field":"icon","type":"image","label":"Иконка"},{"field":"text","type":"text","label":"Описание"}]}]'::jsonb,
  '{"is_grey_section":true}'::jsonb,
  13,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'earning_growth',
  'Рост заработка',
  'Карьера и заработок',
  '«Заработок будет расти» — описание финансового роста',
  '  <section class="section section-grey">
    <div class="container-main">
      <h2 class="size-48 text-center mb-60 font-Atyp fw-500">Заработок будет расти <span class="span-grey">вместе с опытом</span></h2>
      <div class="earnings mb-60 mb-60-mobile">
        <div class="earnings-column">
          <div class="earnings-item">
            <p class="size-16 mb-10">Количество консультаций в день</p>
            <div class="earnings-slider">
              <input type="number" class="earnings-input input" value="3" />
              <div class="earnings-slide" data-min="1" data-max="6" data-start="3" data-step="1"></div>
            </div>
          </div>
          <div class="earnings-item">
            <p class="size-16 mb-10">Количество рабочих дней в месяц</p>
            <div class="earnings-slider">
              <input type="number" class="earnings-input input" value="22" />
              <div class="earnings-slide" data-min="1" data-max="30" data-start="22" data-step="1"></div>
            </div>
          </div>
          <div class="earnings-item">
            <p class="size-16 mb-10">Стоимость одной консультации, ₽</p>
            <div class="earnings-slider">
              <input type="number" class="earnings-input input" value="3500" />
              <div class="earnings-slide" data-min="1500" data-max="10000" data-start="3500" data-step="100"></div>
            </div>
          </div>
        </div>
        <div class="earnings-line"></div>
        <div class="earnings-column earnings-column_between">
          <div>
            <h5 class="size-22 size-16-mobile fw-600 mb-20 no-br-mobile">
              Вы сможете зарабатывать в месяц<br />
              на психологических консультациях
            </h5>
            <div class="size-56 font-Atyp" id="income_calc">154 000 ₽</div>
          </div>
          <div class="profi size-16">
            <picture>
              <source srcset="img/psy-v3/profi.webp" type="image/webp" />
              <img loading="lazy" src="img/psy-v3/profi.png" alt="" />
            </picture>
            <p>
              Средняя стоимость консультации психолога по РФ — <br />
              <b>3 500 ₽</b>, а в Москве порядка <b>5 000 ₽</b>, по данным profi.ru
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"textarea","label":"Заголовок"},{"field":"description","type":"textarea","label":"Описание"},{"field":"items","type":"repeater","label":"Уровни заработка","fields":[{"field":"title","type":"text","label":"Заголовок"},{"field":"amount","type":"text","label":"Сумма"},{"field":"text","type":"text","label":"Описание"}]}]'::jsonb,
  '{"is_grey_section":true}'::jsonb,
  14,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'course_included',
  'Что входит в курс',
  'Программа',
  '«Курс включает» — обзор состава программы',
  '  <section class="s11-hg8ap7v1d section">
    <div class="container-main">
      <div class="s11-wrapper-hg8ap7v1d">
        <div class="s11-content-hg8ap7v1d">
          <img src="img/psy-v3/s11-icon-hg8ap7v1d.png" alt="" class="s11-icon-hg8ap7v1d" />
          <h3 class="s11-title-hg8ap7v1d">Курс <span>PROдвижение</span> в подарок</h3>
          <p class="s11-text-hg8ap7v1d">После основной программы вы не остаётесь 1 на 1 с новой профессией — научим продвигать свои услуги и развивать личный бренд в самых популярных соцсетях</p>
        </div>
        <picture class="s11-pic-hg8ap7v1d">
          <img class="s11-img-hg8ap7v1d" src="img/psy-v3/s11-gif-hg8ap7v1d.gif" alt="" />
        </picture>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"text","label":"Заголовок"},{"field":"items","type":"repeater","label":"Элементы","fields":[{"field":"number","type":"text","label":"Число"},{"field":"text","type":"text","label":"Описание"}]}]'::jsonb,
  '{}'::jsonb,
  15,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'skills_grid',
  'Навыки (сетка)',
  'Программа',
  'Карточки навыков, которые получит студент',
  '  <section class="s12-hg8ap7v1d section pt-0">
    <div class="container-main">
      <div class="s12-content-hg8ap7v1d">
        <div class="s12-list-hg8ap7v1d">
          <div class="s12-item-hg8ap7v1d">
            <h4 class="s12-item-title-hg8ap7v1d">Живой онлайн-курс с сопровождением маркетолога</h4>
            <p class="s12-item-text-hg8ap7v1d">Вы учитесь в мини-группе, разбираете свой кейс и получаете обратную связь, а не просто смотрите записи</p>
            <img src="img/psy-v3/s12-1-hg8ap7v1d.png" alt="" class="s12-item-img-hg8ap7v1d" />
          </div>
          <div class="s12-item-hg8ap7v1d">
            <img src="img/psy-v3/s12-2-hg8ap7v1d.png" alt="" class="s12-item-img-hg8ap7v1d" />
            <h4 class="s12-item-title-hg8ap7v1d">Актуальные инструменты для психологов</h4>
            <p class="s12-item-text-hg8ap7v1d">Разбираете особенности соцсетей и учитесь применять инструменты, подходящие именно вашему стилю работы</p>
          </div>
          <div class="s12-item-hg8ap7v1d">
            <h4 class="s12-item-title-hg8ap7v1d">Постоянно обновляемая программа</h4>
            <p class="s12-item-text-hg8ap7v1d">Адаптируем курс под все изменения — вы получаете только актуальные знания</p>
            <img src="img/psy-v3/s12-3-hg8ap7v1d.png" alt="" class="s12-item-img-hg8ap7v1d" />
          </div>
        </div>
      </div>
      <form data-target="axFormRequest" class="ajaxForm s12-form-hg8ap7v1d">
        <div class="s12-form-item-hg8ap7v1d">
          <input type="text" class="input input-light" required="" name="Name" placeholder="Ваше имя" />
        </div>
        <div class="s12-form-item-hg8ap7v1d">
          <input type="tel" class="input input-light" required="" name="Phone" placeholder="Номер телефона" />
        </div>
        <div class="s12-form-item-hg8ap7v1d">
          <input type="text" class="input input-light" required="" name="Email" placeholder="Почта" />
        </div>
        <div>
          <button type="submit" class="button h-62 button-main button-purple" disabled="">Узнать подробнее</button>
        </div>
        <div class="s12-check-wrapper-hg8ap7v1d">
          <noindex>
        <div class="agreed__block agreed footer-agreed">
        <input type="checkbox" name="form_agreed" required class="agreed__checkbox checkbox-required" id="user_confirmed_63502103450247">
        <label class="agreed_label error-check checkbox-off" for="user_confirmed_63502103450247"></label>

        <div class="agreed_message">
            <span class="agreed__text">
                Отправляя данную форму, вы соглашаетесь с условиями <a class="agreed__link" href="https://talentsy.ru/legal/oferta/">оферты</a> и <a class="agreed__link" href="https://talentsy.ru/legal/policy/">политики обработки персональных данных</a>. Я даю свое согласие на <a class="agreed__link" href="https://talentsy.ru/legal/pd-agreement/">обработку персональных данных</a>.
            </span>
            <div class="error_agreed agreed__text">Вам нужно принять политику конфиденциальности</div>
        </div>
    </div>

        <div class="agreed__block agreed footer-agreed">
        <input type="hidden" name="form_agreed_2" value="nosms">
        <input type="checkbox" name="form_agreed_2" class="agreed__checkbox" value="sms" id="user_confirmed_83793854003542">
        <label class="agreed_label unreq checkbox-off" for="user_confirmed_83793854003542"></label>

        <div class="agreed_message">
            <span class="agreed__text">
                Я даю свое <a href="https://talentsy.ru/legal/mailing-agreement/" class="agreed__link">согласие</a> на получение рекламных и информационных рассылок.
            </span>
            <div class="error_agreed agreed__text" style="display: none;">Вам нужно выдать согласие</div>
        </div>
    </div>
</noindex>        </div>
      </form>
    </div>
  </section>',
  '[{"field":"title","type":"text","label":"Заголовок"},{"field":"skills","type":"repeater","label":"Навыки","fields":[{"field":"title","type":"text","label":"Название навыка"},{"field":"text","type":"textarea","label":"Описание"}]}]'::jsonb,
  '{}'::jsonb,
  16,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'teachers',
  'Преподаватели',
  'Преподаватели',
  '«Учитесь у ведущих психологов страны» — фото и био преподавателей (слайдер)',
  '  <section class="s13-hg8ap7v1d section section-black">
    <div class="container-main tab-container">
      <div class="s13-head-hg8ap7v1d section-head section-head_flex mb-60 mb-20-m">
        <h2 class="size-48 font-Atyp section-head__column">Учитесь у ведущих психологов страны</h2>
        <div class="section-head__column">
          <p class="size-20 mt-20-m mb-60">Пожалуй, самый сильный состав преподавателей на программах переподготовки в области психологии</p>
          <p class="s13-text-hg8ap7v1d mb-20"><span>Психологи-практики</span> с многолетним стажем, кандидатскими и докторскими степенями</p>
          <p class="size-16 mb-20">Это эксперты, которые</p>
          <div class="s13-list-hg8ap7v1d">
            <p class="s13-item-hg8ap7v1d">
              <img src="img/psy-v3/img-check-hg8ap7v1d.png" alt="" />
              практикуют каждый день и знают актуальные запросы
            </p>
            <p class="s13-item-hg8ap7v1d">
              <img src="img/psy-v3/img-check-hg8ap7v1d.png" alt="" />
              делятся опытом на реальных кейсах
            </p>
            <p class="s13-item-hg8ap7v1d">
              <img src="img/psy-v3/img-check-hg8ap7v1d.png" alt="" />
              проводят разбор ошибок
            </p>
          </div>
        </div>
      </div>
    <noindex>
        <div class="specialist-container">
            <button type="button" class="swiper-arrow swiper-arrow_prev icon"
                    style="--icon: url(img/main-page/icon/icon-arrow-left.svg)"></button>
            <div class="swiper swiper-specialist">
                <div class="swiper-wrapper">
                                            <div class="swiper-slide">
                            <div class="swiper-slide__pic">
                                <img loading="lazy" src="img/teachers/elena-novoselova.png" alt="">
                                <div class="swiper-slide__content">
                                    <h3 class="size-20 mb-10">
                                        Елена Новоселова                                    </h3>
                                    <p class="text-white-70 mb-10">
                                        Психолог с практическим опытом более 30 лет, член Российской Психотерапевтической Лиги, журналист, лектор, колумнист, автор книг, теле- и радиоведущая.                                    </p>
                                    <a href="#" data-popup="#teacher17777"
                                       class="button button-border-white">Подробнее</a>
                                </div>
                            </div>
                        </div>
                                            <div class="swiper-slide">
                            <div class="swiper-slide__pic">
                                <img loading="lazy" src="img/teachers/olga-vindeker.png" alt="">
                                <div class="swiper-slide__content">
                                    <h3 class="size-20 mb-10">
                                        Ольга Виндекер                                    </h3>
                                    <p class="text-white-70 mb-10">
                                        Кандидат психологических наук, доцент, практикующий психолог, автор учебных пособий, более 100 научных статей.                                    </p>
                                    <a href="#" data-popup="#teacher17801"
                                       class="button button-border-white">Подробнее</a>
                                </div>
                            </div>
                        </div>
                                            <div class="swiper-slide">
                            <div class="swiper-slide__pic">
                                <img loading="lazy" src="img/teachers/aleksey-dvoynin.png" alt="">
                                <div class="swiper-slide__content">
                                    <h3 class="size-20 mb-10">
                                        Алексей Двойнин                                    </h3>
                                    <p class="text-white-70 mb-10">
                                        Кандидат психологических наук, доцент, специалист в области общей психологии и психологии личности, автор более 150 научных и учебно-методических публикаций.                                    </p>
                                    <a href="#" data-popup="#teacher17803"
                                       class="button button-border-white">Подробнее</a>
                                </div>
                            </div>
                        </div>
                                            <div class="swiper-slide">
                            <div class="swiper-slide__pic">
                                <img loading="lazy" src="img/teachers/inna-vasileva.png" alt="">
                                <div class="swiper-slide__content">
                                    <h3 class="size-20 mb-10">
                                        Инна Васильева                                    </h3>
                                    <p class="text-white-70 mb-10">
                                        Доктор психологических наук, профессор, специалист в области психологии интуиции, обладатель исследовательских грантов, автор более 170 научных статей.                                    </p>
                                    <a href="#" data-popup="#teacher17805"
                                       class="button button-border-white">Подробнее</a>
                                </div>
                            </div>
                        </div>
                                            <div class="swiper-slide">
                            <div class="swiper-slide__pic">
                                <img loading="lazy" src="img/teachers/kseniya-kunnikova.png" alt="">
                                <div class="swiper-slide__content">
                                    <h3 class="size-20 mb-10">
                                        Ксения Кунникова                                    </h3>
                                    <p class="text-white-70 mb-10">
                                        Кандидат психологических наук, психофизиолог, нейропсихолог, руководитель грантов Российского фонда фундаментальных исследований.                                    </p>
                                    <a href="#" data-popup="#teacher17807"
                                       class="button button-border-white">Подробнее</a>
                                </div>
                            </div>
                        </div>
                                            <div class="swiper-slide">
                            <div class="swiper-slide__pic">
                                <img loading="lazy" src="img/teachers/elena-nikolaeva.png" alt="">
                                <div class="swiper-slide__content">
                                    <h3 class="size-20 mb-10">
                                        Елена Николаева                                    </h3>
                                    <p class="text-white-70 mb-10">
                                        Доктор биологических наук, профессор, заведующая кафедрой возрастной психологии и педагогики семьи Института детства. РГПУ им. А.И. Герцена.                                    </p>
                                    <a href="#" data-popup="#teacher17810"
                                       class="button button-border-white">Подробнее</a>
                                </div>
                            </div>
                        </div>
                                            <div class="swiper-slide">
                            <div class="swiper-slide__pic">
                                <img loading="lazy" src="img/teachers/anzhelika-vilgelm.png" alt="">
                                <div class="swiper-slide__content">
                                    <h3 class="size-20 mb-10">
                                        Анжелика Вильгельм                                    </h3>
                                    <p class="text-white-70 mb-10">
                                        Психолог-консультант, супервизор. Кандидат психологических наук, преподаватель высшей школы, член Российского психологического общества.                                    </p>
                                    <a href="#" data-popup="#teacher17812"
                                       class="button button-border-white">Подробнее</a>
                                </div>
                            </div>
                        </div>
                                            <div class="swiper-slide">
                            <div class="swiper-slide__pic">
                                <img loading="lazy" src="img/teachers/nadezhda-tomina.png" alt="">
                                <div class="swiper-slide__content">
                                    <h3 class="size-20 mb-10">
                                        Надежда Томина                                    </h3>
                                    <p class="text-white-70 mb-10">
                                        Клинический психолог с большим опытом работы в медицинских учреждениях и частной практике. Детский и взрослый психолог, специализирующийся на психоаналитической психотерапии. Член Российского психологического общества, преподаватель высшей школы.                                    </p>
                                    <a href="#" data-popup="#teacher17814"
                                       class="button button-border-white">Подробнее</a>
                                </div>
                            </div>
                        </div>
                                            <div class="swiper-slide">
                            <div class="swiper-slide__pic">
                                <img loading="lazy" src="img/teachers/yuliya-lebedeva.png" alt="">
                                <div class="swiper-slide__content">
                                    <h3 class="size-20 mb-10">
                                        Юлия Лебедева                                    </h3>
                                    <p class="text-white-70 mb-10">
                                        Кандидат психологических наук, практикующий психолог, специалист по педагогической психологии. Преподаватель высшей школы с опытом более 20 лет.                                    </p>
                                    <a href="#" data-popup="#teacher17818"
                                       class="button button-border-white">Подробнее</a>
                                </div>
                            </div>
                        </div>
                                            <div class="swiper-slide">
                            <div class="swiper-slide__pic">
                                <img loading="lazy" src="img/teachers/natalya-kudelkina.png" alt="">
                                <div class="swiper-slide__content">
                                    <h3 class="size-20 mb-10">
                                        Наталья Куделькина                                    </h3>
                                    <p class="text-white-70 mb-10">
                                        Психотерапевт, клинический психолог, кандидат психологических наук, опыт консультирования 19+ лет.                                    </p>
                                    <a href="#" data-popup="#teacher17821"
                                       class="button button-border-white">Подробнее</a>
                                </div>
                            </div>
                        </div>
                                            <div class="swiper-slide">
                            <div class="swiper-slide__pic">
                                <img loading="lazy" src="img/teachers/rustam-muslumov.png" alt="">
                                <div class="swiper-slide__content">
                                    <h3 class="size-20 mb-10">
                                        Рустам Муслумов                                    </h3>
                                    <p class="text-white-70 mb-10">
                                        Кандидат психологических наук, доцент кафедры педагогики и психологии образования Уральского федерального университета.                                    </p>
                                    <a href="#" data-popup="#teacher17822"
                                       class="button button-border-white">Подробнее</a>
                                </div>
                            </div>
                        </div>
                                            <div class="swiper-slide">
                            <div class="swiper-slide__pic">
                                <img loading="lazy" src="img/teachers/evgeniya-meglinskaya.png" alt="">
                                <div class="swiper-slide__content">
                                    <h3 class="size-20 mb-10">
                                        Евгения Меглинская                                    </h3>
                                    <p class="text-white-70 mb-10">
                                        Психолог, консультант по коррекции пищевого поведения, приглашенный эксперт для телеканалов «Мама-ТВ» и «Здоровое ТВ».                                    </p>
                                    <a href="#" data-popup="#teacher17824"
                                       class="button button-border-white">Подробнее</a>
                                </div>
                            </div>
                        </div>
                                            <div class="swiper-slide">
                            <div class="swiper-slide__pic">
                                <img loading="lazy" src="img/teachers/yaroslav-koryakov.png" alt="">
                                <div class="swiper-slide__content">
                                    <h3 class="size-20 mb-10">
                                        Ярослав Коряков                                    </h3>
                                    <p class="text-white-70 mb-10">
                                        Психотерапевт, тренинговый аналитик и супервизор Европейской конфедерации психоаналитической психотерапии, преподаватель высшей школы.                                    </p>
                                    <a href="#" data-popup="#teacher17825"
                                       class="button button-border-white">Подробнее</a>
                                </div>
                            </div>
                        </div>
                                    </div>
                <div class="pagination"></div>
            </div>
            <button type="button" class="swiper-arrow swiper-arrow_next icon"
                    style="--icon: url(img/main-page/icon/icon-arrow.svg)"></button>
        </div>
    </noindex>

      <div class="s13-teachers-block-hg8ap7v1d teachers-block">
        <h2 class="size-48 text-center"><span class="text-white-50"> Каждый модуль ведёт профильный эксперт </span> — специалист, который много лет практикует именно в этом подходе и передаёт самые проверенные и актуальные инструменты</h2>
        <div class="teacher-league__container">
          <div class="teacher-league">
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-1.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-1.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Российская психотерапевтическая лига</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-2.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-2.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Американская психологическая ассоциация</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-3.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-3.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Ассоциация сексологов</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-4.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-4.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Общество Семейных Консультантов и Психотерапевтов</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-5.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-5.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Европейская ассоциация развития психоанализа и терапии</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-6.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-6.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">ICEEFT</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-1.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-1.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Российская психотерапевтическая лига</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-2.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-2.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Американская психологическая ассоциация</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-3.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-3.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Ассоциация сексологов</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-4.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-4.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Общество Семейных Консультантов и Психотерапевтов</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-5.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-5.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Европейская ассоциация развития психоанализа и терапии</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-6.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-6.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">ICEEFT</div>
            </div>
          </div>
          <div class="teacher-league">
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-1.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-1.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Российская психотерапевтическая лига</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-2.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-2.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Американская психологическая ассоциация</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-3.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-3.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Ассоциация сексологов</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-4.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-4.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Общество Семейных Консультантов и Психотерапевтов</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-5.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-5.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Европейская ассоциация развития психоанализа и терапии</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-6.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-6.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">ICEEFT</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-1.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-1.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Российская психотерапевтическая лига</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-2.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-2.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Американская психологическая асоциация</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-3.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-3.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Ассоциация сексологов</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-4.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-4.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Общество Семейных Консультантов и Психотерапевтов</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-5.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-5.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Европейская ассоциация развития психоанализа и терапии</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="img/psy-v3/league-6.webp" type="image/webp" />
                  <img loading="lazy" src="img/psy-v3/league-6.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">ICEEFT</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"text","label":"Заголовок"},{"field":"description","type":"textarea","label":"Описание"},{"field":"teachers","type":"repeater","label":"Преподаватели","fields":[{"field":"name","type":"text","label":"Имя"},{"field":"bio","type":"textarea","label":"Описание"},{"field":"photo","type":"image","label":"Фото"}]}]'::jsonb,
  '{"is_dark_section":true}'::jsonb,
  17,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'diplomas_certificates',
  'Дипломы и сертификаты',
  'Дипломы и гарантии',
  'Блок с фото дипломов, описание аккредитации',
  '  <section class="section s2">
    <div class="container-main">
      <h2 class="size-48 text-center mb-60 font-Atyp fw-500">
        <span class="span-grey">Научим работать с</span> популярными <br />
        запросами <span class="span-grey">клиентов</span>
      </h2>
      <div class="s2-top">
        <div class="s2-left">
          <ul class="s1-card__list s2-card__list s2-card__list-hg8ap7v1d">
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Стресс, тревога и выгорание
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Проблемы в отношениях
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Буллинг и харассмент
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Проблемы адаптации
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Непринятие себя
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Профессиональное выгорание
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Решение конфликтов
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Отсутствие личных границ
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Травмы и потери
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Возрастные кризисы
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Проблемы подросткового возраста
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Самооценка и уверенность в себе
            </li>
          </ul>
        </div>
        <picture>
          <source srcset="img/psy-v3/s2-1-hg8ap7v1d.webp" type="image/webp" />
          <img src="img/psy-v3/s2-1-hg8ap7v1d.jpg" alt="" loading="lazy" class="s2-top__img s2-top__img-hg8ap7v1d" />
        </picture>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"text","label":"Заголовок"},{"field":"description","type":"textarea","label":"Описание"},{"field":"diplomas","type":"repeater","label":"Дипломы","fields":[{"field":"title","type":"text","label":"Название"},{"field":"image","type":"image","label":"Изображение"}]}]'::jsonb,
  '{}'::jsonb,
  18,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'fundamental_program',
  'Фундаментальная программа',
  'Программа',
  '«Вас ждёт фундаментальная и глубокая программа» — видео + описание',
  '  <section class="section">
    <div class="container-main">
      <form data-target="axFormRequest" class="form-get-hg8ap7v1d form-get form-get_new form-get_inherit ajaxForm">
        <div class="form-get__start form-get__start_between">
          <div>
            <h3 class="size-32 size-26-mobile line-h-1-2 fw-600 font-manrope mb-20 letter-1"><span class="color-black-50">Получите</span> гайд<br> по профессии<br class="m-only-hg8ap7v1d"> <span class="color-black-50">психолог-<br class="m-only-hg8ap7v1d">консультант</span></h3>
          </div>
          <div>
            <picture>
              <source srcset="img/psy-v3/books-hg8ap7v1d.webp" type="image/webp" />
              <img src="img/psy-v3/books-hg8ap7v1d.png" alt="" loading="lazy" class="form-img-hg8ap7v1d" />
            </picture>
          </div>
        </div>
        <div class="form-get__main">
          <div class="form-item">
            <input type="text" class="input input-light" required="" name="Name" placeholder="Ваше имя" />
          </div>
          <div class="form-item">
            <input type="tel" class="input input-light" required="" name="Phone" placeholder="Номер телефона" />
          </div>
          <div class="form-item">
            <input type="text" class="input input-light" required="" name="Email" placeholder="Почта" />
          </div>
          <noindex>
        <div class="agreed__block agreed footer-agreed">
        <input type="checkbox" name="form_agreed" required class="agreed__checkbox checkbox-required" id="user_confirmed_92234218379538">
        <label class="agreed_label error-check checkbox-off" for="user_confirmed_92234218379538"></label>

        <div class="agreed_message">
            <span class="agreed__text">
                Отправляя данную форму, вы соглашаетесь с условиями <a class="agreed__link" href="https://talentsy.ru/legal/oferta/">оферты</a> и <a class="agreed__link" href="https://talentsy.ru/legal/policy/">политики обработки персональных данных</a>. Я даю свое согласие на <a class="agreed__link" href="https://talentsy.ru/legal/pd-agreement/">обработку персональных данных</a>.
            </span>
            <div class="error_agreed agreed__text">Вам нужно принять политику конфиденциальности</div>
        </div>
    </div>

        <div class="agreed__block agreed footer-agreed">
        <input type="hidden" name="form_agreed_2" value="nosms">
        <input type="checkbox" name="form_agreed_2" class="agreed__checkbox" value="sms" id="user_confirmed_32521130651932">
        <label class="agreed_label unreq checkbox-off" for="user_confirmed_32521130651932"></label>

        <div class="agreed_message">
            <span class="agreed__text">
                Я даю свое <a href="https://talentsy.ru/legal/mailing-agreement/" class="agreed__link">согласие</a> на получение рекламных и информационных рассылок.
            </span>
            <div class="error_agreed agreed__text" style="display: none;">Вам нужно выдать согласие</div>
        </div>
    </div>
</noindex>          <div class="form-grid">
            <button type="submit" class="button h-62 button-main button-purple">Получить гайд</button>
          </div>
        </div>
      </form>
    </div>
  </section>',
  '[{"field":"title","type":"textarea","label":"Заголовок"},{"field":"description","type":"textarea","label":"Описание"},{"field":"video_url","type":"text","label":"URL видео"},{"field":"features","type":"repeater","label":"Особенности","fields":[{"field":"text","type":"text","label":"Текст"}]}]'::jsonb,
  '{}'::jsonb,
  19,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'psychfak_students',
  'Выпускники психфаков',
  'Социальное доказательство',
  '«Часть наших студентов — выпускники психфаков»',
  '  <section class="section s27-hg8ap7v1d">
    <div class="container-main">
      <div class="flex-block mb-40">
        <div class="flex-column flex-column_10 flex-column_pic mt-20-m">
          <video playsinline autoplay="" loop="" muted="" class="mb-20">
            <data-src src="https://talentsy.ruhttps://talentsy.ru/wp-content/themes/talentsy/img/video/rikel-mgu-shorts.mp4?shorts=true" type="video/mp4"></data-src>
          </video>
          <p class="size-16" style="padding-left: 2px">Александр Рикель, <span class="text-black-50">зам. декана факультета психологии МГУ</span></p>
        </div>
        <div class="flex-column flex-column_10">
          <h2 class="size-48 mb-40">
            <span class="text-gray-3">Вас ждёт</span> фундаментальная <span class="nowrap">и глубокая</span> программа
            <span class="text-gray-3">обучения как в хорошем ВУЗе</span>
          </h2>
          <p class="size-20">Только современная, живая и <span class="fw-600">полностью ориентированная на практику,</span> чтобы вы действительно научились помогать</p>
        </div>
      </div>
      <div class="s27-bottom-hg8ap7v1d">
        <p class="s27-bottom-title-hg8ap7v1d">Часть наших студентов — выпускники психфаков</p>
        <p class="s27-bottom-text-hg8ap7v1d">Они пришли к нам за тем, чего им не хватило в ВУЗе: <span>живой практики и готовности уверенно выходить к клиентам</span></p>
      </div>
      <div class="s27-block-hg8ap7v1d flex-block flex-block_three block-gray block-gray_main relative" style="margin-left: 0; margin-right: 0">
        <div class="flex-column flex-column_10">
          <div class="landing-element">
            <div class="size-64 mb-20 font-Atyp">450 ч.</div>
            <p class="size-16">Практических занятий и семинаров</p>
          </div>
        </div>
        <div class="flex-column flex-column_10">
          <div class="landing-element">
            <div class="size-64 mb-20 font-Atyp">12</div>
            <p class="size-16">Месяцев обучения</p>
          </div>
        </div>
        <div class="flex-column flex-column_10">
          <div class="landing-element">
            <div class="size-64 mb-20 font-Atyp">250</div>
            <p class="size-16">Видеолекций</p>
          </div>
        </div>
        <div class="flex-column flex-column_10">
          <div class="landing-element">
            <div class="size-64 mb-20 font-Atyp">100+</div>
            <p class="size-16">Полезных материалов: шаблонов, схем, гайдов, чтобы вы быстрее пришли к результату</p>
          </div>
        </div>
        <div class="flex-column flex-column_10">
          <div class="landing-element">
            <div class="size-64 mb-20 font-Atyp">1 200 ч.</div>
            <p class="size-16">Насыщенной учебной программы. Лекции, практики, обратная связь от наставника, домашние задания на отработку навыков</p>
          </div>
        </div>
        <div class="flex-column flex-column_10 s27-block-gray-hg8ap7v1d">
          <div class="landing-element">
            <div class="size-64 mb-20 font-Atyp">
              <svg class="s27-icon-1-hg8ap7v1d" width="42" height="39" viewBox="0 0 42 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0.791466C0 0.42407 0.382964 0.182136 0.714748 0.339931L20.7853 9.88537C20.9211 9.94999 21.0789 9.94999 21.2147 9.88537L41.2853 0.339931C41.617 0.182136 42 0.424069 42 0.791465V6.69663C42 6.88957 41.889 7.0653 41.7147 7.14816L21.2147 16.8979C21.0789 16.9625 20.9211 16.9625 20.7853 16.8979L0.285253 7.14817C0.111013 7.0653 0 6.88957 0 6.69663V0.791466Z" fill="#F6F6F6" />
                <path d="M0 11.7915C0 11.4241 0.382964 11.1821 0.714748 11.3399L20.7853 20.8854C20.9211 20.95 21.0789 20.95 21.2147 20.8854L41.2853 11.3399C41.617 11.1821 42 11.4241 42 11.7915V17.6966C42 17.8896 41.889 18.0653 41.7147 18.1482L21.2147 27.8979C21.0789 27.9625 20.9211 27.9625 20.7853 27.8979L0.285253 18.1482C0.111013 18.0653 0 17.8896 0 17.6966V11.7915Z" fill="#004A99" />
                <path d="M0 22.7915C0 22.4241 0.382964 22.1821 0.714748 22.3399L20.7853 31.8854C20.9211 31.95 21.0789 31.95 21.2147 31.8854L41.2853 22.3399C41.617 22.1821 42 22.4241 42 22.7915V28.6966C42 28.8896 41.889 29.0653 41.7147 29.1482L21.2147 38.8979C21.0789 38.9625 20.9211 38.9625 20.7853 38.8979L0.285253 29.1482C0.111013 29.0653 0 28.8896 0 28.6966V22.7915Z" fill="#E10007" />
              </svg>
              <svg class="s27-icon-2-hg8ap7v1d" width="136" height="38" viewBox="0 0 136 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.696 3.936H21.936C26.672 3.936 30.544 5.328 33.552 8.112C36.592 10.864 38.112 14.4 38.112 18.72C38.112 23.04 36.592 26.592 33.552 29.376C30.544 32.128 26.672 33.504 21.936 33.504H21.696V37.44H16.416V33.504H16.176C11.44 33.504 7.552 32.128 4.512 29.376C1.504 26.592 0 23.04 0 18.72C0 14.4 1.504 10.864 4.512 8.112C7.552 5.328 11.44 3.936 16.176 3.936H16.416V0H21.696V3.936ZM16.176 28.752H16.416V8.688H16.176C12.976 8.688 10.368 9.616 8.352 11.472C6.336 13.328 5.328 15.744 5.328 18.72C5.328 21.664 6.336 24.08 8.352 25.968C10.368 27.824 12.976 28.752 16.176 28.752ZM21.696 28.752H21.936C25.136 28.752 27.744 27.824 29.76 25.968C31.808 24.08 32.832 21.664 32.832 18.72C32.832 15.744 31.824 13.328 29.808 11.472C27.792 9.616 25.168 8.688 21.936 8.688H21.696V28.752Z" fill="#F6F6F6" />
                <path d="M48.1474 35.52H42.8194V1.92H64.3234V6.672H48.1474V35.52Z" fill="#F6F6F6" />
                <path d="M69.3994 31.008C66.0394 27.68 64.3594 23.584 64.3594 18.72C64.3594 13.856 66.0394 9.76 69.3994 6.432C72.7914 3.104 76.9674 1.44 81.9274 1.44C86.8554 1.44 90.9994 3.104 94.3594 6.432C97.7514 9.76 99.4474 13.856 99.4474 18.72C99.4474 23.584 97.7514 27.68 94.3594 31.008C90.9994 34.336 86.8554 36 81.9274 36C76.9674 36 72.7914 34.336 69.3994 31.008ZM73.2874 9.936C70.9834 12.304 69.8314 15.232 69.8314 18.72C69.8314 22.208 70.9834 25.152 73.2874 27.552C75.6234 29.92 78.5034 31.104 81.9274 31.104C85.3514 31.104 88.2154 29.92 90.5194 27.552C92.8234 25.152 93.9754 22.208 93.9754 18.72C93.9754 15.232 92.8234 12.304 90.5194 9.936C88.2154 7.536 85.3514 6.336 81.9274 6.336C78.5034 6.336 75.6234 7.536 73.2874 9.936Z" fill="#F6F6F6" />
                <path d="M107.978 31.008C104.618 27.68 102.938 23.584 102.938 18.72C102.938 13.856 104.618 9.76 107.978 6.432C111.369 3.104 115.546 1.44 120.506 1.44C124.09 1.44 127.258 2.384 130.01 4.272C132.762 6.128 134.762 8.432 136.01 11.184L131.113 13.104C130.153 11.088 128.729 9.456 126.841 8.208C124.986 6.96 122.874 6.336 120.506 6.336C117.081 6.336 114.201 7.536 111.866 9.936C109.562 12.304 108.41 15.232 108.41 18.72C108.41 22.208 109.562 25.152 111.866 27.552C114.201 29.92 117.081 31.104 120.506 31.104C122.874 31.104 124.986 30.48 126.841 29.232C128.729 27.984 130.153 26.352 131.113 24.336L136.01 26.256C134.762 29.008 132.762 31.328 130.01 33.216C127.258 35.072 124.09 36 120.506 36C115.546 36 111.369 34.336 107.978 31.008Z" fill="#F6F6F6" />
              </svg>
            </div>
            <p class="size-16">Программа разработана на основе ФГОС ВО 370301 «Психология», и соответствует профессиональным стандартам</p>
          </div>
        </div>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"textarea","label":"Заголовок"},{"field":"description","type":"textarea","label":"Описание"},{"field":"items","type":"repeater","label":"Пункты","fields":[{"field":"text","type":"text","label":"Текст"}]}]'::jsonb,
  '{}'::jsonb,
  20,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'curriculum',
  'Программа обучения',
  'Программа',
  'Аккордеон с модулями программы (раскрывающиеся блоки)',
  '  <section class="s21-hg8ap7v1d section section-program pt-0" id="program">
    <div class="container-main">
      <div class="s21-wrapper-hg8ap7v1d block-gray block-gray_main">
        <h2 class="size-48 mb-40">Программа обучения</h2>
        <div class="accordion accordion-program">
                            <div class="accordion-item">
                    <div class="accordion-head">
                        <h3 class="size-20 fw-600"><span
                                    class="accordion-head__module">Модуль 1</span>Введение в профессию психолог-консультант                        </h3>
                        <div class="icon accordion-icon"
                             style="    --icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                    </div>
                    <div class="accordion-content" style="height: 0;">
                        <div class="accordion-content__block">
                            <h3>Что вы будете изучать:</h3>
<ul role="list">
<li>Профессиональное понимание: кто такой психолог-консультант и чем он отличается от других специалистов</li>
<li>Исследование своей личности: изучение своих эмоций, потребностей, ценностей, убеждений</li>
<li>Качества психолога: осознанность и эмпатия — как их развивать</li>
<li>Личные границы в общении и работе</li>
<li>Я-концепция: как понимание себя влияет на работу с клиентами</li>
<li>Этические принципы и профессиональная позиция</li>
</ul>
<h3>Практическая польза:</h3>
<ul role="list">
<li>Развитие мышления психолога-консультанта — учитесь смотреть на людей и ситуации профессионально</li>
<li>Формирование чувствительности к себе и другим — основа эмпатии</li>
<li>Глубокое самопознание — исследование своих эмоций, границ, убеждений</li>
<li>Понимание профессиональной идентичности — кто вы как будущий психолог</li>
</ul>
                        </div>
                    </div>
                </div>
                            <div class="accordion-item">
                    <div class="accordion-head">
                        <h3 class="size-20 fw-600"><span
                                    class="accordion-head__module">Модуль 2</span>Общая психология                        </h3>
                        <div class="icon accordion-icon"
                             style="    --icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                    </div>
                    <div class="accordion-content" style="height: 0;">
                        <div class="accordion-content__block">
                            <h3>Что вы будете изучать:</h3>
<ul role="list">
<li>Основные психические процессы: ощущение, восприятие, внимание</li>
<li>Психология памяти и мышления — как мы запоминаем и обрабатываем информацию</li>
<li>Эмоции и чувства — механизмы их возникновения и влияние на поведение</li>
<li>Мотивация и воля — что движет человеком</li>
<li>Способности и одарённость</li>
<li>Психические состояния и саморегуляция</li>
<li>Сознание и бессознательное</li>
</ul>
<h3>Практическая польза:</h3>
<ul role="list">
<li>Научное понимание работы психики клиента</li>
<li>Профессиональный язык для объяснения поведения</li>
<li>Основа для диагностики психических процессов</li>
<li>Развеивание мифов о работе психики</li>
</ul>
                        </div>
                    </div>
                </div>
                            <div class="accordion-item">
                    <div class="accordion-head">
                        <h3 class="size-20 fw-600"><span
                                    class="accordion-head__module">Модуль 3</span>Психология стресса                        </h3>
                        <div class="icon accordion-icon"
                             style="    --icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                    </div>
                    <div class="accordion-content" style="height: 0;">
                        <div class="accordion-content__block">
                            <h3>Что вы будете изучать:</h3>
<ul role="list">
<li>Механизмы возникновения и развития стресса</li>
<li>Психофизиология стресса — что происходит в организме</li>
<li>Диагностика стресса у себя и клиента</li>
<li>Конкретные техники профилактики и коррекции стресса</li>
<li>Хронический стресс и эмоциональное выгорание</li>
<li>Ресурсы для восстановления</li>
</ul>
<h3>Практическая польза:</h3>
<ul role="list">
<li>Практические техники для работы со стрессом</li>
<li>Навыки самопомощи и профилактики выгорания</li>
<li>Инструменты диагностики стрессовых состояний</li>
<li>Готовность к одному из самых частых запросов</li>
</ul>
                        </div>
                    </div>
                </div>
                            <div class="accordion-item">
                    <div class="accordion-head">
                        <h3 class="size-20 fw-600"><span
                                    class="accordion-head__module">Модуль 4</span>Основы психологического консультирования                        </h3>
                        <div class="icon accordion-icon"
                             style="    --icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                    </div>
                    <div class="accordion-content" style="height: 0;">
                        <div class="accordion-content__block">
                            <p><strong>Что вы будете изучать:</strong></p>
<ul role="list">
<li>Профессиональная позиция и этика в консультировании</li>
<li>Структура консультации — от знакомства до завершения</li>
<li>Терапевтический альянс — как создать доверительные отношения</li>
<li>Техники активного слушания — основа всей работы психолога</li>
<li>Работа с запросом — как понять, чего действительно хочет клиент</li>
<li>Выдвижение и проверка гипотез о проблеме клиента</li>
<li>38 универсальных техник консультирования</li>
<li>Завершение консультации и оценка изменений</li>
</ul>
<p><strong>Практическая польза:</strong></p>
<ul role="list">
<li>Структурированный подход к ведению консультации</li>
<li>Конкретные техники для каждого этапа работы</li>
<li>Навыки профессионального общения</li>
<li>Умение работать с сопротивлением клиента</li>
</ul>
                        </div>
                    </div>
                </div>
                            <div class="accordion-item">
                    <div class="accordion-head">
                        <h3 class="size-20 fw-600"><span
                                    class="accordion-head__module">Модуль 5</span>Практикум по психологическому консультированию                        </h3>
                        <div class="icon accordion-icon"
                             style="    --icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                    </div>
                    <div class="accordion-content" style="height: 0;">
                        <div class="accordion-content__block">
                            <p><strong>Что вы будете изучать:</strong></p>
<ul role="list">
<li>Проведение первичной консультации</li>
<li>Проведение повторной консультации</li>
<li>Анализ консультации и планирование дальнейших шагов</li>
<li>Оценка эффективности работы психолога</li>
<li>Сохранение этики и профессиональной позиции</li>
<li>Разбор ошибок и удачных действий</li>
</ul>
<p><strong> Практическая польза:</strong></p>
<ul role="list">
<li>Вы провели первые учебные консультации и приобрели уверенность в общении с клиентом</li>
<li>Понимание своих сильных сторон и зон роста</li>
<li>Кейсы других участников в вашей копилке</li>
<li>Поддержка группы и супервизора</li>
</ul>
                        </div>
                    </div>
                </div>
                            <div class="accordion-item">
                    <div class="accordion-head">
                        <h3 class="size-20 fw-600"><span
                                    class="accordion-head__module">Модуль 6</span>Психодиагностика личности                        </h3>
                        <div class="icon accordion-icon"
                             style="    --icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                    </div>
                    <div class="accordion-content" style="height: 0;">
                        <div class="accordion-content__block">
                            <p><strong>Что вы будете изучать:</strong></p>
<ul role="list">
<li>Основы психодиагностики и правила работы с методиками</li>
<li>Диагностика личности, способностей и ресурсов</li>
<li>Практическая психодиагностика — как выбирать и применять методики</li>
<li>Интерпретация результатов и их использование в консультировании</li>
<li>Диагностика жизнестойкости и психологических ресурсов</li>
<li>Этические аспекты психодиагностики</li>
</ul>
<p><strong> Практическая польза:</strong></p>
<ul role="list">
<li>Профессиональные инструменты анализа личности</li>
<li>Навыки выбора подходящих методик</li>
<li>Умение интерпретировать результаты тестирования</li>
<li>Понимание ограничений диагностических методов</li>
</ul>
                        </div>
                    </div>
                </div>
                            <div class="accordion-item">
                    <div class="accordion-head">
                        <h3 class="size-20 fw-600"><span
                                    class="accordion-head__module">Модуль 7</span>Возрастная психология                        </h3>
                        <div class="icon accordion-icon"
                             style="    --icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                    </div>
                    <div class="accordion-content" style="height: 0;">
                        <div class="accordion-content__block">
                            <h3>Что вы будете изучать:</h3>
<ul role="list">
<li>Психология развития от младенчества до старости</li>
<li>Возрастные кризисы и их особенности</li>
<li>Консультирование подростков и их родителей</li>
<li>Особенности работы с взрослыми клиентами</li>
<li>Психология мужчины и женщины на разных этапах жизни</li>
<li>Особенности консультирования зрелых клиентов</li>
</ul>
<h3>Практическая польза:</h3>
<ul role="list">
<li>Понимание возрастных норм и особенностей</li>
<li>Навыки работы с разными возрастными группами</li>
<li>Понимание возрастных кризисов</li>
</ul>
                        </div>
                    </div>
                </div>
                            <div class="accordion-item">
                    <div class="accordion-head">
                        <h3 class="size-20 fw-600"><span
                                    class="accordion-head__module">Модуль 8</span>Современные подходы к психологическому консультированию                        </h3>
                        <div class="icon accordion-icon"
                             style="    --icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                    </div>
                    <div class="accordion-content" style="height: 0;">
                        <div class="accordion-content__block">
                            <h3> Что изучают 9 подходов:</h3>
<ol role="list">
<li>Психоаналитический подход — работа с бессознательным и детскими сценариями</li>
<li>Гештальт-подход — осознавание здесь и сейчас, завершение незавершённых ситуаций</li>
<li>Клиент-центрированный подход — создание безопасного принимающего пространства</li>
<li>Экзистенциальный подход — работа со смыслами, ценностями и экзистенциальными вопросами</li>
<li>КПТ (когнитивно-поведенческий) — работа с мыслями, убеждениями и поведением</li>
<li>Коучинг — достижение целей и краткосрочная фокусная терапия</li>
<li>ОРКТ — краткосрочный подход, ориентированный на поддержку и мотивацию к результату</li>
<li>Телесно-ориентированный подход — работа через тело и ощущения</li>
<li>Арт-терапия — использование творчества и метафорических карт</li>
</ol>
<h3>Практическая польза:</h3>
<ul role="list">
<li>88+ конкретных техник из разных подходов</li>
<li>Понимание, когда какой подход использовать</li>
<li>Возможность найти свой стиль работы</li>
<li>Широкий инструментарий для любых запросов</li>
</ul>
                        </div>
                    </div>
                </div>
                            <div class="accordion-item">
                    <div class="accordion-head">
                        <h3 class="size-20 fw-600"><span
                                    class="accordion-head__module">Модуль 9</span>Работа с часто встречающимися запросами                        </h3>
                        <div class="icon accordion-icon"
                             style="    --icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                    </div>
                    <div class="accordion-content" style="height: 0;">
                        <div class="accordion-content__block">
                            <h3>Что вы будете изучать:<br />
Техники и рекомендации для работы с частыми запросами:</h3>
<ul>
<li style="list-style-type: none;">
<ul role="list">
<li>Тревога</li>
<li>Сложные эмоции (обида, вина, стыд)</li>
<li>Отношения с близкими</li>
<li>«Отношения» с деньгами</li>
<li>Самооценка</li>
<li>Поиск себя и самореализация</li>
</ul>
</li>
</ul>
<h3>Практическая польза:</h3>
<ul role="list">
<li>Алгоритмы и техники под конкретный запрос</li>
<li>Понимание, чем отличаются разные подходы к решению одной и той же проблемы</li>
<li>Уверенность в работе с клиентами</li>
</ul>
                        </div>
                    </div>
                </div>
                            <div class="accordion-item">
                    <div class="accordion-head">
                        <h3 class="size-20 fw-600"><span
                                    class="accordion-head__module">Модуль 10</span>Психология семьи и сексуальности                        </h3>
                        <div class="icon accordion-icon"
                             style="    --icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                    </div>
                    <div class="accordion-content" style="height: 0;">
                        <div class="accordion-content__block">
                            <h3>Что вы будете изучать:</h3>
<ul role="list">
<li>Семья как система, структура семьи</li>
<li>Жизненный цикл семьи и семейные кризисы</li>
<li>Детско-родительские отношения</li>
<li>Эмоционально-фокусированная терапия для пар</li>
<li>Биопсихосоциальная модель сексуальности</li>
<li>Мужская и женская сексуальность</li>
<li>Сексуальные дисфункции и психологическая помощь</li>
</ul>
<h3>Практическая польза:</h3>
<ul role="list">
<li>Навыки работы с парами и семьями</li>
<li>Понимание системной динамики отношений</li>
<li>Деликатная работа с интимными темами</li>
<li>Консультирование родителей по воспитанию детей</li>
<li>Консультирование в детско-родительских отношениях</li>
</ul>
                        </div>
                    </div>
                </div>
                            <div class="accordion-item">
                    <div class="accordion-head">
                        <h3 class="size-20 fw-600"><span
                                    class="accordion-head__module">Модуль 11</span>Мозг и поведение человека                        </h3>
                        <div class="icon accordion-icon"
                             style="    --icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                    </div>
                    <div class="accordion-content" style="height: 0;">
                        <div class="accordion-content__block">
                            <p><strong>Что вы будете изучать:</strong></p>
<ul role="list">
<li>Биологические основы психики</li>
<li>Отделы головного мозга и их функции</li>
<li>Работа нейромедиаторов</li>
<li>Нейронные механизмы памяти</li>
<li>Особенности нервной системы в разном возрасте</li>
</ul>
<p><strong> Практическая польза:</strong></p>
<ul role="list">
<li>Научное понимание поведения клиентов</li>
<li>Объяснение психосоматических реакций</li>
<li>Понимание ограничений «силы воли»</li>
<li>Работа с биологическими аспектами проблем</li>
</ul>
                        </div>
                    </div>
                </div>
                            <div class="accordion-item">
                    <div class="accordion-head">
                        <h3 class="size-20 fw-600"><span
                                    class="accordion-head__module">Модуль 12</span>Психология болезни и психосоматика                        </h3>
                        <div class="icon accordion-icon"
                             style="    --icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                    </div>
                    <div class="accordion-content" style="height: 0;">
                        <div class="accordion-content__block">
                            <p><strong>Что вы будете изучать:</strong></p>
<ul role="list">
<li>Научно-обоснованные теории психосоматики</li>
<li>Внутренняя картина болезни и типы отношения к болезни и лечению</li>
<li>Основы психологической помощи при соматических заболеваниях</li>
</ul>
<p><strong> Практическая польза:</strong></p>
<ul role="list">
<li>Понимание психосоматических проявлений</li>
<li>Понимание психологии болеющего</li>
<li>Умение распознать деструктивное отношение к болезни и помочь на пути к выздоровлению</li>
</ul>
                        </div>
                    </div>
                </div>
                            <div class="accordion-item">
                    <div class="accordion-head">
                        <h3 class="size-20 fw-600"><span
                                    class="accordion-head__module">Модуль 13</span>Психология кризисных ситуаций                        </h3>
                        <div class="icon accordion-icon"
                             style="    --icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                    </div>
                    <div class="accordion-content" style="height: 0;">
                        <div class="accordion-content__block">
                            <p><strong>Что вы будете изучать:</strong></p>
<ul role="list">
<li>Экстремальные ситуации и экстренная помощь</li>
<li>Посттравматическое стрессовое расстройство</li>
<li>Психологический кризис и кризисная интервенция</li>
<li>Эмоциональное выгорание: диагностика и профилактика</li>
</ul>
<p><strong> Практическая польза:</strong></p>
<ul role="list">
<li>Навыки кризисной поддержки</li>
<li>Работа с травматическим опытом</li>
<li>Техники стабилизации состояния</li>
<li>Профилактика собственного выгорания</li>
</ul>
                        </div>
                    </div>
                </div>
                            <div class="accordion-item">
                    <div class="accordion-head">
                        <h3 class="size-20 fw-600"><span
                                    class="accordion-head__module">Модуль 14</span>Начало практики консультирующего психолога                        </h3>
                        <div class="icon accordion-icon"
                             style="    --icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                    </div>
                    <div class="accordion-content" style="height: 0;">
                        <div class="accordion-content__block">
                            <p><strong>Что вы будете изучать:</strong></p>
<ul role="list">
<li>Форматы работы психолога</li>
<li>Поиск и привлечение клиентов</li>
<li>Юридическое оформление практики</li>
<li>Доступ в сервис консультирования</li>
<li>Карьерные пути в психологии</li>
</ul>
<p><strong> Практическая польза:</strong></p>
<ul role="list">
<li>Реальная практика консультирования</li>
<li>Преодоление страха первой консультации</li>
<li>Навыки организации практики</li>
<li>Формирование профессионального сообщества</li>
</ul>
                        </div>
                    </div>
                </div>
                    </div>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"text","label":"Заголовок"},{"field":"modules","type":"repeater","label":"Модули","fields":[{"field":"title","type":"text","label":"Название модуля"},{"field":"lessons","type":"textarea","label":"Список уроков"}]}]'::jsonb,
  '{"section_id":"program"}'::jsonb,
  21,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'employment_support',
  'Трудоустройство',
  'Карьера и заработок',
  '«Поддержка в трудоустройстве» — 10 гарантированных обращений',
  '  <section class="section pt-0">
    <div class="container-main">
      <form data-target="axFormRequest" class="form-get form-get_inherit ajaxForm">
        <div class="form-get__start form-get__start_between">
          <div>
            <h3 class="size-32 size-30-mobile line-h-1-2 fw-600 font-manrope mb-20 letter-1">
              Получите консультацию
              по программе обучения
            </h3>
            <p class="size-20 mb-20">Оставьте свои контакты, и наш специалист свяжется с вами, отправит подробную программу обучения и ответит на все вопросы</p>
          </div>
          <div class="price-guide price-guide-hg8ap7v1d">
            <div class="price-guide__pic price-guide__pic-hg8ap7v1d">
              <picture>
                <source srcset="img/psy-v3/form-img-hg8ap7v1d.webp" type="image/webp" />
                <img src="img/psy-v3/form-img-hg8ap7v1d.png" alt="" width="64" height="64" loading="lazy" />
              </picture>
            </div>
            <div class="price-guide__content size-16 fw-500">
              Психологическое реалити-шоу<br />
              «Детектор личности» <b>в подарок</b>
            </div>
          </div>
        </div>
        <div class="form-get__main">
          <div class="form-item">
            <input type="text" class="input input-light" required="" name="Name" placeholder="Ваше имя" />
          </div>
          <div class="form-item">
            <input type="tel" class="input input-light" required="" name="Phone" placeholder="Номер телефона" />
          </div>
          <div class="form-item">
            <input type="text" class="input input-light" required="" name="Email" placeholder="Почта" />
          </div>
          <button type="submit" class="form-button-hg8ap7v1d button h-62 button-main button-purple">Получить консультацию</button>
          <noindex>
        <div class="agreed__block agreed footer-agreed">
        <input type="checkbox" name="form_agreed" required class="agreed__checkbox checkbox-required" id="user_confirmed_4774170039243">
        <label class="agreed_label error-check checkbox-off" for="user_confirmed_4774170039243"></label>

        <div class="agreed_message">
            <span class="agreed__text">
                Отправляя данную форму, вы соглашаетесь с условиями <a class="agreed__link" href="https://talentsy.ru/legal/oferta/">оферты</a> и <a class="agreed__link" href="https://talentsy.ru/legal/policy/">политики обработки персональных данных</a>. Я даю свое согласие на <a class="agreed__link" href="https://talentsy.ru/legal/pd-agreement/">обработку персональных данных</a>.
            </span>
            <div class="error_agreed agreed__text">Вам нужно принять политику конфиденциальности</div>
        </div>
    </div>

        <div class="agreed__block agreed footer-agreed">
        <input type="hidden" name="form_agreed_2" value="nosms">
        <input type="checkbox" name="form_agreed_2" class="agreed__checkbox" value="sms" id="user_confirmed_21600236124615">
        <label class="agreed_label unreq checkbox-off" for="user_confirmed_21600236124615"></label>

        <div class="agreed_message">
            <span class="agreed__text">
                Я даю свое <a href="https://talentsy.ru/legal/mailing-agreement/" class="agreed__link">согласие</a> на получение рекламных и информационных рассылок.
            </span>
            <div class="error_agreed agreed__text" style="display: none;">Вам нужно выдать согласие</div>
        </div>
    </div>
</noindex>        </div>
      </form>
    </div>
  </section>',
  '[{"field":"title","type":"textarea","label":"Заголовок"},{"field":"description","type":"textarea","label":"Описание"},{"field":"features","type":"repeater","label":"Пункты","fields":[{"field":"text","type":"textarea","label":"Текст"}]}]'::jsonb,
  '{}'::jsonb,
  22,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'student_care',
  'Забота о студентах',
  'Поддержка',
  '«Заботимся о вас в процессе обучения» — карточки поддержки',
  '  <section class="s1 s1-2-hg8ap7v1d section pt-0">
    <div class="container-main">
      <h2 class="size-48 font-Atyp fw-500 line-h-1-1 mb-30">Заботимся о вас в процессе обучения, чтобы <span class="color-black-50">вы могли заботиться о своих близких, клиентах</span> и успешно реализоваться в профессии</h2>
      <div class="s1-grid s1-2-grid-hg8ap7v1d d-only-grid-hg8ap7v1d">
        <div class="s1-card">
          <div class="s1-card-wrapper-hg8ap7v1d">
            <h3 class="s1-card__title s1-card__title">
              Опытные наставники<br />
              и преподаватели
            </h3>
            <picture>
              <source srcset="img/psy-v3/s1-1.webp" type="image/webp" />
              <img src="img/psy-v3/s1-1.png" alt="" loading="lazy" class="s1-card__img" />
            </picture>
          </div>
          <ul class="s1-card__list">
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Ответят на ваши вопросы и предоставят обратную связь по домашним заданиям
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              На практических онлайн-занятиях раскроют сложные темы
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Организуют пространство для практики
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Помогут вам применить знания в работе
            </li>
          </ul>
        </div>
        <div class="s1-card">
          <div class="s1-card-wrapper-2-hg8ap7v1d">
            <picture>
              <source srcset="img/psy-v3/s1-2.webp" type="image/webp" />
              <img src="img/psy-v3/s1-2.png" alt="" loading="lazy" class="s1-card__img" />
            </picture>
            <h3 class="s1-card__title">
              Мастер группы - опытный<br />
              практикующий психолог
            </h3>
          </div>
          <ul class="s1-card__list">
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Проведет вас через весь курс, обеспечивая поддержку и развитие
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Будет делиться опытом и давать конструктивную обратную связь
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Поможет вам раскрыть свой потенциал и достичь профессиональных целей
            </li>
          </ul>
        </div>
        <div class="s1-card s1-last-card-hg8ap7v1d">
          <div class="s1-card-wrapper-2-hg8ap7v1d">
            <picture>
              <source srcset="img/psy-v3/s1-3.webp" type="image/webp" />
              <img src="img/psy-v3/s1-3.png" alt="" loading="lazy" class="s1-card__img" />
            </picture>
            <h3 class="s1-card__title">
              Поддержка кураторов<br />
              7 дней в неделю
            </h3>
          </div>
          <ul class="s1-card__list">
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Поможет в решении организационных и технических вопросов
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Окажет помощь в удобное время
            </li>
            <li class="s1-card__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Погрузится в ваш процесс обучения
            </li>
          </ul>
        </div>
      </div>

      <div class="s1-2-swiper-container-hg8ap7v1d m-only-hg8ap7v1d">
        <div class="swiper s1-2-swiper-hg8ap7v1d">
          <div class="s1-grid s1-2-grid-hg8ap7v1d swiper-wrapper">
            <div class="s1-card swiper-slide">
              <div class="s1-card-wrapper-hg8ap7v1d">
                <h3 class="s1-card__title">
                  Опытные наставники<br />
                  и преподаватели
                </h3>
                <picture>
                  <source srcset="img/psy-v3/s1-1.webp" type="image/webp" />
                  <img src="img/psy-v3/s1-1.png" alt="" loading="lazy" class="s1-card__img" />
                </picture>
              </div>
              <ul class="s1-card__list">
                <li class="s1-card__item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Ответят на ваши вопросы и предоставят обратную связь по домашним заданиям
                </li>
                <li class="s1-card__item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  На практических онлайн-занятиях раскроют сложные темы
                </li>
                <li class="s1-card__item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Организуют пространство для практики
                </li>
                <li class="s1-card__item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Помогут вам применить знания в работе
                </li>
              </ul>
            </div>
            <div class="s1-card swiper-slide">
              <div class="s1-card-wrapper-2-hg8ap7v1d">
                <picture>
                  <source srcset="img/psy-v3/s1-2.webp" type="image/webp" />
                  <img src="img/psy-v3/s1-2.png" alt="" loading="lazy" class="s1-card__img" />
                </picture>
                <h3 class="s1-card__title">
                  Мастер группы - опытный<br />
                  практикующий психолог
                </h3>
              </div>
              <ul class="s1-card__list">
                <li class="s1-card__item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Проведет вас через весь курс, обеспечивая поддержку и развитие
                </li>
                <li class="s1-card__item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Будет делиться опытом и давать конструктивную обратную связь
                </li>
                <li class="s1-card__item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Поможет вам раскрыть свой потенциал и достичь профессиональных целей
                </li>
              </ul>
            </div>
            <div class="s1-card s1-last-card-hg8ap7v1d swiper-slide">
              <div class="s1-card-wrapper-2-hg8ap7v1d">
                <picture>
                  <source srcset="img/psy-v3/s1-3.webp" type="image/webp" />
                  <img src="img/psy-v3/s1-3.png" alt="" loading="lazy" class="s1-card__img" />
                </picture>
                <h3 class="s1-card__title">
                  Поддержка кураторов<br />
                  7 дней в неделю
                </h3>
              </div>
              <ul class="s1-card__list">
                <li class="s1-card__item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Поможет в решении организационных и технических вопросов
                </li>
                <li class="s1-card__item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Окажет помощь в удобное время
                </li>
                <li class="s1-card__item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Погрузится в ваш процесс обучения
                </li>
              </ul>
            </div>
          </div>
          <div class="swiper-pagination"></div>
        </div>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"textarea","label":"Заголовок"},{"field":"cards","type":"repeater","label":"Карточки","fields":[{"field":"title","type":"text","label":"Заголовок"},{"field":"text","type":"textarea","label":"Описание"},{"field":"image","type":"image","label":"Изображение"}]}]'::jsonb,
  '{}'::jsonb,
  23,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'social_proof_banner_2',
  'Социальное доказательство 2',
  'Hero и УТП',
  'Повторный баннер со статистикой',
  '  <section class="section s2 s2-2-hg8ap7v1d">
    <div class="container-main">
      <h2 class="size-48 text-center mb-60">
        Применяйте полученные знания<br />
        <span class="color-black-50">для жизни и карьеры</span>
      </h2>
      <div class="grid-column-2 mb-40">
        <picture style="display: block">
          <source srcset="img/psy-v3/girls-hg8ap7v1d.webp" type="image/webp" />
          <img src="img/psy-v3/girls-hg8ap7v1d.png" alt="" loading="lazy" class="s2-2-img-hg8ap7v1d" />
        </picture>
        <div class="get-client-grid get-client-grid-hg8ap7v1d">
          <div class="get-client__item">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
              <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            Лучше пониманйте себя и свои мотивы
          </div>
          <div class="get-client__item">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
              <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            Укрепляйте романтические и семейные отношения
          </div>
          <div class="get-client__item">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
              <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            Разбирайтесь в мыслях и чувствах людей
          </div>
          <div class="get-client__item">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
              <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            Понимайте психологические характеристики окружающих
          </div>
          <div class="get-client__item">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
              <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            Считывайте невербальные сигналы
          </div>
          <div class="get-client__item">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
              <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            Победите синдром самозванца, повысьте свою самооценку
          </div>
          <div class="get-client__item">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
              <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            Выходите из конфликтов без травм
          </div>
          <div class="get-client__item">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
              <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            Повысьте эффективность управления колективом
          </div>
          <div class="get-client__item">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
              <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            Повысте качество личных отношений с близкими и коллегами
          </div>
          <div class="get-client__item">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
              <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            Улучшите свое психоэмоциональное состояние
          </div>
        </div>
      </div>
      <a href="#go-form" class="form-button-hg8ap7v1d button h-62 button-main button-purple button-p-32">Освоить профессию и изменить жизнь</a>
    </div>
  </section>',
  '[{"field":"title","type":"textarea","label":"Заголовок"},{"field":"stats","type":"repeater","label":"Статистики","fields":[{"field":"number","type":"text","label":"Число"},{"field":"text","type":"text","label":"Описание"}]}]'::jsonb,
  '{}'::jsonb,
  24,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'guarantees',
  'Гарантии',
  'Дипломы и гарантии',
  'Блок гарантий (серый фон)',
  '  <section class="s16-hg8ap7v1d section section-grey pt-0">
    <div class="container-main">
      <h2 class="size-43 s16-title-hg8ap7v1d">
        <span class="span-grey">Наши выпускники получают</span> 2 диплома <br />
        <span class="span-1">Российский</span> <span class="s16-nowrap-hg8ap7v1d">и <span class="span-2">Международный</span></span>
      </h2>
      <div class="s16-diploma-block-hg8ap7v1d diploma-block diploma-block-program block-gray">
        <div class="diploma-logo">
          <img loading="lazy" src="img/psy-v3/diploma-logo-1.svg" alt="" />
        </div>
        <div class="diploma-content">
          <div class="diploma-content__top">
            <div class="size-26 mb-16">Диплом о&nbsp;профессиональной переподготовке</div>
            <div class="size-16 mb-16">
              <span class="text-black-65 no-br-mobile">
                и документы о повышении квалификации установленного образца <br />
                РФ, которые мы выдаем на&nbsp;основе лицензии на&nbsp;осуществление образовательной деятельности
              </span>
              №Л035-01298-77/00180063
            </div>
          </div>
          <div class="diploma-deduction">
            <div class="diploma-deduction__percent">–13%</div>
            <div class="diploma-deduction__text size-17 no-br-mobile">
              <span class="text-black-65">Вы можете получить</span> налоговый вычет <br />
              <span class="text-black-65"> на&nbsp;обучение в&nbsp;размере </span> до 13% от суммы курса
            </div>
          </div>
        </div>
        <div class="diploma-pic">
          <picture>
            <source srcset="img/psy-v3/diploma-pic-1.webp" type="image/webp" />
            <img loading="lazy" src="img/psy-v3/diploma-pic-1.jpg" alt="" class="mb-10" />
          </picture>
        </div>
      </div>
      <div class="s16-diploma-block-hg8ap7v1d s16-diploma-block-black-hg8ap7v1d diploma-block diploma-block-black diploma-block-program">
        <div class="diploma-logo">
          <img loading="lazy" src="img/psy-v3/diploma-logo-2.svg" alt="" />
        </div>
        <div class="diploma-content">
          <div class="diploma-content__top">
            <div class="size-26 mb-16">
              Международный<br />
              диплом MBA
            </div>
            <div class="size-16 mb-16"><span class="text-white-70">Open European Academy (г. Прага) в сотрудничестве с Европейской Ассоциацией ВУЗов и преподавателей высшей школы HiSTES,</span>  дающий право ведения деятельности в Евросоюзе и признаваемый во всем мире.</div>
            <div class="size-16 mb-16">
              <p class="mb-12">А также 2 международных сертификата</p>
              <div class="text-white-70 mb-12 flex">
                <svg class="mr-5" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4.17172C12 4.43694 12.1054 4.69129 12.2929 4.87883L13.1212 5.70711C13.3087 5.89464 13.5631 6 13.8283 6H17C17.5523 6 18 6.44772 18 7V11C18 11.5523 17.5523 12 17 12H13.8283C13.5631 12 13.3087 12.1054 13.1212 12.2929L12.2929 13.1212C12.1054 13.3087 12 13.5631 12 13.8283V17C12 17.5523 11.5523 18 11 18H7C6.44772 18 6 17.5523 6 17V13.8283C6 13.5631 5.89464 13.3087 5.70711 13.1212L4.87883 12.2929C4.69129 12.1054 4.43694 12 4.17172 12H1C0.447715 12 0 11.5523 0 11V7C0 6.44772 0.447715 6 1 6H4.17172C4.43694 6 4.69129 5.89464 4.87883 5.70711L5.70711 4.87883C5.89464 4.69129 6 4.43694 6 4.17172V1C6 0.447715 6.44772 0 7 0H11C11.5523 0 12 0.447715 12 1V4.17172Z" fill="#FDCC00" />
                </svg>
                <p>от аккредитующего центра Великобритании <span class="color-white">IPHM</span></p>
              </div>
              <div class="text-white-70 flex">
                <svg class="mr-5" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4.17172C12 4.43694 12.1054 4.69129 12.2929 4.87883L13.1212 5.70711C13.3087 5.89464 13.5631 6 13.8283 6H17C17.5523 6 18 6.44772 18 7V11C18 11.5523 17.5523 12 17 12H13.8283C13.5631 12 13.3087 12.1054 13.1212 12.2929L12.2929 13.1212C12.1054 13.3087 12 13.5631 12 13.8283V17C12 17.5523 11.5523 18 11 18H7C6.44772 18 6 17.5523 6 17V13.8283C6 13.5631 5.89464 13.3087 5.70711 13.1212L4.87883 12.2929C4.69129 12.1054 4.43694 12 4.17172 12H1C0.447715 12 0 11.5523 0 11V7C0 6.44772 0.447715 6 1 6H4.17172C4.43694 6 4.69129 5.89464 4.87883 5.70711L5.70711 4.87883C5.89464 4.69129 6 4.43694 6 4.17172V1C6 0.447715 6.44772 0 7 0H11C11.5523 0 12 0.447715 12 1V4.17172ZM7.82828 6C7.56306 6 7.30871 6.10536 7.12117 6.29289L6.29289 7.12117C6.10536 7.30871 6 7.56306 6 7.82828V10.1717C6 10.4369 6.10536 10.6913 6.29289 10.8788L7.12117 11.7071C7.30871 11.8946 7.56306 12 7.82828 12H10.1717C10.4369 12 10.6913 11.8946 10.8788 11.7071L11.7071 10.8788C11.8946 10.6913 12 10.4369 12 10.1717V7.82828C12 7.56306 11.8946 7.30871 11.7071 7.12117L10.8788 6.29289C10.6913 6.10536 10.4369 6 10.1717 6H7.82828Z" fill="#FDCC00" />
                </svg>
                <p>от аккредитующего центра Великобритании <span class="color-white">CPD</span></p>
              </div>
            </div>
          </div>
        </div>
        <div class="diploma-pic">
          <picture>
            <source srcset="img/main-page/diploma-pic-2.webp" type="image/webp" />
            <img loading="lazy" src="img/main-page/diploma-pic-2.png" alt="" />
          </picture>
        </div>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"text","label":"Заголовок"},{"field":"items","type":"repeater","label":"Гарантии","fields":[{"field":"title","type":"text","label":"Заголовок"},{"field":"text","type":"textarea","label":"Описание"}]}]'::jsonb,
  '{"is_grey_section":true}'::jsonb,
  25,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'community_support',
  'Поддержка после обучения',
  'Поддержка',
  '«После занятий вы не одни» — описание комьюнити',
  '  <section class="s28-hg8ap7v1d section">
    <div class="container-main">
      <div class="s28-wrapper-hg8ap7v1d mb-20">
        <div class="s28-title-hg8ap7v1d mb-60">
          <h2 class="size-48 fw-500">После занятий и даже завершения обучения вы не одни</h2>
          <p class="">вокруг вас <span class="fw-700">онлайн-кампус Talentsy:</span> клубы, встречи, дискуссии, поддержка и постоянное развитие</p>
        </div>
        <div class="s28-swiper-container-hg8ap7v1d">
          <div class="swiper-arrow swiper-arrow-prev icon" style="--icon: url(''data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgMTJMMjAgMTIiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8cGF0aCBkPSJNMTEgMTlMNCAxMkwxMSA1IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KPC9zdmc+'')"></div>
          <div class="swiper s28-swiper-hg8ap7v1d">
            <div class="s28-list-hg8ap7v1d swiper-wrapper">
              <div class="swiper-slide s28-slide-hg8ap7v1d">
                <img src="img/psy-v3/s28-slide-1-img-hg8ap7v1d.png" alt="" />
                <h4 class="s28-slide-title-hg8ap7v1d">Научный клуб</h4>
                <div class="s28-slide-text-hg8ap7v1d">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Разбираем актуальные исследования, обсуждаем научные открытия и методики
                </div>
                <div class="s28-slide-text-hg8ap7v1d">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Развивается критическое мышление и аргументация специалиста
                </div>
              </div>
              <div class="swiper-slide s28-slide-hg8ap7v1d">
                <img src="img/psy-v3/s28-slide-2-img-hg8ap7v1d.png" alt="" />
                <h4 class="s28-slide-title-hg8ap7v1d">Психологический киноклуб</h4>
                <div class="s28-slide-text-hg8ap7v1d">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Смотрим фильмы вместе с преподавателями и разбираем поведение персонажей, мотивацию и динамику отношений
                </div>
                <div class="s28-slide-text-hg8ap7v1d">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Отлично тренирует умение анализировать людей и их реакции
                </div>
              </div>
              <div class="swiper-slide s28-slide-hg8ap7v1d">
                <img src="img/psy-v3/s28-slide-3-img-hg8ap7v1d.png" alt="" />
                <h4 class="s28-slide-title-hg8ap7v1d">Книжный клуб</h4>
                <div class="s28-slide-text-hg8ap7v1d">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Обсуждаем художественную и психологическую литературу вместе с преподавателями-экспертами
                </div>
                <div class="s28-slide-text-hg8ap7v1d">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Формируется аналитичность, наблюдательность и умение видеть психологические закономерности
                </div>
              </div>
              <div class="swiper-slide s28-slide-hg8ap7v1d">
                <img src="img/psy-v3/s28-slide-4-img-hg8ap7v1d.png" alt="" />
                <h4 class="s28-slide-title-hg8ap7v1d">Клуб «Секс для всех»</h4>
                <div class="s28-slide-text-hg8ap7v1d">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Открытые обсуждения тем сексуальности, отношений и сексологических кейсов
                </div>
                <div class="s28-slide-text-hg8ap7v1d">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Рассширяет кругозор и помогает разбираться в сложных вопросах без табу
                </div>
              </div>
              <div class="swiper-slide s28-slide-hg8ap7v1d">
                <img src="img/psy-v3/s28-slide-5-img-hg8ap7v1d.png" alt="" />
                <h4 class="s28-slide-title-hg8ap7v1d">Клуб «Психологи шутят»</h4>
                <div class="s28-slide-text-hg8ap7v1d">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Профессиональный юмор и мемы
                </div>
                <div class="s28-slide-text-hg8ap7v1d">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Помогает сохранять ресурсность и поддерживать тёплое комьюнити
                </div>
              </div>
            </div>
            <div class="swiper-pagination"></div>
          </div>
          <div class="swiper-arrow swiper-arrow-next icon" style="--icon: url(''data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDEyTDQgMTIiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8cGF0aCBkPSJNMTMgMTlMMjAgMTJMMTMgNSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMS41Ii8+Cjwvc3ZnPg=='')"></div>
        </div>
      </div>
      <div class="s28-content-hg8ap7v1d">
        <div class="s28-left-hg8ap7v1d">
          <img class="mb-20" src="img/psy-v3/s28-img-hg8ap7v1d.jpg" alt="" />
          <p class="size-26 font-Atyp fw-400 color-white d-only-hg8ap7v1d">Это сильное профессиональное окружение, которое остаётся с вами надолго — помогает развиваться, искать клиентов, обмениваться опытом и быть частью комьюнити экспертов</p>
        </div>
        <div class="s28-right-hg8ap7v1d">
          <h2 class="size-36 size-30-mobile font-Atyp color-white fw-400 mb-40 mb-20-m">Оффлайн-встречи Talentsy</h2>
          <p class="size-20 fw-400 line-h-1-5 color-white mb-20">Живые события 4–5 раз в год в Москве, Санкт-Петербурге и Сочи </p>
          <p class="size-20 fw-700 line-h-1-5 color-white mb-40 mb-20-m">На встречах:</p>
          <div class="s28-text-hg8ap7v1d mb-20 color-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
              <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            целый день лекций, мастер-классов, воркшопов и совместной практики;
          </div>
          <div class="s28-text-hg8ap7v1d mb-20 color-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
              <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            возможность увидеть преподавателей и одногруппников вживую;
          </div>
          <div class="s28-text-hg8ap7v1d mb-20 color-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
              <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            торжественное вручение дипломов тем, кто хочет получить диплом очно;
          </div>
          <div class="s28-text-hg8ap7v1d color-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
              <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            атмосфера, после которой студенты продолжают общаться и дружить годами.
          </div>
        </div>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"textarea","label":"Заголовок"},{"field":"description","type":"textarea","label":"Описание"},{"field":"items","type":"repeater","label":"Блоки","fields":[{"field":"title","type":"text","label":"Заголовок"},{"field":"text","type":"textarea","label":"Описание"},{"field":"image","type":"image","label":"Изображение"}]}]'::jsonb,
  '{}'::jsonb,
  26,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'partnerships',
  'Профессиональные партнёрства',
  'Поддержка',
  '«Профессиональные партнёрства Talentsy» — логотипы партнёров',
  '  <section class="s17-hg8ap7v1d section section-grey">
    <div class="container-main">
      <h3 class="s17-title-hg8ap7v1d font-Atyp size-48 fw-500 mb-30">Профессиональные партнерства Talentsy</h3>
      <p class="s17-text-hg8ap7v1d size-24 mb-60">Мы сотрудничаем с международными ассоциациями, чтобы ваши знания имели вес в любой стране</p>
      <div class="s17-top-list-hg8ap7v1d d-only-flex-hg8ap7v1d">
        <div class="s17-top-item-hg8ap7v1d">
          <img class="s17-top-item-img-hg8ap7v1d" src="img/psy-v3/s17-img-1-hg8ap7v1d.png" alt="" />
          <p class="s17-top-item-text-hg8ap7v1d">Международная федерация коучинга (ICF)</p>
        </div>
        <div class="s17-top-item-hg8ap7v1d">
          <img class="s17-top-item-img-hg8ap7v1d" src="img/psy-v3/s17-img-2-hg8ap7v1d.png" alt="" />
          <p class="s17-top-item-text-hg8ap7v1d">
            Open European Academy<br />
            (Прага)
          </p>
        </div>
        <div class="s17-top-item-hg8ap7v1d">
          <img class="s17-top-item-img-hg8ap7v1d" src="img/psy-v3/s17-img-3-hg8ap7v1d.png" alt="" />
          <p class="s17-top-item-text-hg8ap7v1d">IPHM и CPD (аккредитующие центры Великобритании)</p>
        </div>
      </div>

      <div class="s17-bottom-list-hg8ap7v1d accordion d-only-flex-hg8ap7v1d">
        <div class="s17-bottom-item-hg8ap7v1d accordion-item">
          <img class="s17-bottom-img-hg8ap7v1d" src="img/psy-v3/s17-img-4-hg8ap7v1d.png" alt="" />
          <div class="s17-bottom-title-hg8ap7v1d accordion-head">
            <h4>Мы — организационный член Международной ассоциации развития гештальт-терапии (IAAGT)</h4>
            <div class="icon accordion-icon" style="--icon: url(''data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUwxMS4yOTI5IDE0LjI5MjlDMTEuNjI2MiAxNC42MjYyIDExLjc5MjkgMTQuNzkyOSAxMiAxNC43OTI5QzEyLjIwNzEgMTQuNzkyOSAxMi4zNzM4IDE0LjYyNjIgMTIuNzA3MSAxNC4yOTI5TDE4IDkiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg=='')"></div>
          </div>
          <div class="accordion-content">
            <div class="accordion-content__block">
              <p class="s17-bottom-text-hg8ap7v1d">Это сотрудничество открывает для нас уникальные возможности: обмен опытом и лучшими практиками с ведущими специалистами со всего мира, доступ к новейшим исследованиям, научным статьям, а также участие в конференциях и мероприятиях IAAGT.  </p>
              <p class="s17-bottom-text-hg8ap7v1d">Кроме того, мы можем реализовывать совместные проекты с экспертами в области гештальт-терапии, что помогает развивать профессиональное сообщество.</p>
            </div>
          </div>
        </div>
        <div class="s17-bottom-item-hg8ap7v1d accordion-item">
          <img class="s17-bottom-img-hg8ap7v1d" src="img/psy-v3/s17-img-5-hg8ap7v1d.png" alt="" />
          <div class="s17-bottom-title-hg8ap7v1d accordion-head">
            <h4>Партнёры Ассоциации практических психологов и коучей (АППК)</h4>
            <div class="icon accordion-icon" style="--icon: url(''data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUwxMS4yOTI5IDE0LjI5MjlDMTEuNjI2MiAxNC42MjYyIDExLjc5MjkgMTQuNzkyOSAxMiAxNC43OTI5QzEyLjIwNzEgMTQuNzkyOSAxMi4zNzM4IDE0LjYyNjIgMTIuNzA3MSAxNC4yOTI5TDE4IDkiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg=='')"></div>
          </div>
          <div class="accordion-content">
            <div class="accordion-content__block">
              <p class="s17-bottom-text-hg8ap7v1d">АППК в свою очередь активно сотрудничает с Министерством образования РФ и Российской академией образования.</p>
              <p class="s17-bottom-text-hg8ap7v1d">Благодаря этому партнерству вы получаете:</p>
              <p class="s17-bottom-text-check-hg8ap7v1d">Информационную поддержку: анонсы мероприятий, публикации в соцсетях, рассылки для целевой аудитории и размещение информации о наших проектах на сайте ассоциации.</p>
              <p class="s17-bottom-text-check-hg8ap7v1d">Возможность презентовать свои программы, курсы и продукты в профессиональном сообществе.</p>
              <p class="s17-bottom-text-check-hg8ap7v1d">Право продавать свою продукцию на мероприятиях ассоциации.</p>
            </div>
          </div>
        </div>
        <div class="s17-bottom-item-hg8ap7v1d accordion-item">
          <img class="s17-bottom-img-hg8ap7v1d" src="img/psy-v3/s17-img-6-hg8ap7v1d.png" alt="" />
          <div class="s17-bottom-title-hg8ap7v1d accordion-head">
            <h4>Сотрудничаем с Ассоциацией профессиональных психологов и психотерапевтов</h4>
            <div class="icon accordion-icon" style="--icon: url(''data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUwxMS4yOTI5IDE0LjI5MjlDMTEuNjI2MiAxNC42MjYyIDExLjc5MjkgMTQuNzkyOSAxMiAxNC43OTI5QzEyLjIwNzEgMTQuNzkyOSAxMi4zNzM4IDE0LjYyNjIgMTIuNzA3MSAxNC4yOTI5TDE4IDkiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg=='')"></div>
          </div>
          <div class="accordion-content">
            <div class="accordion-content__block">
              <p class="s17-bottom-text-hg8ap7v1d">Это полезно для новичков: опытные коллеги становятся наставниками, а еще там можно найти друзей- единомышленников.</p>
              <p class="s17-bottom-text-hg8ap7v1d">Наши выпускники могут вступить в Ассоциацию на особых условиях — это отличный способ стать частью профессионального круга и чувствовать поддержку.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="s17-swiper-container-hg8ap7v1d m-only-hg8ap7v1d">
        <div class="swiper s17-swiper-hg8ap7v1d">
          <div class="s17-bottom-list-hg8ap7v1d accordion swiper-wrapper">
            <div class="s17-top-item-hg8ap7v1d swiper-slide">
              <img class="s17-top-item-img-hg8ap7v1d" src="img/psy-v3/s17-img-1-hg8ap7v1d.png" alt="" />
              <p class="s17-top-item-text-hg8ap7v1d">Международная федерация коучинга (ICF)</p>
            </div>
            <div class="s17-top-item-hg8ap7v1d swiper-slide">
              <img class="s17-top-item-img-hg8ap7v1d" src="img/psy-v3/s17-img-2-hg8ap7v1d.png" alt="" />
              <p class="s17-top-item-text-hg8ap7v1d">
                Open European Academy<br />
                (Прага)
              </p>
            </div>
            <div class="s17-top-item-hg8ap7v1d swiper-slide">
              <img class="s17-top-item-img-hg8ap7v1d" src="img/psy-v3/s17-img-3-hg8ap7v1d.png" alt="" />
              <p class="s17-top-item-text-hg8ap7v1d">IPHM и CPD (аккредитующие центры Великобритании)</p>
            </div>
            <div class="s17-bottom-item-hg8ap7v1d accordion-item swiper-slide">
              <img class="s17-bottom-img-hg8ap7v1d" src="img/psy-v3/s17-img-4-hg8ap7v1d.png" alt="" />
              <div class="s17-bottom-title-hg8ap7v1d accordion-head">
                <h4>Мы — организационный член Международной ассоциации развития гештальт-терапии (IAAGT)</h4>
                <div class="icon accordion-icon" style="--icon: url(''data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUwxMS4yOTI5IDE0LjI5MjlDMTEuNjI2MiAxNC42MjYyIDExLjc5MjkgMTQuNzkyOSAxMiAxNC43OTI5QzEyLjIwNzEgMTQuNzkyOSAxMi4zNzM4IDE0LjYyNjIgMTIuNzA3MSAxNC4yOTI5TDE4IDkiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg=='')"></div>
              </div>
              <div class="accordion-content">
                <div class="accordion-content__block">
                  <p class="s17-bottom-text-hg8ap7v1d">Это сотрудничество открывает для нас уникальные возможности: обмен опытом и лучшими практиками с ведущими специалистами со всего мира, доступ к новейшим исследованиям, научным статьям, а также участие в конференциях и мероприятиях IAAGT. </p>
                  <p class="s17-bottom-text-hg8ap7v1d">Кроме того, мы можем реализовывать совместные проекты с экспертами в области гештальт-терапии, что помогает развивать профессиональное сообщество.</p>
                </div>
              </div>
            </div>
            <div class="s17-bottom-item-hg8ap7v1d accordion-item swiper-slide">
              <img class="s17-bottom-img-hg8ap7v1d" src="img/psy-v3/s17-img-5-hg8ap7v1d.png" alt="" />
              <div class="s17-bottom-title-hg8ap7v1d accordion-head">
                <h4>Партнёры Ассоциации практических психологов и коучей (АППК)</h4>
                <div class="icon accordion-icon" style="--icon: url(''data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUwxMS4yOTI5IDE0LjI5MjlDMTEuNjI2MiAxNC42MjYyIDExLjc5MjkgMTQuNzkyOSAxMiAxNC43OTI5QzEyLjIwNzEgMTQuNzkyOSAxMi4zNzM4IDE0LjYyNjIgMTIuNzA3MSAxNC4yOTI5TDE4IDkiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg=='')"></div>
              </div>
              <div class="accordion-content">
                <div class="accordion-content__block">
                  <p class="s17-bottom-text-hg8ap7v1d">АППК в свою очередь активно сотрудничает с Министерством образования РФ и Российской академией образования.</p>
                  <p class="s17-bottom-text-hg8ap7v1d">Благодаря этому партнерству вы получаете:</p>
                  <p class="s17-bottom-text-check-hg8ap7v1d">Информационную поддержку: анонсы мероприятий, публикации в соцсетях, рассылки для целевой аудитории и размещение информации о наших проектах на сайте ассоциации.</p>
                  <p class="s17-bottom-text-check-hg8ap7v1d">Возможность презентовать свои программы, курсы и продукты в профессиональном сообществе.</p>
                  <p class="s17-bottom-text-check-hg8ap7v1d">Право продавать свою продукцию на мероприятиях ассоциации.</p>
                </div>
              </div>
            </div>
            <div class="s17-bottom-item-hg8ap7v1d accordion-item swiper-slide">
              <img class="s17-bottom-img-hg8ap7v1d" src="img/psy-v3/s17-img-6-hg8ap7v1d.png" alt="" />
              <div class="s17-bottom-title-hg8ap7v1d accordion-head">
                <h4>Сотрудничаем с Ассоциацией профессиональных психологов и психотерапевтов</h4>
                <div class="icon accordion-icon" style="--icon: url(''data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUwxMS4yOTI5IDE0LjI5MjlDMTEuNjI2MiAxNC42MjYyIDExLjc5MjkgMTQuNzkyOSAxMiAxNC43OTI5QzEyLjIwNzEgMTQuNzkyOSAxMi4zNzM4IDE0LjYyNjIgMTIuNzA3MSAxNC4yOTI5TDE4IDkiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg=='')"></div>
              </div>
              <div class="accordion-content">
                <div class="accordion-content__block">
                  <p class="s17-bottom-text-hg8ap7v1d">Это полезно для новичков: опытные коллеги становятся наставниками, а еще там можно найти друзей- единомышленников.</p>
                  <p class="s17-bottom-text-hg8ap7v1d">Наши выпускники могут вступить в Ассоциацию на особых условиях — это отличный способ стать частью профессионального круга и чувствовать поддержку.</p>
                </div>
              </div>
            </div>
          </div>
          <div class="swiper-pagination"></div>
        </div>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"textarea","label":"Заголовок"},{"field":"partners","type":"repeater","label":"Партнёры","fields":[{"field":"name","type":"text","label":"Название"},{"field":"logo","type":"image","label":"Логотип"},{"field":"text","type":"text","label":"Описание"}]}]'::jsonb,
  '{"is_grey_section":true}'::jsonb,
  27,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'professional_league',
  'Профессиональная лига',
  'Дипломы и гарантии',
  '«Выпускники получают членство в ОППЛ»',
  '  <section class="section s29-hg8ap7v1d">
    <div class="container-main">
      <div class="block-gray block-gray_main mb-30">
        <h2 class="size-48 font-Atyp mb-20">Выпускники программы получают членство в ОППЛ*</h2>
        <p class="size-16 mb-60">*Общероссийская профессиональная психотерапевтическая Лига</p>

        <div class="general-blocks s29-general-blocks-hg8ap7v1d d-only-flex-hg8ap7v1d">
          <div class="s29-general-block-hg8ap7v1d general-block_row general-block_transparent general-block_100 general-block_border">
            <div class="general-block_row-pic">
              <picture>
                <source srcset="img/psy-v3/general-7.webp" type="image/webp" />
                <img src="img/psy-v3/general-7.png" alt="" width="86" height="118" loading="lazy" />
              </picture>
            </div>
            <div>
              <span class="size-24 fw-600 line-h-1"> Членство в ОППЛ позволит приобретать </span>
              <span class="size-24 color-black-50"> статус «практикующего психотерапевта» и открывать лицензию на профессиональную психотерапевтическую деятельность </span>
              <span class="size-24 fw-600 line-h-1">при соответствующем изменении законодательства</span>
            </div>
          </div>
          <div class="s29-general-block-hg8ap7v1d">
            <div class="general-block__title size-20 fw-600 line-h-1-2 mb-20 flex-start">

              Лига проводит сертификацию авторских продуктов психологов и психотерапевтов,
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>
            <p class="line-h-1-5 size-16">что помогает заручиться свидетельством профессионального сообщества в авторстве той или иной программы. Внесение в реестр авторских программ позволяет выдавать авторские сертификаты от ОППЛ ученикам и последователям</p>
          </div>
          <div class="s29-general-block-hg8ap7v1d">
            <div class="general-block__title size-20 fw-600 line-h-1-2 mb-20 flex-start">

              Члены Лиги, преподающие психотерапию и консультирование,
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>
            <p class="line-h-1-5 size-16">занимающиеся преподаванием и тренерской работой, могут получить профессиональное признание как официальные преподаватели ОППЛ</p>
          </div>
          <div class="s29-general-block-wrap-hg8ap7v1d">
            <div class="s29-general-block-hg8ap7v1d">
              <div class="general-block__title no-br-mobile size-20 fw-600 line-h-1-2 mb-20 flex-start">

                <p>Возможности для продвижения услуг и программ на ресурсах Оппл</p>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                  <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                  <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </div>
            </div>
            <div class="s29-general-block-hg8ap7v1d">
              <div class="general-block__title no-br-mobile size-20 fw-600 line-h-1-2 mb-20 flex-start">

                <p>Живое содержательное общение профессионалов</p>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                  <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                  <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </div>
            </div>
            <div class="s29-general-block-hg8ap7v1d">
              <div class="general-block__title no-br-mobile size-20 fw-600 line-h-1-2 mb-20 flex-start">

                <p>Возможность членов публиковать научно-практические материалы/ статьи в изданиях ОППЛ</p>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                  <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                  <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="s29-swiper-container-hg8ap7v1d m-only-hg8ap7v1d">
          <div class="swiper s29-swiper-hg8ap7v1d">
            <div class="general-blocks s29-general-blocks-hg8ap7v1d swiper-wrapper">
              <div class="s29-general-block-hg8ap7v1d general-block_row general-block_transparent general-block_100 general-block_border swiper-slide">
                <div class="general-block_row-pic">
                  <picture>
                    <source srcset="img/psy-v3/general-7.webp" type="image/webp" />
                    <img src="img/psy-v3/general-7.png" alt="" width="86" height="118" loading="lazy" />
                  </picture>
                </div>
                <div>
                  <span class="size-24 fw-600 line-h-1"> Членство в ОППЛ позволит приобретать </span>
                  <span class="size-24 color-black-50"> статус «практикующего психотерапевта» и открывать лицензию на профессиональную психотерапевтическую деятельность </span>
                  <span class="size-24 fw-600 line-h-1">при соответствующем изменении законодательства</span>
                </div>
              </div>
              <div class="s29-general-block-hg8ap7v1d swiper-slide">
                <div class="general-block__title size-20 fw-600 line-h-1-2 mb-20 flex-start">

                  <p>Лига проводит сертификацию авторских продуктов психологов и психотерапевтов,</p>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                </div>
                <p class="line-h-1-5 size-16">что помогает заручиться свидетельством профессионального сообщества в авторстве той или иной программы. Внесение в реестр авторских программ позволяет выдавать авторские сертификаты от ОППЛ ученикам и последователям</p>
              </div>
              <div class="s29-general-block-hg8ap7v1d swiper-slide">
                <div class="general-block__title size-20 fw-600 line-h-1-2 mb-20 flex-start">

                  <p>Члены Лиги, преподающие психотерапию и консультирование,</p>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                    <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                    <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                </div>
                <p class="line-h-1-5 size-16">занимающиеся преподаванием и тренерской работой, могут получить профессиональное признание как официальные преподаватели ОППЛ</p>
              </div>
              <div class="s29-general-block-wrap-hg8ap7v1d swiper-slide">
                <div class="s29-general-block-hg8ap7v1d">
                  <div class="general-block__title no-br-mobile size-20 fw-600 line-h-1-2 mb-20 flex-start">

                    <p>Возможности для продвижения услуг и программ на ресурсах Оппл</p>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                      <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                      <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </div>
                </div>
                <div class="s29-general-block-hg8ap7v1d shorttop">
                  <div class="general-block__title no-br-mobile size-20 fw-600 line-h-1-2 mb-20 flex-start">

                    <p>Живое содержательное общение профессионалов</p>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                      <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                      <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </div>
                </div>
                <div class="s29-general-block-hg8ap7v1d">
                  <div class="general-block__title no-br-mobile size-20 fw-600 line-h-1-2 mb-20 flex-start">

                    <p>Возможность членов публиковать научно-практические материалы/ статьи в изданиях ОППЛ</p>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26" fill="none" class="mb-10">
                      <circle cx="13" cy="13" r="13" fill="#F95F29"></circle>
                      <path d="M7.3125 14.875C7.3125 14.875 9.14062 14.625 10.5625 17.875C10.5625 17.875 14.6728 9.75 18.6875 8.125" stroke="white" stroke-width="1.21875" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div class="swiper-pagination"></div>
          </div>
        </div>

      </div>
    </div>
  </section>',
  '[{"field":"title","type":"textarea","label":"Заголовок"},{"field":"description","type":"textarea","label":"Описание"},{"field":"images.main","type":"image","label":"Изображение"}]'::jsonb,
  '{}'::jsonb,
  28,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'why_choose_us',
  'Почему выбирают Talentsy',
  'Подвал',
  '«Почему выбирают онлайн-университет Talentsy?» — карточки преимуществ',
  '  <section class="section s30-hg8ap7v1d pt-0 mb-20-m">
    <div class="container-main">
      <div class="container-block s30-container-block-hg8ap7v1d">
        <div class="container-head">
          <h2 class="size-43 line-h-1">Почему выбирают онлайн&nbsp;- университет Talentsy?</h2>
        </div>
        <div class="container-content s30-container-content-hg8ap7v1d">
          <div class="content-why s30-content-why-hg8ap7v1d">
            <div class="content-why__head">№ 1</div>
            <div class="content-why__description">
              <span class="fw-600">Лидер в&nbsp;подготовке специалистов помогающих профессий</span>
              по&nbsp;количеству студентов <br /><span class="nowrap">и&nbsp;качеству обучения*</span>
              <div class="clue-element clue-element_left d-only-inline-flex-hg8ap7v1d">
                <div class="clue-icon clue-icon_hg8ap7v1d icon" style="--icon: url(''img/psy-v3/help_circle_hg8ap7v1d.png'')"></div>
                <div class="clue-message clue-message_hg8ap7v1d clue-message-2_hg8ap7v1d">*Среди компаний в сфере онлайн-образования по данным центра содействия инновациям в обществе СОЛь</div>
              </div>
            </div>
            <div class="clue-message_hg8ap7v1d clue-message-2_hg8ap7v1d m-only-hg8ap7v1d">*Среди компаний в сфере онлайн-образования по данным центра содействия инновациям в обществе СОЛь</div>
          </div>
          <div class="content-why s30-content-why-hg8ap7v1d">
            <div class="content-why__head">
              <div class="content-why__head-license">
                Лицензи- <br />
                рованное <br />
                образование
              </div>
            </div>
            <div class="content-why__description"><span class="fw-600">Наши дипломы дают право работать в РФ, ЕС и дистанционно по всему миру,</span>  а также принимаются на платформах для психологов (Ясно, Профи.ру, Помогаю.ру)</div>
          </div>
          <div class="content-why content-why-end s30-content-why-hg8ap7v1d">
            <div class="content-why__head">6 500+</div>
            <div class="content-why__description"><span class="fw-600"> Поступили на&nbsp;обучение</span> в&nbsp;2025&nbsp;году</div>
          </div>
          <div class="content-why content-why-end s30-content-why-hg8ap7v1d">
            <div class="content-why__head">13 000+</div>
            <div class="content-why__description"><span class="fw-600"> Дипломированных выпускников</span></div>
          </div>
          <div class="content-why s30-content-why-hg8ap7v1d">
            <div class="content-why__head">
              <img src="img/psy-v3/label2.png" alt="" />
            </div>
            <div class="content-why__description"><span class="fw-600">Учим студентов привлекать клиентов</span> и строить личный бренд</div>
          </div>
          <div class="content-why s30-content-why-hg8ap7v1d">
            <div class="content-why__head">100+</div>
            <div class="content-why__description"><span class="fw-600">Преподавателей:</span> звезды отрасли, эксперты-практики с опытом 10+ лет, авторы методик и научных статей</div>
          </div>

          <div class="content-why s30-content-why-hg8ap7v1d">
            <div class="content-why__head">
              <img src="img/psy-v3/label3.png" alt="" />
            </div>
            <div class="content-why__description">
              <span class="fw-600">Статус резидента «Сколково»</span> <br />
              Мы - инновационная IT-компания, которая развивает EdTech-продукты
            </div>
          </div>

          <div class="content-why s30-content-why-hg8ap7v1d">
            <div class="content-why__head">
              <img src="img/psy-v3/label4.png" alt="" />
            </div>
            <div class="content-why__description">
              <span class="fw-600">Сильное профессиональное комьюнити</span> <br />
              У нас сформирована своя среда, настоящий онлайн-кампус
            </div>
          </div>

          <div class="content-why s30-content-why-hg8ap7v1d">
            <div class="content-why__head">9.7 / 10</div>
            <div class="content-why__description"><span class="fw-600">Средняя оценка занятий</span> нашими студентами</div>
          </div>
        </div>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"text","label":"Заголовок"},{"field":"cards","type":"repeater","label":"Карточки","fields":[{"field":"title","type":"text","label":"Заголовок"},{"field":"text","type":"textarea","label":"Описание"},{"field":"icon","type":"image","label":"Иконка"}]}]'::jsonb,
  '{}'::jsonb,
  29,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'cta_form_application',
  'CTA: Форма заявки',
  'CTA и формы',
  '«Оставьте заявку» — вторая форма для заявки',
  '  <section class="section pt-0">
    <div class="container-main">
      <form data-target="axFormRequest" class="form-get form-get_new form-get_inherit ajaxForm">
        <div class="form-get__start form-get__start_between">
          <div>
            <h3 class="size-32 size-26-mobile line-h-1-2 fw-500 font-Atyp mb-20 letter-1">Оставьте заявку<br class="m-only-hg8ap7v1d"> сейчас и мы <span class="color-black-50">забронируем для вас скидку</span> на ближайший поток</h3>
          </div>
        </div>
        <div class="form-get__main">
          <div class="form-item">
            <input type="text" name="Name" class="input input-light" required placeholder="Ваше имя" />
          </div>
          <div class="form-item">
            <input type="number" class="input input-light" placeholder="Номер телефона" maxlength="18" pattern="^[0-9]{3,18}$" name="Phone" data-mask="tel" required />
          </div>
          <div class="form-item">
            <input type="email" name="Email" class="input input-light" placeholder="Почта" required />
          </div>
          <div class="form-flex">
            <button type="submit" class="form-button-hg8ap7v1d button h-62 button-main button-purple button-p-32">Забронировать</button>
          </div>

          <noindex>
        <div class="agreed__block agreed footer-agreed">
        <input type="checkbox" name="form_agreed" required class="agreed__checkbox checkbox-required" id="user_confirmed_75121469310419">
        <label class="agreed_label error-check checkbox-off" for="user_confirmed_75121469310419"></label>

        <div class="agreed_message">
            <span class="agreed__text">
                Отправляя данную форму, вы соглашаетесь с условиями <a class="agreed__link" href="https://talentsy.ru/legal/oferta/">оферты</a> и <a class="agreed__link" href="https://talentsy.ru/legal/policy/">политики обработки персональных данных</a>. Я даю свое согласие на <a class="agreed__link" href="https://talentsy.ru/legal/pd-agreement/">обработку персональных данных</a>.
            </span>
            <div class="error_agreed agreed__text">Вам нужно принять политику конфиденциальности</div>
        </div>
    </div>

        <div class="agreed__block agreed footer-agreed">
        <input type="hidden" name="form_agreed_2" value="nosms">
        <input type="checkbox" name="form_agreed_2" class="agreed__checkbox" value="sms" id="user_confirmed_50134842918369">
        <label class="agreed_label unreq checkbox-off" for="user_confirmed_50134842918369"></label>

        <div class="agreed_message">
            <span class="agreed__text">
                Я даю свое <a href="https://talentsy.ru/legal/mailing-agreement/" class="agreed__link">согласие</a> на получение рекламных и информационных рассылок.
            </span>
            <div class="error_agreed agreed__text" style="display: none;">Вам нужно выдать согласие</div>
        </div>
    </div>
</noindex>        </div>
      </form>
    </div>
  </section>',
  '[{"field":"title","type":"text","label":"Заголовок"},{"field":"description","type":"text","label":"Описание"},{"field":"button_text","type":"text","label":"Текст кнопки"}]'::jsonb,
  '{}'::jsonb,
  30,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'success_stories',
  'Истории успеха',
  'Социальное доказательство',
  '«Истории успеха наших выпускников» — слайдер с кейсами',
  '  <section class="section s31-hg8ap7v1d pt-0">
    <div class="container-main">
      <h2 class="size-48 mb-30">Истории успеха наших выпускников</h2>
      <div class="swiper-container swiper-container__professional mb-40">
        <div class="swiper-arrow swiper-arrow-prev icon" style="--icon: url(''data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgMTJMMjAgMTIiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8cGF0aCBkPSJNMTEgMTlMNCAxMkwxMSA1IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KPC9zdmc+'')"></div>
        <div class="swiper-professional swiper">
          <div class="swiper-wrapper">
            <div class="swiper-slide">
              <div class="swiper-professional__item">
                <div class="swiper-professional__pic">
                  <picture>
                    <source srcset="img/psy-v3/professional-7.webp" type="image/webp">
                    <img loading="lazy" src="img/psy-v3/professional-7.jpg" alt="">
                  </picture>
                  <div class="swiper-professional__name size-36 font-Atyp">
                    Инна<br>
                    Богомолова
                    <!-- <button class="s31-video-button-hg8ap7v1d">Смотреть видео-отзыв</button> -->
                  </div>
                </div>
                <div class="swiper-professional__content">
                  <div class="swiper-professional__line">
                    <div class="swiper-professional__line-label  fw-600 size-20">
                      <img loading="lazy" src="img/main-page/plus-empty-black.svg" alt="">
                      Цели
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      <ul style="list-style: disc;">
                        <li>
                          Получить знания по психологии и научиться на них зарабатывать.
                        </li>
                        <li>
                          Получить навыки по продвижению себя как специалиста.
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="swiper-professional__line ">
                    <div class="swiper-professional__line-label fw-600 size-20">
                      <img loading="lazy" src="img/main-page/plus-fill-black.svg" alt="">
                      До прохождения курса
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      Начала обучение «с нуля». Постоянно бесплатно «консультировала» друзей по их проблемам, понимала, что не хватает знаний. Хотелось сделать психологию своей профессией.
                    </div>
                  </div>
                  <div class="swiper-professional__line swiper-professional__line_end">
                    <div class="swiper-professional__line-label  fw-600 size-20">
                      <img loading="lazy" src="img/main-page/plus-empty-black.svg" alt="">
                      После
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      <p class="mb-10">Победитель реалити-шоу «Детектор личности»</p>
                      <p class="mb-10">Запустила свой авторский групповой интенсив по МАК-картам, практикум «Агрессия.Границы», курс по избавлению от аэрофобии. Имеет более 30 постоянных частных клиентов и регулярные запуски по авторским программам. Средний чек 5000 руб.</p>
                      <p>Развивает социальные сети, проводит прямые эфиры.</p>
                    </div>
                  </div>
                  <!-- <div class="swiper-professional__line swiper-professional__line_align-center">
                                    <div class="swiper-professional__line-label">
                                        <a data-type="iframe" data-width="800" data-height="450" href="https://kinescope.io/4hvxJAGETGeFtzePLpoEDc" data-fancybox="video-gallery" class="button button-border-black icon" style="--icon: url(''img/main-page/icon/icon-play.svg'')">
                                        Видео-отзыв
                                        </a>
                                    </div>
                                </div> -->
                </div>
              </div>
            </div>
            <div class="swiper-slide">
              <div class="swiper-professional__item">
                <div class="swiper-professional__pic">
                  <picture>
                    <source srcset="img/psy-v3/professional-8.webp" type="image/webp">
                    <img loading="lazy" src="img/psy-v3/professional-8.jpg" alt="">
                  </picture>
                  <div class="swiper-professional__name size-36 font-Atyp">
                    Жанна<br>
                    Абрамова
                    <!-- <button class="s31-video-button-hg8ap7v1d">Смотреть видео-отзыв</button> -->
                  </div>
                </div>
                <div class="swiper-professional__content">
                  <div class="swiper-professional__line">
                    <div class="swiper-professional__line-label  fw-600 size-20">
                      <img loading="lazy" src="img/main-page/plus-empty-black.svg" alt="">
                      Цели
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      <ul style="list-style: disc;">
                        <li>
                          Помогать людям, стать профессиональным психологом.
                        </li>
                        <li>
                          Повысить доход, создать стабильный поток клиентов
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="swiper-professional__line ">
                    <div class="swiper-professional__line-label fw-600 size-20">
                      <img loading="lazy" src="img/main-page/plus-fill-black.svg" alt="">
                      До прохождения курса
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      Хотела работать с людьми, но не было специального психологического образования. Сначала совмещала психологию с бизнесом. Средний чек за консультацию был около 300 рублей, работала по сарафанному радио и проводила консультации после основной работы в бизнесе. Работала очень много, включая выходные.
                    </div>
                  </div>
                  <div class="swiper-professional__line swiper-professional__line_end">
                    <div class="swiper-professional__line-label  fw-600 size-20">
                      <img loading="lazy" src="img/main-page/plus-empty-black.svg" alt="">
                      После
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      Профессиональный психолог, бизнес продала. Активно ведет социальные сети и развивает свой бренд. Появилась своя команда, которая помогает с продвижением. Создала поток клиентов, который продолжает расти, сейчас имеет более 100 клиентов, средний чек – от 6000руб/час. Участвует в реалити-шоу и делится своими знаниями с начинающими психологами.
                    </div>
                  </div>
                  <!-- <div class="swiper-professional__line swiper-professional__line_align-center">
                                    <div class="swiper-professional__line-label">
                                        <a data-type="iframe" data-width="800" data-height="450" href="https://kinescope.io/exTnmmBSAwmsbiybVBnt4u" data-fancybox="video-gallery" class="button button-border-black icon" style="--icon: url(''img/main-page/icon/icon-play.svg'')">
                                        Видео-отзыв
                                        </a>
                                    </div>
                                </div> -->
                </div>
              </div>
            </div>
            <div class="swiper-slide">
              <div class="swiper-professional__item">
                <div class="swiper-professional__pic">
                  <picture>
                    <source srcset="img/psy-v3/professional-9.webp" type="image/webp">
                    <img loading="lazy" src="img/psy-v3/professional-9.jpg" alt="">
                  </picture>
                  <div class="swiper-professional__name size-36 font-Atyp">
                    Ирина<br>
                    Карибова
                    <!-- <button class="s31-video-button-hg8ap7v1d">Смотреть видео-отзыв</button> -->
                  </div>
                </div>
                <div class="swiper-professional__content">
                  <div class="swiper-professional__line">
                    <div class="swiper-professional__line-label  fw-600 size-20">
                      <img loading="lazy" src="img/main-page/plus-empty-black.svg" alt="">
                      Цели
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      <ul>
                        <li>
                          Решить личные проблемы в отношениях и семье.

                        </li>
                        <li>
                          Упорядочить разрозненные знания в психологии и обрести новую профессию.
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="swiper-professional__line ">
                    <div class="swiper-professional__line-label fw-600 size-20">
                      <img loading="lazy" src="img/main-page/plus-fill-black.svg" alt="">
                      До прохождения курса
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      <b>Профессионально не консультировала.</b> Изучала психологию для себя, знания были хаотичными и несистемными. 9 лет пребывала в абьюзивных отношениях и созависимости, было недопонимание в семье, чувствовала пустоту и отсутствие самореализации.
                    </div>
                  </div>
                  <div class="swiper-professional__line swiper-professional__line_end">
                    <div class="swiper-professional__line-label  fw-600 size-20">
                      <img loading="lazy" src="img/main-page/plus-empty-black.svg" alt="">
                      После
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      <p class="mb-10">Профессиональный психолог с несколькими десятками постоянных клиентов по всему миру: Россия, США, Швейцария, Германия, Канада, Казахстан, Кипр и др. Средний чек 8000 руб
                      </p>
                      <p>В личных отношения вышла из созависимости, наладила отношения с родителями и дочерью. Обрела по-настоящему любимую профессию.</p>
                    </div>
                  </div>
                  <!-- <div class="swiper-professional__line swiper-professional__line_align-center">
                                    <div class="swiper-professional__line-label">
                                        <a data-type="iframe" data-width="800" data-height="450" href="https://kinescope.io/6JKpXM1c4sqwLSTjKRxuJ6" data-fancybox="video-gallery" class="button button-border-black icon" style="--icon: url(''img/main-page/icon/icon-play.svg'')">
                                        Видео-отзыв
                                        </a>
                                    </div>
                                </div> -->
                </div>
              </div>
            </div>

            <div class="swiper-slide">
              <div class="swiper-professional__item">
                <div class="swiper-professional__pic">
                  <picture>
                    <source srcset="img/psy-v3/professional-10.webp" type="image/webp">
                    <img loading="lazy" src="img/psy-v3/professional-10.jpg" alt="">
                  </picture>
                  <div class="swiper-professional__name size-36 font-Atyp">
                    Майя<br>
                    Акелина
                    <!-- <button class="s31-video-button-hg8ap7v1d">Смотреть видео-отзыв</button> -->
                  </div>
                </div>
                <div class="swiper-professional__content">
                  <div class="swiper-professional__line">
                    <div class="swiper-professional__line-label  fw-600 size-20">
                      <img loading="lazy" src="img/main-page/plus-empty-black.svg" alt="">
                      Цели
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      <ul>
                        <li>
                          Решение собственных проблем с выгоранием,

                        </li>
                        <li>
                          Поиск новой профессии - «своего дела», в котором могла бы найти отдушину, развиваться и работать с удовольствием, не выгорая.
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="swiper-professional__line ">
                    <div class="swiper-professional__line-label fw-600 size-20">
                      <img loading="lazy" src="img/main-page/plus-fill-black.svg" alt="">
                      До прохождения курса
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      Таможенный брокер с 20-ти летним стажем. Выгорела на работе, стала погружаться в психологию, чтобы решить эту проблему. Параллельно захотела освоить новую профессию. Читала много литературы по теме, но структура в голове не складывалась. Так оказалась в онлайн-университете «Talentsy». Пришла за излечением себя и за знаниями.
                    </div>
                  </div>
                  <div class="swiper-professional__line swiper-professional__line_end">
                    <div class="swiper-professional__line-label  fw-600 size-20">
                      <img loading="lazy" src="img/main-page/plus-empty-black.svg" alt="">
                      После
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      Практикующий психолог, имеет более 20 клиентов. Совмещает психологию с работой в таможне, нашла баланс, при котором работает, не выгорая. В Talentsy получила первых клиентов, преодолела неуверенность, осознала свои сильные стороны, как личности. Работает в интегративном подходе, чаще всего с эмоциями и мышлением. Наиболее частые запросы клиентов - тревожные расстройства, панические атаки, ОКР и депрессия, потеря смыслов, проблемы в отношениях. В комплексе получила не только обучение, но и излечение. А также новую профессию, которая изменила взгляд на саму себя.
                    </div>
                  </div>
                  <!-- <div class="swiper-professional__line swiper-professional__line_align-center">
                                  <div class="swiper-professional__line-label">
                                      <a data-type="iframe" data-width="800" data-height="450" href="https://kinescope.io/6JKpXM1c4sqwLSTjKRxuJ6" data-fancybox="video-gallery" class="button button-border-black icon" style="--icon: url(''img/main-page/icon/icon-play.svg'')">
                                      Видео-отзыв
                                      </a>
                                  </div>
                              </div> -->
                </div>
              </div>
            </div>

            <div class="swiper-slide">
              <div class="swiper-professional__item">
                <div class="swiper-professional__pic">
                  <picture>
                    <source srcset="img/psy-v3/professional-11.webp" type="image/webp">
                    <img loading="lazy" src="img/psy-v3/professional-11.jpg" alt="">
                  </picture>
                  <div class="swiper-professional__name size-36 font-Atyp">
                    Ольга<br>
                    Гурьева
                    <!-- <button class="s31-video-button-hg8ap7v1d">Смотреть видео-отзыв</button> -->
                  </div>
                </div>
                <div class="swiper-professional__content">
                  <div class="swiper-professional__line">
                    <div class="swiper-professional__line-label  fw-600 size-20">
                      <img loading="lazy" src="img/main-page/plus-empty-black.svg" alt="">
                      Цели
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      <ul>
                        <li>
                          Развивать себя и получить базовые знания в области психологии. А также психологическое просвещение - важно делиться знаниями, которые сама приобрела. Они могли бы помочь другим, особенно в воспитании детей и в отношениях.
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="swiper-professional__line ">
                    <div class="swiper-professional__line-label fw-600 size-20">
                      <img loading="lazy" src="img/main-page/plus-fill-black.svg" alt="">
                      До прохождения курса
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      <p class="mb-10">Психологию изучала для саморазвития. Прошла через выгорание, долгосрочную терапию с Психологом, Кризис среднего возраста - поиск смыслов жизни, осознание бесповоротного "взросления", апатию, «дни сурка».
                      </p>
                      <p>Помогла стратегия - реализовывать мечты, быть нужной, помогать другим, это и привело в профессиональное обучение на психолога.</p>
                    </div>
                  </div>
                  <div class="swiper-professional__line swiper-professional__line_end">
                    <div class="swiper-professional__line-label  fw-600 size-20">
                      <img loading="lazy" src="img/main-page/plus-empty-black.svg" alt="">
                      После
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      <p class="mb-10">Занимается психологией профессионально, совмещает работу психологом с бизнесом по продаже косметики. Ведет частную практику, имеет 20 постоянных клиентов, а также запустила свой марафон и клуб психологии и коучинга - проводит групповые занятия по психологии для женщин. Средний чек 4000 руб.
                      </p>
                      <p>Развивает социальные сети, проводит прямые эфиры.</p>
                    </div>
                  </div>
                  <!-- <div class="swiper-professional__line swiper-professional__line_align-center">
                                  <div class="swiper-professional__line-label">
                                      <a data-type="iframe" data-width="800" data-height="450" href="https://kinescope.io/6JKpXM1c4sqwLSTjKRxuJ6" data-fancybox="video-gallery" class="button button-border-black icon" style="--icon: url(''img/main-page/icon/icon-play.svg'')">
                                      Видео-отзыв
                                      </a>
                                  </div>
                              </div> -->
                </div>
              </div>
            </div>
          </div>
          <nav class="pagination"></nav>
        </div>
        <div class="swiper-arrow swiper-arrow-next icon" style="--icon: url(''data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDEyTDQgMTIiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8cGF0aCBkPSJNMTMgMTlMMjAgMTJMMTMgNSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMS41Ii8+Cjwvc3ZnPg=='')"></div>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"text","label":"Заголовок"},{"field":"stories","type":"repeater","label":"Истории","fields":[{"field":"name","type":"text","label":"Имя"},{"field":"text","type":"textarea","label":"История"},{"field":"photo","type":"image","label":"Фото"},{"field":"video_url","type":"text","label":"URL видео"}]}]'::jsonb,
  '{}'::jsonb,
  31,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'reviews_slider',
  'Слайдер отзывов',
  'Социальное доказательство',
  'Слайдер скриншотов отзывов',
  '  <section class="s18-hg8ap7v1d section pt-0 section-reviews-slider" id="reviews">
    <div class="container-main">
      <div class="s18-top-hg8ap7v1d">
        <h2 class="size-48 fw-500 line-h-1 mb-40">
          Студенты довольны обучением
        </h2>
      </div>
      <div class="getreview-widget" data-widget-id="lkdsbysytBSxgsk9"></div>
    </div>
  </section>',
  '[{"field":"title","type":"text","label":"Заголовок"},{"field":"reviews","type":"repeater","label":"Скриншоты отзывов","fields":[{"field":"image","type":"image","label":"Скриншот"}]}]'::jsonb,
  '{"section_id":"reviews"}'::jsonb,
  32,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'pricing_earnings',
  'Цены и заработок',
  'Карьера и заработок',
  '«Научим зарабатывать» — описание окупаемости + цифры',
  '  <section class="section s34-hg8ap7v1d section-bg">
    <div class="container-main">
      <h2 class="size-48 mb-30">Научим зарабатывать <span class="color-black-50">на новой профессии</span></h2>
      <div class="swiper-case-container mb-60">
        <div class="swiper-arrow swiper-arrow-prev icon" style="--icon: url(''data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgMTJMMjAgMTIiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8cGF0aCBkPSJNMTEgMTlMNCAxMkwxMSA1IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KPC9zdmc+'')"></div>
        <div class="swiper swiper-case">
          <div class="swiper-wrapper">
            <div class="swiper-slide">
              <div class="case-item">
                <div class="case-item__pic">
                  <picture>
                    <source srcset="img/psy-v3/case-1.webp" type="image/webp"><img loading="lazy" src="img/psy-v3/case-1.jpg" alt="">
                  </picture>
                </div>
                <div class="case-item__content">
                  <div class="case-item__content-top">
                    <div class="case-item__step">
                      <div class="case-item__step-element size-18">
                        <div class="fw-600">Точка «A»</div>
                        <div class="text-black-50 fw-600">Заработок - 50 000 ₽</div>
                      </div>
                      <div class="case-item__way color-gray size-16">
                         Более 12 лет работала парикмахером-колористом
                      </div>
                      <div class="case-item__step-element size-18">
                        <div class="fw-600">Точка «Б»</div>
                        <div class="text-orange fw-600">Заработок - 100 000 ₽</div>
                      </div>
                    </div>
                    <p class="size-16">
                      Активно ведет консультации в онлайн-формате. В длительной терапии у нее 5 человек, но часто берет клиентов и на разовые консультации.
                      Планирует в будущем полностью переключиться на работу психологом-консультантом.
                    </p>
                  </div>
                  <div class="size-32 fw-600 font-manrope">Ирина Журавлёва</div>
                </div>
              </div>
            </div>
            <div class="swiper-slide">
              <div class="case-item">
                <div class="case-item__pic">
                  <picture>
                    <source srcset="img/psy-v3/case-2.webp" type="image/webp"><img loading="lazy" src="img/psy-v3/case-2.jpg" alt="">
                  </picture>
                </div>
                <div class="case-item__content">
                  <div class="case-item__content-top">
                    <div class="case-item__step">
                      <div class="case-item__step-element size-18">
                        <div class="fw-600">Точка «A»</div>
                        <div class="text-black-50 fw-600">Заработок - 75 000 ₽</div>
                      </div>
                      <div class="case-item__way color-gray size-16">
                        Работала бизнес-тренером
                      </div>
                      <div class="case-item__step-element size-18">
                        <div class="fw-600">Точка «Б»</div>
                        <div class="text-orange fw-600">Заработок - 120 000 ₽</div>
                      </div>
                    </div>
                    <p class="size-16">
                      Уволилась с основой работы, завела свой канал в Telegram и начала вести консультации в онлайн-формате. Сейчас у нее около 15-16 клиентов.
                    </p>
                  </div>
                  <div class="size-32 fw-600 font-manrope">Евгения Савченко</div>
                </div>
              </div>
            </div>
            <div class="swiper-slide">
              <div class="case-item">
                <div class="case-item__pic">
                  <picture>
                    <source srcset="img/psy-v3/case-3.webp" type="image/webp"><img loading="lazy" src="img/psy-v3/case-3.jpg" alt="">
                  </picture>
                </div>
                <div class="case-item__content">
                  <div class="case-item__content-top">
                    <div class="case-item__step">
                      <div class="case-item__step-element size-18">
                        <div class="fw-600">Точка «A»</div>
                        <div class="text-black-50 fw-600">Заработок - 67 000 ₽</div>
                      </div>
                      <div class="case-item__way text-black-65 size-16">
                        На протяжении многих лет работала в финансово-экономической сфере.
                      </div>
                      <div class="case-item__step-element size-18">
                        <div class="fw-600">Точка «Б»</div>
                        <div class="text-orange fw-600">Заработок - 105 000 ₽</div>
                      </div>
                    </div>
                    <p class="size-16">
                      Во время обучения в Talentsy записалась в сервис учебных консультаций и нашла первых клиентов. Сейчас активно проводит консультации в онлайн-формате. 
                    </p>
                  </div>
                  <div class="size-32 fw-600 font-manrope">Ирина Федосова</div>
                </div>
              </div>
            </div>
            <div class="swiper-slide">
              <div class="case-item">
                <div class="case-item__pic">
                  <picture>
                    <source srcset="img/psy-v3/case-4.webp" type="image/webp"><img loading="lazy" src="img/psy-v3/case-4.jpg" alt="">
                  </picture>
                </div>
                <div class="case-item__content">
                  <div class="case-item__content-top">
                    <div class="case-item__step">
                      <div class="case-item__step-element size-18">
                        <div class="fw-600">Точка «A»</div>
                        <div class="text-black-50 fw-600">Заработок - 88 000 ₽</div>
                      </div>
                      <div class="case-item__way text-black-65 size-16">
                        Работал инженером-строителем
                      </div>
                      <div class="case-item__step-element size-18">
                        <div class="fw-600">Точка «Б»</div>
                        <div class="text-orange fw-600">Заработок - 150 000 ₽</div>
                      </div>
                    </div>
                    <p class="size-16">
                      Еще во время обучения консультировал первых клиентов, которые узнали о нем от знакомых. Сейчас проводит онлайн-консультации и продает пакеты сессий.
                    </p>
                  </div>
                  <div class="size-32 fw-600 font-manrope">Алексей Егоров</div>
                </div>
              </div>
            </div>
            <div class="swiper-slide">
              <div class="case-item">
                <div class="case-item__pic">
                  <picture>
                    <source srcset="img/psy-v3/case-5.webp" type="image/webp"><img loading="lazy" src="img/psy-v3/case-5.jpg" alt="">
                  </picture>
                </div>
                <div class="case-item__content">
                  <div class="case-item__content-top">
                    <div class="case-item__step">
                      <div class="case-item__step-element size-18">
                        <div class="fw-600">Точка «A»</div>
                        <div class="text-black-50 fw-600">Заработок - 48 000 ₽</div>
                      </div>
                      <div class="case-item__way text-black-65 size-16">
                        Работала врачом
                      </div>
                      <div class="case-item__step-element size-18">
                        <div class="fw-600">Точка «Б»</div>
                        <div class="text-orange fw-600">Заработок - 116 000 ₽</div>
                      </div>
                    </div>
                    <p class="size-16">
                      Ведет консультации в онлайн-формате, но также проводит и очные встречи. При этом совмещает основную работу с консультированием.
                    </p>
                  </div>
                  <div class="size-32 fw-600 font-manrope">Виктория Елина</div>
                </div>
              </div>
            </div>
            <div class="swiper-slide">
              <div class="case-item">
                <div class="case-item__pic">
                  <picture>
                    <source srcset="img/psy-v3/case-6.webp" type="image/webp"><img loading="lazy" src="img/psy-v3/case-6.jpg" alt="">
                  </picture>
                </div>
                <div class="case-item__content">
                  <div class="case-item__content-top">
                    <div class="case-item__step">
                      <div class="case-item__step-element size-18">
                        <div class="fw-600">Точка «A»</div>
                        <div class="text-black-50 fw-600">Заработок - 90 000 ₽</div>
                      </div>
                      <div class="case-item__way text-black-65 size-16">
                        Работала руководителем в IT-сфере
                      </div>
                      <div class="case-item__step-element size-18">
                        <div class="fw-600">Точка «Б»</div>
                        <div class="text-orange fw-600">Заработок - 170 000 ₽</div>
                      </div>
                    </div>
                    <p class="size-16">
                      Уволилась с основной работы, начала вести личную практику. Проводит как очные встречи, так и онлайн-консультации. Сейчас у нее есть база постоянных клиентов на длительной терапии. Периодически обращаются клиенты за разовой консультацией.
                    </p>
                  </div>
                  <div class="size-32 fw-600 font-manrope">Надежда Павлюшина</div>
                </div>
              </div>
            </div>
          </div>
          <div class="swiper-pagination"></div>
        </div>
        <div class="swiper-arrow swiper-arrow-next icon" style="--icon: url(''data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDEyTDQgMTIiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8cGF0aCBkPSJNMTMgMTlMMjAgMTJMMTMgNSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMS41Ii8+Cjwvc3ZnPg=='')"></div>
      </div>

    </div>
  </section>',
  '[{"field":"title","type":"textarea","label":"Заголовок"},{"field":"description","type":"textarea","label":"Описание"},{"field":"earnings","type":"repeater","label":"Уровни заработка","fields":[{"field":"title","type":"text","label":"Уровень"},{"field":"amount","type":"text","label":"Сумма"},{"field":"text","type":"text","label":"Описание"}]}]'::jsonb,
  '{}'::jsonb,
  33,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'external_reviews',
  'Внешние отзывы',
  'Социальное доказательство',
  '«Более 2000 отзывов на независимых площадках» — ссылки на площадки',
  '  <section class="s19-hg8ap7v1d section">
    <div class="container-main">
      <h2 class="size-48 text-center mb-40 text-left-mobile">Более 2 000 отзывов на независимых площадках</h2>
      <div class="grade mt-0" id="grade">
        <div class="grade-swiper grade-grid">
          <div>
            <a href="https://yandex.ru/maps/org/talentsy/221156808322/reviews/" class="grade-item" target="_blank">
              <span class="grade-item__number"><span class="data">5</span>.0</span>
              <span class="grade-item__count">182 отзыва</span>
              <span class="grade-item__pic">
                <img loading="lazy" src="img/psy-v3/map.svg" alt="" />
              </span>
            </a>
          </div>
          <div>
            <a href="https://www.sravni.ru/shkola/talentsy/otzyvy/ " class="grade-item" target="_blank">
              <span class="grade-item__number">4.<span class="data">9</span></span>
              <span class="grade-item__count">587 отзывов</span>
              <span class="grade-item__pic">
                <img loading="lazy" src="img/psy-v3/sravni.svg" alt="" />
              </span>
            </a>
          </div>
          <div>
            <a href="https://digital-academy.ru/reviews/talentsy" class="grade-item" target="_blank">
              <span class="grade-item__number">4.<span class="data">8</span></span>
              <span class="grade-item__count">40 отзывов</span>
              <span class="grade-item__pic">
                <img loading="lazy" src="img/psy-v3/dacademy.svg" alt="" />
              </span>
            </a>
          </div>
          <div>
            <a href="https://otzovik.com/reviews/talentsy_ru-onlayn_obuchenie_tvorchestvu/" class="grade-item" target="_blank">
              <span class="grade-item__number">4.<span class="data">7</span></span>
              <span class="grade-item__count">237 отзывов</span>
              <span class="grade-item__pic">
                <img loading="lazy" src="img/psy-v3/reviews.svg" alt="" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>',
  '[{"field":"title","type":"text","label":"Заголовок"},{"field":"platforms","type":"repeater","label":"Площадки","fields":[{"field":"name","type":"text","label":"Название"},{"field":"url","type":"text","label":"Ссылка"},{"field":"logo","type":"image","label":"Логотип"}]}]'::jsonb,
  '{}'::jsonb,
  34,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'tariff_form',
  'Тарифы и форма оплаты',
  'CTA и формы',
  'Блок с тарифами, ценой, формой заявки',
  '      <section class="section section-bg s32-hg8ap7v1d" id="tariff">
      <div class="container-main">
        <div class="flex-block flex-block_end flex-block_column-mobile mb-60">
          <div class="flex-column flex-column_10">
            <h2 class="size-48">
              <span class="text-gray-3">Начните</span> карьеру психолога <span class="text-gray-3">сегодня</span>
            </h2>
          </div>
        </div>
        <div class="flex-block flex-block_four mb-60">
          <div class="flex-column">
            <div class="landing-element">
              <div class="size-20 mb-10 fw-600 size-20-mobile">Удобная рассрочка</div>
              <div class="size-16">на 3, 6, 12, 24 месяцев</div>
            </div>
          </div>
          <div class="flex-column">
            <div class="landing-element">
              <div class="size-20 mb-10 fw-600 size-20-mobile">9&nbsp;375&nbsp;₽</div>
              <div class="size-16">минимальный платеж в <br> месяц</div>
            </div>
          </div>
          <div class="flex-column">
            <div class="landing-element">
              <div class="size-20 mb-10 fw-600 size-20-mobile">Без переплат</div>
              <div class="size-16">проценты берет на себя Talentsy</div>
            </div>
          </div>
          <div class="flex-column">
            <div class="landing-element">
              <div class="size-20 mb-10 fw-600 size-20-mobile">Верните 13%</div>
              <div class="size-16">от стоимости курса, <br> оформив налоговый вычет</div>
            </div>
          </div>
        </div>

        <div class="callback-container callback-container_new">
          <div class="callback-column callback-column_grant">
            <div class="callback-column__flex callback-column__flex_column mb-60">
              <h3 class="size-48 font-Atyp fw-500 mb-20">
                Стоимость<br> участия в программе
              </h3>
            </div>
            <div class="callback-condition">
              <div class="s32-wrapper-hg8ap7v1d mb-20">
                <div class="percent">
                  <img src="img/psy-v3/image-fire-hg8ap7v1d.png" alt="" width="11" height="14" />
                  Скидка действует до 03.04.2026                </div>
                <div class="percent">— 40%</div>
              </div>
              <div class="price-old size-18"><span>15625</span>&nbsp;₽/мес</div>
              <div class="price-current">от&nbsp;<span class="jsPPSumm jsPPSummOne">9375</span>&nbsp;₽/мес</div>
              <p class="size-12 color-gray-2">при рассрочке на 24 месяца</p>
            </div>
          </div>
          <div class="callback-column">
            <div class="size-28 font-manrope line-h-1-2 letter-1 fw-600 mb-40">
              Забронировать место на курсе
            </div>
            <form id="go-form" data-target="axFormRequest" class="course-block__form ajaxForm special-pp-selector" special-pp-selector=".jsPPSummOne">
              <div class="course-block__item">
                <input name="Name" required type="text" class="input input-light" placeholder="Ваше имя">
              </div>
              <div class="course-block__item">
                <input name="Phone" required type="tel" class="input input-light" placeholder="Номер телефона">
              </div>
              <div class="course-block__item">
                <input name="Email" required type="text" class="input input-light" placeholder="Почта">
              </div>

              <div class="promo-container course-block__item course-block__item_promo">
               <button type="button" class="promo-button icon" style="--icon: url(''img/main-page/icon/icon-arrow-down.svg'')">
                  У меня есть промокод
                </button>

                <div class="course-block__item-hidden">
                  <div class="course-block__item-hidden-el mb-10">
                    <input type="text" class="input input-light jsPmoField" placeholder="Промокод" name="jsPmoHiddenFormField">
                    <!-- error or success -->
                    <button type="button" class="button-promo-b jsPPRequest">Применить</button>
                  </div>
                  <div class="jsPmoError"></div>
                </div>
              </div>

              <div class="course-block__item">
                <button type="submit" class="button button-purple button_full">Забронировать</button>
              </div>

              <noindex>
        <div class="agreed__block agreed footer-agreed">
        <input type="checkbox" name="form_agreed" required class="agreed__checkbox checkbox-required" id="user_confirmed_8809518015087">
        <label class="agreed_label error-check checkbox-off" for="user_confirmed_8809518015087"></label>

        <div class="agreed_message">
            <span class="agreed__text">
                Отправляя данную форму, вы соглашаетесь с условиями <a class="agreed__link" href="https://talentsy.ru/legal/oferta/">оферты</a> и <a class="agreed__link" href="https://talentsy.ru/legal/policy/">политики обработки персональных данных</a>. Я даю свое согласие на <a class="agreed__link" href="https://talentsy.ru/legal/pd-agreement/">обработку персональных данных</a>.
            </span>
            <div class="error_agreed agreed__text">Вам нужно принять политику конфиденциальности</div>
        </div>
    </div>

        <div class="agreed__block agreed footer-agreed">
        <input type="hidden" name="form_agreed_2" value="nosms">
        <input type="checkbox" name="form_agreed_2" class="agreed__checkbox" value="sms" id="user_confirmed_74998750490307">
        <label class="agreed_label unreq checkbox-off" for="user_confirmed_74998750490307"></label>

        <div class="agreed_message">
            <span class="agreed__text">
                Я даю свое <a href="https://talentsy.ru/legal/mailing-agreement/" class="agreed__link">согласие</a> на получение рекламных и информационных рассылок.
            </span>
            <div class="error_agreed agreed__text" style="display: none;">Вам нужно выдать согласие</div>
        </div>
    </div>
</noindex>            </form>
          </div>
        </div>
      </div>
    </section>',
  '[{"field":"title","type":"text","label":"Заголовок"},{"field":"price","type":"text","label":"Цена"},{"field":"old_price","type":"text","label":"Старая цена"},{"field":"installment","type":"text","label":"Рассрочка"},{"field":"features","type":"repeater","label":"Что включено","fields":[{"field":"text","type":"text","label":"Пункт"}]},{"field":"button_text","type":"text","label":"Текст кнопки"}]'::jsonb,
  '{"section_id":"tariff"}'::jsonb,
  35,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'faq',
  'Часто задаваемые вопросы',
  'Подвал',
  'Аккордеон FAQ',
  '  <section class="s22-hg8ap7v1d section section-white">
    <div class="container-main">
      <h2 class="size-48 font-Atyp fw-500 line-h-1 mb-60">Часто задаваемые вопросы</h2>
      <div class="accordion accordion-faq mb-60">
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600">Можно ли обучиться с нуля? У меня нет психологического образования.</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Да, наша программа построена именно для тех, кто приходит в профессию с нуля. Мы шаг за шагом формируем мышление психолога, даём теорию, практику и поддержку, чтобы вы смогли стать профессионалом — даже если раньше вы просто интересовались психологией «для себя». Начало пути — всегда самое важное, и мы его вместе проходим бережно и осознанно.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600">А насколько много практики на курсе? Это ведь онлайн-формат.</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">В программе предусмотрено более </span><b>400 часов живой практики</b><span style="font-weight: 400;">, включая работу в тройках, демо-сессии, супервизии и консультации с учебными клиентами. Это больше, чем в большинстве офлайн-программ и вузов. Мы считаем, что стать психологом без практики невозможно, поэтому обучаем работать с реальными запросами уже во время курса. Так студенты начинают чувствовать уверенность и часто уже в процессе учёбы проводят первые платные консультации.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600"> Когда начинается работа с реальными клиентами? Я боюсь, что не буду готов.</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Работа с учебными клиентами начинается </span><b>во втором полугодии</b><span style="font-weight: 400;">, когда вы уже освоили основы консультирования и чувствуете опору в своих навыках. Это логичный и безопасный шаг — сначала вы формируете базу, а потом переходите к реальным задачам. Все консультации проходят под супервизией опытных наставников. Вы не один, и на каждом этапе есть поддержка.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600">Есть ли у вас диплом или сертификат, с которым можно работать?</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Да, по окончании обучения вы получаете </span><b>официальный диплом о профессиональной переподготовке</b><span style="font-weight: 400;"> (1200 часов), внесённый в федеральный реестр. Это подтверждённый документ, который даёт право работать психологом-консультантом в России, вести частную практику и участвовать в тендерах или проектах, где требуется подтверждённая квалификация.</span></p>
<p><span style="font-weight: 400;">Дополнительно вы можете получить </span><b>международный диплом MBA от Open European Academy</b><span style="font-weight: 400;"> (Прага), который признаётся в странах ЕС и даёт возможность вести практику за рубежом. Он открывает путь к развитию международной карьеры и может быть полезен, если вы рассматриваете работу с клиентами из других стран.</span></p>
<p><span style="font-weight: 400;">Также предоставляются </span><b>два международных сертификата</b><span style="font-weight: 400;"> (IPHM и CPD, Великобритания), признанные в профессиональных сообществах по всему миру. Эти документы могут использоваться для вступления в ассоциации, сертификации методик и продвижения своих услуг.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600"> А как быть с личной терапией и супервизиями? Они включены?</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">В основной программе включены </span><b>учебные форматы супервизий и интервизий</b><span style="font-weight: 400;">, где вы отрабатываете навыки и получаете обратную связь. Если вы хотите </span><b>подтверждённые часы личной терапии или супервизии с сертификатом</b><span style="font-weight: 400;">, это можно приобрести дополнительно. Такой подход позволяет гибко подстраивать обучение под ваши цели: кто-то хочет просто освоить профессию, а кто-то — получить максимум и строить карьеру на международном уровне.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600"> А если у меня нет цели стать психологом — курс мне подойдёт?</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Да, и это частая история. Многие приходят, чтобы сначала помочь себе — разобраться с чувствами, границами, выгоранием, построением отношений. А уже в процессе понимают, что могут и хотят помогать другим. Программа даёт мощный личный рост и глубокую осознанность, даже если вы не планируете менять профессию. А желание консультировать — оно часто рождается именно по ходу обучения.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600">Сколько времени займёт обучение? Можно ли пройти быстрее?</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Полная программа длится </span><b>12 месяцев</b><span style="font-weight: 400;">, но есть вариант </span><b>6-месячного тарифа Lite</b><span style="font-weight: 400;">. Однако мы рекомендуем основной формат: за год вы проходите через все этапы, формируете навыки и успеваете наработать клиентский опыт. Это особенно важно, если вы планируете работать с людьми. Быстрее — не всегда значит лучше, особенно в такой чувствительной и важной профессии.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600"> Как я пойму, что подхожу для этой профессии? Что если не получится?</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Этот страх есть почти у всех в начале. Именно поэтому мы начинаем с тренинга сенситивности — вы будете постепенно открывать в себе качества, важные для психолога: эмпатию, наблюдательность, устойчивость. А работа в мини-группах и поддержка мастеров создают безопасную среду, где вы сможете расти шаг за шагом. Вы не обязаны быть «готовыми» — вы научитесь по пути.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600">Какой график обучения? Получится ли совмещать с работой?</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Да, обучение удобно совмещать с работой и другими делами. Теоретические уроки вы проходите в личном кабинете в удобное время — утром, вечером или на выходных. Куратор поможет организовать процесс, чтобы вы не перегорели и двигались в комфортном ритме. Практика проходит в Zoom 1 раз в неделю, и время занятий подбирается под расписание вашей мини-группы. Это обучение «вживую», но гибкое и адаптированное под реальную жизнь взрослого человека.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600">Сколько длится обучение?</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Основная программа длится </span><b>12 месяцев</b><span style="font-weight: 400;">. За это время вы освоите 250 видеолекций, более 150 практических занятий и получите </span><b>300+ часов живой практики</b><span style="font-weight: 400;">. Дополнительно, по желанию, можно пройти </span><b>специализацию ещё 6 месяцев</b><span style="font-weight: 400;">, чтобы углубиться в интересующее направление. Это полноценный путь в профессию — не поверхностный курс, а фундамент для устойчивой практики.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600">Как я получу диплом о профпереподготовке, если курс онлайн?</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Мы отправим вам физический, реальный диплом удобным способом — почтой или курьерской службой, в любую точку России или мира. Это официальный документ, не &#171;PDF-версия&#187;.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600">Я смогу общаться с преподавателями?</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Да. Вы регулярно будете встречаться с преподавателями на практиках в Zoom, а также получите обратную связь в чате и в платформе. Многие наши преподаватели — практикующие психологи с большим опытом, которые умеют не только объяснить, но и поддержать. Это не безликая теория — это живой контакт с людьми, которые знают профессию изнутри.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600">Что такое профессиональная переподготовка?</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Это официальная форма обучения, по результатам которой вы получаете диплом и право заниматься новой профессиональной деятельностью. В вашем случае — психологическим консультированием. Диплом ценится на рынке труда, особенно если вы планируете работать в госструктурах, школах, центрах или на платформах.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600">Что такое супервизия, и зачем она нужна?</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Супервизия — это разбор ваших консультаций с опытным психологом. Он помогает понять, что вы сделали правильно, где можно глубже. Это обязательная практика для всех профессиональных психологов. У нас супервизии проходят регулярно во второй части курса — в поддерживающей и безопасной атмосфере.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600">Есть ли какие-то требования для поступления?</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Нужен только диплом о среднем специальном или высшем образовании (не обязательно психологическом). Всё остальное вы получите на курсе — знания, навыки и поддержку.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600">Подойдёт ли мне программа, если я уже работаю как психолог?</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Да, если вы чувствуете пробелы в системном понимании консультирования или хотите познакомиться с другими подходами. Мы обучаем </span><b>интегративному подходу</b><span style="font-weight: 400;"> — вы получите инструменты из КПТ, гештальта, клиент-центрированной терапии, арт-терапии и других направлений, чтобы расширить свой арсенал.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600">Реально ли стать психологом-консультантом за год?</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Да — при регулярной включённости. Мы не даём «волшебную таблетку», но создаём среду, в которой вы за 12 месяцев можете пройти путь от «интересуюсь психологией» до «веду сессии с клиентами». Это возможно благодаря продуманной структуре, практике с настоящими запросами и поддержке кураторов и наставников.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600">Можно ли учиться с телефона или планшета?</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Да. Вы можете обучаться из любой точки мира, с любого устройства — главное, чтобы был стабильный интернет. Платформа адаптирована под смартфоны, и все материалы останутся у вас навсегда.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600">А если мне не подойдёт программа?</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Мы уверены в качестве, но понимаем, что бывают разные ситуации. Если вы решите прекратить обучение, мы сделаем возврат по условиям оферты — пропорционально пройденным материалам.</span></p>
                      </div>
                  </div>
              </div>
                        <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600"> Где может работать психолог консультант после переподготовки?</h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(img/main-page/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <p><span style="font-weight: 400;">Вариантов много: от частной практики до работы в школах, психологических центрах, бизнесе или на онлайн-платформах. Также вы можете развивать консультационную практику как самозанятый специалист, без привязки к офису или работодателю. А если захотите — продолжить обучение в магистратуре или получить углублённую специализацию.</span></p>
                      </div>
                  </div>
              </div>
                </div>
          </div>
  </section>',
  '[{"field":"title","type":"text","label":"Заголовок"},{"field":"questions","type":"repeater","label":"Вопросы","fields":[{"field":"question","type":"text","label":"Вопрос"},{"field":"answer","type":"textarea","label":"Ответ"}]}]'::jsonb,
  '{}'::jsonb,
  36,
  true
);

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, sort_order, is_active)
VALUES (
  'geography',
  'География студентов',
  'Подвал',
  'Бегущая строка с городами',
  '<section class="geography">
    <ul class="geography__list geography__list--top">
        <li class="geography__item"> Санкт-Петербург </li>
        <li class="geography__item"> Нижний Новгород </li>
        <li class="geography__item"> Минск </li>
        <li class="geography__item"> Москва </li>
        <li class="geography__item"> Казань </li>
        <li class="geography__item"> Екатеринбург </li>
    </ul>
    <ul class="geography__list geography__list--mid">
        <li class="geography__item"> Волгоград </li>
        <li class="geography__item"> Красноярск </li>
        <li class="geography__item"> Новосибирск </li>
        <li class="geography__item"> Курск </li>
        <li class="geography__item"> Уфа </li>
        <li class="geography__item"> Севастополь </li>
        <li class="geography__item"> Омск </li>
        <li class="geography__item"> Воронеж </li>
        <li class="geography__item"> Луганск </li>
        <li class="geography__item"> Пермь </li>
        <li class="geography__item"> Ростов-на-Дону </li>
        <li class="geography__item"> Донецк </li>
        <li class="geography__item"> Алматы </li>
        <li class="geography__item"> Челябинск </li>
    </ul>
    <ul class="geography__list geography__list--bottom">
        <li class="geography__item"> Вологда </li>
        <li class="geography__item"> Липецк </li>
        <li class="geography__item"> Кемерово </li>
        <li class="geography__item"> Киров </li>
        <li class="geography__item"> Махачкала </li>
        <li class="geography__item"> Оренбург </li>
        <li class="geography__item"> Пенза </li>
        <li class="geography__item"> Ростов </li>
        <li class="geography__item"> Сочи </li>
        <li class="geography__item"> Ставрополь </li>
        <li class="geography__item"> Гомель </li>
        <li class="geography__item"> Ижевск </li>
        <li class="geography__item"> Тольятти </li>
        <li class="geography__item"> Хабаровск </li>
        <li class="geography__item"> Чебоксары </li>
        <li class="geography__item"> Рязань </li>
        <li class="geography__item"> Саратов </li>
        <li class="geography__item"> Томск </li>
        <li class="geography__item"> Тула </li>
        <li class="geography__item"> Иркутск </li>
        <li class="geography__item"> Калининград </li>
        <li class="geography__item"> Краснодар </li>
        <li class="geography__item"> Сургут </li>
        <li class="geography__item"> Тверь </li>
        <li class="geography__item"> Тюмень </li>
        <li class="geography__item"> Ульяновск </li>
    </ul>
</section>',
  '[{"field":"cities","type":"repeater","label":"Города","fields":[{"field":"name","type":"text","label":"Название города"}]}]'::jsonb,
  '{}'::jsonb,
  37,
  true
);

-- Insert profession template
INSERT INTO public.landing_templates (slug, name, template_type, description, is_active)
VALUES (
  'profession',
  'Профессия с нуля',
  'profession',
  'Длинный лендинг платной программы обучения профессии. Эталон — «Психолог-консультант»',
  true
);

-- Insert template blocks (linking template to block definitions in order)
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 3, '{}'::jsonb, '{"is_dark_section":false}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'hero_stats';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 4, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'audience_market';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 5, '{}'::jsonb, '{"background_color":"#7835FF","text_color":"#ffffff"}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'social_proof_stat';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 6, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'learning_format';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 7, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'platform_comfort';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 8, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'video_lectures';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 9, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'additional_materials';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 10, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'practice_approaches';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 11, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'weekly_practice';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 12, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'cta_form_consultation';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 13, '{}'::jsonb, '{"is_grey_section":true}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'career_paths';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 14, '{}'::jsonb, '{"is_grey_section":true}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'earning_growth';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 15, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'course_included';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 16, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'skills_grid';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 17, '{}'::jsonb, '{"is_dark_section":true}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'teachers';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 18, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'diplomas_certificates';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 19, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'fundamental_program';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 20, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'psychfak_students';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 21, '{}'::jsonb, '{"section_id":"program"}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'curriculum';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 22, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'employment_support';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 23, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'student_care';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 24, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'social_proof_banner_2';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 25, '{}'::jsonb, '{"is_grey_section":true}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'guarantees';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 26, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'community_support';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 27, '{}'::jsonb, '{"is_grey_section":true}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'partnerships';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 28, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'professional_league';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 29, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'why_choose_us';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 30, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'cta_form_application';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 31, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'success_stories';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 32, '{}'::jsonb, '{"section_id":"reviews"}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'reviews_slider';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 33, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'pricing_earnings';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 34, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'external_reviews';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 35, '{}'::jsonb, '{"section_id":"tariff"}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'tariff_form';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 36, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'faq';
INSERT INTO public.landing_template_blocks (template_id, block_definition_id, sort_order, default_content, default_settings)
SELECT lt.id, lbd.id, 37, '{}'::jsonb, '{}'::jsonb
FROM public.landing_templates lt, public.landing_block_definitions lbd
WHERE lt.slug = 'profession' AND lbd.block_type = 'geography';
