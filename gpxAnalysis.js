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
