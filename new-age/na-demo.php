<?php

/*
Template name: __NewAge: Demo
*/

get_header('light');

[
	'psylanding_program'  => $programs,
	'psylanding_faq'      => $faq,
	'psylanding_teachers' => $teachers,
] = get_fields();

$coursePrices = get_field('coursePrices', 15678); // цена с карточки курса

// код обработки форм
$isGetCourse   = get_field('is_gc');
if( $isGetCourse ):
    $formParmas = [
        'tag'   => 'action="https://lk.talentsy.ru/pl/lite/block-public/process-html?id='. get_field('getcourse_wid') .'" method="post" data-open-new-window="0"',
        'class' => '',
        'names' => [ // промокод всегда как для ГК пишется, я для шлюза скрытое поле
            'name'  => 'formParams[first_name]',
            'phone' => 'formParams[phone]',
            'email' => 'formParams[email]',
        ],
        'hiddens' => '<input name="formParams[dealCustomFields][1265453]" type="hidden" value="'. $_GET['utm_info'] .'"><input name="formParams[dealCustomFields][1810276]" type="hidden" value="'. get_field('elly_alias') .'"><input name="formParams[dealCustomFields][1291877]" type="hidden"><input type="hidden" name="__gc__internal__form__helper" class="__gc__internal__form__helper"><input type="hidden" name="__gc__internal__form__helper_ref" class="__gc__internal__form__helper_ref"><input type="hidden" name="requestTime" value="1695648662"><input type="hidden" name="requestSimpleSign" value="de53721676f9b6aa19bb539ad254923d"><input type="hidden" name="isHtmlWidget" value="1">'
    ];
else:
    $formParmas = [
        'tag'   => 'data-target="axFormRequest"',
        'class' => 'ajaxForm',
        'names' => [
            'name'  => 'Name',
            'phone' => 'Phone',
            'email' => 'Email',
        ],
        'hiddens' => ''
    ];
endif;

