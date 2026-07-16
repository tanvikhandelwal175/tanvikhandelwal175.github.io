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

/* =========================
   HERO LETTER SPLIT ANIMATION
========================= */

function splitHeroText(){

    const h1 = document.querySelector('.hero-left h1');
    if(!h1) return;

    const nodes = Array.from(h1.childNodes);
    h1.innerHTML = '';

    let letterIndex = 0;

    nodes.forEach(node => {

        if(node.nodeName === 'BR'){
            h1.appendChild(document.createElement('br'));
            return;
        }

        const text = node.textContent;

        text.split('').forEach(ch => {

            const span = document.createElement('span');
            span.textContent = ch === ' ' ? '\u00A0' : ch;
            span.classList.add('hero-letter');
            span.style.animationDelay = (letterIndex * 0.035) + 's';
            h1.appendChild(span);
            letterIndex++;

        });

    });

}

splitHeroText();

/* =========================
   3D CARD TILT ON MOUSEMOVE
========================= */

function apply3DTilt(selector, intensity = 8){

    document.querySelectorAll(selector).forEach(card => {

        card.addEventListener('mousemove', (e) => {

            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -intensity;
            const rotateY = ((x - centerX) / centerX) * intensity;

            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;

        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });

    });

}

apply3DTilt('.stat-card', 6);
apply3DTilt('.work-card', 5);
apply3DTilt('.leadership-card', 6);
apply3DTilt('.cert-card', 6);
apply3DTilt('.contact-card', 6);

/* =========================
   MAGNETIC BUTTONS
========================= */

function magneticButton(selector, strength = 0.3){

    document.querySelectorAll(selector).forEach(btn => {

        btn.addEventListener('mousemove', (e) => {

            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;

        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });

    });

}

magneticButton('.primary-btn, .secondary-btn, .resume-btn', 0.25);
magneticButton('.scroll-top-btn', 0.4);

/* =========================
   CURSOR GLOW (desktop only)
========================= */

if(window.matchMedia('(pointer: fine)').matches){

    const glow = document.createElement('div');
    glow.classList.add('cursor-glow');
    document.body.appendChild(glow);

    document.addEventListener('mousemove', (e) => {

        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
        glow.classList.add('active');

    });

    document.addEventListener('mouseleave', () => {
        glow.classList.remove('active');
    });

}

/* =========================
   SCROLL PROGRESS BAR
========================= */

const progressBar = document.createElement('div');
progressBar.classList.add('scroll-progress');
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;

    progressBar.style.width = progress + '%';

});

/* =========================
   PORTRAIT PARALLAX
========================= */

const portrait = document.querySelector('.portrait-card');

if(portrait){

    window.addEventListener('scroll', () => {

        const scrolled = window.scrollY;
        portrait.style.transform = `translateY(${scrolled * 0.08}px)`;

    });

}

/* =========================
   CUSTOM TK CURSOR
========================= */

if(window.matchMedia('(pointer: fine)').matches){

    document.body.classList.add('custom-cursor-active');

    const tkCursor = document.createElement('div');
    tkCursor.classList.add('tk-cursor');
    tkCursor.textContent = 'TK';
    document.body.appendChild(tkCursor);

    document.addEventListener('mousemove', (e) => {
        tkCursor.style.left = e.clientX + 'px';
        tkCursor.style.top = e.clientY + 'px';
        tkCursor.style.transform = 'translate(-50%, -50%)';
    });

    const hoverTargets = document.querySelectorAll(
        'a, button, .work-card, .stat-card, .leadership-card, .cert-card, .contact-card, .about-tags span, .beyond-chips span'
    );

    hoverTargets.forEach(el => {

        el.addEventListener('mouseenter', () => tkCursor.classList.add('tk-cursor-hover'));
        el.addEventListener('mouseleave', () => tkCursor.classList.remove('tk-cursor-hover'));

    });

    document.addEventListener('mouseleave', () => {
        tkCursor.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
        tkCursor.style.opacity = '1';
    });

}
