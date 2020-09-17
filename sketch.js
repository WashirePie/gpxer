const Background = 51
let G;
let R;

let maxLat;
let minLat;
let maxLon;
let minLon;


function setup()
{
  G = GPXConverter.parse(testGpxString2);
  R = G.getRoutes();

  console.log(R.content);

  maxLat = R.content.reduce((p, c) => p.attributes.lat > c.attributes.lat ? p : c).attributes.lat;
  minLat = R.content.reduce((p, c) => p.attributes.lat < c.attributes.lat ? p : c).attributes.lat;
  maxLon = R.content.reduce((p, c) => p.attributes.lon > c.attributes.lon ? p : c).attributes.lon;
  minLon = R.content.reduce((p, c) => p.attributes.lon < c.attributes.lon ? p : c).attributes.lon;

  console.log(G);

  createCanvas(window.innerWidth, window.innerHeight);
}


function draw()
{
  background(53);
  stroke(200);
  strokeWeight(1);
  noFill();

  let canvasSize = width > height ? height : width;

  beginShape();
  R.content.forEach(rtept =>
  {
    let x = map(rtept.attributes.lon, minLon, maxLon, 0, canvasSize);
    let y = map(rtept.attributes.lat, minLat, maxLat, canvasSize, 0);
    vertex(x, y);
  });
  endShape();
}

COMBAK

class GPXHikeAnalysis
{
    constructor() { }

    /* i = gradient (0.5 = 50 degrees), returns the average energetic cost for walking in j/kg*m */
    cw = (i) => 
    {
        /* According to:
        "Energy cost of walking and running at extreme uphill and downhill slopes" (Alberto E. Minetti, Christian Moia, Giulio S. Roi, Davide Susta, and Guido Ferretti), 01. Sept 2002
        https://journals.physiology.org/doi/full/10.1152/japplphysiol.01177.2001 */
        return 280.5 * Math.pow(i, 5) - 
                58.7 * Math.pow(i, 4) - 
                76.8 * Math.pow(i, 3) + 
                51.9 * Math.pow(i, 2) + 
                 19.6 * i + 2.5
    }

    get v() { return 0.69 /* m/s */ }
}