?>
<main class="page page_hg8ap7v1d">
  <div class="section s4_hg8ap7v1d section-page pt-0">
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
            <img src="/wp-content/themes/talentsy/new-age/dist/images/Image-hero_hg8ap7v1d.png" alt="" width="680" height="567" />
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
              <img src="/wp-content/themes/talentsy/new-age/dist/images/s1-1.png" alt="" />
            </h3>
            <p class="s4-card__text-hg8ap7v1d">Эксперты, которые практикуют каждый день, пишут статьи, выступают на ТВ и радио</p>
          </div>
          <div class="s4-card-hg8ap7v1d s4-card-5-hg8ap7v1d">
            <h3 class="s4-card__title-hg8ap7v1d"><img src="/wp-content/themes/talentsy/new-age/dist/images/star_hg8ap7v1d.png" alt="" />4,9+</h3>
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
  </div>

  <section class="s1 section pt-0">
    <div class="container-main">
      <div id="whom" class="s1-content-hg8ap7v1d">
        <div class="s1-left-hg8ap7v1d">
          <h2 class="size-48 font-Atyp fw-500 line-h-1-1 mb-30">
            Развивайтесь, оставаясь собой, <span class="color-purple-hg8ap7v1d"><span class="nowrap">и приносите</span> пользу людям</span>
          </h2>
          <p class="s1-left__desc s1-left__desc_hg8ap7v1d">Программа создана для обучения с нуля и не требует специального образования</p>
        </div>
        <picture>
          <source srcset="/wp-content/themes/talentsy/new-age/dist/images/s1-3-hg8ap7v1d.webp" type="image/webp" />
          <img src="/wp-content/themes/talentsy/new-age/dist/images/s1-3-hg8ap7v1d.jpg" alt="" loading="lazy" class="s1-content__img-hg8ap7v1d" />
        </picture>
      </div>
      <div class="s1-content-hg8ap7v1d s1-content-center-hg8ap7v1d">
        <div class="s1-left-hg8ap7v1d">
          <h3 class="size-36 font-Atyp fw-500 line-h-1-1 mb-30">Спрос на психологическую помощь <span class="color-gray-3">стабильно растет</span><img src="/wp-content/themes/talentsy/new-age/dist/images/s1-icon_hg8ap7v1d.svg" alt="" /></h3>
        </div>
        <div class="s1-right-hg8ap7v1d">
          <p class="s1-right-text-hg8ap7v1d">Это подтверждают данные рынка и крупных исследовательских центров</p>
          <div class="s1-right-icons-hg8ap7v1d">
            <img src="/wp-content/themes/talentsy/new-age/dist/images/s1-icon-brand-1_hg8ap7v1d.png" alt="" />
            <img src="/wp-content/themes/talentsy/new-age/dist/images/s1-icon-brand-2_hg8ap7v1d.png" alt="" />
            <img src="/wp-content/themes/talentsy/new-age/dist/images/s1-icon-brand-3_hg8ap7v1d.png" alt="" />
            <img src="/wp-content/themes/talentsy/new-age/dist/images/s1-icon-brand-4_hg8ap7v1d.png" alt="" />
          </div>
        </div>
      </div>
      <h3 class="s1-subtitle-hg8ap7v1d">С профессией психолога-консультанта</h3>
      <div class="s1-swiper-container-hg8ap7v1d">
        <div class="swiper s1-swiper-hg8ap7v1d">
          <div class="s1-flex-list-hg8ap7v1d swiper-wrapper">
            <div class="s1-flex-item-hg8ap7v1d swiper-slide">
              <img src="/wp-content/themes/talentsy/new-age/dist/images/s1-item-1-hg8ap7v1d.png" alt="" />
              <p>ваш путь и опыт становятся <b>профессиональной опорой</b>, а не грузом</p>
            </div>
            <div class="s1-flex-item-hg8ap7v1d swiper-slide">
              <img src="/wp-content/themes/talentsy/new-age/dist/images/s1-item-2-hg8ap7v1d.png" alt="" />
              <p>личный рост идёт <b>параллельно с освоением профессии</b> - это часть процесса</p>
            </div>
            <div class="s1-flex-item-hg8ap7v1d swiper-slide">
              <img src="/wp-content/themes/talentsy/new-age/dist/images/s1-item-3-hg8ap7v1d.png" alt="" />
              <p>новая карьера подстраивается под <b>ваш стиль жизни</b> - не наоборот</p>
            </div>
            <div class="s1-flex-item-hg8ap7v1d swiper-slide">
              <img src="/wp-content/themes/talentsy/new-age/dist/images/s1-item-4-hg8ap7v1d.png" alt="" />
              <p>работайте из <b>любой точки мира</b> в своем графике</p>
            </div>
          </div>
          <div class="swiper-pagination"></div>
        </div>
      </div>
    </div>
  </section>

  <section class="s2-hg8ap7v1d">
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
  </section>

  <section class="s9-hg8ap7v1d section">
    <div class="container-main">
      <h2 class="size-48 font-Atyp fw-500 mb-60">Создали <span class="color-black-50">максимально удобный формат обучения,</span> где <span class="color-black-50">мотивация и интерес к психологии</span> растут с каждым уроком</h2>
      <div class="flex-block flex-block_column-mobile mb-40">
        <div class="flex-column flex-column_10 mt-20-m">
          <div class="s9-left-wrapper-hg8ap7v1d">
            <picture>
              <source srcset="/wp-content/themes/talentsy/new-age/dist/images/zoom.webp" type="image/webp" />
              <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/zoom.png" alt="" />
            </picture>
            <div>
              <img src="/wp-content/themes/talentsy/new-age/dist/images/img-check-hg8ap7v1d.png" alt="" />
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
  </section>

  <section class="s8-hg8ap7v1d section pt-0">
    <div class="container-main">
      <div class="flex-block flex-block_column-mobile mb-40">
        <div id="advantages" class="flex-column flex-column_10">
          <h2 class="s8-title-hg8ap7v1d size-48 mb-40">Комфортное обучение <span>в вашем ритме</span></h2>
          <p class="size-20">Собственна платформа, где учиться удобно и приятно. Простая навигация и логика — все интуитивно понятно, <span class="s8-text-nowrap-hg8ap7v1d">даже если</span> вы никогда не учились онлайн</p>
        </div>
        <div class="flex-column flex-column_10 flex-column_pic mt-20-m">
          <video playsinline autoplay="" loop="" muted="">
            <data-src src="https://talentsy.ru/wp-content/themes/talentsy/img/video/video-5.mp4?shorts=true" type="video/mp4"></data-src>
          </video>
        </div>
      </div>
      <div class="s8-list-hg8ap7v1d">
        <div class="s8-item-hg8ap7v1d">
          <p class="s8-text-hg8ap7v1d font-bold">
            Доступ к курсу<br />
            и все его обновления<br> остаются с вами навсегда
          </p>
          <img src="/wp-content/themes/talentsy/new-age/dist/images/img-check-hg8ap7v1d.svg" alt="" class="s8-img-hg8ap7v1d" />
        </div>
        <div class="s8-item-hg8ap7v1d">
          <p class="s8-text-hg8ap7v1d"><b>Доступ 24/7</b> - смотрите лекции <span class="nowrap">и выполняйте</span> домашние задания <span class="nowrap">в удобное</span> время</p>
          <img src="/wp-content/themes/talentsy/new-age/dist/images/img-check-hg8ap7v1d.svg" alt="" class="s8-img-hg8ap7v1d" />
        </div>
        <div class="s8-item-hg8ap7v1d">
          <p class="s8-text-hg8ap7v1d"><b>Резидент Сколково</b> разрабатываем IT-решения для онлайн-образования</p>
          <img src="/wp-content/themes/talentsy/new-age/dist/images/sk.svg" alt="" class="s8-img-hg8ap7v1d" />
        </div>
      </div>
    </div>
  </section>
  <section class="section pt-0">
    <div class="container-main">
      <div class="flex-block">
        <div class="flex-column flex-column_pic flex-column_10 mt-20-m">
          <video playsinline autoplay="" loop="" muted="">
            <data-src src="https://talentsy.ru/wp-content/themes/talentsy/img/video/video-6.mp4?shorts=true" type="video/mp4"></data-src>
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
  </section>

  <section class="s3-hg8ap7v1d section s3 pt-0">
    <div class="container-main">
      <div class="grid-column-2">
        <div class="block-grey-50">
          <h3 class="s3-title-hg8ap7v1d size-36 text-center">Дополнительные материалы к урокам</h3>
          <p class="size-20 text-center">В PDF-формате - удобно скачать, распечатать, повторить</p>
          <picture>
            <source srcset="/wp-content/themes/talentsy/new-age/dist/images/s3-1.webp" type="image/webp" />
            <img src="/wp-content/themes/talentsy/new-age/dist/images/s3-1.png" alt="" loading="lazy" />
          </picture>
        </div>
        <div class="block-grey-50">
          <h3 class="s3-title-hg8ap7v1d size-36 text-center">100+ дополнительных материалов</h3>
          <p class="size-20 text-center">Полезных шаблонов, схем, гайдов и шпаргалок для вашей практики</p>
          <picture>
            <source srcset="/wp-content/themes/talentsy/new-age/dist/images/s3-2.webp" type="image/webp" />
            <img src="/wp-content/themes/talentsy/new-age/dist/images/s3-2.png" alt="" loading="lazy" />
          </picture>
        </div>
      </div>
    </div>
  </section>

  <section class="s24-hg8ap7v1d section s24 pt-0">
    <div class="container-main">
      <div class="s24-wrapper-hg8ap7v1d">
        <div class="s24-left-hg8ap7v1d">
          <h2 class="s24-title-hg8ap7v1d size-36 fw-500 line-h-1 mb-20 mb-10-m">
            10 психологических<br />
            подходов
          </h2>
          <p class="s24-text-hg8ap7v1d size-20 fw-400 line-h-1">вы попробуете на практике за 1 год обучения</p>
        </div>
        <img src="/wp-content/themes/talentsy/new-age/dist/images/s24-img-hg8ap7v1d.png" alt="" />
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
  </section>

  <section class="s25-hg8ap7v1d section s25 pt-0">
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
            <img src="/wp-content/themes/talentsy/new-age/dist/images/s25-card-3-img-hg8ap7v1d.jpg" alt="" />
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
            <img src="/wp-content/themes/talentsy/new-age/dist/images/s25-card-3-img2-hg8ap7v1d.jpg" alt="" />
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
                  <img src="/wp-content/themes/talentsy/new-age/dist/images/s25-card-3-img-hg8ap7v1d.jpg" alt="" />
                  <p class="s25-card-title-hg8ap7v1d">Разборы демо-сессий мастеров</p>
                  <p class="s25-card-text-hg8ap7v1d">Смотрите консультации опытных психологов и анализируете каждое профессиональное решение</p>
                  <div class="s25-card-bottom-hg8ap7v1d">
                    <p class="title">Для чего</p>
                    <p class="text">понимаете логику работы мастеров и формируете собственный стиль</p>
                  </div>
                </div>
                <div class="s25-card-hg8ap7v1d s25-card-5-hg8ap7v1d swiper-slide">
                  <img src="/wp-content/themes/talentsy/new-age/dist/images/s25-card-3-img2-hg8ap7v1d.jpg" alt="" />
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
  </section>

  <section class="section pt-0">
    <div class="container-main">
      <form <?= $formParmas['tag']; ?> class="form-get form-get_new form-get_inherit <?= $formParmas['class']; ?>">
        <div class="form-get__start form-get__start_between">
          <div>
            <h3 class="size-40 line-h-1-2 fw-500 font-Atyp mb-20 letter-1">Расскажите о своих целях </h3>
            <div class="size-20">Наш специалист честно разберет, подойдет ли программа под ваш темп и задачи</div>
          </div>
        </div>
        <div class="form-get__main">
          <div class="form-item">
            <input type="text" name="<?= $formParmas['names']['name']; ?>" class="input input-light" required placeholder="Ваше имя" />
          </div>
          <div class="form-item">
            <input type="number" class="input input-light" placeholder="Номер телефона" maxlength="18" pattern="^[0-9]{3,18}$" name="<?= $formParmas['names']['phone']; ?>" data-mask="tel" required />
          </div>
          <div class="form-item">
            <input type="email" name="<?= $formParmas['names']['email']; ?>" class="input input-light" placeholder="Почта" required />
          </div>
          <div class="form-flex">
            <button type="submit" class="form-button-hg8ap7v1d button h-62 button-main button-purple button-p-32">Обсудить цели</button>
          </div>

          <? get_template_part( 'inc/components/form/agreed' ); ?>
        </div>
      <?= $formParmas['hiddens']; ?></form>
    </div>
  </section>

  <section class="s26-hg8ap7v1d section section-grey">
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
                <img src="/wp-content/themes/talentsy/new-age/dist/images/s26-icon-hg8ap7v1d.png" alt="" /> <b>pomogayu.ru</b>
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
            <source srcset="/wp-content/themes/talentsy/new-age/dist/images/s1-4.webp" type="image/webp" />
            <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/s1-4.png" alt="" width="590" height="576" />
          </picture>
        </div>
      </div>
      
    </div>
  </section>

  <section class="section section-grey">
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
              <source srcset="/wp-content/themes/talentsy/new-age/dist/images/profi.webp" type="image/webp" />
              <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/profi.png" alt="" />
            </picture>
            <p>
              Средняя стоимость консультации психолога по РФ — <br />
              <b>3 500 ₽</b>, а в Москве порядка <b>5 000 ₽</b>, по данным profi.ru
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="s11-hg8ap7v1d section">
    <div class="container-main">
      <div class="s11-wrapper-hg8ap7v1d">
        <div class="s11-content-hg8ap7v1d">
          <img src="/wp-content/themes/talentsy/new-age/dist/images/s11-icon-hg8ap7v1d.png" alt="" class="s11-icon-hg8ap7v1d" />
          <h3 class="s11-title-hg8ap7v1d">Курс <span>PROдвижение</span> в подарок</h3>
          <p class="s11-text-hg8ap7v1d">После основной программы вы не остаётесь 1 на 1 с новой профессией — научим продвигать свои услуги и развивать личный бренд в самых популярных соцсетях</p>
        </div>
        <picture class="s11-pic-hg8ap7v1d">
          <img class="s11-img-hg8ap7v1d" src="/wp-content/themes/talentsy/new-age/dist/images/s11-gif-hg8ap7v1d.gif" alt="" />
        </picture>
      </div>
    </div>
  </section>

  <section class="s12-hg8ap7v1d section pt-0">
    <div class="container-main">
      <div class="s12-content-hg8ap7v1d">
        <div class="s12-list-hg8ap7v1d">
          <div class="s12-item-hg8ap7v1d">
            <h4 class="s12-item-title-hg8ap7v1d">Живой онлайн-курс с сопровождением маркетолога</h4>
            <p class="s12-item-text-hg8ap7v1d">Вы учитесь в мини-группе, разбираете свой кейс и получаете обратную связь, а не просто смотрите записи</p>
            <img src="/wp-content/themes/talentsy/new-age/dist/images/s12-1-hg8ap7v1d.png" alt="" class="s12-item-img-hg8ap7v1d" />
          </div>
          <div class="s12-item-hg8ap7v1d">
            <img src="/wp-content/themes/talentsy/new-age/dist/images/s12-2-hg8ap7v1d.png" alt="" class="s12-item-img-hg8ap7v1d" />
            <h4 class="s12-item-title-hg8ap7v1d">Актуальные инструменты для психологов</h4>
            <p class="s12-item-text-hg8ap7v1d">Разбираете особенности соцсетей и учитесь применять инструменты, подходящие именно вашему стилю работы</p>
          </div>
          <div class="s12-item-hg8ap7v1d">
            <h4 class="s12-item-title-hg8ap7v1d">Постоянно обновляемая программа</h4>
            <p class="s12-item-text-hg8ap7v1d">Адаптируем курс под все изменения — вы получаете только актуальные знания</p>
            <img src="/wp-content/themes/talentsy/new-age/dist/images/s12-3-hg8ap7v1d.png" alt="" class="s12-item-img-hg8ap7v1d" />
          </div>
        </div>
      </div>
      <form <?= $formParmas['tag']; ?> class="<?= $formParmas['class']; ?> s12-form-hg8ap7v1d">
        <div class="s12-form-item-hg8ap7v1d">
          <input type="text" class="input input-light" required="" name="<?= $formParmas['names']['name']; ?>" placeholder="Ваше имя" />
        </div>
        <div class="s12-form-item-hg8ap7v1d">
          <input type="tel" class="input input-light" required="" name="<?= $formParmas['names']['phone']; ?>" placeholder="Номер телефона" />
        </div>
        <div class="s12-form-item-hg8ap7v1d">
          <input type="text" class="input input-light" required="" name="<?= $formParmas['names']['email']; ?>" placeholder="Почта" />
        </div>
        <div>
          <button type="submit" class="button h-62 button-main button-purple" disabled="">Узнать подробнее</button>
        </div>
        <div class="s12-check-wrapper-hg8ap7v1d">
          <? get_template_part( 'inc/components/form/agreed' ); ?>
        </div>
      <?= $formParmas['hiddens']; ?></form>
    </div>
  </section>

  <section class="s13-hg8ap7v1d section section-black">
    <div class="container-main tab-container">
      <div class="s13-head-hg8ap7v1d section-head section-head_flex mb-60 mb-20-m">
        <h2 class="size-48 font-Atyp section-head__column">Учитесь у ведущих психологов страны</h2>
        <div class="section-head__column">
          <p class="size-20 mt-20-m mb-60">Пожалуй, самый сильный состав преподавателей на программах переподготовки в области психологии</p>
          <p class="s13-text-hg8ap7v1d mb-20"><span>Психологи-практики</span> с многолетним стажем, кандидатскими и докторскими степенями</p>
          <p class="size-16 mb-20">Это эксперты, которые</p>
          <div class="s13-list-hg8ap7v1d">
            <p class="s13-item-hg8ap7v1d">
              <img src="/wp-content/themes/talentsy/new-age/dist/images/img-check-hg8ap7v1d.png" alt="" />
              практикуют каждый день и знают актуальные запросы
            </p>
            <p class="s13-item-hg8ap7v1d">
              <img src="/wp-content/themes/talentsy/new-age/dist/images/img-check-hg8ap7v1d.png" alt="" />
              делятся опытом на реальных кейсах
            </p>
            <p class="s13-item-hg8ap7v1d">
              <img src="/wp-content/themes/talentsy/new-age/dist/images/img-check-hg8ap7v1d.png" alt="" />
              проводят разбор ошибок
            </p>
          </div>
        </div>
      </div>
    <noindex>
        <div class="specialist-container">
            <button type="button" class="swiper-arrow swiper-arrow_prev icon"
                    style="--icon: url(/wp-content/themes/talentsy/new-age/dist/images/icon/icon-arrow-left.svg)"></button>
            <div class="swiper swiper-specialist">
                <div class="swiper-wrapper">
                    <?php
                    foreach ( $teachers as $teacher ):
                        $fields = get_fields( $teacher->ID );
                        ?>
                        <div class="swiper-slide">
                            <div class="swiper-slide__pic">
                                <img loading="lazy" src="<?= $fields['photo'] ?>" alt="">
                                <div class="swiper-slide__content">
                                    <h3 class="size-20 mb-10">
                                        <?= $fields['name'] . ' ' . $fields['surname'] ?>
                                    </h3>
                                    <p class="text-white-70 mb-10">
                                        <?= $fields['regalia'] ?>
                                    </p>
                                    <a href="#" data-popup="<?= '#teacher' . $teacher->ID ?>"
                                       class="button button-border-white">Подробнее</a>
                                </div>
                            </div>
                        </div>
                    <?php
                    endforeach; ?>
                </div>
                <div class="pagination"></div>
            </div>
            <button type="button" class="swiper-arrow swiper-arrow_next icon"
                    style="--icon: url(/wp-content/themes/talentsy/new-age/dist/images/icon/icon-arrow.svg)"></button>
        </div>
    </noindex>

      <div class="s13-teachers-block-hg8ap7v1d teachers-block">
        <h2 class="size-48 text-center"><span class="text-white-50"> Каждый модуль ведёт профильный эксперт </span> — специалист, который много лет практикует именно в этом подходе и передаёт самые проверенные и актуальные инструменты</h2>
        <div class="teacher-league__container">
          <div class="teacher-league">
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-1.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-1.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Российская психотерапевтическая лига</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-2.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-2.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Американская психологическая ассоциация</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-3.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-3.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Ассоциация сексологов</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-4.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-4.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Общество Семейных Консультантов и Психотерапевтов</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-5.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-5.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Европейская ассоциация развития психоанализа и терапии</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-6.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-6.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">ICEEFT</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-1.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-1.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Российская психотерапевтическая лига</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-2.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-2.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Американская психологическая ассоциация</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-3.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-3.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Ассоциация сексологов</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-4.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-4.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Общество Семейных Консультантов и Психотерапевтов</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-5.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-5.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Европейская ассоциация развития психоанализа и терапии</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-6.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-6.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">ICEEFT</div>
            </div>
          </div>
          <div class="teacher-league">
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-1.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-1.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Российская психотерапевтическая лига</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-2.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-2.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Американская психологическая ассоциация</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-3.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-3.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Ассоциация сексологов</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-4.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-4.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Общество Семейных Консультантов и Психотерапевтов</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-5.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-5.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Европейская ассоциация развития психоанализа и терапии</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-6.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-6.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">ICEEFT</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-1.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-1.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Российская психотерапевтическая лига</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-2.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-2.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Американская психологическая асоциация</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-3.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-3.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Ассоциация сексологов</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-4.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-4.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Общество Семейных Консультантов и Психотерапевтов</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-5.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-5.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">Европейская ассоциация развития психоанализа и терапии</div>
            </div>
            <div class="teacher-league__item">
              <div class="teacher-league__icon">
                <picture>
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/league-6.webp" type="image/webp" />
                  <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/league-6.png" alt="" />
                </picture>
              </div>
              <div class="teacher-league__text">ICEEFT</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section s2">
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
          <source srcset="/wp-content/themes/talentsy/new-age/dist/images/s2-1-hg8ap7v1d.webp" type="image/webp" />
          <img src="/wp-content/themes/talentsy/new-age/dist/images/s2-1-hg8ap7v1d.jpg" alt="" loading="lazy" class="s2-top__img s2-top__img-hg8ap7v1d" />
        </picture>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container-main">
      <form <?= $formParmas['tag']; ?> class="form-get-hg8ap7v1d form-get form-get_new form-get_inherit <?= $formParmas['class']; ?>">
        <div class="form-get__start form-get__start_between">
          <div>
            <h3 class="size-32 size-26-mobile line-h-1-2 fw-600 font-manrope mb-20 letter-1"><span class="color-black-50">Получите</span> гайд<br> по профессии<br class="m-only-hg8ap7v1d"> <span class="color-black-50">психолог-<br class="m-only-hg8ap7v1d">консультант</span></h3>
          </div>
          <div>
            <picture>
              <source srcset="/wp-content/themes/talentsy/new-age/dist/images/books-hg8ap7v1d.webp" type="image/webp" />
              <img src="/wp-content/themes/talentsy/new-age/dist/images/books-hg8ap7v1d.png" alt="" loading="lazy" class="form-img-hg8ap7v1d" />
            </picture>
          </div>
        </div>
        <div class="form-get__main">
          <div class="form-item">
            <input type="text" class="input input-light" required="" name="<?= $formParmas['names']['name']; ?>" placeholder="Ваше имя" />
          </div>
          <div class="form-item">
            <input type="tel" class="input input-light" required="" name="<?= $formParmas['names']['phone']; ?>" placeholder="Номер телефона" />
          </div>
          <div class="form-item">
            <input type="text" class="input input-light" required="" name="<?= $formParmas['names']['email']; ?>" placeholder="Почта" />
          </div>
          <? get_template_part( 'inc/components/form/agreed' ); ?>
          <div class="form-grid">
            <button type="submit" class="button h-62 button-main button-purple">Получить гайд</button>
          </div>
        </div>
      <?= $formParmas['hiddens']; ?></form>
    </div>
  </section>

  <section class="section s27-hg8ap7v1d">
    <div class="container-main">
      <div class="flex-block mb-40">
        <div class="flex-column flex-column_10 flex-column_pic mt-20-m">
          <video playsinline autoplay="" loop="" muted="" class="mb-20">
            <data-src src="https://talentsy.ru/wp-content/themes/talentsy/img/video/rikel-mgu-shorts.mp4?shorts=true" type="video/mp4"></data-src>
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
  </section>

  <section class="s21-hg8ap7v1d section section-program pt-0" id="program">
    <div class="container-main">
      <div class="s21-wrapper-hg8ap7v1d block-gray block-gray_main">
        <h2 class="size-48 mb-40">Программа обучения</h2>
        <div class="accordion accordion-program">
            <?php
            foreach ( $programs as $key => $program ): ?>
                <div class="accordion-item">
                    <div class="accordion-head">
                        <h3 class="size-20 fw-600"><span
                                    class="accordion-head__module">Модуль <?= $key + 1 ?></span><?= $program['header'] ?>
                        </h3>
                        <div class="icon accordion-icon"
                             style="    --icon: url(/wp-content/themes/talentsy/new-age/dist/images/icon/icon-arrow-down.svg)"></div>
                    </div>
                    <div class="accordion-content" style="height: 0;">
                        <div class="accordion-content__block">
                            <?= $program['text'] ?>
                        </div>
                    </div>
                </div>
            <?php
            endforeach; ?>
        </div>
      </div>
    </div>
  </section>

  <section class="section pt-0">
    <div class="container-main">
      <form <?= $formParmas['tag']; ?> class="form-get form-get_inherit <?= $formParmas['class']; ?>">
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
                <source srcset="/wp-content/themes/talentsy/new-age/dist/images/form-img-hg8ap7v1d.webp" type="image/webp" />
                <img src="/wp-content/themes/talentsy/new-age/dist/images/form-img-hg8ap7v1d.png" alt="" width="64" height="64" loading="lazy" />
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
            <input type="text" class="input input-light" required="" name="<?= $formParmas['names']['name']; ?>" placeholder="Ваше имя" />
          </div>
          <div class="form-item">
            <input type="tel" class="input input-light" required="" name="<?= $formParmas['names']['phone']; ?>" placeholder="Номер телефона" />
          </div>
          <div class="form-item">
            <input type="text" class="input input-light" required="" name="<?= $formParmas['names']['email']; ?>" placeholder="Почта" />
          </div>
          <button type="submit" class="form-button-hg8ap7v1d button h-62 button-main button-purple">Получить консультацию</button>
          <? get_template_part( 'inc/components/form/agreed' ); ?>
        </div>
      <?= $formParmas['hiddens']; ?></form>
    </div>
  </section>

  <section class="s1 s1-2-hg8ap7v1d section pt-0">
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
              <source srcset="/wp-content/themes/talentsy/new-age/dist/images/s1-1.webp" type="image/webp" />
              <img src="/wp-content/themes/talentsy/new-age/dist/images/s1-1.png" alt="" loading="lazy" class="s1-card__img" />
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
              <source srcset="/wp-content/themes/talentsy/new-age/dist/images/s1-2.webp" type="image/webp" />
              <img src="/wp-content/themes/talentsy/new-age/dist/images/s1-2.png" alt="" loading="lazy" class="s1-card__img" />
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
              <source srcset="/wp-content/themes/talentsy/new-age/dist/images/s1-3.webp" type="image/webp" />
              <img src="/wp-content/themes/talentsy/new-age/dist/images/s1-3.png" alt="" loading="lazy" class="s1-card__img" />
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
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/s1-1.webp" type="image/webp" />
                  <img src="/wp-content/themes/talentsy/new-age/dist/images/s1-1.png" alt="" loading="lazy" class="s1-card__img" />
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
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/s1-2.webp" type="image/webp" />
                  <img src="/wp-content/themes/talentsy/new-age/dist/images/s1-2.png" alt="" loading="lazy" class="s1-card__img" />
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
                  <source srcset="/wp-content/themes/talentsy/new-age/dist/images/s1-3.webp" type="image/webp" />
                  <img src="/wp-content/themes/talentsy/new-age/dist/images/s1-3.png" alt="" loading="lazy" class="s1-card__img" />
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
  </section>

  <section class="section s2 s2-2-hg8ap7v1d">
    <div class="container-main">
      <h2 class="size-48 text-center mb-60">
        Применяйте полученные знания<br />
        <span class="color-black-50">для жизни и карьеры</span>
      </h2>
      <div class="grid-column-2 mb-40">
        <picture style="display: block">
          <source srcset="/wp-content/themes/talentsy/new-age/dist/images/girls-hg8ap7v1d.webp" type="image/webp" />
          <img src="/wp-content/themes/talentsy/new-age/dist/images/girls-hg8ap7v1d.png" alt="" loading="lazy" class="s2-2-img-hg8ap7v1d" />
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
  </section>

  <section class="s16-hg8ap7v1d section section-grey pt-0">
    <div class="container-main">
      <h2 class="size-43 s16-title-hg8ap7v1d">
        <span class="span-grey">Наши выпускники получают</span> 2 диплома <br />
        <span class="span-1">Российский</span> <span class="s16-nowrap-hg8ap7v1d">и <span class="span-2">Международный</span></span>
      </h2>
      <div class="s16-diploma-block-hg8ap7v1d diploma-block diploma-block-program block-gray">
        <div class="diploma-logo">
          <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/diploma-logo-1.svg" alt="" />
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
            <source srcset="/wp-content/themes/talentsy/new-age/dist/images/diploma-pic-1.webp" type="image/webp" />
            <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/diploma-pic-1.jpg" alt="" class="mb-10" />
          </picture>
        </div>
      </div>
      <div class="s16-diploma-block-hg8ap7v1d s16-diploma-block-black-hg8ap7v1d diploma-block diploma-block-black diploma-block-program">
        <div class="diploma-logo">
          <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/diploma-logo-2.svg" alt="" />
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
            <source srcset="/wp-content/themes/talentsy/new-age/dist/images/diploma-pic-2.webp" type="image/webp" />
            <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/diploma-pic-2.png" alt="" />
          </picture>
        </div>
      </div>
    </div>
  </section>

  <section class="s28-hg8ap7v1d section">
    <div class="container-main">
      <div class="s28-wrapper-hg8ap7v1d mb-20">
        <div class="s28-title-hg8ap7v1d mb-60">
          <h2 class="size-48 fw-500">После занятий и даже завершения обучения вы не одни</h2>
          <p class="">вокруг вас <span class="fw-700">онлайн-кампус Talentsy:</span> клубы, встречи, дискуссии, поддержка и постоянное развитие</p>
        </div>
        <div class="s28-swiper-container-hg8ap7v1d">
          <div class="swiper-arrow swiper-arrow-prev icon" style="--icon: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgMTJMMjAgMTIiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8cGF0aCBkPSJNMTEgMTlMNCAxMkwxMSA1IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KPC9zdmc+')"></div>
          <div class="swiper s28-swiper-hg8ap7v1d">
            <div class="s28-list-hg8ap7v1d swiper-wrapper">
              <div class="swiper-slide s28-slide-hg8ap7v1d">
                <img src="/wp-content/themes/talentsy/new-age/dist/images/s28-slide-1-img-hg8ap7v1d.png" alt="" />
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
                <img src="/wp-content/themes/talentsy/new-age/dist/images/s28-slide-2-img-hg8ap7v1d.png" alt="" />
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
                <img src="/wp-content/themes/talentsy/new-age/dist/images/s28-slide-3-img-hg8ap7v1d.png" alt="" />
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
                <img src="/wp-content/themes/talentsy/new-age/dist/images/s28-slide-4-img-hg8ap7v1d.png" alt="" />
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
                <img src="/wp-content/themes/talentsy/new-age/dist/images/s28-slide-5-img-hg8ap7v1d.png" alt="" />
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
          <div class="swiper-arrow swiper-arrow-next icon" style="--icon: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDEyTDQgMTIiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8cGF0aCBkPSJNMTMgMTlMMjAgMTJMMTMgNSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMS41Ii8+Cjwvc3ZnPg==')"></div>
        </div>
      </div>
      <div class="s28-content-hg8ap7v1d">
        <div class="s28-left-hg8ap7v1d">
          <img class="mb-20" src="/wp-content/themes/talentsy/new-age/dist/images/s28-img-hg8ap7v1d.jpg" alt="" />
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
  </section>

  <section class="s17-hg8ap7v1d section section-grey">
    <div class="container-main">
      <h3 class="s17-title-hg8ap7v1d font-Atyp size-48 fw-500 mb-30">Профессиональные партнерства Talentsy</h3>
      <p class="s17-text-hg8ap7v1d size-24 mb-60">Мы сотрудничаем с международными ассоциациями, чтобы ваши знания имели вес в любой стране</p>
      <div class="s17-top-list-hg8ap7v1d d-only-flex-hg8ap7v1d">
        <div class="s17-top-item-hg8ap7v1d">
          <img class="s17-top-item-img-hg8ap7v1d" src="/wp-content/themes/talentsy/new-age/dist/images/s17-img-1-hg8ap7v1d.png" alt="" />
          <p class="s17-top-item-text-hg8ap7v1d">Международная федерация коучинга (ICF)</p>
        </div>
        <div class="s17-top-item-hg8ap7v1d">
          <img class="s17-top-item-img-hg8ap7v1d" src="/wp-content/themes/talentsy/new-age/dist/images/s17-img-2-hg8ap7v1d.png" alt="" />
          <p class="s17-top-item-text-hg8ap7v1d">
            Open European Academy<br />
            (Прага)
          </p>
        </div>
        <div class="s17-top-item-hg8ap7v1d">
          <img class="s17-top-item-img-hg8ap7v1d" src="/wp-content/themes/talentsy/new-age/dist/images/s17-img-3-hg8ap7v1d.png" alt="" />
          <p class="s17-top-item-text-hg8ap7v1d">IPHM и CPD (аккредитующие центры Великобритании)</p>
        </div>
      </div>

      <div class="s17-bottom-list-hg8ap7v1d accordion d-only-flex-hg8ap7v1d">
        <div class="s17-bottom-item-hg8ap7v1d accordion-item">
          <img class="s17-bottom-img-hg8ap7v1d" src="/wp-content/themes/talentsy/new-age/dist/images/s17-img-4-hg8ap7v1d.png" alt="" />
          <div class="s17-bottom-title-hg8ap7v1d accordion-head">
            <h4>Мы — организационный член Международной ассоциации развития гештальт-терапии (IAAGT)</h4>
            <div class="icon accordion-icon" style="--icon: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUwxMS4yOTI5IDE0LjI5MjlDMTEuNjI2MiAxNC42MjYyIDExLjc5MjkgMTQuNzkyOSAxMiAxNC43OTI5QzEyLjIwNzEgMTQuNzkyOSAxMi4zNzM4IDE0LjYyNjIgMTIuNzA3MSAxNC4yOTI5TDE4IDkiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==')"></div>
          </div>
          <div class="accordion-content">
            <div class="accordion-content__block">
              <p class="s17-bottom-text-hg8ap7v1d">Это сотрудничество открывает для нас уникальные возможности: обмен опытом и лучшими практиками с ведущими специалистами со всего мира, доступ к новейшим исследованиям, научным статьям, а также участие в конференциях и мероприятиях IAAGT.  </p>
              <p class="s17-bottom-text-hg8ap7v1d">Кроме того, мы можем реализовывать совместные проекты с экспертами в области гештальт-терапии, что помогает развивать профессиональное сообщество.</p>
            </div>
          </div>
        </div>
        <div class="s17-bottom-item-hg8ap7v1d accordion-item">
          <img class="s17-bottom-img-hg8ap7v1d" src="/wp-content/themes/talentsy/new-age/dist/images/s17-img-5-hg8ap7v1d.png" alt="" />
          <div class="s17-bottom-title-hg8ap7v1d accordion-head">
            <h4>Партнёры Ассоциации практических психологов и коучей (АППК)</h4>
            <div class="icon accordion-icon" style="--icon: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUwxMS4yOTI5IDE0LjI5MjlDMTEuNjI2MiAxNC42MjYyIDExLjc5MjkgMTQuNzkyOSAxMiAxNC43OTI5QzEyLjIwNzEgMTQuNzkyOSAxMi4zNzM4IDE0LjYyNjIgMTIuNzA3MSAxNC4yOTI5TDE4IDkiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==')"></div>
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
          <img class="s17-bottom-img-hg8ap7v1d" src="/wp-content/themes/talentsy/new-age/dist/images/s17-img-6-hg8ap7v1d.png" alt="" />
          <div class="s17-bottom-title-hg8ap7v1d accordion-head">
            <h4>Сотрудничаем с Ассоциацией профессиональных психологов и психотерапевтов</h4>
            <div class="icon accordion-icon" style="--icon: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUwxMS4yOTI5IDE0LjI5MjlDMTEuNjI2MiAxNC42MjYyIDExLjc5MjkgMTQuNzkyOSAxMiAxNC43OTI5QzEyLjIwNzEgMTQuNzkyOSAxMi4zNzM4IDE0LjYyNjIgMTIuNzA3MSAxNC4yOTI5TDE4IDkiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==')"></div>
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
              <img class="s17-top-item-img-hg8ap7v1d" src="/wp-content/themes/talentsy/new-age/dist/images/s17-img-1-hg8ap7v1d.png" alt="" />
              <p class="s17-top-item-text-hg8ap7v1d">Международная федерация коучинга (ICF)</p>
            </div>
            <div class="s17-top-item-hg8ap7v1d swiper-slide">
              <img class="s17-top-item-img-hg8ap7v1d" src="/wp-content/themes/talentsy/new-age/dist/images/s17-img-2-hg8ap7v1d.png" alt="" />
              <p class="s17-top-item-text-hg8ap7v1d">
                Open European Academy<br />
                (Прага)
              </p>
            </div>
            <div class="s17-top-item-hg8ap7v1d swiper-slide">
              <img class="s17-top-item-img-hg8ap7v1d" src="/wp-content/themes/talentsy/new-age/dist/images/s17-img-3-hg8ap7v1d.png" alt="" />
              <p class="s17-top-item-text-hg8ap7v1d">IPHM и CPD (аккредитующие центры Великобритании)</p>
            </div>
            <div class="s17-bottom-item-hg8ap7v1d accordion-item swiper-slide">
              <img class="s17-bottom-img-hg8ap7v1d" src="/wp-content/themes/talentsy/new-age/dist/images/s17-img-4-hg8ap7v1d.png" alt="" />
              <div class="s17-bottom-title-hg8ap7v1d accordion-head">
                <h4>Мы — организационный член Международной ассоциации развития гештальт-терапии (IAAGT)</h4>
                <div class="icon accordion-icon" style="--icon: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUwxMS4yOTI5IDE0LjI5MjlDMTEuNjI2MiAxNC42MjYyIDExLjc5MjkgMTQuNzkyOSAxMiAxNC43OTI5QzEyLjIwNzEgMTQuNzkyOSAxMi4zNzM4IDE0LjYyNjIgMTIuNzA3MSAxNC4yOTI5TDE4IDkiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==')"></div>
              </div>
              <div class="accordion-content">
                <div class="accordion-content__block">
                  <p class="s17-bottom-text-hg8ap7v1d">Это сотрудничество открывает для нас уникальные возможности: обмен опытом и лучшими практиками с ведущими специалистами со всего мира, доступ к новейшим исследованиям, научным статьям, а также участие в конференциях и мероприятиях IAAGT. </p>
                  <p class="s17-bottom-text-hg8ap7v1d">Кроме того, мы можем реализовывать совместные проекты с экспертами в области гештальт-терапии, что помогает развивать профессиональное сообщество.</p>
                </div>
              </div>
            </div>
            <div class="s17-bottom-item-hg8ap7v1d accordion-item swiper-slide">
              <img class="s17-bottom-img-hg8ap7v1d" src="/wp-content/themes/talentsy/new-age/dist/images/s17-img-5-hg8ap7v1d.png" alt="" />
              <div class="s17-bottom-title-hg8ap7v1d accordion-head">
                <h4>Партнёры Ассоциации практических психологов и коучей (АППК)</h4>
                <div class="icon accordion-icon" style="--icon: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUwxMS4yOTI5IDE0LjI5MjlDMTEuNjI2MiAxNC42MjYyIDExLjc5MjkgMTQuNzkyOSAxMiAxNC43OTI5QzEyLjIwNzEgMTQuNzkyOSAxMi4zNzM4IDE0LjYyNjIgMTIuNzA3MSAxNC4yOTI5TDE4IDkiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==')"></div>
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
              <img class="s17-bottom-img-hg8ap7v1d" src="/wp-content/themes/talentsy/new-age/dist/images/s17-img-6-hg8ap7v1d.png" alt="" />
              <div class="s17-bottom-title-hg8ap7v1d accordion-head">
                <h4>Сотрудничаем с Ассоциацией профессиональных психологов и психотерапевтов</h4>
                <div class="icon accordion-icon" style="--icon: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUwxMS4yOTI5IDE0LjI5MjlDMTEuNjI2MiAxNC42MjYyIDExLjc5MjkgMTQuNzkyOSAxMiAxNC43OTI5QzEyLjIwNzEgMTQuNzkyOSAxMi4zNzM4IDE0LjYyNjIgMTIuNzA3MSAxNC4yOTI5TDE4IDkiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==')"></div>
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
  </section>

  <section class="section s29-hg8ap7v1d">
    <div class="container-main">
      <div class="block-gray block-gray_main mb-30">
        <h2 class="size-48 font-Atyp mb-20">Выпускники программы получают членство в ОППЛ*</h2>
        <p class="size-16 mb-60">*Общероссийская профессиональная психотерапевтическая Лига</p>

        <div class="general-blocks s29-general-blocks-hg8ap7v1d d-only-flex-hg8ap7v1d">
          <div class="s29-general-block-hg8ap7v1d general-block_row general-block_transparent general-block_100 general-block_border">
            <div class="general-block_row-pic">
              <picture>
                <source srcset="https://talentsy.ru/wp-content/themes/talentsy/img/program/psychologist_consultant/general-7.webp" type="image/webp" />
                <img src="https://talentsy.ru/wp-content/themes/talentsy/img/program/psychologist_consultant/general-7.png" alt="" width="86" height="118" loading="lazy" />
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
                    <source srcset="https://talentsy.ru/wp-content/themes/talentsy/img/program/psychologist_consultant/general-7.webp" type="image/webp" />
                    <img src="https://talentsy.ru/wp-content/themes/talentsy/img/program/psychologist_consultant/general-7.png" alt="" width="86" height="118" loading="lazy" />
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
  </section>

  <section class="section s30-hg8ap7v1d pt-0 mb-20-m">
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
                <div class="clue-icon clue-icon_hg8ap7v1d icon" style="--icon: url('/wp-content/themes/talentsy/new-age/dist/images/help_circle_hg8ap7v1d.png')"></div>
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
              <img src="/wp-content/themes/talentsy/new-age/dist/images/label2.png" alt="" />
            </div>
            <div class="content-why__description"><span class="fw-600">Учим студентов привлекать клиентов</span> и строить личный бренд</div>
          </div>
          <div class="content-why s30-content-why-hg8ap7v1d">
            <div class="content-why__head">100+</div>
            <div class="content-why__description"><span class="fw-600">Преподавателей:</span> звезды отрасли, эксперты-практики с опытом 10+ лет, авторы методик и научных статей</div>
          </div>

          <div class="content-why s30-content-why-hg8ap7v1d">
            <div class="content-why__head">
              <img src="/wp-content/themes/talentsy/new-age/dist/images/label3.png" alt="" />
            </div>
            <div class="content-why__description">
              <span class="fw-600">Статус резидента «Сколково»</span> <br />
              Мы - инновационная IT-компания, которая развивает EdTech-продукты
            </div>
          </div>

          <div class="content-why s30-content-why-hg8ap7v1d">
            <div class="content-why__head">
              <img src="/wp-content/themes/talentsy/new-age/dist/images/label4.png" alt="" />
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
  </section>

  <section class="section pt-0">
    <div class="container-main">
      <form <?= $formParmas['tag']; ?> class="form-get form-get_new form-get_inherit <?= $formParmas['class']; ?>">
        <div class="form-get__start form-get__start_between">
          <div>
            <h3 class="size-32 size-26-mobile line-h-1-2 fw-500 font-Atyp mb-20 letter-1">Оставьте заявку<br class="m-only-hg8ap7v1d"> сейчас и мы <span class="color-black-50">забронируем для вас скидку</span> на ближайший поток</h3>
          </div>
        </div>
        <div class="form-get__main">
          <div class="form-item">
            <input type="text" name="<?= $formParmas['names']['name']; ?>" class="input input-light" required placeholder="Ваше имя" />
          </div>
          <div class="form-item">
            <input type="number" class="input input-light" placeholder="Номер телефона" maxlength="18" pattern="^[0-9]{3,18}$" name="<?= $formParmas['names']['phone']; ?>" data-mask="tel" required />
          </div>
          <div class="form-item">
            <input type="email" name="<?= $formParmas['names']['email']; ?>" class="input input-light" placeholder="Почта" required />
          </div>
          <div class="form-flex">
            <button type="submit" class="form-button-hg8ap7v1d button h-62 button-main button-purple button-p-32">Забронировать</button>
          </div>

          <? get_template_part( 'inc/components/form/agreed' ); ?>
        </div>
      <?= $formParmas['hiddens']; ?></form>
    </div>
  </section>

  <section class="section s31-hg8ap7v1d pt-0">
    <div class="container-main">
      <h2 class="size-48 mb-30">Истории успеха наших выпускников</h2>
      <div class="swiper-container swiper-container__professional mb-40">
        <div class="swiper-arrow swiper-arrow-prev icon" style="--icon: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgMTJMMjAgMTIiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8cGF0aCBkPSJNMTEgMTlMNCAxMkwxMSA1IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KPC9zdmc+')"></div>
        <div class="swiper-professional swiper">
          <div class="swiper-wrapper">
            <div class="swiper-slide">
              <div class="swiper-professional__item">
                <div class="swiper-professional__pic">
                  <picture>
                    <source srcset="/wp-content/themes/talentsy/new-age/dist/images/professional-7.webp" type="image/webp">
                    <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/professional-7.jpg" alt="">
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
                      <img loading="lazy" src="https://talentsy.ru/wp-content/themes/talentsy/img/main-page/plus-empty-black.svg" alt="">
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
                      <img loading="lazy" src="https://talentsy.ru/wp-content/themes/talentsy/img/main-page/plus-fill-black.svg" alt="">
                      До прохождения курса
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      Начала обучение «с нуля». Постоянно бесплатно «консультировала» друзей по их проблемам, понимала, что не хватает знаний. Хотелось сделать психологию своей профессией.
                    </div>
                  </div>
                  <div class="swiper-professional__line swiper-professional__line_end">
                    <div class="swiper-professional__line-label  fw-600 size-20">
                      <img loading="lazy" src="https://talentsy.ru/wp-content/themes/talentsy/img/main-page/plus-empty-black.svg" alt="">
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
                                        <a data-type="iframe" data-width="800" data-height="450" href="https://kinescope.io/4hvxJAGETGeFtzePLpoEDc" data-fancybox="video-gallery" class="button button-border-black icon" style="--icon: url('https://talentsy.ru/wp-content/themes/talentsy/img/main-page/icon/icon-play.svg')">
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
                    <source srcset="/wp-content/themes/talentsy/new-age/dist/images/professional-8.webp" type="image/webp">
                    <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/professional-8.jpg" alt="">
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
                      <img loading="lazy" src="https://talentsy.ru/wp-content/themes/talentsy/img/main-page/plus-empty-black.svg" alt="">
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
                      <img loading="lazy" src="https://talentsy.ru/wp-content/themes/talentsy/img/main-page/plus-fill-black.svg" alt="">
                      До прохождения курса
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      Хотела работать с людьми, но не было специального психологического образования. Сначала совмещала психологию с бизнесом. Средний чек за консультацию был около 300 рублей, работала по сарафанному радио и проводила консультации после основной работы в бизнесе. Работала очень много, включая выходные.
                    </div>
                  </div>
                  <div class="swiper-professional__line swiper-professional__line_end">
                    <div class="swiper-professional__line-label  fw-600 size-20">
                      <img loading="lazy" src="https://talentsy.ru/wp-content/themes/talentsy/img/main-page/plus-empty-black.svg" alt="">
                      После
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      Профессиональный психолог, бизнес продала. Активно ведет социальные сети и развивает свой бренд. Появилась своя команда, которая помогает с продвижением. Создала поток клиентов, который продолжает расти, сейчас имеет более 100 клиентов, средний чек – от 6000руб/час. Участвует в реалити-шоу и делится своими знаниями с начинающими психологами.
                    </div>
                  </div>
                  <!-- <div class="swiper-professional__line swiper-professional__line_align-center">
                                    <div class="swiper-professional__line-label">
                                        <a data-type="iframe" data-width="800" data-height="450" href="https://kinescope.io/exTnmmBSAwmsbiybVBnt4u" data-fancybox="video-gallery" class="button button-border-black icon" style="--icon: url('https://talentsy.ru/wp-content/themes/talentsy/img/main-page/icon/icon-play.svg')">
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
                    <source srcset="/wp-content/themes/talentsy/new-age/dist/images/professional-9.webp" type="image/webp">
                    <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/professional-9.jpg" alt="">
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
                      <img loading="lazy" src="https://talentsy.ru/wp-content/themes/talentsy/img/main-page/plus-empty-black.svg" alt="">
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
                      <img loading="lazy" src="https://talentsy.ru/wp-content/themes/talentsy/img/main-page/plus-fill-black.svg" alt="">
                      До прохождения курса
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      <b>Профессионально не консультировала.</b> Изучала психологию для себя, знания были хаотичными и несистемными. 9 лет пребывала в абьюзивных отношениях и созависимости, было недопонимание в семье, чувствовала пустоту и отсутствие самореализации.
                    </div>
                  </div>
                  <div class="swiper-professional__line swiper-professional__line_end">
                    <div class="swiper-professional__line-label  fw-600 size-20">
                      <img loading="lazy" src="https://talentsy.ru/wp-content/themes/talentsy/img/main-page/plus-empty-black.svg" alt="">
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
                                        <a data-type="iframe" data-width="800" data-height="450" href="https://kinescope.io/6JKpXM1c4sqwLSTjKRxuJ6" data-fancybox="video-gallery" class="button button-border-black icon" style="--icon: url('https://talentsy.ru/wp-content/themes/talentsy/img/main-page/icon/icon-play.svg')">
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
                    <source srcset="/wp-content/themes/talentsy/new-age/dist/images/professional-10.webp" type="image/webp">
                    <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/professional-10.jpg" alt="">
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
                      <img loading="lazy" src="https://talentsy.ru/wp-content/themes/talentsy/img/main-page/plus-empty-black.svg" alt="">
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
                      <img loading="lazy" src="https://talentsy.ru/wp-content/themes/talentsy/img/main-page/plus-fill-black.svg" alt="">
                      До прохождения курса
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      Таможенный брокер с 20-ти летним стажем. Выгорела на работе, стала погружаться в психологию, чтобы решить эту проблему. Параллельно захотела освоить новую профессию. Читала много литературы по теме, но структура в голове не складывалась. Так оказалась в онлайн-университете «Talentsy». Пришла за излечением себя и за знаниями.
                    </div>
                  </div>
                  <div class="swiper-professional__line swiper-professional__line_end">
                    <div class="swiper-professional__line-label  fw-600 size-20">
                      <img loading="lazy" src="https://talentsy.ru/wp-content/themes/talentsy/img/main-page/plus-empty-black.svg" alt="">
                      После
                    </div>
                    <div class="swiper-professional__line-content size-16">
                      Практикующий психолог, имеет более 20 клиентов. Совмещает психологию с работой в таможне, нашла баланс, при котором работает, не выгорая. В Talentsy получила первых клиентов, преодолела неуверенность, осознала свои сильные стороны, как личности. Работает в интегративном подходе, чаще всего с эмоциями и мышлением. Наиболее частые запросы клиентов - тревожные расстройства, панические атаки, ОКР и депрессия, потеря смыслов, проблемы в отношениях. В комплексе получила не только обучение, но и излечение. А также новую профессию, которая изменила взгляд на саму себя.
                    </div>
                  </div>
                  <!-- <div class="swiper-professional__line swiper-professional__line_align-center">
                                  <div class="swiper-professional__line-label">
                                      <a data-type="iframe" data-width="800" data-height="450" href="https://kinescope.io/6JKpXM1c4sqwLSTjKRxuJ6" data-fancybox="video-gallery" class="button button-border-black icon" style="--icon: url('https://talentsy.ru/wp-content/themes/talentsy/img/main-page/icon/icon-play.svg')">
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
                    <source srcset="/wp-content/themes/talentsy/new-age/dist/images/professional-11.webp" type="image/webp">
                    <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/professional-11.jpg" alt="">
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
                      <img loading="lazy" src="https://talentsy.ru/wp-content/themes/talentsy/img/main-page/plus-empty-black.svg" alt="">
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
                      <img loading="lazy" src="https://talentsy.ru/wp-content/themes/talentsy/img/main-page/plus-fill-black.svg" alt="">
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
                      <img loading="lazy" src="https://talentsy.ru/wp-content/themes/talentsy/img/main-page/plus-empty-black.svg" alt="">
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
                                      <a data-type="iframe" data-width="800" data-height="450" href="https://kinescope.io/6JKpXM1c4sqwLSTjKRxuJ6" data-fancybox="video-gallery" class="button button-border-black icon" style="--icon: url('https://talentsy.ru/wp-content/themes/talentsy/img/main-page/icon/icon-play.svg')">
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
        <div class="swiper-arrow swiper-arrow-next icon" style="--icon: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDEyTDQgMTIiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8cGF0aCBkPSJNMTMgMTlMMjAgMTJMMTMgNSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMS41Ii8+Cjwvc3ZnPg==')"></div>
      </div>
    </div>
  </section>

  <section class="s18-hg8ap7v1d section pt-0 section-reviews-slider" id="reviews">
    <div class="container-main">
      <div class="s18-top-hg8ap7v1d">
        <h2 class="size-48 fw-500 line-h-1 mb-40">
          Студенты довольны обучением
        </h2>
      </div>
      <div class="getreview-widget" data-widget-id="lkdsbysytBSxgsk9"></div>
    </div>
  </section>

  <section class="section s34-hg8ap7v1d section-bg">
    <div class="container-main">
      <h2 class="size-48 mb-30">Научим зарабатывать <span class="color-black-50">на новой профессии</span></h2>
      <div class="swiper-case-container mb-60">
        <div class="swiper-arrow swiper-arrow-prev icon" style="--icon: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgMTJMMjAgMTIiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8cGF0aCBkPSJNMTEgMTlMNCAxMkwxMSA1IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KPC9zdmc+')"></div>
        <div class="swiper swiper-case">
          <div class="swiper-wrapper">
            <div class="swiper-slide">
              <div class="case-item">
                <div class="case-item__pic">
                  <picture>
                    <source srcset="/wp-content/themes/talentsy/new-age/dist/images/case-1.webp" type="image/webp"><img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/case-1.jpg" alt="">
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
                    <source srcset="/wp-content/themes/talentsy/new-age/dist/images/case-2.webp" type="image/webp"><img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/case-2.jpg" alt="">
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
                    <source srcset="/wp-content/themes/talentsy/new-age/dist/images/case-3.webp" type="image/webp"><img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/case-3.jpg" alt="">
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
                    <source srcset="/wp-content/themes/talentsy/new-age/dist/images/case-4.webp" type="image/webp"><img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/case-4.jpg" alt="">
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
                    <source srcset="/wp-content/themes/talentsy/new-age/dist/images/case-5.webp" type="image/webp"><img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/case-5.jpg" alt="">
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
                    <source srcset="/wp-content/themes/talentsy/new-age/dist/images/case-6.webp" type="image/webp"><img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/case-6.jpg" alt="">
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
        <div class="swiper-arrow swiper-arrow-next icon" style="--icon: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDEyTDQgMTIiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8cGF0aCBkPSJNMTMgMTlMMjAgMTJMMTMgNSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMS41Ii8+Cjwvc3ZnPg==')"></div>
      </div>

    </div>
  </section>

  <section class="s19-hg8ap7v1d section">
    <div class="container-main">
      <h2 class="size-48 text-center mb-40 text-left-mobile">Более 2 000 отзывов на независимых площадках</h2>
      <div class="grade mt-0" id="grade">
        <div class="grade-swiper grade-grid">
          <div>
            <a href="https://yandex.ru/maps/org/talentsy/221156808322/reviews/" class="grade-item" target="_blank">
              <span class="grade-item__number"><span class="data">5</span>.0</span>
              <span class="grade-item__count">182 отзыва</span>
              <span class="grade-item__pic">
                <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/map.svg" alt="" />
              </span>
            </a>
          </div>
          <div>
            <a href="https://www.sravni.ru/shkola/talentsy/otzyvy/ " class="grade-item" target="_blank">
              <span class="grade-item__number">4.<span class="data">9</span></span>
              <span class="grade-item__count">587 отзывов</span>
              <span class="grade-item__pic">
                <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/sravni.svg" alt="" />
              </span>
            </a>
          </div>
          <div>
            <a href="https://digital-academy.ru/reviews/talentsy" class="grade-item" target="_blank">
              <span class="grade-item__number">4.<span class="data">8</span></span>
              <span class="grade-item__count">40 отзывов</span>
              <span class="grade-item__pic">
                <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/dacademy.svg" alt="" />
              </span>
            </a>
          </div>
          <div>
            <a href="https://otzovik.com/reviews/talentsy_ru-onlayn_obuchenie_tvorchestvu/" class="grade-item" target="_blank">
              <span class="grade-item__number">4.<span class="data">7</span></span>
              <span class="grade-item__count">237 отзывов</span>
              <span class="grade-item__pic">
                <img loading="lazy" src="/wp-content/themes/talentsy/new-age/dist/images/reviews.svg" alt="" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section-bg s32-hg8ap7v1d" id="tariff">
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
            <div class="size-20 mb-10 fw-600 size-20-mobile"><?= sn($coursePrices['newPrice'], true) ?></div>
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
                <img src="/wp-content/themes/talentsy/new-age/dist/images/image-fire-hg8ap7v1d.png" alt="" width="11" height="14" />
                Скидка действует до <?= date('d.m.Y', strtotime('+4 days')); ?>
              </div>
              <div class="percent">— 40%</div>
            </div>
            <div class="price-old size-18"><span><?= $coursePrices['oldPrice']; ?></span>&nbsp;₽/мес</div>
            <div class="price-current">от&nbsp;<span class="jsPPSumm jsPPSummOne"><?= $coursePrices['newPrice'] ?></span>&nbsp;₽/мес</div>
            <p class="size-12 color-gray-2">при рассрочке на 24 месяца</p>
          </div>
        </div>
        <div class="callback-column">
          <div class="size-28 font-manrope line-h-1-2 letter-1 fw-600 mb-40">
            Забронировать место на курсе
          </div>
          <form id="go-form" <?= $formParmas['tag']; ?> class="course-block__form <?= $formParmas['class']; ?> special-pp-selector" special-pp-selector=".jsPPSummOne">
            <div class="course-block__item">
              <input name="<?= $formParmas['names']['name']; ?>" required type="text" class="input input-light" placeholder="Ваше имя">
            </div>
            <div class="course-block__item">
              <input name="<?= $formParmas['names']['phone']; ?>" required type="tel" class="input input-light" placeholder="Номер телефона">
            </div>
            <div class="course-block__item">
              <input name="<?= $formParmas['names']['email']; ?>" required type="text" class="input input-light" placeholder="Почта">
            </div>

            <div class="promo-container course-block__item course-block__item_promo">
             <button type="button" class="promo-button icon" style="--icon: url('/wp-content/themes/talentsy/new-age/dist/images/icon/icon-arrow-down.svg')">
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

            <? get_template_part( 'inc/components/form/agreed' ); ?>
          <?= $formParmas['hiddens']; ?></form>
        </div>
      </div>
    </div>
  </section>

  <section class="s22-hg8ap7v1d section section-white">
    <div class="container-main">
      <h2 class="size-48 font-Atyp fw-500 line-h-1 mb-60">Часто задаваемые вопросы</h2>
      <div class="accordion accordion-faq mb-60">
          <?php
          foreach ( $faq as $el ): ?>
              <div class="accordion-item">
                  <div class="accordion-head">
                      <h3 class="size-20 fw-600"><?= $el['header'] ?></h3>
                      <div class="icon accordion-icon"
                           style="--icon: url(/wp-content/themes/talentsy/new-age/dist/images/icon/icon-arrow-down.svg)"></div>
                  </div>
                  <div class="accordion-content" style="height: 0;">
                      <div class="accordion-content__block">
                          <?= $el['text'] ?>
                      </div>
                  </div>
              </div>
          <?php
          endforeach; ?>
      </div>
    </div>
  </section>
