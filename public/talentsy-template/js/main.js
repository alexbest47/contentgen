import {S as e, a as t, R as a, r as r, L as o, M as s} from "./vendor-82507c16.js";

function E() {
    let e = document.querySelector(".scrollTop"), t = document.querySelector(".js-scroll-elem");
    if (!e || !t) {
        console.log('Не найдено .js-scroll-elem. Кнопка "Вверх" не отображается');
        return
    }
    e.addEventListener("click", e => {
        e.preventDefault(), window.scrollTo({top: 0, behavior: "smooth"})
    });
    let a = t => {
        e.classList.toggle("active", !t[0].isIntersecting)
    };
    new IntersectionObserver(a, {rootMargin: "400px", threshold: 1}).observe(t)
}

function j() {
    document.addEventListener("click", e => {
        let t = e.target.closest("[data-scrollto]");
        if (!t) return;
        e.preventDefault();
        let a = t.getAttribute("href");
        a || (a = t.dataset.scrollto);
        let r = document.querySelector(a);
        if (!r) {
            console.log(`Элемента ${a} нет`);
            return
        }
        t.dataset.offset && parseInt(t.dataset.offset), r.scrollIntoView({
            behavior: t.dataset.hard ? "auto" : "smooth",
            block: "top"
        })
    })
}

