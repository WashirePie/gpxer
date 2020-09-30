/*
 *      ✅ Bugs: Fix chart updating 
 *
 * TODO ⬜ Test: Test with gpx which only contains 'ele' attribs
 * TODO ⬜ Test: Test with gpx which only contains 'ele', 'lat', 'lon' attribs
 * TODO ⬜ Test: Test with gpx whoch has a track
 * TODO ⬜ Test: from v1.0.0: Setup unit tests
 *
 * TODO ⬜ Doc: Add jsDoc comments to all classes
 *                Explain extendability with GPXAnalysis class (transitionFunction, finalizerFunction)
 *
 * TODO ⬜ UI: Add cmt, name, desc in trkpt or rtept to chart tags
 * TODO ⬜ UI: Add css value count-up animation
 * 
 * TODO ⬜ General: Make analysisFinalizer an optional property (for all Analyzers!)
 *      ✅ General: Implement fileReader
 * TODO ⬜ General: Handle Waypoints 
 * TODO ⬜ General: Rework GPXBuilder ---> use a static method in GPXParam to check for attributes. Get rid of the Switch statement!
 * 
 * TODO ⬜ Refactor GPXConverter.e -> Make a static error Class that also evaluates stack traces
 * TODO ⬜ Refactor GPXParams -> Still necessary?
 */

let gpx = null;
let gpxv = null;
let ui = null;

const UIWC = document.getElementById('widgetContainer');

let main = async() =>
{
    ui   = new UIModal();
    
    let raw = await ui.awaitUserFile();    
    gpx  = GPXConverter.parse(raw);
    console.log(gpx);
    gpxv = new gpxer(await ui.awaitUserChoice('GPX', gpx.getTourList()));

    /* Add dat.GUI Controls */
    let gui = new dat.GUI();

    let pf = gui.addFolder('Analysis Parameters');
    pf.add(gpxv.userData, 'weight', 30, 150, 0.5).onFinishChange(() =>          { gpxv.executeCapabilities(); });
    pf.add(gpxv.userData, 'additionalWeight', 0, 100, 0.5).onFinishChange(() => { gpxv.executeCapabilities(); });
}

setTimeout(main, 0);




