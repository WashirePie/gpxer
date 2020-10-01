/*
Analysis Type           Req. Attributes      
═══════════════════════════════════════════════════════════
total distance			lat lon
───────────────────────────────────────────────────────────
total duration  	    time
───────────────────────────────────────────────────────────
elevation			    ele                     chart
max. elevation			ele
min. elevation			ele
ascent				    ele
descent				    ele
───────────────────────────────────────────────────────────
slope				    lat lon ele		        chart
max. slope			    lat lon ele
min. slope			    lat lon ele
avg. slope			    lat lon ele
───────────────────────────────────────────────────────────
vert pace			    ele time		        chart
avg. vert pace			ele time
max. vert pace			ele time
min. vert pace			ele time
───────────────────────────────────────────────────────────
pace				    lat lon time		    chart
avg. pace			    lat lon time
max. pace			    lat lon time
min. pace			    lat lon time
───────────────────────────────────────────────────────────
energy				    lat lon time ele	    chart
total energy 			lat lon time ele
───────────────────────────────────────────────────────────
power (w)   		    lat lon time ele 	    chart
avg. power (w)	        lat lon time ele
max. power (w)	        lat lon time ele
min. power (w)	        lat lon time ele
───────────────────────────────────────────────────────────
*/

class GPXAnalysisBuilder
{
    static build = (points) =>
    {
        let analyzers = [];
        let widgets = [];
        let datasets = [];

        let hasEle =  points.filter(p => p.attributes.hasOwnProperty('ele'))?.length  > points.length * 0.9;
        let hasLat =  points.filter(p => p.attributes.hasOwnProperty('lat'))?.length  > points.length * 0.9;
        let hasLon =  points.filter(p => p.attributes.hasOwnProperty('lon'))?.length  > points.length * 0.9;
        let hasTime = points.filter(p => p.attributes.hasOwnProperty('time'))?.length > points.length * 0.9;
        let hasLatLon = hasLat && hasLon;

        if (hasEle)    
        {
            const bindingName = 'elevation';
            const unit = 'm';

            let a = new GPXMinMaxGainLossAnalysis(bindingName, 'ele');
            let w = new UIQuadWidget(UIWC, 'span-1 row-2', bindingName, 'arrow_upward', unit, `${bindingName}Min`, `${bindingName}Max`, `${bindingName}Gain`, `${bindingName}Loss`);
            let ds = new UIChartWidgetDataset(bindingName, unit, a.graph);

            widgets.push(w);
            analyzers.push(a);
            datasets.push(ds);
        }

        if (hasTime)
        {
            const bindingName = 'duration';

            let a = new GPXSumAnalysis(bindingName, (p1, p2) => { return p2.timeDifference(p1) }, (v) => { return secondsToDurationString(v); });
            let w = new UISingleWidget(UIWC, '', `total ${bindingName}`, 'watch_later', '', bindingName, 'hh:mm:ss.ms');

            widgets.push(w)
            analyzers.push(a);
        }  

        if (hasLatLon)
        {
            const bindingName = 'distance';

            let a = new GPXSumAnalysis(bindingName, (p1, p2, index, userData) => { return p1.haverSine(p2) / 1000 });
            let w = new UISingleWidget(UIWC, '', `total ${bindingName}`, 'settings_ethernet', 'km', bindingName, '');
            let w1 = new UITourPlotWidget(UIWC, 'tour plot', 500, 500);

            widgets.push(w, w1)
            analyzers.push(a);
        } 
        
        if (hasLatLon && hasEle) 
        {
            const bindingName = 'slope';
            const unit = '°';

            let a = new GPXMinMaxAverageAnalysis(bindingName, 
                (p1, p2, index, userData) =>
                {
                    let d = p1.haverSine(p2);                               /* [m] */
                    let Δh = p2.heightDifference(p1);                       /* [m] */
                    if (d != 0) return Math.atan(Δh / d) * (180 / Math.PI); /* [°] */
                }
            );
            let w = new UITripleWidget(UIWC, 'span-1 row-2', bindingName, 'signal_cellular_null', unit, `${bindingName}Min`, `${bindingName}Max`, `${bindingName}Avg`);
            let ds = new UIChartWidgetDataset(bindingName, unit, a.graph);

            widgets.push(w)
            analyzers.push(a);
            datasets.push(ds);
        }

        if (hasTime && hasEle)
        {
            const bindingName = 'verticalSpeed';
            const unit = 'm/s';

            let a = new GPXMinMaxAverageAnalysis(bindingName,
                (p1, p2, index, userData) =>
                {
                    /* TODO: Currently just summing Up & Downwards vertical speed - doesn't say too much */
                    let Δh = p2.heightDifference(p1);        /* [m] */
                    let Δt = p2.timeDifference(p1);          /* [s] */
                    if (Δh != 0 && Δt != 0 ) return Δh / Δt; /* [m/s] */
                }
            );
            let w = new UITripleWidget(UIWC, 'span-1 row-2', bindingName, 'call_made', unit, `${bindingName}Min`, `${bindingName}Max`, `${bindingName}Avg`);
            let ds = new UIChartWidgetDataset(bindingName, unit, a.graph);
            
            widgets.push(w)
            analyzers.push(a);
            datasets.push(ds);
        }

        if (hasTime && hasLatLon)
        {
            const bindingName = 'pace';
            const unit = 'm/s';

            let a = new GPXMinMaxAverageAnalysis(bindingName,
                (p1, p2, index, userData) =>
                {
                    let d = p1.haverSine(p2);       /* [m] */
                    let Δt = p2.timeDifference(p1); /* [s] */
                    if (d != 0) return d / Δt;      /* [m/s] */
                }
            );
            let w = new UITripleWidget(UIWC, 'span-1 row-2', bindingName, 'speed', unit, `${bindingName}Min`, `${bindingName}Max`, `${bindingName}Avg`);
            let ds = new UIChartWidgetDataset(bindingName, unit, a.graph);

            widgets.push(w)
            analyzers.push(a);
            datasets.push(ds);
        }

        if (hasLatLon && hasTime && hasEle) 
        {
            const bindingName = 'power';
            const unit = 'w/s';

            let a = new GPXMinMaxAverageAnalysis(bindingName,
                (p1, p2, index, userData) =>
                {
                    let d = p1.haverSine(p2);         /* [m] */
                    let Δh = p2.heightDifference(p1); /* [m] */
                    let Δt = p2.timeDifference(p1);   /* [s] */
                    
                    if (d != 0) 
                    {
                        let weight = userData.weight + userData.additionalWeight; /* [kg] */
                        let v = d / Δt;                       /* [m/s] */
                        let ii = gradient(d, Δh);             /* [%] */
                        let ee = expendedEnergyHiking(v, ii); /* Energy expenditure [(w/kg)/h] */
                            ee *= weight;                     /* [w/h] */
                            ee /= 3600;                       /* [w/s] */
                            // ee *= Δt                          /* [w] */ 
                            /* Could be misleading if multiplied by Δt, since Δt varies. A good example is if you pass f.e. trough a tunnel.
                            the next point may be a few hundred meters away and a few meters higher which will result in a huge power value therefore misleading the 
                            observer */
                        return ee; 
                    }
                }
            );

            let w = new UITripleWidget(UIWC, 'span-1 row-2', bindingName, 'power', unit, `${bindingName}Min`, `${bindingName}Max`, `${bindingName}Avg`);
            let ds = new UIChartWidgetDataset(bindingName, unit, a.graph);

            widgets.push(w)
            analyzers.push(a);
            datasets.push(ds);
        }

        if (hasLatLon && hasTime && hasEle)
        {
            const bindingName = 'energy';
            let a = new GPXSumAnalysis(bindingName, 
                (p1, p2, index, userData) => 
                {
                    let d = p1.haverSine(p2);         /* [m] */
                    let Δh = p2.heightDifference(p1); /* [m] */
                    let Δt = p2.timeDifference(p1);   /* [s] */

                    if (d != 0) 
                    {
                        let weight = userData.weight + userData.additionalWeight; /* [kg] */
                        let v = d / Δt;                       /* [m/s] */
                        let ii = gradient(d, Δh);             /* [%] */
                        let ee = expendedEnergyHiking(v, ii); /* Energy expenditure [(w/kg)/h] */
                            ee *= weight;                     /* [w/h] */
                            ee /= 4186.8;                     /* [kcal/s] (1kcal/s = 4186.8w or w/h) */
                            ee *= Δt;                         /* [kcal] */
                        return ee
                    } else return 0;
                }
            );

            let w = new UISingleWidget(UIWC, 'span-1 row-2', `total ${bindingName}`, 'local_fire_department', 'kcal', bindingName, `According to: 
                <a href="https://pubmed.ncbi.nlm.nih.gov/30973477/" target="_blank">"Estimating Energy Expenditure during Level, Uphill, and Downhill Walking"</a>
                by David P. Looney, William R. Santee, Eric O. Hansen, Peter J. Bonventre, Christopher R. Chalmers, Adam W. Potter, Sept 2019`);

            widgets.push(w)
            analyzers.push(a);
        }

        if (datasets.length) 
        {
            widgets.push(new UIChartWidget(UIWC, 'chart'));
        }

        return { analyzers: analyzers, widgets: widgets, datasets: datasets };
    }
}



