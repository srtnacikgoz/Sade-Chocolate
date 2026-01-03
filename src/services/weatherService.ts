/**
 * Weather Service - OpenWeatherMap API Entegrasyonu
 *
 * Çikolata lojistiği için hava durumu kontrolü:
 * - Varış noktasının sıcaklığını sorgular
 * - Heat Hold kararı için veri sağlar
 * - Soğutucu paketi ihtiyacını hesaplar
 *
 * API: OpenWeatherMap (ücretsiz tier - 1000 call/gün)
 * Docs: https://openweathermap.org/api
 */

import { isSummerSeason } from '../utils/shippingUtils';

// API Configuration
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Sıcaklık eşikleri
export const TEMPERATURE_THRESHOLDS = {
  HEAT_HOLD: 30,           // Bu sıcaklığın üzerinde sipariş bekletilir
  COLD_PACK_REQUIRED: 20,  // Bu sıcaklığın üzerinde soğutucu gerekir
  SAFE_MAX: 25,            // Heat Hold'dan çıkış için güvenli sıcaklık
  IDEAL_MIN: 12,           // Çikolata için ideal minimum
  IDEAL_MAX: 20,           // Çikolata için ideal maksimum
};

// Soğutucu hesaplama kuralları (araştırma belgesinden)
export const COLD_PACK_RULES = {
  RATIO_NORMAL: 0.5,    // Normal: 1kg çikolata = 0.5kg jel akü
  RATIO_SUMMER: 1,      // Yaz: 2kg çikolata = 1kg jel akü (2x)
  MIN_QUANTITY: 0.5,    // Minimum jel akü miktarı (kg)
  MAX_QUANTITY: 3,      // Maksimum jel akü miktarı (kg)
};

// Types
export interface WeatherData {
  city: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  conditionIcon: string;
  windSpeed: number;
  timestamp: string;
}

export interface ForecastDay {
  date: string;
  tempMin: number;
  tempMax: number;
  condition: string;
  conditionIcon: string;
}

export interface WeatherCheckResult {
  weather: WeatherData;
  requiresHeatHold: boolean;
  requiresColdPack: boolean;
  heatHoldReason?: string;
  recommendation: string;
}

export interface ColdPackRecommendation {
  required: boolean;
  quantity: number;
  reason: string;
  isSummerProtocol: boolean;
  estimatedCost?: number;
}

// Türkiye şehirleri için koordinat cache (API call azaltmak için)
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  'istanbul': { lat: 41.0082, lon: 28.9784 },
  'ankara': { lat: 39.9334, lon: 32.8597 },
  'izmir': { lat: 38.4192, lon: 27.1287 },
  'antalya': { lat: 36.8969, lon: 30.7133 },
  'bursa': { lat: 40.1885, lon: 29.0610 },
  'adana': { lat: 37.0000, lon: 35.3213 },
  'konya': { lat: 37.8746, lon: 32.4932 },
  'gaziantep': { lat: 37.0662, lon: 37.3833 },
  'mersin': { lat: 36.8121, lon: 34.6415 },
  'diyarbakır': { lat: 37.9144, lon: 40.2306 },
  'kayseri': { lat: 38.7312, lon: 35.4787 },
  'eskişehir': { lat: 39.7767, lon: 30.5206 },
  'samsun': { lat: 41.2867, lon: 36.33 },
  'denizli': { lat: 37.7765, lon: 29.0864 },
  'şanlıurfa': { lat: 37.1591, lon: 38.7969 },
  'malatya': { lat: 38.3552, lon: 38.3095 },
  'trabzon': { lat: 41.0027, lon: 39.7168 },
  'erzurum': { lat: 39.9055, lon: 41.2658 },
  'van': { lat: 38.5012, lon: 43.3730 },
  'batman': { lat: 37.8812, lon: 41.1351 },
};

/**
 * Şehir adını normalize eder (Türkçe karakterler ve küçük harf)
 */
