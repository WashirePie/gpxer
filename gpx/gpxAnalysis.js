/*
total distance			lat lon

duration			    time

elevation			    ele                     chart
max. elevation			ele
min. elevation			ele
ascent				    ele
descent				    ele

slope				    lat lon ele		        chart
max. slope			    lat lon ele
min. slope			    lat lon ele
avg. slope			    lat lon ele

vert pace			    ele time		        chart
avg. vert pace			ele time
max. vert pace			ele time
min. vert pace			ele time

pace				    lat lon time		    chart
avg. pace			    lat lon time
max. pace			    lat lon time
min. pace			    lat lon time

energy				    lat lon time ele	    chart
total energy 			lat lon time ele

power				        lat lon time ele 	chart
avg. power (kcal/s) / (w)	lat lon time ele
max. power (kcal/s) / (w)	lat lon time ele
min. power (kcal/s) / (w)	lat lon time ele
*/

class GPXAnalysisBuilder
{
    static build = (points) =>
    {
        let analyzers = [];

        let hasEle =  points.filter(p => p.attributes.hasOwnProperty('ele')).length  > points.length * 0.9;
        let hasLat =  points.filter(p => p.attributes.hasOwnProperty('lat')).length  > points.length * 0.9;
        let hasLon =  points.filter(p => p.attributes.hasOwnProperty('lon')).length  > points.length * 0.9;
        let hasTime = points.filter(p => p.attributes.hasOwnProperty('time')).length > points.length * 0.9;
        let hasLatLon = hasLat && hasLon;

        if (hasEle)                             analyzers.push(new GPXElevationAnalysis);
        if (hasTime)   analyzers.push(new GPXSumAnalysis(['time'],       'duration', 's', 'watch_later',       (p1, p2) => { return p2.timeDifference(p1) }))
        if (hasLatLon) analyzers.push(new GPXSumAnalysis(['lat', 'lon'], 'distance', 'm', 'settings_ethernet', (p1, p2) => { return p1.haverSine(p2);     }));

        if (hasLatLon && hasEle)                analyzers.push(new GPXSlopeAnalysis);
        if (hasTime && hasEle)                  analyzers.push(new GPXVertPaceAnalysis);
        if (hasTime && hasLatLon)               analyzers.push(new GPXPaceAnalysis);
        if (hasLatLon && hasTime && hasEle)     analyzers.push(new GPXEnergyAnalysis);
        if (hasLatLon && hasTime && hasEle)     analyzers.push(new GPXPowerAnalysis);

        return analyzers;
    }
}


/*
 * Base Class
 */
class GPXAnalysis
{
    constructor(requiredAttributes = [])
    {
        this.requiredAttributes = requiredAttributes;
        this.dataBinding = {};
        this.widgets = [];
    }

    resetData = () => { }
    analyzePoint = (p) => { }
    analyzeTransition = (p1, p2) => { }
    finalize = () => { }
}

class GPXSumAnalysis extends GPXAnalysis
{
    constructor(requiredAttributes, bindingName, unit, icon, transitionFunction)
    {
        super(requiredAttributes);
        this.dataBinding[bindingName] = new Observable(0);
        this.widgets = [
            new UISingleWidget(UIWC, '', `total ${bindingName}`, icon, unit, bindingName)
        ]
        this.temp = 0;

        this.resetData    = ( ) => { this.temp = 0; }
        this.analyzeTransition = (p1, p2) => { this.temp += transitionFunction.call(this, p1, p2); }
        this.finalize     = ( ) => { this.dataBinding[bindingName]._value = this.temp.toFixed(2); }
    }
}

class GPXElevationAnalysis extends GPXAnalysis
{
    constructor()
    {
        super();
        this.requiredAttributes = ['ele'];
        this.dataBinding.maxElevation = new Observable(0);
        this.dataBinding.minElevation = new Observable(0);
        this.dataBinding.ascent = new Observable(0);
        this.dataBinding.descent = new Observable(0);
        this.widgets = [
            new UIQuadWidget(UIWC, 'row-4', 'elevation', 'arrow_drop_down', 'arrow_drop_up', 'arrow_upward', 'arrow_downward',
                             'm', 'minElevation', 'maxElevation', 'ascent', 'descent'),
            new UITourPlotWidget(UIWC, 'tour plot', 500, 500)
        ]
        this.tempMaxElevation = Number.NEGATIVE_INFINITY;
        this.tempMinElevation = Number.POSITIVE_INFINITY;
        this.tempAscent = 0;
        this.tempDescent = 0;

        this.graph = [];
    }

