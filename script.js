document.addEventListener('DOMContentLoaded', () => {

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ============ MOBILNÍ NAVIGACE ============ */
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle.addEventListener('change', () => {
        navMenu.classList.toggle('is-open', navToggle.checked);
        navToggle.setAttribute('aria-expanded', navToggle.checked);
    });

    navMenu.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('is-open');
            navToggle.checked = false;
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });

    /* ============ ZRUŠENÍ "ZASEKNUTÉHO" HOVER STAVU PO KLEPNUTÍ NA MOBILU ============ */
    // Na dotykových zařízeních prohlížeč po klepnutí na odkaz/tlačítko ponechá
    // prvek zaostřený, takže vizuálně zůstává v "hover" stavu (:focus-visible),
    // dokud uživatel neklepne jinam. Odfokusujeme ho hned po klepnutí, ať se
    // efekt projeví jen v momentě kliknutí.
    if (window.matchMedia('(hover: none)').matches) {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button');
            if (target) target.blur();
        });
    }

    /* ============ SKOK NA SEKCI — NA DESKTOPU ROVNOU NA STŘED OBRAZOVKY ============ */
    const HEADER_HEIGHT = 72;
    // O trochu méně než výška hlavičky — ať cílová sekce zajede kousek
    // pod ni, jinak byl na mobilu pod hlavičkou vidět tenký proužek
    // předchozí (světlé) sekce.
    const MOBILE_SCROLL_OFFSET = HEADER_HEIGHT - 10;

    const scrollSectionIntoPlace = (section) => {
        const isDesktop = window.matchMedia('(min-width: 901px)').matches;
        const rectTop = section.getBoundingClientRect().top;
        const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;

        let targetY;
        if (isDesktop && section.id === 'kontakt') {
            // Poslední sekce — středění by pod ní nechalo prázdný pruh, tak jede rovnou na úplný konec stránky.
            targetY = maxScrollY;
        } else if (isDesktop) {
            targetY = window.scrollY + rectTop + section.offsetHeight / 2 - window.innerHeight / 2;
        } else {
            targetY = window.scrollY + rectTop - MOBILE_SCROLL_OFFSET;
        }

        window.scrollTo({ top: Math.min(Math.max(0, targetY), maxScrollY), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    };

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;

        const id = link.getAttribute('href').slice(1);
        const target = id && document.getElementById(id);
        if (!target) return;

        e.preventDefault();
        scrollSectionIntoPlace(target);
    });

    /* ============ AKTIVNÍ ODKAZ V NAVIGACI PODLE SEKCE ============ */
    const heroSection = document.querySelector('.hero');
    const sections = document.querySelectorAll('main section[id]');
    const navLinks = document.querySelectorAll('.nav__link[href^="#"]');

    const setActiveLink = () => {
        const nearBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
        const viewportCenter = window.innerHeight / 2;

        let currentId = '';
        let smallestDistance = Infinity;

        // Hero nemá odkaz v menu — pokud je nejblíž středu obrazovky on, nemá být
        // aktivní žádná položka (jinak by na úplném vršku stránky svítily Projekty).
        if (heroSection) {
            const heroRect = heroSection.getBoundingClientRect();
            smallestDistance = Math.abs(heroRect.top + heroRect.height / 2 - viewportCenter);
        }

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
            if (distance < smallestDistance) {
                smallestDistance = distance;
                currentId = section.id;
            }
        });

        // Na úplném konci stránky (sekce Kontakt scrolluje až sem) má být aktivní vždy Kontakt.
        if (nearBottom) currentId = 'kontakt';

        navLinks.forEach(link => {
            link.classList.toggle('is-active', link.getAttribute('href') === `#${currentId}`);
        });
    };

    window.addEventListener('scroll', setActiveLink);
    setActiveLink();

    /* ============ ANIMACE PRVKŮ PŘI SCROLLU ============ */
    // Vlastní řešení (IntersectionObserver) místo AOS.js — ta měla na iPadu
    // nespolehlivé sledování scrollu, hlavně pro schovávání prvků při
    // scrollu zpět nahoru. IntersectionObserver funguje stejně napříč
    // všemi zařízeními (odpovídající CSS je teď přímo ve style.css).
    const animatedEls = document.querySelectorAll('[data-aos]');

    if (animatedEls.length) {
        if (prefersReducedMotion) {
            animatedEls.forEach(el => el.classList.add('aos-animate'));
        } else {
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    entry.target.classList.toggle('aos-animate', entry.isIntersecting);
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -80px 0px'
            });

            animatedEls.forEach(el => revealObserver.observe(el));
        }
    }

    /* ============ ZMENŠOVÁNÍ KARTY V SEKCI O MNĚ PODLE SCROLLU ============ */
    const scaleImages = document.querySelectorAll('.about__media');

    if (scaleImages.length && !prefersReducedMotion) {
        const MIN_SCALE = 0.75;
        const MAX_TEXT_SHIFT = 20;
        let tickingScale = false;

        const updateImageScale = () => {
            tickingScale = false;

            const viewportCenter = window.innerHeight / 2;
            // Stejné hranice jako v CSS (.about): text je vedle fotky teprve
            // od 901px (do té doby, i na tabletu na výšku, je nahoře přes
            // celou šířku), ale checklist je vedle fotky už od 640px (na
            // tabletu je vedle ní, ne pod ní jako na mobilu).
            const isTextBeside = window.matchMedia('(min-width: 901px)').matches;
            const isChecklistBeside = window.matchMedia('(min-width: 640px)').matches;

            scaleImages.forEach(el => {
                const rect = el.getBoundingClientRect();
                const elCenter = rect.top + rect.height / 2;
                const distance = Math.abs(elCenter - viewportCenter);
                const progress = Math.min(distance / viewportCenter, 1);
                const cardScale = 1 - progress * (1 - MIN_SCALE);

                el.style.transform = `scale(${cardScale})`;

                const img = el.querySelector('img');
                if (img) {
                    img.style.transform = `scale(${1 / cardScale})`;
                }

                const aboutContainer = el.closest('.about');
                if (!aboutContainer) return;

                const text = aboutContainer.querySelector('.about__text');
                const checklist = aboutContainer.querySelector('.checklist');

                // Prvky vedle fotky zajíždí směrem k ní (doleva), jak se zmenšuje.
                const textShift = progress * MAX_TEXT_SHIFT;
                if (text) text.style.transform = isTextBeside ? `translateX(-${textShift}px)` : '';

                if (checklist) {
                    if (isChecklistBeside) {
                        checklist.style.transform = `translateX(-${textShift}px)`;
                    } else {
                        // Na mobilu je checklist POD fotkou v jednom sloupci — zmenšení kolem
                        // středu (scale) by pod fotkou otevřelo mezeru, tak se checklist
                        // posune nahoru přesně o tolik, o kolik se fotka zmenšila zespodu.
                        const gapClose = (el.offsetHeight * (1 - cardScale)) / 2;
                        checklist.style.transform = `translateY(-${gapClose}px)`;
                    }
                }
            });
        };

        const requestScaleUpdate = () => {
            if (!tickingScale) {
                requestAnimationFrame(updateImageScale);
                tickingScale = true;
            }
        };

        window.addEventListener('scroll', requestScaleUpdate);
        window.addEventListener('resize', requestScaleUpdate);

        updateImageScale();
    }

    /* ============ PARTICLE NETWORK V HERO SEKCI ============ */
    const particleCanvas = document.getElementById('particleCanvas');

    if (particleCanvas && !prefersReducedMotion) {
        const heroSection = particleCanvas.closest('.hero');
        const ctx = particleCanvas.getContext('2d');
        const rootStyles = getComputedStyle(document.documentElement);
        const accentRgb = rootStyles.getPropertyValue('--color-accent-rgb').trim() || '255, 122, 80';
        const lineRgb = rootStyles.getPropertyValue('--text-on-dark-rgb').trim() || '234, 242, 251';

        const LINK_DISTANCE = 130;
        const MOUSE_DISTANCE = 160;

        let particles = [];
        let widthCss = 0;
        let heightCss = 0;
        const mouse = { x: null, y: null };

        const isMobile = () => window.innerWidth < 768;

        const resizeCanvas = () => {
            const rect = heroSection.getBoundingClientRect();
            widthCss = rect.width;
            heightCss = rect.height;
            const dpr = window.devicePixelRatio || 1;
            particleCanvas.width = widthCss * dpr;
            particleCanvas.height = heightCss * dpr;
            particleCanvas.style.width = `${widthCss}px`;
            particleCanvas.style.height = `${heightCss}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const createParticles = () => {
            const count = isMobile() ? 24 : 70;
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * widthCss,
                y: Math.random() * heightCss,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                r: Math.random() * 1.2 + 1.3,
                o: Math.random() * 0.2 + 0.4
            }));
        };

        const drawFrame = () => {
            ctx.clearRect(0, 0, widthCss, heightCss);

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x <= 0 || p.x >= widthCss) p.vx *= -1;
                if (p.y <= 0 || p.y >= heightCss) p.vy *= -1;
                p.x = Math.min(Math.max(p.x, 0), widthCss);
                p.y = Math.min(Math.max(p.y, 0), heightCss);

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${accentRgb}, ${p.o})`;
                ctx.fill();
            });

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const a = particles[i];
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < LINK_DISTANCE) {
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(${lineRgb}, 0.12)`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }

                if (mouse.x !== null) {
                    const dx = particles[i].x - mouse.x;
                    const dy = particles[i].y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < MOUSE_DISTANCE) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.strokeStyle = `rgba(${lineRgb}, ${0.3 * (1 - dist / MOUSE_DISTANCE)})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(drawFrame);
        };

        resizeCanvas();
        createParticles();
        drawFrame();

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                resizeCanvas();
                createParticles();
            }, 200);
        });

        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });

        heroSection.addEventListener('mouseleave', () => {
            mouse.x = null;
            mouse.y = null;
        });
    }

    /* ============ VZNÁŠEJÍCÍ SE TEČKY NA TMAVÝCH SEKCÍCH ============ */
    const addFloatingDots = (section, count = 55) => {
        const wrap = document.createElement('div');
        wrap.className = 'floating-dots';
        wrap.setAttribute('aria-hidden', 'true');

        for (let i = 0; i < count; i++) {
            const dot = document.createElement('span');
            dot.className = 'floating-dot';

            const size = (Math.random() * 1.8 + 1.4).toFixed(1);
            const left = (Math.random() * 100).toFixed(1);
            const top = (Math.random() * 100).toFixed(1);
            const duration = (Math.random() * 5 + 5).toFixed(1);
            const delay = (-Math.random() * duration).toFixed(1);
            const drift = Math.round(Math.random() * 18 + 12);
            const opacity = (Math.random() * 0.2 + 0.25).toFixed(2);
            const useAccent = Math.random() < 0.45;

            dot.style.width = `${size}px`;
            dot.style.height = `${size}px`;
            dot.style.left = `${left}%`;
            dot.style.top = `${top}%`;
            dot.style.opacity = opacity;
            dot.style.backgroundColor = useAccent ? 'var(--color-accent)' : 'var(--text-on-dark)';
            dot.style.animationDuration = `${duration}s`;
            dot.style.animationDelay = `${delay}s`;
            dot.style.setProperty('--dot-drift', `-${drift}px`);

            wrap.appendChild(dot);
        }

        section.appendChild(wrap);
    };

    if (!prefersReducedMotion) {
        const dotCount = window.innerWidth < 768 ? 20 : 55;
        document.querySelectorAll('.section--dark').forEach(section => addFloatingDots(section, dotCount));
    }

    /* ============ VLASTNÍ KURZOR VE STYLU KOMETY ============ */
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const canUseCustomCursor = !isTouchDevice && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (canUseCustomCursor && !prefersReducedMotion) {
        document.documentElement.classList.add('has-custom-cursor');

        const cursorRoot = document.createElement('div');
        cursorRoot.className = 'cursor-comet';
        cursorRoot.setAttribute('aria-hidden', 'true');
        document.body.appendChild(cursorRoot);

        const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        const makeDot = (isHead) => {
            const dot = document.createElement('div');
            dot.className = isHead ? 'cursor-dot cursor-dot--head' : 'cursor-dot cursor-dot--trail';
            const inner = document.createElement('span');
            inner.className = 'cursor-dot__inner';
            dot.appendChild(inner);
            cursorRoot.appendChild(dot);
            return { el: dot, inner, x: pointer.x, y: pointer.y };
        };

        const head = makeDot(true);

        // Ohonek — každý segment je menší, průhlednější a rozostřenější než ten předchozí.
        const TRAIL_STYLES = [
            { size: 8, opacity: 0.5, blur: 0 },
            { size: 7, opacity: 0.38, blur: 0.5 },
            { size: 6, opacity: 0.28, blur: 1 },
            { size: 5, opacity: 0.2, blur: 1.5 },
            { size: 4, opacity: 0.13, blur: 2 },
            { size: 3, opacity: 0.08, blur: 2.5 }
        ];

        const trail = TRAIL_STYLES.map(style => {
            const seg = makeDot(false);
            seg.inner.style.width = `${style.size}px`;
            seg.inner.style.height = `${style.size}px`;
            seg.inner.style.opacity = style.opacity;
            seg.inner.style.filter = style.blur ? `blur(${style.blur}px)` : 'none';
            return seg;
        });

        document.addEventListener('mousemove', (e) => {
            pointer.x = e.clientX;
            pointer.y = e.clientY;
        });

        const HEAD_EASE = 0.55;
        const TRAIL_EASE = 0.32;

        const renderCursor = () => {
            // Hlavní bod se drží kurzoru těsně, každý další segment ohonku dojíždí za tím předchozím —
            // proto stopa vypadá jako "dotahující se" kometí ohon, ne kopie pozice 1:1.
            head.x += (pointer.x - head.x) * HEAD_EASE;
            head.y += (pointer.y - head.y) * HEAD_EASE;
            head.el.style.transform = `translate(${head.x}px, ${head.y}px)`;

            let targetX = head.x;
            let targetY = head.y;

            trail.forEach(seg => {
                seg.x += (targetX - seg.x) * TRAIL_EASE;
                seg.y += (targetY - seg.y) * TRAIL_EASE;
                seg.el.style.transform = `translate(${seg.x}px, ${seg.y}px)`;
                targetX = seg.x;
                targetY = seg.y;
            });

            requestAnimationFrame(renderCursor);
        };

        renderCursor();

        const interactiveEls = document.querySelectorAll('a, button, .project-card, .pricing-card, .service-card');
        interactiveEls.forEach(el => {
            el.addEventListener('mouseenter', () => cursorRoot.classList.add('is-active'));
            el.addEventListener('mouseleave', () => cursorRoot.classList.remove('is-active'));
        });
    }

    /* ============ CELÁ PROJEKTOVÁ KARTA JAKO ODKAZ NA ŽIVÉ DEMO ============ */
    document.querySelectorAll('.project-card').forEach(card => {
        const demoLink = card.querySelector('.project-card__link--demo');
        if (!demoLink) return;

        card.addEventListener('click', (e) => {
            // Klik na "Živé demo" nebo "Zdrojový kód" ať si klik obslouží ten konkrétní odkaz sám.
            if (e.target.closest('.project-card__links')) return;
            window.open(demoLink.href, demoLink.target || '_self', 'noopener,noreferrer');
        });
    });

    /* ============ KARTY SLUŽEB → KLIK ODSCROLLUJE NA BALÍČKY ============ */
    const balickySection = document.getElementById('balicky');

    if (balickySection) {
        const scrollToPricing = () => scrollSectionIntoPlace(balickySection);

        document.querySelectorAll('.service-card').forEach(card => {
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.addEventListener('click', scrollToPricing);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    scrollToPricing();
                }
            });
        });
    }

    /* ============ ZOBRAZIT DALŠÍ PROJEKT ============ */
    const toggleProjects = document.getElementById('toggleProjects');
    const extraProject = document.getElementById('extraProject');

    toggleProjects.addEventListener('click', () => {
        const isOpen = !extraProject.hidden;

        if (isOpen) {
            extraProject.classList.remove('is-visible');
            toggleProjects.setAttribute('aria-expanded', 'false');
            toggleProjects.textContent = 'Zobrazit další projekt';
            extraProject.addEventListener('transitionend', () => {
                extraProject.hidden = true;
            }, { once: true });
        } else {
            extraProject.hidden = false;
            toggleProjects.setAttribute('aria-expanded', 'true');
            toggleProjects.textContent = 'Skrýt projekt';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    extraProject.classList.add('is-visible');
                });
            });
        }
    });

    /* ============ TLAČÍTKO "ZPĚT NAHORU" ============ */
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('is-visible', window.scrollY > 500);
    });

    backToTop.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* ============ VALIDACE A ODESLÁNÍ KONTAKTNÍHO FORMULÁŘE ============ */
    const form = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');
    const formError = document.getElementById('formError');
    const formSubmit = document.getElementById('formSubmit');

    const validateField = (field) => {
        const group = field.closest('.form-group');
        const isValid = field.checkValidity();
        group.classList.toggle('is-invalid', !isValid);
        return isValid;
    };

    form.querySelectorAll('input[required], textarea[required]').forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
            if (field.closest('.form-group').classList.contains('is-invalid')) {
                validateField(field);
            }
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        formSuccess.hidden = true;
        formError.hidden = true;

        const requiredFields = form.querySelectorAll('input[required], textarea[required]');
        let formIsValid = true;

        requiredFields.forEach(field => {
            if (!validateField(field)) {
                formIsValid = false;
            }
        });

        if (!formIsValid) {
            return;
        }

        // Honeypot proti spamu — pokud je pole vyplněné, jde o bota, tiše skončíme.
        if (form.elements.botcheck && form.elements.botcheck.checked) {
            form.reset();
            formSuccess.hidden = false;
            return;
        }

        formSubmit.disabled = true;
        formSubmit.textContent = 'Odesílám…';

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: new FormData(form)
            });

            const result = await response.json();

            if (result.success) {
                formSuccess.hidden = false;
                form.reset();
            } else {
                formError.hidden = false;
            }
        } catch (err) {
            formError.hidden = false;
        } finally {
            formSubmit.disabled = false;
            formSubmit.textContent = 'Odeslat poptávku';
        }
    });

});
