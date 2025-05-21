import Alpine from 'alpinejs';
import WebSocketManager from './socket.js';

const socket = new WebSocketManager("localhost:24050");
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
  imageUrl: "",

  init() {
    socket.api_v2(({ state, settings, session, profile, performance, resultsScreen, play, beatmap, directPath, folders }) => {
      const beatmapArtist = beatmap.artist;
      const beatmapTitle = beatmap.title;
      const beatmapMusicMetadata = `${beatmapArtist} - ${beatmapTitle}`;

      const beatmapMapper = beatmap.mapper;
      const beatmapDifficulty = beatmap.version;

      // If vscode or any IDE complains about od/hp does not exist on type, do NOT change it to OD or HP.
      // The JSDoc on socket.js is not correct and may need to be edited.
      const od = beatmap.stats.od.converted;
      const hp = beatmap.stats.hp.converted;

      const stars = beatmap.stats.stars.total;

      const timeFirstObject = beatmap.time.firstObject;
      const timeLastObject = beatmap.time.lastObject;
      const drainTime = beatmap.time.lastObject - beatmap.time.firstObject;
      const beatmapLength = this.secondsToHumanReadable(drainTime);

      const bpmCommon = beatmap.stats.bpm.common;
      const bpmMin = beatmap.stats.bpm.min;
      const bpmMax = beatmap.stats.bpm.max;
      let bpmFormatted = bpmCommon;

      if (bpmMin != bpmMax) {
        bpmFormatted = `${bpmMin}-${bpmMax} (${bpmCommon})`;
      }

      const backgroundPath = directPath.beatmapBackground.replace(folders.songs, '').replaceAll('\\', '/');
      // http://127.0.0.1:24050/files/beatmap/723624 The Flashbulb - Back of the Yards\back.jpg
      const filePath = "http://127.0.0.1:24050/files/beatmap/" + backgroundPath;


      this.title = beatmapMusicMetadata;
      this.mapperName = beatmapMapper;
      this.difficultyName = beatmapDifficulty;
      this.odValue = od;
      this.hpValue = hp;
      this.stars = stars;
      this.beatmapLength = beatmapLength;
      this.bpm = bpmFormatted;
      this.imageUrl = filePath;
    });
  },

  secondsToHumanReadable(totalSeconds) {
    totalSeconds /= 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const paddedSeconds = String(seconds).padStart(2, '0');

    return `${minutes}:${paddedSeconds}`;
  }

}));
