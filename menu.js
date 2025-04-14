Telegram.WebApp.ready();
Telegram.WebApp.expand();

const tg = window.Telegram.WebApp;
const userId = tg.initDataUnsafe?.user?.id;
const tg_username = tg.initDataUnsafe?.username;


window.userId = userId;


const menu = document.getElementById('menu');
const playButton = document.getElementById('playButton');
const totalScoreElement = document.getElementById('totalScore');
const totalScoreNumber = document.getElementById('score_total');
const friendsElement = document.getElementById('friendsInvited');
const friendsNumber = document.getElementById('friends_total');

coinImg.src = 'images/kanistra.png';
canisterImg.src = 'images/monetka.png';

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
        if (section.id === targetId) {
            section.classList.remove('hidden');  // Показываем нужную страницу
        } else {
            section.classList.add('hidden');  // Скрываем остальные страницы
        }
    });
}

document.querySelectorAll('.menu-nav').forEach(button => {
    button.addEventListener('click', (event) => {
        const target = event.target.getAttribute('data-target');
        showPage(target);
    });
});

function fetchReferralsCount() {
    const userId = window.userId;
    const url = `http://localhost:5000/get_referrals_count/${userId}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            friendsNumber.textContent = data;
        })
        .catch(error => console.error('Error:', error));
}

document.addEventListener('DOMContentLoaded', () => {
    showPage('home');
    fetchTotalScore();
    fetchReferralsCount();

    const username = tg_username;
    const canisterCount = 10; 
    const coinCount = 500; 

    document.getElementById('username').textContent = username;

    document.getElementById('canisterCount').textContent = canisterCount;
    document.getElementById('coinCount').textContent = coinCount;
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
