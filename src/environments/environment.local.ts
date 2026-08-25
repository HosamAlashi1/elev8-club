export const environment = {
  production: false,
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
    apiKey: 'AIzaSyAssOG7bw4BGipTDITaOdbdsRfwctu5MaY',
    authDomain: 'elev8-club.firebaseapp.com',
    databaseURL: 'https://elev8-club-default-rtdb.firebaseio.com',
    projectId: 'elev8-club',
    storageBucket: 'elev8-club.firebasestorage.app',
    messagingSenderId: '642324793888',
    appId: '1:642324793888:web:e2e27e218dd60c7d5aca45',
    measurementId: 'G-H4HYFB0DNV'
  }
};
