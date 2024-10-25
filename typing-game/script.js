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
let wordIndex = 0;
let words = [];
let startTime = 0;

startButton.addEventListener('click', () => {
    const quoteIndex = Math.floor(Math.random() * quotes.length); // 무작위 인덱스 생성
    const quote = quotes[quoteIndex]; // 무작위 인덱스 값으로 인용문 선택
    words = quote.split(' '); // 공백 문자를 기준으로 words 배열에 저장
    wordIndex = 0; // 초기화
    const spanWords = words.map(function(word) { return `<span>${word} </span>` });
    // span 태그로 감싼 후 배열에 저장
    quoteElement.innerHTML = spanWords.join(''); // 하나의 문자열로 결합 및 설정
    quoteElement.childNodes[0].className = 'highlight'; // 첫번째 단어 강조
    messageElement.innerText = ''; // 메시지 요소 초기화
    typedValueElement.value = ''; //입력 필드 초기화
    typedValueElement.focus(); // 포커스 설정
    typedValueElement.disabled = false; // 입력 필드 활성화
    startButton.disabled = true; // 버튼 비활성화
    startTime = new Date().getTime(); // 타이핑 시작 시간 기록
});

typedValueElement.addEventListener('input', () => {
    const currentWord = words[wordIndex]; // 현재 타이핑할 단어를 currentWord에 저장
    const typedValue = typedValueElement.value; // 입력한 값을 typedValue에 저장
    if (typedValue === currentWord && wordIndex === words.length - 1) { // 마지막 단어까지 정확히 입력했는 지 체크
        const elapsedTime = new Date().getTime() - startTime; // 타이핑에 소요된 시간 계산
        const message = `CONGRATULATIONS! You finished in ${elapsedTime / 1000} seconds.` ; // 타이핑 완료 메시지
        messageElement.innerText = message; //생성된 메시지 화면에 표시
        typedValueElement.disabled = true; // 입력 필드 비활성화
        startButton.disabled = false; // 버튼 활성화
    } else if (typedValue.endsWith(' ') && typedValue.trim() === currentWord) { // 입력된 값이 공백으로 끝났는지와 공백을 제거한 값이 현재 단어와 일치하는 지 확인
        typedValueElement.value = ''; // 입력 필드 초기화하여 다음 단어 입력 준비
        wordIndex++; // 다음 단어로 이동
        for (const wordElement of quoteElement.childNodes) { // 모든 강조 표시 제거
            wordElement.className = ''; // 클래스 제거
        }
        quoteElement.childNodes[wordIndex].className = 'highlight'; // 다음으로 타이핑할 단어에 클래스 추가
    } else if (currentWord.startsWith(typedValue)) { //현재 단어의 일부를 맞게 입력하고 있는 지 확인
        typedValueElement.className = ''; // 올바르면 클래스 제거
    } else {
        typedValueElement.className = 'error'; // 틀리면 error 클래스 추가
    }
});
