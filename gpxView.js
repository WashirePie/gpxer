class GPXView
{
    constructor(tour)
    {
        this.personData = {
            weight: 87.5,
            additionalWeight: 3,
            age: 25
        };

        /* Generated with https://learnui.design/tools/data-color-picker.html */
        this.colorPalette = [
            RGBAColor.fromHEX('#ffa600'),
            RGBAColor.fromHEX('#ff7c43'),
            RGBAColor.fromHEX('#f95d6a'),
            RGBAColor.fromHEX('#d45087'),
            RGBAColor.fromHEX('#a05195'),
            RGBAColor.fromHEX('#665191'),
            RGBAColor.fromHEX('#2f4b7c'),
            RGBAColor.fromHEX('#003f5c')
        ];


        /*
         * Type Check
         * Tour plot requires: 'ele', 'time', 'lat', 'lon'
         * Tour analysis requires: 'ele', 'time'
         */

        GPXType.typeCheck(tour, ['GPXRoute', 'GPXTrack'], ['ele', 'time', 'lat', 'lon'])

        /* Retrieve GPXSurfaceType points from content */
        this.points = [];
        if (tour instanceof GPXRoute) this.points = tour.content;
        else tour.content.forEach(seg => this.points = this.points.concat(seg.content));

        this.bounds = Object.assign(tour.getExtrema('ele'), tour.getExtrema('time'), tour.getExtrema('lat'), tour.getExtrema('lon'));
        
        this.analysisChart = ui.getChartContext();
        this.tourPlotCanvas = ui.getTourPlotCanvasContext();
        
        this.analysisDatasets = [
            new UIDataset('elevation', 'Elevation', '[m]', this.colorPalette[1].asString(0.1), this.colorPalette[1].asString(1)),
            new UIDataset('energy', 'Energy', '[kcal]', this.colorPalette[2].asString(0.1), this.colorPalette[2].asString(1)),
            new UIDataset('power', 'Power', '[kcal/s]', this.colorPalette[3].asString(0.1), this.colorPalette[3].asString(1)),
            new UIDataset('pace', 'Pace', '[m/s]', this.colorPalette[4].asString(0.1), this.colorPalette[4].asString(1)),
            new UIDataset('slope', 'Slope', '[°]', this.colorPalette[5].asString(0.1), this.colorPalette[5].asString(1))
        ];

        this.analysisData = [
            { ascent:   new Observable(0) },
            { descent:  new Observable(0) },
            { energy:   new Observable(0) },
            { avgSlope: new Observable(0) },
            { avgPower: new Observable(0) }
        ];

        this.tourAnalysis();
        this.tourPlot();
        this.tourGUI();
    }


    tourGUI = () =>
    {
        /* Add dat.GUI Controls */
        let gui = new dat.GUI();

        let pf = gui.addFolder('Analysis Parameters');
        pf.add(this.personData, 'weight', 30, 150, 0.5).onFinishChange(() => { this.tourAnalysis(); });
        pf.add(this.personData, 'additionalWeight', 0, 100, 0.5).onFinishChange(() => { this.tourAnalysis(); });

        this.analysisChart.chart.data.datasets.forEach(ds => {
            let dsf = gui.addFolder(`${ds._title} Chart`);
            dsf.add(ds, 'dataResolution', 1, 60, 1).onFinishChange(() => { this.analysisChart.update(); })
            dsf.add(ds, 'borderWidth', 0, 10, 0.2).onFinishChange(() => { this.analysisChart.update(); })
            dsf.add(ds, 'pointRadius', 0, 10, 0.2).onFinishChange(() => { this.analysisChart.update(); })
            // dsf.addColor(ds, 'backgroundColor').onFinishChange(() => { this.analysisChart.update(); })
            dsf.addColor(ds, 'borderColor').onFinishChange(() => { this.analysisChart.update(); })
        });
    }


    tourPlot = () =>
    {
        let bufferSize = this.tourPlotCanvas.canvas.width;

        this.tourPlotCanvas.beginPath();
        this.tourPlotCanvas.strokeStyle = this.colorPalette[1].asHEXString();
        for (let i = 0; i < this.points.length - 1; i++)
        {
            let x = Math.floor( map(this.points[i].attributes.lon, this.bounds.minLon, this.bounds.maxLon, 0, bufferSize) );
            let y = Math.floor( map(this.points[i].attributes.lat, this.bounds.minLat, this.bounds.maxLat, bufferSize, 0) );

            this.tourPlotCanvas.moveTo(x, y);

            let x2 = Math.floor( map(this.points[i + 1].attributes.lon, this.bounds.minLon, this.bounds.maxLon, 0, bufferSize) );
            let y2 = Math.floor( map(this.points[i + 1].attributes.lat, this.bounds.minLat, this.bounds.maxLat, bufferSize, 0) );

            this.tourPlotCanvas.lineTo(x2, y2);
        }
        this.tourPlotCanvas.stroke();
    }


    tourAnalysis = () =>
    {
        /* get Chart Datasets */
        let elevationDataset = this.analysisDatasets.find(ds => ds._id == 'elevation');
        let energyDataset    = this.analysisDatasets.find(ds => ds._id == 'energy');
        let powerDataset     = this.analysisDatasets.find(ds => ds._id == 'power');
        let speedDataset     = this.analysisDatasets.find(ds => ds._id == 'pace');
        let slopeDataset     = this.analysisDatasets.find(ds => ds._id == 'slope');
        
        /* get Observable Data */
        let ascentData   = this.analysisData.find(d => d.hasOwnProperty('ascent') );
        let descentData  = this.analysisData.find(d => d.hasOwnProperty('descent'));
        let energyData   = this.analysisData.find(d => d.hasOwnProperty('energy'));
        let avgSlopeData = this.analysisData.find(d => d.hasOwnProperty('avgSlope'));
        let avgPowerData = this.analysisData.find(d => d.hasOwnProperty('avgPower'));

        /* Reset all previous analysisData / analysisDatasets */
        this.analysisDatasets.forEach(ds => ds._rawData = [] );
        this.analysisData.forEach(d => d[Object.keys(d)[0]]._value = 0);

        /* Evalutate transitions between points  */
        for (let i = 0; i < this.points.length; i++)
        {
            /* Transitions can only be analyzed until i + 1 */
            if (i < this.points.length - 1)
            {
                let d = this.points[i].haverSine(this.points[i + 1]);         /* [m] */
                let Δh = this.points[i + 1].heightDifference(this.points[i]); /* [m] */
                let Δt = this.points[i + 1].timeDifference(this.points[i]);   /* [s] */

                /* Sum ascent / descent */
                if (Δh > 0)      ascentData.ascent._value += Δh;
                else if (Δh < 0) descentData.descent._value += Δh;

                if (d != 0)
                {
                    let v = d / Δt;                                  /* [m/s] */
                    let ii = gradient(d, Δh);                        /* [%] */
                    let slope = Math.atan(Δh / d) * (180 / Math.PI); /* [°] */
                    let ee = expendedEnergyHiking(v, ii); /* Energy expenditure is a per-hour value */
                        ee /= 60 * 60; /* Divide by 3600 [s/hr] */
                        ee *= Δt;

                    /* Get kaloric expense for the current transition */
                    let e = wattPerKilogramToKcal(ee) * (this.personData.weight + this.personData.additionalWeight);
                    
                    avgSlopeData.avgSlope._value += slope;
                    avgPowerData.avgPower._value += e / Δt; 
                    energyData.energy._value += e;

                    /* Collect chart data */
                    powerDataset._rawData.push( { y: e / Δt, x: this.points[i].attributes.time, x2: this.points[i + 1].attributes.time });
                    energyDataset._rawData.push({ y: e,      x: this.points[i].attributes.time, x2: this.points[i + 1].attributes.time });
                    speedDataset._rawData.push( { y: v,      x: this.points[i].attributes.time, x2: this.points[i + 1].attributes.time });
                    slopeDataset._rawData.push( { y: slope,  x: this.points[i].attributes.time, x2: this.points[i + 1].attributes.time });
                }
            }

            elevationDataset._rawData.push({ y: this.points[i].attributes.ele, x: this.points[i].attributes.time });
        }

        /* Finalize analysisData */
        ascentData.ascent._value     = ascentData.ascent._value.toFixed(2);
        descentData.descent._value   = descentData.descent._value.toFixed(2);
        energyData.energy._value     = energyData.energy._value.toFixed(2);
        avgSlopeData.avgSlope._value = (avgSlopeData.avgSlope._value / slopeDataset._rawData.length).toFixed(2);
        avgPowerData.avgPower._value = (avgPowerData.avgPower._value / powerDataset._rawData.length).toFixed(2);

        /* Update analysisDatasets Chart */
        this.analysisDatasets.forEach(ds => ds._setData());
        
        this.analysisChart._removeDatasets();
        this.analysisChart._addDatasets(this.analysisDatasets)
        this.analysisChart.update();
    }
}


