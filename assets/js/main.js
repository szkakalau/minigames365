// Internationalization (i18n) Support
const translations = {
  en: {
    'site-title': 'PlayCentral - Free Online Games',
    'site-description': 'Play the best free online games! No downloads required. Enjoy action, puzzle, arcade games and more on desktop and mobile.',
    'nav-featured': 'Featured',
    'nav-categories': 'Categories', 
    'nav-new-games': 'New Games',
    'search-placeholder': 'Search games...',
    'hero-title': 'Play the Best Free Online Games',
    'hero-description': 'Discover thousands of games across all categories. No downloads, no registration required. Play instantly on any device!',
    'hero-stat-games': '🎮 1000+ Games',
    'hero-stat-platforms': '📱 Mobile & Desktop',
    'hero-stat-free': '🆓 Always Free',
    'featured-title': '🔥 Featured Games',
    'categories-title': '📂 Game Categories',
    'new-games-title': '🆕 Latest Games',
    'game-over': 'Game Over',
    'restart': 'Restart',
    'pause': 'Pause',
    'resume': 'Resume',
    'score': 'Score',
    'best': 'Best',
    'play-again': 'Play Again',
    'home': 'Home',
    // New keys for Crypto Collectibles page and header consistency
    'categories': 'Categories',
    'controls': 'Controls',
    'controls-detail': 'Desktop: ← → or A/D to move. Mobile: tap/drag to move.',
    'more-games': 'You may also like',
    'final-score': 'Final Score',
    'crypto-title': 'Crypto Collectibles',
    'crypto-desc': 'Catch rare crypto tokens and avoid scams. Simple, fast, and fun on any device!',
    // New keys for Video game monetization
    'vgm-title': 'Video game monetization',
    'vgm-desc': 'Balance ads and user happiness. Collect revenue while avoiding churn. Optimized for mobile & desktop.',
    // New keys for Hbm4
    'hbm4-title': 'Hbm4',
    'hbm4-desc': 'Dodge incoming blocks, collect power-ups, survive as long as possible. High-speed arcade action optimized for mobile & desktop.'
  },
  es: {
    'site-title': 'PlayCentral - Juegos Online Gratis',
    'site-description': '¡Juega los mejores juegos online gratis! No requiere descargas. Disfruta de juegos de acción, puzzle, arcade y más en desktop y móvil.',
    'nav-featured': 'Destacados',
    'nav-categories': 'Categorías',
    'nav-new-games': 'Nuevos Juegos',
    'search-placeholder': 'Buscar juegos...',
    'hero-title': 'Juega los Mejores Juegos Online Gratis',
    'hero-description': 'Descubre miles de juegos en todas las categorías. ¡Sin descargas, sin registro requerido. Juega instantáneamente en cualquier dispositivo!',
    'hero-stat-games': '🎮 1000+ Juegos',
    'hero-stat-platforms': '📱 Móvil y Desktop',
    'hero-stat-free': '🆓 Siempre Gratis',
    'featured-title': '🔥 Juegos Destacados',
    'categories-title': '📂 Categorías de Juegos',
    'new-games-title': '🆕 Últimos Juegos',
    'game-over': 'Juego Terminado',
    'restart': 'Reiniciar',
    'pause': 'Pausar',
    'resume': 'Reanudar',
    'score': 'Puntuación',
    'best': 'Mejor',
    'play-again': 'Jugar Otra Vez',
    'home': 'Inicio',
    // Nuevas claves
    'categories': 'Categorías',
    'controls': 'Controles',
    'controls-detail': 'Escritorio: ← → o A/D para moverse. Móvil: toca/arrastra para moverte.',
    'more-games': 'También te puede gustar',
    'final-score': 'Puntuación Final',
    'crypto-title': 'Crypto Collectibles',
    'crypto-desc': 'Atrapa tokens cripto raros y evita estafas. ¡Simple, rápido y divertido en cualquier dispositivo!',
    'vgm-title': 'Monetización de videojuegos',
    'vgm-desc': 'Equilibra anuncios y felicidad del jugador. Cobra ingresos evitando el abandono. Optimizado para móvil y desktop.',
    // Hbm4
    'hbm4-title': 'Hbm4',
    'hbm4-desc': 'Esquiva bloques, recoge potenciadores y sobrevive lo máximo posible. Acción arcade rápida optimizada para móvil y escritorio.'
  },
  pt: {
    'site-title': 'PlayCentral - Jogos Online Grátis',
    'site-description': 'Jogue os melhores jogos online grátis! Sem downloads necessários. Desfrute de jogos de ação, puzzle, arcade e mais no desktop e móvel.',
    'nav-featured': 'Destaques',
    'nav-categories': 'Categorias',
    'nav-new-games': 'Novos Jogos',
    'search-placeholder': 'Buscar jogos...',
    'hero-title': 'Jogue os Melhores Jogos Online Grátis',
    'hero-description': 'Descubra milhares de jogos em todas as categorias. Sem downloads, sem registro necessário. Jogue instantaneamente em qualquer dispositivo!',
    'hero-stat-games': '🎮 1000+ Jogos',
    'hero-stat-platforms': '📱 Móvel e Desktop',
    'hero-stat-free': '🆓 Sempre Grátis',
    'featured-title': '🔥 Jogos em Destaque',
    'categories-title': '📂 Categorias de Jogos',
    'new-games-title': '🆕 Jogos Mais Recentes',
    'game-over': 'Fim de Jogo',
    'restart': 'Reiniciar',
    'pause': 'Pausar',
    'resume': 'Retomar',
    'score': 'Pontuação',
    'best': 'Melhor',
    'play-again': 'Jogar Novamente',
    'home': 'Início',
    // Novas chaves
    'categories': 'Categorias',
    'controls': 'Controles',
    'controls-detail': 'Desktop: ← → ou A/D para mover. Mobile: toque/arraste para mover.',
    'more-games': 'Você também pode gostar',
    'final-score': 'Pontuação Final',
    'crypto-title': 'Crypto Collectibles',
    'crypto-desc': 'Capture tokens cripto raros e evite golpes. Simples, rápido e divertido em qualquer dispositivo!',
    'vgm-title': 'Monetização de jogos',
    'vgm-desc': 'Equilibre anúncios e a felicidade do jogador. Colete receita evitando churn. Otimizado para móvel e desktop.',
    // Hbm4
    'hbm4-title': 'Hbm4',
    'hbm4-desc': 'Desvie dos blocos, colete power-ups e sobreviva o máximo possível. Ação arcade em alta velocidade otimizada para móvel e desktop.'
  },
  tr: {
    'site-title': 'PlayCentral - Ücretsiz Online Oyunlar',
    'site-description': 'En iyi ücretsiz online oyunları oyna! İndirme gerekmez. Masaüstü ve mobilde aksiyon, bulmaca, arcade oyunları ve daha fazlasının keyfini çıkar.',
    'nav-featured': 'Öne Çıkanlar',
    'nav-categories': 'Kategoriler',
    'nav-new-games': 'Yeni Oyunlar',
    'search-placeholder': 'Oyun ara...',
    'hero-title': 'En İyi Ücretsiz Online Oyunları Oyna',
    'hero-description': 'Tüm kategorilerde binlerce oyun keşfet. İndirme yok, kayıt gerekmez. Herhangi bir cihazda anında oyna!',
    'hero-stat-games': '🎮 1000+ Oyun',
    'hero-stat-platforms': '📱 Mobil ve Masaüstü',
    'hero-stat-free': '🆓 Her Zaman Ücretsiz',
    'featured-title': '🔥 Öne Çıkan Oyunlar',
    'categories-title': '📂 Oyun Kategorileri',
    'new-games-title': '🆕 En Son Oyunlar',
    'game-over': 'Oyun Bitti',
    'restart': 'Yeniden Başla',
    'pause': 'Duraklat',
    'resume': 'Devam Et',
    'score': 'Puan',
    'best': 'En İyi',
    'play-again': 'Tekrar Oyna',
    'home': 'Ana Sayfa',
    // Yeni anahtarlar
    'categories': 'Kategoriler',
    'controls': 'Kontroller',
    'controls-detail': 'Masaüstü: ← → veya A/D ile hareket. Mobil: dokun/sürükle.',
    'more-games': 'Bunları da beğenebilirsin',
    'final-score': 'Final Skoru',
    'crypto-title': 'Crypto Collectibles',
    'crypto-desc': 'Nadir kripto tokenlarını yakala ve dolandırıcılardan kaçın. Her cihazda basit, hızlı ve eğlenceli!',
    // Hbm4
    'hbm4-title': 'Hbm4',
    'hbm4-desc': 'Gelen bloklardan kaç, güçlendirmeleri topla ve mümkün olduğunca uzun hayatta kal. Mobil ve masaüstü için optimize edilmiş yüksek hızlı arcade aksiyonu.'
  },
  vi: {
    'site-title': 'PlayCentral - Game Online Miễn Phí',
    'site-description': 'Chơi những game online miễn phí tốt nhất! Không cần tải về. Thưởng thức game hành động, giải đố, arcade và nhiều hơn nữa trên desktop và mobile.',
    'nav-featured': 'Nổi Bật',
    'nav-categories': 'Thể Loại',
    'nav-new-games': 'Game Mới',
    'search-placeholder': 'Tìm game...',
    'hero-title': 'Chơi Những Game Online Miễn Phí Tốt Nhất',
    'hero-description': 'Khám phá hàng nghìn game trong tất cả thể loại. Không cần tải về, không cần đăng ký. Chơi ngay lập tức trên bất kỳ thiết bị nào!',
    'hero-stat-games': '🎮 1000+ Game',
    'hero-stat-platforms': '📱 Mobile & Desktop',
    'hero-stat-free': '🆓 Luôn Miễn Phí',
    'featured-title': '🔥 Game Nổi Bật',
    'categories-title': '📂 Thể Loại Game',
    'new-games-title': '🆕 Game Mới Nhất',
    'game-over': 'Kết Thúc Game',
    'restart': 'Chơi Lại',
    'pause': 'Tạm Dừng',
    'resume': 'Tiếp Tục',
    'score': 'Điểm Số',
    'best': 'Tốt Nhất',
    'play-again': 'Chơi Lại',
    'home': 'Trang Chủ',
    // Khóa mới
    'categories': 'Thể Loại',
    'controls': 'Điều Khiển',
    'controls-detail': 'Máy tính: ← → hoặc A/D để di chuyển. Di động: chạm/kéo để di chuyển.',
    'more-games': 'Có thể bạn cũng thích',
    'final-score': 'Điểm Cuối Cùng',
    'crypto-title': 'Crypto Collectibles',
    'crypto-desc': 'Bắt các token tiền mã hóa hiếm và tránh vật phẩm lừa đảo. Đơn giản, nhanh và vui trên mọi thiết bị!',
    // Khóa mới cho Video game monetization
    'vgm-title': 'Kiếm tiền từ trò chơi điện tử',
    'vgm-desc': 'Cân bằng quảng cáo và sự hài lòng của người chơi. Thu doanh thu, tránh rời bỏ. Tối ưu cho di động & máy tính.',
    // Hbm4
    'hbm4-title': 'Hbm4',
    'hbm4-desc': 'Tránh các khối lao tới, nhặt power-up và sống sót lâu nhất có thể. Hành động arcade tốc độ cao tối ưu cho di động & máy tính.'
  },
  hi: {
    'site-title': 'PlayCentral - मुफ्त ऑनलाइन गेम्स',
    'site-description': 'सबसे अच्छे मुफ्त ऑनलाइन गेम्स खेलें! डाउनलोड की जरूरत नहीं। डेस्कटॉप और मोबाइल पर एक्शन, पज़ल, आर्केड गेम्स और बहुत कुछ का आनंद लें।',
    'nav-featured': 'फीचर्ड',
    'nav-categories': 'श्रेणियां',
    'nav-new-games': 'नए गेम्स',
    'search-placeholder': 'गेम्स खोजें...',
    'hero-title': 'सबसे अच्छे मुफ्त ऑनलाइन गेम्स खेलें',
    'hero-description': 'सभी श्रेणियों में हजारों गेम्स खोजें। कोई डाउनलोड नहीं, कोई रजिस्ट्रेशन की जरूरत नहीं। किसी भी डिवाइस पर तुरंत खेलें!',
    'hero-stat-games': '🎮 1000+ गेम्स',
    'hero-stat-platforms': '📱 मोबाइल और डेस्कटॉप',
    'hero-stat-free': '🆓 हमेशा मुफ्त',
    'featured-title': '🔥 फीचर्ड गेम्स',
    'categories-title': '📂 गेम श्रेणियां',
    'new-games-title': '🆕 नवीनतम गेम्स',
    'game-over': 'गेम समाप्त',
    'restart': 'पुनः आरंभ',
    'pause': 'रोकें',
    'resume': 'जारी रखें',
    'score': 'स्कोर',
    'best': 'सर्वश्रेष्ठ',
    'play-again': 'फिर से खेलें',
    'home': 'होम',
    'vgm-title': 'वीडियो गेम मोनेटाइजेशन',
    'vgm-desc': 'विज्ञापनों और खिलाड़ी की खुशी में संतुलन रखें। राजस्व एकत्र करें, छोड़ने से बचें। मोबाइल और डेस्कटॉप के लिए अनुकूलित.',
    // Hbm4
    'hbm4-title': 'Hbm4',
    'hbm4-desc': 'आने वाले ब्लॉक्स से बचें, पावर-अप्स इकट्ठा करें और जितना संभव हो उतना लंबे समय तक जीवित रहें। मोबाइल और डेस्कटॉप के लिए अनुकूलित हाई-स्पीड आर्केड एक्शन.'
  }
};

