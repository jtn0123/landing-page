const btn = document.getElementById('backTop');
window.addEventListener('scroll', () => {
  btn.classList.toggle('visible', window.scrollY > 400);
}, {passive: true});
