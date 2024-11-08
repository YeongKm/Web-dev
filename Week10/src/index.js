import axios from '../node_modules/axios';
// 폼 필드 선택
const form = document.querySelector('.form-data');
const apiKey = document.querySelector('.api-key');

// 여러 개의 region 입력 필드 선택 (3개의 region 입력 필드가 있다고 가정)
const regionInputs = [
    document.querySelector('.region-name-1'),
    document.querySelector('.region-name-2'),
    document.querySelector('.region-name-3')
];

// 결과 및 로딩 상태 선택
const errors = document.querySelector('.errors');
const loading = document.querySelector('.loading');
const resultContainer = document.querySelector('.result'); // 전체 result div 선택
const usage = document.querySelector('.carbon-usage');
const fossilfuel = document.querySelector('.fossil-fuel');
const myregion = document.querySelector('.my-region');
const clearBtn = document.querySelector('.clear-btn');

const calculateColor = async (value) => {
    let co2Scale = [0, 150, 600, 750, 800];
    let colors = ['#2AA364', '#F5EB4D', '#9E4229', '#381D02', '#381D02'];
    let closestNum = co2Scale.sort((a, b) => Math.abs(a - value) - Math.abs(b - value))[0];
    let scaleIndex = co2Scale.findIndex((element) => element > closestNum);
    let closestColor = colors[scaleIndex];
    chrome.runtime.sendMessage({ action: 'updateIcon', value: { color: closestColor } });
};

const displayCarbonUsage = async (apiKey, region) => {
    try {
        const response = await axios.get('https://api.co2signal.com/v1/latest', {
            params: { countryCode: region },
            headers: { Authorization: `Bearer ${apiKey}` }
        });

        const CO2 = Math.floor(response.data.data.carbonIntensity);
        calculateColor(CO2);
        loading.style.display = 'none';
        form.style.display = 'none';
        myregion.textContent += `${region} `;
        usage.textContent += `${Math.round(response.data.data.carbonIntensity)} grams (CO2 per kWh)\n`;
        fossilfuel.textContent += `${response.data.data.fossilFuelPercentage.toFixed(2)}% (fossil fuel usage)\n`;
        resultContainer.style.display = 'block';
    } catch (error) {
        loading.style.display = 'none';
        resultContainer.style.display = 'none';
        errors.textContent = `No data for ${region}.`;
    }
};

function setUpUser(apiKey, regionNames) {
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('regionNames', JSON.stringify(regionNames));
    loading.style.display = 'block';
    errors.textContent = '';
    clearBtn.style.display = 'block';
    resultContainer.style.display = 'none';

    // 각 region에 대해 결과 표시 함수 호출
    regionNames.forEach((region) => {
        displayCarbonUsage(apiKey, region);
    });
}

function handleSubmit(event) {
    event.preventDefault();

    // 각 region 입력 값을 배열로 수집
    const regionValues = regionInputs.map((input) => input.value.trim()).filter(Boolean);
    if (regionValues.length > 0 && apiKey.value.trim()) {
        setUpUser(apiKey.value.trim(), regionValues);
    } else {
        errors.textContent = "Please enter API Key and at least one Region Name.";
    }
}

// 초기화 함수
function init() {
    const storedApiKey = localStorage.getItem('apiKey');
    const storedRegionNames = JSON.parse(localStorage.getItem('regionNames') || '[]');

    chrome.runtime.sendMessage({
        action: 'updateIcon',
        value: { color: 'green' }
    });

    if (!storedApiKey || storedRegionNames.length === 0) {
        form.style.display = 'block';
        resultContainer.style.display = 'none';
        loading.style.display = 'none';
        clearBtn.style.display = 'none';
        errors.textContent = "";
    } else {
        storedRegionNames.forEach((region) => {
            displayCarbonUsage(storedApiKey, region);
        });
        form.style.display = 'none';
        clearBtn.style.display = 'block';
    }
}

function reset(event) {
    event.preventDefault();
    localStorage.removeItem('apiKey');
    localStorage.removeItem('regionNames');
    form.reset();
    init();
}

// 이벤트 리스너 설정
form.addEventListener('submit', handleSubmit);
clearBtn.addEventListener('click', reset);

init();