    resetData = () =>
    {
        this.tempAscent = 0;
        this.tempDescent = 0;
        this.tempMinElevation = Number.POSITIVE_INFINITY;
        this.tempMaxElevation = Number.NEGATIVE_INFINITY;
    }
    analyzePoint = (p, i) =>
    {
        if (p.attributes.ele < this.tempMinElevation) this.tempMinElevation = p.attributes.ele;
        if (p.attributes.ele > this.tempMaxElevation) this.tempMaxElevation = p.attributes.ele;
        /* Fallback to index if no time attribute is available */
        let x = p.attributes.time ? p.attributes.time : i;
        this.graph.push({ y: p.attributes.ele, x: x })
    }
    analyzeTransition = (p1, p2) =>
    {
        let Δh = p2.heightDifference(p1); /* [m] */
        if (Δh > 0)      this.tempAscent += Δh;
        else if (Δh < 0) this.tempDescent += Δh;
    }
    finalize = () =>
    {
        this.dataBinding.ascent._value = this.tempAscent.toFixed(2);
        this.dataBinding.descent._value = this.tempDescent.toFixed(2);
        this.dataBinding.maxElevation._value = this.tempMaxElevation.toFixed(2);
        this.dataBinding.minElevation._value = this.tempMinElevation.toFixed(2);
    }
}

class GPXMinMaxAverageAnalysis extends GPXAnalysis
{
    constructor(requiredAttributes, bindingName, unit, icon, transitionFunction)
    {
        super(requiredAttributes);
        this.requiredAttributes = ['lat', 'lon', 'ele'];
        this.dataBinding[`${bindingName}Max`] = new Observable(0);
        this.dataBinding[`${bindingName}Min`] = new Observable(0);
        this.dataBinding[`${bindingName}Avg`] = new Observable(0);
        this.widgets = [
            new UITripleWidget(UIWC, 'row-3', bindingName, icon, icon, icon, unit, `${bindingName}Min`, `${bindingName}Max`, `${bindingName}Avg`)
        ]
        this[`${bindingName}MaxTemp`] = Number.NEGATIVE_INFINITY;
        this[`${bindingName}MinTemp`] = Number.POSITIVE_INFINITY;
        this[`${bindingName}AvgTemp`] = 0;

        this.graph = [];
    }

    resetData = () => 
    {
        this[`${bindingName}MaxTemp`]= Number.POSITIVE_INFINITY;
        this[`${bindingName}MinTemp`]= Number.NEGATIVE_INFINITY;
        this[`${bindingName}AvgTemp`]= 0;
    }
    //COMBAK: 
    // analyzePoint = (p) => { }
    // analyzeTransition = (p1, p2) => {
    //     let d = p1.haverSine(p2);                        /* [m] */
    //     let Δh = p2.heightDifference(p1);                /* [m] */

    //     if (d != 0) {
    //         let slope = Math.atan(Δh / d) * (180 / Math.PI); /* [°] */
    //         this.tempAvgSlope += slope;
    //         this.graph.push({ y: slope, x: p1.attributes.time })

    //         if (slope < this.tempMinSlope) this.tempMinSlope = slope;
    //         if (slope > this.tempMaxSlope) this.tempMaxSlope = slope;
    //     }
    // }
    // finalize = () => {
    //     this.dataBinding.maxSlope._value = this.tempMaxSlope.toFixed(2);
    //     this.dataBinding.minSlope._value = this.tempMinSlope.toFixed(2);
    //     this.dataBinding.avgSlope._value = (this.tempAvgSlope / this.graph.length).toFixed(2);
    // }
}

/* Dual attribute Analysis */
class GPXSlopeAnalysis extends GPXAnalysis
{
    constructor()
    {
        super();
        this.requiredAttributes = ['lat', 'lon', 'ele'];
        this.dataBinding.maxSlope = new Observable(0);
        this.dataBinding.minSlope = new Observable(0);
        this.dataBinding.avgSlope = new Observable(0);
        this.widgets = [
            new UITripleWidget(UIWC, 'row-3', 'slope', 'signal_cellular_null', 'signal_cellular_null', 'signal_cellular_null', '°', 'minSlope', 'maxSlope', 'avgSlope')
        ]
        this.tempMaxSlope = Number.NEGATIVE_INFINITY;
        this.tempMinSlope = Number.POSITIVE_INFINITY;
        this.tempAvgSlope = 0;

        this.graph = [];
    }

    resetData = () =>
    {
        this.tempMinSlope = Number.POSITIVE_INFINITY;
        this.tempMaxSlope = Number.NEGATIVE_INFINITY;
        this.tempAvgSlope = 0;
    }
    analyzePoint = (p) => { }
    analyzeTransition = (p1, p2) =>
    {
        let d = p1.haverSine(p2);                        /* [m] */
        let Δh = p2.heightDifference(p1);                /* [m] */

        if (d != 0)
        {
            let slope = Math.atan(Δh / d) * (180 / Math.PI); /* [°] */
            this.tempAvgSlope += slope;
            this.graph.push({ y: slope, x: p1.attributes.time })

            if (slope < this.tempMinSlope) this.tempMinSlope = slope;
            if (slope > this.tempMaxSlope) this.tempMaxSlope = slope;
        }
    }
    finalize = () =>
    {
        this.dataBinding.maxSlope._value = this.tempMaxSlope.toFixed(2);
        this.dataBinding.minSlope._value = this.tempMinSlope.toFixed(2);
        this.dataBinding.avgSlope._value = (this.tempAvgSlope / this.graph.length).toFixed(2);
    }
}

