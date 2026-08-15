// Scroll progress rail
const railFill = document.getElementById('railFill');
function updateRail() {
  const scrolled = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  railFill.style.height = max > 0 ? `${(scrolled / max) * 100}%` : '0%';
}
window.addEventListener('scroll', updateRail);
updateRail();

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

// 3D tilt on hero card
const tiltCard = document.getElementById('tiltCard');
if (tiltCard) {
  const heroArt = document.getElementById('heroCard');
  heroArt.addEventListener('mousemove', (e) => {
    const rect = heroArt.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    tiltCard.style.transform = `perspective(800px) rotateX(${-y * 14}deg) rotateY(${x * 18}deg)`;
  });
  heroArt.addEventListener('mouseleave', () => {
    tiltCard.style.transform = 'perspective(800px) rotateX(6deg) rotateY(-8deg)';
  });
}

// Sample subjects (static preview on the public landing page)
const subjects = [
  { name: 'Data Structures', tag: 'CS-301' },
  { name: 'Digital Electronics', tag: 'EC-302' },
  { name: 'Discrete Mathematics', tag: 'MA-303' },
  { name: 'Object Oriented Programming', tag: 'CS-304' },
  { name: 'Engineering Economics', tag: 'HU-305' },
  { name: 'Electronic Devices', tag: 'EC-306' },
];
const grid = document.getElementById('subjectGrid');
if (grid) {
  subjects.forEach(s => {
    const card = document.createElement('a');
    card.href = 'login.html';
    card.className = 'subject-card';
    card.innerHTML = `<span class="tag">${s.tag}</span><h3>${s.name}</h3><p style="margin:0;font-size:0.85rem;">View shared notes →</p>`;
    grid.appendChild(card);
  });
}
