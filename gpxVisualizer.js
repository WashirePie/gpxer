class GPXVisualizer 
{
    constructor(tour, colorPalette)
    {
        if (!Array.isArray(colorPalette)) { GPXConverter.e(`'colorPalette' must be an Array!`); return; }
        if (!colorPalette.every(c => c instanceof RGBAColor)) { GPXConverter.e(`insufficient data! Not every element in 'tour.content' has a 'time' property!`); return; }

        if (tour instanceof GPXRoute)         
        { 
            if (!(tour.content.every(o => o.attributes.hasOwnProperty('ele')))) { GPXConverter.e(`insufficient data! Not every element in 'tour.content' has a 'ele' property!`); console.log(tour.content.filter(o => !o.hasOwnProperty('ele'))); return; }
            if (!(tour.content.every(o => o.attributes.hasOwnProperty('time')))) { GPXConverter.e(`insufficient data! Not every element in 'tour.content' has a 'time' property!`); console.log(tour.content.filter(o => !o.hasOwnProperty('time'))); return; }
            if (!(tour.content.every(o => o.attributes.hasOwnProperty('lat')))) { GPXConverter.e(`insufficient data! Not every element in 'tour.content' has a 'lat' property!`); console.log(tour.content.filter(o => !o.hasOwnProperty('lat'))); return; }
            if (!(tour.content.every(o => o.attributes.hasOwnProperty('lon')))) { GPXConverter.e(`insufficient data! Not every element in 'tour.content' has a 'lon' property!`); console.log(tour.content.filter(o => !o.hasOwnProperty('lon'))); return; }
        }
        else if (tour instanceof GPXTrack)
        {
            if (!(tour.content.every(t => t.content.every(o => o.attributes.hasOwnProperty('ele'))))) { GPXConverter.e(`insufficient data! Not every element in 'tour.content[].content' has a 'ele' property!`);   console.log(tour.content.filter(t => t.content.filter(o => !o.hasOwnProperty('ele')))); return; }
            if (!(tour.content.every(t => t.content.every(o => o.attributes.hasOwnProperty('time'))))) { GPXConverter.e(`insufficient data! Not every element in 'tour.content[].content' has a 'time' property!`); console.log(tour.content.filter(t => t.content.filter(o => !o.hasOwnProperty('time')))); return; }
            if (!(tour.content.every(t => t.content.every(o => o.attributes.hasOwnProperty('lat'))))) { GPXConverter.e(`insufficient data! Not every element in 'tour.content[].content' has a 'lat' property!`); console.log(tour.content.filter(t => t.content.filter(o => !o.hasOwnProperty('lat')))); return; }
            if (!(tour.content.every(t => t.content.every(o => o.attributes.hasOwnProperty('lon'))))) { GPXConverter.e(`insufficient data! Not every element in 'tour.content[].content' has a 'lon' property!`); console.log(tour.content.filter(t => t.content.filter(o => !o.hasOwnProperty('lon')))); return; }
        }
        else
        {
            if (!tour) { GPXConverter.e(`'tour' must be instance of 'GPXTrack' or 'GPXRoute', but it's undefined!`); return;}
            GPXConverter.e(`'tour' must be instance of 'GPXTrack' or 'GPXRoute', but it's '${tour.constructor.name}'!`); return; 
        }
        
        this.colorPalette = colorPalette;
        this.tour = tour;
        this.graphics;
    }

    update = (p) =>
    {
        this.graphics = p.createGraphics(window.innerWidth, window.innerHeight * 1 / 2);
        this.graphics.background(0,0,0,0);

        /* Plot track */
        this.graphics.strokeWeight(1);
        this.graphics.noFill();

        let canvasSize = p.width > p.height ? p.height : p.width;
        let bounds = Object.assign(this.tour.getExtrema('ele'), this.tour.getExtrema('time'), this.tour.getExtrema('lat'), this.tour.getExtrema('lon'));

        
        /* Plot if it's a Route... */
        this.graphics.stroke(this.colorPalette[0].r, this.colorPalette[0].g, this.colorPalette[0].b);
        this.graphics.beginShape();
        if (this.tour instanceof GPXRoute) this.tour.content.forEach(rtept =>
        {
            let x = this.graphics.map(rtept.attributes.lon, bounds.minLon, bounds.maxLon, 0, canvasSize);
            let y = this.graphics.map(rtept.attributes.lat, bounds.minLat, bounds.maxLat, canvasSize, 0);
            this.graphics.vertex(x, y);

        });
        this.graphics.endShape();

        /* Plot if it's a Track... */
        if (this.tour instanceof GPXTrack) this.tour.content.forEach((trkseg, i) =>
        {
            this.graphics.stroke(this.colorPalette[i].r, this.colorPalette[i].g, this.colorPalette[i].b);
            this.graphics.beginShape();
            trkseg.content.forEach(trkpt =>
            {       
                let x = this.graphics.map(trkpt.attributes.lon, bounds.minLon, bounds.maxLon, 0, canvasSize);
                let y = this.graphics.map(trkpt.attributes.lat, bounds.minLat, bounds.maxLat, canvasSize, 0);
                this.graphics.vertex(x, y);
            });
            this.graphics.endShape();
        });

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

    asString(percent) 
    {
        let r = this.r * percent;
        let g = this.g * percent;
        let b = this.b * percent;
        let a = this.a;

        r = r > 255 ? 255 : r;
        g = g > 255 ? 255 : g;
        b = b > 255 ? 255 : b;

        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
}