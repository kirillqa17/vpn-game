Telegram.WebApp.ready();
Telegram.WebApp.expand();

const tg = window.Telegram.WebApp;
const userId = tg.initDataUnsafe?.user?.id;
const tg_username = tg.initDataUnsafe?.user?.username;


window.userId = userId;
window.username = tg_username;

const menu = document.getElementById('menu');
const playButton = document.getElementById('playButton');
const totalScoreElement = document.getElementById('totalScore');
const totalScoreNumber = document.getElementById('score_total');
const friendsElement = document.getElementById('friendsInvited');
const friendsNumber = document.getElementById('friends_total');
const coinImg = new Image();
const canisterImg = new Image();

coinImg.src = 'images/monetka.png';
canisterImg.src = 'images/kanistra.png';

const images = [coinImg, canisterImg];
let loadedImages = 0;

for (let img of images) {
    img.onload = () => {
        loadedImages++;
        if (loadedImages === images.length) {
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('menu').style.display = 'block';
        }
    };
    img.onerror = () => {
        console.error(`Failed to load image: ${img.src}`);
    };
}

function initializeClaimButton() {
    // Check if there's an active cooldown in localStorage
    const claimData = localStorage.getItem('claimData');
    let lastClaimTime = 0;
    let cooldownEndTime = 0;
    
    if (claimData) {
        const data = JSON.parse(claimData);
        lastClaimTime = data.lastClaimTime || 0;
        cooldownEndTime = data.cooldownEndTime || 0;
    }
    
    const now = Date.now();
    const cooldownDuration = 10 * 60 * 60 * 1000; // 10 hours in milliseconds
    
    if (now < cooldownEndTime) {
        // Cooldown is active
        const remainingTime = cooldownEndTime - now;
        startCooldown(remainingTime);
    } else {
        // Ready to claim
        claimButton.classList.remove('disabled');
        claimButton.querySelector('.progress-bar').style.width = '0%';
    }
    
    claimButton.addEventListener('click', handleClaimClick);
}

function handleClaimClick() {
    if (claimButton.classList.contains('disabled')) return;
    
    const now = Date.now();
    const cooldownDuration = 10 * 60 * 60 * 1000; // 10 hours in milliseconds
    const cooldownEndTime = now + cooldownDuration;
    
    // Save claim time to localStorage
    localStorage.setItem('claimData', JSON.stringify({
        lastClaimTime: now,
        cooldownEndTime: cooldownEndTime
    }));
    
    // Start cooldown
    startCooldown(cooldownDuration);
    
    // Here you would add your logic to give the user 2 game attempts
    // For example:
    // addGameAttempts(2);
    
    // Visual feedback
    claimButton.classList.add('active');
    setTimeout(() => {
        claimButton.classList.remove('active');
    }, 2000);
}

function startCooldown(duration) {
    claimButton.classList.add('disabled');
    const progressBar = claimButton.querySelector('.progress-bar');
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    progressBar.style.width = '100%';
    progressBar.style.transition = `width ${duration}ms linear`;
    
    setTimeout(() => {
        progressBar.style.width = '0%';
        progressBar.style.transition = 'none';
        claimButton.classList.remove('disabled');
    }, duration);
    
    // Update progress every second for smoother UI
    const interval = setInterval(() => {
        const now = Date.now();
        if (now >= endTime) {
            clearInterval(interval);
            return;
        }
        
        const elapsed = now - startTime;
        const progress = (elapsed / duration) * 100;
        progressBar.style.width = `${progress}%`;
    }, 1000);
}

function fetchTotalScore() {
    const userId = window.userId;
    const url = `http://localhost:5000/get_total_score/${userId}`;

    // fetch(url)
    //     .then(response => response.json())
    //     .then(data => {
    //         totalScoreNumber.textContent = data.total_score;
    //     })
    //     .catch(error => console.error('Error:', error));
    totalScoreNumber.textContent = userId;
}

function showPage(targetId) {
    const sections = document.querySelectorAll('.menu-section');
    sections.forEach(section => {
        section.classList.toggle('hidden', section.id !== targetId);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    
    const username = tg_username || 'Guest';

    const canisterCount = 10; 
    const coinCount = 500; 

    document.getElementById('username').textContent = username;
    document.getElementById('canisterCount').textContent = canisterCount;
    document.getElementById('coinCount').textContent = coinCount;

    document.querySelectorAll('.menu-nav').forEach(button => {
        button.addEventListener('click', (event) => {
            const target = event.target.getAttribute('data-target');
            showPage(target);
        });
    });
});

playButton.addEventListener('click', () => {
    // if (!userId) {
    //     alert('Ошибка: ID пользователя не найден');
    //     return;
    // }
    window.location.href = `game.html?userId=${userId}`;
});

function loadScript(src) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => console.log(`${src} loaded`);
    document.head.appendChild(script);
}
