/**
 * WordPress template parts used for preview rendering and PHP export.
 * These mirror the actual WP template parts on talentsy.ru.
 *
 * For PREVIEW: only technical parts (head/CSS/JS, body opening, scripts, closing tags).
 * Visible header bar and footer are NOT included — the landing has its own
 * "header" and "footer" blocks that handle those.
 *
 * For PHP EXPORT: get_header('light') and get_footer('light') are used as-is,
 * which include the visible header/footer on the WP side.
 */

// Technical head + body opening + wrapper (visible header handled by landing blocks)
export const WP_HEADER_LIGHT_HTML = `<!doctype html>
<html lang="ru-RU" class="nomarginwp">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="format-detection" content="telephone=no">

    <script type="module" crossorigin src="https://talentsy.ru/wp-content/themes/talentsy/dist/assets/main-29fc328e.js"><\/script>
    <link rel="modulepreload" href="https://talentsy.ru/wp-content/themes/talentsy/dist/assets/vendor-82507c16.js">
    <link rel="stylesheet" href="https://talentsy.ru/wp-content/themes/talentsy/dist/assets/main-af904025.css">
    <meta name='robots' content='noindex, follow' />

	<title>TEST NA &#8211; онлайн-университет Talentsy</title>
    <link rel='stylesheet' id='css-fix-css' href='https://talentsy.ru/wp-content/themes/talentsy/styles/fix.css?ver=3.6.3' type='text/css' media='all' />
    <link rel='stylesheet' id='css-fix-filippov-css' href='https://talentsy.ru/wp-content/themes/talentsy/styles/fix-filippov.css?ver=3.6.3' type='text/css' media='all' />
    <link rel='stylesheet' id='landings-css' href='https://talentsy.ru/wp-content/themes/talentsy/styles/landing.min.css?ver=3.6.3' type='text/css' media='all' />
    <link rel='stylesheet' id='css-base-na-css' href='https://talentsy.ru/wp-content/themes/talentsy/new-age/dist/style-hg8ap7v1d.css?ver=3.6.3' type='text/css' media='all' />
    <link rel='stylesheet' id='bvi-styles-css' href='https://talentsy.ru/wp-content/plugins/button-visually-impaired/assets/css/bvi.min.css?ver=2.3.0' type='text/css' media='all' />
    <script type="text/javascript" src="https://talentsy.ru/wp-content/themes/talentsy/js/custom/jquery-3.6.4.min.js?ver=3.6.4" id="jquery-js"><\/script>
    <link rel="icon" href="https://talentsy.ru/wp-content/uploads/2023/08/cropped-fv-32x32.png" sizes="32x32" />
    <link rel="icon" href="https://talentsy.ru/wp-content/uploads/2023/08/cropped-fv-192x192.png" sizes="192x192" />
    <link rel="apple-touch-icon" href="https://talentsy.ru/wp-content/uploads/2023/08/cropped-fv-180x180.png" />
    <meta name="msapplication-TileImage" content="https://talentsy.ru/wp-content/uploads/2023/08/cropped-fv-270x270.png" />
</head>

<body class="wp-singular page-template page-template-new-age page-template-na-demo page-template-new-agena-demo-php page page-id-42725 logged-in admin-bar no-customize-support wp-custom-logo wp-theme-talentsy program-light program-gray program-for action-start program-page">
<script>
    window.pageID = "42725";
    window.ajaxurl = "https://talentsy.ru/wp-admin/admin-ajax.php";
<\/script>

<div class="wrapper">`;

