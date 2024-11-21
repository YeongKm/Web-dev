const apiKey = 'b36b0ef23debc78f0b87730ae0bce0b1';  // OpenWeatherMap API Key

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);  // 로그 추가

  const city = request.city;
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      if (data.cod === 200) {
        const weatherData = {
          temperature: data.main.temp,
          weather: data.weather[0].description
        };
        console.log('Weather data:', weatherData);  // 로그 추가
        sendResponse(weatherData);
      } else {
        console.log('City not found');  // 로그 추가
        sendResponse({ error: 'City not found' });
      }
    })
    .catch(error => {
      console.log('Error fetching data:', error);  // 로그 추가
      sendResponse({ error: 'Failed to fetch weather data' });
    });

  return true;  // To indicate that the response is asynchronous
});