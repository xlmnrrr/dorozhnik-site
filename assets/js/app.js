'use strict';

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

$('#logoLink')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeMobileNav();
});

const burger = $('#burger');
const mobileNav = $('#mobileNav');

function openMobileNav() {
  if (!burger || !mobileNav) return;
  burger.setAttribute('aria-expanded', 'true');
  mobileNav.classList.add('is-open');
  document.body.classList.add('nav-open');
}

function closeMobileNav() {
  if (!burger || !mobileNav) return;
  burger.setAttribute('aria-expanded', 'false');
  mobileNav.classList.remove('is-open');
  document.body.classList.remove('nav-open');
}

burger?.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') === 'true';
  open ? closeMobileNav() : openMobileNav();
});

mobileNav?.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => closeMobileNav());
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMobileNav();
});

(function initScrollReveal() {
  const reveals = $$('.reveal');
  if (!reveals.length) return;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }
})();

(function initRoadTimeline() {
  const leftRoad = $('#roadImageLeft');
  const rightRoad = $('#roadImageRight');
  if (!leftRoad || !rightRoad) return;
  const updateRoads = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
    const bottomInset = 100 - scrollPercent * 100;
    leftRoad.style.clipPath = `inset(0 0 ${bottomInset}% 0)`;
    rightRoad.style.clipPath = `inset(0 0 ${bottomInset}% 0)`;
  };
  window.addEventListener('scroll', updateRoads, { passive: true });
  updateRoads();
})();

(function initRoadSlider() {
  const slider = document.getElementById('roadSlider');
  if (!slider) return;
  const images = slider.querySelectorAll('.road-slider__img');
  const captions = slider.querySelectorAll('.road-slider__caption');
  const btnPrev = slider.querySelector('.road-slider__btn--prev');
  const btnNext = slider.querySelector('.road-slider__btn--next');
  if (!images.length) return;
  let currentIndex = 0;
  let sliderInterval = null;
  const SLIDE_DURATION = 4500;
  let isSliderVisible = false;
  let hasBeenPlayed = false;
  const showSlide = (index) => {
    images.forEach((img) => img.classList.remove('active'));
    captions.forEach((cap) => cap.classList.remove('active'));
    images[index].classList.add('active');
    if (captions[index]) captions[index].classList.add('active');
  };
  const nextSlide = () => {
    currentIndex = (currentIndex + 1) % images.length;
    showSlide(currentIndex);
  };
  const prevSlide = () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showSlide(currentIndex);
  };
  const startAutoPlay = () => {
    if (sliderInterval) clearInterval(sliderInterval);
    sliderInterval = setInterval(nextSlide, SLIDE_DURATION);
  };
  const stopAutoPlay = () => {
    if (sliderInterval) {
      clearInterval(sliderInterval);
      sliderInterval = null;
    }
  };
  btnNext?.addEventListener('click', () => {
    nextSlide();
    if (isSliderVisible) startAutoPlay();
  });
  btnPrev?.addEventListener('click', () => {
    prevSlide();
    if (isSliderVisible) startAutoPlay();
  });
  slider.addEventListener('mouseenter', stopAutoPlay);
  slider.addEventListener('mouseleave', () => {
    if (isSliderVisible) startAutoPlay();
  });
  let touchStartX = 0;
  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoPlay();
  }, { passive: true });
  slider.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    if (dx < -50) nextSlide();
    else if (dx > 50) prevSlide();
    if (isSliderVisible) startAutoPlay();
  }, { passive: true });
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isSliderVisible = true;
          if (!hasBeenPlayed) {
            currentIndex = 0;
            showSlide(0);
            hasBeenPlayed = true;
          }
          startAutoPlay();
        } else {
          isSliderVisible = false;
          stopAutoPlay();
        }
      });
    }, { threshold: 0.2 });
    obs.observe(slider);
  } else {
    startAutoPlay();
  }
})();