let q = () => {
    new e(".js-review-slider .swiper", {
        loop: !1,
        spaceBetween: 10,
        slidesPerView: "auto",
        navigation: {prevEl: ".js-review-slider .ctrl--prev", nextEl: ".js-review-slider .ctrl--next"},
        pagination: !1,
        breakpoints: {
            767: {slidesPerView: 3},
            1199: {spaceBetween: 30, slidesPerView: 5},
            1600: {spaceBetween: 30, slidesPerView: 6}
        }
    });
    let t = new e(".js-team-slider", {
        loop: !1,
        effect: window.innerWidth > 992 ? "fade" : "slide",
        fadeEffect: {crossFade: !0},
        spaceBetween: 15,
        slidesPerView: "auto",
        navigation: !1,
        pagination: !1,
        autoHeight: 1,
        lazy: !0,
        lazyPreloadPrevNext: 2,
        breakpoints: {992: {slidesPerView: 1, autoHeight: 1, spaceBetween: 0}}
    });
    new e(".js-diplomblock-slider", {
        loop: !0,
        spaceBetween: 15,
        slidesPerView: 1,
        navigation: {prevEl: ".js-diplomblock-slider .ctrl--prev", nextEl: ".js-diplomblock-slider .ctrl--next"}
    });
    let a = document.querySelector(".teamblock");
    a && (a.addEventListener("mouseover", e => {
        let a = e.target.closest(".teamblock__navlink[data-slide]");
        a && (e.preventDefault(), t.slideTo(parseInt(a.dataset.slide)))
    }), a.addEventListener("click", e => {
        e.target.closest(".teamblock__navlink[data-slide]") && e.preventDefault()
    })), new e(".js-front-cat .swiper", {
        loop: !1,
        spaceBetween: 20,
        slidesPerView: "auto",
        pagination: !1,
        autoHeight: !1,
        navigation: {prevEl: ".js-front-cat .ctrl--prev", nextEl: ".js-front-cat .ctrl--next"},
        breakpoints: {1200: {slidesPerView: 3}},
        lazy: !0,
        lazyPreloadPrevNext: 2
    }), new e(".js-frontblog .swiper", {
        loop: !1,
        spaceBetween: 20,
        slidesPerView: "auto",
        pagination: !1,
        autoHeight: !1,
        navigation: {prevEl: ".js-frontblog .ctrl--prev", nextEl: ".js-frontblog .ctrl--next"},
        breakpoints: {1e3: {slidesPerView: 3, spaceBetween: 20}},
        lazy: !0,
        lazyPreloadPrevNext: 2
    }), new e(".js-relations-posts .swiper", {
        loop: !1,
        spaceBetween: 20,
        slidesPerView: "auto",
        navigation: {prevEl: ".js-relations-posts .ctrl--prev", nextEl: ".js-relations-posts .ctrl--next"},
        pagination: !1,
        breakpoints: {767: {slidesPerView: 2}, 1199: {spaceBetween: 30, slidesPerView: 3}}
    }), new e(".js-blog-footer .swiper", {
        loop: !0,
        spaceBetween: 20,
        slidesPerView: "auto",
        navigation: {prevEl: ".js-blog-footer .ctrl--prev", nextEl: ".js-blog-footer .ctrl--next"},
        pagination: {
            type: "custom",
            el: ".js-blog-footer .blogproffslider__pag",
            renderCustom: (e, t, a) => `<span>${10 > parseInt(t) ? "0" : ""}${t}</span><span class="blogproffslider__scroll"><i style="width:${100 * t / a}%"></i></span><span>${a}</span>`
        },
        breakpoints: {1199: {spaceBetween: 30, slidesPerView: 3}, 1300: {spaceBetween: 30, slidesPerView: 4}}
    }), new e(".nutri18__swiper", {
        loop: !1,
        spaceBetween: 20,
        slidesPerView: "auto",
        navigation: !1,
        pagination: !1,
        breakpoints: {992: {spaceBetween: 40}}
    }), new e(".js-facult-projects", {
        loop: !0,
        spaceBetween: 40,
        slidesPerView: "auto",
        navigation: !1,
        pagination: {el: ".facultportfolio__pag", type: "bullets", dynamicBullets: !0, dynamicMainBullets: 15},
        centeredSlides: !0,
        breakpoints: {992: {spaceBetween: 100}}
    }), "function" == typeof initAddictSwipers && initAddictSwipers(e)
}, T = () => {
    document.querySelector("[data-hidebox]") && (document.addEventListener("click", e => {
        let t = e.target.closest("[data-hideopen]");
        if (!t) return;
        e.preventDefault();
        let a = document.querySelector(`[data-hidewrap="${t.dataset.hideopen}"]`),
            r = document.querySelector(`[data-hidebox="${t.dataset.hideopen}"]`);
        if (r) {
            if (r.classList.contains("is-opened")) {
                r.style.height = `${r.scrollHeight}px`, null == a || a.classList.remove("is-opened"), r.classList.remove("is-opened"), t.classList.remove("is-opened"), setTimeout(() => {
                    r.style.height = ""
                }, 0);
                return
            }
            r.style.height = 0, null == a || a.classList.add("is-opened"), t.classList.add("is-opened"), r.classList.add("is-opened"), setTimeout(() => {
                r.style.height = `${r.scrollHeight}px`
            }, 0), setTimeout(() => {
                r.style.height = ""
            }, 1e3)
        }
    }), document.addEventListener("click", e => {
        document.querySelectorAll("*[data-hidewrap].is-opened").forEach(t => {
            t.dataset.hideclick && e.target.closest("[data-hidewrap]") !== t && (t.classList.remove("is-opened"), t.querySelectorAll("[data-hideopen]").forEach(e => {
                e.classList.remove("is-opened")
            }), t.querySelectorAll("[data-hidebox]").forEach(e => {
                e.classList.remove("is-opened")
            }))
        })
    }))
}, A = () => {
    let e = document.querySelector(".js-review-slider");
    e && (e.addEventListener("mouseover", e => {
        let t = e.target.closest(".reviewsslider__screen");
        t && t.play()
    }), e.addEventListener("mouseout", e => {
        let t = e.target.closest(".reviewsslider__screen");
        t && t.pause()
    }))
};

