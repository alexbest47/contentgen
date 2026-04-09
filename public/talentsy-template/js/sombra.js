window.ajaxurl = '/wp-admin/admin-ajax.php';


$(document).ready(function(){
    if( document.cookie.indexOf('cookieAgree=') < 0 ){
        $('.cookie-agree-alert').css('display', 'grid');
    }
    const $button = $('.scroll-to-top');

    // Показ/скрытие кнопки при скролле
    $(window).on('scroll', function() {
    if ($(window).scrollTop() > $(window).height()) {
      $button.addClass('visible');
    } else {
      $button.removeClass('visible');
    }
    });

    // Плавный скролл наверх при клике
    $button.on('click', function() {
    $('html, body').animate({ scrollTop: 0 }, 600);
    });

    // обработка форм
    $('body').on('submit', '.ajaxForm', function (e) {
        e.preventDefault();
        var _this = $(this),
            formData = new FormData();

        _this.find('button').attr('disabled', true);

        formData.append('action', _this.data('target'));
        formData.append('form', _this.serialize());
        formData.append('cookies', document.cookie);
        formData.append('urlfull', window.location.href);
        formData.append('pageID', window.pageID);

        _this.find('input[name="file"]').each(function () {
            var files_val = $(this)[0].files,
                name = $(this).attr('name');

            for (var i = 0; i < files_val.length; i++) {
                formData.append('file---' + name + '---' + i, files_val[i]);
            }
        });

        $.ajax({
            type: 'POST',
            url: window.ajaxurl,
            contentType: false,
            processData: false,
            data: formData,
            success: function (j) {
                j = $.parseJSON(j);

                // отправка события в GTM
                if (typeof j.gtm !== 'undefined') {
                    var obj = {};
                    var dataLayer = window.dataLayer || (window.dataLayer = []);
                    $.each(_this.serializeArray(), function (i, v) {
                        obj[v.name] = v.value;
                    });
                    dataLayer.push({
                        'event': 'leadReceived',
                        'postMessageData': {
                            'formType': 'htmlWP',
                            'formData': obj,
                            'gLeadID': j.gleadid
                        }
                    });
                }

                if (typeof j.eHtml !== 'undefined') $(j.eTarget).html(j.eHtml);
                if (typeof j.jsData !== 'undefined') eval(j.jsData);

                _this.find('button').attr('disabled', false);
                $('body').trigger('success_' + _this.data('target'));
            },
            statusCode: {
                500: function () {
                    _this.find('button').attr('disabled', false);
                    notifyMessage('danger', 'Ошибка сервера: 500');
                },
                502: function () {
                    _this.find('button').attr('disabled', false);
                    notifyMessage('danger', 'Ошибка сервера: 502');
                },
                504: function () {
                    _this.find('button').attr('disabled', false);
                    notifyMessage('danger', 'Сервер устал ждать: 504');
                },
                400: function () {
                    _this.find('button').attr('disabled', false);
                    notifyMessage('danger', 'Ошибка получателя: 400');
                }
            }
        });
    });
    // подстановка параметров для GC форм
    // $('[name="formParams[dealCustomFields][1291877]"]').val(document.cookie + "|w|h|" + window.location.href);
    $('[name="formParams[dealCustomFields][1291877]"]').val( document.cookie.replaceAll('=', '|c|c|').replaceAll('&', '|a|a|') +"|w|h|"+ window.location.href.replaceAll('=', '|c|c|').replaceAll('&', '|a|a|') );
    $('[name="__gc__internal__form__helper"]').val(window.location.href);
    $('[name="__gc__internal__form__helper_ref"]').val(document.referrer);
    $('body').on('click', 'form.lt-form button[type="submit"]', function () {
        if (window['stpbtngc2709']) {
            return false;
        }

        window['stpbtngc2709'] = true;
        setTimeout(function () {
            window['stpbtngc2709'] = false
        }, 6000);

        return true;
    });

    // для форм в блоге предустановка utm в url
    if ($('body').hasClass('single-post')) {
        var formlocation = window.location.protocol + '//' + window.location.host + window.location.pathname + '?utm_source=blog&utm_term=' + window.location.pathname.replace('/blog/', '').replace('/', '');
        $('.course-form [name="formParams[dealCustomFields][1291877]"]').val(document.cookie + "|w|h|" + formlocation);
        $('[name="__gc__internal__form__helper"]').val(formlocation);
    }

    // 28-01-2025 добавляю субалиас для некоторых ГК форм
    var temp1291877 = false;

    $('body').on('change', 'input[name="formParams[phone]"]', function(){
        var closestFormTag = $(this).closest('form');

        if( closestFormTag.hasClass('withSubAlias') ){
            if( !temp1291877 ) temp1291877 = closestFormTag.find('[name="formParams[dealCustomFields][1291877]"]').val();

            closestFormTag.find('[name="formParams[dealCustomFields][1291877]"]').val( closestFormTag.attr('subAlias') +'|s|a|f|'+ temp1291877);
        }
    });

    // обработка ajaxClick
    $('body').on('click', '.ajaxClick', function (e) {
        e.preventDefault();
        var _this = $(this),
            formData = new FormData();

        loadingToggle();

        formData.append('action', _this.data('target'));
        formData.append('params', _this.data('params'));
        formData.append('json', _this.attr('json'));

        $.ajax({
            type: 'POST',
            url: window.ajaxurl,
            contentType: false,
            processData: false,
            data: formData,
            success: function (j) {
                j = $.parseJSON(j);
                console.log(j);

                if (typeof j.eHtml !== 'undefined') $(j.eTarget).html(j.eHtml);
                if (typeof j.aHtml !== 'undefined') $(j.eTarget).append(j.aHtml);
                if (typeof j.jsData !== 'undefined') eval(j.jsData);

                loadingToggle();
                $('body').trigger('success_' + _this.data('target'));
            },
            statusCode: {
                500: function () {
                    loadingToggle();
                    notifyMessage('danger', 'Ошибка сервера: 500');
                },
                502: function () {
                    loadingToggle();
                    notifyMessage('danger', 'Ошибка сервера: 502');
                },
                504: function () {
                    loadingToggle();
                    notifyMessage('danger', 'Сервер устал ждать: 504');
                },
                400: function () {
                    loadingToggle();
                    notifyMessage('danger', 'Ошибка получателя: 400');
                }
            }
        });
    });


    //seo-faq
    $('body').on('click', '.button-additional-faq', function () {
        $(this).prev().removeClass('mb-60')
        $(this).hide();
        $(this).next().show();
    });

    //// обработка промокодов
    // show
    $('body').on('click', '.promoform__btn', function () {
        $(this).parents('.newpromoform').addClass('state-open')
    });
    // очистка по крестику
    $('body').on('click', '.promoform__clearer', function () {
        $('.jsPmoField').val('');
    });
    // отправка
    $('body').on('click', '.jsPPRequest', function () {
        var promoCont = $(this).parents('form'),
            promoCodeValue = promoCont.find('.jsPmoField').val();

        $.get('https://octopus.talentsy.ru/wp-content/themes/clear/inc/rest/promocodes-percent.php',
            {"url": window.location.href, "promocode": promoCodeValue},
            function (a) {
                j = $.parseJSON(a);

                if (j.result) {
                    if ($('.jsPPSumm').length) {
                        if( promoCont.hasClass('special-pp-selector') ){
                            $( promoCont.attr('special-pp-selector') ).html(Math.round(parseInt($(promoCont.attr('special-pp-selector')).html().replace(' ', '').replace('&nbsp;', '')) / 100 * (100 - parseInt(j.percent))));
                        }else{
                            $('.jsPPSumm').html(Math.round(parseInt($('.jsPPSumm').html().replace(' ', '').replace('&nbsp;', '')) / 100 * (100 - parseInt(j.percent))));
                        }
                    }
                    promoCont.removeClass('state-open').addClass('state-success')
                    promoCont.find('[name="jsPmoHiddenFormField"]').val(promoCodeValue);
                    sombraSetCookie('lastUsedPromocode', promoCodeValue);
                    // чтобы на старых лендингах работало
                    promoCont.find(".jsPmoError").addClass("suceesscode").html(j.message).show();
                    promoCont.find(".jsPPRequest").removeClass("jsPPRequest");
                } else {
                    promoCont.find('.jsPmoField').addClass('is-invalid');
                    // чтобы на старых лендингах работало
                    promoCont.find(".jsPmoError").removeClass("suceesscode").html(j.message).show();
                }
            }
        );
    });


    // оглавление блога
    $('body').on('click', '.ez-toc-link', function (e) {
        e.preventDefault();
        $([document.documentElement, document.body]).animate({
            scrollTop: ($(".wp-block-heading:contains('" + $(this).attr("title") + "')").offset().top - 20)
        }, 1200);
    });

    // //// VK ID
    // // подгрузка VK API авторизации
    // const {Connect, Config, ConnectEvents} = window.SuperAppKit;
    // Config.init({appId: 51529851});

    // if ($('.jsVKAuthBlock').length > 0) { // есть блок под кнопку быстрого входа. загружаем бесшовную авторизацию
    //     const oneTapButton = Connect.buttonOneTapAuth({
    //         callback: function (e) {
    //             const type = e.type;

    //             if (!type) return false;

    //             switch (type) {
    //                 case ConnectEvents.OneTapAuthEventsSDK.LOGIN_SUCCESS: // всё ок, пользователь уже авторизован
    //                     getVKUserFormInfo(e.payload.token, e.payload.uuid, oneTapButton);
    //                     return false;
    //                 default: // нужен редирект авторизации
    //                     // редирект отключили, неудобно на мобилах. поэтому если чел не авторизован - то и кнопки не надо
    //                     // return Connect.redirectAuth({url: window.location.href, state: 'vkafterauth'});
    //                     return false;
    //             }

    //             return false;
    //         },
    //         options: {
    //             showAlternativeLogin: false,
    //             displayMode: 'name_phone',
    //             buttonStyles: {
    //                 borderRadius: 8
    //             }
    //         },
    //     });

    //     // добавляем кнопку
    //     if (oneTapButton) {
    //         oneTapButton.authReadyPromise.then(function (isAuthed) {
    //             if (isAuthed != 'VKSDKOneTapAuthDataLoaded') {
    //                 oneTapButton.destroy(); // пользователь не авторизован в вк - не показываем вообще
    //             } else {
    //                 $('.jsVKAuthBlock iframe').css('display', 'block'); // чтобы не было видно "подгрузки" - фреймы вк скрыты через css, раз он авторизован - показываем
    //             }
    //         });

    //         // активируем кнопку входа
    //         $('.jsVKAuthBlock').html(oneTapButton.getFrame());
    //     }
    // } else if ($('.jsVKAuthCustom').length > 0) { // есть фейковые кнопки, которых много - они по клику показывают справа вверху блок
    //     const oneTapButton = Connect.floatingOneTapAuth({
    //         callback: function (e) {
    //             const type = e.type;

    //             if (!type) return false;

    //             switch (type) {
    //                 case ConnectEvents.OneTapAuthEventsSDK.LOGIN_SUCCESS: // всё ок, пользователь уже авторизован
    //                     getVKUserFormInfo(e.payload.token, e.payload.uuid, oneTapButton);
    //                     return false;
    //                 case 'VKSDKOneTapAuthClose': // чел закрыл блок
    //                     $('body').addClass('vk-off');
    //                     return false;
    //                 default: // нужен редирект авторизации
    //                     // редирект отключили, неудобно на мобилах. поэтому если чел не авторизован - то и кнопки не надо
    //                     // return Connect.redirectAuth({url: window.location.href, state: 'vkafterauth'});
    //                     return false;
    //             }

    //             return false;
    //         },
    //         options: {
    //             styles: {
    //                 zIndex: 999,
    //             },
    //             skipSuccess: false,
    //         },
    //     });

    //     // добавляем блок
    //     if (oneTapButton) {
    //         oneTapButton.authReadyPromise.then(function (isAuthed) {
    //             if (isAuthed != 'VKSDKOneTapAuthDataLoaded') {
    //                 oneTapButton.destroy(); // пользователь не авторизован в вк - не показываем вообще блок
    //                 $('.jsVKAuthCustom').remove(); // и убираем кнопки "включения" блока
    //             }
    //         });

    //         // создаем блок
    //         $('body').append('<div class="jsVKAuthTopBlock"></div>');
    //         $('.jsVKAuthTopBlock').append(oneTapButton.getFrame());

    //         // по клику показываем блок
    //         $('body').on('click', '.jsVKAuthCustom', function () {
    //             if ($('body').hasClass('vk-off')) {
    //                 $('body').removeClass('vk-off');
    //                 const oneTapButton = Connect.floatingOneTapAuth({
    //                     callback: function (e) {
    //                         const type = e.type;

    //                         if (!type) return false;

    //                         switch (type) {
    //                             case ConnectEvents.OneTapAuthEventsSDK.LOGIN_SUCCESS: // всё ок, пользователь уже авторизован
    //                                 getVKUserFormInfo(e.payload.token, e.payload.uuid, oneTapButton);
    //                                 return false;
    //                             case 'VKSDKOneTapAuthClose': // чел закрыл блок
    //                                 $('body').addClass('vk-off');
    //                                 return false;
    //                             default: // нужен редирект авторизации
    //                                 // редирект отключили, неудобно на мобилах. поэтому если чел не авторизован - то и кнопки не надо
    //                                 // return Connect.redirectAuth({url: window.location.href, state: 'vkafterauth'});
    //                                 return false;
    //                         }

    //                         return false;
    //                     },
    //                     options: {
    //                         styles: {
    //                             zIndex: 999,
    //                         },
    //                         skipSuccess: false,
    //                     },
    //                 });
    //                 $('.jsVKAuthTopBlock').append(oneTapButton.getFrame());
    //             }
    //             $('.jsVKAuthTopBlock').css('display', 'block');
    //         });
    //     }
    // }

    // // проверяю, а не пришел ли человек после авторизации в новом окне по get-параметрам
    // var urlParams = new URLSearchParams(document.location.search);
    // if (urlParams.get("state") == "vkafterauth") {
    //     var authRes = $.parseJSON(urlParams.get("payload"));

    //     getVKUserFormInfo(authRes.token, authRes.uuid, oneTapButton);
    // }


    addUTMLinksToBlog()
    addOpenModelContentGuide()

    /*   document.querySelectorAll(".earnings-slide").forEach((e => {
           e.noUiSlider.on("update", () => incomeCalc())
       }))*/

    $('body').on('click', '.basic-menu-default', function () {
        $('.basic-menu').toggleClass('active');
    });

    $('.agreed_label').each(function(){
        $(this).parents('form').find('button[type=submit]').prop('disabled', true);
    });

    $('.agreed_label').click(function(e){
        e.preventDefault();
        let block       = $(this).parents('.agreed__block'),
            checkbox    = block.find(".agreed__checkbox.checkbox-required"),
            btn         = $(this).parents('form').find('button[type=submit]'),
            warning     = block.find('.error_agreed');

        $(this).toggleClass('checkbox-off').toggleClass('checkbox-on');

        if( !$(this).hasClass('unreq') ){
            $(this).toggleClass('error-check');
            warning.toggle();
            $(this).closest('form').find('.agreed__checkbox.checkbox-required[name="'+ checkbox.attr('name') +'"]').prop("checked", !checkbox.prop('checked'));
        }else{
            block.find(".agreed__checkbox").prop("checked", !block.find(".agreed__checkbox").prop('checked'));
        }



        if( $(this).parents('form').find(".agreed__checkbox.checkbox-required:not(:checked)").length > 0 ){
            btn.prop('disabled', 1);
        }else{
            btn.prop('disabled', 0);
        }
    });
});

