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
          "a4d67059934646715aa98ce23e8903ac",  // RC1
          "95cb6af1780058b1d139ad5bca856536",  // RC2
          "d8ebea1923d325542500e0a2819e106a",  // RC3
          "e885448aff4633abf95bc54c9f37f7ba",  // RC4
          "84bdbc7d7664ab5bfbcd7e21c5d2c717",  // RC5
          "d1e3d02528624042a28f3982a4826c5f",  // RC6
          "2fc20307305a61db8c2e78aad86971ac",  // RC7
          "91cab3bf6d2a720d5e293d53495e7bba",  // LN1
          "856ff5f401377680d7078a9610d2961c",  // LN2
          "89ca5909d096c0705dafc095b4cd497d",  // LN3
          "c567d0d63d1aaca491cdbd93083d4f0b",  // LN4
          "867f308131433999e2568970ce93e943",  // LN5
          "",  // HB1
          "",  // HB2
          "fd4aa1158df308177a5ccf277b06e001",  // HB3
          "4e0594bd45f8c3dea2bc4f05d3ffdfc6",  // TB
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