function P() {
    t().reveal(document.querySelectorAll(".js-slide-bot"), {
        delay: 0,
        distance: "70px",
        duration: 400,
        origin: "bottom",
        reset: !1,
        mobile: !1,
        viewOffset: {bottom: 100, top: 100}
    }), t().reveal(document.querySelectorAll(".title"), {
        delay: 0,
        distance: "60px",
        duration: 700,
        origin: "bottom",
        reset: !1,
        mobile: !1,
        viewOffset: {bottom: 100, top: 100}
    }), t().reveal(document.querySelectorAll(".js-slide-opac"), {
        delay: 0,
        duration: 700,
        scale: .9,
        interval: 0,
        reset: !1,
        mobile: !1,
        opacity: 0,
        viewOffset: {bottom: 100, top: 100}
    }), t().reveal(document.querySelectorAll(".js-slide-right"), {
        delay: 0,
        distance: "100px",
        duration: 1e3,
        origin: "right",
        reset: !1,
        mobile: !1,
        viewOffset: {bottom: 100, top: 100}
    }), t().reveal(document.querySelectorAll(".js-slide-left"), {
        delay: 0,
        distance: "100px",
        duration: 1e3,
        origin: "left",
        reset: !1,
        mobile: !1,
        viewOffset: {bottom: 100, top: 100}
    }), t().reveal(document.querySelectorAll(".js-slide-interval"), {
        distance: "30px",
        duration: 400,
        useDelay: "always",
        origin: "bottom",
        interval: 100,
        reset: !1,
        mobile: !1,
        viewOffset: {bottom: 100, top: 100}
    }), t().reveal(document.querySelectorAll(".js-slide-spin"), {
        rotate: {z: -30},
        duration: 600,
        useDelay: "always",
        origin: "bottom",
        interval: 300,
        reset: !1,
        mobile: !1,
        viewOffset: {bottom: 100, top: 100}
    }), t().reveal(document.querySelectorAll(".js-slide-spinrev"), {
        rotate: {z: 30},
        duration: 800,
        useDelay: "always",
        origin: "bottom",
        interval: 300,
        reset: !1,
        mobile: !1,
        viewOffset: {bottom: 100, top: 100}
    })
}

let B = () => {
    if (gsap.registerPlugin(ScrollTrigger), document.querySelector(".front2") && (gsap.fromTo(".frontlead__bgs", {opacity: 1}, {
        opacity: 0,
        scrollTrigger: {trigger: ".front2", start: "-600", end: "0", scrub: !0}
    }), window.innerWidth > 1e3)) {
        let e = gsap.timeline({
            scrollTrigger: {
                trigger: ".front2",
                start: "top bottom",
                end: "bottom top",
                scrub: !0,
                markers: !1,
                pin: !1
            }
        });
        e.to(".front2--0", {y: -400, ease: "linear"}, "anim2"), e.to(".front2--1", {
            y: -100,
            ease: "linear"
        }, "anim2"), e.to(".front2--2", {y: -250, ease: "linear"}, "anim2"), e.to(".front2--3", {
            y: -500,
            ease: "linear"
        }, "anim2")
    }
    if (document.querySelector(".front4") && gsap.to("body", {
        "background-color": "rgb(231, 226, 255)",
        scrollTrigger: {trigger: ".front4", start: "center center", end: "+1000", scrub: !0}
    }), document.querySelector(".js-front5-title")) {
        let t = document.querySelector(".aboutscrollpixs"), a = gsap.timeline({
            scrollTrigger: {
                trigger: ".js-front5-title",
                start: "center center",
                end: "2500px",
                scrub: !0,
                markers: !1,
                pin: !0
            }
        });
        document.querySelector(".front5--about") && a.to(".front5--about", {
            "background-color": "rgba(255, 255, 255, 0)",
            duration: 5,
            ease: Expo.easeIn
        }, "myLabel"), document.querySelector(".front5--front") && a.to("body", {
            "background-color": "rgb(245, 238, 230)",
            duration: 5,
            ease: Expo.easeIn
        }, "myLabel"), a.to(t, {
            y: `-${t.scrollHeight + window.innerHeight + 200}`,
            ease: "linear",
            duration: 5
        }, "myLabel"), a.to(".front5__pic2", {
            y: "-600",
            ease: "linear",
            duration: 5
        }, "myLabel"), a.fromTo(".front5__sub", {scale: .95, opacity: "0", ease: "linear", duration: 1}, {
            scale: "1",
            opacity: "1",
            ease: "linear",
            duration: 1
        })
    }
    let r = Array.from(document.querySelectorAll(".js-frontlead-bgs .frontleadbg")),
        o = Array.from(document.querySelectorAll(".front3__bg"));
    (r.length || o.length) && document.addEventListener("mouseover", e => {
        if (window.innerWidth < 1200) return;
        let t = e.target.closest(".js-fronthover");
        if (t) {
            r.forEach((e, a) => {
                parseInt(t.dataset.hover) === a + 1 ? e.classList.add("is-active") : e.classList.remove("is-active")
            });
            return
        }
        let a = e.target.closest(".js-front3-link");
        if (a) {
            o.forEach((e, t) => {
                parseInt(a.dataset.bgnum) === t ? e.classList.add("is-active") : e.classList.remove("is-active")
            });
            return
        }
        o.forEach((e, t) => {
            e.classList.remove("is-active")
        })
    })
};

