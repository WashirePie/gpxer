class GPXHikeAnalysis
{
    /* w = hiker weigh [kg], aw = additional weight (ex. Backpack) [kg], tour = GPXTrack || GPXRoute 
     div = HTML container for the canvas element */
    constructor(tour, div, w, aw, colorPalette)
    {
        let tourPoints = [];

        if (tour instanceof GPXRoute)         
        { 
            if (!(tour.content.every(o => o.attributes.hasOwnProperty('ele'))))  { GPXConverter.e(`insufficient data! Not every element in 'tour.content' has a 'ele' property!`); console.log(tour.content.filter(o => !o.hasOwnProperty('ele'))); return; }
            if (!(tour.content.every(o => o.attributes.hasOwnProperty('time')))) { GPXConverter.e(`insufficient data! Not every element in 'tour.content' has a 'time' property!`); console.log(tour.content.filter(o => !o.hasOwnProperty('time'))); return; }
            tourPoints = tour.content;
        }
        else if (tour instanceof GPXTrack)
        {
            if (!(tour.content.every(t => t.content.every(o => o.attributes.hasOwnProperty('ele')))))  { GPXConverter.e(`insufficient data! Not every element in 'tour.content' has a 'ele' property!`); console.log(tour.content.filter(t => !t.content.every(o => o.hasOwnProperty('ele')))); return; }
            if (!(tour.content.every(t => t.content.every(o => o.attributes.hasOwnProperty('time'))))) { GPXConverter.e(`insufficient data! Not every element in 'tour.content' has a 'time' property!`); console.log(tour.content.filter(t => !t.content.every(o => o.hasOwnProperty('time')))); return; }
            tour.content.forEach(t => tourPoints = [...tourPoints, ...t.content]);
        }
        else
        {
            if (!tour) { GPXConverter.e(`'tour' must be instance of 'GPXTrack' or 'GPXRoute', but it's undefined!`); return;}
            GPXConverter.e(`'tour' must be instance of 'GPXTrack' or 'GPXRoute', but it's '${tour.constructor.name}'!`); return; 
        }

        this.canvasElement = document.createElement('canvas');
        this.canvasElement.width = window.innerWidth;
        this.canvasElement.height = window.innerHeight * 1/2;

        div.appendChild(this.canvasElement);

        this.hikerWeight = w;
        this.additionalWeight = aw;
        this.colorPalette = colorPalette;
        this.tourPoints = tourPoints;
    }

    analyze = () =>
    {
        let kcal = 0;

        let elevationData  = [];
        let energyData     = [];
        let speedData      = [];
        let slopeData      = [];

        let chartLabels = [];

        /* Evalutate transitions between points  */
        for (let i = 0; i < this.tourPoints.length - 1; i++)
        {
            let d = this.tourPoints[i].haverSine(this.tourPoints[i + 1]); /* [m] */
            if (d != 0)
            {
                let Δh = this.tourPoints[i + 1].attributes.ele - this.tourPoints[i].attributes.ele; /* [m] */
                let Δt = (this.tourPoints[i + 1].attributes.time.getTime() - this.tourPoints[i].attributes.time.getTime()) / 1000; /* [s] */
                let v = d / Δt; /* [m/s] */
                let ii = GPXHikeAnalysis.gradient(d, Δh); /* [%] */
                let ee = GPXHikeAnalysis.expendedEnergyHiking(v, ii); /* Energy expenditure is a per-hour value */
                    ee /= 60 * 60; /* Divide by 3600 [s/hr] */
                    ee *= Δt;

                /* Get kaloric expense for the current transition */
                let e = GPXHikeAnalysis.wattPerKilogramToKcal(ee) * (this.hikerWeight + this.additionalWeight);

                kcal += e;

                chartLabels.push(this.tourPoints[i + 1].attributes.time);

                /* Collect chart data */
                elevationData.push(this.tourPoints[i + 1].attributes.ele);
                energyData.push(e / Δt);
                speedData.push(v);
                slopeData.push(Math.atan(Δh / d) * (180 / Math.PI));
            }
        }

        /* Create Chart Objects */
        let analysisChart = new GPXChart(this.canvasElement);

        /* Add Datasets */
        analysisChart.addDataset(elevationData, 40, chartLabels, 'Elevation',          '[m]',      'rgba(255, 171, 211, 0.7)', 'rgba(255, 171, 211, 1)', 2);
        analysisChart.addDataset(energyData,    40, chartLabels, 'Energy expenditure', '[kcal/s]', 'rgba(255, 201, 157, 0.7)', 'rgba(255, 201, 157, 1)', 2);
        analysisChart.addDataset(speedData,     40, chartLabels, 'Pace',               '[m/s]',    'rgba(197, 245, 183, 0.7)', 'rgba(197, 245, 183, 1)', 2);
        analysisChart.addDataset(slopeData,     40, chartLabels, 'Slope',              '[°]',      'rgba(188, 255, 233, 0.7)', 'rgba(188, 255, 233, 1)', 2);

        analysisChart.build();

        return kcal;
    }

    /* d = distance [meters], Δh = height difference [meters], returns gradient [%]*/
    static gradient = (d, Δh) => { return 100 * (Δh / d); }

    /* wpkg = watts per kg [w/kg], returns kcal */
    static wattPerKilogramToKcal = (wpkg) => { return wpkg * 0.860; }

    /* i = gradient [0.5 = 50%], v = speed [meters/second], returns energetic expenditure [w/kg] per hour */
    static expendedEnergyHiking = (v, i) =>
    {
        /* According to:
        "Estimating Energy Expenditure during Level, Uphill, and Downhill Walking"
        by David P. Looney, William R. Santee, Eric O. Hansen, Peter J. Bonventre, Christopher R. Chalmers, Adam W. Potter, Sept 2019
        https://pubmed.ncbi.nlm.nih.gov/30973477/ */
        return 1.44 + 1.94 * Math.pow(v, 0.43) +
                      0.24 * Math.pow(v, 4) +
                      0.34 * v * i * (1 - Math.pow(1.05, 1 - Math.pow(1.11, i + 32)));
    }
}

