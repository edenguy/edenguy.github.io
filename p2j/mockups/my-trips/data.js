/* Invented trips for the mock. "today" is fixed at 2026-11-17 so the labels do not drift.
   ago = hours since last opened; title is shown as written (a trip has one title, in its own language). */
window.TODAY = new Date('2026-11-17T12:00:00');
window.TRIPS = [
 { id: 'lisbon-alentejo', title: 'Lisbon and the Alentejo', role: 'owner', lang: 'en', from: '2027-03-03', to: '2027-03-10', ago: 2 },
 { id: 'yerushalayim-hanuka', title: 'ירושלים בחנוכה', role: 'owner', lang: 'he', from: '2026-12-04', to: '2026-12-11', ago: 30, stale: true },
 { id: 'hungary-nov', title: 'Eger and Budapest, November', role: 'member', lang: 'he', from: '2026-11-12', to: '2026-11-16', ago: 24 * 3 },
 { id: 'kyoto-quiet', title: 'Kyoto in the quiet season: temples, tea houses and day trips along the old Nakasendo road to Nara', role: 'viewer', lang: 'en', from: '2027-01-18', to: '2027-01-29', ago: 24 * 9 },
 { id: 'dolomites-weekend', title: 'Dolomites long weekend', role: 'owner', lang: 'de', from: '2026-09-18', to: '2026-09-21', ago: 24 * 41 },
 { id: 'iceland-ring', title: 'Iceland ring road', role: 'member', lang: 'en', from: '2026-07-02', to: '2026-07-14', ago: 24 * 70 },
 { id: 'oaxaca-day-of-dead', title: 'Oaxaca for the Day of the Dead', role: 'viewer', lang: 'en', from: '2026-10-30', to: '2026-11-04', ago: 24 * 14 },
 { id: 'berlin-family', title: 'Berlin with the cousins', role: 'member', lang: 'de', from: '2026-05-01', to: '2026-05-05', ago: 24 * 190 }
];
