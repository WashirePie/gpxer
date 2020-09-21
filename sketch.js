let G;
let R;
let RA;
let bounds;
let gui;
let calories;

const sketch = p =>
{
  let trackBuf;

  p.setup = () =>
  {
    p.createCanvas(window.innerWidth, window.innerHeight * 1/2);
    trackBuf = p.createGraphics(window.innerWidth, window.innerHeight * 1/2);
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
    trackBuf.background(0,0,0,0);

    /* Plot track */
    trackBuf.stroke(200);
    trackBuf.strokeWeight(1);
    trackBuf.noFill();

    let canvasSize = trackBuf.width > trackBuf.height ? trackBuf.height : trackBuf.width;

    trackBuf.beginShape();
    if (R instanceof GPXRoute)
    {
      R.content.forEach(rtept =>
      {
        if (rtept.attributes.hasOwnProperty('ele') && rtept.attributes.hasOwnProperty('time')) 
        {
          let x = trackBuf.map(rtept.attributes.lon, bounds.minLon, bounds.maxLon, 0, canvasSize);
          let y = trackBuf.map(rtept.attributes.lat, bounds.minLat, bounds.maxLat, canvasSize, 0);
          
          trackBuf.vertex(x, y);
        }
      });
    }
    else
    {
      R.content.forEach(trkseg =>
      {
        trkseg.content.forEach(trkpt =>
        {          
          if (trkpt.attributes.hasOwnProperty('ele') && trkpt.attributes.hasOwnProperty('time')) 
          {
            let x = trackBuf.map(trkpt.attributes.lon, bounds.minLon, bounds.maxLon, 0, canvasSize);
            let y = trackBuf.map(trkpt.attributes.lat, bounds.minLat, bounds.maxLat, canvasSize, 0);

            trackBuf.vertex(x, y);
          }
        })
      });
    }
    trackBuf.endShape();
  }
}


let gpxHeadDiv = document.getElementById('gpxAnalysis');
let gpxTrackDiv = document.getElementById('gpxTrack');

let elevationChartCanvas = document.getElementById('chartElevation').getContext('2d');
let energyChartCanvas = document.getElementById('chartEnergy').getContext('2d');
let paceChartCanvas = document.getElementById('chartPace').getContext('2d');
let slopeChartCanvas = document.getElementById('chartSlope').getContext('2d');

let titleHeading = document.getElementById('gpxTitle');
let titleParagraph = document.getElementById('gpxParagraph');

gpxHeadDiv.width = window.innerWidth;
gpxHeadDiv.height = window.innerHeight * 1/4;

gpxTrackDiv.width = window.innerWidth;
gpxTrackDiv.height = window.innerHeight * 1/2;

elevationChartCanvas.width  = window.innerWidth;
elevationChartCanvas.height = window.innerHeight * 1/3;

energyChartCanvas.width  = window.innerWidth;
energyChartCanvas.height = window.innerHeight * 1/3;  

paceChartCanvas.width  = window.innerWidth;
paceChartCanvas.height = window.innerHeight * 1/3;  

slopeChartCanvas.width  = window.innerWidth;
slopeChartCanvas.height = window.innerHeight * 1/3;  


/*
[] Fix Style of charts
  [] Gridline color
  [] lable visibility (add backgroundcolor)
[] Add rawdata as standard dataset to charts with default visibility = false
[] Make x axis ticks in seconds, only where the datapoints are
[] Refactor the scaling method in GPXChart - it's horrific
[] Make resolution a dat.gui slider

[] Refactor GPXParams -> Still necessary?
[] Fix GPXAnalysis with tracks
   Currently all trksegs are just concatenated 
[] Add cmt, name, desc in trkpt or rtept to chart tags 
[] Refactor main entry point
*/

/* Create GPX */
G = GPXConverter.parse(testGpxString);
R = G.routes ? G.routes : G.tracks;

bounds = Object.assign(R.getExtrema('ele'), R.getExtrema('time'), R.getExtrema('lat'), R.getExtrema('lon'));

RA = new GPXHikeAnalysis(80, 10, R);

calories = RA.analyze();

titleHeading.innerHTML = `GPXTrack: ${Object.values(R.attributes).join(' ')}`;
titleParagraph.innerHTML = `Used energy: ${calories}kcal`;

new p5(sketch, 'gpxTrack');
gui = new dat.GUI();

let hwController = gui.add(RA, 'hikerWeight', 30, 150, 0.5);
let awController = gui.add(RA, 'additionalWeight', 0, 100, 0.5);

hwController.onFinishChange(() => { calories = RA.analyze(); });
awController.onFinishChange(() => { calories = RA.analyze(); });