// loading анимация
function loadingToggle() {
    $('body').toggleClass('active-loading')
}

// notifyMessage
function notifyMessage(type, message) {
    // $.notify({
    // 	message: message
    // },{
    // 	type: type,
    // 	z_index: 999999,
    // 	autoHideDelay: 3500
    // });
}

// бэк запрос на получение телепочты авторизованного для VK ID
function getVKUserFormInfo(token, uuid, OTP) {
    $.ajax({
        type: 'POST',
        url: 'https://octopus.talentsy.ru/wp-content/themes/clear/inc/rest/vkid.php',
        data: {
            "token": token,
            "uuid": uuid,
            "url": window.location.href
        },
        success: function (answer) {
            answer = $.parseJSON(answer);

            if (answer.success) {
                // для форм тильды
                $('input[name="Name"]').val(answer.name);
                $('input[name="Phone"]').val(answer.phone);
                $('input[type="tel"]').val(answer.phone.slice(1)); // для тильдовской маски
                $('input[name="Email"]').val(answer.email);

                // для форм геткурса проставляем в параметры айдишник
                var gcUrlAddon = '&vkspename=' + answer.name + '&vkspephon=' + answer.phone + '&vkspemail=' + answer.email;
                $("iframe[src^='https://lk.talentsy.ru']").each(function (e) {
                    $(this).attr('src', $(this).attr('src') + gcUrlAddon);
                });

                // вк айди запоминаем в куку
                var date = new Date();
                date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
                var expires = "; expires=" + date.toUTCString();
                document.cookie = "vkuserid=" + answer.userid + expires + "; path=/";

                // убираем кнопки авторизации
                OTP.destroy();
                $('.jsVKAuthCustom').remove();
            } else {
                console.error('что-то пошло не так', answer);
            }
        }
    });

}

