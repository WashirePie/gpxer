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


let gpxHeadDiv =     document.getElementById('gpxAnalysis');
let gpxTrackDiv =    document.getElementById('gpxTrack');
let chartDiv =       document.getElementById('charts');
let titleHeading =   document.getElementById('gpxTitle');
let titleParagraph = document.getElementById('gpxParagraph');


let gpx;
let tourRoutes;
let tourTracks;
let tourAnalysis;
let gui;

const main = p =>
{
    p.setup = () =>
    {
        /* Setup DOM Elements */
        gpxHeadDiv.width = window.innerWidth; gpxHeadDiv.height = window.innerHeight * 1 / 4;
        gpxTrackDiv.width = window.innerWidth; gpxTrackDiv.height = window.innerHeight * 1 / 2;

        p.createCanvas(window.innerWidth, window.innerHeight * 1 / 2, 'gpxTrack');

        /* Create GPX */
        gpx = GPXConverter.parse(testGpxString2);
        tourRoutes = (gpx.routes != undefined) && (!Array.isArray(gpx.routes)) ? [gpx.routes] : gpx.routes;
        tourTracks = (gpx.tracks != undefined) && (!Array.isArray(gpx.tracks)) ? [gpx.tracks] : gpx.tracks;

        /* [ ] TODO: be able to select the analyzers for each track / tracksegment and route */
        let calories = 0;
        let colorPalette = [
            new RGBAColor(255, 171, 211, 1),
            new RGBAColor(255, 201, 157, 1),
            new RGBAColor(197, 245, 183, 1),
            new RGBAColor(188, 255, 233, 1)
        ];

        if (tourRoutes) tourRoutes.forEach(route => { route.analyzer = new GPXHikeAnalysis(route, chartDiv, 80, 5, colorPalette); calories += route.analyzer.analyze(); });
        if (tourTracks) tourTracks.forEach(track => { track.analyzer = new GPXHikeAnalysis(track, chartDiv, 80, 5, colorPalette); calories += track.analyzer.analyze(); });

        if (tourRoutes) tourRoutes.forEach(route => { route.visualizer = new GPXVisualizer(route, colorPalette); route.visualizer.update(p); });
        if (tourTracks) tourTracks.forEach(track => { track.visualizer = new GPXVisualizer(track, colorPalette); track.visualizer.update(p); });


        titleParagraph.innerHTML = `Used energy: ${calories}kcal`;
        titleHeading.innerHTML = '';

        if (tourRoutes) tourRoutes.forEach(route => { titleHeading.innerHTML += `GPXRoute: ${Object.values(route.attributes).join(' ')}<br>`; });
        if (tourTracks) tourTracks.forEach(track => { titleHeading.innerHTML += `GPXTrack: ${Object.values(track.attributes).join(' ')}<br>`; });

        // /* Add dat.GUI Controls */
        // gui = new dat.GUI();

        // let hwController = gui.add(tourAnalysis, 'hikerWeight', 30, 150, 0.5);
        // let awController = gui.add(tourAnalysis, 'additionalWeight', 0, 100, 0.5);

        // hwController.onFinishChange(() => { calories = tourAnalysis.analyze(); });
        // awController.onFinishChange(() => { calories = tourAnalysis.analyze(); });
    }

    p.draw = () =>
    {
        p.background(0, 0, 0, 0);

        if (tourRoutes) tourRoutes.forEach(route => { p.image(route.visualizer.graphics, 0, 0); });
        if (tourTracks) tourTracks.forEach(track => { p.image(track.visualizer.graphics, 0, 0); });

        p.noLoop();
    }
}

let p5Context = new p5(main, window.document.getElementById('gpxTrack'));