function I() {
    !document.querySelector(".astroabout__sideblock") || window.innerWidth < 1e3 || gsap.timeline({
        scrollTrigger: {
            trigger: ".astroabout__wrap",
            pin: ".astroabout__sideblock",
            start: "310 center",
            end: "bottom +=620",
            scrub: 1,
            markers: !1
        }
    })
}

function O() {
    let e = document.querySelector(".aboutloader"), t = document.querySelector(".aboutloader__pre"),
        a = document.querySelector(".aboutloader__hero");
    if (!e) return;
    let r = gsap.timeline({
        scrollTrigger: {
            trigger: ".aboutloader",
            pin: ".aboutloader",
            start: "top top",
            end: "bottom top",
            scrub: !0,
            markers: !1
        }
    });
    r.to(t, {scale: 6, ease: "linear"}, "aboutlabel"), r.to(a, {
        scale: 1.1,
        ease: "linear"
    }, "aboutlabel"), gsap.timeline({
        scrollTrigger: {
            trigger: ".aboutloader__opacitystart",
            start: "top top",
            end: "400px",
            scrub: !0,
            markers: !1
        }
    }).to(t, {opacity: 0}), gsap.timeline({
        scrollTrigger: {
            trigger: ".about2",
            start: "top bottom",
            end: "+=500",
            scrub: !0,
            markers: !1
        }
    }).to(a, {opacity: 0});
    let o = gsap.timeline({
        scrollTrigger: {
            trigger: ".about2__sub",
            start: "top bottom",
            end: "top top",
            scrub: 1,
            markers: !1
        }
    });
    o.to(".about2__fig1", {y: -800}), o.to(".about2__fig2", {y: -250}, "<"), o.fromTo(".about2__fig3", {y: 500}, {y: -200}, "<"), o.to(".about2__fig4", {y: -1e3}, "<"), window.innerWidth > 992 && document.querySelectorAll("[data-gsapx]").forEach(e => {
        let t = gsap.timeline({
            scrollTrigger: {
                trigger: e,
                start: "top bottom",
                end: "top top",
                scrub: 1,
                markers: !1
            }
        });
        t.fromTo(e, {x: parseInt(e.dataset.gsapx)}, {x: -parseInt(e.dataset.gsapx)}), window.rehreshGsap = () => {
            console.log("рефреш"), t.refresh()
        }
    })
}

function V() {
    let e = document.querySelector(".faculthero");
    if (!e) return;
    let t = gsap.timeline({scrollTrigger: {trigger: e, start: "top top", end: "+=600", markers: !1, scrub: 0}});
    t.to(".faculthero__bgbutton", {scale: 26}), t.to(".faculthero__button", {
        color: "#000",
        duration: .1
    }, "<"), t.to(".faculthero__button", {scale: 0, duration: .2}, "<"), e.querySelectorAll("[data-x]").forEach(e => {
        t.to(e, {scale: parseFloat(e.dataset.scale), x: parseFloat(e.dataset.x), y: parseFloat(e.dataset.y)}, "<")
    }), gsap.timeline({
        scrollTrigger: {
            trigger: ".facultprogs",
            start: "top top",
            end: "+=1",
            markers: !1,
            scrub: .1
        }
    }).to(".faculthero__buttonwrap", {display: "none", duration: .2})
}

