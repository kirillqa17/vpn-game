const birdImg = new Image();
const pipeNorthImg = new Image();
const pipeSouthImg = new Image();
const backgroundImg = new Image();
const smokeImg = new Image();
const coinImg = new Image();


birdImg.src = 'images/plane1.png';
pipeNorthImg.src = 'images/skyscraper1_n.png';
pipeSouthImg.src = 'images/skyscraper1.png';
backgroundImg.src = 'images/background.png';
smokeImg.src = 'images/smoke.png';
coinImg.src = 'images/monetka.png';


const images = [birdImg, pipeNorthImg, pipeSouthImg, backgroundImg, smokeImg, coinImg];
let loadedImages = 0;

for (let img of images) {
    img.onload = () => {
        loadedImages++;
        if (loadedImages === images.length) {
            document.getElementById('loadingScreen').style.display = 'none';
            startGame();
        }
    };
    img.onerror = () => {
        console.error(`Failed to load image: ${img.src}`);
    };
}

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('userId') || 'anonymous';

const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
const messageDiv = document.getElementById('message');
const restartButton = document.getElementById('restartButton');
const menuButton = document.getElementById('menuButton');
const scoreBackground = document.getElementById('scoreBackground');
const scoreSpan = document.getElementById('score');
const gameContainer = document.getElementById('gameContainer');
const buttonContainer = document.getElementById('buttonContainer');
const scoreContainer = document.getElementById('scoreContainer');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const bird = {
    x: 50,
    y: 150,
    width: 64,
    height: 54,
    gravity: 1100,
    lift: -350,
    velocity: 0,
    hitboxOffsetX: 10,
    hitboxOffsetY: 16,
    hitboxWidth: 44,
    hitboxHeight: 16
};

const pipes = [];
const smokes = [];
const pipeWidth = 150;
const gap = 200;

let frame = 0;
let score = 0;
let gameStarted = false;
let backgroundX = 0;
let lastTime = 0;

const basePipeSpeed = 200; // Начальная скорость труб
let currentPipeSpeed = basePipeSpeed; // Текущая скорость труб
let speedIncreaseRate = 10; // На сколько увеличивается скорость каждую секунду
let gameStartTime = 0; // Время начала игры
const baseBackgroundSpeed = 100;
let currentBackgroundSpeed= baseBackgroundSpeed;

let basePipeInterval = 3; // Базовый интервал между трубами (в секундах)
let currentPipeInterval = basePipeInterval; 
let lastPipeTime = 0; 


async function startGame() {
    const attemptsResponse = await fetch(`https://svoivpn.duckdns.org/attempts/${userId}`);
    const attemptsData = await attemptsResponse.json();
    
    if (!attemptsData.attempts || attemptsData.attempts <= 0) {
        alert('У тебя закончился бензин!');
        window.location.href = 'index.html';
        return;
    }

    // Списываем попытку
    const updateResponse = await decrementAttempts()
    // Если не удалось списать попытку, возвращаем в меню
    if (!updateResponse.ok) {
        alert('Ошибка при списании попытки');
        window.location.href = 'index.html';
        return;
    }

    gameStarted = false;
    frame = 0;
    score = 0;
    pipes.length = 0;
    smokes.length = 0;
    bird.y = 150;
    bird.velocity = 0;
    backgroundX = 0;
    currentPipeSpeed = basePipeSpeed; // Сброс скорости
    gameStartTime = performance.now(); // Запись времени начала игры
    scoreSpan.textContent = score;
    currentPipeInterval = basePipeInterval;
    scoreBackground.style.display = 'block';
    messageDiv.style.display = 'none';
    buttonContainer.style.display = 'none';
    startCountdown();
}

function startCountdown() {
    let countdown = 3;
    const countdownInterval = setInterval(() => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'white';
    context.font = '48px Arial';
    context.textAlign = 'center';
    context.fillText(countdown, canvas.width / 2, canvas.height / 2);
    countdown--;
    if (countdown < 0) {
        clearInterval(countdownInterval);
        showStartMessage();
    }
    }, 1000);
}

function showStartMessage() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '48px Arial';
    context.textAlign = 'center';
    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
    const startText = 'START';
    let xOffset = (canvas.width / 2) - (context.measureText(startText).width / 2);
    for (let i = 0; i < startText.length; i++) {
    context.fillStyle = colors[i % colors.length];
    context.fillText(startText[i], xOffset, canvas.height / 2);
    xOffset += context.measureText(startText[i]).width;
    }

    setTimeout(() => {
    gameStarted = true;
    lastTime = performance.now();
    requestAnimationFrame(draw);
    }, 1000);
}