// cookies set
function sombraSetCookie(name, data) {
    var d = new URL(document.location.href),
        dA = d.host.split("."),
        domain = d.host.split(".").length > 2 ? '.' + dA[1] + '.' + dA[2] : '.' + d.host;
    var nDate = new Date();
    nDate.setTime(nDate.getTime() + (90 * 24 * 60 * 60 * 1000));

    document.cookie = name + "=" + data + "; expires=" + nDate.toUTCString() + "; path=/; domain=" + domain;
}

//добавляю utm к ссылкам внутри блога
function addUTMLinksToBlog() {
    const blog = document.querySelector('.blogpost')
    if (blog) {
        let
            utmSource = 'utm_source=' + 'blog',
            utmTerm = '&utm_term=' + location.pathname.split('/').slice(1)[1],
            utmParamQueryStringFull = '?' + utmSource + utmTerm,
            navLinks = blog.querySelectorAll('a:not(.ez-toc-link)');
        navLinks.forEach(function (item) {
            if (item.href.indexOf('/') === 0 || item.href.indexOf(location.host) !== -1) {
                if (item.href.indexOf('?') === -1) {
                    item.href += utmParamQueryStringFull;
                } else {
                    if (item.href.includes('utm_source') && !item.href.includes('utm_term')) {
                        item.href += utmTerm
                    }
                    if (item.href.includes('utm_term') && !item.href.includes('utm_source')) {
                        item.href += '&'
                        item.href += utmSource
                    }
                }

                item.target = "_blank";
            }
        })
    }
}


