const menu = document.getElementById('menu');
const playButton = document.getElementById('playButton');
const totalScoreElement = document.getElementById('totalScore');
const totalScoreNumber = document.getElementById('score_total');
const canisterCountElement = document.getElementById('canisterCount');
const coinCountElement = document.getElementById('coinCount');
const claimButton = document.getElementById('claimButton');
const coinImg = new Image();
const canisterImg = new Image();

let loadedData = 0;
const totalDataToLoad = 3; // изображения + points + attempts

function checkAllLoaded() {
    if (loadedImages === images.length && loadedData === 2) { // 2 - points и attempts
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('menu').style.display = 'block';
    }
}

// Загрузка данных пользователя
async function loadUserData() {
    try {
        // Загружаем очки
        const pointsResponse = await fetch(`https://svoivpn.duckdns.org/points/${window.userId}`);
        const pointsData = await pointsResponse.json();
        if (pointsData.points !== undefined) {
            coinCountElement.textContent = pointsData.points;
            loadedData++;
            checkAllLoaded();
        }

        // Загружаем попытки
        const attemptsResponse = await fetch(`https://svoivpn.duckdns.org/attempts/${window.userId}`);
        const attemptsData = await attemptsResponse.json();
        if (attemptsData.attempts !== undefined) {
            canisterCountElement.textContent = attemptsData.attempts;
            loadedData++;
            checkAllLoaded();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        // Устанавливаем значения по умолчанию в случае ошибки
        coinCountElement.textContent = '0';
        canisterCountElement.textContent = '0';
        loadedData += 2;
        checkAllLoaded();
    }
}

coinImg.src = 'images/monetka.png';
canisterImg.src = 'images/kanistra.png';


const images = [coinImg, canisterImg];
let loadedImages = 0;

for (let img of images) {
    img.onload = () => {
        loadedImages++;
        if (loadedImages === images.length) {
            checkAllLoaded();
        }
    };
    img.onerror = () => {
        console.error(`Failed to load image: ${img.src}`);
        loadedImages++;
        checkAllLoaded();
    };
}

Telegram.WebApp.ready();
Telegram.WebApp.expand();

const tg = window.Telegram.WebApp;
const userId = tg.initDataUnsafe?.user?.id;
const tg_username = tg.initDataUnsafe?.user?.username;


window.userId = userId;
window.username = tg_username;

loadUserData();

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

async function handleClaimClick() {
    if (claimButton.classList.contains('disabled')) return;
    
    try {
        // Обновляем время claim на сервере
        const claimResponse = await fetch(`https://svoivpn.duckdns.org/claim/${window.userId}`, {
            method: 'POST'
        });
        const claimData = await claimResponse.json();
        
        if (claimData.next_claim_time) {
            // Добавляем 2 попытки
            const attemptsResponse = await fetch(`https://svoivpn.duckdns.org/attempts/${window.userId}/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(2)
            });
            const attemptsData = await attemptsResponse.json();
            
            if (attemptsData.attempts !== undefined) {
                canisterCountElement.textContent = attemptsData.attempts;
                
                // Визуальные эффекты
                claimButton.classList.add('active');
                setTimeout(() => {
                    claimButton.classList.remove('active');
                }, 2000);
                
                // Запускаем таймер
                const now = new Date();
                const nextClaimTime = new Date(claimData.next_claim_time);
                const cooldownDuration = nextClaimTime - now;
                startCooldown(cooldownDuration);
            }
        }
    } catch (error) {
        console.error('Error claiming rewards:', error);
    }
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

playButton.addEventListener('click', async () => {
    // Проверяем количество попыток
    try {
        const response = await fetch(`https://svoivpn.duckdns.org/attempts/${window.userId}`);
        const data = await response.json();
        
        if (data.attempts > 0) {
            // Уменьшаем количество попыток
            const updateResponse = await fetch(`https://svoivpn.duckdns.org/attempts/${window.userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.attempts - 1)
            });
            const updateData = await updateResponse.json();
            
            if (updateData.attempts !== undefined) {
                canisterCountElement.textContent = updateData.attempts;
                window.location.href = `game.html?userId=${window.userId}`;
            }
        } else {
            alert('У вас закончились попытки!');
        }
    } catch (error) {
        console.error('Error checking attempts:', error);
        window.location.href = `game.html?userId=${window.userId}`;
    }
});

function loadScript(src) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => console.log(`${src} loaded`);
    document.head.appendChild(script);
}
