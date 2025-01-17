import './style.css'
import app from "./setup.js";

app.setup();

// used to display animated objects in an event loop
function draw() {
  requestAnimationFrame(draw);
  app.displayScene();
}
draw();