export function initModal() {

    // Slider functionality
    const slider = document.querySelector('.slider');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    const dotsContainer = document.querySelector('.dots-container');
    const items = document.querySelectorAll('.portfolio-item');
    let index = 0;

    // Create dots
    function createDots() {
        items.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        });
    }

    // Update active dot
    function updateDots() {
        document.querySelectorAll('.dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    // Go to specific slide
    function goToSlide(slideIndex) {
        index = slideIndex;
        updateSlider();
    }

    // Update slider position
    function updateSlider() {
        slider.style.transform = `translateX(-${index * 100}%)`;
        updateDots();
    }

    // Next slide
    function nextSlide() {
        index = (index + 1) % items.length;
        updateSlider();
    }

    // Previous slide
    function prevSlide() {
        index = (index - 1 + items.length) % items.length;
        updateSlider();
    }

    // Event listeners
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    
    // Initialize dots
    createDots();

    // Optional: Auto-advance slider
    let autoSlide = setInterval(nextSlide, 5000);
    
    // Pause auto-slide on hover
    slider.parentElement.addEventListener('mouseenter', () => clearInterval(autoSlide));
    slider.parentElement.addEventListener('mouseleave', () => {
        autoSlide = setInterval(nextSlide, 5000);
    });

    // Add swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    slider.parentElement.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].clientX;
    });

    slider.parentElement.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].clientX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = touchStartX - touchEndX;

        if (swipeDistance > swipeThreshold) {
            nextSlide();
        } else if (swipeDistance < -swipeThreshold) {
            prevSlide();
        }
    }

    document.querySelectorAll('.portfolio-item').forEach(item => {
        item.addEventListener('click', () => {
            const modal = document.querySelector('.portfolio-modal');
            const img = item.querySelector('img');
            const link = img.dataset.link; // Get the link
            
            // Get link container elements
            const linkContainer = document.querySelector('.modal-link-container');
            const linkElement = document.querySelector('.modal-link');
    
            if (link) {
                linkElement.href = link;
                linkContainer.style.display = 'block';
            } else {
                linkContainer.style.display = 'none';
            }
            
            // Rest of your existing modal code...
        });
    });

    // For Portfolio Modal Page
     document.querySelectorAll('.portfolio-item').forEach(item => {
        item.addEventListener('click', () => {
            const modal = document.querySelector('.portfolio-modal');
            const img = item.querySelector('img');
            
            // Populate modal content
            document.querySelector('.modal-image').src = img.src;
            document.querySelector('.modal-title').textContent = img.dataset.title;
            document.querySelector('.modal-description').textContent = img.dataset.description;
            
            // Populate technologies
            const techContainer = document.querySelector('.modal-technologies');
            techContainer.innerHTML = img.dataset.tech.split(', ')
                .map(tech => `<span>${tech}</span>`)
                .join('');
            
            // Show modal
            modal.style.display = 'block';
        });
    });

    // Close modal functionality
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.querySelector('.portfolio-modal').style.display = 'none';
    });

    // Close when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.querySelector('.portfolio-modal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Close with ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelector('.portfolio-modal').style.display = 'none';
        }
    });
    
  }