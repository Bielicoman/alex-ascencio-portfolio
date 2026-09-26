// Phone visitors never download the desktop hand tracker or the Three.js games.
if (matchMedia("(max-width: 760px), (pointer: coarse) and (max-width: 1024px)").matches) import("./mobile.js");
else import("./desktop.js");
