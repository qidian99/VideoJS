# VideoJS
## Dependencies

1. @vimeo/player, ^2.12.2
```bash
npm i -S @vimeo/player
```

## Web component attributes

1. src: the source of the video
2. platform: either "youtube" or "vimeo"
3. controls: either "0" or "1"
4. width: a numeric string (in pixels by default)
5. height: a numeric string (in pixels by default)
6. type: type of the video, if the video is not from Youtube or Vimeo


## Example

```html
<custom-video
	src="https://vimeo.com/251410011"
	platform="vimeo">
</custom-video>

<custom-video
	src="https://www.youtube.com/watch?v=xjS6SftYQaQ"
	platform="youtube">
</custom-video>

<custom-video
	src="https://www.youtube.com/watch?v=xjS6SftYQaQ"
	platform="youtube"
	controls="1"
>
</custom-video>

<custom-video
	src="https://www.w3schools.com/tags/movie.mp4"
	type="video/mp4"
	width="360"
	height="350">
</custom-video>
```

## Optional paramters

### Youtube

https://developers.google.com/youtube/player_parameters?playerVersion=HTML5#Selecting_Content_to_Play


### Vimeo
```js
{
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
}
```
