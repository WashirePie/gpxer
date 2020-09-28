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
        if (hasTime)                            analyzers.push(new GPXDurationAnalysis);
        if (hasLatLon)                          analyzers.push(new GPXDistanceAnalysis);
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
    constructor() 
    {
        this.requiredAttributes = []
        this.dataBinding = {};
        this.widgets = [];
    }

    resetData = () => { }
    analyzePoint = (p) => { }
    analyzeTransition = (p1, p2) => { }
    finalize = () => { }
}

/* Single attribute Analysis (except distance, but lat lon are considered one attribute) */
class GPXDistanceAnalysis extends GPXAnalysis 
{
    constructor()
    {
        super();
        this.requiredAttributes = ['lat', 'lon'];
        this.dataBinding.distance = new Observable(0);
        this.widgets = [new UISingleWidget(UIWC, '', 'total distance', 'equalizer', 'm', 'distance')];
        this.temp = 0;
    }

    resetData = () => { this.temp = 0; }
    analyzePoint = (p) => { }
    analyzeTransition = (p1, p2) => { this.temp += p1.haverSine(p2); }
    finalize = () => { this.dataBinding.distance._value = this.temp.toFixed(2); }
}

class GPXDurationAnalysis extends GPXAnalysis 
{
    constructor()
    {
        super();
        this.requiredAttributes = ['time'];
        this.dataBinding.duration = new Observable(0);
        this.widgets = [new UISingleWidget(UIWC, '', 'total duration', 'equalizer', 's', 'duration')];
        this.temp = 0;
    }

    resetData = () => { this.temp = 0; }
    analyzePoint = (p) => { }
    analyzeTransition = (p1, p2) => { this.temp += p2.attributes.time - p1.attributes.time }
    finalize = () => { this.dataBinding.duration._value = (this.temp / 1000).toFixed(2); }
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
            new UIQuadWidget(UIWC, 'row-4', 'elevation', 'equalizer', 'equalizer', 'equalizer', 'equalizer',
                             'm', 'minElevation', 'maxElevation', 'ascent', 'descent')
        ]
        this.tempMaxElevation = Number.NEGATIVE_INFINITY;
        this.tempMinElevation = Number.POSITIVE_INFINITY;
        this.tempAscent = 0;
        this.tempDescent = 0;
    }

    resetData = () =>
    {
        this.tempAscent = 0;
        this.tempDescent = 0;
        this.tempMinElevation = Number.POSITIVE_INFINITY;
        this.tempMaxElevation = Number.NEGATIVE_INFINITY;
    }
    analyzePoint = (p) => 
    {
        if (p.attributes.ele < this.tempMinElevation) this.tempMinElevation = p.attributes.ele; 
        if (p.attributes.ele > this.tempMaxElevation) this.tempMaxElevation = p.attributes.ele; 
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
            new UITripleWidget(UIWC, 'row-3', 'slope', 'equalizer', 'equalizer', 'equalizer', '°', 'minSlope', 'maxSlope', 'avgSlope')
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
            new UITripleWidget(UIWC, 'row-3', 'pace', 'equalizer', 'equalizer', 'equalizer', 'm/s', 'minPace', 'maxPace', 'avgPace')
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
            new UITripleWidget(UIWC, 'row-3', 'vertical speed', 'equalizer', 'equalizer', 'equalizer', 'm/s', 'minVertSpeed', 'maxVertSpeed', 'avgVertSpeed')
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
    }
}

class GPXPowerAnalysis extends GPXAnalysis 
{
    constructor()
    {
        super();
        this.requiredAttributes = ['lat', 'lon', 'time', 'ele'];
    }
}


// class GPXAnalysis
// {
//     /* w = hiker weigh [kg], aw = additional weight (ex. Backpack) [kg], tour = GPXTrack || GPXRoute 
//      div = HTML container for the canvas element */
//     constructor(tour, colorPalette, w, aw)
//     {
//         /* Type Check */
//         GPXType.typeCheck(tour, ['GPXRoute', 'GPXTrack'], ['ele', 'time'])
        
//         this.points = [];
//         if (tour instanceof GPXRoute) this.points = tour.content;
//         else tour.content.forEach(seg => this.points = this.points.concat(seg.content));

//         this.hikerWeight = w;
//         this.additionalWeight = aw;
//         this.colorPalette = colorPalette;

//         this.analysisData = [];
//     }


//     analyze = () =>
//     {
//         let elevationData = new GPXAnalysisDataset('elevation', 'Elevation', '[m]',      'rgba(255, 171, 211, 0.7)', 'rgba(255, 171, 211, 1)')
//         let energyData    = new GPXAnalysisDataset('energy',    'Energy',    '[kcal]',   'rgba(255, 171, 211, 0.7)', 'rgba(255, 171, 211, 1)')
//         let powerData     = new GPXAnalysisDataset('power',     'Power',     '[kcal/s]', 'rgba(255, 201, 157, 0.7)', 'rgba(255, 201, 157, 1)')
//         let speedData     = new GPXAnalysisDataset('pace',      'Pace',      '[m/s]',    'rgba(197, 245, 183, 0.7)', 'rgba(197, 245, 183, 1)')
//         let slopeData     = new GPXAnalysisDataset('slope',     'Slope',     '[°]',      'rgba(188, 255, 233, 0.7)', 'rgba(188, 255, 233, 1)')       
        
