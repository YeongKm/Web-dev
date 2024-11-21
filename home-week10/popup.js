document.addEventListener('DOMContentLoaded', function() {
    const getWeatherButton = document.getElementById('getWeather');
    
    getWeatherButton.addEventListener('click', function() {
      const cityName = document.getElementById('cityName').value;
      
      if (cityName) {
        console.log('Sending city:', cityName);  // 로그 추가
  
        // chrome.runtime 객체가 정상적으로 존재하는지 확인
        if (typeof chrome.runtime !== 'undefined' && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ city: cityName }, function(response) {
            console.log('Received response:', response);  // 응답 확인
  
            if (response.error) {
              document.getElementById('weatherDetails').textContent = 'Error: ' + response.error;
            } else {
              document.getElementById('weatherDetails').textContent = `Temperature: ${response.temperature}°C, Weather: ${response.weather}`;
            }
          });
        } else {
          console.error('chrome.runtime is not available');
          document.getElementById('weatherDetails').textContent = 'Error: Failed to send message';
        }
      } else {
        document.getElementById('weatherDetails').textContent = 'Please enter a city name.';
      }
    });
  });