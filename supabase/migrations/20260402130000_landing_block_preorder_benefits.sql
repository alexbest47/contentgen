-- =============================================
-- New landing block: Преимущества предзаписи
-- Two cards explaining what pre-order is and why it's beneficial
-- =============================================

INSERT INTO public.landing_block_definitions (block_type, name, category, description, html_template, editable_fields, default_settings, default_content, sort_order, is_active)
VALUES (
  'preorder_benefits',
  'Преимущества предзаписи',
  'Hero и УТП',
  'Секция с заголовком и двумя карточками: тёмная (эксклюзивные бонусы) и светлая (выгода для обеих сторон), с 3D-иллюстрациями',
  '<section class="preorder-benefits">
  <div class="preorder-benefits__container">
    <h2 class="preorder-benefits__title">
      Предварительный список — это ранняя запись на программу на самых выгодных условиях, <span class="preorder-benefits__highlight">которых не будет в открытом доступе</span>
    </h2>
    <div class="preorder-benefits__cards">
      <div class="preorder-benefits__card preorder-benefits__card--dark">
        <div class="preorder-benefits__card-visual">
          <img src="img/preorder-benefits/card-dark.png" alt="" loading="lazy" />
        </div>
        <p class="preorder-benefits__card-text">
          <b>Эксклюзивные бонусы, скидки и привилегии</b> для тех, кто принимает решение раньше других
        </p>
      </div>
      <div class="preorder-benefits__card preorder-benefits__card--light">
        <div class="preorder-benefits__card-visual">
          <img src="img/preorder-benefits/card-light.png" alt="" loading="lazy" />
        </div>
        <p class="preorder-benefits__card-text">
          <b>Это выгодно вам — и удобно нам:</b> вы бронируете участие заранее, а мы заранее формируем группу и <b>благодарим за это максимальными бонусами</b>
        </p>
      </div>
    </div>
  </div>
</section>

<style>
  .preorder-benefits {
    padding: 80px 0;
    background: #fff;
  }
  .preorder-benefits__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }
  .preorder-benefits__title {
    font-family: "Atyp Display", "Inter", sans-serif;
    font-size: 40px;
    font-weight: 700;
    line-height: 1.15;
    color: #1a1a1a;
    text-align: center;
    margin: 0 0 48px;
    max-width: 860px;
    margin-left: auto;
    margin-right: auto;
  }
  .preorder-benefits__highlight {
    color: #999;
  }
  .preorder-benefits__cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .preorder-benefits__card {
    border-radius: 24px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    min-height: 360px;
  }
  .preorder-benefits__card--dark {
    background: #1a1a1a;
    color: #fff;
  }
  .preorder-benefits__card--light {
    background: #f5f5f5;
    color: #1a1a1a;
  }
  .preorder-benefits__card-visual {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    max-height: 200px;
  }
  .preorder-benefits__card-visual img {
    max-width: 260px;
    max-height: 180px;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  .preorder-benefits__card-text {
    font-size: 16px;
    line-height: 1.5;
    margin: 0;
    max-width: 400px;
  }
  .preorder-benefits__card--dark .preorder-benefits__card-text {
    color: rgba(255,255,255,0.85);
  }
  .preorder-benefits__card--dark .preorder-benefits__card-text b {
    color: #fff;
  }
  .preorder-benefits__card--light .preorder-benefits__card-text {
    color: #444;
  }
  .preorder-benefits__card--light .preorder-benefits__card-text b {
    color: #1a1a1a;
    font-weight: 600;
  }
  @media (max-width: 768px) {
    .preorder-benefits__title {
      font-size: 28px;
    }
    .preorder-benefits__cards {
      grid-template-columns: 1fr;
    }
    .preorder-benefits__card {
      min-height: 280px;
    }
    .preorder-benefits {
      padding: 48px 0;
    }
  }
</style>',
  '[{"field":"title","type":"textarea","label":"Заголовок секции"},{"field":"highlight_text","type":"text","label":"Выделенный текст (серый)"},{"field":"cards","type":"repeater","label":"Карточки","fields":[{"field":"text","type":"textarea","label":"Текст карточки"},{"field":"image","type":"image","label":"Иллюстрация"},{"field":"theme","type":"text","label":"Тема: dark или light"}]}]'::jsonb,
  '{}'::jsonb,
  '{"title":"Предварительный список — это ранняя запись на программу на самых выгодных условиях, <span class=\"preorder-benefits__highlight\">которых не будет в открытом доступе</span>","highlight_text":"которых не будет в открытом доступе","cards":[{"text":"<b>Эксклюзивные бонусы, скидки и привилегии</b> для тех, кто принимает решение раньше других","image":"","theme":"dark"},{"text":"<b>Это выгодно вам — и удобно нам:</b> вы бронируете участие заранее, а мы заранее формируем группу и <b>благодарим за это максимальными бонусами</b>","image":"","theme":"light"}],"_image_overrides":{"img/preorder-benefits/card-dark.png":"https://szlvnesyoydwvtqieazo.supabase.co/storage/v1/object/public/generated-images/landing-blocks/preorder-benefits/card-dark.png","img/preorder-benefits/card-light.png":"https://szlvnesyoydwvtqieazo.supabase.co/storage/v1/object/public/generated-images/landing-blocks/preorder-benefits/card-light.png"}}'::jsonb,
  40,
  true
);
