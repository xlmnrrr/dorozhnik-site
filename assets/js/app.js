'use strict';

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

$('#logoLink')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

(function initScrollReveal() {
  const reveals = $$('.reveal');
  if (!reveals.length) return;

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    reveals.forEach(el => revealObserver.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
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
    
    const bottomInset = 100 - (scrollPercent * 100);
    
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

  if (images.length === 0) return;

  let currentIndex = 0;
  let sliderInterval = null;
  const SLIDE_DURATION = 4000;
  let isSliderVisible = false;
  let hasBeenPlayed = false;

  const showSlide = (index) => {
    images.forEach(img => img.classList.remove('active'));
    captions.forEach(cap => cap.classList.remove('active'));

    images[index].classList.add('active');
    if (captions[index]) {
      captions[index].classList.add('active');
    }
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
  let touchEndX = 0;

  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoPlay();
  }, { passive: true });

  slider.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 50) {
      nextSlide();
    } else if (touchEndX - touchStartX > 50) {
      prevSlide();
    }
    if (isSliderVisible) startAutoPlay();
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    const sliderObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
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

    sliderObserver.observe(slider);
  } else {
    startAutoPlay();
  }
})();

(function initSmoothFAQ() {
  const detailsElements = $$('.faq details');
  
  detailsElements.forEach((details) => {
    const summary = details.querySelector('summary');
    const content = details.querySelector('.faq-content');
    
    if (!summary || !content) return;

    if (details.hasAttribute('open')) {
      content.style.height = 'auto';
    } else {
      content.style.height = '0px';
    }

    summary.addEventListener('click', (e) => {
      e.preventDefault();

      const isOpen = details.hasAttribute('open');

      if (isOpen) {
        content.style.height = content.scrollHeight + 'px';
        requestAnimationFrame(() => {
          content.style.height = '0px';
        });
        content.addEventListener('transitionend', function onEnd() {
          details.removeAttribute('open');
          content.removeEventListener('transitionend', onEnd);
        });
      } else {
        details.setAttribute('open', '');
        content.style.height = '0px';
        requestAnimationFrame(() => {
          content.style.height = content.scrollHeight + 'px';
        });
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
      if (Date.now() - d.ts > TTL) { localStorage.removeItem(KEY); return null; }
      return d.value;
    } catch { return null; }
  };

  const showBanner = () => {
    banner.removeAttribute('hidden');
    setTimeout(() => banner.classList.add('is-visible'), 50);
  };

  const hideBanner = () => {
    banner.classList.remove('is-visible');
    setTimeout(() => banner.setAttribute('hidden', ''), 400); 
  };

  const set = (value) => {
    try { 
      localStorage.setItem(KEY, JSON.stringify({ value, ts: Date.now() })); 
      if (value === 'all') localStorage.setItem(KEY + '_analytics', '1');
      if (value === 'necessary') localStorage.setItem(KEY + '_analytics', '0');
    } catch {}
    hideBanner();
  };

  banner.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cookie]');
    if (btn) set(btn.getAttribute('data-cookie'));
  });

  const openSettings = (e) => {
    e.preventDefault();
    modal.showModal();
  };
  btnSettings?.addEventListener('click', openSettings);
  footerSettings?.addEventListener('click', openSettings);

  btnSave?.addEventListener('click', () => {
    const val = chkAnalytics.checked ? 'all' : 'necessary';
    set(val);
    modal.close();
  });

  if (!read()) {
    showBanner();
  }
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
      if (digits.length === 0) { e.target.value = ''; return; }
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
    messageInput.addEventListener('input', function() {
      this.style.height = 'auto'; 
      const newHeight = Math.min(this.scrollHeight, MAX_HEIGHT);
      this.style.height = newHeight + 'px';
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
    setError('name', ''); setError('phone', ''); setError('consent', '');
    
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
    if (!validate()) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляем…';
    statusEl.textContent = '';
    statusEl.className = 'form-status';

    const fd = new FormData(form);
    const body = {};
    fd.forEach((v, k) => { body[k] = v; });

    try {
      if (FUNCTION_URL.includes('ВАШ_ID_ФУНКЦИИ')) throw new Error('URL формы не настроен');

      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000)
      });
      if (!res.ok) throw new Error('Ошибка');
      
      form.reset();
      if (messageInput) {
        messageInput.style.height = 'auto';
        messageInput.style.overflowY = 'hidden';
      }
      
      statusEl.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.';
      statusEl.classList.add('ok');
    } catch (err) {
      if (FUNCTION_URL.includes('ВАШ_ID_ФУНКЦИИ')) {
        form.reset();
        if (messageInput) {
          messageInput.style.height = 'auto';
          messageInput.style.overflowY = 'hidden';
        }
        statusEl.textContent = 'Тест: Форма работает! (Для реальной отправки нужен URL)';
        statusEl.classList.add('ok');
      } else {
        statusEl.textContent = 'Не удалось отправить. Попробуйте ещё раз или позвоните нам.';
        statusEl.classList.add('err');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Отправить заявку';
    }
  });
})();

