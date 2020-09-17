class GPXConverter 
{
    static e = (msg) => { console.error(`GPXConverter Error - ${msg}`); }
    static w = (msg) => { console.warn(`GPXConverter Warning - ${msg}`); }


    static parse = (gpxString) =>
    {
        const xmlParser = new DOMParser();

        let xml = xmlParser.parseFromString(gpxString, "text/xml");
        let converted = GPXConverter.walk(xml.getElementsByTagName('gpx')[0]);

        converted["RawGPX"] = xml;
        
        converted.getWaypoints = () => { return converted.content.find(o => o instanceof GPXWaypoint); }
        converted.getRoutes = () => { return converted.content.find(o => o instanceof GPXRoute); }
        converted.getTours = () => { return converted.content.find(o => o instanceof GPXTour); }

        return converted;
    }


    static walk = (element) =>
    {
        /* Get type and - if available - attributes */
        let obj = GPXBuilder.build(element);

        /* Skip, if an unkown element was found */
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
