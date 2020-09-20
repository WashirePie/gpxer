let G;
let R;
let RA;
let bounds;

const sketch = p =>
{
  let canvas;
  let trackBuf;
  let graphBuf;

  p.setup = () =>
  {
    G = GPXConverter.parse(testGpxString2);
    R = G.routes;
    console.log(R);
    
    RA = new GPXHikeAnalysis(80, 10, R);
    console.log(RA.analyze());
    
    bounds = Object.assign(R.getExtrema('ele'), R.getExtrema('time'), R.getExtrema('lat'), R.getExtrema('lon'));
    

    p.createCanvas(window.innerWidth, window.innerHeight);

    trackBuf = p.createGraphics(window.innerWidth, window.innerHeight * (3/4));
    graphBuf = p.createGraphics(window.innerWidth, window.innerHeight * (1/4));

    p.background(53);
  }

  p.draw = () =>
  {
    /* Draw buffers */
    plotTracks();
    plotGraphs();

    /* Plot buffers to canvas */
    p.image(trackBuf, 0, 0);
    p.image(graphBuf, 0, trackBuf.height);

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

  const plotGraphs = () =>
  {
    graphBuf.background(220);

    graphBuf.stroke(200,0,0);
    graphBuf.strokeWeight(1);
    graphBuf.noFill();

    graphBuf.beginShape();
    R.content.forEach((rtept, i) => 
    {
      if (rtept.attributes.hasOwnProperty('ele') && rtept.attributes.hasOwnProperty('time'))
      {
        let x = graphBuf.map(i, 0, R.content.length  , 0, graphBuf.width);
        // x = graphBuf.map(rtept.attributes.time.getTime(), bounds.minTime.getTime(), bounds.maxTime.getTime(), 0, graphBuf.width);
        let y = graphBuf.map(rtept.attributes.ele, bounds.maxEle, bounds.minEle, 0, graphBuf.height);

        graphBuf.vertex(x, y);
      }
    });
    graphBuf.endShape();

    /* Plot crosshair */
    graphBuf.stroke(100);
    graphBuf.strokeWeight(1);

    if (p.mouseY >= p.height - graphBuf.height)
    {
      graphBuf.line(p.mouseX, 0, p.mouseX, graphBuf.height);

      let i = parseInt(graphBuf.map(p.mouseX, 0, graphBuf.width, 0, R.content.length), 10);
      let pt = R.content[i];
     
      let canvasSize = trackBuf.width > trackBuf.height ? trackBuf.height : trackBuf.width;
      
      let x = trackBuf.map(pt.attributes.lon, bounds.minLon, bounds.maxLon, 0, canvasSize);
      let y = trackBuf.map(pt.attributes.lat, bounds.minLat, bounds.maxLat, canvasSize, 0);

      trackBuf.fill(100);
      trackBuf.ellipse(x, y, 10);
    }
  }
}

new p5(sketch);



