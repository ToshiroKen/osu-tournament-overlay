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
          "13f2bb6d091ec44267fdd849daa58fe7",  // RC1
          "f3ac80fb5f7f06b742ba2c2d368434b1",  // RC2
          "81ad62dc10ba2bbbc89aa2e3abeec3f8",  // RC3
          "6c2f984bf3661a4b26bbc4d71c015357",  // RC4
          "cf7faed09491adca31b4626cf0681b89",  // RC5
          "f97f7d10fc41a32025b17a112249e4aa",  // RC6
          "",  // RC7
          "1f334950c602687a75b46c161252a61e",  // LN1
          "46dafd6f14dd17f3b9b6a636becf9823",  // LN2
          "e0915840dcaf00ab1422a9ff7b6c0eb6",  // LN3
          "1ed3faedb48b3a16ea07dd18b8b4d22c",  // LN4
          "ec39be629a898e72b6ecab795c8294d5",  // LN5
          "56e6e1173529e9bca71f9fa42ef51330",  // HB1
          "78385f1a8a30e6c0682df0c3b1d955c0",  // HB2
          "d2b59af3998c0f7ecaf6edbc6e54ece4",  // HB3
          "69d04abfa64959f82a3504af2691d727",  // EX1
          "7bbc444e6ac5fdbfc21b1ef5a99d77c0",  // EX2
          "98c59c189d82116ece8e763d4c5a1f42",  // EX3
          "198d792b937ba99ab2449a2618e94737",  // TB
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