/* ========================================================= */
/* --- УМНЫЙ ЛОКАЛЬНЫЙ БОТ (С МАТЕМАТИКОЙ И БАЗОЙ ЗНАНИЙ) --- */
/* ========================================================= */
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
    if (chatWindow.classList.contains('active')) {
      chatInput.focus();
    }
  });
  closeBtn.addEventListener('click', () => {
    chatWindow.classList.remove('active');
  });

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

  const removeTyping = () => {
    const typing = document.getElementById('aiTyping');
    if (typing) typing.remove();
  };

  // Функция для безопасного вычисления математики
  const tryMath = (text) => {
    const cleanStr = text.replace(/[^0-9+\-*/().\s]/g, '').trim();
    if (!cleanStr || !/[0-9]/.test(cleanStr)) return null;
    
    if (/[a-zA-Zа-яА-Я]/.test(text.replace(/[^a-zA-Zа-яА-Я]/g, ''))) {
       if(!text.match(/сколько|посчитай|вычисли|реши/i)) return null;
    }
    if (!/[+\-*/]/.test(cleanStr)) return null; 

    try {
      const result = new Function('return ' + cleanStr)();
      if (typeof result === 'number' && !isNaN(result)) {
        return `Результат: ${result}`;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  // "Мозг" бота
  const getBotResponse = (text) => {
    const t = text.toLowerCase();

    // 1. Проверка на математику
    const mathResult = tryMath(t);
    if (mathResult) {
      return `${mathResult} \n\nЕсли вам нужен точный расчёт стоимости дорожных работ, оставьте заявку на сайте!`;
    }
    
    // 2. Приветствия
    if (t.match(/привет|здравств|добрый|хай|hello|доброе утро|добрый день/i)) {
      return 'Здравствуйте! Рад вас видеть. Я могу рассказать про наши услуги, цены, сроки, помочь с расчётами или соединить с менеджером. Что вас интересует?';
    }

    // 3. Цены и расчет
    if (t.match(/цен|стоим|руб|сколько|смет|прайс|расчет|расчёт|дорого|дешево/i)) {
      return 'Стоимость зависит от объёма работ, типа покрытия и удалённости объекта. Оставьте заявку в форме на сайте или позвоните по номеру +7 (347) 000-00-00. Инженер подготовит точную смету в течение 1 рабочего дня.';
    }

    // 4. Услуги
    if (t.match(/услуг|делает|работ|чем занимаетесь|асфальт|ремонт|строительств|тоннел|щебен|бетон|материал|укладка|ямы/i)) {
      return 'Мы выполняем полный цикл работ: строительство и ремонт дорог, содержание трасс, тоннельные работы, а также производим и продаём асфальт, бетон, щебень и песок (своя база в Уфе). Подробнее в разделе «Услуги».';
    }

    // 5. Сроки
    if (t.match(/срок|быстро|долго|когда|успеет|время|дата/i)) {
      return 'Небольшие объекты (двор, парковка) мы можем сделать за 1–3 дня. Крупные контракты требуют подготовки, но сроки всегда фиксируются в договоре.';
    }

    // 6. География
    if (t.match(/где|регион|уфа|башкир|город|район|область|выезжаете|адрес/i)) {
      return 'Наша база находится в Уфе, ул. Промышленная, 1. Работаем по всей Республике Башкортостан и соседним регионам.';
    }

    // 7. Контакты
    if (t.match(/телефон|позвонить|связаться|номер|контакт|почта|telegram|whatsapp|ватсап|телеграм|написать/i)) {
      return 'Вы можете позвонить нам по номеру: +7 (347) 000-00-00. Написать в Telegram: @dorozhnik_ufa, или оставить заявку в форме на сайте — мы сами перезвоним.';
    }

    // 8. Документы / Договор
    if (t.match(/договор|документ|ндс|безнал|закрывающ|счет|счёт|оплата|карта|наличные/i)) {
      return 'Да, мы работаем по договору с фиксированной сметой. Предоставляем все закрывающие документы. Работаем с юридическими лицами (в том числе по безналичному расчёту).';
    }

    // 9. О компании / Опыт
    if (t.match(/опыт|лет|1999|техника|завод|катк|производств|история|о вас/i)) {
      return 'Компания «Дорожник» работает с 1999 года. У нас собственный парк техники (100+ единиц), 3 асфальтобетонных завода и опыт работы на федеральных трассах (М-7, Р-240).';
    }

    // 10. Общие вопросы (эмуляция)
    if (t.match(/как дела|что делаешь|кто ты|ты бот|ты человек/i)) {
      return 'Я — виртуальный помощник компании «Дорожник». Моя задача — помогать клиентам с вопросами о дорожных работах и материалах. Могу я вам чем-то помочь?';
    }

    // Ответ по умолчанию
    return 'К сожалению, я узкопрофильный ИИ-помощник и не могу ответить на этот вопрос. Но я отлично разбираюсь в дорожных работах, асфальте и бетоне! Спросите меня о ценах, сроках или услугах. Или позвоните нам: +7 (347) 000-00-00.';
  };

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    chatInput.value = '';
    
    showTyping();

    setTimeout(() => {
      removeTyping();
      const response = getBotResponse(text);
      addMessage(response, 'bot');
    }, 600); 
  });
})();