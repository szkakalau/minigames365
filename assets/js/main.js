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
    'home': 'Home'
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
    'home': 'Inicio'
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
    'home': 'Início'
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
    'home': 'Ana Sayfa'
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
    'home': 'Trang Chủ'
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
    'home': 'होम'
  }
};

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
  
  // Update title
  if (langData['site-title']) {
    document.title = langData['site-title'];
  }
  
  // Update meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && langData['site-description']) {
    metaDesc.content = langData['site-description'];
  }
  
  // Update html lang attribute
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
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => (window.adsbygoogle = window.adsbygoogle || []).push({}));
} else {
  setTimeout(() => (window.adsbygoogle = window.adsbygoogle || []).push({}), 1000);
}