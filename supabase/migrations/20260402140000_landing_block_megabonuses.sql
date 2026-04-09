-- =============================================
-- New landing block: 6 мегабонусов предзаписи
-- Accordion-style bonus cards with varying layouts
-- =============================================

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, default_content, sort_order, is_active)
VALUES (
  'megabonuses',
  'Мегабонусы предзаписи (6 бонусов)',
  'Контентные блоки',
  'Секция с 6 бонусами предзаписи: вторая программа бесплатно (5 курсов), стипендия, 2 месяца бесплатно (таймлайн), сертификат, консультации, курсы продвижения',
  '<section class="megabonuses">
  <div class="megabonuses__container">
    <h2 class="megabonuses__title">
      6 мегабонусов, которые доступны только тем, кто запишется <span class="megabonuses__highlight">в анкету предзаписи</span>
    </h2>

    <!-- Бонус 1: Вторая программа бесплатно -->
    <div class="megabonuses__card megabonuses__card--bonus1">
      <div class="megabonuses__card-left">
        <span class="megabonuses__badge">Бонус 1</span>
        <h3 class="megabonuses__card-title">Вы получаете вторую программу — бесплатно</h3>
        <p class="megabonuses__card-desc">Выберите из 1 из 5 курсов в подарок</p>
        <div class="megabonuses__benefit">
          <span class="megabonuses__benefit-label">Ваша выгода:</span>
          <span class="megabonuses__benefit-amount">до 120 000 ₽</span>
        </div>
        <a href="#form" class="megabonuses__cta anchor">Записаться в предсписок</a>
      </div>
      <div class="megabonuses__card-right">
        <div class="megabonuses__courses">
          <div class="megabonuses__course-item megabonuses__course-item--green">
            <span class="megabonuses__course-name">Интегративная нутрициология для себя и своей семьи</span>
            <img src="img/megabonuses/course-1.png" alt="" loading="lazy" class="megabonuses__course-img" />
          </div>
          <div class="megabonuses__course-item megabonuses__course-item--pink">
            <span class="megabonuses__course-name">Детская психология для родителей</span>
            <img src="img/megabonuses/course-2.png" alt="" loading="lazy" class="megabonuses__course-img" />
          </div>
          <div class="megabonuses__course-item megabonuses__course-item--mint">
            <span class="megabonuses__course-name">Сексология для себя</span>
            <img src="img/megabonuses/course-3.png" alt="" loading="lazy" class="megabonuses__course-img" />
          </div>
          <div class="megabonuses__course-item megabonuses__course-item--green">
            <span class="megabonuses__course-name">Профессия стилист-имиджмейкер</span>
            <img src="img/megabonuses/course-4.png" alt="" loading="lazy" class="megabonuses__course-img" />
          </div>
          <div class="megabonuses__course-item megabonuses__course-item--mint">
            <span class="megabonuses__course-name">Коучинг для жизни и карьеры</span>
            <img src="img/megabonuses/course-5.png" alt="" loading="lazy" class="megabonuses__course-img" />
          </div>
        </div>
      </div>
    </div>

    <!-- Бонус 2: Учебная стипендия -->
    <div class="megabonuses__card megabonuses__card--bonus2">
      <div class="megabonuses__card-left">
        <span class="megabonuses__badge">Бонус 2</span>
        <h3 class="megabonuses__card-title">Учебная стипендия — 20 000 рублей</h3>
        <p class="megabonuses__card-desc">Вы получаете дополнительную финансовую поддержку на обучение. Стипендия суммируется с другими бонусами, грантами и акциями — и делает участие в программе ещё выгоднее.</p>
        <div class="megabonuses__benefit">
          <span class="megabonuses__benefit-label">Ваша выгода:</span>
          <span class="megabonuses__benefit-amount">до 20 000 ₽</span>
        </div>
        <a href="#form" class="megabonuses__cta anchor">Записаться в предсписок</a>
      </div>
      <div class="megabonuses__card-right megabonuses__card-right--visual">
        <img src="img/megabonuses/bonus2-woman.png" alt="" loading="lazy" class="megabonuses__bonus-img" />
      </div>
    </div>

    <!-- Бонус 3: 2 месяца бесплатно -->
    <div class="megabonuses__card megabonuses__card--bonus3">
      <div class="megabonuses__card-left">
        <span class="megabonuses__badge">Бонус 3</span>
        <h3 class="megabonuses__card-title">2 месяца — бесплатно</h3>
        <p class="megabonuses__card-desc">Вы начинаете оплачивать программу только к 3 месяцу обучения</p>
      </div>
      <div class="megabonuses__card-right megabonuses__card-right--benefit-inline">
        <div class="megabonuses__benefit">
          <span class="megabonuses__benefit-label">Ваша выгода:</span>
          <span class="megabonuses__benefit-amount">до 30 000 ₽</span>
        </div>
        <a href="#form" class="megabonuses__cta anchor">Записаться в предсписок</a>
      </div>
      <div class="megabonuses__timeline">
        <div class="megabonuses__timeline-bar">
          <div class="megabonuses__timeline-free">
            <span class="megabonuses__timeline-free-label">Первые 2 месяца оплачиваем мы</span>
          </div>
        </div>
        <div class="megabonuses__timeline-marks">
          <span>Начало</span>
          <span>6 месяцев</span>
          <span>9 месяцев</span>
          <span>Завершение</span>
        </div>
      </div>
    </div>

    <!-- Бонус 4: Сертификат -->
    <div class="megabonuses__card megabonuses__card--bonus4">
      <div class="megabonuses__card-left">
        <span class="megabonuses__badge">Бонус 4</span>
        <h3 class="megabonuses__card-title">Сертификат на 30 000 рублей</h3>
        <p class="megabonuses__card-desc">Вы можете использовать его для будущих оплат любых наших программ или подарить друзьям</p>
        <div class="megabonuses__benefit">
          <span class="megabonuses__benefit-label">Ваша выгода:</span>
          <span class="megabonuses__benefit-amount">до 30 000 ₽</span>
        </div>
        <a href="#form" class="megabonuses__cta anchor">Записаться в предсписок</a>
      </div>
      <div class="megabonuses__card-right megabonuses__card-right--visual">
        <img src="img/megabonuses/bonus4-certificate.png" alt="" loading="lazy" class="megabonuses__bonus-img" />
      </div>
    </div>

    <!-- Бонус 5: Консультации -->
    <div class="megabonuses__card megabonuses__card--bonus5">
      <div class="megabonuses__card-left">
        <span class="megabonuses__badge">Бонус 5</span>
        <h3 class="megabonuses__card-title">5 консультаций с психологом</h3>
        <p class="megabonuses__card-desc">Для себя, близких или друзей через нашу платформу pomogayu.ru</p>
        <div class="megabonuses__benefit">
          <span class="megabonuses__benefit-label">Ваша выгода:</span>
          <span class="megabonuses__benefit-amount">до 30 000 ₽</span>
        </div>
        <a href="#form" class="megabonuses__cta anchor">Записаться в предсписок</a>
      </div>
      <div class="megabonuses__card-right megabonuses__card-right--visual">
        <img src="img/megabonuses/bonus5-phone.png" alt="" loading="lazy" class="megabonuses__bonus-img" />
      </div>
    </div>

    <!-- Бонус 6: Курсы продвижения -->
    <div class="megabonuses__card megabonuses__card--bonus6">
      <div class="megabonuses__bonus6-top">
        <div class="megabonuses__card-left">
          <span class="megabonuses__badge">Бонус 6</span>
          <h3 class="megabonuses__card-title">3 курса по продвижению с сопровождением</h3>
          <p class="megabonuses__card-desc">Курсы по продвижению помогут вам выстроить личный бренд психолога и научиться привлекать клиентов с чёткой системой, пошаговыми инструкциями и поддержкой маркетолога на каждом этапе</p>
        </div>
        <div class="megabonuses__card-right megabonuses__card-right--benefit-inline">
          <div class="megabonuses__benefit">
            <span class="megabonuses__benefit-label">Ваша выгода:</span>
            <span class="megabonuses__benefit-amount">до 60 000 ₽</span>
          </div>
          <a href="#form" class="megabonuses__cta anchor">Записаться в предсписок</a>
        </div>
      </div>
      <div class="megabonuses__promo-courses">
        <div class="megabonuses__promo-item">
          <span class="megabonuses__promo-name">PROдвижение в Instagram*</span>
          <span class="megabonuses__promo-note">*Деятельность компании Meta запрещена в РФ</span>
          <img src="img/megabonuses/promo-instagram.png" alt="" loading="lazy" class="megabonuses__promo-img" />
        </div>
        <div class="megabonuses__promo-item">
          <span class="megabonuses__promo-name">PROдвижение в Telegram</span>
          <img src="img/megabonuses/promo-telegram.png" alt="" loading="lazy" class="megabonuses__promo-img" />
        </div>
        <div class="megabonuses__promo-item">
          <span class="megabonuses__promo-name">PROдвижение в ВКонтакте</span>
          <img src="img/megabonuses/promo-vk.png" alt="" loading="lazy" class="megabonuses__promo-img" />
        </div>
      </div>
    </div>

  </div>
</section>

<style>
  .megabonuses {
    padding: 80px 0;
    background: #fff;
  }
  .megabonuses__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }
  .megabonuses__title {
    font-family: "Atyp Display", "Inter", sans-serif;
    font-size: 44px;
    font-weight: 700;

    line-height: 1.15;
    color: #1a1a1a;
    text-align: center;
    margin: 0 0 48px;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
  .megabonuses__highlight {
    color: #ff6b35;
  }

  /* Badge */
  .megabonuses__badge {
    display: inline-block;
    padding: 6px 20px;
    border: 1px solid #ccc;
    border-radius: 20px;
    font-size: 14px;
    color: #333;
    margin-bottom: 16px;
  }

  /* Cards */
  .megabonuses__card {
    background: #f9f9f9;
    border-radius: 24px;
    padding: 40px;
    margin-bottom: 24px;
    display: flex;
    flex-wrap: wrap;
    gap: 32px;
    overflow: hidden;
  }
  .megabonuses__card-left {
    flex: 1;
    min-width: 280px;
  }
  .megabonuses__card-right {
    flex: 1;
    min-width: 280px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .megabonuses__card-title {
    font-family: "Atyp Display", "Inter", sans-serif;
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
    color: #1a1a1a;
    margin: 0 0 12px;
  }
  .megabonuses__card-desc {
    font-size: 16px;
    line-height: 1.5;
    color: #666;
    margin: 0 0 24px;
  }

  /* Benefit */
  .megabonuses__benefit {
    margin-bottom: 20px;
  }
  .megabonuses__benefit-label {
    display: block;
    font-size: 14px;
    color: #999;
    margin-bottom: 4px;
  }
  .megabonuses__benefit-amount {
    display: block;
    font-family: "Atyp Display", "Inter", sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: #1a1a1a;
  }

  /* CTA */
  .megabonuses__cta {
    display: inline-block;
    background: #7835FF;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    padding: 16px 36px;
    border-radius: 30px;
    text-decoration: none;
    transition: background 0.2s;
  }
  .megabonuses__cta:hover {
    background: #6525e0;
  }

  /* Bonus 1: Course cards */
  .megabonuses__courses {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
  .megabonuses__course-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-radius: 16px;
    min-height: 60px;
  }
  .megabonuses__course-item--green {
    background: #e8f5e0;
  }
  .megabonuses__course-item--pink {
    background: #fce4ec;
  }
  .megabonuses__course-item--mint {
    background: #e0f7f0;
  }
  .megabonuses__course-name {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a1a;
    flex: 1;
    margin-right: 12px;
  }
  .megabonuses__course-img {
    width: 56px;
    height: 56px;
    object-fit: contain;
    flex-shrink: 0;
  }

  /* Bonus 2: Woman image */
  .megabonuses__card--bonus2 {
    background: #f5f5f5;
    position: relative;
  }
  .megabonuses__bonus-img {
    max-width: 100%;
    max-height: 340px;
    object-fit: contain;
  }

  /* Bonus 3: Timeline */
  .megabonuses__card--bonus3 {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .megabonuses__card--bonus3 .megabonuses__card-right--benefit-inline {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
  }
  .megabonuses__timeline {
    width: 100%;
    margin-top: 24px;
  }
  .megabonuses__timeline-bar {
    height: 48px;
    background: repeating-linear-gradient(90deg, #e0e0e0 0px, #e0e0e0 1px, transparent 1px, transparent 12px);
    border-radius: 8px;
    position: relative;
    overflow: hidden;
  }
  .megabonuses__timeline-free {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 28%;
    background: repeating-linear-gradient(90deg, #c5f5a0 0px, #c5f5a0 1px, #e8fbd6 1px, #e8fbd6 12px);
    border-radius: 8px;
    display: flex;
    align-items: flex-end;
    padding: 8px 12px;
  }
  .megabonuses__timeline-free-label {
    background: #a8e650;
    color: #1a1a1a;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 8px;
    white-space: nowrap;
  }
  .megabonuses__timeline-marks {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 13px;
    color: #999;
  }

  /* Bonus 6: Promo courses */
  .megabonuses__card--bonus6 {
    flex-direction: column;
  }
  .megabonuses__bonus6-top {
    display: flex;
    gap: 32px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }
  .megabonuses__bonus6-top .megabonuses__card-left {
    flex: 1;
    min-width: 280px;
  }
  .megabonuses__bonus6-top .megabonuses__card-right--benefit-inline {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
    min-width: 240px;
  }
  .megabonuses__promo-courses {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .megabonuses__promo-item {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    position: relative;
    min-height: 160px;
  }
  .megabonuses__promo-name {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 4px;
  }
  .megabonuses__promo-note {
    font-size: 11px;
    color: #999;
    margin-bottom: auto;
  }
  .megabonuses__promo-img {
    width: 80px;
    height: 80px;
    object-fit: contain;
    align-self: flex-end;
    margin-top: 12px;
  }

  @media (max-width: 768px) {
    .megabonuses__title {
      font-size: 28px;
    }
    .megabonuses__card {
      padding: 24px;
      flex-direction: column;
    }
    .megabonuses__card-title {
      font-size: 22px;
    }
    .megabonuses__benefit-amount {
      font-size: 26px;
    }
    .megabonuses__card--bonus3 .megabonuses__card-right--benefit-inline,
    .megabonuses__bonus6-top .megabonuses__card-right--benefit-inline {
      align-items: flex-start;
      text-align: left;
    }
    .megabonuses__promo-courses {
      grid-template-columns: 1fr;
    }
    .megabonuses__bonus6-top {
      flex-direction: column;
    }
    .megabonuses {
      padding: 48px 0;
    }
  }
</style>',
  '[{"field":"section_title","type":"textarea","label":"Заголовок секции"},{"field":"section_highlight","type":"text","label":"Выделенный текст (оранжевый)"},{"field":"bonuses","type":"repeater","label":"Бонусы","fields":[{"field":"badge","type":"text","label":"Бейдж (Бонус 1, 2...)"},{"field":"title","type":"text","label":"Заголовок бонуса"},{"field":"description","type":"textarea","label":"Описание"},{"field":"benefit_amount","type":"text","label":"Сумма выгоды"},{"field":"cta_text","type":"text","label":"Текст кнопки"}]},{"field":"bonus1_courses","type":"repeater","label":"Курсы в подарок (Бонус 1)","fields":[{"field":"name","type":"text","label":"Название курса"},{"field":"image","type":"image","label":"Иллюстрация"}]},{"field":"bonus6_courses","type":"repeater","label":"Курсы продвижения (Бонус 6)","fields":[{"field":"name","type":"text","label":"Название курса"},{"field":"note","type":"text","label":"Примечание"},{"field":"image","type":"image","label":"Иллюстрация"}]}]'::jsonb,
  '{"background":"#ffffff"}'::jsonb,
  '{"section_title":"6 мегабонусов, которые доступны только тем, кто запишется <span class=\"megabonuses__highlight\">в анкету предзаписи</span>","section_highlight":"в анкету предзаписи","bonuses":[{"badge":"Бонус 1","title":"Вы получаете вторую программу — бесплатно","description":"Выберите из 1 из 5 курсов в подарок","benefit_amount":"до 120 000 ₽","cta_text":"Записаться в предсписок"},{"badge":"Бонус 2","title":"Учебная стипендия — 20 000 рублей","description":"Вы получаете дополнительную финансовую поддержку на обучение. Стипендия суммируется с другими бонусами, грантами и акциями — и делает участие в программе ещё выгоднее.","benefit_amount":"до 20 000 ₽","cta_text":"Записаться в предсписок"},{"badge":"Бонус 3","title":"2 месяца — бесплатно","description":"Вы начинаете оплачивать программу только к 3 месяцу обучения","benefit_amount":"до 30 000 ₽","cta_text":"Записаться в предсписок"},{"badge":"Бонус 4","title":"Сертификат на 30 000 рублей","description":"Вы можете использовать его для будущих оплат любых наших программ или подарить друзьям","benefit_amount":"до 30 000 ₽","cta_text":"Записаться в предсписок"},{"badge":"Бонус 5","title":"5 консультаций с психологом","description":"Для себя, близких или друзей через нашу платформу pomogayu.ru","benefit_amount":"до 30 000 ₽","cta_text":"Записаться в предсписок"},{"badge":"Бонус 6","title":"3 курса по продвижению с сопровождением","description":"Курсы по продвижению помогут вам выстроить личный бренд психолога и научиться привлекать клиентов с чёткой системой, пошаговыми инструкциями и поддержкой маркетолога на каждом этапе","benefit_amount":"до 60 000 ₽","cta_text":"Записаться в предсписок"}],"bonus1_courses":[{"name":"Интегративная нутрициология для себя и своей семьи","image":""},{"name":"Детская психология для родителей","image":""},{"name":"Сексология для себя","image":""},{"name":"Профессия стилист-имиджмейкер","image":""},{"name":"Коучинг для жизни и карьеры","image":""}],"bonus6_courses":[{"name":"PROдвижение в Instagram*","note":"*Деятельность компании Meta запрещена в РФ","image":""},{"name":"PROдвижение в Telegram","note":"","image":""},{"name":"PROдвижение в ВКонтакте","note":"","image":""}],"_image_overrides":{"img/megabonuses/course-1.png":"https://szlvnesyoydwvtqieazo.supabase.co/storage/v1/object/public/generated-images/landing-blocks/megabonuses/course-1.png","img/megabonuses/course-2.png":"https://szlvnesyoydwvtqieazo.supabase.co/storage/v1/object/public/generated-images/landing-blocks/megabonuses/course-2.png","img/megabonuses/course-3.png":"https://szlvnesyoydwvtqieazo.supabase.co/storage/v1/object/public/generated-images/landing-blocks/megabonuses/course-3.png","img/megabonuses/course-4.png":"https://szlvnesyoydwvtqieazo.supabase.co/storage/v1/object/public/generated-images/landing-blocks/megabonuses/course-4.png","img/megabonuses/course-5.png":"https://szlvnesyoydwvtqieazo.supabase.co/storage/v1/object/public/generated-images/landing-blocks/megabonuses/course-5.png","img/megabonuses/bonus2-woman.png":"https://szlvnesyoydwvtqieazo.supabase.co/storage/v1/object/public/generated-images/landing-blocks/megabonuses/bonus2-woman.png","img/megabonuses/bonus4-certificate.png":"https://szlvnesyoydwvtqieazo.supabase.co/storage/v1/object/public/generated-images/landing-blocks/megabonuses/bonus4-certificate.png","img/megabonuses/bonus5-phone.png":"https://szlvnesyoydwvtqieazo.supabase.co/storage/v1/object/public/generated-images/landing-blocks/megabonuses/bonus5-phone.png","img/megabonuses/promo-instagram.png":"https://szlvnesyoydwvtqieazo.supabase.co/storage/v1/object/public/generated-images/landing-blocks/megabonuses/promo-instagram.png","img/megabonuses/promo-telegram.png":"https://szlvnesyoydwvtqieazo.supabase.co/storage/v1/object/public/generated-images/landing-blocks/megabonuses/promo-telegram.png","img/megabonuses/promo-vk.png":"https://szlvnesyoydwvtqieazo.supabase.co/storage/v1/object/public/generated-images/landing-blocks/megabonuses/promo-vk.png"}}'::jsonb,
  41,
  true
);
