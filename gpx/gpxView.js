class GPXView
{
    constructor(tour)
    {
        GPXType.typeCheck(tour, ['GPXRoute', 'GPXTrack'], []);

        /* Retrieve GPXSurfaceType points from content */
        this.points = [];
        if (tour instanceof GPXRoute) this.points = tour.content;
        else tour.content.forEach(seg => this.points = this.points.concat(seg.content));

        this.bounds = Object.assign(tour.getExtrema('ele'), tour.getExtrema('time'), tour.getExtrema('lat'), tour.getExtrema('lon'));

        /* Retrieve all possible analysis types */
        this.analyzers = GPXAnalysisBuilder.build(this.points)

        /* Call widget functions */
        this.analyzers.forEach(a =>
        {
            a.widgets.find(w => w instanceof UITourPlotWidget)?.plot(this.points, this.bounds);            
        })

        this.tourAnalysis();
    }



    tourAnalysis = () =>
    {
        this.analyzers.forEach(a => a.resetData());

        /* Evalutate transitions between points  */
        for (let i = 0; i < this.points.length; i++)
        {
            if (i < this.points.length - 1) 
                this.analyzers.forEach(a => a.analyzeTransition(this.points[i], this.points[i + 1], i));
        }

        this.analyzers.forEach(a => a.analyzeTransition(this.points[this.points.length - 2], this.points[this.points.length - 1]));
        this.analyzers.forEach(a => a.finalize());
    }
}


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