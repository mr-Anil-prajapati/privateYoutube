# Dropbox Video Library

A responsive video library website built with HTML, CSS, and vanilla JavaScript.

## Live Demo

https://mr-Anil-prajapati.github.io/privateYoutube

## Features

- Automatically loads video files from a Dropbox shared folder
- Uses Dropbox API to fetch files dynamically
- Supports search, sort, lazy loading, and infinite scrolling
- Built-in HTML5 player modal
- Dark theme with modern Netflix-style UI
- Responsive and mobile-friendly
- Only shows supported video formats: `mp4`, `mkv`, `avi`, `mov`, `webm`

## Project Structure

- `index.html`
- `style.css`
- `script.js`
- `config.js`

## Configuration

Update `config.js` before publishing:

```js
const DROPBOX_ACCESS_TOKEN = "YOUR_ACCESS_TOKEN";
const DROPBOX_FOLDER = "https://www.dropbox.com/scl/fo/0towscm73fgdkaojex4f4/ADymaCTICA_nwtmnY1BniZk?rlkey=u7wlid181el3qrsn2xj9gt1d2&st=yjtfgllx&dl=0";
```

## Deployment

This project is ready for GitHub Pages. Push to the `main` branch and enable GitHub Pages for the repository.