// Closing wrapper + WP scripts + closing tags (visible footer handled by landing blocks)
export const WP_FOOTER_LIGHT_HTML = `</div>
<script type="text/javascript" src="https://talentsy.ru/wp-content/themes/talentsy/js/custom/getReview.js?ver=3.6.3" id="get_review-js" async="async" data-wp-strategy="async"><\/script>
<script type="text/javascript" src="https://talentsy.ru/wp-content/themes/talentsy/js/custom/sombra.js?ver=3.6.3" id="js-sombra-js"><\/script>
<script type="text/javascript" src="https://talentsy.ru/wp-content/themes/talentsy/js/landing.min.js?ver=3.6.3" id="landings-js"><\/script>
<script type="text/javascript" id="bvi-script-js-extra">
/* <![CDATA[ */
var wp_bvi = {"option":{"theme":"white","font":"arial","fontSize":16,"letterSpacing":"normal","lineHeight":"normal","images":true,"reload":false,"speech":true,"builtElements":true,"panelHide":false,"panelFixed":true,"lang":"ru-RU"}};
//# sourceURL=bvi-script-js-extra
/* ]]> */
<\/script>
<script type="text/javascript" src="https://talentsy.ru/wp-content/plugins/button-visually-impaired/assets/js/bvi.min.js?ver=2.3.0" id="bvi-script-js"><\/script>
<script type="text/javascript" id="bvi-script-js-after">
/* <![CDATA[ */
var Bvi = new isvek.Bvi(wp_bvi.option);
//# sourceURL=bvi-script-js-after
/* ]]> */
<\/script>
</body>
</html>`;

// Breadcrumbs template - {{BREADCRUMB_SLUG}}, {{BREADCRUMB_TITLE}}, {{LANDING_TITLE}} are replaced at runtime
export const WP_BREADCRUMBS_HTML = `<div class="breadcrumbs-light">
    <div class="container-main">
        <nav class="breadcrumbs">
            <ul class="breadcrumb-items">
                <li class="breadcrumb-item">
                    <a href="/" class="breadcrumb-link">Главная</a>
                </li>
                <li class="breadcrumb-item">
                    <a href="/courses/" class="breadcrumb-link">Курсы</a>
                </li>
                <li class="breadcrumb-item">
                    <a href="https://talentsy.ru/courses/{{BREADCRUMB_SLUG}}/" class="breadcrumb-link">{{BREADCRUMB_TITLE}}</a>
                </li>
                <li class="breadcrumb-item">
                    <span>Личное: {{LANDING_TITLE}}</span>
                </li>
            </ul>
        </nav>
    </div>
</div>`;

// Agreed (consent) block HTML - used inside forms in preview
export const WP_AGREED_HTML = `<noindex>
        <div class="agreed__block agreed footer-agreed">
        <input type="checkbox" name="form_agreed" required class="agreed__checkbox checkbox-required" id="user_confirmed_94931183363179">
        <label class="agreed_label error-check checkbox-off" for="user_confirmed_94931183363179"></label>

        <div class="agreed_message">
            <span class="agreed__text">
                Отправляя данную форму, вы соглашаетесь с условиями <a class="agreed__link" href="https://talentsy.ru/legal/oferta/">оферты</a> и <a class="agreed__link" href="https://talentsy.ru/legal/policy/">политики обработки персональных данных</a>. Я даю свое согласие на <a class="agreed__link" href="https://talentsy.ru/legal/pd-agreement/">обработку персональных данных</a>.
            </span>
            <div class="error_agreed agreed__text">Вам нужно принять политику конфиденциальности</div>
        </div>
    </div>

    <div class="agreed__block agreed footer-agreed">
        <input type="hidden" name="form_agreed_2" value="nosms">
        <input type="checkbox" name="form_agreed_2" class="agreed__checkbox" value="sms" id="user_confirmed_12965939715344">
        <label class="agreed_label unreq checkbox-off" for="user_confirmed_12965939715344"></label>

        <div class="agreed_message">
            <span class="agreed__text">
                Я даю свое <a href="https://talentsy.ru/legal/mailing-agreement/" class="agreed__link">согласие</a> на получение рекламных и информационных рассылок.
            </span>
            <div class="error_agreed agreed__text" style="display: none;">Вам нужно выдать согласие</div>
        </div>
    </div>
</noindex>`;

// PHP code for forms - $isGetCourse + $formParmas block, copied from the WP etalon
export const WP_FORM_PARAMS_PHP = `
$isGetCourse   = get_field('is_gc');
if( $isGetCourse ):
    $formParmas = [
        'tag'   => 'action="https://lk.talentsy.ru/pl/lite/block-public/process-html?id='. get_field('getcourse_wid') .'" method="post" data-open-new-window="0"',
        'class' => '',
        'names' => [
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
`;