// Safe Google Analytics initialization (stub on localhost, real load on production)
(function() {
  try {
    var host = (location && location.hostname || '').toLowerCase();
    var isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
    // Ensure dataLayer exists
    window.dataLayer = window.dataLayer || [];
    // Provide a lightweight stub so pages can call gtag('event', ...) safely even before real script loads
    if (typeof window.gtag !== 'function') {
      window.gtag = function() {
        try {
          window.dataLayer.push(arguments);
          if (isLocal && typeof console !== 'undefined' && console.debug) {
            console.debug('[gtag stub]', Array.prototype.slice.call(arguments));
          }
        } catch (e) {
          // no-op
        }
      };
    }

    // Only schedule GA network script in production to avoid localhost ERR_ABORTED noise
    if (!isLocal) {
      // idempotent loader
      var __gaLoaded = false;
      function loadGAOnce() {
        if (__gaLoaded) return;
        __gaLoaded = true;
        if (!document.getElementById('ga-gtag-loader')) {
          var s = document.createElement('script');
          s.async = true;
          s.src = 'https://www.googletagmanager.com/gtag/js?id=G-QM2M85ZVEG';
          s.id = 'ga-gtag-loader';
          document.head.appendChild(s);
        }
        // Perform baseline GA config right after scheduling the loader; real gtag will process the queue
        window.gtag('js', new Date());
        window.gtag('config', 'G-QM2M85ZVEG');
        // cleanup listeners
        detach();
      }

      function onFirstInteraction() {
        loadGAOnce();
      }

      function detach() {
        try {
          window.removeEventListener('click', onFirstInteraction, { passive: true });
          window.removeEventListener('scroll', onFirstInteraction, { passive: true });
          window.removeEventListener('keydown', onFirstInteraction, { passive: true });
          window.removeEventListener('touchstart', onFirstInteraction, { passive: true });
        } catch (e) {}
      }

      try {
        window.addEventListener('click', onFirstInteraction, { passive: true, once: true });
        window.addEventListener('scroll', onFirstInteraction, { passive: true, once: true });
        window.addEventListener('keydown', onFirstInteraction, { passive: true, once: true });
        window.addEventListener('touchstart', onFirstInteraction, { passive: true, once: true });
      } catch (e) {}

      // Fallbacks: idle or timeout so we still collect page_view if no interaction
      if ('requestIdleCallback' in window) {
        try { requestIdleCallback(function() { setTimeout(loadGAOnce, 0); }, { timeout: 3000 }); } catch (e) { setTimeout(loadGAOnce, 2500); }
      } else {
        setTimeout(loadGAOnce, 2500);
      }
    }
  } catch (e) {
    // swallow errors to keep pages resilient
  }
})();