/*
 * GPX Analysis helper functions
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


/*
 * GPX Tour Plot helper functions
 */

const map = (n, start1, stop1, start2, stop2, withinBounds) =>
{
  const newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;

  if (!withinBounds) return newval;

  if (start2 < stop2) return constrain(newval, start2, stop2);
  else                return constrain(newval, stop2, start2);

}


const constrain = (n, low, high) => { return Math.max(Math.min(n, high), low); }


class RGBAColor
{
    constructor(r, g, b, a)
    {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    static fromRGBA = (rgba) =>
    {
        let re = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+(?:\.\d+)?)\s*\)$/
        let match = re.exec(rgba);

        if (!match) return null;
        else if (match[1] && match[2] && match[3] && match[4])
        {
            let r = parseInt(match[1], 10);
            let g = parseInt(match[2], 10);
            let b = parseInt(match[3], 10);
            let a = parseInt(match[4], 10);
            return new RGBAColor(r, g, b, a);
        }
        else return null;
    }

    static fromHEX = (str, alpha = 1) =>
    {
        let re = /^#([a-fA-F0-9][a-fA-F0-9])([a-fA-F0-9][a-fA-F0-9])?([a-fA-F0-9][a-fA-F0-9])?$/;
        let match = re.exec(str);

        if (!match) return null;
        else if (!match[2] && !match[3])
        {
            let c = parseInt(Number(`0x${match[1]}`), 10);
            return new RGBAColor(c, c, c, 1);
        }
        else if (match.length == 4)
        {
            let r = parseInt(Number(`0x${match[1]}`), 10);
            let g = parseInt(Number(`0x${match[2]}`), 10);
            let b = parseInt(Number(`0x${match[3]}`), 10);
            return new RGBAColor(r, g, b, alpha);
        }
        else return null;

    }

    asString(alpha = this.a, percent = 1)
    {
        let r = this.r * percent;
        let g = this.g * percent;
        let b = this.b * percent;

        r = r > 255 ? 255 : r;
        g = g > 255 ? 255 : g;
        b = b > 255 ? 255 : b;

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    asHEXString(percent = 1)
    {
        let r = this.r * percent;
        let g = this.g * percent;
        let b = this.b * percent;
        let a = this.a;

        r = r > 255 ? 255 : r;
        g = g > 255 ? 255 : g;
        b = b > 255 ? 255 : b;
        return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`
    }
}