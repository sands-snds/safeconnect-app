// Open-Meteo weather codes -> a translation key (weather.codes.<key>) and an icon.
export const describeWeatherCode = (code) => {
  if ([0].includes(code)) return { key: 'clear', label: 'Clear sky', icon: 'bi-sun-fill' };
  if ([1, 2, 3].includes(code)) return { key: 'partlyCloudy', label: 'Partly cloudy', icon: 'bi-cloud-sun-fill' };
  if ([45, 48].includes(code)) return { key: 'foggy', label: 'Foggy', icon: 'bi-cloud-fog2-fill' };
  if ([51, 53, 55, 56, 57].includes(code)) return { key: 'drizzle', label: 'Drizzle', icon: 'bi-cloud-drizzle-fill' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { key: 'rain', label: 'Rain', icon: 'bi-cloud-rain-fill' };
  if ([95, 96, 99].includes(code)) return { key: 'thunderstorm', label: 'Thunderstorm', icon: 'bi-cloud-lightning-rain-fill' };
  return { key: 'update', label: 'Weather update', icon: 'bi-cloud-fill' };
};

// Lets other parts of the resident page open the News or My Reports view
// (ResidentNavbar owns them): openResidentView('news' | 'reports').
export const OPEN_RESIDENT_VIEW_EVENT = 'safeconnect:open-resident-view';
export const openResidentView = (view) => {
  window.dispatchEvent(new CustomEvent(OPEN_RESIDENT_VIEW_EVENT, { detail: view }));
};

// Opens the floating emergency call panel (EmergencyReportSection).
export const OPEN_CALL_PANEL_EVENT = 'safeconnect:open-call-panel';
export const openCallPanel = () => window.dispatchEvent(new Event(OPEN_CALL_PANEL_EVENT));
