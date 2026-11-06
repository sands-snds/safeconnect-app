import { fromAdminReport, fromMyReport, isOpenStatus, timeAgo, MAP_TYPES } from './mapReports';

test('emergency reports get their own type by emergency', () => {
  const base = { id: 4, reference: 'SC-2026-000004', status: 'Received', latitude: '14.3198', longitude: '120.9644', rawDate: '2026-11-05T02:00:00Z', location: 'Blk 1' };
  expect(fromAdminReport('emergency', { ...base, emergency: 'Fire Emergency' }).type).toBe('fire');
  expect(fromAdminReport('emergency', { ...base, emergency: 'Flood Emergency' }).type).toBe('flood');
  expect(fromAdminReport('emergency', { ...base, emergency: 'Earthquake' }).type).toBe('quake');
  expect(fromAdminReport('emergency', { ...base, emergency: 'Typhoon' }).type).toBe('typhoon');
  expect(fromAdminReport('emergency', { ...base, emergency: 'Landslide' }).type).toBe('emergency');
  const r = fromAdminReport('emergency', { ...base, emergency: 'Fire Emergency' });
  expect(r.key).toBe('emergency-4');
  expect(r.position).toEqual([14.3198, 120.9644]);
  expect(r.at).toBe(Date.parse('2026-11-05T02:00:00Z'));
});

test('assistance and petty crime; an anonymous reporter stays anonymous', () => {
  expect(fromAdminReport('assistance', { id: 1, assistanceType: 'Transport Vehicle', fullName: 'Ana' }).type).toBe('assist');
  const crime = fromAdminReport('pettyCrime', { id: 2, crimeType: 'Theft', reporter: 'Juan', isAnonymous: true });
  expect(crime.type).toBe('crime');
  expect(crime.who).toBe('Anonymous');
});

test('no pin means no position (nothing is guessed)', () => {
  expect(fromAdminReport('emergency', { id: 9, emergency: 'Fire Emergency', latitude: null, longitude: null }).position).toBeNull();
  expect(fromAdminReport('emergency', { id: 9, emergency: 'Fire Emergency', latitude: 'x', longitude: '1' }).position).toBeNull();
});

test("a resident's own report from My Reports", () => {
  const r = fromMyReport({ id: 3, type: 'Emergency', title: 'Earthquake', status: 'In Progress', latitude: 14.32, longitude: 120.965, date: '2026-11-05T02:00:00Z', report_reference: 'SC-2026-000003' });
  expect(r).toMatchObject({ key: 'emergency-3', kind: 'emergency', type: 'quake', reference: 'SC-2026-000003', reportType: 'Emergency' });
  expect(fromMyReport({ id: 5, type: 'Petty Crime', title: 'Theft' }).key).toBe('pettyCrime-5');
});

test('open means still blinking: Received and In Progress', () => {
  expect(isOpenStatus('Received')).toBe(true);
  expect(isOpenStatus('In Progress')).toBe(true);
  expect(isOpenStatus('Resolved')).toBe(false);
  expect(isOpenStatus('Dismissed')).toBe(false);
});

test('fire pulses fastest, then earthquake, then flood', () => {
  const s = (t) => parseFloat(MAP_TYPES[t].speed);
  expect(s('fire')).toBeLessThan(s('quake'));
  expect(s('quake')).toBeLessThan(s('flood'));
});

test('time ago', () => {
  const now = Date.parse('2026-11-05T10:00:00Z');
  expect(timeAgo(now - 4 * 60000, now)).toBe('4 min ago');
  expect(timeAgo(now - 3 * 3600000, now)).toBe('3 hr ago');
  expect(timeAgo(null, now)).toBe('');
});
