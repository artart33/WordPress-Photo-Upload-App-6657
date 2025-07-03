class WeatherService {
  static async getCurrentWeather(latitude, longitude) {
    try {
      // Using OpenWeatherMap API (free tier, no signup required for basic weather)
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=nl&appid=demo`
      );
      
      if (!response.ok) {
        // Fallback to wttr.in service (no API key needed)
        return await this.getWeatherFromWttr(latitude, longitude);
      }
      
      const data = await response.json();
      return this.formatOpenWeatherData(data);
    } catch (error) {
      console.warn('OpenWeatherMap failed, trying fallback:', error);
      return await this.getWeatherFromWttr(latitude, longitude);
    }
  }

  static async getWeatherFromWttr(latitude, longitude) {
    try {
      const response = await fetch(
        `https://wttr.in/${latitude},${longitude}?format=j1&lang=nl`
      );
      
      if (!response.ok) {
        throw new Error('Weather service unavailable');
      }
      
      const data = await response.json();
      return this.formatWttrData(data);
    } catch (error) {
      console.error('Weather fetch failed:', error);
      throw new Error('Kon weer informatie niet ophalen');
    }
  }

  static formatOpenWeatherData(data) {
    const weather = data.weather[0];
    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const humidity = data.main.humidity;
    const windSpeed = Math.round(data.wind.speed * 3.6); // Convert m/s to km/h
    
    return {
      temperature: temp,
      feelsLike,
      condition: weather.description,
      icon: this.getWeatherSymbol(weather.icon, weather.main),
      humidity,
      windSpeed,
      summary: `${this.getWeatherSymbol(weather.icon, weather.main)} ${temp}°C (voelt als ${feelsLike}°C)`
    };
  }

  static formatWttrData(data) {
    const current = data.current_condition[0];
    const temp = Math.round(current.temp_C);
    const feelsLike = Math.round(current.FeelsLikeC);
    const humidity = current.humidity;
    const windSpeed = Math.round(current.windspeedKmph);
    const condition = current.lang_nl?.[0]?.value || current.weatherDesc[0].value;
    
    return {
      temperature: temp,
      feelsLike,
      condition,
      icon: this.getWeatherSymbolFromCode(current.weatherCode),
      humidity,
      windSpeed,
      summary: `${this.getWeatherSymbolFromCode(current.weatherCode)} ${temp}°C (voelt als ${feelsLike}°C)`
    };
  }

  static getWeatherSymbol(iconCode, main) {
    const iconMap = {
      '01d': '☀️', // clear sky day
      '01n': '🌙', // clear sky night
      '02d': '⛅', // few clouds day
      '02n': '☁️', // few clouds night
      '03d': '☁️', // scattered clouds
      '03n': '☁️',
      '04d': '☁️', // broken clouds
      '04n': '☁️',
      '09d': '🌧️', // shower rain
      '09n': '🌧️',
      '10d': '🌦️', // rain day
      '10n': '🌧️', // rain night
      '11d': '⛈️', // thunderstorm
      '11n': '⛈️',
      '13d': '❄️', // snow
      '13n': '❄️',
      '50d': '🌫️', // mist
      '50n': '🌫️'
    };

    return iconMap[iconCode] || this.getWeatherSymbolByCondition(main);
  }

  static getWeatherSymbolFromCode(code) {
    const codeMap = {
      113: '☀️', // Sunny/Clear
      116: '⛅', // Partly Cloudy
      119: '☁️', // Cloudy
      122: '☁️', // Overcast
      143: '🌫️', // Mist
      176: '🌦️', // Patchy rain possible
      179: '🌨️', // Patchy snow possible
      182: '🌧️', // Patchy sleet possible
      185: '🌧️', // Patchy freezing drizzle possible
      200: '⛈️', // Thundery outbreaks possible
      227: '❄️', // Blowing snow
      230: '❄️', // Blizzard
      248: '🌫️', // Fog
      260: '🌫️', // Freezing fog
      263: '🌦️', // Patchy light drizzle
      266: '🌧️', // Light drizzle
      281: '🌧️', // Freezing drizzle
      284: '🌧️', // Heavy freezing drizzle
      293: '🌦️', // Patchy light rain
      296: '🌧️', // Light rain
      299: '🌧️', // Moderate rain at times
      302: '🌧️', // Moderate rain
      305: '🌧️', // Heavy rain at times
      308: '🌧️', // Heavy rain
      311: '🌧️', // Light freezing rain
      314: '🌧️', // Moderate or heavy freezing rain
      317: '🌨️', // Light sleet
      320: '🌨️', // Moderate or heavy sleet
      323: '🌨️', // Patchy light snow
      326: '❄️', // Light snow
      329: '❄️', // Patchy moderate snow
      332: '❄️', // Moderate snow
      335: '❄️', // Patchy heavy snow
      338: '❄️', // Heavy snow
      350: '🌧️', // Ice pellets
      353: '🌦️', // Light rain shower
      356: '🌧️', // Moderate or heavy rain shower
      359: '🌧️', // Torrential rain shower
      362: '🌨️', // Light sleet showers
      365: '🌨️', // Moderate or heavy sleet showers
      368: '🌨️', // Light snow showers
      371: '❄️', // Moderate or heavy snow showers
      374: '🌧️', // Light showers of ice pellets
      377: '🌧️', // Moderate or heavy showers of ice pellets
      386: '⛈️', // Patchy light rain with thunder
      389: '⛈️', // Moderate or heavy rain with thunder
      392: '⛈️', // Patchy light snow with thunder
      395: '⛈️'  // Moderate or heavy snow with thunder
    };

    return codeMap[code] || '🌤️';
  }

  static getWeatherSymbolByCondition(condition) {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return '☀️';
    if (conditionLower.includes('cloud')) return '☁️';
    if (conditionLower.includes('rain')) return '🌧️';
    if (conditionLower.includes('snow')) return '❄️';
    if (conditionLower.includes('thunder')) return '⛈️';
    if (conditionLower.includes('mist') || conditionLower.includes('fog')) return '🌫️';
    if (conditionLower.includes('wind')) return '💨';
    
    return '🌤️'; // Default
  }
}

export default WeatherService;