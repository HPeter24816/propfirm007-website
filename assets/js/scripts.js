document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Logic is handled in layout.js since it injects the header

    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80; // Adjust for fixed header
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });

                // Check if target is an accordion item and expand it
                if (targetElement.classList.contains('accordion__item')) {
                    const header = targetElement.querySelector('.accordion__header');
                    if (header && !header.classList.contains('active')) {
                        // Use a small timeout to allow scrolling to start
                        setTimeout(() => {
                            header.click();
                        }, 300);
                    }
                }
            }
        });
    });

    // Accordion Functionality
    const accordionHeaders = document.querySelectorAll('.accordion__header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const isActive = header.classList.contains('active');

            // Close all other items
            document.querySelectorAll('.accordion__header').forEach(h => {
                if (h !== header) {
                    h.classList.remove('active');
                    h.nextElementSibling.style.maxHeight = null;
                }
            });

            // Toggle current item
            header.classList.toggle('active');
            if (!isActive) {
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.style.maxHeight = null;
            }
        });
    });

    // Intersection Observer for Fade-in Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                entry.target.style.opacity = ''; // Remove inline opacity to let CSS take over
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements that should fade in on scroll
    const animatedElements = document.querySelectorAll('.card, .list-item, .section__title');
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0'; // Initial state hidden
        // Add a small stagger delay based on index within its container would be better, 
        // but global index is okay for simple pages.
        // We'll use a data attribute or just inline style for delay if needed, 
        // but CSS classes .delay-1 etc are cleaner if we can apply them.
        // For now, let's just let the CSS animation handle the fade in.
        observer.observe(el);
    });

    // Check hash on page load to expand accordion if needed
    if (window.location.hash) {
        const targetId = window.location.hash;
        try {
            const targetElement = document.querySelector(targetId);
            if (targetElement && targetElement.classList.contains('accordion__item')) {
                const header = targetElement.querySelector('.accordion__header');
                if (header && !header.classList.contains('active')) {
                    setTimeout(() => {
                        header.click();
                        // Adjust scroll position for fixed header
                        const headerOffset = 80;
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: "smooth"
                        });
                    }, 500); // Slight delay to ensure page is ready
                }
            }
        } catch (e) {
            console.log('Invalid hash');
        }
    }
});