//         /* Evalutate transitions between points  */
//         for (let i = 0; i < this.points.length; i++)
//         {
//             /* Transitions can only be analyzed until i + 1 */
//             if (i < this.points.length - 1)
//             {
//                 let d = this.points[i].haverSine(this.points[i + 1]);         /* [m] */
//                 let Δh = this.points[i + 1].heightDifference(this.points[i]); /* [m] */
//                 let Δt = this.points[i + 1].timeDifference(this.points[i]);   /* [s] */
    
//                 if (d != 0)
//                 {
//                     let v = d / Δt;                                  /* [m/s] */
//                     let ii = this.gradient(d, Δh);                   /* [%] */
//                     let slope = Math.atan(Δh / d) * (180 / Math.PI); /* [°] */
//                     let ee = this.expendedEnergyHiking(v, ii); /* Energy expenditure is a per-hour value */
//                         ee /= 60 * 60; /* Divide by 3600 [s/hr] */
//                         ee *= Δt;
    
//                     /* Get kaloric expense for the current transition */
//                     let e = this.wattPerKilogramToKcal(ee) * (this.hikerWeight + this.additionalWeight);
    
//                     /* Collect chart data */
//                     powerData._rawData.push( { y: e / Δt, x: this.points[i].attributes.time, x2: this.points[i + 1].attributes.time });                
//                     energyData._rawData.push({ y: e,      x: this.points[i].attributes.time, x2: this.points[i + 1].attributes.time });                
//                     speedData._rawData.push( { y: v,      x: this.points[i].attributes.time, x2: this.points[i + 1].attributes.time });                
//                     slopeData._rawData.push( { y: slope,  x: this.points[i].attributes.time, x2: this.points[i + 1].attributes.time });                
//                 }
//             }

//             elevationData._rawData.push({ y: this.points[i].attributes.ele, x: this.points[i].attributes.time });
//         }

//         this.analysisData.push(elevationData);
//         this.analysisData.push(energyData);
//         this.analysisData.push(powerData);
//         this.analysisData.push(speedData);
//         this.analysisData.push(slopeData);
//     }
    
//     /* d = distance [meters], Δh = height difference [meters], returns gradient [%]*/
//     gradient = (d, Δh) => { return 100 * (Δh / d); }
    
//     /* wpkg = watts per kg [w/kg], returns kcal */
//     wattPerKilogramToKcal = (wpkg) => { return wpkg * 0.860; }
    
//     /* i = gradient [0.5 = 50%], v = speed [meters/second], returns energetic expenditure [w/kg] per hour */
//     expendedEnergyHiking = (v, i) =>
//     {
//         /* According to:
//         "Estimating Energy Expenditure during Level, Uphill, and Downhill Walking"
//         by David P. Looney, William R. Santee, Eric O. Hansen, Peter J. Bonventre, Christopher R. Chalmers, Adam W. Potter, Sept 2019
//         https://pubmed.ncbi.nlm.nih.gov/30973477/ */
//         return 1.44 + 1.94 * Math.pow(v, 0.43) +
//         0.24 * Math.pow(v, 4) +
//         0.34 * v * i * (1 - Math.pow(1.05, 1 - Math.pow(1.11, i + 32)));
//     }
// }





// class GPXChart extends Chart
// {
    
//     // static getMeanFromData = (data, meanResolution = 7, type = 'lerp') =>
//     // {
//     //     let stepSize = Math.floor(data.length / meanResolution);
//     //     let r = [];

//     //     for (let i = 0; i < meanResolution; i++)
//     //     {
//     //         let avg = 0;
//     //         for (let y = 0; y < stepSize; y++) avg += data[i * stepSize + y];
//     //         avg /= stepSize;

//     //         r[i * stepSize] =  avg;
//     //     }

//     //     // r[data.length - 1] = 1e-10;
//     //     r[data.length - 1] = data[data.length - 1];

//     //     /* Polynomial / Linear interpolation to get the values in between.
//     //     Map 'r' array to this format: [[x,y], [x,y], [x,y]...] and then
//     //     reindex 'r' -> ( .filter(val => val) ). 'r' is unaltered */
//     //     let f;
//     //     if (type == 'lerp')            f = GPXChart.linearInterpolation((r.map((val, i) => [i, val]).filter(val => val)));
//     //     else if (type == 'polynomial') f = GPXChart.polynomialInterpolation((r.map((val, i) => [i, val]).filter(val => val)));
//     //     else if (type == 'nothing')    return r;
//     //     else GPXConverter.e(`Unknown mean data generation type '${type}'! Use 'lerp' or 'polynomial'.`);

//     //     for (let i = 0; i < data.length; i++)if (r[i] == null) r[i] = f(i);

//     //     return r;
//     // }


//     // static polynomialInterpolation = (points) =>
//     // {
//     //     let n = points.length - 1, p;

//     //     p = function (i, j, x)
//     //     {
//     //         if (i === j) return points[i][1];
//     //         return ((points[j][0] - x) * p(i, j - 1, x) + (x - points[i][0]) * p(i + 1, j, x))  /  (points[j][0] - points[i][0]);
//     //     }

//     //     return function (x)
//     //     {
//     //         if (points.length === 0) return 0;
//     //         return p(0, n, x);
//     //     }
//     // };


//     // static linearInterpolation = (points) =>
//     // {
//     //     return function (x)
//     //     {
//     //         if (points.length === 0) return 0;
//     //         let i = points.indexOf(points.find(p => p[0] > x));
//     //         if (i === 0) return points[0][1];
//     //         return (points[i][1]-points[i-1][1])/(points[i][0]-points[i-1][0]) * ( x - points[i-1][0]) + points[i-1][1];
//     //     }
//     // }
// }