class GPXPaceAnalysis extends GPXAnalysis
{
    constructor()
    {
        super();
        this.requiredAttributes = ['lat', 'lon', 'time'];
        this.dataBinding.maxPace = new Observable(0);
        this.dataBinding.minPace = new Observable(0);
        this.dataBinding.avgPace = new Observable(0);
        this.widgets = [
            new UITripleWidget(UIWC, 'row-3', 'pace', 'speed', 'speed', 'speed', 'm/s', 'minPace', 'maxPace', 'avgPace')
        ]
        this.tempMaxPace = Number.NEGATIVE_INFINITY;
        this.tempMinPace = Number.POSITIVE_INFINITY;
        this.tempAvgPace = 0;

        this.graph = [];
    }

    resetData = () =>
    {
        this.tempMaxPace = Number.NEGATIVE_INFINITY;
        this.tempMinPace = Number.POSITIVE_INFINITY;
        this.tempAvgPace = 0;
    }
    analyzePoint = (p) => { }
    analyzeTransition = (p1, p2) =>
    {
        let d = p1.haverSine(p2);       /* [m] */
        let Δt = p2.timeDifference(p1); /* [s] */

        if (d != 0)
        {
            let pace = d / Δt; /* [m/s] */
            this.graph.push({ y: pace, x: p1.attributes.time })
            this.tempAvgPace += pace;

            if (pace < this.tempMinPace) this.tempMinPace = pace;
            if (pace > this.tempMaxPace) this.tempMaxPace = pace;
        }
    }
    finalize = () =>
    {
        this.dataBinding.maxPace._value = this.tempMaxPace.toFixed(2);
        this.dataBinding.minPace._value = this.tempMinPace.toFixed(2);
        this.dataBinding.avgPace._value = (this.tempAvgPace / this.graph.length).toFixed(2);
    }
}

class GPXVertPaceAnalysis extends GPXAnalysis
{
    constructor()
    {
        super();
        this.requiredAttributes = ['ele', 'time'];
        this.dataBinding.maxVertSpeed = new Observable(0);
        this.dataBinding.minVertSpeed = new Observable(0);
        this.dataBinding.avgVertSpeed = new Observable(0);
        this.widgets = [
            new UITripleWidget(UIWC, 'row-3', 'vertical speed', 'call_made', 'call_made', 'call_made', 'm/s', 'minVertSpeed', 'maxVertSpeed', 'avgVertSpeed')
        ]
        this.tempMaxVertSpeed = Number.NEGATIVE_INFINITY;
        this.tempMinVertSpeed = Number.POSITIVE_INFINITY;
        this.tempAvgVertSpeed = 0;

        this.graph = [];
    }

    resetData = () =>
    {
        this.tempMaxVertSpeed = Number.NEGATIVE_INFINITY;
        this.tempMinVertSpeed = Number.POSITIVE_INFINITY;
        this.tempAvgVertSpeed = 0;
    }
    analyzePoint = (p) => { }
    analyzeTransition = (p1, p2) =>
    {
        /* TODO: Currently just summing Up & Downwards vertical speed - doesn't say too much */
        let Δh = Math.abs(p2.heightDifference(p1));    /* [m] */
        let Δt = p2.timeDifference(p1);                /* [s] */

        if (Δh != 0 && Δt != 0 )
        {
            let vertSpeed = Δh / Δt; /* [m/s] */

            this.graph.push({ y: vertSpeed, x: p1.attributes.time })
            this.tempAvgVertSpeed += vertSpeed;

            if (vertSpeed < this.tempMinVertSpeed) this.tempMinVertSpeed = vertSpeed;
            if (vertSpeed > this.tempMaxVertSpeed) this.tempMaxVertSpeed = vertSpeed;
        }
    }
    finalize = () =>
    {
        this.dataBinding.maxVertSpeed._value = this.tempMaxVertSpeed.toFixed(2);
        this.dataBinding.minVertSpeed._value = this.tempMinVertSpeed.toFixed(2);
        this.dataBinding.avgVertSpeed._value = (this.tempAvgVertSpeed / this.graph.length).toFixed(2);
    }
}

