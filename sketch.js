const Background = 51
let G;
let R;

function setup()
{
  G = GPXConverter.parse(testGpxString2);
  R = G.routes;

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
    let x = map(rtept.attributes.lon, R.minLon, R.maxLon, 0, canvasSize);
    let y = map(rtept.attributes.lat, R.minLat, R.maxLat, canvasSize, 0);
    vertex(x, y);
  });
  endShape();

  noLoop();
}



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
