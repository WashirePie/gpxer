class GPXHikeAnalysis
{
    /* w = hiker weigh [kg], aw = additional weight (ex. Backpack) [kg], tour = GPXTrack || GPXRoute */
    constructor(w, aw, tour) 
    {
        if (!(tour instanceof GPXRoute || tour instanceof GPXTrack)) { GPXConverter.e(`'tour' must be instance of 'GPXTrack' or 'GPXRoute', but it's '${tour.constructor.name}'!`); return; }
        if (!(tour.content.every(o => o.attributes.hasOwnProperty('ele')))) { GPXConverter.e(`insufficient data! Not every element in 'tour.content' has a 'ele' property!`); return; }
        if (!(tour.content.every(o => o.attributes.hasOwnProperty('time')))) { GPXConverter.e(`insufficient data! Not every element in 'tour.content' has a 'time' property!`); return; }

        this.hikerWeight = w;
        this.additionalWeight = aw;
        this.tour = tour;
        
        /* Chart js data */
        this.chartLabels = [];
        this.chartDatasets = [];
    }

    analyze = () =>
    {
        let kcal = 0;

        let elevationDataset = new ChartDataset('Elevation [m]', 'rgba(0,0,0,0)', 'rgba(200,0,0,1)');
        let energyDataset = new ChartDataset('Energy [kcal]', 'rgba(0,0,0,0)', 'rgba(0,200,0,1)');
        let speedDataset = new ChartDataset('Pace [m/s]', 'rgba(0,0,0,0)', 'rgba(0,0,200,1)');
        
        this.chartLabels = [];
        this.chartDatasets = [];

        for (let i = 0; i < this.tour.content.length - 1; i++)
        {
            let d = this.tour.content[i].haverSine(this.tour.content[i + 1]); /* [m] */
            if (d != 0)
            {
                let Δh = this.tour.content[i + 1].attributes.ele - this.tour.content[i].attributes.ele; /* [m] */
                let Δt = (this.tour.content[i + 1].attributes.time.getTime() - this.tour.content[i].attributes.time.getTime()) / 1000; /* [s] */
                
                let v = d / Δt;

                let ii = GPXHikeAnalysis.gradient(d, Δh);
    
                /* Energy expenditure is a per-hour value */
                let ee = GPXHikeAnalysis.expendedEnergyHiking(v, ii);
                ee /= 60 * 60;
                ee *= Δt;

                let e = GPXHikeAnalysis.wattPerKilogramToKcal(ee) * (this.hikerWeight + this.additionalWeight);
                
                kcal += e;

                /* Log Data */
                // console.log(`Op[${i}]:`);
                // console.log(`          d     = ${d} meters`);
                // console.log(`          t     = ${Δt} seconds`);
                // console.log(`          Δh    = ${Δh} meters`);
                // console.log(`          v     = ${v} m/s`);
                // console.log(`          slope = ${ii} %`);
                // console.log(`          e     = ${e} kcal`);

                /* Collect Chart data */
                let timeObj = this.tour.content[i + 1].attributes.time;
                let hours = timeObj.getHours() < 10 ? `0${timeObj.getHours()}` : `${timeObj.getHours()}`;
                let mins = timeObj.getMinutes() < 10 ? `0${timeObj.getMinutes()}` : `${timeObj.getMinutes()}`;
                let secs = timeObj.getSeconds() < 10 ? `0${timeObj.getSeconds()}` : `${timeObj.getSeconds()}`;
                let timeString = `${hours}:${mins}:${secs}`
                
                this.chartLabels.push(timeString);
                elevationDataset.data.push(this.tour.content[i + 1].attributes.ele);
                energyDataset.data.push(e);
                speedDataset.data.push(v);
            }
        }

        this.chartDatasets.push(energyDataset);
        this.chartDatasets.push(elevationDataset);
        this.chartDatasets.push(speedDataset);

        return kcal;
    }

    /* d = distance [meters], Δh = height difference [meters], returns gradient [%]*/
    static gradient = (d, Δh) =>
    {
        // console.log(`Slope is ${((Math.atan(Δh / d) * (180 / Math.PI)).toFixed(2))}°`)
        return 100 * (Δh / d);
    }

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

    makeChart = (canvas) =>
    {
        new Chart(canvas, 
        {
            type: 'line',
            data:
            {
                labels: this.chartLabels,
                datasets: this.chartDatasets
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }],
                    xAxes: [{
                        afterTickToLabelConversion: function (data) {

                            var xLabels = data.ticks;

                            xLabels.forEach(function (labels, i) {
                                if (i % 2 == 1) {
                                    xLabels[i] = '';
                                }
                            });
                        }
                    }]   
                }
            }
        });
    }
}

class ChartDataset
{
    constructor(label, backgroundColor, borderColor, borderWidth = 1, pointRadius = 0)
    {
        this.label = label;
        this.data = [];
        this.backgroundColor = [backgroundColor];
        this.borderColor = [borderColor];
        this.borderWidth = borderWidth;
        this.pointRadius = pointRadius;
    }
}