function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .replace('ı', 'i')
    .replace('ğ', 'g')
    .replace('ü', 'u')
    .replace('ş', 's')
    .replace('ö', 'o')
    .replace('ç', 'c')
    .trim();
}

/**
 * OpenWeatherMap API'den şehir hava durumunu getirir
 */
export async function getWeatherByCity(city: string): Promise<WeatherData> {
  if (!OPENWEATHER_API_KEY) {
    console.warn('OpenWeatherMap API key not configured, using mock data');
    return getMockWeatherData(city);
  }

  try {
    const normalizedCity = normalizeCity(city);
    const coords = CITY_COORDS[normalizedCity];

    let url: string;
    if (coords) {
      // Koordinat varsa daha hassas sonuç
      url = `${OPENWEATHER_BASE_URL}/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=tr`;
    } else {
      // Koordinat yoksa şehir adı ile ara
      url = `${OPENWEATHER_BASE_URL}/weather?q=${encodeURIComponent(city)},TR&appid=${OPENWEATHER_API_KEY}&units=metric&lang=tr`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      city: data.name,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      condition: data.weather[0].description,
      conditionIcon: data.weather[0].icon,
      windSpeed: data.wind.speed,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // API hatası - sessizce mock data kullan
    if (import.meta.env.DEV) {
      console.warn('Weather API unavailable, using mock data');
    }
    return getMockWeatherData(city);
  }
}

/**
 * 3 günlük hava tahmini getirir
 */
export async function get3DayForecast(city: string): Promise<ForecastDay[]> {
  if (!OPENWEATHER_API_KEY) {
    return getMockForecast();
  }

  try {
    const normalizedCity = normalizeCity(city);
    const coords = CITY_COORDS[normalizedCity];

    let url: string;
    if (coords) {
      url = `${OPENWEATHER_BASE_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=tr&cnt=24`;
    } else {
      url = `${OPENWEATHER_BASE_URL}/forecast?q=${encodeURIComponent(city)},TR&appid=${OPENWEATHER_API_KEY}&units=metric&lang=tr&cnt=24`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Forecast API error: ${response.status}`);
    }

    const data = await response.json();

    // Günlük grupla
    const dailyMap = new Map<string, { temps: number[]; conditions: string[]; icons: string[] }>();

    for (const item of data.list) {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { temps: [], conditions: [], icons: [] });
      }
      const day = dailyMap.get(date)!;
      day.temps.push(item.main.temp);
      day.conditions.push(item.weather[0].description);
      day.icons.push(item.weather[0].icon);
    }

    const forecast: ForecastDay[] = [];
    for (const [date, day] of dailyMap) {
      if (forecast.length >= 3) break;
      forecast.push({
        date,
        tempMin: Math.round(Math.min(...day.temps)),
        tempMax: Math.round(Math.max(...day.temps)),
        condition: day.conditions[Math.floor(day.conditions.length / 2)],
        conditionIcon: day.icons[Math.floor(day.icons.length / 2)],
      });
    }

    return forecast;
  } catch (error) {
    console.error('Forecast API error:', error);
    return getMockForecast();
  }
}

/**
 * Hava durumu kontrolü yapar ve Heat Hold/Cold Pack kararı verir
 */
export async function checkWeatherForShipping(city: string): Promise<WeatherCheckResult> {
  const weather = await getWeatherByCity(city);

  const requiresHeatHold = weather.temperature >= TEMPERATURE_THRESHOLDS.HEAT_HOLD;
  const requiresColdPack = weather.temperature >= TEMPERATURE_THRESHOLDS.COLD_PACK_REQUIRED;

  let heatHoldReason: string | undefined;
  let recommendation: string;

  if (requiresHeatHold) {
    heatHoldReason = `${city} için hava sıcaklığı ${weather.temperature}°C - Çikolata erime riski nedeniyle gönderim bekletiliyor`;
    recommendation = `Sıcaklık ${TEMPERATURE_THRESHOLDS.SAFE_MAX}°C altına düşene kadar bekleyin`;
  } else if (requiresColdPack) {
    recommendation = `Soğutucu paket gerekli - Sıcaklık: ${weather.temperature}°C`;
  } else {
    recommendation = `Gönderim için uygun - Sıcaklık: ${weather.temperature}°C`;
  }

  return {
    weather,
    requiresHeatHold,
    requiresColdPack,
    heatHoldReason,
    recommendation,
  };
}

/**
 * Sipariş ağırlığına göre soğutucu paketi ihtiyacını hesaplar
 */
export function calculateColdPackNeeds(
  temperature: number,
  orderWeightKg: number,
  checkDate: Date = new Date()
): ColdPackRecommendation {
  const isSummer = isSummerSeason(checkDate);
  const required = temperature >= TEMPERATURE_THRESHOLDS.COLD_PACK_REQUIRED;

  if (!required) {
    return {
      required: false,
      quantity: 0,
      reason: `Sıcaklık ${temperature}°C - Soğutucu gerekmiyor`,
      isSummerProtocol: false,
    };
  }

  // Araştırma belgesine göre: Yaz = 2kg çikolata / 1kg jel akü
  const ratio = isSummer ? COLD_PACK_RULES.RATIO_SUMMER : COLD_PACK_RULES.RATIO_NORMAL;
  let quantity = orderWeightKg * ratio;

  // Min/max sınırları uygula
  quantity = Math.max(COLD_PACK_RULES.MIN_QUANTITY, quantity);
  quantity = Math.min(COLD_PACK_RULES.MAX_QUANTITY, quantity);
  quantity = Math.round(quantity * 10) / 10; // 0.1kg hassasiyet

  let reason = '';
  if (isSummer) {
    reason = `Yaz protokolü aktif - ${orderWeightKg}kg sipariş için ${quantity}kg jel akü`;
  } else {
    reason = `Standart soğutma - ${orderWeightKg}kg sipariş için ${quantity}kg jel akü`;
  }

  return {
    required: true,
    quantity,
    reason,
    isSummerProtocol: isSummer,
    estimatedCost: quantity * 15, // Tahmini maliyet (₺15/kg)
  };
}

/**
 * Heat Hold durumundan çıkış için sıcaklık kontrolü
 */
export async function checkHeatHoldRelease(city: string): Promise<{
  canRelease: boolean;
  currentTemp: number;
  message: string;
}> {
  const weather = await getWeatherByCity(city);

  const canRelease = weather.temperature < TEMPERATURE_THRESHOLDS.SAFE_MAX;

  return {
    canRelease,
    currentTemp: weather.temperature,
    message: canRelease
      ? `Sıcaklık ${weather.temperature}°C - Gönderim için uygun`
      : `Sıcaklık hala ${weather.temperature}°C - Beklemeye devam`,
  };
}

// --- Mock Data (API key yoksa veya hata durumunda) ---

function getMockWeatherData(city: string): WeatherData {
  // Rastgele ama tutarlı sıcaklık üret
  const baseTemp = 22 + Math.sin(city.length) * 10;
  const temp = Math.round(baseTemp);

  return {
    city: city,
    temperature: temp,
    feelsLike: temp + 2,
    humidity: 65,
    condition: temp > 25 ? 'Güneşli' : 'Parçalı bulutlu',
    conditionIcon: temp > 25 ? '01d' : '02d',
    windSpeed: 3.5,
    timestamp: new Date().toISOString(),
  };
}

function getMockForecast(): ForecastDay[] {
  const today = new Date();
  return [1, 2, 3].map((offset) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    return {
      date: date.toISOString().split('T')[0],
      tempMin: 18 + offset,
      tempMax: 26 + offset,
      condition: 'Parçalı bulutlu',
      conditionIcon: '02d',
    };
  });
}

/**
 * API key yapılandırılmış mı kontrol eder
 */
export function isWeatherApiConfigured(): boolean {
  return Boolean(OPENWEATHER_API_KEY);
}
