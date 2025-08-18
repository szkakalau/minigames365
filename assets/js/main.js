// Simple client-side behavior for demo
function changeLanguage(lang) {
  const mapping = {
    en: '/en/', es: '/es/', pt: '/pt/', tr: '/tr/', vi: '/vi/', hi: '/hi/'
  };
  const base = mapping[lang] || '/';
  // In this static version, we just log. In production, route to locale path.
  console.log('Switch language to', lang, '->', base);
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