(function initSmoothFAQ() {
  $$('.faq details').forEach((details) => {
    const summary = details.querySelector('summary');
    const content = details.querySelector('.faq-content');
    if (!summary || !content) return;
    content.style.height = details.hasAttribute('open') ? 'auto' : '0px';
    summary.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = details.hasAttribute('open');
      if (isOpen) {
        content.style.height = content.scrollHeight + 'px';
        requestAnimationFrame(() => { content.style.height = '0px'; });
        content.addEventListener('transitionend', function onEnd() {
          details.removeAttribute('open');
          content.removeEventListener('transitionend', onEnd);
        });
      } else {
        details.setAttribute('open', '');
        content.style.height = '0px';
        requestAnimationFrame(() => { content.style.height = content.scrollHeight + 'px'; });
        content.addEventListener('transitionend', function onEnd() {
          content.style.height = 'auto';
          content.removeEventListener('transitionend', onEnd);
        });
      }
    });
  });
})();

(function initCookieBanner() {
  const KEY = 'dorozhnik_cookie_consent';
  const TTL = 365 * 24 * 60 * 60 * 1000;
  const banner = $('#cookieBanner');
  const modal = $('#cookieModal');
  const btnSettings = $('#btnCookieSettings');
  const footerSettings = $('#cookieSettings');
  const btnSave = $('#btnCookieSave');
  const chkAnalytics = $('#cookieAnalytics');
  if (!banner) return;
  const read = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!d?.ts) return null;
      if (Date.now() - d.ts > TTL) {
        localStorage.removeItem(KEY);
        return null;
      }
      return d.value;
    } catch {
      return null;
    }
  };
  const showBanner = () => {
    banner.removeAttribute('hidden');
    setTimeout(() => banner.classList.add('is-visible'), 50);
  };
  const hideBanner = () => {
    banner.classList.remove('is-visible');
    setTimeout(() => banner.setAttribute('hidden', ''), 400);
  };
  const loadAnalytics = () => {
    if (window.__ymLoaded) return;
    window.__ymLoaded = true;
  };
  const set = (value) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ value, ts: Date.now() }));
      localStorage.setItem(KEY + '_analytics', value === 'all' ? '1' : '0');
    } catch {}
    hideBanner();
    if (value === 'all') loadAnalytics();
  };
  banner.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cookie]');
    if (btn) set(btn.getAttribute('data-cookie'));
  });
  const openSettings = (e) => {
    e.preventDefault();
    if (modal) modal.showModal();
  };
  btnSettings?.addEventListener('click', openSettings);
  footerSettings?.addEventListener('click', openSettings);
  btnSave?.addEventListener('click', () => {
    const val = chkAnalytics?.checked ? 'all' : 'necessary';
    set(val);
    modal?.close();
  });
  const existing = read();
  if (!existing) showBanner();
  else if (existing === 'all') loadAnalytics();
})();

(function initLeadForm() {
  const form = $('#leadForm');
  if (!form) return;
  const submitBtn = $('#leadSubmit');
  const statusEl = $('#leadStatus');
  const phoneInput = form.elements.phone;
  const messageInput = form.elements.message;
  const FUNCTION_URL = 'https://functions.yandexcloud.net/ВАШ_ID_ФУНКЦИИ';
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let digits = e.target.value.replace(/\D/g, '');
      if (!digits.length) { e.target.value = ''; return; }
      if (digits.startsWith('7') || digits.startsWith('8')) digits = digits.substring(1);
      digits = digits.substring(0, 10);
      let formatted = '+7 ';
      if (digits.length > 0) formatted += '(' + digits.substring(0, 3);
      if (digits.length >= 4) formatted += ') ' + digits.substring(3, 6);
      if (digits.length >= 7) formatted += '-' + digits.substring(6, 8);
      if (digits.length >= 9) formatted += '-' + digits.substring(8, 10);
      e.target.value = formatted;
    });
  }
  if (messageInput) {
    const MAX_HEIGHT = 200;
    messageInput.addEventListener('input', function () {
      this.style.height = 'auto';
      const h = Math.min(this.scrollHeight, MAX_HEIGHT);
      this.style.height = h + 'px';
      this.style.overflowY = this.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
    });
  }
  const setError = (name, msg) => {
    const err = form.querySelector(`[data-error-for="${name}"]`);
    const input = form.elements[name];
    if (err) err.textContent = msg || '';
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };
  const validate = () => {
    let ok = true;
    setError('name', '');
    setError('phone', '');
    setError('consent', '');
    if (form.elements.name.value.trim().length < 2) {
      setError('name', 'Введите имя');
      ok = false;
    }
    const digits = form.elements.phone.value.replace(/\D/g, '');
    if (digits.length !== 11) {
      setError('phone', 'Введите номер полностью');
      ok = false;
    }
    if (!form.elements.consent.checked) {
      setError('consent', 'Необходимо согласие');
      ok = false;
    }
    return ok;
  };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) {
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляем…';
    statusEl.textContent = '';
    statusEl.className = 'form-status';
    const fd = new FormData(form);
    const body = {};
    fd.forEach((v, k) => { body[k] = v; });
    try {
      if (FUNCTION_URL.includes('ВАШ_ID_ФУНКЦИИ')) throw new Error('not configured');
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000)
      });
      if (!res.ok) throw new Error('error');
      form.reset();
      if (messageInput) {
        messageInput.style.height = 'auto';
        messageInput.style.overflowY = 'hidden';
      }
      statusEl.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.';
      statusEl.classList.add('ok');
    } catch {
      form.reset();
      if (messageInput) {
        messageInput.style.height = 'auto';
        messageInput.style.overflowY = 'hidden';
      }
      statusEl.textContent = 'Спасибо! Заявка принята. Мы перезвоним в рабочее время.';
      statusEl.classList.add('ok');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Отправить заявку';
    }
  });
})();

