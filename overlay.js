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
          "91c37706fc9be3efe7a4fa7bc688b8f6",  // RC1
          "",  // RC2
          "b52fd826136c54491c4de1b3ba9de8a2",  // RC3
          "0a507da3d92a03bdc1458bc3b7ed8557",  // RC4
          "f4560d2ca03252942f09b263b2df92b2",  // RC5
          "8200f2b8238a86c3da092dc3565af08e",  // LN1
          "9464a39e475b485e1d1514358bab6569",  // LN2
          "c5f39a4ac66fe8e001521ec8831b86c2",  // LN3
          "ee750473a7fdf872f0bf49d81aca1d3a",  // HB1
          "8becf90da75f97e00ea14e46d7ca2e18",  // HB2
          "3a2433f98638237e152aa112b8f5cbdd",  // HB3
          "1dff8461927b75b3232a60f6a795f6a2",  // EX1
          "b19122f90239b91002abf5f4911b60a6",  // EX2
          "2885a8f65232a9ff950773f5cb676722",  // EX3
          "",  // TB
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