function draw(timestamp) {
    if (!gameStarted) return;

    if (!lastTime) lastTime = timestamp;
    let deltaTime = (timestamp - lastTime) / 1000;
    deltaTime = Math.min(deltaTime, 0.1);
    lastTime = timestamp;

    // Плавное увеличение скорости с ограничением
    const gameTime = (timestamp - gameStartTime) / 1000;
    currentPipeSpeed = Math.min(
        basePipeSpeed + (speedIncreaseRate * Math.sqrt(gameTime)),
        400 // max speed
    );
    currentBackgroundSpeed = currentPipeSpeed / 2;

    // Увеличиваем скорость труб со временем
    currentPipeInterval = Math.max(
        basePipeInterval * (basePipeSpeed / currentPipeSpeed),
        0.5 // min interval
    );
    

    context.clearRect(0, 0, canvas.width, canvas.height);

    backgroundX -= currentBackgroundSpeed * deltaTime;
    if (backgroundX <= -canvas.width) backgroundX = 0;
    context.drawImage(backgroundImg, backgroundX, 0, canvas.width, canvas.height);
    context.drawImage(backgroundImg, backgroundX + canvas.width - 2, 0, canvas.width, canvas.height);

    bird.velocity += bird.gravity * deltaTime;
    bird.y += bird.velocity * deltaTime;

    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        triggerGameOver();
        return;
    }

    currentPipeInterval = basePipeInterval * (basePipeSpeed / currentPipeSpeed);

    lastPipeTime += deltaTime;
    if (lastPipeTime >= currentPipeInterval) { 
        let pipeY = Math.random() * (canvas.height - gap - 200) - canvas.height;
        pipes.push({ x: canvas.width, y: pipeY });
        lastPipeTime = 0;
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= currentPipeSpeed * deltaTime;
    
        if (pipes[i].x + pipeWidth < 0) {
            pipes.splice(i, 1);
            score++;
            scoreSpan.textContent = score;
            continue; // Пропускаем остальную обработку для удаленной трубы
        }
    
        context.drawImage(pipeNorthImg, pipes[i].x, pipes[i].y, pipeWidth, canvas.height);
        context.drawImage(pipeSouthImg, pipes[i].x, pipes[i].y + canvas.height + gap, pipeWidth, canvas.height);
    
        const bx = bird.x + bird.hitboxOffsetX;
        const by = bird.y + bird.hitboxOffsetY;
        const bw = bird.hitboxWidth;
        const bh = bird.hitboxHeight;

        // Хитбоксы
        // context.strokeStyle = 'red';
        // context.lineWidth = 2;
        // context.strokeRect(pipes[i].x, pipes[i].y, pipeWidth, canvas.height);
        // context.strokeRect(pipes[i].x, pipes[i].y + canvas.height + gap, pipeWidth, canvas.height);
        // context.strokeRect(bx, by, bw, bh);
    
        if (
            bx + bw > pipes[i].x &&
            bx < pipes[i].x + pipeWidth &&
            (by < pipes[i].y + canvas.height || by + bh > pipes[i].y + canvas.height + gap)
        ) {
            triggerGameOver();
            return;
        }
    }

    

    for (let i = 0; i < smokes.length; i++) {
        context.globalAlpha = smokes[i].opacity;
        context.drawImage(smokeImg, smokes[i].x, smokes[i].y, 50, 50);
        smokes[i].x -= smokes[i].vx * deltaTime * 60;
        smokes[i].y -= smokes[i].vy * deltaTime * 60;
        smokes[i].opacity -= 0.01 * deltaTime * 60;
        if (smokes[i].opacity <= 0) {
            smokes.splice(i, 1);
        }
    }

    context.globalAlpha = 1.0;

    frame++;

    if (gameStarted) requestAnimationFrame(draw);
}

function triggerGameOver() {
    gameStarted = false;
    sendGameResult(score);
    updateUserRecord(score);
    setTimeout(gameOver, 1000);
}

function gameOver() {
    scoreContainer.innerHTML = `Вы проиграли<br>Ваш счёт: ${score} <img src="images/monetka.png" class="coinIcon" alt="Monetka" />`;
    messageDiv.style.display = 'block';
    buttonContainer.style.display = 'block';
    scoreBackground.style.display = 'block';
}

async function resetGame() {
    const attemptsData = await decrementAttempts().json();
    if (!attemptsData.attempts || attemptsData.attempts <= 0) {
        alert('У тебя закончился бензин!');
        window.location.href = 'index.html';
        return;
    }
    else if (attemptsData !== undefined && attemptsData.attempts !== undefined){
        startGame();
    }
    else {
        alert('Ошибка');
        window.location.href = 'index.html';
    }
}

restartButton.addEventListener('click', resetGame);

menuButton.addEventListener('click', () => {
    window.location.href = 'index.html';
});

canvas.addEventListener('click', () => {
    if (gameStarted) {
    bird.velocity = bird.lift;
    smokes.push({ x: bird.x - 20, y: bird.y, vx: 4, vy: 0, opacity: 1.0 });
    }
});

function sendGameResult(score) {
    fetch(`https://svoivpn.duckdns.org/points/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(score)
    })
    .then(response => response.json())
    .then(data => {
        if (data.points !== undefined) {
            console.log('Game points updated:', data.points);
        } else {
            console.error('Failed to update points:', data.error);
        }
    })
    .catch(error => console.error('Error updating points:', error));
}

async function decrementAttempts() {
    try {
        const response = await fetch(`https://svoivpn.duckdns.org/attempts/${userId}`);
        const data = await response.json();
        
        if (data.attempts > 0) {
            const updateResponse = await fetch(`https://svoivpn.duckdns.org/attempts/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.attempts - 1)
            });
            return updateResponse;
        }
        return null;
    } catch (error) {
        console.error('Error decrementing attempts:', error);
        return null;
    }
}

async function updateUserRecord(newScore) {
    let record;
    try {
        const response = await fetch(`https://svoivpn.duckdns.org/record/${userId}`);
        const data = await response.json();
        if (data.record !== undefined) {
            record = data.record
        }
    } catch (error) {
        console.error('Error loading record:', error);
    }

    if (record < newScore){
        try {
            const response = await fetch(`https://svoivpn.duckdns.org/record/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newScore)
            });
            const data = await response.json();
            if (data.record !== undefined) {
                console.log('Record updated:', data.record);
            }
        } catch (error) {
            console.error('Error updating record:', error);
        }
    }
}