// Safe AdSense initialization (stub on localhost, real load on production)
(function() {
  try {
    var host = (location && location.hostname || '').toLowerCase();
    var isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
    
    // Provide a lightweight stub so pages can access adsbygoogle array safely
    if (typeof window.adsbygoogle === 'undefined') {
      window.adsbygoogle = window.adsbygoogle || [];
    }
    
    // Only schedule AdSense network script in production to avoid localhost ERR_ABORTED noise
    if (!isLocal) {
      // idempotent loader
      var __adsenseLoaded = false;
      function loadAdSenseOnce() {
        if (__adsenseLoaded) return;
        __adsenseLoaded = true;
        if (!document.getElementById('adsense-loader')) {
          var s = document.createElement('script');
          s.async = true;
          s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6583243933606323';
          s.id = 'adsense-loader';
          s.crossOrigin = 'anonymous';
          document.head.appendChild(s);
        }
        // cleanup listeners
        detachAds();
      }

      function onFirstInteractionAds() {
        loadAdSenseOnce();
      }

      function detachAds() {
        try {
          window.removeEventListener('click', onFirstInteractionAds, { passive: true });
          window.removeEventListener('scroll', onFirstInteractionAds, { passive: true });
          window.removeEventListener('keydown', onFirstInteractionAds, { passive: true });
          window.removeEventListener('touchstart', onFirstInteractionAds, { passive: true });
        } catch (e) {}
      }

      try {
        window.addEventListener('click', onFirstInteractionAds, { passive: true, once: true });
        window.addEventListener('scroll', onFirstInteractionAds, { passive: true, once: true });
        window.addEventListener('keydown', onFirstInteractionAds, { passive: true, once: true });
        window.addEventListener('touchstart', onFirstInteractionAds, { passive: true, once: true });
      } catch (e) {}

      // Fallbacks: idle or timeout (slightly later than GA to avoid overloading)
      if ('requestIdleCallback' in window) {
        try { requestIdleCallback(function() { setTimeout(loadAdSenseOnce, 0); }, { timeout: 4000 }); } catch (e) { setTimeout(loadAdSenseOnce, 3500); }
      } else {
        setTimeout(loadAdSenseOnce, 3500);
      }
    } else {
      // In local environment, provide console feedback when adsbygoogle.push is called
      var originalPush = window.adsbygoogle.push;
      window.adsbygoogle.push = function() {
        if (typeof console !== 'undefined' && console.debug) {
          console.debug('[adsbygoogle stub]', Array.prototype.slice.call(arguments));
        }
        return originalPush ? originalPush.apply(this, arguments) : arguments.length;
      };
    }
  } catch (e) {
    // swallow errors to keep pages resilient
  }
})();

