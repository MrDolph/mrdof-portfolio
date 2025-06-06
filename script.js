document.addEventListener("DOMContentLoaded", function () {
    // Tab functionality with smooth scrolling
    const tabs = document.querySelectorAll('.main');
    const sections = {
        about: document.getElementById('sectionAboutMe'),
        portfolio: document.getElementById('sectionPortfolio')
    };

    // Function to switch tabs and scroll to section
    function switchTab(targetSection) {
        // Remove active classes from all tabs and sections
        tabs.forEach(tab => tab.classList.remove('active'));
        Object.values(sections).forEach(section => section.classList.remove('active'));

        // Add active class to clicked tab and target section
        const activeTab = targetSection === 'about' 
        ? document.getElementById('tabAboutMe') 
        : document.getElementById('tabPortfolio');
        
        activeTab.classList.add('active');
        sections[targetSection].classList.add('active');

        // Smooth scroll to section
        sections[targetSection].scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    // Tab click handlers
    document.getElementById('tabAboutMe').addEventListener('click', () => switchTab('about'));
    document.getElementById('tabPortfolio').addEventListener('click', () => switchTab('portfolio'));

    // Set initial active state
    switchTab('about');

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


    //Typewriter style for User Bio
    const heading = document.querySelector('.bio h2');
    const textLength = heading.textContent.length;
    
    // Dynamic step calculation for the typewriter cursor movement
    heading.style.animation = 
        `typing ${textLength/5}s steps(${textLength}, end), 
         blink-cursor 0.75s step-end infinite`;


    // Dark Mode Toggle
    const themeButton = document.getElementById('themeButton');
    const body = document.documentElement;

    function toggleTheme() {
        const isDark = body.getAttribute('data-theme') === 'dark';
        body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        themeButton.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        
        // Save preference
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    }

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', savedTheme);
    themeButton.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

    themeButton.addEventListener('click', toggleTheme);
     
    // Scroll to Top
    const scrollButton = document.getElementById('scrollTop');

    function toggleScrollButton() {
        if (window.scrollY >= 100) {
            scrollButton.parentElement.classList.add('show');
        } else {
            scrollButton.parentElement.classList.remove('show');
        }
    }

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    window.addEventListener('scroll', toggleScrollButton);
    scrollButton.addEventListener('click', scrollToTop);

    // Update scroll detection logic
    function toggleScrollButton() {
        const scrollPosition = window.scrollY + window.innerHeight;
        const bottomThreshold = document.documentElement.scrollHeight - 400;
        
        if (scrollPosition >= bottomThreshold) {
            scrollButton.parentElement.classList.add('show');
        } else {
            scrollButton.parentElement.classList.remove('show');
        }
    }

     // Auto-update copyright year
     const yearSpan = document.querySelector('.copyright');
     if (yearSpan) {
         yearSpan.textContent = `© ${new Date().getFullYear()} Fatai Dawodu. All rights reserved.`;
     }

    document.getElementById('payButton').addEventListener('click', function () {
        const emailInput = document.getElementById("userEmail");
        const email = emailInput.value.trim();

        if (!email) {
            alert("Please enter your email before proceeding.");
            return;
        }

        var handler = PaystackPop.setup({
            key: 'pk_test_c854323157ed47be1a606fcea3c7b9172151c835', // your public key
            email: email,
            amount: 500000, // kobo
            currency: "NGN",
            callback: function (response) {
                alert("Payment complete! Ref: " + response.reference);

                // Redirect to WhatsApp chat
                const whatsappMessage = `Hello, I've just made a payment. My email is ${encodeURIComponent(email)}. Ref: ${encodeURIComponent(response.reference)}`;
                const whatsappLink = `https://wa.me/2348137872189?text=${whatsappMessage}`;

                window.location.href = whatsappLink;
            },
            onClose: function () {
                alert("Payment window closed.");
            }
        });

        handler.openIframe();
    });

    
});
