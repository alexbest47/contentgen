export type CompiledLandingFile = {
  filename: string;
  mimeType: string;
  content: string;
};

export function compileLandingFile(
  blockHtmls: string[],
  landingName: string,
  landingType: "wordpress" | "s3" = "s3",
  options?: {
    wpTemplateName?: string | null;
    siteTitle?: string | null;
    s3CustomCss?: string | null;
    s3BodyClassExtra?: string | null;
    formType?: "getcourse" | "gateway" | null;
    getcourseActionId?: string | null;
    formDealName?: string | null;
    gatewayAlias?: string | null;
  },
) : CompiledLandingFile {
  const basePath = "/talentsy-template/";
  const assetBaseRaw = (import.meta.env.VITE_LANDING_ASSET_BASE_URL as string | undefined)?.trim()
    || `${window.location.origin}${basePath}`;
  const assetBaseUrl = assetBaseRaw.endsWith("/") ? assetBaseRaw : `${assetBaseRaw}/`;
  const rawCombinedHtml = absolutifyAssetPaths(blockHtmls.join("\n\n"), assetBaseUrl);

  if (landingType === "wordpress") {
    const wpTemplateName = (options?.wpTemplateName || "").trim();
    if (!wpTemplateName) {
      throw new Error("Заполните поле «Уникальное название шаблона» для WordPress-лендинга");
    }
    const combinedHtml = applyWpFormPlaceholders(rawCombinedHtml);

    const php = `<?php

/*
Template name: __NewAge: ${escapePhpTemplateName(wpTemplateName)}
*/
?>

<!doctype html>
<html lang="ru-RU" class="nomarginwp">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="format-detection" content="telephone=no">
	<? get_head('head'); ?>
	<script>
	    window.pageID = "<?= get_the_ID(); ?>";
	    window.ajaxurl = "<?= admin_url('admin-ajax.php'); ?>";

	    (function (w, d, s, l, i) {
	        w[l] = w[l] || [];
	        w[l].push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
	        var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
	        j.async = true;
	        j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
	        f.parentNode.insertBefore(j, f);
	    })(window, document, 'script', 'dataLayer', 'GTM-TLLHK7P');
	</script>

	<!-- ТУТ кастомные стили для этой страницы -->

	$bodyClass = [ 
		'program-light',
		'program-gray',
		'program-for'
	];
</head>
<body <?php body_class(implode(' ', $bodyClass)); ?>>

<?php
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

  <div class="wrapper">
    <main class="page page_hg8ap7v1d">
${combinedHtml}
    </main>
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

<?php get_footer('light'); ?>
`;
    return {
      filename: "template.php",
      mimeType: "application/x-httpd-php",
      content: php,
    };
  }

  const siteTitle = (options?.siteTitle || "").trim() || landingName.trim();
  if (!siteTitle) {
    throw new Error("Заполните поле «Title сайта» для s3-лендинга");
  }
  const combinedHtml = applyS3FormPlaceholders(rawCombinedHtml, {
    formType: (options?.formType || "gateway") as "getcourse" | "gateway",
    getcourseActionId: options?.getcourseActionId || "",
    formDealName: options?.formDealName || "",
    gatewayAlias: options?.gatewayAlias || "",
  });
  const discountUntilScript = combinedHtml.includes("js-discount-until")
    ? `<script>
  (function () {
    function formatDatePlusDays(days) {
      var d = new Date();
      d.setDate(d.getDate() + days);
      var dd = String(d.getDate()).padStart(2, "0");
      var mm = String(d.getMonth() + 1).padStart(2, "0");
      var yyyy = d.getFullYear();
      return dd + "." + mm + "." + yyyy;
    }
    var value = formatDatePlusDays(4);
    document.querySelectorAll(".js-discount-until").forEach(function (el) {
      el.textContent = value;
    });
  })();
</script>`
    : "";
  const gatewaySubmitScript = (options?.formType || "gateway") === "gateway"
    ? `<script>
  (function () {
    function bindGatewayForm() {
      if (typeof $ === "undefined") return;
      var $form = $("#form");
      if (!$form.length) return;
      $form.off("submit.gateway");
      $form.on("submit.gateway", function (e) {
        e.preventDefault();
        $.ajax({
          type: "POST",
          url: "https://gateway.talentsy.ru/wp-content/themes/clear/inc/gateway.php?service=new-landings",
          data: {
            formData: $form.serializeArray(),
            cookies: document.cookie,
            urlfull: window.location.href
          },
          success: function (result) {
            // success: result == gatewayLeadID
            // error: result == 'error'
            console.log("Gateway result:", result);
          },
          error: function (xhr, status, err) {
            console.error("Gateway ajax error:", status, err);
          }
        });
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bindGatewayForm);
    } else {
      bindGatewayForm();
    }
  })();
</script>`
    : "";
  const getcourseFillScript = (options?.formType || "gateway") === "getcourse"
    ? `<script>
  (function () {
    function encodedCookieAndUrl() {
      var cookiePart = (document.cookie || "")
        .replaceAll("=", "|c|c|")
        .replaceAll("&", "|a|a|");
      var urlPart = (window.location.href || "")
        .replaceAll("=", "|c|c|")
        .replaceAll("&", "|a|a|");
      return cookiePart + "|w|h|" + urlPart;
    }

    function fillGetCourseFields() {
      var form = document.getElementById("form");
      if (!form) return;

      var params = new URLSearchParams(window.location.search || "");
      var utmInfo = params.get("utm_info") || "";

      var utmInput = form.querySelector('input[name="formParams[dealCustomFields][1265453]"]');
      if (utmInput) utmInput.value = utmInfo;

      var helperInput = form.querySelector('input[name="__gc__internal__form__helper"]');
      if (helperInput) helperInput.value = window.location.href || "";

      var helperRefInput = form.querySelector('input[name="__gc__internal__form__helper_ref"]');
      if (helperRefInput) helperRefInput.value = document.referrer || "";

      var cookieUrlInput = form.querySelector('input[name="formParams[dealCustomFields][1291877]"]');
      if (cookieUrlInput) {
        cookieUrlInput.value = encodedCookieAndUrl();
      }
    }

    function start() {
      fillGetCourseFields();
      setInterval(fillGetCourseFields, 1000);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start);
    } else {
      start();
    }
  })();
</script>`
    : "";

  const customCss = (options?.s3CustomCss || "").trim();
  const customCssBlock = customCss
    ? `<style>\n${customCss}\n</style>`
    : `<!-- ТУТ кастомные стили для этой страницы -->`;

  const baseBodyClasses = [
    "wp-singular",
    "page-template",
    "page-template-new-age",
    "page-template-na-demo",
    "page-template-new-agena-demo-php",
    "page",
    "page-id-42725",
    "logged-in",
    "admin-bar",
    "no-customize-support",
    "wp-custom-logo",
    "wp-theme-talentsy",
    "program-light",
    "program-gray",
    "program-for",
    "action-start",
    "program-page",
  ];
  const extraBodyClasses = (options?.s3BodyClassExtra || "")
    .split(/\s+/)
    .map((c) => c.trim())
    .filter(Boolean);
  const bodyClass = [...baseBodyClasses, ...extraBodyClasses].join(" ");

  const html = `<!doctype html>
<html lang="ru-RU" class="nomarginwp">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="format-detection" content="telephone=no">
  
  <script type="module" crossorigin src="https://talentsy.ru/wp-content/themes/talentsy/dist/assets/main-29fc328e.js"></script>
  <link rel="modulepreload" href="https://talentsy.ru/wp-content/themes/talentsy/dist/assets/vendor-82507c16.js">
  <link rel="stylesheet" href="https://talentsy.ru/wp-content/themes/talentsy/dist/assets/main-af904025.css">
  <meta name='robots' content='noindex, follow' />

	<title>${escapeHtml(siteTitle)}</title>
 
  <link rel='stylesheet' id='css-fix-css' href='https://talentsy.ru/wp-content/themes/talentsy/styles/fix.css?ver=3.6.3' type='text/css' media='all' />
  <link rel='stylesheet' id='css-fix-filippov-css' href='https://talentsy.ru/wp-content/themes/talentsy/styles/fix-filippov.css?ver=3.6.3' type='text/css' media='all' />
  <link rel='stylesheet' id='landings-css' href='https://talentsy.ru/wp-content/themes/talentsy/styles/landing.min.css?ver=3.6.3' type='text/css' media='all' />
  <link rel='stylesheet' id='css-base-na-css' href='https://talentsy.ru/wp-content/themes/talentsy/new-age/dist/style-hg8ap7v1d.css?ver=3.6.3' type='text/css' media='all' />
  <link rel='stylesheet' id='bvi-styles-css' href='https://talentsy.ru/wp-content/plugins/button-visually-impaired/assets/css/bvi.min.css?ver=2.3.0' type='text/css' media='all' />
  <script type="text/javascript" src="https://talentsy.ru/wp-content/themes/talentsy/js/custom/jquery-3.6.4.min.js?ver=3.6.4" id="jquery-js"></script>
  <link rel="icon" href="https://talentsy.ru/wp-content/uploads/2023/08/cropped-fv-32x32.png" sizes="32x32" />
  <link rel="icon" href="https://talentsy.ru/wp-content/uploads/2023/08/cropped-fv-192x192.png" sizes="192x192" />
  <link rel="apple-touch-icon" href="https://talentsy.ru/wp-content/uploads/2023/08/cropped-fv-180x180.png" />
  <meta name="msapplication-TileImage" content="https://talentsy.ru/wp-content/uploads/2023/08/cropped-fv-270x270.png" />
  
  <script>
    (function (w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
        var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
        j.async = true;
        j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
        f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', 'GTM-TLLHK7P');
  </script>
  
  ${customCssBlock}
  
</head>

<body class="${escapeHtml(bodyClass)}">

  <div class="wrapper">
    <main class="page page_hg8ap7v1d">
${combinedHtml}
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

  <script type="text/javascript" src="https://talentsy.ru/wp-content/themes/talentsy/js/custom/getReview.js?ver=3.6.3" id="get_review-js" async="async" data-wp-strategy="async"></script>
  <script type="text/javascript" src="https://talentsy.ru/wp-content/themes/talentsy/js/custom/sombra.js?ver=3.6.3" id="js-sombra-js"></script>
  <script type="text/javascript" src="https://talentsy.ru/wp-content/themes/talentsy/js/landing.min.js?ver=3.6.3" id="landings-js"></script>
  <script type="text/javascript" id="bvi-script-js-extra">
  /* <![CDATA[ */
  var wp_bvi = {"option":{"theme":"white","font":"arial","fontSize":16,"letterSpacing":"normal","lineHeight":"normal","images":true,"reload":false,"speech":true,"builtElements":true,"panelHide":false,"panelFixed":true,"lang":"ru-RU"}};
  //# sourceURL=bvi-script-js-extra
  /* ]]> */
  </script>
  <script type="text/javascript" src="https://talentsy.ru/wp-content/plugins/button-visually-impaired/assets/js/bvi.min.js?ver=2.3.0" id="bvi-script-js"></script>
  <script type="text/javascript" id="bvi-script-js-after">
  /* <![CDATA[ */
  var Bvi = new isvek.Bvi(wp_bvi.option);
  //# sourceURL=bvi-script-js-after
  /* ]]> */
  </script>
${gatewaySubmitScript}
${getcourseFillScript}
${discountUntilScript}
</body>
</html>
`;
  return {
    filename: "index.html",
    mimeType: "text/html;charset=utf-8",
    content: html,
  };
}

