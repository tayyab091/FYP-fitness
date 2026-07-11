/**
 * Worldwide Support Utilities
 * Currency conversion, timezone handling, and localization
 */

// Currency utilities
export const CURRENCIES: Record<string, { code: string; symbol: string; name: string }> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
};

// Default exchange rates (in production, fetch from API)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 149.5,
  INR: 83.2,
  BRL: 4.97,
};

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const currencyInfo = CURRENCIES[currency] || CURRENCIES.USD;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
  const toRate = EXCHANGE_RATES[toCurrency] || 1;
  
  return (amount / fromRate) * toRate;
}

export function getCurrencyByCountry(country: string): string {
  const countryToCurrency: Record<string, string> = {
    'USA': 'USD',
    'United Kingdom': 'GBP',
    'Canada': 'CAD',
    'Australia': 'AUD',
    'Japan': 'JPY',
    'India': 'INR',
    'Brazil': 'BRL',
    'Germany': 'EUR',
    'France': 'EUR',
    'Spain': 'EUR',
    'Italy': 'EUR',
  };
  return countryToCurrency[country] || 'USD';
}

// Timezone utilities
export const TIMEZONES = [
  { value: 'UTC-12:00', label: '(UTC-12:00) International Date Line West' },
  { value: 'UTC-11:00', label: '(UTC-11:00) Samoa' },
  { value: 'UTC-10:00', label: '(UTC-10:00) Hawaii' },
  { value: 'UTC-09:00', label: '(UTC-09:00) Alaska' },
  { value: 'UTC-08:00', label: '(UTC-08:00) Pacific Time' },
  { value: 'UTC-07:00', label: '(UTC-07:00) Mountain Time' },
  { value: 'UTC-06:00', label: '(UTC-06:00) Central Time' },
  { value: 'UTC-05:00', label: '(UTC-05:00) Eastern Time' },
  { value: 'UTC-04:00', label: '(UTC-04:00) Atlantic Time' },
  { value: 'UTC-03:00', label: '(UTC-03:00) Brazil, Buenos Aires' },
  { value: 'UTC-02:00', label: '(UTC-02:00) Mid-Atlantic' },
  { value: 'UTC-01:00', label: '(UTC-01:00) Azores, Cape Verde' },
  { value: 'UTC+00:00', label: '(UTC+00:00) London, GMT' },
  { value: 'UTC+01:00', label: '(UTC+01:00) Central European Time' },
  { value: 'UTC+02:00', label: '(UTC+02:00) Eastern European Time' },
  { value: 'UTC+03:00', label: '(UTC+03:00) Moscow, Istanbul' },
  { value: 'UTC+04:00', label: '(UTC+04:00) Dubai, Baku' },
  { value: 'UTC+05:00', label: '(UTC+05:00) Pakistan' },
  { value: 'UTC+05:30', label: '(UTC+05:30) India' },
  { value: 'UTC+06:00', label: '(UTC+06:00) Bangladesh' },
  { value: 'UTC+07:00', label: '(UTC+07:00) Thailand, Vietnam' },
  { value: 'UTC+08:00', label: '(UTC+08:00) China, Singapore, Australia (West)' },
  { value: 'UTC+09:00', label: '(UTC+09:00) Japan, Korea' },
  { value: 'UTC+10:00', label: '(UTC+10:00) Australia (East)' },
  { value: 'UTC+11:00', label: '(UTC+11:00) Solomon Islands' },
  { value: 'UTC+12:00', label: '(UTC+12:00) Fiji, New Zealand' },
];

export function getTimezoneOffset(timezone: string): number {
  const match = timezone.match(/UTC([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;
  
  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2]);
  const minutes = parseInt(match[3]);
  
  return sign * (hours * 60 + minutes);
}

export function convertTime(date: Date, fromTimezone: string, toTimezone: string): Date {
  const fromOffset = getTimezoneOffset(fromTimezone);
  const toOffset = getTimezoneOffset(toTimezone);
  const diff = toOffset - fromOffset;
  
  return new Date(date.getTime() + diff * 60 * 1000);
}

export function formatTimeInTimezone(date: Date, timezone: string): string {
  const convertedDate = convertTime(new Date(), 'UTC+00:00', timezone);
  return convertedDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: getIANATimezone(timezone),
  });
}

// Convert UTC offset to IANA timezone (simplified mapping)
function getIANATimezone(utcOffset: string): string {
  const ianaMap: Record<string, string> = {
    'UTC-08:00': 'America/Los_Angeles',
    'UTC-07:00': 'America/Denver',
    'UTC-06:00': 'America/Chicago',
    'UTC-05:00': 'America/New_York',
    'UTC+00:00': 'UTC',
    'UTC+01:00': 'Europe/London',
    'UTC+02:00': 'Europe/Paris',
    'UTC+05:30': 'Asia/Kolkata',
    'UTC+08:00': 'Asia/Shanghai',
    'UTC+09:00': 'Asia/Tokyo',
    'UTC+10:00': 'Australia/Sydney',
  };
  return ianaMap[utcOffset] || 'UTC';
}

// Language utilities
export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

// Get language name by code
export function getLanguageName(code: string): string {
  const language = LANGUAGES.find((l) => l.code === code);
  return language?.name || code;
}

// Get language flag emoji by code
export function getLanguageFlag(code: string): string {
  const language = LANGUAGES.find((l) => l.code === code);
  return language?.flag || '🌍';
}
