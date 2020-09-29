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
        let widgets = []

        let hasEle =  points.filter(p => p.attributes.hasOwnProperty('ele'))?.length  > points.length * 0.9;
        let hasLat =  points.filter(p => p.attributes.hasOwnProperty('lat'))?.length  > points.length * 0.9;
        let hasLon =  points.filter(p => p.attributes.hasOwnProperty('lon'))?.length  > points.length * 0.9;
        let hasTime = points.filter(p => p.attributes.hasOwnProperty('time'))?.length > points.length * 0.9;
        let hasLatLon = hasLat && hasLon;

        if (hasEle)    
        {
            const bindingName = 'elevation'
            let a = new GPXMinMaxGainLossAnalysis(bindingName, 'ele');
            let w = new UIQuadWidget(UIWC, 'row-4', bindingName, 'arrow_drop_down', 'arrow_drop_up', 'arrow_upward', 'arrow_downward', 'm', `${bindingName}Min`, `${bindingName}Max`, `${bindingName}Gain`, `${bindingName}Loss`);
            let w1 = new UITourPlotWidget(UIWC, 'tour plot', 500, 500);
            widgets.push(w);
            widgets.push(w1);
            analyzers.push(a);
        }

        if (hasTime)
        {
            const bindingName = 'duration';
            let a = new GPXSumAnalysis(bindingName, (p1, p2) => { return p2.timeDifference(p1) })
            let w = new UISingleWidget(UIWC, '', `total ${bindingName}`, 'watch_later', 's', bindingName, '');
            widgets.push(w)
            analyzers.push(a);
        }  

        if (hasLatLon)
        {
            const bindingName = 'distance';
            let a = new GPXSumAnalysis(bindingName, (p1, p2) => { return p1.haverSine(p2) })
            let w = new UISingleWidget(UIWC, '', `total ${bindingName}`, 'settings_ethernet', 'm', bindingName, '');
            widgets.push(w)
            analyzers.push(a);
        } 
        
        //COMBAK: Redo same from here on
        if (hasLatLon && hasEle) 
        {
            analyzers.push(new GPXMinMaxAverageAnalysis('slope', '°', 'signal_cellular_null',
                (p1, p2) =>
                {
                    let d = p1.haverSine(p2);                               /* [m] */
                    let Δh = p2.heightDifference(p1);                       /* [m] */
                    if (d != 0) return Math.atan(Δh / d) * (180 / Math.PI); /* [°] */
                }
            ));
        }

        if (hasTime && hasEle)
        {
            analyzers.push(new GPXMinMaxAverageAnalysis('vertical-speed', 'm/s', 'call_made',
                (p1, p2) =>
                {
                    /* TODO: Currently just summing Up & Downwards vertical speed - doesn't say too much */
                    let Δh = p2.heightDifference(p1);        /* [m] */
                    let Δt = p2.timeDifference(p1);          /* [s] */
                    if (Δh != 0 && Δt != 0 ) return Δh / Δt; /* [m/s] */
                }
            ));
        }

        if (hasTime && hasLatLon)
        {
            analyzers.push(new GPXMinMaxAverageAnalysis('pace', 'm/s', 'speed',
                (p1, p2) =>
                {
                    let d = p1.haverSine(p2);       /* [m] */
                    let Δt = p2.timeDifference(p1); /* [s] */
                    if (d != 0) return d / Δt;      /* [m/s] */
                }
            ));
        }

        if (hasLatLon && hasTime && hasEle) 
        {
            analyzers.push(new GPXMinMaxAverageAnalysis('power', 'w', 'power',
                (p1, p2) =>
                {
                    let d = p1.haverSine(p2);         /* [m] */
                    let Δh = p2.heightDifference(p1); /* [m] */
                    let Δt = p2.timeDifference(p1);   /* [s] */

                    if (d != 0) 
                    {
                        let v = d / Δt;                       /* [m/s] */
                        let ii = gradient(d, Δh);             /* [%] */
                        let ee = expendedEnergyHiking(v, ii); /* Energy expenditure [(w/kg)/h] */
                        ee /= 60 * 60                         /* Divide by 3600 [s/hr] */
                        ee *= Δt;
                        return (ee * (personData.weight + personData.additionalWeight)); /* Get power for the current transition  [w] */
                    }
                }
            ));
        }

        if (hasLatLon && hasTime && hasEle)
        {
            const bindingName = 'energy';
            let a = new GPXSumAnalysis(bindingName, 
                (p1, p2) => 
                {
                    let d = p1.haverSine(p2);         /* [m] */
                    let Δh = p2.heightDifference(p1); /* [m] */
                    let Δt = p2.timeDifference(p1);   /* [s] */

                    if (d != 0) 
                    {
                        let v = d / Δt;                       /* [m/s] */
                        let ii = gradient(d, Δh);             /* [%] */
                        let ee = expendedEnergyHiking(v, ii); /* Energy expenditure is a per-hour value */
                        ee /= 60 * 60;                        /* Divide by 3600 [s/hr] */
                        ee *= Δt;
                        return wattToKcal(ee) * (personData.weight + personData.additionalWeight); /* Get kaloric expense for the current transition */
                    }
                }
            );

            let w = new UISingleWidget(UIWC, 'span-2', `total ${bindingName}`, 'local_fire_department', 'kcal', bindingName, `According to: "Estimating Energy Expenditure during Level, Uphill, and Downhill Walking"
                by David P. Looney, William R. Santee, Eric O. Hansen, Peter J. Bonventre, Christopher R. Chalmers, Adam W. Potter, Sept 2019
                <i>https://pubmed.ncbi.nlm.nih.gov/30973477/</i>`);

            widgets.push(w)
            analyzers.push(a);
        }

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
        this.dataBinding = {};
        this.widgets = [];

        this.resetData = () => { }
        this.analyzeTransition = (p1, p2) => { }
        this.finalize = () => { }
    }
    
}

