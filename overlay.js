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
          "603e79969f5090669d1ca049af022ebd",  // RC1
          "f6f6b07b04e06a379fb6e2cad76d3418",  // RC2
          "c33f5548225928850d7d3d95350188f6",  // RC3
          "1f3804a57ffb67ff6a9fce4ebd547b76",  // RC4
          "a52fea7925ceaccdebf329308106bd30",  // RC5
          "18a0cf0e4b46f71a356dfe28281a5b52",  // RC6
          "c463da88ac9c0d249940ab99a30ac752",  // LN1
          "d7bfaed5f3324f87626cf15fb9b789ea",  // LN2
          "04955e8dc148690476cdc64c44724ccd",  // LN3
          "7681f439d61c970bd31c9b8b086e7d17",  // LN4
          "bafbcf8eee22770d98f3becfe972f279",  // HB1
          "fee1325fa2ce3c2b5a37a41665e925cb",  // HB2
          "4f4f98aa289a2fbe17a70f7d4e7aa2fa",  // HB3
          "d1f5dd398b46ceb55b3a70cb9d024981",  // TB
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