class GPXChart
{
    constructor(canvas)
    {
        this.canvas = canvas;

        this.chartObject = {};
        this.chartObject.type = 'scatter';
        this.chartObject.data = { datasets: [] };
        this.chartObject.options = {};
        this.chartObject.options.scales =
        {
            yAxes: [],
            xAxes: []
        };

        this.chartObject.options.legend =
        {
            onClick: function(e, legendItem)
            {
                let meta = this.chart.getDatasetMeta(legendItem.datasetIndex);
                let yAxis = this.chart.options.scales.yAxes.find(axis => axis.id == meta.yAxisID);

                /* Hide Y Axis when dataset gets hidden */
                meta.hidden = !meta.hidden;
                yAxis.ticks.display = !meta.hidden;

                this.chart.update();
            }
        }
    }

    addDataset = (rawData, resolution, rawLabels, label, unit, backgroundColor, borderColor, borderWidth = 1, pointRadius = 1) =>
    {
        if (!Array.isArray(rawData)) { GPXConverter.e(`'data' must be an array, but it's not!`); return; }

        let stepSize = Math.floor(rawData.length / resolution);
        let translatedData = []

        if (resolution < rawData.length) label = `Avg. ${label}`;

        for (let i = 0; i < resolution; i++)
        {
            let avg = 0;
            for (let y = 0; y < stepSize; y++) avg += rawData[i * stepSize + y];
            avg /= stepSize;

            translatedData.push({ x: rawLabels[i * stepSize], y: avg });
        }

        /* Add average of remainder aswell... */
        if (resolution * stepSize != rawData.length)
        {
            stepSize = rawData.length % resolution;
            let avg = 0;
            for (let y = 0; y < stepSize; y++) avg += rawData[resolution * stepSize + y];
            avg /= stepSize;

            translatedData.push({ x: rawLabels[rawData.length - 1], y: avg });
        }

        let yAxisId = `${label.replace(/\s/g, '')}_yID`;
        let xAxisId = `${label.replace(/\s/g, '')}_xID`;

        let datasetObject = {};

        datasetObject.label = `${label} ${unit}`;
        datasetObject.yAxisID = yAxisId;
        datasetObject.xAxisID = xAxisId;
        datasetObject.showLine = true;
        datasetObject.fill = true;
        datasetObject.data = translatedData;
        datasetObject.backgroundColor = [backgroundColor];
        datasetObject.borderColor = [borderColor];
        datasetObject.borderWidth = borderWidth;
        datasetObject.pointRadius = pointRadius;

        this.chartObject.options.scales.yAxes.push(
        {
            id: yAxisId,
            ticks:
            {
                display: true,
                beginAtZero: true,
                callback: function (value, index, values) { return `${value} ${unit}`; },
                fontColor: borderColor
            },
            type: 'linear',
            position: 'left'
        });        

        this.chartObject.options.scales.xAxes.push(
        {
            id: xAxisId,
            ticks:
            {
                display: this.chartObject.options.scales.xAxes.length == 0
            },
            type: 'time',
            position: 'bottom',
            time:
            {
                unit: 'minute'
            }
        });

        this.chartObject.data.datasets.push(datasetObject);
    }


