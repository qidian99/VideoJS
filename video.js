// taken from https://github.com/videojs/video.js/blob/master/docs/guides/react.md
import { Component } from 'preact';


import videojs from 'video.js';

import './Youtube';
import './Vimeo';


const youtubeConfigDefault = {
  techOrder: ["youtube"],
  sources: [{
    type: "video/youtube",
    // src: "https://www.youtube.com/watch?v=xjS6SftYQaQ"
  }],
  youtube: {
    ytControls: 0,
    showinfo: 0,
    rel: 0
  }
};

const vimeoConfigDefault = {
  techOrder: ["vimeo"],
  sources: [{
    type: "video/vimeo",
    // src: "https://vimeo.com/148751763"
  }],
  vimeo: {
    seekable: 0,
    // color: "#fbc51b"
  }
};

export default class VideoPlayer extends Component {

  constructor() {
    super();
    this.state = {
      duration: 0,
      root: null,
      supposedCurrentTime: 0,
    }
  }

  componentDidMount() {
    // First parent element is the div within which is video player has
    //   fluid dimension
    // Second parent element is the custom-video HTMLElement
    this.state.root = this.base.parentElement.parentElement;
    const self = this;
    const {
      root,
    } = this.state;

    function dispatchDurationEvent(duration) {
      const event = new CustomEvent('duration-loaded', {
        detail: {
          duration,
        },
      });
      root.dispatchEvent(event);
    }

    function dispatchFinishEvent() {
      const event = new CustomEvent('video-finished');
      root.dispatchEvent(event);
    }

    function onLoadedMetadata() {
      const duration = this.duration();
      console.log('duration', duration)
      if (duration && self.state.duration === 0) {
        // console.log(self.base);
        dispatchDurationEvent(duration);
      }
    }

    function onPlay() {
      const duration = this.duration();
      // console.log('on play duration', duration)

      if (duration && self.state.duration === 0) {
        // console.log(root);
        dispatchDurationEvent(duration);
      }
    }

    const {
      platform,
      ...videojsOptions
    } = this.props
    // instantiate video.js
    this.player = videojs(
      this.videoNode,
      videojsOptions,
      function onPlayerReady() {
        // console.log('onPlayerReady', self.props);
        if (self.props.controls != 1) {
          this.controlBar.progressControl.disable();
          // this.addClass('vjs-controls-disabled');
          // this.removeClass('vjs-controls-enabled');
          console.log('checkplayer', this)
        }
        this.on("loadedmetadata", onLoadedMetadata);
        this.on("play", onPlay);
        this.on('ended', dispatchFinishEvent);

        // this.on('seeking', function (data) {
        //   console.log('seeking', data);
        // })

        // this.on('seeked', function () {
        //   console.log('seeked', this, this.currentTime(), this.setCurrentTime);
        // });
      });


  }

  // destroy player on unmount
  componentWillUnmount() {
    if (this.player) {
      this.player.dispose();
    }
  }

  // wrap the player in a div with a `data-vjs-player` attribute
  // so videojs won't create additional wrapper in the DOM
  // see https://github.com/videojs/video.js/pull/3856
  render() {

    const {
      platform,
      controls,
      src,
    } = this.props;

    // console.log(this.props)

    let youtubeConfig;
    if (platform === "youtube") {
      youtubeConfig = { ...youtubeConfigDefault };
      youtubeConfig['sources'][0]['src'] = src;
    }

    let vimeoConfig;
    if (platform === "vimeo") {
      vimeoConfig = { ...vimeoConfigDefault };
      vimeoConfig['sources'][0]['src'] = src;
      vimeoConfig['vimeo']['seekable'] = controls;
    }



    // console.log('vimeo', vimeoConfig);
    // console.log('youtube', youtubeConfig);


    return (
      <div data-vjs-player>
        <video
          ref={node => (this.videoNode = node)}
          className="video-js"
          data-setup={platform ?
            (
              platform === "youtube" ? JSON.stringify(youtubeConfig) :
                platform === "vimeo" ? JSON.stringify(vimeoConfig) : null
            ) : null}
        />
      </div>
    );
  }
}