/* Triple attribute Analysis */
class GPXEnergyAnalysis extends GPXAnalysis
{
    constructor()
    {
        super();
        this.requiredAttributes = ['lat', 'lon', 'time', 'ele'];
        this.dataBinding.energy = new Observable(0);
        this.widgets = [new UISingleWidget(UIWC, 'square-2', 'total energy', 'local_fire_department', 'kcal', 'energy',
            `According to "Estimating Energy Expenditure during Level, Uphill, and Downhill Walking" < br >
            <i>https://pubmed.ncbi.nlm.nih.gov/30973477/</i>`)];
        this.temp = 0;

        this.graph = [];
    }

    resetData = () => { this.temp = 0; }
    analyzePoint = (p) => { }
    analyzeTransition = (p1, p2) =>
    {
        let d = p1.haverSine(p2);         /* [m] */
        let Δh = p2.heightDifference(p1); /* [m] */
        let Δt = p2.timeDifference(p1);   /* [s] */

        if (d != 0)
        {
            let v = d / Δt;                       /* [m/s] */
            let ii = gradient(d, Δh);             /* [%] */
            let ee = expendedEnergyHiking(v, ii); /* Energy expenditure is a per-hour value */
            ee = ee / (60 * 60) * Δt;             /* Divide by 3600 [s/hr] and multiply with the amount of time passed */
            let e = wattPerKilogramToKcal(ee) * (personData.weight + personData.additionalWeight); /* Get kaloric expense for the current transition */

            this.temp += e;
            this.graph.push({ y: e, x: p1.attributes.time });
        }
    }
    finalize = () => { this.dataBinding.energy._value = this.temp.toFixed(2); }
}

class GPXPowerAnalysis extends GPXAnalysis
{
    constructor()
    {
        super();
        this.requiredAttributes = ['lat', 'lon', 'time', 'ele'];
        this.dataBinding.maxPower = new Observable(0);
        this.dataBinding.minPower = new Observable(0);
        this.dataBinding.avgPower = new Observable(0);
        this.widgets = [
            new UITripleWidget(UIWC, 'row-3', 'power', 'power', 'power', 'power', 'w', 'minPower', 'maxPower', 'avgPower')
        ]
        this.tempMaxPower = Number.NEGATIVE_INFINITY;
        this.tempMinPower = Number.POSITIVE_INFINITY;
        this.tempAvgPower = 0;

        this.graph = [];
    }

    resetData = () =>
    {
        this.tempMaxPower = Number.NEGATIVE_INFINITY;
        this.tempMinPower = Number.POSITIVE_INFINITY;
        this.tempAvgPower = 0;
    }
    analyzePoint = (p) => { }
    analyzeTransition = (p1, p2) =>
    {
        let d = p1.haverSine(p2);         /* [m] */
        let Δh = p2.heightDifference(p1); /* [m] */
        let Δt = p2.timeDifference(p1);   /* [s] */

        if (d != 0)
        {
            let v = d / Δt;                       /* [m/s] */
            let ii = gradient(d, Δh);             /* [%] */
            let ee = expendedEnergyHiking(v, ii); /* Energy expenditure is a per-hour value */
            ee = ee / (60 * 60) * Δt;             /* Divide by 3600 [s/hr] and multiply with the amount of time passed */
            let p = (ee * (personData.weight + personData.additionalWeight)); /* Get power for the current transition  [w] */

            this.tempAvgPower += p;
            this.graph.push({ y: p, x: p1.attributes.time });

            if (p < this.tempMinPower) this.tempMinPower = p;
            if (p > this.tempMaxPower) this.tempMaxPower = p;
        }
    }
    finalize = () =>
    {
        this.dataBinding.maxPower._value = this.tempMaxPower.toFixed(2);
        this.dataBinding.minPower._value = this.tempMinPower.toFixed(2);
        this.dataBinding.avgPower._value = (this.tempAvgPower / this.graph.length).toFixed(2);
    }
}


/*
 * Helper functions
 */

/* d = distance [meters], Δh = height difference [meters], returns gradient [%]*/
const gradient = (d, Δh) => { return 100 * (Δh / d); }

/* wpkg = watts per kg [w/kg], returns kcal */
const wattPerKilogramToKcal = (wpkg) => { return wpkg * 0.860; }

/* i = gradient [0.5 = 50%], v = speed [meters/second], returns energetic expenditure [w/kg] per hour */
const expendedEnergyHiking = (v, i) =>
{
    /* According to:
    "Estimating Energy Expenditure during Level, Uphill, and Downhill Walking"
    by David P. Looney, William R. Santee, Eric O. Hansen, Peter J. Bonventre, Christopher R. Chalmers, Adam W. Potter, Sept 2019
    https://pubmed.ncbi.nlm.nih.gov/30973477/ */
    return 1.44 + 1.94 * Math.pow(v, 0.43) +
        0.24 * Math.pow(v, 4) +
        0.34 * v * i * (1 - Math.pow(1.05, 1 - Math.pow(1.11, i + 32)));
}