// Current language state
let currentLanguage = localStorage.getItem('language') || 'en';

// Initialize language on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeLanguage();
});

function initializeLanguage() {
  // Set language selector if exists
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    languageSelect.value = currentLanguage;
  }
  
  // Apply translations
  applyTranslations(currentLanguage);
  
  // Update document title and meta
  updateDocumentMeta(currentLanguage);

  // Update language toggle button text to match current language
  const langButton = document.querySelector('.lang-toggle');
  if (langButton) {
    const langCodes = { en: 'EN', es: 'ES', pt: 'PT', tr: 'TR', vi: 'VI', hi: 'HI' };
    langButton.textContent = langCodes[currentLanguage] || 'EN';
    // Bind click once
    if (!langButton.dataset.bound) {
      langButton.addEventListener('click', toggleLanguage);
      langButton.dataset.bound = '1';
    }
  }
}

function changeLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
  applyTranslations(lang);
  updateDocumentMeta(lang);
  
  // Update toggle button text on manual language change
  const langButton = document.querySelector('.lang-toggle');
  if (langButton) {
    const langCodes = { en: 'EN', es: 'ES', pt: 'PT', tr: 'TR', vi: 'VI', hi: 'HI' };
    langButton.textContent = langCodes[lang] || 'EN';
  }
  
  console.log('Language changed to:', lang);
}