function addGuideLinkToList(header, subheader) {
    let heading = document.querySelectorAll('.ez-toc-page-1')[0]
    let insertElement = document.createElement('li')
    insertElement.className = 'ez-toc-page-1 guide_el'
    heading.after(insertElement)
    insertElement.innerHTML = `<noindex><a class="guide_link" data-attr="modal-link-guide" data-target="#modal-guide"><svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M4.7619 0H26.9375C28.2004 0 29.4116 0.501699 30.3047 1.39473C31.1977 2.28776 31.6994 3.49897 31.6994 4.7619V34.2857C31.6994 35.8012 31.0974 37.2547 30.0257 38.3263C28.9541 39.398 27.5006 40 25.9851 40H20.2708C19.929 39.9999 19.5934 39.9078 19.2994 39.7333C18.9305 39.9091 18.5271 40.0002 18.1185 40H4.7619C3.49897 40 2.28776 39.4983 1.39473 38.6053C0.501699 37.7122 0 36.501 0 35.2381V4.7619C0 3.49897 0.501699 2.28776 1.39473 1.39473C2.28776 0.501699 3.49897 0 4.7619 0ZM21.3866 29.6872C20.6722 30.4016 20.2708 31.3706 20.2708 32.3809V36.4L28.4804 28.5714H24.0804C23.07 28.5714 22.101 28.9728 21.3866 29.6872ZM28.6789 36.9795C29.3933 36.265 29.7946 35.2961 29.7946 34.2857V29.9619L21.2613 38.0952H25.9851C26.9955 38.0952 27.9644 37.6939 28.6789 36.9795ZM7.24925 21.8601H5.57961V13.0208H9.31175C9.48363 13.0208 9.8151 13.0331 10.0484 13.0699C11.6321 13.3155 12.3318 14.4572 12.3318 15.9427C12.3318 17.4282 11.6198 18.5699 10.0484 18.8155C9.8151 18.8523 9.47135 18.8646 9.31175 18.8646H7.24925V21.8601ZM7.24925 14.58V17.3054H9.23809C9.40997 17.3054 9.63095 17.2932 9.80282 17.244C10.478 17.0599 10.6499 16.4215 10.6499 15.9427C10.6499 15.4639 10.478 14.8255 9.80282 14.6414C9.63095 14.5923 9.40997 14.58 9.23809 14.58H7.24925ZM16.4248 21.8601H13.5643V13.0208H16.4248C16.5599 13.0208 17.0755 13.0208 17.4806 13.0699C19.6168 13.3278 20.8076 15.1938 20.8076 17.4405C20.8076 19.6871 19.6168 21.5532 17.4806 21.811C17.0755 21.8601 16.5599 21.8601 16.4248 21.8601ZM15.2585 14.5923V20.2887H16.4248C16.6458 20.2887 17.0755 20.2887 17.3824 20.2273C18.5364 19.994 19.0398 18.705 19.0398 17.4405C19.0398 16.1146 18.4996 14.8746 17.3824 14.6536C17.0755 14.5923 16.6458 14.5923 16.4248 14.5923H15.2585ZM22.2804 21.8601H23.95V18.2753H26.9455V16.6057H23.95V14.6905H27.6821V13.0208H22.2804V21.8601Z" fill="#FF014A"/> </svg> <div class=""><p class="guide_header">${header}</p><small class="guide_small">${subheader}</small></div></a></noindex>`
}

