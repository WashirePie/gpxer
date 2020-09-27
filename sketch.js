/*
 * TODO: UI: Add time/duratio widget
 * TODO: UI: Add peak power widget
 * TODO: UI: Add peak pace widget
 * TODO: UI: Add highest / lowest point widget
 * TODO: UI: Refactor average power widget -> Display in watts
 * TODO: UI: Refactor average Slope widget, that is kinda uselsess
 * TODO: UI: Add cmt, name, desc in trkpt or rtept to chart tags
 * TODO: Handle Waypoints 
 * TODO: Chart: Make x axis ticks in seconds, only where the datapoints are
 * TODO: Refactor GPXConverter.e -> Make a static error Class that also evaluates stack traces
 * TODO: Refactor GPXParams -> Still necessary?
 */

let gpx = null;
let gpxv = null;
let ui = null;


let main = async() =>
{
    ui   = new UIController();
    gpx  = GPXConverter.parse(testGpxString2);
    gpxv = new GPXView(await ui.awaitUserChoice('GPX', gpx.getTourList()));

    let dataBindings = [
        {appVersion: new Observable('v0.0.0 (beta)')},
        {appTitle: new Observable('gpxer')}
    ];
    
    dataBindings = dataBindings.concat(gpxv.analysisData);
    ui.applyExternalDataBindings(dataBindings);
}

setTimeout(main, 0);




