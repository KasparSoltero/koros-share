document.addEventListener('DOMContentLoaded', function() {
    const image_dir = 'data/image-memories/';
    const total_images = 7;
    const images = [];

    console.log('test xxxx')

    for (let i = 1; i <= total_images; i++) {
        images.push(`${image_dir}${i}.png`);
    }

    const slideshowContainer = document.getElementById('slideshow-container');

    const imageElements = images.map(src => {
        const img = new Image();
        img.src = src;
        slideshowContainer.appendChild(img);
        return img;
    });
    let currentIndex = Math.floor(Math.random() * images.length);

    function startSlideshow() {
        imageElements[currentIndex].classList.add('active');
        console.log(`Starting slideshow with image ${currentIndex}`);
        setInterval(() => {
            // random index excluding currentIndex
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * images.length);
            } while (nextIndex === currentIndex);
            console.log(`Transitioning from image ${currentIndex} to ${nextIndex}`);
            imageElements[nextIndex].classList.add('active');
            imageElements[currentIndex].classList.remove('active');
            currentIndex = nextIndex;
        }, 4000); // Change image every 4 seconds
    }
    startSlideshow();

    console.log('Fetching markdown content...');


    // Fetch and render the markdown content
    fetch('content.md')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(markdown => {
            document.getElementById('content').innerHTML = marked.parse(markdown);
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
            document.getElementById('content').innerHTML = '<p>Error loading content.</p>';
    });

    let korosData = {};
    const titleContainer = document.getElementById('title-container');
    let words = [];
    let currentWordIndex = 0;
    let isAnimating = false;

    // Load koros data and start animation
    fetch('koros.json')
        .then(response => response.json())
        .then(data => {
            korosData = data;
            words = Object.keys(korosData);
            console.log('Loaded koros data:', korosData);
            // Start etymology animation after data is loaded
            setTimeout(() => {
                displayWord(words[currentWordIndex]);
            }, 500);
        })
        .catch(error => {
            console.error('Error loading koros.json:', error);
        });

    function getRandomPosition() {
        const angle = Math.random() * Math.PI * 2;
        // x offset from 15 to 20 vw + or -
        // y offset from 10 to 20 vw + or -
        const randomX = (15 + Math.random() * 5) * (Math.random() < 0.5 ? -1 : 1);
        const randomY = (10 + Math.random() * 10) * (Math.random() < 0.5 ? -1 : 1);
        return { x: randomX, y: randomY };
    }

    function pixelateText(text, container, delay = 0) {
        container.innerHTML = '';
        const chars = text.split('');
        const pixels = [];
        
        chars.forEach((char, i) => {
            const span = document.createElement('span');
            span.className = 'pixel';
            span.textContent = char;
            container.appendChild(span);
            pixels.push(span);
        });

        // Animate in with random delays
        pixels.forEach((pixel, i) => {
            const randomDelay = delay + Math.random() * 800;
            setTimeout(() => {
                pixel.style.transition = 'opacity 0.3s ease';
                pixel.style.opacity = '1';
            }, randomDelay);
        });

        return pixels;
    }

    function animateOut(element, callback) {
        const pixels = element.querySelectorAll('.pixel');
        let completed = 0;
        
        pixels.forEach((pixel, i) => {
            const randomDelay = Math.random() * 500;
            setTimeout(() => {
                pixel.style.transition = 'opacity 0.2s ease';
                pixel.style.opacity = '0';
                completed++;
                if (completed === pixels.length && callback) {
                    setTimeout(callback, 200);
                }
            }, randomDelay);
        });

        // Fade out labels and wordkey
        const fadeOutElements = element.querySelectorAll('.etymology-label, .word-key');
        fadeOutElements.forEach(label => {
            label.style.transition = 'opacity 0.5s ease';
            label.style.opacity = '0';
        });
    }

    function displayWord(wordKey) {
        if (isAnimating) return;
        isAnimating = true;

        const data = korosData[wordKey];
        const displayDiv = document.createElement('div');
        displayDiv.className = 'word-display';
        titleContainer.appendChild(displayDiv);

        // Main word (origin)
        const mainWord = document.createElement('div');
        mainWord.className = 'main-word';
        displayDiv.appendChild(mainWord);
        const displayText = data.origin || wordKey;
        pixelateText(displayText, mainWord, 0);

        // wordKey below main word
        const wordKeyEl = document.createElement('div');
        wordKeyEl.className = 'word-key';
        wordKeyEl.textContent = wordKey;
        displayDiv.appendChild(wordKeyEl);
        
        // Fade in after main word
        setTimeout(() => {
            wordKeyEl.style.opacity = '0.7';
        }, 1000);

        // Etymology labels with preferred order and frequency
        const preferredOrder = ['english', 'latin', 'PIE', 'PIE_root'];
        const displayProbabilities = {
            'english': 0.5,
            'latin': 0.7,
            'PIE': 0.9,
            'PIE_root': 1.0
        };

        const selectedLabels = [];
        // Iterate in reverse to animate the most ancient first
        for (let i = preferredOrder.length - 1; i >= 0; i--) {
            const key = preferredOrder[i];
            if (data[key] && Math.random() < displayProbabilities[key]) {
                selectedLabels.push({ key, value: data[key] });
            }
        }

        selectedLabels.forEach((item, i) => {
            const label = document.createElement('div');
            label.className = 'etymology-label';
            const pos = getRandomPosition();
            label.style.left = `calc(50% + ${pos.x}vw)`;
            label.style.top = `calc(50% + ${pos.y}vw)`;
            label.style.transform = 'translate(-50%, -50%)';
            
            const keyName = item.key.replace('_', ' ');
            label.textContent = `${keyName}: ${item.value}`;
            
            displayDiv.appendChild(label);

            setTimeout(() => {
                label.style.transition = 'opacity 1s ease';
                label.style.opacity = '0.9';
            }, 1200 + i * 400); // Staggered fade-in
        });

        // Schedule transition to next word
        setTimeout(() => {
            animateOut(displayDiv, () => {
                if (displayDiv.parentNode) {
                    titleContainer.removeChild(displayDiv);
                }
                isAnimating = false;
                currentWordIndex = (currentWordIndex + 1) % words.length;
                displayWord(words[currentWordIndex]);
            });
        }, 5000);
    }


    // Iridescent cursor effect
    const cursorEffect = document.createElement('div');
    cursorEffect.className = 'cursor-effect';
    cursorEffect.style.opacity = '0';
    document.body.appendChild(cursorEffect);

    let cursorX = 0;
    let cursorY = 0;
    let currentX = 0;
    let currentY = 0;

    // Mouse move for desktop
    document.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
        // cursorEffect.style.opacity = '1';
    });

    document.addEventListener('mousedown', () => {
        cursorEffect.style.opacity = '1';
    });
    document.addEventListener('mouseup', () => {
        setTimeout(() => {
            cursorEffect.style.opacity = '0';
        }, 300);
    });

    // Touch events for mobile
    document.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        cursorX = touch.clientX;
        cursorY = touch.clientY;
        cursorEffect.style.opacity = '1';
    });

    document.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        cursorX = touch.clientX;
        cursorY = touch.clientY;
    });

    document.addEventListener('touchend', () => {
        setTimeout(() => {
            cursorEffect.style.opacity = '0';
        }, 300);
    });

    // Smooth follow animation
    function animateCursor() {
        const dx = cursorX - currentX;
        const dy = cursorY - currentY;
        
        currentX += dx * 0.1; // Smooth easing
        currentY += dy * 0.1;
        
        cursorEffect.style.left = currentX + 'px';
        cursorEffect.style.top = currentY + 'px';
        
        requestAnimationFrame(animateCursor);
    }

    animateCursor();
});