function H(e) {
    let t = document.cookie.match(RegExp("(?:^|; )" + e.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
    return t ? decodeURIComponent(t[1]) : void 0
}

I(), O(), V();
let v = (e, t) => {
    var a;
    t.querySelectorAll("[data-tab]").forEach(t => {
        t.classList.toggle("is-active", t.dataset.tab === e)
    }), t.querySelectorAll("[data-tablink]").forEach(t => {
        t.classList.toggle("is-active", t.dataset.tablink === e)
    }), null == (a = window.msnry) || a.layout(), ScrollTrigger.refresh()
}, D = () => {
    if (document.querySelector("[data-cookietab]")) {
        let e = H("activeTab");
        e && v(e, document)
    }
    document.addEventListener("click", e => {
        let t = e.target.closest("[data-tablink]"), a = e.target.closest("[data-tabwrap]");
        if (!t || !a) return;
        e.preventDefault(), v(t.dataset.tablink, a);
        let r = document.querySelector(".is-active[data-cookietab][data-tab]");
        r && r.dataset.cookietab && (document.cookie = `activeTab=${r.dataset.tab}; max-age=6000000`)
    })
};

function $() {
    let e = document.querySelector(".js-postfooter-wrap");
    e && e.addEventListener("click", async t => {
        if (!window.postId) {
            console.log("Ошибка нет переменной window.postId");
            return
        }
        let a = t.target.closest(".rating__star");
        a && setTimeout(async () => {
            console.log(a.value);
            let t = a.value;
            document.cookie = `rate_post_${window.postId || 0}=${t}; max-age=6000; path=/;`, e.querySelector("fieldset").setAttribute("disabled", "disabled");
            let r = new FormData;
            r.append("post_id", parseInt(window.postId)), r.append("rate", parseInt(t)), r.append("action", "ratepost"), e.querySelector("fieldset").classList.add("is-loading");
            let o = await fetch(window.ajaxurl, {method: "POST", credentials: "include", body: r});
            if (!o.ok) {
                console.log(o);
                return
            }
            console.log("result");
            let s = await o.text();
            e.innerHTML = s, e.querySelector("fieldset").classList.remove("is-loading")
        }, 100)
    })
}

function F() {
    let e = document.querySelector(".js-catalog"), t = document.querySelector(".js-pagination-wrap"),
        a = ".blogcategory__grid";
    if (!e) return;
    let r = e.dataset.actionname, o = new Set, s = document.querySelectorAll("[data-catid]");

    function l() {
        let e = document.querySelector("#js-cat-pagination"), t = document.querySelector(".js-pagination-wrap");
        e && t && (t.innerHTML = "", e.content.firstElementChild && t.append(e.content.firstElementChild))
    }

    async function i(r, o = !1) {
        e.querySelector(a).classList.add("is-loading"), t && t.classList.add("is-loading"), o || window.scrollTo({
            top: document.querySelector(".js-catalog").getBoundingClientRect().top + window.scrollY - 100,
            behavior: "smooth"
        });
        let s = await fetch(window.ajaxurl, {method: "post", body: r});
        if (!s.ok) {
            console.log(s);
            return
        }
        let i = await s.text();
        new DOMParser().parseFromString(i, "text/html");
        let n = Array.from(e.querySelectorAll(".js-item"));
        e.innerHTML = "", e.insertAdjacentHTML("beforeend", i);
        let c = e.querySelector(a);
        o && n.reverse().forEach(e => {
            c.insertAdjacentElement("afterbegin", e)
        }), c.classList.remove("is-loading"), t && t.classList.remove("is-loading"), l()
    }

    l(), document.addEventListener("click", async t => {
        let l = t.target.closest("[data-catid]");
        if (l) {
            if (e.querySelector(a).classList.contains("is-loading")) return;
            parseInt(l.dataset.catid), l.classList.toggle("is-active"), o.clear(), s.forEach(e => {
                e.classList.contains("is-active") && o.add(parseInt(e.dataset.catid))
            });
            let n = new FormData;
            n.append("action", r), n.append("catlist", JSON.stringify(Array.from(o.values()))), n.append("page_num", 1), await i(n)
        }
        let c = t.target.closest(".js-pagination-wrap .nav-links a");
        if (c) {
            var d, p, u;
            t.preventDefault(), o.clear(), s.forEach(e => {
                e.classList.contains("is-active") && o.add(parseInt(e.dataset.catid))
            });
            let g = new FormData, f, b;
            g.append("action", r), g.append("catlist", JSON.stringify(Array.from(o.values()))), g.append("page_num", (d = c, f = parseInt(null == (u = null == (p = document.querySelector(a)) ? void 0 : p.dataset) ? void 0 : u.currentpage), f || (f = 1), b = parseInt(d.innerText), b || (d.classList.contains("next") && (b = f + 1), d.classList.contains("prev") && (b = f > 1 ? f - 1 : 1)), b)), c.dataset.perpage && g.append("per_page", c.dataset.perpage), c.dataset.exclude && g.append("exclude", m.dataset.exclude), await i(g)
        }
        let m = t.target.closest(".js-loadmore");
        if (m) {
            m.setAttribute("disabled", "disabled"), t.preventDefault(), o.clear(), s.forEach(e => {
                e.classList.contains("is-active") && o.add(parseInt(e.dataset.catid))
            });
            let y = new FormData;
            y.append("action", r), y.append("catlist", JSON.stringify(Array.from(o.values()))), y.append("taxonomyType", m.dataset.taxonomytype || "cat"), y.append("page_num", parseInt(m.dataset.needpage)), m.dataset.perpage && y.append("per_page", m.dataset.perpage), m.dataset.exclude && y.append("exclude", m.dataset.exclude), await i(y, !0), m.removeAttribute("disabled")
        }
    })
}

q(), T(), A(), j(), E(), P(), D(), $(), F(), a.bind("[data-fancybox]", {
    Toolbar: {display: ["close"]},
    Image: {zoom: !1},
    compact: !0,
    animated: !1,
    preload: 0,
    placeFocusBack: !1,
    template: {buttons: ""}
}), window.modalInstance = new r({
    linkAttributeName: "data-hystmodal",
    waitTransitions: !0,
    catchFocus: !1,
    backscroll: !0,
    beforeOpen(e) {
        "menuSearchModal" === e.element.id && setTimeout(() => {
            e.element.querySelector('input[type="search"]').focus()
        }, 200)
    }
}), new o;
let h = document.querySelector(".reviewsslider__cont");
h && new o({container: h}), document.querySelectorAll(".grid-mob-scroll").forEach(e => {
    new o({container: e})
});
let M = () => {
    document.addEventListener("click", e => {
        var t, a;
        let r = e.target.closest(".js-promolink");
        r && (e.preventDefault(), null == (a = null == (t = r.closest(".promobox")) ? void 0 : t.classList) || a.add("is-active"))
    })
};
M(), document.querySelector(".js-need-gsap") && B();
let S = () => {
    document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`)
};

function z() {
    let e = document.querySelector(".js-toc");
    if (!e) return;
    let t = e.querySelector(".js-togbox");
    e.addEventListener("click", a => {
        if (a.target.closest(".js-longer")) {
            t.style.height = `${t.scrollHeight}px`, t.classList.add("is-long");
            return
        }
        if (a.target.closest(".js-short")) {
            t.style.height = "", t.classList.remove("is-long");
            return
        }
        if (a.target.closest(".js-toggler")) {
            e.classList.contains("is-open") ? (t.style.height = `${t.scrollHeight}px`, e.classList.remove("is-open"), setTimeout(() => t.style.height = "", 10), t.classList.remove("is-long")) : (t.classList.contains("tableofcontent__minimum") || (t.style.height = `${t.scrollHeight}px`), e.classList.add("is-open"));
            return
        }
    })
}

function C() {
    document.addEventListener("click", e => {
        let t = e.target.closest(".js-changeiframe");
        if (!t) return;
        e.preventDefault();
        let a = `<iframe src="https://www.youtube.com/embed/${t.dataset.link}?enablejsapi=1&rel=0&showinfo=0" class="square__img" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen width="400" height="400"></iframe>`;
        t.classList.add("is-opened"), t.innerHTML = a;
        let r = t.querySelector("iframe");
        setTimeout(() => {
            console.log("Пытаемся"), r.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', "*")
        }, 1e3)
    })
}

function N() {
    var e = document.querySelector(".reviewpage__screens");
    e && window.addEventListener("load", () => {
        window.msnry = new s(e, {
            itemSelector: ".reviewpage__screenlink",
            columnWidth: ".reviewpage__screenlink",
            percentPosition: !0,
            horizontalOrder: !1,
            transitionDuration: 0
        })
    })
}

function R() {
    document.addEventListener("change", e => {
        let t = e.target.closest(".fileinput input");
        if (!t) return;
        let a = t.parentElement.querySelector(".fileinput__info"), r = e.target.files[0];
        if (r.size > 10485760) {
            alert("Ошибка. Файл больше 10 МБ!"), t.value = "", a.innerHTML = "";
            return
        }
        a.innerHTML = r.name
    })
}

window.addEventListener("resize", S), S(), z(), C(), N(), R();