/*window.addEventListener('load', function (){
	var phoneInputID = "input[type='tel']";
	var input = document.querySelector(phoneInputID);
	var iti = window.intlTelInput(input, {
		// allowDropdown: false,
		// autoHideDialCode: false,
		// autoPlaceholder: "off",
		// dropdownContainer: document.body,
		// excludeCountries: ["us"],
		//separateDialCode: true,
		formatOnDisplay: true,
		// geoIpLookup: function(callback) {
		//   $.get("http://ipinfo.io", function() {}, "jsonp").always(function(resp) {
		//     var countryCode = (resp && resp.country) ? resp.country : "";
		//     callback(countryCode);
		//   });
		// },
		hiddenInput: "full_number",
		initialCountry: "ru",
		// localizedCountries: { 'de': 'Deutschland' },
		// nationalMode: false,
		// onlyCountries: ['us', 'gb', 'ch', 'ca', 'do'],
		// placeholderNumberType: "MOBILE",
		preferredCountries: ['ru', 'kz', 'by', 'uz'],
		// separateDialCode: true,
		utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.2.1/js/utils.js"
	});


	$(phoneInputID).on("countrychange", function(event) {

		// Get the selected country data to know which country is selected.
		var selectedCountryData = iti.getSelectedCountryData();

		// Get an example number for the selected country to use as placeholder.
		newPlaceholder = intlTelInputUtils.getExampleNumber(selectedCountryData.iso2, true, intlTelInputUtils.numberFormat.INTERNATIONAL),

			// Reset the phone number input.
			iti.setNumber("");

		// Convert placeholder as exploitable mask by replacing all 1-9 numbers with 0s
		mask = newPlaceholder.replace(/[1-9]/g, "0");

		// Apply the new mask for the input
		$(this).mask(mask);
	});


	// When the plugin loads for the first time, we have to trigger the "countrychange" event manually,
	// but after making sure that the plugin is fully loaded by associating handler to the promise of the
	// plugin instance.

	iti.promise.then(function() {
		$(phoneInputID).trigger("countrychange");
	});
	console.log(window.intlTelInputUtils)
})*/

