import { h, Component } from "preact";
import Videojs from "./video.js";
import PropTypes from 'prop-types';
import './dist/video-js.css'
import './custom-video.less'


/*
aspectRatio?: string;
autoplay?: boolean | string;
controlBar?: videojs.ControlBarOptions | false;
textTrackSettings?: videojs.TextTrackSettingsOptions;
controls?: boolean;
defaultVolume?: number;
fluid?: boolean;
height?: number;
html5?: any;
inactivityTimeout?: number;
language?: string;
languages?: { [code: string]: videojs.LanguageTranslations };
liveui?: boolean;
loop?: boolean;
muted?: boolean;
nativeControlsForTouch?: boolean;
notSupportedMessage?: string;
playbackRates?: number[];
plugins?: Partial<VideoJsPlayerPluginOptions>;
poster?: string;
preload?: string;
sourceOrder?: boolean;
sources?: videojs.Tech.SourceObject[];
src?: string;
techOrder?: string[];
tracks?: videojs.TextTrackOptions[];
width?: number;
*/

/*
ControlBar.prototype.options_ = {
  children: [
    'playToggle',
    'volumePanel',
    'currentTimeDisplay',
    'timeDivider',
    'durationDisplay',
    'progressControl',
    'liveDisplay',
    'seekToLive',
    'remainingTimeDisplay',
    'customControlSpacer',
    'playbackRateMenuButton',
    'chaptersButton',
    'descriptionsButton',
    'subsCapsButton',
    'audioTrackButton',
    'fullscreenToggle'
  ]
};
*/

const videoJsOptions = {
  autoplay: false,
  controlBar: true,
  playbackRates: [0.5, 1, 1.25, 1.5, 2],
  controls: true,
  fill: true,
  fluid: true,
  preload: 'auto',
  html5: {
    hls: {
      enableLowInitialPlaylist: true,
      smoothQualityChange: true,
      overrideNative: true,
    },
  },
  // controlBar: {
  //   playToggle: false,
  //   volumePanel: false,
  //   currentTimeDisplay: false,
  //   timeDivider: false,
  //   durationDisplay: false,
  //   progressControl: false,
  //   liveDisplay: false,
  //   seekToLive: false,
  //   remainingTimeDisplay: false,
  //   customControlSpacer: false,
  //   playbackRateMenuButton: false,
  //   chaptersButton: false,
  //   descriptionsButton: false,
  //   subsCapsButton: false,
  //   audioTrackButton: false,
  //   fullscreenToggle: false,
  // },
  errorDisplay: false,
  // liveTracker: false,
  // sources: [
  //   {
  //     src: 'http://vjs.zencdn.net/v/oceans.mp4',
  //     type: 'video/mp4',
  //   },
  // ],
};


export class CustomVideo extends Component {

  /*********
   * Custom Events
   *
   * 1. 'duration-loaded': { duration: number }
   * document.getElementsByTagName('custom-video')[0].addEventListener('duration-loaded', function (e) {
   *  console.log(e.detail);
   * })
   *
   * 2. 'video-finished': no extra detail
   * document.getElementsByTagName('custom-video')[0].addEventListener('vide-finished', function (e) {
   *  console.log('video finished');
   * })
   */

  static tagName = 'custom-video';

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  render() {
    const {
      src,
      type,
      width,
      height,
      platform,
      controls,
    } = this.props;


    const options = {
      ...videoJsOptions,
    }

    if (src && type) {
      options['sources'] = [
        {
          src,
          type,
        },
      ]

      // console.log(options);
    }

    if (width && height) {
      options['aspectRatio'] =  width + ':' + height;
    }

    return (
      <div style={{ width: parseInt(width, 10) ? width + 'px' : width }}>
        <Videojs
          {...options}
          platform={platform}
          src={platform ? src : null}
          controls={controls}
        ></Videojs>
      </div>
    );
  }
}


const PROPTYPE = {
  width: PropTypes.string,
  height: PropTypes.string,
  src: PropTypes.string,
  type: PropTypes.string,
  platform(props, propName, componentName) {
    if (!props[propName]) {
      return;
    }
    if (!/vimeo|youtube/.test(props[propName])) {
      return new Error(
        'Invalid prop `' + propName + '` supplied to' +
        ' `' + componentName + '`. Should either vimeo or youtube.'
      );
    }
  },
  controls: PropTypes.any,
}
CustomVideo.prototypes = PROPTYPE;

// Specifies the default values for props:
CustomVideo.defaultProps = {
  width: 720,
  height: null,
  // src: 'http://vjs.zencdn.net/v/oceans.mp4',
  // type: 'video/mp4',
  platform: null,
  controls: "0",
};

