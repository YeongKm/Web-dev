const quotes = [
    'When you have eliminated the impossible, whatever remains, however improbable, must be the truth.',
    'There is nothing more deceptive than an obvious fact.',
    'I ought to know by this time that when a fact appears to be opposed to a long train of deductions it invariably proves to be capable of bearing some other interpretation.',
    'I never make exceptions. An exception disproves the rule.',
    'What one man can invent another can discover.',
    'Nothing clears up a case so much as stating it to another person.',
    'Education never ends, Watson. It is a series of lessons, with the greatest for the last.',
];

const quoteElement = document.getElementById('quote');
const messageElement = document.getElementById('message');
const typedValueElement = document.getElementById('typed-value');
const startButton = document.getElementById('start');
const bestScoreElement = document.getElementById('best-score'); // **변경된 부분**: 최고 점수를 표시할 요소 추가
let wordIndex = 0;
let words = [];
let startTime = 0;

const modal = document.querySelector('.modal');
const modalClose = document.querySelector('.close_btn');
const resultElement = document.getElementById('result');

// **변경된 부분**: 최고 점수를 localStorage에서 불러오기
let bestScore = localStorage.getItem('bestScore') ? parseFloat(localStorage.getItem('bestScore')) : null;

if (bestScore) {
    bestScoreElement.innerText = `최고 기록: ${bestScore / 1000}초`; // **변경된 부분**: 초기 화면에 최고 기록 표시
} else {
    bestScoreElement.innerText = '최고 기록이 없습니다.'; // 최고 기록이 없는 경우
}

modalClose.addEventListener('click', function() {
    modal.style.display = 'none';
});

startButton.addEventListener('click', () => {
    const quoteIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[quoteIndex];
    words = quote.split(' ');
    wordIndex = 0;
    const spanWords = words.map(word => `<span>${word} </span>`);
    quoteElement.innerHTML = spanWords.join('');
    quoteElement.childNodes[0].className = 'highlight';
    messageElement.innerText = '';
    typedValueElement.value = '';
    typedValueElement.focus();
    typedValueElement.disabled = false;
    startButton.disabled = true;
    startTime = new Date().getTime();
});

typedValueElement.addEventListener('input', () => {
    const currentWord = words[wordIndex];
    const typedValue = typedValueElement.value;
    
    if (typedValue === currentWord && wordIndex === words.length - 1) {
        const elapsedTime = new Date().getTime() - startTime;
        const message = `CONGRATULATIONS! You finished in ${elapsedTime / 1000} seconds.`;
        resultElement.innerText = message;
        modal.style.display = 'block';

        // 최고 점수 갱신 및 저장
        if (!bestScore || elapsedTime < bestScore) {
            bestScore = elapsedTime;
            localStorage.setItem('bestScore', bestScore);
            bestScoreElement.innerText = `최고 기록: ${bestScore / 1000}초`;
        }

        typedValueElement.disabled = true;
        startButton.disabled = false;
    } else if (typedValue.endsWith(' ') && typedValue.trim() === currentWord) {
        typedValueElement.value = '';
        wordIndex++;
        
        // 올바른 입력일 경우 CSS 클래스 추가
        typedValueElement.classList.remove('incorrect');
        typedValueElement.classList.add('correct');
        
        for (const wordElement of quoteElement.childNodes) {
            wordElement.className = '';
        }
        quoteElement.childNodes[wordIndex].className = 'highlight';
    } else if (currentWord.startsWith(typedValue)) {
        typedValueElement.className = ''; // 올바른 경우 클래스 제거
        typedValueElement.classList.remove('incorrect');
        typedValueElement.classList.add('correct'); // 올바른 입력이므로 클래스 추가
    } else {
        typedValueElement.className = 'error'; // 잘못된 경우
        typedValueElement.classList.remove('correct');
        typedValueElement.classList.add('incorrect'); // 잘못된 입력이므로 클래스 추가
    }
});