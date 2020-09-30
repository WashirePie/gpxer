/* Adapter class for GPXHead */
class GPX 
{
    constructor(gpxHead, xml)
    {
        if (!gpxHead instanceof GPXHead) throw GPXConverter.e(`received an obj of type '${conv.constructor.name}' instead of 'GPXHead'!`);

        this.rawXml = xml;

        let waypoints = gpxHead.content.find(o => o instanceof GPXWaypoint); 
        let metadata = gpxHead.content.find(o => o instanceof GPXMetadata);
        let tracks = gpxHead.content.find(o => o instanceof GPXTrack);
        let routes = gpxHead.content.find(o => o instanceof GPXRoute);

        /* Only add properties if necessary */
        if (routes != undefined) this.routes = (!Array.isArray(routes)) ? [routes] : routes;
        if (tracks != undefined) this.tracks = (!Array.isArray(tracks)) ? [tracks] : tracks;
        if (waypoints != undefined) this.waypoints = (!Array.isArray(waypoints)) ? [waypoints] : waypoints;
        if (metadata != undefined) this.metadata = metadata;
    }

    getTourList = () =>
    {
        let list = [];

        if (this.hasOwnProperty('routes')) 
            this.routes.forEach((route, i) => 
            { 
                list.push({ tag: `Route ${i}, (${(route.getDistance / 1000).toFixed(2)}km)`, tour: route }) 
            });

        if (this.hasOwnProperty('tracks')) 
            this.tracks.forEach((track, i) => 
            { 
                list.push({ tag: `Track ${i}, (${(track.getDistance / 1000).toFixed(2)}km)`, tour: track }) 
            });

        return list;
    }
}


class GPXConverter 
{
    static e = (msg) => { console.error(`GPXConverter Error - ${msg}`); }
    static w = (msg) => { console.warn(`GPXConverter Warning - ${msg}`); }
    static t = (ex)  => { throw `GPXConverter Exception - ${ex}`; }


    static parse = (gpxString) =>
    {
        const xmlParser = new DOMParser();
        
        let xml = xmlParser.parseFromString(gpxString, "text/xml");
        let conv = GPXConverter.walk(xml.getElementsByTagName('gpx')[0]);

        return new GPX(conv, xml);
    }


    static walk = (element) =>
    {
        let obj = GPXBuilder.build(element);
        if (!obj) return null;

        obj.attributes = GPXConverter.attributesToObj(element);

        Array.from(element.children).forEach(child =>
        {   
            let cobj = GPXConverter.walk(child);

            switch (true) 
            {
                case !cobj: return;
                case cobj instanceof GPXParam:                                      obj.values.push(cobj);  break;
                case cobj instanceof GPXParentType && obj instanceof GPXParentType: obj.content.push(cobj); break;
                case cobj instanceof GPXType && obj instanceof GPXParentType:       obj.content.push(cobj); break;
                case cobj == {}: GPXConverter.e(`unknown child item '<${child.tagname}>'!`);
                default: 
                    GPXConverter.e(`element of type '${obj.constructor.name}' cannot contain '${cobj.constructor.name}'!`);
                    break;
            }
        });

        obj.validate();

        /* Turns .values properties into attributes and deletes .values property */
        if (obj.hasOwnProperty('valuesToAttributes')) obj.valuesToAttributes();

        return obj;
    }


    static attributesToObj = (el) =>
    {
        /* Get & Check the wanted elements attributes */
        let attr = Array.from(el.attributes);

        /* Form object from attributes */
        let obj = {};
        attr.forEach(attribute => { obj[attribute.name] = attribute.value; });

        return new GPXAttributes(obj);
    }
}