function applyTranslations(lang) {
  const langData = translations[lang] || translations.en;
  
  // Find all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (langData[key]) {
      if (element.tagName === 'INPUT' && element.type === 'text') {
        element.placeholder = langData[key];
      } else {
        element.textContent = langData[key];
      }
    }
  });
}

function updateDocumentMeta(lang) {
  const langData = translations[lang] || translations.en;
  
  // Only override meta on homepage; keep per-page SEO on subpages
  const isHome = !!document.querySelector('.main-content');

  if (isHome) {
    // Update title
    if (langData['site-title']) {
      document.title = langData['site-title'];
    }
    
    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && langData['site-description']) {
      metaDesc.content = langData['site-description'];
    }
  }
  
  // Always update html lang
  document.documentElement.lang = lang;
}

// Game page language toggle function
function toggleLanguage() {
  const languages = ['en', 'es', 'pt', 'tr', 'vi', 'hi'];
  const currentIndex = languages.indexOf(currentLanguage);
  const nextIndex = (currentIndex + 1) % languages.length;
  const nextLang = languages[nextIndex];
  
  currentLanguage = nextLang;
  localStorage.setItem('language', nextLang);
  
  // Update toggle button text with flag/code
  const langButton = document.querySelector('.lang-toggle');
  if (langButton) {
    const langCodes = { en: 'EN', es: 'ES', pt: 'PT', tr: 'TR', vi: 'VI', hi: 'HI' };
    langButton.textContent = langCodes[nextLang] || 'EN';
  }
  
  // Apply translations to current page
  applyTranslations(nextLang);
  updateDocumentMeta(nextLang);
  
  console.log('Language toggled to:', nextLang);
}

