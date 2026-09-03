export const environment = {
  production: false,
  // Stamped on every lead created from this landing page — see core/models/lead.model.ts's LeadSource.
  leadSource: 'v1' as const,
  apiUrl: 'https://Elev8 Club-new-backend.nstechs.net/api',
  prefix: 'Elev8 Club-local',
  cryptoKey: 'Elev8 ClubSuperSecretKey123',
  // ng serve serves .video-build/hls at this path (see angular.json development/local assets),
  // so dev needs no CDN and no CORS.
  video: {
    challengeIntroHls: "/videos/challenge-intro/master.m3u8",
    challengeIntroPoster: "/videos/challenge-intro/poster.jpg"
  },
  firebase: {
    apiKey: 'AIzaSyDbwiL9Ia_imWqEufvi2g9DRd6T9rcr-zI',
    authDomain: 'elev8-club-3.firebaseapp.com',
    databaseURL: 'https://elev8-club-3-default-rtdb.firebaseio.com',
    projectId: 'elev8-club-3',
    storageBucket: 'elev8-club-3.firebasestorage.app',
    messagingSenderId: '631927284455',
    appId: '1:631927284455:web:4b46b999a88cc83f8eb842',
    measurementId: 'G-0ZGCDMTWWF'
  }
};
