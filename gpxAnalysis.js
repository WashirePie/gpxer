class GPXHikeAnalysis
{
    /* w = hiker weigh [kg], wbp = backpackweight [kg], tour = GPXTrack || GPXRoute */
    constructor(w, wbp, tour) 
    {
        if (!(tour instanceof GPXRoute || tour instanceof GPXTrack)) { GPXConverter.e(`'tour' must be instance of 'GPXTrack' or 'GPXRoute', but it's '${tour.consstructor.name}'!`); return; }
        if (!(tour.content.every(o => o.attributes.hasOwnProperty('ele')))) { GPXConverter.e(`insufficient data! Not every element in 'tour.content' has a 'ele' property!`); return; }
        if (!(tour.content.every(o => o.attributes.hasOwnProperty('time')))) { GPXConverter.e(`insufficient data! Not every element in 'tour.content' has a 'time' property!`); return; }

        this.hikerWeight = w;
        this.totalWeight = w + wbp;
        this.tour = tour;
    }

    analyze = () =>
    {
        let kcal = 0;

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

                let e = GPXHikeAnalysis.wattPerKilogramToKcal(ee) * this.totalWeight;

                console.log(`Op[${i}]:`);
                console.log(`          d     = ${d} meters`);
                console.log(`          t     = ${Δt} seconds`);
                console.log(`          Δh    = ${Δh} meters`);
                console.log(`          v     = ${v} m/s`);
                console.log(`          slope = ${ii} %`);
                console.log(`          e     = ${e} kcal`);

                kcal += e;
            }
        }

        return kcal;
    }

    /* d = distance [meters], Δh = height difference [meters], returns gradient [%]*/
    static gradient = (d, Δh) =>
    {
        console.log(`Slope is ${((Math.atan(Δh / d) * (180 / Math.PI)).toFixed(2))}°`)
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
}