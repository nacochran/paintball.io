import './style.css'
import app from "./App.js";

// resize UI canvas
const canvas = document.getElementById('ui-canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// run app
app();