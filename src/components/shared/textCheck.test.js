import { checkText } from './textCheck';

// Real report text must pass, even when short, in Filipino, with numbers or
// in capitals.
const ACCEPTED = [
  ['description', 'May sunog sa bahay ng kapitbahay namin, kailangan ng bumbero!'],
  ['description', 'Natangay ng baha ang motor namin sa Sampaguita St.'],
  ['description', 'Kakakain lang namin nang biglang lumindol.'],
  ['description', 'SUNOG!!! TULONG PO'],
  ['description', 'Fire'],
  ['description', 'Baha hanggang tuhod, 15 tao sa bahay, may 2 bata'],
  ['description', 'Ninakaw ang cellphone ko, 100000 ang halaga'],
  ['description', 'mrmng tao dto tlga, pls bilisan'],
  ['description', 'Tinawagan na namin ang BFP at PNP, may CCTV sa kanto.'],
  ['description', 'Help help help, the water is rising'],
  ['description', 'The suspect was shouting at the class'],
  ['description', 'Nag-aaway ang dalawang lasing sa kanto, may hawak na bote.'],
  ['description', 'Gagawin namin ang lahat, pero kailangan ng tulong.'],
  ['description', 'Potato vendor beside the shiitake stall'],
  ['description', 'Walang halaga ang nawala pero natakot ang dalaga'],
  ['description', 'Blk5Lot12 Sampaguita, sunog sa kusina'],
  ['description', 'Plate number ABC1234, kulay pula ang kotse'],
  ['short', 'Juan Dela Cruz'],
  ['short', 'Miko'],
  ['short', 'Blk 5 Lot 12'],
  ['short', 'Sampaguita St.'],
  ['short', 'Tapat ng 7-Eleven, blue gate'],
  ['number', '143'],
  ['number', 'Blk 5 Lot 12'],
];

// Spam, gibberish and offensive text must be stopped, also when disguised.
const REJECTED = [
  ['description', 'asdfghjkl', 'spam'],
  ['description', 'qwertyuiop', 'spam'],
  ['description', 'aaaaaaa', 'spam'],
  ['description', '123456789', 'spam'],
  ['description', 'hahahahaha', 'spam'],
  ['description', 'asdasdasd', 'spam'],
  ['description', 'sunog sunog sunog sunog', 'spam'],
  ['description', 'fjdkslaf gkhdjs', 'meaningless'],
  ['description', '97079y8y8hihhdjsjashjajahahsjsjah', 'meaningless'],
  ['description', 'hdjsjsjs', 'meaningless'],
  ['description', 'asdfasdf', 'meaningless'],
  ['description', 'a8s7d6f5g4h3', 'meaningless'],
  ['short', 'hdjsjsjsjs', 'meaningless'],
  ['description', '....', 'meaningless'],
  ['description', '12', 'meaningless'],
  ['description', 'Putangina ninyo', 'offensive'],
  ['description', 'tang ina naman', 'offensive'],
  ['description', 'GAGO ka ba', 'offensive'],
  ['description', 'mga bobong tao', 'offensive'],
  ['description', 'p u t a', 'offensive'],
  ['description', 'f*ck this', 'offensive'],
  ['description', 'sh1t', 'offensive'],
  ['description', 'fuuuuck', 'offensive'],
  ['description', 'pakyu', 'offensive'],
  ['description', 'what the fucking hell', 'offensive'],
  ['description', 'ulol', 'offensive'],
  ['short', 'Tarantado', 'offensive'],
  ['short', 'zxcvbnm', 'spam'],
  ['number', 'Gago', 'offensive'],
];

test.each(ACCEPTED)('accepted (%s): %s', (kind, text) => {
  expect(checkText(text, kind)).toBeNull();
});

test.each(REJECTED)('rejected (%s): %s → %s', (kind, text, reason) => {
  expect(checkText(text, kind)).toBe(reason);
});

test('an empty text is left to the required-field checks', () => {
  expect(checkText('', 'description')).toBeNull();
  expect(checkText('   ', 'short')).toBeNull();
});
