class GPXValidator
{
    constructor()
    {
        this.requiredAttributes = [];
        this.validData = [];
    }
}


class GPXHeadValidator extends GPXValidator 
{ 
    constructor()
    {
        super();
        this.validData = ["metadata", "wpt", "rte", "trk", "extensions", "version", "creator"]; 
        this.validData.push("xmlns", "xmlns:xsi", "xsi:schemaLocation", "xmlns:gpxx", "xmlns:rcxx", "xmlns:nmea")
    }
}


class GPXMetaValidator extends GPXValidator
{
    constructor()
    {
        super();
        this.validData = ["name", "desc", "author", "copyright", "link", "time", "keywords", "bounds", "extensions"]; 
    }
}


class GPXTrackValidator extends GPXValidator
{
    constructor()
    {
        super();
        this.validData = ["name", "cmt", "desc", "src", "link", "number", "type", "extensions", "trkseg"]; 
    }
}


class GPXTrackSegmentValidator extends GPXValidator
{
    constructor()
    {
        super();
        this.validData = ["trkpt", "extensions"]; 
    }
}



class GPXRouteValidator extends GPXValidator
{
    constructor()
    {
        super();
        this.validData = ["name", "cmt", "desc", "src", "link", "number", "type", "extensions", "rtept"]; 
    }
}


/* Applies for wpt, trkpt and rtept */
class GPXPointValidator extends GPXValidator
{
    constructor()
    {
        super();
        this.requiredAttributes = ["lat", "lon"];
        this.validData = ["ele", "time", "magvar", "geoidheight", "name", "cmt", "desc", "src", "link", "sym", "type", "fix", "sat", "hdop", "vdop", "pdop", "ageofdgpsdata", "dgpsid", "extensions", "lat", "lon"];
    }
}