</main>

</div>

<script src="https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.js"></script>
<script>
  if (document.querySelector(".s1-swiper-hg8ap7v1d")) {
    const swiper = new Swiper(".s1-swiper-hg8ap7v1d", {
      slidesPerView: 1.13,
      spaceBetween: 16,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      breakpoints: {
        769: {
          slidesPerView: 4,
          spaceBetween: 20,
          allowTouchMove: false,
        },
      },
    });
  }

  if (document.querySelector(".s1-2-swiper-hg8ap7v1d")) {
    const swiper = new Swiper(".s1-2-swiper-hg8ap7v1d", {
      slidesPerView: 1.13,
      spaceBetween: 16,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      breakpoints: {
        769: {
          slidesPerView: 2,
          spaceBetween: 20,
          allowTouchMove: false,
        },
      },
    });
  }

  if (document.querySelector(".s25-swiper-hg8ap7v1d")) {
    const swiper = new Swiper(".s25-swiper-hg8ap7v1d", {
      slidesPerView: 1.13,
      spaceBetween: 16,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      breakpoints: {
        769: {
          slidesPerView: 4,
          spaceBetween: 20,
          allowTouchMove: false,
        },
      },
    });
  }

  if (document.querySelector(".s17-swiper-hg8ap7v1d")) {
    const swiper = new Swiper(".s17-swiper-hg8ap7v1d", {
      slidesPerView: 1.13,
      spaceBetween: 16,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      breakpoints: {
        769: {
          slidesPerView: 4,
          spaceBetween: 20,
          allowTouchMove: false,
        },
      },
    });
  }

  if (document.querySelector(".s29-swiper-hg8ap7v1d")) {
    const swiper = new Swiper(".s29-swiper-hg8ap7v1d", {
      slidesPerView: 1.13,
      spaceBetween: 16,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      breakpoints: {
        769: {
          slidesPerView: 'auto',
          spaceBetween: 20,
          allowTouchMove: false,
        },
      },
    });
  }

  if (document.querySelector(".s28-swiper-hg8ap7v1d")) {
    const swiper = new Swiper(".s28-swiper-hg8ap7v1d", {
      slidesPerView: 1.13,
      spaceBetween: 16,
      navigation: {
        prevEl: ".s28-swiper-container-hg8ap7v1d .swiper-arrow-prev",
        nextEl: ".s28-swiper-container-hg8ap7v1d .swiper-arrow-next",
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      breakpoints: {
        320: {
          spaceBetween: 10,
          slidesPerView: 1.10,
        },
        600: {
          spaceBetween: 10,
          slidesPerView: 1.5,
        },
        991: {
          spaceBetween: 20,
          slidesPerView: 2,
        },
      },
    });
  }

  $(document).ready(function () {
      document.querySelectorAll(".earnings-slide").forEach((e => {
          e.noUiSlider.on("update", () => incomeCalc())
      }))
  })
</script>

<? foreach ( $teachers as $teacher ) :
	$fields = get_fields( $teacher->ID );
	?>
    <div id="<?= 'teacher' . $teacher->ID ?>" aria-hidden="true" class="popup popup-specialist">
        <div class="popup__wrapper">
            <div class="popup__content">
                <button data-close type="button" class="popup__close icon" style="--icon: url(/wp-content/themes/talentsy/new-age/dist/images/icon/icon-close.svg)"></button>
                <div class="popup-spec">
                    <div class="popup-spec__pic">
                        <img loading="lazy" src="<?= $fields['photo'] ?>" alt="">
                    </div>
                    <div class="popup-spec__content">
                        <div class="size-34 mb-20"><?= $fields['name'] . ' ' . $fields['surname'] ?></div>
                        <div class="size-20 fw-600 mb-20"> <?= $fields['regalia'] ?></div>
                        <div class="popup-spec__description">
							           <?= $fields['description'] ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
<?
endforeach;
get_template_part('inc/landing-breadcrumbs', null, ['psychology', 'Курсы психологии']);
?>
<script type="application/ld+json">
  <?= json_encode(['@context'=>'https://schema.org','@type'=>'Course','name'=>get_the_title(),'description'=>get_post_meta(get_the_ID(),'_yoast_wpseo_metadesc',true),'url'=>get_permalink(),'provider'=>['@id'=>'https://talentsy.ru/#organization'],'inLanguage'=>'ru'],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES) ?>
</script>

<?php get_footer('light'); ?>