const menu = document.getElementById('menu');
const playButton = document.getElementById('playButton');
const totalScoreElement = document.getElementById('totalScore');
const totalScoreNumber = document.getElementById('score_total');
const canisterCountElement = document.getElementById('canisterCount');
const coinCountElement = document.getElementById('coinCount');
const claimButton = document.getElementById('claimButton');
const coinImg = new Image();
const canisterImg = new Image();
const cupImg = new Image();

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
        const pointsResponse = await fetch(`https://game.svoivpn.duckdns.org/points/${window.userId}`);
        const pointsData = await pointsResponse.json();
        if (pointsData.points !== undefined) {
            coinCountElement.textContent = pointsData.points;
            loadedData++;
            checkAllLoaded();
        }

        // Загружаем попытки
        const attemptsResponse = await fetch(`https://game.svoivpn.duckdns.org/attempts/${window.userId}`);
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
cupImg.src = 'images/cup.png';


const images = [coinImg, canisterImg, cupImg];
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
        const response = await fetch(`https://game.svoivpn.duckdns.org/claim/${window.userId}`);
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
        const response = await fetch(`https://game.svoivpn.duckdns.org/claim/${window.userId}`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.next_claim_time) {
            // Обновляем попытки
            const attemptsResponse = await fetch(`https://game.svoivpn.duckdns.org/attempts/${window.userId}/add`, {
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
        const response = await fetch(`https://game.svoivpn.duckdns.org/attempts/${window.userId}`);
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


function showPage(targetId) {
    const sections = document.querySelectorAll('.menu-section');
    sections.forEach(section => {
        section.classList.toggle('hidden', section.id !== targetId);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    
    const username = tg_username || 'Guest';
    document.getElementById('username').textContent = username;


    await updatePlayButtonState();
    await loadUserRecord();
    await loadTasks();

 
    document.querySelectorAll('.menu-nav').forEach(button => {
        button.addEventListener('click', (event) => {
            const target = event.target.getAttribute('data-target');
            showPage(target);
            
            if (target === 'tasks') {
                loadTasks();
            }
        });
    });
});

playButton.addEventListener('click', async () => {
    if (playButton.classList.contains('disabled')) {
        alert('У тебя закончился бензин!');
        return;
    }
    
    window.location.href = `game.html?userId=${window.userId}`;
});

function loadScript(src) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => console.log(`${src} loaded`);
    document.head.appendChild(script);
}

async function loadUserRecord() {
    try {
        const response = await fetch(`https://game.svoivpn.duckdns.org/record/${window.userId}`);
        const data = await response.json();
        if (data.record !== undefined) {
            document.querySelector('.record-text').textContent = data.record;
        }
    } catch (error) {
        console.error('Error loading record:', error);
    }
}

async function loadTasks() {
    try {
        const response = await fetch(`https://game.svoivpn.duckdns.org/tasks/${window.userId}`);
        const tasks = await response.json();
        
        const tasksContainer = document.querySelector('#tasks ul');
        tasksContainer.innerHTML = ''; // Очищаем предыдущие задания
        
        tasks.forEach(task => {
            const taskElement = document.createElement('li');
            taskElement.className = 'task-item';
            
            // Добавляем класс для выполненных заданий
            if (task.is_completed) {
                taskElement.classList.add('completed');
            }
            
            taskElement.innerHTML = `
                <div class="task-header">
                    <h3>${task.title}</h3>
                    <span class="task-reward">${task.reward_coins} <img src="images/monetka.png" class="coin-icon" alt="Coins" /></span>
                </div>
                <p class="task-description">${task.description}</p>
                <div class="task-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(task.progress / task.target) * 100}%"></div>
                    </div>
                    <span class="progress-text">${task.progress}/${task.target}</span>
                </div>
                ${task.is_completed ? 
                    '<div class="task-completed">Выполнено!</div>' : 
                    '<button class="task-action" data-task-id="${task.task_id}">Выполнить</button>'}
            `;
            
            tasksContainer.appendChild(taskElement);
        });
        
        // Добавляем обработчики событий для кнопок заданий
        document.querySelectorAll('.task-action').forEach(button => {
            button.addEventListener('click', async (e) => {
                const taskId = e.target.getAttribute('data-task-id');
                await completeTaskStep(taskId);
            });
        });
        
    } catch (error) {
        console.error('Error loading tasks:', error);
        document.querySelector('#tasks ul').innerHTML = '<li>Не удалось загрузить задания</li>';
    }
}

// Функция для выполнения шага задания
async function completeTaskStep(taskId) {
    try {
        const response = await fetch(`https://game.svoivpn.duckdns.org/tasks/${window.userId}/update/${taskId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(1) // Увеличиваем прогресс на 1
        });
        
        const result = await response.json();
        
        if (result.status === 'completed') {
            // Обновляем счет монет, если задание выполнено
            if (result.new_points !== undefined) {
                document.getElementById('coinCount').textContent = result.new_points;
            }
            
            // Показываем уведомление о награде
            showRewardNotification(result.reward);
        }
        
        // Перезагружаем список заданий
        await loadTasks();
        
    } catch (error) {
        console.error('Error completing task:', error);
        alert('Не удалось обновить задание');
    }
}

// Функция для показа уведомления о награде
function showRewardNotification(reward) {
    const notification = document.createElement('div');
    notification.className = 'reward-notification';
    notification.innerHTML = `
        <div class="reward-content">
            <span>+${reward} <img src="images/monetka.png" class="coin-icon" alt="Coins" /></span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления и исчезновения
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}