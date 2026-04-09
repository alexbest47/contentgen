-- =============================================
-- New landing block: Hero с предзаписью на новый поток
-- Based on the "Психолог-консультант" pre-order hero section
-- =============================================

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, default_content, sort_order, is_active)
VALUES (
  'hero_preorder',
  'Hero: предзапись на новый поток',
  'Hero и УТП',
  'Секция с предзаписью: бейджи срочности, заголовок программы, описание бонусов, CTA-кнопка, знаки доверия (лицензии, Сколково) и AI-иллюстрация эксперта',
  '<section class="hero-preorder">
  <div class="hero-preorder__container">
    <div class="hero-preorder__content">
      <div class="hero-preorder__badges">
        <span class="hero-preorder__badge hero-preorder__badge--urgent">осталось 3 места из 25</span>
        <span class="hero-preorder__badge hero-preorder__badge--info">открыт набор на март</span>
      </div>
      <h1 class="hero-preorder__title">
        Новый поток программы «Профессия психолог-консультант» — ранний доступ с бонусами до 295&nbsp;000&nbsp;₽
      </h1>
      <p class="hero-preorder__description">
        Получите вторую программу <b>бесплатно</b>, учебную <b>стипендию</b>, сертификат <b>на 30&nbsp;000&nbsp;₽</b> и ещё <b>4 уникальных бонуса</b> — только для участников предзаписи.
      </p>
      <a href="#form" class="hero-preorder__cta anchor">Записаться в предсписок</a>
      <div class="hero-preorder__trust">
        <div class="hero-preorder__trust-item">
          <img src="img/hero-preorder/license-international.png" alt="" class="hero-preorder__trust-icon" loading="lazy" />
          <span class="hero-preorder__trust-text">Международная лицензия</span>
        </div>
        <div class="hero-preorder__trust-item">
          <img src="img/hero-preorder/license-ministry.png" alt="" class="hero-preorder__trust-icon" loading="lazy" />
          <span class="hero-preorder__trust-text">Лицензия министерства образования</span>
        </div>
        <div class="hero-preorder__trust-item">
          <img src="img/hero-preorder/skolkovo.png" alt="" class="hero-preorder__trust-icon" loading="lazy" />
          <span class="hero-preorder__trust-text">Резидент Сколково с 2022 года</span>
        </div>
      </div>
    </div>
    <div class="hero-preorder__visual">
      <img src="img/hero-preorder/expert.png" alt="" class="hero-preorder__expert-img" loading="lazy" />
      <div class="hero-preorder__speech-bubble">Прописываю вам эти бонусы для восстановления душевного равновесия</div>
    </div>
  </div>
</section>

<style>
  .hero-preorder {
    background: linear-gradient(135deg, #f0edf7 0%, #e8e4f3 40%, #dce6f0 100%);
    padding: 48px 0 0;
    overflow: hidden;
    position: relative;
  }
  .hero-preorder__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: flex-end;
    gap: 40px;
  }
  .hero-preorder__content {
    flex: 1;
    padding-bottom: 48px;
    min-width: 0;
  }
  .hero-preorder__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 24px;
  }
  .hero-preorder__badge {
    display: inline-block;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
  }
  .hero-preorder__badge--urgent {
    background: #fff;
    color: #7835FF;
    border: 1px solid #7835FF;
  }
  .hero-preorder__badge--info {
    background: #fff;
    color: #333;
    border: 1px solid #ccc;
  }
  .hero-preorder__title {
    font-family: "Atyp Display", "Inter", sans-serif;
    font-size: 36px;
    font-weight: 700;
    line-height: 1.15;
    color: #1a1a1a;
    margin: 0 0 20px;
  }
  .hero-preorder__description {
    font-size: 16px;
    line-height: 1.5;
    color: #444;
    margin: 0 0 28px;
    max-width: 520px;
  }
  .hero-preorder__description b {
    color: #1a1a1a;
    font-weight: 600;
  }
  .hero-preorder__cta {
    display: inline-block;
    background: #7835FF;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    padding: 16px 36px;
    border-radius: 12px;
    text-decoration: none;
    transition: background 0.2s;
    margin-bottom: 32px;
  }
  .hero-preorder__cta:hover {
    background: #6525e0;
  }
  .hero-preorder__trust {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    align-items: center;
  }
  .hero-preorder__trust-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hero-preorder__trust-icon {
    width: 40px;
    height: 40px;
    object-fit: contain;
    flex-shrink: 0;
  }
  .hero-preorder__trust-text {
    font-size: 12px;
    color: #666;
    line-height: 1.3;
    max-width: 120px;
  }
  .hero-preorder__visual {
    flex-shrink: 0;
    width: 400px;
    position: relative;
    align-self: flex-end;
  }
  .hero-preorder__expert-img {
    display: block;
    width: 100%;
    height: auto;
  }
  @import url(''https://fonts.googleapis.com/css2?family=Marck+Script&display=swap'');
  .hero-preorder__speech-bubble {
    position: absolute;
    bottom: 35%;
    right: -20px;
    background: #fff;
    border-radius: 12px;
    padding: 14px 18px;
    font-family: "Marck Script", cursive;
    font-size: 16px;
    color: #333;
    max-width: 210px;
    line-height: 1.35;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    transform: rotate(-1deg);
  }
  .hero-preorder__speech-bubble::before {
    content: "";
    position: absolute;
    left: -8px;
    bottom: 24px;
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-right: 8px solid #fff;
  }
  @media (max-width: 768px) {
    .hero-preorder__container {
      flex-direction: column;
      align-items: stretch;
    }
    .hero-preorder__title {
      font-size: 26px;
    }
    .hero-preorder__visual {
      width: 100%;
      max-width: 320px;
      margin: 0 auto;
    }
    .hero-preorder__trust {
      gap: 16px;
    }
    .hero-preorder__speech-bubble {
      right: 0;
      top: 10%;
    }
  }
</style>',
  '[{"field":"badge_urgent","type":"text","label":"Текст бейджа срочности (места)"},{"field":"badge_info","type":"text","label":"Текст бейджа (набор)"},{"field":"title","type":"textarea","label":"Заголовок"},{"field":"description","type":"textarea","label":"Описание бонусов"},{"field":"cta_text","type":"text","label":"Текст кнопки"},{"field":"cta_url","type":"text","label":"Ссылка кнопки"},{"field":"speech_bubble","type":"text","label":"Текст в облачке эксперта"},{"field":"trust_items","type":"repeater","label":"Знаки доверия","fields":[{"field":"text","type":"text","label":"Подпись"},{"field":"icon","type":"image","label":"Иконка"}]}]'::jsonb,
  '{"background_gradient_from":"#f0edf7","background_gradient_to":"#dce6f0","cta_color":"#7835FF"}'::jsonb,
  '{"badge_urgent":"осталось 3 места из 25","badge_info":"открыт набор на март","title":"Новый поток программы «Профессия психолог-консультант» — ранний доступ с бонусами до 295 000 ₽","description":"Получите вторую программу <b>бесплатно</b>, учебную <b>стипендию</b>, сертификат <b>на 30 000 ₽</b> и ещё <b>4 уникальных бонуса</b> — только для участников предзаписи.","cta_text":"Записаться в предсписок","cta_url":"#form","speech_bubble":"Прописываю вам эти бонусы для восстановления душевного равновесия","trust_items":[{"text":"Международная лицензия","icon":""},{"text":"Лицензия министерства образования","icon":""},{"text":"Резидент Сколково с 2022 года","icon":""}],"_image_overrides":{"img/hero-preorder/expert.png":"https://szlvnesyoydwvtqieazo.supabase.co/storage/v1/object/public/generated-images/landing-blocks/hero-preorder/expert.png","img/hero-preorder/license-international.png":"https://szlvnesyoydwvtqieazo.supabase.co/storage/v1/object/public/generated-images/landing-blocks/hero-preorder/license-international.png","img/hero-preorder/license-ministry.png":"https://szlvnesyoydwvtqieazo.supabase.co/storage/v1/object/public/generated-images/landing-blocks/hero-preorder/license-ministry.png","img/hero-preorder/skolkovo.png":"https://szlvnesyoydwvtqieazo.supabase.co/storage/v1/object/public/generated-images/landing-blocks/hero-preorder/skolkovo.png"}}'::jsonb,
  39,
  true
);
