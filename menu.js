Telegram.WebApp.ready();
Telegram.WebApp.expand();

const tg = window.Telegram.WebApp;
const userId = tg.initDataUnsafe?.user?.id;

window.userId = userId;

if (!userId) {
    console.error('User ID is missing.');
    alert('User ID is missing.');
}

const menu = document.getElementById('menu');
const playButton = document.getElementById('playButton');
const totalScoreElement = document.getElementById('totalScore');
const totalScoreNumber = document.getElementById('score_total');
const friendsElement = document.getElementById('friendsInvited');
const friendsNumber = document.getElementById('friends_total');

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
    fetchTotalScore();
    fetchReferralsCount();
});

playButton.addEventListener('click', () => {
    if (!userId) {
        alert('Ошибка: ID пользователя не найден');
        return;
    }
    window.location.href = `game.html?userId=${userId}`;
});

function loadScript(src) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => console.log(`${src} loaded`);
    document.head.appendChild(script);
}
