/* =========================
   SCROLL REVEAL
========================= */

const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {

    entries.forEach((entry, i) => {

        if(entry.isIntersecting){

            entry.target.style.transitionDelay = (i % 4) * 0.08 + 's';
            entry.target.classList.add('in-view');
            revealObserver.unobserve(entry.target);

        }

    });

}, { threshold: 0.15 });

revealEls.forEach(el => revealObserver.observe(el));

/* =========================
   COUNT-UP NUMBERS
========================= */

const countEls = document.querySelectorAll('.count-num');

const countObserver = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if(entry.isIntersecting){

            const el = entry.target;
            const target = parseInt(el.dataset.target, 10);
            const duration = 1400;
            const startTime = performance.now();

            function tick(now){

                const progress = Math.min((now - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const value = Math.floor(eased * target);

                el.textContent = value.toLocaleString();

                if(progress < 1){
                    requestAnimationFrame(tick);
                } else {
                    el.textContent = target.toLocaleString();
                }

            }

            requestAnimationFrame(tick);
            countObserver.unobserve(el);

        }

    });

}, { threshold: 0.5 });

countEls.forEach(el => countObserver.observe(el));

/* =========================
   ACTIVE NAV LINK ON SCROLL
========================= */

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {

    let current = '';

    sections.forEach(section => {

        const sectionTop = section.offsetTop - 120;

        if(window.scrollY >= sectionTop){
            current = section.getAttribute('id');
        }

    });

    navLinks.forEach(link => {

        link.classList.remove('active');

        if(link.getAttribute('href') === '#' + current){
            link.classList.add('active');
        }

    });

});

/* =========================
   NAVBAR SHADOW ON SCROLL
========================= */

const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {

    if(window.scrollY > 30){
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

});

/* =========================
   SCROLL TO TOP BUTTON
========================= */

const scrollTopBtn = document.getElementById('scrollTopBtn');

if(scrollTopBtn){

    window.addEventListener('scroll', () => {

        if(window.scrollY > 500){
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }

    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

}