export async function exportLandingAsZip(
  blockHtmls: string[],
  landingName: string,
  landingType: "wordpress" | "s3" = "s3",
  options?: {
    wpTemplateName?: string | null;
    siteTitle?: string | null;
    s3CustomCss?: string | null;
    s3BodyClassExtra?: string | null;
    formType?: "getcourse" | "gateway" | null;
    getcourseActionId?: string | null;
    formDealName?: string | null;
    gatewayAlias?: string | null;
  },
) {
  const compiled = compileLandingFile(blockHtmls, landingName, landingType, options);
  const blob = new Blob([compiled.content], { type: compiled.mimeType });
  downloadBlob(blob, compiled.filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

function escapePhpTemplateName(value: string): string {
  return value.replace(/\*\//g, "* /").replace(/\r?\n/g, " ").trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

function absolutifyAssetPaths(html: string, assetBaseUrl: string): string {
  const toAbs = (path: string) => {
    if (!path) return path;
    if (/^(https?:)?\/\//i.test(path) || path.startsWith("#") || path.startsWith("data:") || path.startsWith("mailto:") || path.startsWith("tel:")) {
      return path;
    }
    if (path.startsWith("/")) {
      return `${assetBaseUrl}${path.replace(/^\/+/, "")}`;
    }
    return `${assetBaseUrl}${path}`;
  };

  return html
    .replace(/(src|srcset|href)=["']([^"']+)["']/gi, (_m, attr, path) => `${attr}="${toAbs(path)}"`)
    .replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (_m, path) => `url(${toAbs(path)})`);
}

function applyWpFormPlaceholders(html: string): string {
  const wpPromoBlock = `<?php if (!$isGetCourse): ?>
          <div class="promo-container course-block__item course-block__item_promo">
            <button type="button" class="promo-button icon" style="--icon: url('img/main-page/icon/icon-arrow-down.svg')">
              У меня есть промокод
            </button>
            <div class="course-block__item-hidden">
              <div class="course-block__item-hidden-el mb-10">
                <input type="text" class="input input-light jsPmoField" placeholder="Промокод" name="jsPmoHiddenFormField">
                <button type="button" class="button-promo-b jsPPRequest">Применить</button>
              </div>
              <div class="jsPmoError"></div>
            </div>
          </div>
<?php endif; ?>`;

  return html
    .replace(/\{\{FORM_TAG_ATTRS\}\}/g, "<?= $formParmas['tag']; ?>")
    .replace(/\{\{FORM_CLASS_EXTRA\}\}/g, "<?= $formParmas['class']; ?>")
    .replace(/\{\{FIELD_NAME_NAME\}\}/g, "<?= $formParmas['names']['name']; ?>")
    .replace(/\{\{FIELD_PHONE_NAME\}\}/g, "<?= $formParmas['names']['phone']; ?>")
    .replace(/\{\{FIELD_EMAIL_NAME\}\}/g, "<?= $formParmas['names']['email']; ?>")
    .replace(/\{\{FORM_AGREED_BLOCK\}\}/g, "<? get_template_part( 'inc/components/form/agreed' ); ?>")
    .replace(/\{\{FORM_HIDDENS\}\}/g, "<?= $formParmas['hiddens']; ?>")
    .replace(/\{\{DISCOUNT_UNTIL\}\}/g, "<?= date('d.m.Y', strtotime('+4 days')); ?>")
    .replace(/\{\{PROMO_BLOCK\}\}/g, wpPromoBlock);
}

function applyS3FormPlaceholders(
  html: string,
  options: {
    formType: "getcourse" | "gateway";
    getcourseActionId: string;
    formDealName: string;
    gatewayAlias: string;
  },
): string {
  const replaceToken = (input: string, token: string, value: string): string => {
    const re = new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "g");
    return input.replace(re, value);
  };
  const injectBeforeFormClose = (input: string, fragment: string): string => {
    if (!fragment) return input;
    if (input.includes(fragment)) return input;
    return input.replace(/<\/form>/i, `${fragment}</form>`);
  };

  const agreed = `<noindex>
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
  const promoBlock = `<div class="promo-container course-block__item course-block__item_promo">
               <button type="button" class="promo-button icon" style="--icon: url('img/main-page/icon/icon-arrow-down.svg')">
                  У меня есть промокод
                </button>

                <div class="course-block__item-hidden">
                  <div class="course-block__item-hidden-el mb-10">
                    <input type="text" class="input input-light jsPmoField" placeholder="Промокод" name="jsPmoHiddenFormField">
                    <button type="button" class="button-promo-b jsPPRequest">Применить</button>
                  </div>
                  <div class="jsPmoError"></div>
                </div>
              </div>`;

  if (options.formType === "getcourse") {
    const actionId = options.getcourseActionId.trim();
    if (!actionId) {
      throw new Error("Для формы GetCourse заполните ActionID виджета GetCourse");
    }
    const hiddens = [
      `<input name="formParams[dealCustomFields][1265453]" type="hidden" value="">`,
      `<input name="formParams[dealCustomFields][1810276]" type="hidden" value="${escapeAttr(options.gatewayAlias || "")}">`,
      `<input name="formParams[dealCustomFields][10171931]" type="hidden" value="${escapeAttr(options.formDealName || "")}">`,
      `<input name="formParams[dealCustomFields][1291877]" type="hidden" value="">`,
      `<input type="hidden" name="__gc__internal__form__helper" value="">`,
      `<input type="hidden" name="__gc__internal__form__helper_ref" value="">`,
      `<input type="hidden" name="requestTime" value="1695648662">`,
      `<input type="hidden" name="requestSimpleSign" value="de53721676f9b6aa19bb539ad254923d">`,
      `<input type="hidden" name="isHtmlWidget" value="1">`,
    ].join("\n");

    let out = html;
    out = replaceToken(out, "FORM_TAG_ATTRS", `action="https://lk.talentsy.ru/pl/lite/block-public/process-html?id=${escapeAttr(actionId)}" method="post" data-open-new-window="0"`);
    out = replaceToken(out, "FORM_CLASS_EXTRA", "");
    out = replaceToken(out, "FIELD_NAME_NAME", "formParams[first_name]");
    out = replaceToken(out, "FIELD_PHONE_NAME", "formParams[phone]");
    out = replaceToken(out, "FIELD_EMAIL_NAME", "formParams[email]");
    out = replaceToken(out, "FORM_AGREED_BLOCK", agreed);
    out = replaceToken(out, "FORM_HIDDENS", hiddens);
    out = replaceToken(out, "DISCOUNT_UNTIL", `&nbsp;<span class="js-discount-until"></span>`);
    out = replaceToken(out, "PROMO_BLOCK", "");
    out = injectBeforeFormClose(out, hiddens);
    return out;
  }

  const gatewayHiddens = [
    `<input type="hidden" name="formname" value="${escapeAttr(options.formDealName || "")}">`,
    `<input type="hidden" name="ellyalias" value="${escapeAttr(options.gatewayAlias || "")}">`,
  ].join("\n");

  let out = html;
  out = replaceToken(out, "FORM_TAG_ATTRS", `id="form"`);
  out = replaceToken(out, "FORM_CLASS_EXTRA", "");
  out = replaceToken(out, "FIELD_NAME_NAME", "Name");
  out = replaceToken(out, "FIELD_PHONE_NAME", "Phone");
  out = replaceToken(out, "FIELD_EMAIL_NAME", "Email");
  out = replaceToken(out, "FORM_AGREED_BLOCK", agreed);
  out = replaceToken(out, "FORM_HIDDENS", gatewayHiddens);
  out = replaceToken(out, "DISCOUNT_UNTIL", `&nbsp;<span class="js-discount-until"></span>`);
  out = replaceToken(out, "PROMO_BLOCK", promoBlock);
  out = injectBeforeFormClose(out, gatewayHiddens);
  return out;
}
