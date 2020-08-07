import videojs from 'video.js';
// import VimeoPlayer from '@vimeo/player';
import VimeoPlayer from './vimeo/player';

let cssInjected = false;

// Since the iframe can't be touched using Vimeo's way of embedding,
// let's add a new styling rule to have the same style as `vjs-tech`
function injectCss() {
  if (cssInjected) {
    return;
  }
  cssInjected = true;
  const css = `
    .vjs-vimeo iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  `;
  const head = document.head || document.getElementsByTagName('head')[0];

  const style = document.createElement('style');

  style.type = 'text/css';

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  head.appendChild(style);
}

const Tech = videojs.getTech('Tech');

/**
 * Vimeo - Wrapper for Video Player API
 *
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready Ready callback function
 * @extends Tech
 * @class Vimeo
 */


const VM = {
  PlayerState: {
    ENDED: 'ended',
    PLAYING: 'play',
    PAUSED: 'pause',
  }
}


const Vimeo = videojs.extend(Tech, {
  // class Vimeo extends Tech {
  constructor(options, ready) {
    Tech.call(this, options, ready);
    // super(options, ready);
    injectCss();
    this.setPoster(options.poster);
    this.initVimeoPlayer();
  },


  /**
    id?: number;
    url?: string;
    autopause?: boolean;
    autoplay?: boolean;
    background?: boolean;
    byline?: boolean;
    color?: string;
    controls?: boolean;
    dnt?: boolean;
    height?: number;
    loop?: boolean;
    maxheight?: number;
    maxwidth?: number;
    muted?: boolean;
    playsinline?: boolean;
    portrait?: boolean;
    responsive?: boolean;
    speed?: boolean;
    quality?: VimeoVideoQuality;
    texttrack?: string;
    title?: boolean;
    transparent?: boolean;
    width?: number;
   */
  initVimeoPlayer() {
    const vimeoOptions = {
      url: this.options_.source.src,
      byline: false,
      portrait: false,
      title: false,
      // controls: 0,
    };

    // console.log('lll', this.options_);

    if (this.options_.autoplay) {
      vimeoOptions.autoplay = true;
    }
    if (this.options_.height) {
      vimeoOptions.height = this.options_.height;
    }
    if (this.options_.width) {
      vimeoOptions.width = this.options_.width;
    }
    if (this.options_.maxheight) {
      vimeoOptions.maxheight = this.options_.maxheight;
    }
    if (this.options_.maxwidth) {
      vimeoOptions.maxwidth = this.options_.maxwidth;
    }
    if (this.options_.loop) {
      vimeoOptions.loop = this.options_.loop;
    }
    if (this.options_.color) {
      vimeoOptions.color = this.options_.color.replace(/^#/, '');
    }

    console.log('this.options_.seekable', this.options_.seekable)
    this.seekable = this.options_.seekable != 0;
    this.supposedCurrentTime = 0;

    this._player = new VimeoPlayer(this.el(), vimeoOptions);
    this.initVimeoState();
    // this.initSeekedInterval();

    const self = this;

    // ['play', 'pause', 'ended', 'timeupdate', 'progress', 'seeked'].forEach(e => {


    ['play', 'pause', 'ended', 'timeupdate'].forEach(e => {
      this._player.on(e, () => {
        this.trigger(e);
      });
    });

    this._player.on('progress', (progress) => {
      if (this._vimeoState.progress.duration !== progress.duration) {
        this.trigger('durationchange');
      }
      // console.log('in PPPPROOOOG', progress)
      this._vimeoState.progress = progress;
    });

    this._player.on('seeked', (progress) => {

      this._player.getPlayed().then(played => {
        console.log('this.seeked', played, progress, this._vimeoState)
      });

      if (this._vimeoState.progress.duration !== progress.duration) {
        this.trigger('durationchange');
      }
      // this._vimeoState.progress = progress;
      this.onSeeked();
    });

    // Store the supposedCurrentTime in state
    this._player.on('timeupdate', (data) => {
      if (self.seekable) {
        return;
      }

      // this._player.getPlayed().then(played => {
      //   console.log('this.played', played)
      // });

      // console.log(this._player, data, this)

      this._player.getSeeking().then(seeking => {
        if (!seeking) {
          // console.log(Math.abs(data.seconds - this.supposedCurrentTime))
          // console.log('supposedCurrentTime = ', data.seconds)
          this.supposedCurrentTime = data.seconds;
        }
      });
    });

    // Seeking
    this._player.on('seeking', (progress) => {
      if (this._vimeoState.progress.duration !== progress.duration) {
        this.trigger('durationchange');
      }

      if (this.lastState === VM.PlayerState.PAUSED) {
        this.timeBeforeSeek = this.currentTime();
      }

      this.wasPausedBeforeSeek = this.paused();

      // console.log(this._vimeoState)

      // A seek event during pause does not return an event to trigger a seeked event,
      // so run an interval timer to look for the currentTime to change
      // console.log(
      //   'Seeking, checking previous state',
      //   this._vimeoState,
      //   progress.seconds,
      //   'Is paused?',
      //   this.paused(),
      //   this.lastState,
      //   this.supposedCurrentTime
      // );

      const {
        duration,
        seconds
      } = progress;

      this.trigger('timeupdate');
      this.trigger('seeking');
      this.isSeeking = true;

      if (this.paused() && this.supposedCurrentTime != seconds) {
        clearInterval(this.checkSeekedInPauseInterval);
        this.initSeekedInterval();
      }


      // Handle not seekable case
      // NB: Uncomment to see the played ranges
      // logPlayedRange();
      if (this.seekable) {
        return;
      }

      // Because in fullscreen it can still continue to the end sometimes
      // if (duration - seconds < 5) {
      //   this.pause();
      // }

      // accept rewind
      if (seconds < this.supposedCurrentTime) {
        return;
      }

      // accept seek to already played time
      const isPlayed = (time) => {
        return this._player.getPlayed().then((played) => {
          for (let i = 0; i < played.length; i++) {
            let start = 0, end = 0;
            start = played[i][0];
            end = played[i][1];
            if (end - start < 1) {
              continue;
            }
            if (time >= start && time <= end) {
              return true;
            }
          }
          return false;
        })
      }

      isPlayed(seconds).then((played) => {
        // console.log('played ?', played, seconds);
        if (played) {
          return
        }
        // guard agains infinite recursion:
        // user seeks, seeking is fired, currentTime is modified, seeking is fired, current time is modified, ...
        let delta = seconds - this.supposedCurrentTime;
        if (Math.abs(delta) > 0.01) {
          console.log("Seeking is disabled", seconds, this.supposedCurrentTime);
          this.setCurrentTime(this.supposedCurrentTime);
          // this._vimeoState.progress = progress;
        }
      });
    });

    // this._player.on('pause', () => (this._vimeoState.playing = false));
    // this._player.on('play', () => {
    //   this._vimeoState.playing = true;
    //   this._vimeoState.ended = false;
    // });
    // this._player.on('ended', () => {
    //   this._vimeoState.playing = false;
    //   this._vimeoState.ended = true;
    // });

    ['pause', 'play', 'ended'].forEach(state => {
      this._player.on(state, async (progress) => {
        // First, make sure it's working
        // console.log(state, this.lastState);
        if (this.lastState === undefined && state == VM.PlayerState.PLAYING && !this.seekable) {
          this._vimeoState.playing = true;
          this.setCurrentTime(0);
        }

        // Save the last state
        this.lastState = state;
        switch (state) {
          case VM.PlayerState.PAUSED: {
            this._vimeoState.playing = false
            return;
          }
          case VM.PlayerState.ENDED: {
            this._vimeoState.playing = false;
            this._vimeoState.ended = true;
            const playedWithOffset = (await this.getPlayed()) + 10;

            if (playedWithOffset < progress.duration) {
              return; // end event occured from seeking to it.
              // Don't consider the video as "completed and let it auto seek back
            }
            // console.log('can seek now');
            this.seekable = true;
            this.supposedCurrentTime = 0;
            return;
          }
          case VM.PlayerState.PLAYING: {
            this._vimeoState.playing = true;
            this._vimeoState.ended = false;
            return;
          }
        }
      });
    })



    this._player.on('volumechange', (v) => (this._vimeoState.volume = v));
    this._player.on('error', e => this.trigger('error', e));

    this.triggerReady();
  },


  async getPlayed() {
    const played = await this._player.getPlayed();
    let total = 0;
    for (let i = 0; i < played.length; i++) {
      total += played.end(i) - played.start(i);
    }
    return total;
  },

  isPlayed(time) {
    return this._player.getPlayed().then((played) => {
      for (let i = 0; i < played.length; i++) {
        let start = 0, end = 0;
        start = played[i][0];
        end = played[i][1];
        if (end - start < 1) {
          continue;
        }
        if (time >= start && time <= end) {
          return true;
        }
      }
      return false;
    })
  },

  initSeekedInterval() {
    this.checkSeekedInPauseInterval = setInterval(async () => {
      if (this.lastState !== VM.PlayerState.PAUSED || !this.isSeeking) {
        // If something changed while we were waiting for the currentTime to change,
        //  clear the interval timer
        console.log('clearing interval')
        clearInterval(this.checkSeekedInPauseInterval);
      } else {
        const currentTime = await this._player.getCurrentTime();
        console.log('currentTime', currentTime, 'supposedCurrentTime', this.supposedCurrentTime);
        if (currentTime !== this.supposedCurrentTime) {
          // console.log('currentTime !== this.supposedCurrentTime')
          this.trigger('timeupdate');
          this.onSeeked();
        }
      }
    }, 250);
  },

  //////// Customizing seekable //////////

  seeking() {
    return this.isSeeking;
  },

  isSeekable() {
    if (!this._player) {
      return videojs.createTimeRange();
    }
    return videojs.createTimeRange(0, this._player.getDuration());
  },

  onSeeked() {
    clearInterval(this.checkSeekedInPauseInterval);
    this.isSeeking = false;

    // console.log('onseeked', this.wasPausedBeforeSeek)
    if (this.wasPausedBeforeSeek || this.wasPausedBeforeSeek === undefined) {
      this.pause();
    }

    this.trigger('seeked');
  },

  ////////////////////////////////////////

  initVimeoState() {
    const state = this._vimeoState = {
      ended: false,
      playing: false,
      volume: 0,
      progress: {
        seconds: 0,
        percent: 0,
        duration: 0
      }
    };

    this._player.getCurrentTime().then(time => (state.progress.seconds = time));
    this._player.getDuration().then(time => (state.progress.duration = time));
    this._player.getPaused().then(paused => (state.playing = !paused));
    this._player.getVolume().then(volume => (state.volume = volume));
  },

  createEl() {
    const div = videojs.dom.createEl('div', {
      id: this.options_.techId
    });

    div.style.cssText = 'width:100%;height:100%;top:0;left:0;position:absolute';
    div.className = 'vjs-vimeo';

    return div;
  },

  controls() {
    return true;
  },

  supportsFullScreen() {
    return true;
  },

  src() {
    return this.options_.source;
  },

  currentSrc() {
    return this.options_.source.src;
  },

  currentTime() {
    return this._vimeoState.progress.seconds;
  },

  setCurrentTime(time) {

    console.log('setCurrentTime: is seeking ? ', this.isSeeking, time);

    if (!this.isSeeking) {
      this.wasPausedBeforeSeek = this.paused();
    }

    this._player.setCurrentTime(time);

    // Added to customize the seeking
    this.onSeeked();
  },

  volume() {
    return this._vimeoState.volume;
  },

  setVolume(volume) {
    return this._player.setVolume(volume);
  },

  duration() {
    return this._vimeoState.progress.duration;
  },

  buffered() {
    const progress = this._vimeoState.progress;

    return videojs.createTimeRange(0, progress.percent * progress.duration);
  },

  paused() {
    return !this._vimeoState.playing;
  },

  pause() {
    this._player.pause();
  },

  play() {
    // Added seeking
    this.wasPausedBeforeSeek = false;

    this._player.play();
  },

  muted() {
    return this._vimeoState.volume === 0;
  },

  ended() {
    return this._vimeoState.ended;
  },

  playbackRate() {
    return 1;
  },

});

Vimeo.prototype.featuresTimeupdateEvents = true;

Vimeo.isSupported = function () {
  return true;
};

// Add Source Handler pattern functions to this tech
Tech.withSourceHandlers(Vimeo);

Vimeo.nativeSourceHandler = {
};

/**
 * Check if Vimeo can play the given videotype
 *
 * @param  {string} source    The mimetype to check
 * @return {string}         'maybe', or '' (empty string)
 */
Vimeo.nativeSourceHandler.canPlayType = function (source) {
  if (source === 'video/vimeo') {
    return 'maybe';
  }

  return '';
};

/*
 * Check Vimeo can handle the source natively
 *
 * @param  {Object} source  The source object
 * @return {String}         'maybe', or '' (empty string)
 * @note: Copied over from YouTube — not sure this is relevant
 */
Vimeo.nativeSourceHandler.canHandleSource = function (source) {
  if (source.type) {
    return Vimeo.nativeSourceHandler.canPlayType(source.type);
  } else if (source.src) {
    return Vimeo.nativeSourceHandler.canPlayType(source.src);
  }

  return '';
};

// @note: Copied over from YouTube — not sure this is relevant
Vimeo.nativeSourceHandler.handleSource = function (source, tech) {
  tech.src(source.src);
};

// @note: Copied over from YouTube — not sure this is relevant
Vimeo.nativeSourceHandler.dispose = function () { };

Vimeo.registerSourceHandler(Vimeo.nativeSourceHandler);

// Older versions of VJS5 doesn't have the registerTech function
if (typeof videojs.registerTech !== 'undefined') {
  videojs.registerTech('Vimeo', Vimeo);
} else {
  videojs.registerComponent('Vimeo', Vimeo);
}

// Include the version number.
Vimeo.VERSION = '0.0.1';

export default Vimeo;
