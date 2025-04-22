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
initializeClaimButton();

function initializeClaimButton() {
    checkClaimStatus();
    claimButton.addEventListener('click', handleClaimClick);
}

async function checkClaimStatus() {
    try {
        const response = await fetch(`https://svoivpn.duckdns.org/claim/${window.userId}`);
        const data = await response.json();
        
        if (data.next_claim_time) {
            const nextClaimTime = new Date(data.next_claim_time);
            const now = new Date();
            
            if (now < nextClaimTime) {
                // Кнопка на кулдауне
                const remainingTime = nextClaimTime - now;
                startCooldown(remainingTime);
            } else {
                // Кнопка готова к клейму
                resetClaimButton();
            }
        } else {
            // Если нет данных о следующем клейме (первый раз)
            resetClaimButton();
        }
    } catch (error) {
        console.error('Error checking claim status:', error);
        resetClaimButton();
    }
}

async function handleClaimClick() {
    if (claimButton.classList.contains('disabled')) return;
    
    try {
        claimButton.classList.add('active');
        
        // Отправляем запрос на сервер для обновления времени клейма
        const response = await fetch(`https://svoivpn.duckdns.org/claim/${window.userId}`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.next_claim_time) {
            // Обновляем попытки
            const attemptsResponse = await fetch(`https://svoivpn.duckdns.org/attempts/${window.userId}/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(2) // Добавляем 2 попытки
            });
            const attemptsData = await attemptsResponse.json();
            await updatePlayButtonState();
            
            if (attemptsData.attempts !== undefined) {
                canisterCountElement.textContent = attemptsData.attempts;
                
                // Запускаем кулдаун
                const nextClaimTime = new Date(data.next_claim_time);
                const now = new Date();
                const cooldownDuration = nextClaimTime - now;
                startCooldown(cooldownDuration);
            }
        }
    } catch (error) {
        console.error('Claim error:', error);
    } finally {
        setTimeout(() => {
            claimButton.classList.remove('active');
        }, 2000);
    }
}

async function updatePlayButtonState() {
    try {
        const response = await fetch(`https://svoivpn.duckdns.org/attempts/${window.userId}`);
        const data = await response.json();
        
        if (data.attempts > 0) {
            playButton.classList.remove('disabled');
        } else {
            playButton.classList.add('disabled');
        }
    } catch (error) {
        console.error('Error checking attempts:', error);
        playButton.classList.add('disabled');
    }
}

function startCooldown(duration) {
    if (duration <= 0) {
        resetClaimButton();
        return;
    }
    claimButton.classList.add('disabled');
    const timeRemaining = claimButton.querySelector('.time-remaining');
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    // Обновляем отображение каждую секунду
    const interval = setInterval(() => {
        const now = Date.now();
        const remaining = endTime - now;
        
        if (remaining <= 0) {
            clearInterval(interval);
            resetClaimButton();
            return;
        }
        
        // Отображение оставшегося времени
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        timeRemaining.textContent = `${hours}h ${minutes}m`;
    }, 1000);
}

function resetClaimButton() {
    claimButton.classList.remove('disabled');
    claimButton.querySelector('.time-remaining').textContent = '';
}

async function decrementAttempts() {
    try {
        const response = await fetch(`https://svoivpn.duckdns.org/attempts/${window.userId}`);
        const data = await response.json();
        
        if (data.attempts > 0) {
            const updateResponse = await fetch(`https://svoivpn.duckdns.org/attempts/${window.userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.attempts - 1)
            });
            const updateData = await updateResponse.json();
            
            if (updateData.attempts !== undefined) {
                canisterCountElement.textContent = updateData.attempts;
                await updatePlayButtonState();
                return true;
            }
        }
        await updatePlayButtonState();
        return false;
    } catch (error) {
        console.error('Error decrementing attempts:', error);
        await updatePlayButtonState();
        return false;
    }
}

function showPage(targetId) {
    const sections = document.querySelectorAll('.menu-section');
    sections.forEach(section => {
        section.classList.toggle('hidden', section.id !== targetId);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    
    const username = tg_username || 'Guest';

    await updatePlayButtonState();

    document.getElementById('username').textContent = username;
 
    document.querySelectorAll('.menu-nav').forEach(button => {
        button.addEventListener('click', (event) => {
            const target = event.target.getAttribute('data-target');
            showPage(target);
        });
    });
});

playButton.addEventListener('click', async () => {
    if (playButton.classList.contains('disabled')) {
        alert('У тебя закончился бензин!');
        return;
    }
    
    const success = await decrementAttempts();
    if (success) {
        window.location.href = `game.html?userId=${window.userId}`;
    }
});

function loadScript(src) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => console.log(`${src} loaded`);
    document.head.appendChild(script);
}