if (document.querySelector('[data-attr="modal-link"]')) {
    document.querySelectorAll('[data-attr="modal-link"]').forEach((item) => {
        item.addEventListener('click', function (e) {
            e.preventDefault(); // Предотвращаем переход по ссылке (если она `<a>`)

            let itemAttr = item.getAttribute('data-target');
            let modal = document.querySelector(itemAttr);
            let modalContent = modal?.querySelector('.modal-load');
            let closeButton = modal?.querySelector('.modal-close');

            if (!modal || !modalContent || !closeButton) return;

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            function closeModal() {
                modal.classList.remove('active');
                if (!document.querySelector('.modal-load.active')) {
                    document.body.style.overflow = 'auto';
                }
                document.removeEventListener('click', outsideClickHandler);
                closeButton.removeEventListener('click', closeHandler);
            }

            function outsideClickHandler(e) {
                // Проверяем, клик был ВНЕ модального контента и ВНЕ кнопки закрытия
                if (!modalContent.contains(e.target) && !closeButton.contains(e.target)) {
                    closeModal();
                }
            }

            function closeHandler(e) {
                e.preventDefault();
                closeModal();
            }

            // Используем setTimeout, чтобы избежать мгновенного закрытия при клике на кнопку
            setTimeout(() => {
                document.addEventListener('click', outsideClickHandler);
            }, 50);

            closeButton.addEventListener('click', closeHandler);
        });
    });
}