/*
 * Base Class
 */
class GPXAnalysis
{
    constructor(title)
    {
        this.title = title;
        this.dataBinding = {};
        this.resetData = () => { }
        this.analyzeTransition = (p1, p2, index, userData) => { }
        this.finalize = () => { }
    }
    
}

class GPXSumAnalysis extends GPXAnalysis
{
    constructor(bindingName, transitionFunction, finalizerFunction = (v) => { return v.toFixed(2); })
    {
        super(bindingName);
        this.dataBinding[bindingName] = new Observable(0);

        this.resetData = () => 
        { 
            this.temp = 0; 
        }
        this.analyzeTransition = (p1, p2, index, userData) => 
        { 
            this.temp += transitionFunction.call(this, p1, p2, index, userData); 
        }
        this.finalize = () => 
        { 
            this.dataBinding[bindingName].value = finalizerFunction.call(this, this.temp); 
        }
    }
}

class GPXMinMaxAverageAnalysis extends GPXAnalysis
{
    constructor(bindingName, transitionFunction)
    {
        super(bindingName);
        this.dataBinding[`${bindingName}Max`] = new Observable(0);
        this.dataBinding[`${bindingName}Min`] = new Observable(0);
        this.dataBinding[`${bindingName}Avg`] = new Observable(0);
        this[`${bindingName}MaxTemp`];
        this[`${bindingName}MinTemp`];
        this[`${bindingName}AvgTemp`];
        this.graph;
        
        this.resetData = () => 
        {
            this[`${bindingName}MaxTemp`] = Number.NEGATIVE_INFINITY;
            this[`${bindingName}MinTemp`] = Number.POSITIVE_INFINITY;
            this[`${bindingName}AvgTemp`] = 0;
            this.graph = [];
        }
        this.analyzeTransition = (p1, p2, index, userData) => 
        {
            let value = transitionFunction.call(this, p1, p2, index, userData); 
            if (value != null)
            {
                if (value > this[`${bindingName}MaxTemp`]) this[`${bindingName}MaxTemp`] = value;
                if (value < this[`${bindingName}MinTemp`]) this[`${bindingName}MinTemp`] = value;
                this[`${bindingName}AvgTemp`] += value;

                /* Fallback to index if no time attribute is available */
                let x = p2.attributes.time ? p2.attributes.time : index;
                this.graph.push({ y: value, x: x });
            }        
        }
        this.finalize = () => 
        {
            this.dataBinding[`${bindingName}Max`].value =  this[`${bindingName}MaxTemp`].toFixed(2);
            this.dataBinding[`${bindingName}Min`].value =  this[`${bindingName}MinTemp`].toFixed(2);
            this.dataBinding[`${bindingName}Avg`].value = (this[`${bindingName}AvgTemp`] / this.graph.length).toFixed(2);
        }
    }
}


