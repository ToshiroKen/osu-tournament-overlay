import Alpine from 'alpinejs';
import WebSocketManager from './socket.js';

const socket = new WebSocketManager("localhost:24050");
const env = import.meta.env;
window.Alpine = Alpine;

Alpine.data('overlay', () => ({
  title: "No artist - No title",
  mapperName: "No mapper",
  difficultyName: "No difficulty selected",
  odValue: NaN,
  hpValue: NaN,
  stars: NaN,
  beatmapLength: "0:00",
  bpm: NaN,
  imageUrl: env.VITE_APP_BASE_URL + "/card@2x.jpg",

  init() {
    try {
      socket.api_v2(({ /* state, settings, session, profile, performance, resultsScreen, play, */ beatmap, directPath, folders }) => {
        const beatmapArtist = beatmap.artist;
        const beatmapTitle = beatmap.title;
        const beatmapMusicMetadata = `${beatmapArtist} - ${beatmapTitle}`;

        const beatmapMapper = beatmap.mapper;
        const beatmapDifficulty = beatmap.version;

        // If vscode or any IDE complains about od/hp does not exist on type, do NOT change it to OD or HP.
        // The JSDoc on socket.js is not correct and may need to be edited.
        const od = beatmap.stats.od.converted;
        const hp = beatmap.stats.hp.converted;
        const circles = beatmap.stats.objects.circles;
        const holds = beatmap.stats.objects.holds;

        const stars = beatmap.stats.stars.total;

        const timeFirstObject = beatmap.time.firstObject;
        const timeLastObject = beatmap.time.lastObject;
        const drainTime = beatmap.time.lastObject - beatmap.time.firstObject;
        const beatmapLength = this.secondsToHumanReadable(drainTime);

        const bpmCommon = beatmap.stats.bpm.common;
        const bpmMin = beatmap.stats.bpm.min;
        const bpmMax = beatmap.stats.bpm.max;
        let bpmFormatted = bpmCommon;

        //For highlighting the map type when certain conditions met
        //The checksum needs to be hardcoded in order for the sequence to work
        //Tried to optimize the code, better than the previous.
        //Instructions: change only the checksum values of the beatmap you want to highlight based on the map type
        //To check, here's the link: http://127.0.0.1:24050/json/v2  then search for "checksum"
        const hash = [
          "6e29b038e5fdf3aeab9bc04503ae6043",  // RC1
          "5cca66545edb33544c923b44a6ee110b",  // RC2
          "9f2499b0b079a22b74a82b3d4dc46f31",  // RC3
          "21a9c81f5756bd1e3dae3f1b04d8bde5",  // RC4
          "beccea02a208358cc2fb393111f4b57f",  // RC5
          "75a276894d1051594f07515f7ef33314",  // RC6
          "120a207de28649528a056ccbf47d41cd",  // LN1
          "36b0a1528a1eaafba20192eb78322a3e",  // LN2
          "25459aaa9451884dddf1586913e6d491",  // LN3
          "14e618330a7bb61db07e2296fa85c6a0",  // LN4
          "5f758de85da3063b7a89eb3dfacb0b70",  // HB1
          "3e500ba0b0b74806f2d48bc2c44b2141",  // HB2
          "f084945b3c29d15d67db034659822f40",  // HB3
          "f75b5b8ead0c606df8605a1d8659af29",  // EX1
          "9a3596056c169b228c8d35a50ba7af29",  // EX2
          "0ba463eabac7da8f282e6f8b97ce8c1e",  // EX3
          "e20b735bc4d789a8b4086b0613bdfe1c",  // TB
        ];
        //Clear the isActiveN properties
        for (let i = 0; i < hash.length; i++) {
          this[`isActive${i}`] = false;
        }
        //Condition if the checksum values matches to any hashMap values, then gets the index based on matched checksum
        const index = hash.indexOf(beatmap.checksum);
        if (index !== -1){
          this[`isActive${index}`] = true;
        }

        
        if (bpmMin != bpmMax) {
          bpmFormatted = `${bpmMin}-${bpmMax} (${bpmCommon})`;
        }

        // NOTE: For future reference: https://www.urlencoder.org/
        // TODO: Sanitize the image URL path
        // FIXME: Create better sanitizer for this that does not use external libraries
        const backgroundPath = directPath.beatmapBackground.replace(folders.songs, '').replaceAll('\\', '/').replaceAll('\'', '%27');
        // http://127.0.0.1:24050/files/beatmap/24840 David Wise - Krook's March/Castle_Crush.jpg
        // http://127.0.0.1:24050/files/beatmap/723624 The Flashbulb - Back of the Yards\back.jpg
        const filePath = "http://127.0.0.1:24050/files/beatmap/" + backgroundPath;


        this.title = beatmapMusicMetadata;
        this.mapperName = beatmapMapper;
        this.difficultyName = beatmapDifficulty;
        this.odValue = od;
        this.hpValue = hp;
        this.circlesValue = circles;
        this.holdsValue = holds;
        this.stars = stars;
        this.beatmapLength = beatmapLength;
        this.bpm = bpmFormatted;
        this.updateImage(filePath);
      });
    } catch (e) {
      console.error(e);
    }
  },

  secondsToHumanReadable(totalSeconds) {
    totalSeconds /= 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const paddedSeconds = String(seconds).padStart(2, '0');

    return `${minutes}:${paddedSeconds}`;
  },

  updateImage(filePath) {
    try {
      const img = new Image();
      img.src = filePath;

      img.onload = () => {
        this.imageUrl = filePath;
        this.loading = false;
      };

      img.onerror = () => {
        console.error('Image failed to load');
        this.loading = false;
      };
    } catch (e) {
      console.log(e);
    }
  },

}));
