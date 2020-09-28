/*
 * TODO: UI: Add time/duratio widget
 * TODO: UI: Add peak power widget
 * TODO: UI: Add peak pace widget
 * TODO: UI: Add highest / lowest point widget
 * TODO: UI: Refactor average power widget -> Display in watts
 * TODO: UI: Refactor average Slope widget, that is kinda uselsess
 * TODO: UI: Add cmt, name, desc in trkpt or rtept to chart tags
 * TODO  General: Chance: Concat the Min/Max/Avg Analysis classes (Slope,Pace,Vert. Speed etc.);
 * TODO: General: Handle Waypoints 
 * TODO: General: Rework GPXBuilder ---> use a static method in GPXParam to check for attributes. Get rid of the Switch statement!
 * TODO: Chart: Make x axis ticks in seconds, only where the datapoints are
 * TODO: Refactor GPXConverter.e -> Make a static error Class that also evaluates stack traces
 * TODO: Refactor GPXParams -> Still necessary?
 */

let gpx = null;
let gpxv = null;
let ui = null;

const personData = {
    weight: 80,
    additionalWeight: 3,
    age: 25
};

/* Generated with https://learnui.design/tools/data-color-picker.html */
const colorPalette = [
    RGBAColor.fromHEX('#ffa600'),
    RGBAColor.fromHEX('#ff7c43'),
    RGBAColor.fromHEX('#f95d6a'),
    RGBAColor.fromHEX('#d45087'),
    RGBAColor.fromHEX('#a05195'),
    RGBAColor.fromHEX('#665191'),
    RGBAColor.fromHEX('#2f4b7c'),
    RGBAColor.fromHEX('#003f5c')
];

let main = async() =>
{
    ui   = new UIController();
    
    let appInfo = new UIAppInfoWidget(UIWC, '');

    gpx  = GPXConverter.parse(testGpxString2);
    gpxv = new GPXView(await ui.awaitUserChoice('GPX', gpx.getTourList()));

    let dataBinding = {
        appVersion: new Observable('v0.0.0 (beta)'),
        appTitle: new Observable('gpxer')
    };
    
    let chart = new UIChartWidget(UIWC, '');

    gpxv.analyzers.forEach(a =>
    {
       if (a.dataBinding) Object.assign(dataBinding, a.dataBinding); 
    });

    
    ui.applyExternalDataBinding(dataBinding);

    /* Add dat.GUI Controls */
    let gui = new dat.GUI();

    let pf = gui.addFolder('Analysis Parameters');
    pf.add(personData, 'weight', 30, 150, 0.5).onFinishChange(() => { gpxv.tourAnalysis(); });
    pf.add(personData, 'additionalWeight', 0, 100, 0.5).onFinishChange(() => { gpxv.tourAnalysis(); });
}

setTimeout(main, 0);




