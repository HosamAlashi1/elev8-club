export const environment = {
  production: true,
  apiUrl: 'https://Elev8 Clubeat-stage.nstechs.net/admin-api/v1',
  prefix: 'Elev8 Club-stage',
  cryptoKey: 'Elev8 ClubSuperSecretKey123',
  // Hosted on Cloudflare Pages (free, unlimited bandwidth). Deploy with: npm run video:deploy
  video: {
    challengeIntroHls: "https://elev8-video.pages.dev/challenge-intro/master.m3u8",
    challengeIntroPoster: "https://elev8-video.pages.dev/challenge-intro/poster.jpg"
  },
  firebase: {
    apiKey: "AIzaSyDbwiL9Ia_imWqEufvi2g9DRd6T9rcr-zI",
    authDomain: "elev8-club-3.firebaseapp.com",
    databaseURL: "https://elev8-club-3-default-rtdb.firebaseio.com",
    projectId: "elev8-club-3",
    storageBucket: "elev8-club-3.firebasestorage.app",
    messagingSenderId: "631927284455",
    appId: "1:631927284455:web:4b46b999a88cc83f8eb842",
    measurementId: "G-0ZGCDMTWWF"
  }
};