function searchGames() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const cards = document.querySelectorAll('.game-card');
  cards.forEach(card => {
    const title = card.querySelector('.game-title')?.innerText.toLowerCase() || '';
    card.style.display = title.includes(q) || card.classList.contains('coming-soon') ? '' : 'none';
  });
}

function filterByCategory(cat) {
  const cards = document.querySelectorAll('.game-card');
  cards.forEach(card => {
    const category = card.querySelector('.game-category')?.innerText.toLowerCase() || '';
    card.style.display = category.includes(cat) || card.classList.contains('coming-soon') ? '' : 'none';
  });
}

function showPage(page) {
  alert(page + ' page will be implemented.');
}

function playGame(slug) {
  window.location.href = '/games/' + slug + '/index.html';
}

// Lighthouse small enhancement: defer ads init until idle
function initAdsSafely() {
  try {
    const slots = document.querySelectorAll('ins.adsbygoogle');
    if (!slots.length) return;

    const setupForSlot = (slot) => {
      let pushed = false;
      const pushAd = () => {
        if (pushed) return;
        pushed = true;
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* noop */ }
      };

      const widthReady = () => slot.offsetWidth > 0;

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && widthReady()) {
              pushAd();
              io.unobserve(slot);
              ro && ro.unobserve && ro.unobserve(slot);
            }
          }
        }, { root: null, rootMargin: '0px', threshold: 0 });
        io.observe(slot);

        // Combine with ResizeObserver to catch width changes
        let ro = null;
        if ('ResizeObserver' in window) {
          ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
              if (widthReady() && entry.target === slot) {
                // Only push when also intersecting; IO will handle the final trigger
                // But if IO is not available for some reason, fallback here
                // (kept for robustness)
              }
            }
          });
          ro.observe(slot);
        }

        // Fallback in case neither event fires but slot is already visible & sized
        if (widthReady() && slot.getBoundingClientRect().top < window.innerHeight && slot.getBoundingClientRect().bottom > 0) {
          pushAd();
          io.unobserve(slot);
          ro && ro.unobserve && ro.unobserve(slot);
        }
      } else if ('ResizeObserver' in window) {
        const ro = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.target.offsetWidth > 0) {
              pushAd();
              ro.unobserve(entry.target);
            }
          }
        });
        ro.observe(slot);
        // Fallback attempt after load
        if (widthReady()) pushAd(); else window.addEventListener('load', pushAd, { once: true });
      } else {
        // Basic immediate or onload fallback
        if (widthReady()) pushAd(); else window.addEventListener('load', pushAd, { once: true });
      }
    };

    slots.forEach(setupForSlot);
  } catch (e) { /* noop */ }
}

if ('requestIdleCallback' in window) {
  requestIdleCallback(initAdsSafely);
} else {
  setTimeout(initAdsSafely, 800);
}

// Global analytics helpers
if (typeof window.trackEvent !== 'function') {
  window.trackEvent = function(action, params) {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', action, params || {});
      }
    } catch (e) {
      // no-op
    }
  };
}