window.addEventListener("DOMContentLoaded", function () {
    [].forEach.call(document.querySelectorAll('.form-item-tel'), function (input) {
        var keyCode;

        function mask(event) {
            event.keyCode && (keyCode = event.keyCode);
            var pos = this.selectionStart;
            if (pos < 3) event.preventDefault();
            var matrix = "+7 (___) ___-__-__",
                i = 0,
                def = matrix.replace(/\D/g, ""),
                val = this.value.replace(/\D/g, ""),
                new_value = matrix.replace(/[_\d]/g, function (a) {
                    return i < val.length ? val.charAt(i++) || def.charAt(i) : a
                });
            i = new_value.indexOf("_");
            if (i != -1) {
                i < 5 && (i = 3);
                new_value = new_value.slice(0, i)
            }
            var reg = matrix.substr(0, this.value.length).replace(/_+/g,
                function (a) {
                    return "\\d{1," + a.length + "}"
                }).replace(/[+()]/g, "\\$&");
            reg = new RegExp("^" + reg + "$");
            if (!reg.test(this.value) || this.value.length < 5 || keyCode > 47 && keyCode < 58) this.value = new_value;
            if (event.type == "blur" && this.value.length < 5) this.value = ""
        }

        input.addEventListener("input", mask, false);
        input.addEventListener("focus", mask, false);
        input.addEventListener("blur", mask, false);
        input.addEventListener("keydown", mask, false)

    });
});

function addOpenModelContentGuide() {
    const modalLinks = document.querySelectorAll('[data-attr="modal-link-guide"]');

    if (modalLinks.length === 0) return;

    modalLinks.forEach((item) => {
        item.addEventListener('click', function () {
            const itemAttr = item.getAttribute('data-target');
            const modal = document.querySelector(itemAttr);
            const modalContent = modal?.querySelector('.modal-guide-load');
            const closeButton = modal?.querySelector('.modal-close');

            if (!modal || !modalContent || !closeButton) return;

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            function closeModal() {
                modal.classList.remove('active');

                // Проверяем, остались ли открытые модалки
                if (!document.querySelector('.modal-guide.active')) {
                    document.body.style.overflow = 'auto';
                }

                document.removeEventListener('mouseup', outsideClickHandler);
                closeButton.removeEventListener('click', closeHandler);
                modalContent.removeEventListener('mouseup', preventCloseInside);
            }

            function outsideClickHandler(e) {
                // Если клик не внутри активной модалки – закрываем
                if (!modalContent.contains(e.target)) {
                    closeModal();
                }
            }

            function closeHandler(e) {
                e.preventDefault();
                closeModal();
            }

            function preventCloseInside(e) {
                // Останавливаем всплытие события, чтобы `mouseup` не сработал глобально
                e.stopPropagation();
            }

            document.addEventListener('mouseup', outsideClickHandler);
            closeButton.addEventListener('click', closeHandler);
            modalContent.addEventListener('mouseup', preventCloseInside);
        });
    });
}



function getBodyScrollTop() {
    return self.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || (document.body && document.body.scrollTop);
}

if (document.querySelector('.master-fixed')) {
    window.addEventListener('scroll', function () {
        if (getBodyScrollTop() > 800) {
            document.querySelector('.master-fixed').classList.add('active')
        } else {
            document.querySelector('.master-fixed').classList.remove('active')
        }
    })
    document.querySelector('.master-close').addEventListener('click', function () {
        document.querySelector('.master-fixed').classList.remove('active')
        $('.master-fixed').css("display", "none")

    })
}

function incomeCalc() {
    let summary = $('.earnings-input').map((i, el) => el.value).toArray().reduce((total, item) => total * item);
    $('#income_calc').html(new Intl.NumberFormat("ru").format(summary) + ' ₽')
}