class GPXSumAnalysis extends GPXAnalysis
{
    constructor(bindingName, transitionFunction)
    {
        super();
        this.dataBinding[bindingName] = new Observable(0);
        this.temp = 0;

        this.resetData    = ( ) => { this.temp = 0; }
        this.analyzeTransition = (p1, p2) => { this.temp += transitionFunction.call(this, p1, p2); }
        this.finalize     = ( ) => { this.dataBinding[bindingName]._value = this.temp.toFixed(2); }
    }
}

class GPXMinMaxGainLossAnalysis extends GPXAnalysis
{
    constructor(bindingName, attribute)
    {
        super();
        this.dataBinding[`${bindingName}Max`] = new Observable(0);
        this.dataBinding[`${bindingName}Min`] = new Observable(0);
        this.dataBinding[`${bindingName}Gain`] = new Observable(0);
        this.dataBinding[`${bindingName}Loss`] = new Observable(0);
        this[`${bindingName}MaxTemp`]  = Number.NEGATIVE_INFINITY;
        this[`${bindingName}MinTemp`]  = Number.POSITIVE_INFINITY;
        this[`${bindingName}GainTemp`] = 0;
        this[`${bindingName}LossTemp`] = 0;

        this.graph = [];

        this.resetData = () =>
        {
            this[`${bindingName}MaxTemp`]  = Number.NEGATIVE_INFINITY;
            this[`${bindingName}MinTemp`]  = Number.POSITIVE_INFINITY;
            this[`${bindingName}GainTemp`] = 0;
            this[`${bindingName}LossTemp`] = 0;
        }
        this.analyzeTransition = (p1, p2, i) =>
        {
            if (p1.attributes[attribute] > this[`${bindingName}MaxTemp`]) this[`${bindingName}MaxTemp`] = p1.attributes[attribute];
            if (p1.attributes[attribute] < this[`${bindingName}MinTemp`]) this[`${bindingName}MinTemp`] = p1.attributes[attribute];
            let Δ = p2.attributes[attribute] - p1.attributes[attribute];
            if (Δ > 0) this[`${bindingName}GainTemp`] += Δ;
            if (Δ < 0) this[`${bindingName}LossTemp`] += Δ;
            
            /* Fallback to index if no time attribute is available */
            let x = p1.attributes.time ? p1.attributes.time : i;
            this.graph.push({ y: p1.attributes[attribute], x: x });
        }
        this.finalize = () =>
        { 
            this.dataBinding[`${bindingName}Max`]._value  = this[`${bindingName}MaxTemp`].toFixed(2);
            this.dataBinding[`${bindingName}Min`]._value  = this[`${bindingName}MinTemp`].toFixed(2);
            this.dataBinding[`${bindingName}Gain`]._value = this[`${bindingName}GainTemp`].toFixed(2);
            this.dataBinding[`${bindingName}Loss`]._value = this[`${bindingName}LossTemp`].toFixed(2);
        }
    }
}


class GPXMinMaxAverageAnalysis extends GPXAnalysis
{
    constructor(bindingName, unit, icon, transitionFunction)
    {
        super();
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

        this.resetData = () => 
        {
            this[`${bindingName}MaxTemp`] = Number.NEGATIVE_INFINITY;
            this[`${bindingName}MinTemp`] = Number.POSITIVE_INFINITY;
            this[`${bindingName}AvgTemp`] = 0;
        }
        this.analyzeTransition = (p1, p2, i) => 
        {
            let value = transitionFunction.call(this, p1, p2); 
            if (value != null)
            {
                if (value > this[`${bindingName}MaxTemp`]) this[`${bindingName}MaxTemp`] = value;
                if (value < this[`${bindingName}MinTemp`]) this[`${bindingName}MinTemp`] = value;
                this[`${bindingName}AvgTemp`] += value;

                /* Fallback to index if no time attribute is available */
                let x = p1.attributes.time ? p1.attributes.time : i;
                this.graph.push({ y: value, x: x });
            }        
        }
        this.finalize = () => 
        {
            this.dataBinding[`${bindingName}Max`]._value =  this[`${bindingName}MaxTemp`].toFixed(2);
            this.dataBinding[`${bindingName}Min`]._value =  this[`${bindingName}MinTemp`].toFixed(2);
            this.dataBinding[`${bindingName}Avg`]._value = (this[`${bindingName}AvgTemp`] / this.graph.length).toFixed(2);
        }
    }
}

/*
 * Helper functions
 */

/* d = distance [meters], Δh = height difference [meters], returns gradient [%]*/
const gradient = (d, Δh) => { return 100 * (Δh / d); }

/* wpkg = watts per kg [w], returns [kcal] */
const wattToKcal = (wpkg) => { return wpkg * 0.860; }

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
