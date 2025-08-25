# Hilbert Curve Experiment

<p align="center">
	<img src="static/hilber-curve-experiment-vid.gif" alt="Hilbert Curve Demo" width="500" />
</p>

A 3D visualization experiment using Three.js to render and animate a Hilbert curve in real time.

## Features
- Interactive 3D Hilbert curve rendered with Three.js
- Animated bouncing and rotation with smooth controls
- Customizable line width, color, dashing, and more via GUI
- Responsive to window resizing
- Orbit controls for camera navigation

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)

### Install
```
npm install
```

### Run
```
npm run dev
```
Then open your browser to the local server (usually http://localhost:5173 or as shown in your terminal).

## Usage
- Use the GUI (top right) to tweak line properties and animation.
- Drag to orbit, scroll to zoom.

## Project Structure
```
├── src/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── static/
│   └── demo.gif (optional)
├── package.json
├── vite.config.js
└── README.md
```

## Credits
- [Three.js](https://threejs.org/)
- [lil-gui](https://lil-gui.georgealways.com/)
- [threejs-fat-line-example](https://threejs.org/examples/?q=line#webgl_lines_fat)

## License
MIT
