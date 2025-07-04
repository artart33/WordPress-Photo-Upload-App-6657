class WeatherService {
  static async getCurrentWeather(latitude, longitude) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=nl&appid=demo`,
        {
          signal: controller.signal
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        return await this.getWeatherFromWttr(latitude, longitude)
      }

      const data = await response.json()
      return this.formatOpenWeatherData(data)
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Weather request timeout, trying fallback')
      } else {
        console.warn('OpenWeatherMap failed, trying fallback:', error)
      }
      return await this.getWeatherFromWttr(latitude, longitude)
    }
  }

  static async getWeatherFromWttr(latitude, longitude) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const response = await fetch(
        `https://wttr.in/${latitude},${longitude}?format=j1&lang=nl`,
        {
          signal: controller.signal
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Weather service unavailable')
      }

      const data = await response.json()
      return this.formatWttrData(data)
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Weather request timeout')
        throw new Error('Weer service duurt te lang om te reageren')
      } else {
        console.error('Weather fetch failed:', error)
        throw new Error('Kon weer informatie niet ophalen')
      }
    }
  }

  static formatOpenWeatherData(data) {
    const weather = data.weather[0]
    const temp = Math.round(data.main.temp)
    const feelsLike = Math.round(data.main.feels_like)
    const humidity = data.main.humidity
    const windSpeed = Math.round(data.wind.speed * 3.6)

    return {
      temperature: temp,
      feelsLike,
      condition: weather.description,
      icon: this.getWeatherSymbol(weather.icon, weather.main),
      humidity,
      windSpeed,
      summary: `${this.getWeatherSymbol(weather.icon, weather.main)} ${temp}°C (voelt als ${feelsLike}°C)`
    }
  }

  static formatWttrData(data) {
    const current = data.current_condition[0]
    const temp = Math.round(current.temp_C)
    const feelsLike = Math.round(current.FeelsLikeC)
    const humidity = current.humidity
    const windSpeed = Math.round(current.windspeedKmph)
    const condition = current.lang_nl?.[0]?.value || current.weatherDesc[0].value

    return {
      temperature: temp,
      feelsLike,
      condition,
      icon: this.getWeatherSymbolFromCode(current.weatherCode),
      humidity,
      windSpeed,
      summary: `${this.getWeatherSymbolFromCode(current.weatherCode)} ${temp}°C (voelt als ${feelsLike}°C)`
    }
  }

  static getWeatherSymbol(iconCode, main) {
    const iconMap = {
      '01d': '☀️',
      '01n': '🌙',
      '02d': '⛅',
      '02n': '☁️',
      '03d': '☁️',
      '03n': '☁️',
      '04d': '☁️',
      '04n': '☁️',
      '09d': '🌧️',
      '09n': '🌧️',
      '10d': '🌦️',
      '10n': '🌧️',
      '11d': '⛈️',
      '11n': '⛈️',
      '13d': '❄️',
      '13n': '❄️',
      '50d': '🌫️',
      '50n': '🌫️'
    }

    return iconMap[iconCode] || this.getWeatherSymbolByCondition(main)
  }

  static getWeatherSymbolFromCode(code) {
    const codeMap = {
      113: '☀️',
      116: '⛅',
      119: '☁️',
      122: '☁️',
      143: '🌫️',
      176: '🌦️',
      179: '🌨️',
      182: '🌧️',
      185: '🌧️',
      200: '⛈️',
      227: '❄️',
      230: '❄️',
      248: '🌫️',
      260: '🌫️',
      263: '🌦️',
      266: '🌧️',
      281: '🌧️',
      284: '🌧️',
      293: '🌦️',
      296: '🌧️',
      299: '🌧️',
      302: '🌧️',
      305: '🌧️',
      308: '🌧️',
      311: '🌧️',
      314: '🌧️',
      317: '🌨️',
      320: '🌨️',
      323: '🌨️',
      326: '❄️',
      329: '❄️',
      332: '❄️',
      335: '❄️',
      338: '❄️',
      350: '🌧️',
      353: '🌦️',
      356: '🌧️',
      359: '🌧️',
      362: '🌨️',
      365: '🌨️',
      368: '🌨️',
      371: '❄️',
      374: '🌧️',
      377: '🌧️',
      386: '⛈️',
      389: '⛈️',
      392: '⛈️',
      395: '⛈️'
    }

    return codeMap[code] || '🌤️'
  }

  static getWeatherSymbolByCondition(condition) {
    const conditionLower = condition.toLowerCase()
    
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return '☀️'
    if (conditionLower.includes('cloud')) return '☁️'
    if (conditionLower.includes('rain')) return '🌧️'
    if (conditionLower.includes('snow')) return '❄️'
    if (conditionLower.includes('thunder')) return '⛈️'
    if (conditionLower.includes('mist') || conditionLower.includes('fog')) return '🌫️'
    if (conditionLower.includes('wind')) return '💨'
    
    return '🌤️'
  }
}

export default WeatherService