    build = () =>
    {
        this.chart = new Chart(this.canvas, this.chartObject);
    }



    // static getMeanFromData = (data, meanResolution = 7, type = 'lerp') =>
    // {
    //     let stepSize = Math.floor(data.length / meanResolution);
    //     let r = [];

    //     for (let i = 0; i < meanResolution; i++)
    //     {
    //         let avg = 0;
    //         for (let y = 0; y < stepSize; y++) avg += data[i * stepSize + y];
    //         avg /= stepSize;

    //         r[i * stepSize] =  avg;
    //     }

    //     // r[data.length - 1] = 1e-10;
    //     r[data.length - 1] = data[data.length - 1];

    //     /* Polynomial / Linear interpolation to get the values in between.
    //     Map 'r' array to this format: [[x,y], [x,y], [x,y]...] and then
    //     reindex 'r' -> ( .filter(val => val) ). 'r' is unaltered */
    //     let f;
    //     if (type == 'lerp')            f = GPXChart.linearInterpolation((r.map((val, i) => [i, val]).filter(val => val)));
    //     else if (type == 'polynomial') f = GPXChart.polynomialInterpolation((r.map((val, i) => [i, val]).filter(val => val)));
    //     else if (type == 'nothing')    return r;
    //     else GPXConverter.e(`Unknown mean data generation type '${type}'! Use 'lerp' or 'polynomial'.`);

    //     for (let i = 0; i < data.length; i++)if (r[i] == null) r[i] = f(i);

    //     return r;
    // }


    // static polynomialInterpolation = (points) =>
    // {
    //     let n = points.length - 1, p;

    //     p = function (i, j, x)
    //     {
    //         if (i === j) return points[i][1];
    //         return ((points[j][0] - x) * p(i, j - 1, x) + (x - points[i][0]) * p(i + 1, j, x))  /  (points[j][0] - points[i][0]);
    //     }

    //     return function (x)
    //     {
    //         if (points.length === 0) return 0;
    //         return p(0, n, x);
    //     }
    // };


    // static linearInterpolation = (points) =>
    // {
    //     return function (x)
    //     {
    //         if (points.length === 0) return 0;
    //         let i = points.indexOf(points.find(p => p[0] > x));
    //         if (i === 0) return points[0][1];
    //         return (points[i][1]-points[i-1][1])/(points[i][0]-points[i-1][0]) * ( x - points[i-1][0]) + points[i-1][1];
    //     }
    // }
}
