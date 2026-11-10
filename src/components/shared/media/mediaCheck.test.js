import { checkMediaFile } from './mediaCheck';

// Builds a tiny JPEG with an EXIF block (DateTimeOriginal, optional Software
// and GPS), little-endian TIFF, like a phone camera writes.
const exifJpeg = ({ taken, software, lat, lng }) => {
  const ascii = (str) => Buffer.from(`${str}\0`, 'latin1');
  const u32 = (v) => { const b = Buffer.alloc(4); b.writeUInt32LE(v); return b; };
  const rational = (pairs) => { const b = Buffer.alloc(8 * pairs.length); pairs.forEach(([n, d], i) => { b.writeUInt32LE(n, i * 8); b.writeUInt32LE(d, i * 8 + 4); }); return b; };
  const dms = (v) => { const a = Math.abs(v); const d = Math.floor(a); const mf = (a - d) * 60; const m = Math.floor(mf); return rational([[d, 1], [m, 1], [Math.round((mf - m) * 60000), 1000]]); };
  const ifd = (list, start) => {
    let dataOff = start + 2 + list.length * 12 + 4;
    const head = Buffer.alloc(2 + list.length * 12 + 4);
    const datas = [];
    head.writeUInt16LE(list.length, 0);
    list.forEach(([tag, type, count, val], i) => {
      const o = 2 + i * 12;
      head.writeUInt16LE(tag, o); head.writeUInt16LE(type, o + 2); head.writeUInt32LE(count, o + 4);
      if (val.length <= 4) val.copy(head, o + 8);
      else { head.writeUInt32LE(dataOff, o + 8); datas.push(val); dataOff += val.length; if (val.length % 2) { datas.push(Buffer.alloc(1)); dataOff += 1; } }
    });
    return Buffer.concat([head, ...datas]);
  };
  const hasGps = lat != null;
  const ifd0List = (exifOff, gpsOff) => [
    ...(software ? [[0x0131, 2, software.length + 1, ascii(software)]] : []),
    [0x8769, 4, 1, u32(exifOff)],
    ...(hasGps ? [[0x8825, 4, 1, u32(gpsOff)]] : [])
  ];
  const exifList = [[0x9003, 2, 20, ascii(taken)]];
  const gpsList = hasGps ? [[1, 2, 2, ascii(lat >= 0 ? 'N' : 'S')], [2, 5, 3, dms(lat)], [3, 2, 2, ascii(lng >= 0 ? 'E' : 'W')], [4, 5, 3, dms(lng)]] : [];
  const exifOff = 8 + ifd(ifd0List(0, 0), 8).length;
  const gpsOff = exifOff + ifd(exifList, exifOff).length;
  const tiff = Buffer.concat([Buffer.from([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0]), ifd(ifd0List(exifOff, gpsOff), 8), ifd(exifList, exifOff), hasGps ? ifd(gpsList, gpsOff) : Buffer.alloc(0)]);
  const body = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1, (body.length + 2) >> 8, (body.length + 2) & 0xff]), body]);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app1, Buffer.from([0xff, 0xd9])]);
};

// An MP4 with a creation time (and optional text in its user data).
const mp4 = (date, extra = '') => {
  const box = (type, b) => { const h = Buffer.alloc(8); h.writeUInt32BE(8 + b.length); h.write(type, 4, 'latin1'); return Buffer.concat([h, b]); };
  const mvhd = Buffer.alloc(100);
  mvhd.writeUInt32BE(Math.floor(date.getTime() / 1000) + 2082844800, 4);
  return Buffer.concat([box('ftyp', Buffer.from('isom0000')), box('moov', Buffer.concat([box('mvhd', mvhd), box('udta', Buffer.from(extra, 'latin1'))]))]);
};

const file = (buf, name, type) => new File([new Uint8Array(buf)], name, { type });
const NOW = new Date('2026-11-10T10:00:00+08:00');

describe('photos', () => {
  test('taken today: accepted', async () => {
    const r = await checkMediaFile(file(exifJpeg({ taken: '2026:11:10 08:15:00', lat: 14.3203, lng: 120.9648 }), 'a.jpg', 'image/jpeg'), false, NOW);
    expect(r).toMatchObject({ ok: true, dayOld: false });
    expect(r.takenAt.toISOString()).toBe('2026-11-10T00:15:00.000Z');
  });
  test('taken yesterday: accepted as a day old', async () => {
    const r = await checkMediaFile(file(exifJpeg({ taken: '2026:11:09 21:00:00' }), 'a.jpg', 'image/jpeg'), false, NOW);
    expect(r).toMatchObject({ ok: true, dayOld: true });
  });
  test.each([
    ['older than yesterday', { taken: '2026:11:03 09:00:00' }, 'tooOld'],
    ['dated in the future', { taken: '2026:11:12 09:00:00' }, 'future'],
    ['saved by an editing app', { taken: '2026:11:10 08:00:00', software: 'Snapseed 2.0' }, 'edited']
  ])('%s: refused', async (_, opts, reason) => {
    expect(await checkMediaFile(file(exifJpeg(opts), 'a.jpg', 'image/jpeg'), false, NOW)).toEqual({ ok: false, reason });
  });
  test("a phone's own software name isn't an edit", async () => {
    const r = await checkMediaFile(file(exifJpeg({ taken: '2026:11:10 08:00:00', software: 'S918BXXU3BWK3' }), 'a.jpg', 'image/jpeg'), false, NOW);
    expect(r.ok).toBe(true);
  });
  test('no date in its details (e.g. a screenshot): refused', async () => {
    expect(await checkMediaFile(file(Buffer.from([0xff, 0xd8, 0xff, 0xd9]), 'a.jpg', 'image/jpeg'), false, NOW)).toEqual({ ok: false, reason: 'noDate' });
  });
});

describe('videos', () => {
  test('recorded today: accepted', async () => {
    expect(await checkMediaFile(file(mp4(new Date('2026-11-10T01:00:00Z')), 'v.mp4', 'video/mp4'), true, NOW)).toMatchObject({ ok: true, dayOld: false });
  });
  test('recorded yesterday: a day old', async () => {
    expect(await checkMediaFile(file(mp4(new Date('2026-11-09T05:00:00Z')), 'v.mp4', 'video/mp4'), true, NOW)).toMatchObject({ ok: true, dayOld: true });
  });
  test('exported by CapCut: refused as edited', async () => {
    expect(await checkMediaFile(file(mp4(new Date('2026-11-10T01:00:00Z'), 'CapCut'), 'v.mp4', 'video/mp4'), true, NOW)).toEqual({ ok: false, reason: 'edited' });
  });
  test('not an MP4/MOV (no date): refused', async () => {
    expect(await checkMediaFile(file(Buffer.from('webm'), 'v.webm', 'video/webm'), true, NOW)).toEqual({ ok: false, reason: 'noDate' });
  });
});