class GPXMinMaxGainLossAnalysis extends GPXAnalysis
{
    constructor(bindingName, attribute)
    {
        super(bindingName);
        this.dataBinding[`${bindingName}Max`] = new Observable(0);
        this.dataBinding[`${bindingName}Min`] = new Observable(0);
        this.dataBinding[`${bindingName}Gain`] = new Observable(0);
        this.dataBinding[`${bindingName}Loss`] = new Observable(0);
        this[`${bindingName}MaxTemp`];
        this[`${bindingName}MinTemp`];
        this[`${bindingName}GainTemp`];
        this[`${bindingName}LossTemp`];
        this.graph;
        
        this.resetData = () =>
        {
            this[`${bindingName}MaxTemp`]  = Number.NEGATIVE_INFINITY;
            this[`${bindingName}MinTemp`]  = Number.POSITIVE_INFINITY;
            this[`${bindingName}GainTemp`] = 0;
            this[`${bindingName}LossTemp`] = 0;
            this.graph = [];
        }
        this.analyzeTransition = (p1, p2, index, userData) =>
        {
            if (p1.attributes[attribute] > this[`${bindingName}MaxTemp`]) this[`${bindingName}MaxTemp`] = p1.attributes[attribute];
            if (p1.attributes[attribute] < this[`${bindingName}MinTemp`]) this[`${bindingName}MinTemp`] = p1.attributes[attribute];
            
            let Δ = p2.attributes[attribute] - p1.attributes[attribute];
            if (Δ > 0) this[`${bindingName}GainTemp`] += Δ;
            if (Δ < 0) this[`${bindingName}LossTemp`] += Δ;
            
            /* Fallback to index if no time attribute is available */
            let x = p2.attributes.time ? p2.attributes.time : index;
            let y = p2.attributes[attribute];

            /* Also add the first datapoint */
            if (!index)
            {
                let x0 = p1.attributes.time ? p1.attributes.time : index;
                this.graph.push({ y: p1.attributes[attribute], x: x0});
            }

            this.graph.push({ y: y, x: x });
        }
        this.finalize = () =>
        { 
            this.dataBinding[`${bindingName}Max`].value  = this[`${bindingName}MaxTemp`].toFixed(2);
            this.dataBinding[`${bindingName}Min`].value  = this[`${bindingName}MinTemp`].toFixed(2);
            this.dataBinding[`${bindingName}Gain`].value = this[`${bindingName}GainTemp`].toFixed(2);
            this.dataBinding[`${bindingName}Loss`].value = this[`${bindingName}LossTemp`].toFixed(2);
        }
    }
}


/*
 * Helper functions
 */

/* d = distance [meters], Δh = height difference [meters], returns gradient [%]*/
const gradient = (d, Δh) => { return 100 * (Δh / d); }

/* i = gradient [0.5 = 50%], v = speed [meters/second], returns energetic expenditure [w/kg]/[h] */
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

const secondsToDurationString = (secondsString) => 
{
    let ms = (secondsString % 1).toFixed(3).substring(2);

    secondsString = parseInt(secondsString.toFixed(), 10);

    let hours = Math.floor(secondsString / 3600);
    let minutes = Math.floor((secondsString - (hours * 3600)) / 60);
    let seconds = secondsString - (hours * 3600) - (minutes * 60);

    if (minutes < 10) minutes = `0${minutes}`;
    if (seconds < 10) seconds = `0${seconds}`;

    return `${hours}:${minutes}:${seconds}.${ms}`
}