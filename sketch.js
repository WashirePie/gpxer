let G;
let R;
let RA;
let bounds;
let gui;

const sketch = p =>
{
  let trackBuf;

  p.setup = () =>
  {
    p.createCanvas(window.innerWidth, window.innerHeight * 1/2);

    trackBuf = p.createGraphics(window.innerWidth, window.innerHeight * 1/2);

    p.background(53);
  }

  p.draw = () =>
  {
    plotTracks();
    p.image(trackBuf, 0, 0);

  }

  p.windowResized = () =>
  {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
  }

  const plotTracks = () =>
  {
    trackBuf.background(51);

    /* Plot track */
    trackBuf.stroke(200);
    trackBuf.strokeWeight(1);
    trackBuf.noFill();

    let canvasSize = trackBuf.width > trackBuf.height ? trackBuf.height : trackBuf.width;

    trackBuf.beginShape();
    R.content.forEach(rtept =>
    {
      if (rtept.attributes.hasOwnProperty('ele') && rtept.attributes.hasOwnProperty('time')) 
      {
        let x = trackBuf.map(rtept.attributes.lon, bounds.minLon, bounds.maxLon, 0, canvasSize);
        let y = trackBuf.map(rtept.attributes.lat, bounds.minLat, bounds.maxLat, canvasSize, 0);
        
        trackBuf.vertex(x, y);
      }
    });
    trackBuf.endShape();
  }
}





let doAnalyze = () =>
{
  let calories = RA.analyze();
  console.log(calories);
  RA.makeChart(chartCanv);
}

let gpxDiv = document.getElementById('gpx');
let chartCanv = document.getElementById('chart').getContext('2d');

gpxDiv.width = window.innerWidth;
gpxDiv.height = window.innerHeight * 1/2;
chartCanv.width = window.innerWidth;
chartCanv.height = window.innerHeight * 1/2;  

G = GPXConverter.parse(testGpxString2);
R = G.routes;
console.log(R);

bounds = Object.assign(R.getExtrema('ele'), R.getExtrema('time'), R.getExtrema('lat'), R.getExtrema('lon'));

RA = new GPXHikeAnalysis(80, 10, R);
doAnalyze();

new p5(sketch, 'gpx');

gui = new dat.GUI();

let hwController = gui.add(RA, 'hikerWeight', 30, 150, 0.5);
let awController = gui.add(RA, 'additionalWeight', 0, 100, 0.5);

hwController.onFinishChange(() => { doAnalyze(); });
awController.onFinishChange(() => { doAnalyze(); });