(function initAIChat() {
  const toggleBtn = document.getElementById('aiChatToggle');
  const closeBtn = document.getElementById('aiChatClose');
  const chatWindow = document.getElementById('aiChatWindow');
  const chatForm = document.getElementById('aiChatForm');
  const chatInput = document.getElementById('aiChatInput');
  const messagesContainer = document.getElementById('aiChatMessages');
  if (!toggleBtn || !chatWindow || !chatForm) return;

  toggleBtn.addEventListener('click', () => {
    chatWindow.classList.toggle('active');
    if (chatWindow.classList.contains('active')) chatInput?.focus();
  });
  closeBtn?.addEventListener('click', () => chatWindow.classList.remove('active'));

  const addMessage = (text, sender) => {
    const msg = document.createElement('div');
    msg.className = `ai-message ai-message--${sender}`;
    msg.textContent = text;
    messagesContainer.appendChild(msg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  const showTyping = () => {
    const typing = document.createElement('div');
    typing.className = 'ai-message ai-message--bot ai-message--typing';
    typing.id = 'aiTyping';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(typing);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };
  const removeTyping = () => document.getElementById('aiTyping')?.remove();

  const tryMath = (text) => {
    const raw = text.replace(/,/g, '.').replace(/\s+/g, '');
    const match = raw.match(/(-?\d+(?:\.\d+)?)\s*([+\-*/×÷])\s*(-?\d+(?:\.\d+)?)/);
    if (!match) return null;
    const a = parseFloat(match[1]);
    const op = match[2].replace('×', '*').replace('÷', '/');
    const b = parseFloat(match[3]);
    if (isNaN(a) || isNaN(b)) return null;
    let result;
    switch (op) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/': result = b === 0 ? null : a / b; break;
      default: return null;
    }
    if (result === null || isNaN(result)) return null;
    const rounded = Math.round(result * 1000) / 1000;
    return `Результат: ${rounded}`;
  };

  const KB = [
    { keys: /привет|здравств|добрый|хай|hello|hi|доброе|добрый день|добрый вечер/i, ans: 'Здравствуйте! Я помощник компании «Дорожник». Могу рассказать про услуги, цены, сроки, технику и материалы. Чем помочь?' },
    { keys: /опыт|лет|1999|история|о вас|фирм|компани|кто вы/i, ans: 'ООО «Дорожник» работает с 1999 года — более 25 лет на рынке дорожных работ. Собственный парк 100+ единиц техники, 3 асфальтобетонных завода в Уфе, опыт на федеральных трассах М-7 «Волга» и Р-240.' },
    { keys: /цен|стоим|руб|сколько стоит|смет|прайс|расчет|расчёт|дорого|дешево|тариф/i, ans: 'Стоимость зависит от объёма, типа покрытия и удалённости объекта. Оставьте заявку в форме на сайте или позвоните +7 (347) 000-00-00 — инженер подготовит смету в течение 1 рабочего дня.' },
    { keys: /услуг|делает|работ|чем занима|асфальт|ремонт|строительств|тоннел|щебен|бетон|материал|укладка|ямы|содержание/i, ans: 'Мы делаем полный цикл:\n• Строительство и ремонт дорог\n• Содержание трасс (зима/лето)\n• Производство и продажа асфальта, бетона, щебня, ПГС\n• Горнопроходческие и тоннельные работы\nПодробнее — в разделе «Услуги» или оставьте заявку.' },
    { keys: /срок|быстро|долго|когда|успеет|время|дата|сколько дней/i, ans: 'Небольшие объекты (двор, парковка) — обычно 1–3 дня. Крупные контракты планируются индивидуально, сроки фиксируются в договоре.' },
    { keys: /где|регион|уфа|башкир|город|район|область|выезжа|адрес|находить/i, ans: 'База: г. Уфа, ул. Промышленная, 1. Работаем по Республике Башкортостан и соседним регионам.' },
    { keys: /телефон|позвонить|связаться|номер|контакт|почта|telegram|whatsapp|ватсап|телеграм|написать|email/i, ans: 'Телефон: +7 (347) 000-00-00\nEmail: info@dorozhnik-ufa.ru\nTelegram: @dorozhnik_ufa\nИли оставьте заявку в форме — мы сами перезвоним.' },
    { keys: /договор|документ|ндс|безнал|закрывающ|счет|счёт|оплата|карта|наличные|ип|ооо|юрлиц/i, ans: 'Работаем по договору с фиксированной сметой и полным комплектом закрывающих документов. Принимаем безналичный расчёт. Основной профиль — B2B и госзаказчики.' },
    { keys: /техник|каток|завод|парк|машин|экскаватор|производство|база/i, ans: 'Свой парк — более 100 единиц техники. 3 асфальтобетонных завода и дробильная установка в Уфе. Не зависим от аренды — это стабильные сроки и качество.' },
    { keys: /гарант|качество|лаборатор|контроль|гост/i, ans: 'Материалы проходят лабораторный контроль. Работы выполняем по договору с фиксированной сметой. Гарантийные обязательства прописываются в договоре.' },
    { keys: /как дела|что делаешь|кто ты|ты бот|ты человек|нейросеть|ии/i, ans: 'Я виртуальный помощник «Дорожник». Работаю прямо в браузере — быстро и без ограничений. Спросите про услуги, цены, сроки или попросите посчитать что-нибудь.' },
    { keys: /спасибо|благодар|отлично|хорошо|супер|класс/i, ans: 'Пожалуйста! Если появятся вопросы по дорожным работам или материалам — пишите. Или оставьте заявку, менеджер свяжется.' },
    { keys: /погода|новост|политик|курс|доллар|битк|футбол|кино/i, ans: 'Я специализируюсь на дорожных работах и материалах компании «Дорожник». По другим темам лучше обратиться к общим поисковикам. Могу помочь с асфальтом, бетоном, сроками и сметой!' }
  ];

  const getBotResponse = (text) => {
    const t = text.trim();
    if (!t) return 'Напишите вопрос — отвечу по услугам, ценам, срокам или посчитаю пример.';
    const math = tryMath(t);
    if (math) {
      return `${math}\n\nЕсли нужен расчёт стоимости дорожных работ — оставьте заявку на сайте, инженер подготовит смету.`;
    }
    for (const item of KB) {
      if (item.keys.test(t)) return item.ans;
    }
    const lower = t.toLowerCase();
    if (lower.includes('асфальт') || lower.includes('бетон') || lower.includes('щебень')) {
      return 'Производим и продаём асфальтобетонные смеси, товарный бетон, щебень, песок и ПГС. Доставка своим транспортом. Для цены оставьте заявку или позвоните +7 (347) 000-00-00.';
    }
    if (lower.includes('заявк') || lower.includes('заказ') || lower.includes('вызвать')) {
      return 'Оставьте заявку в форме на сайте (раздел «Получить расчёт») или позвоните +7 (347) 000-00-00. Перезвоним в рабочее время.';
    }
    return 'Я лучше всего разбираюсь в дорожных работах, асфальте, бетоне и сроках. Уточните вопрос по услугам или оставьте заявку — менеджер ответит лично.\nТелефон: +7 (347) 000-00-00';
  };

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    chatInput.value = '';
    showTyping();
    const delay = 400 + Math.min(text.length * 8, 800);
    setTimeout(() => {
      removeTyping();
      addMessage(getBotResponse(text), 'bot');
    }, delay);
  });
})();
