// /js/views/landing.js
// Interaction layer for the marketing landing page (index.html only).
// No dependency on auth.js/store.js — safe to run for logged-out visitors.

function initHeaderScroll() {
    const header = document.getElementById('lpHeader');
    if (!header) return;

    const onScroll = () => {
        header.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

function initMobileMenu() {
    const header = document.getElementById('lpHeader');
    const toggle = document.getElementById('lpMenuToggle');
    const menu = document.getElementById('lpMobileMenu');
    if (!header || !toggle || !menu) return;

    const closeMenu = () => {
        header.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
        const isOpen = header.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
    });

    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenu();
    });
}

function initFaqAccordion() {
    document.querySelectorAll('.lp-faq-trigger').forEach((trigger) => {
        trigger.addEventListener('click', () => {
            const panel = document.getElementById(trigger.getAttribute('aria-controls'));
            if (!panel) return;
            const isOpen = trigger.getAttribute('aria-expanded') === 'true';
            trigger.setAttribute('aria-expanded', String(!isOpen));
            panel.hidden = isOpen;
        });
    });
}

function initScrollReveal() {
    const targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
        targets.forEach((el) => el.classList.add('in-view'));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach((el) => observer.observe(el));
}

function animateCounter(el) {
    const target = parseFloat(el.dataset.counter);
    if (Number.isNaN(target)) return;
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        el.textContent = `${value.toFixed(decimals)}${suffix}`;
        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            el.textContent = `${target.toFixed(decimals)}${suffix}`;
        }
    }
    requestAnimationFrame(tick);
}

function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        counters.forEach((el) => {
            const target = parseFloat(el.dataset.counter);
            const decimals = parseInt(el.dataset.decimals || '0', 10);
            const suffix = el.dataset.suffix || '';
            if (!Number.isNaN(target)) el.textContent = `${target.toFixed(decimals)}${suffix}`;
        });
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.4 }
    );

    counters.forEach((el) => observer.observe(el));
}

function initFooterYear() {
    const yearEl = document.getElementById('lpYear');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

function initIcons() {
    if (window.lucide) window.lucide.createIcons();
}

// Subtle cursor-driven parallax on the hero dashboard mockup + floating cards.
function initHeroParallax() {
    const hero = document.querySelector('.lp-hero');
    const mock = document.querySelector('.lp-dashboard-mock');
    const floatCards = document.querySelectorAll('.lp-float-card');
    if (!hero || !mock || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 1024px)').matches) return;

    hero.addEventListener('pointermove', (event) => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        mock.style.transform = `rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
        // Use the standalone "translate" property (not "transform") so this doesn't
        // fight with the lp-float keyframe animation, which already animates "transform".
        floatCards.forEach((card, i) => {
            const depth = 8 + (i % 3) * 4;
            card.style.translate = `${(x * depth).toFixed(1)}px ${(y * depth).toFixed(1)}px`;
        });
    });

    hero.addEventListener('pointerleave', () => {
        mock.style.transform = '';
        floatCards.forEach((card) => { card.style.translate = ''; });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initIcons();
    initHeaderScroll();
    initMobileMenu();
    initFaqAccordion();
    initScrollReveal();
    initCounters();
    initFooterYear();
    initHeroParallax();
});
