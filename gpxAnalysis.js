class GPXHikeAnalysis
{
    /* w = hiker weigh [kg], aw = additional weight (ex. Backpack) [kg], tour = GPXTrack || GPXRoute */
    constructor(w, aw, tour)
    {
        if (!(tour instanceof GPXRoute || tour instanceof GPXTrack))         { GPXConverter.e(`'tour' must be instance of 'GPXTrack' or 'GPXRoute', but it's '${tour.constructor.name}'!`); return; }
        if (!(tour.content.every(o => o.attributes.hasOwnProperty('ele'))))  { GPXConverter.e(`insufficient data! Not every element in 'tour.content' has a 'ele' property!`); return; }
        if (!(tour.content.every(o => o.attributes.hasOwnProperty('time')))) { GPXConverter.e(`insufficient data! Not every element in 'tour.content' has a 'time' property!`); return; }

        this.hikerWeight = w;
        this.additionalWeight = aw;
        this.tour = tour;

        /* Chart js data */
        this.chartLabels = [];
    }

    analyze = () =>
    {
        let kcal = 0;

        let elevationDataset  = GPXChartBuilder.createDataset('Elevation [m]',      'rgba(0, 0, 0, 0)', 'rgba(200, 100, 100, 1)');
        let energyDataset     = GPXChartBuilder.createDataset('Energy [kcal]',      'rgba(0, 0, 0, 0)', 'rgba(100, 200, 100, 1)');
        let energyMeanDataset = GPXChartBuilder.createDataset('Mean Energy [kcal]', 'rgba(0, 0, 0, 0)', 'rgba( 50, 100,  50, 1)');
        let speedDataset      = GPXChartBuilder.createDataset('Pace [m/s]',         'rgba(0, 0, 0, 0)', 'rgba(100, 100, 200, 1)');
        let speedMeanDataset  = GPXChartBuilder.createDataset('Mean Pace [m/s]',    'rgba(0, 0, 0, 0)', 'rgba( 50,  50, 100, 1)');
        let slopeDataset      = GPXChartBuilder.createDataset('Slope [°]',          'rgba(0, 0, 0, 0)', 'rgba(200, 200, 100, 1)');
        let slopeMeanDataset  = GPXChartBuilder.createDataset('Mean Slope [°]',     'rgba(0, 0, 0, 0)', 'rgba(100, 100,  50, 1)');

        this.chartLabels = [];

        /* Evalutate transitions between points  */
        for (let i = 0; i < this.tour.content.length - 1; i++)
        {
            let d = this.tour.content[i].haverSine(this.tour.content[i + 1]); /* [m] */
            if (d != 0)
            {
                let Δh = this.tour.content[i + 1].attributes.ele - this.tour.content[i].attributes.ele; /* [m] */
                let Δt = (this.tour.content[i + 1].attributes.time.getTime() - this.tour.content[i].attributes.time.getTime()) / 1000; /* [s] */
                let v = d / Δt; /* [m/s] */
                let ii = GPXHikeAnalysis.gradient(d, Δh); /* [%] */
                let ee = GPXHikeAnalysis.expendedEnergyHiking(v, ii); /* Energy expenditure is a per-hour value */
                ee /= 60 * 60; /* Divide by 3600 [s/hr] */
                ee *= Δt;

                /* Get kaloric expense for the current transition */
                let e = GPXHikeAnalysis.wattPerKilogramToKcal(ee) * (this.hikerWeight + this.additionalWeight);

                kcal += e;

                /* Make chart time labels */
                let timeObj = this.tour.content[i + 1].attributes.time;
                let hours = timeObj.getHours()   < 10 ? `0${timeObj.getHours()}`   : `${timeObj.getHours()}`;
                let mins  = timeObj.getMinutes() < 10 ? `0${timeObj.getMinutes()}` : `${timeObj.getMinutes()}`;
                let secs  = timeObj.getSeconds() < 10 ? `0${timeObj.getSeconds()}` : `${timeObj.getSeconds()}`;

                this.chartLabels.push(`${hours}:${mins}:${secs}`);

                /* Collect chart data */
                elevationDataset.data.push(this.tour.content[i + 1].attributes.ele);
                energyDataset.data.push(e);
                speedDataset.data.push(v);
                slopeDataset.data.push(((Math.atan(Δh / d) * (180 / Math.PI)).toFixed(2)));
            }
        }

        /* Create mean datasets */
        energyMeanDataset.data = GPXChartBuilder.getMeanFromDataset(energyDataset.data, 8);
        speedMeanDataset.data  = GPXChartBuilder.getMeanFromDataset(speedDataset.data, 8);
        slopeMeanDataset.data  = GPXChartBuilder.getMeanFromDataset(slopeDataset.data, 8);
        
        /* Create charts */
        GPXChartBuilder.createChart(energyChartCanvas, [energyDataset, energyMeanDataset], this.chartLabels);
        GPXChartBuilder.createChart(elevationChartCanvas, elevationDataset, this.chartLabels);
        GPXChartBuilder.createChart(paceChartCanvas, [speedDataset, speedMeanDataset], this.chartLabels);
        GPXChartBuilder.createChart(slopeChartCanvas, [slopeDataset, slopeMeanDataset], this.chartLabels);

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


class GPXChartBuilder
{
    static createChart(canv, ds, lbls)
    {
        if (!Array.isArray(ds)) ds = [ds];

        let chartOptions = {}

        chartOptions.type = 'line';
        chartOptions.data = { labels: lbls, datasets: ds}

        let yAxesOpt = [{ ticks: { beginAtZero: true } }];
        let xAxesOpt = [{
            afterTockToLabelConversion: function (data)
            {
                let xLabels = data.ticks;
                xLabels.forEach((label, i) => { if (i % 2 == 1) xLabels[i] = '' });
            }
        }];

        let scalesOpt = { yAxes: yAxesOpt, xAxes: xAxesOpt }

        chartOptions.options = { scales: scalesOpt }

        return new Chart(canv, chartOptions);
    }

    static createDataset(label, backgroundColor, borderColor, borderWidth = 1, pointRadius = 0)
    {
        let chartDataset = {};

        chartDataset.label = label;
        chartDataset.data = [];
        chartDataset.backgroundColor = [backgroundColor];
        chartDataset.borderColor = [borderColor];
        chartDataset.borderWidth = borderWidth;
        chartDataset.pointRadius = pointRadius;

        return chartDataset;
    }

    static getMeanFromDataset = (data, meanResolution = 7) =>
    {
        let stepSize = Math.floor(data.length / meanResolution);
        let r = [];

        for (let i = 0; i < meanResolution; i++)
        {
            let avg = 0;
            for (let y = 0; y < stepSize; y++) avg += data[i * stepSize + y];
            avg /= stepSize;

            r[i * stepSize] =  avg;
        }

        r[data.length - 1] = 1e-10;

        /* Polynomial interpolation to get the values in between.
        Map r array to this format: [[x,y], [x,y], [x,y]...] and then 
        reindex the array ( .filter(val => val) ). 'r' is unaltered */
        let f = GPXChartBuilder.polynomialInterpolation((r.map((val, i) => [i, val]).filter(val => val)));  

        for (let i = 0; i < data.length; i++)if (r[i] == null) r[i] = f(i);

        return r;
    }

    static polynomialInterpolation = (points) =>
    {
        let n = points.length - 1, p;

        p = function (i, j, x) 
        {
            if (i === j) return points[i][1];
            return ((points[j][0] - x) * p(i, j - 1, x) +
                    (x - points[i][0]) * p(i + 1, j, x)) /
                    (points[j][0] - points[i][0]);
        }

        return function (x) 
        {
            if (points.length === 0) return 0;
            return p(0, n, x);
        }
    };
}