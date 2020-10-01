class GPXBuilder
{
    static build = (element) =>
    {
        switch (element.tagName) 
        {
            /* Main Types */
            case 'gpx':           return new GPXHead();
   
            case 'metadata':      return new GPXMetadata();
            case 'rte':           return new GPXRoute();
            case 'trk':           return new GPXTrack();
            case 'wpt':           return new GPXWaypoint();
   
            case 'trkseg':        return new GPXTrackSegment();
            case 'trkpt':         return new GPXTrackPoint();
   
            case 'rtept':         return new GPXRoutePoint();

            /* Params */
            case 'ele':           return new GPXElevationParam(parseFloat(element.innerHTML, 10));
            case 'time':          return new GPXTimeParam(new Date(element.innerHTML));
            case 'geoidheight':   return new GPXGeoIDHeightParam(element.innerHTML);
            case 'name':          return new GPXNameParam(element.innerHTML);
            case 'number':        return new GPXNumberParam(element.innerHTML);
            case 'magvar':        return new GPXMagvarParam(element.innerHTML);
            case 'cmt':           return new GPXCommentParam(element.innerHTML);
            case 'desc':          return new GPXDescriptionParam(element.innerHTML);
            case 'src':           return new GPXSourceParam(element.innerHTML);
            case 'link':          return new GPXLinkParam(element.innerHTML);
            case 'sym':           return new GPXSymbolParam(element.innerHTML);
            case 'type':          return new GPXTypeParam(element.innerHTML);
            case 'fix':           return new GPXFixParam(element.innerHTML);
            case 'sat':           return new GPXSatParam(element.innerHTML);
            case 'hdop':          return new GPXhDOPParam(element.innerHTML);
            case 'vdop':          return new GPXvDOPParam(element.innerHTML);
            case 'pdop':          return new GPXpDOPParam(element.innerHTML);
            case 'ageofdgpsdata': return new GPXAgeOfGPSDataParam(element.innerHTML);
            case 'dgpsid':        return new GPXdGPSiDParam(element.innerHTML);
            case 'extensions':    return new GPXExtensionsParam(element.innerHTML);
           
            default:
                GPXConverter.w(`unknown element <${element.tagName}> found. Skipping...`);
                return null;
        }
    }
}



class GPXAttributes 
{
    constructor(obj) { Object.assign(this, obj); }
}


/* 
 * Root Param 
 */
class GPXParam
{
    constructor(obj, name) 
    { 
        this.tagName = name;
        this[name] = obj;
        if (obj == "") GPXConverter.w(`empty ${this.constructor.name} with name '${this.tagName}' was created`);
    }

    validate = () => { }
}


class GPXElevationParam    extends GPXParam { constructor(obj) { super(obj, 'ele')          } }
class GPXTimeParam         extends GPXParam { constructor(obj) { super(obj, 'time')         } }
class GPXGeoIDHeightParam  extends GPXParam { constructor(obj) { super(obj, 'geoidheight')  } }
class GPXNameParam         extends GPXParam { constructor(obj) { super(obj, 'name')         } }
class GPXNumberParam       extends GPXParam { constructor(obj) { super(obj, 'number');      } }
class GPXMagvarParam       extends GPXParam { constructor(obj) { super(obj, 'magvar')       } }
class GPXCommentParam      extends GPXParam { constructor(obj) { super(obj, 'cmt')          } }
class GPXDescriptionParam  extends GPXParam { constructor(obj) { super(obj, 'desc')         } }
class GPXSourceParam       extends GPXParam { constructor(obj) { super(obj, 'src')          } }
class GPXLinkParam         extends GPXParam { constructor(obj) { super(obj, 'link')         } }
class GPXSymbolParam       extends GPXParam { constructor(obj) { super(obj, 'sym')          } }
class GPXTypeParam         extends GPXParam { constructor(obj) { super(obj, 'type')         } }
class GPXFixParam          extends GPXParam { constructor(obj) { super(obj, 'fix')          } }
class GPXSatParam          extends GPXParam { constructor(obj) { super(obj, 'sat')          } }
class GPXhDOPParam         extends GPXParam { constructor(obj) { super(obj, 'hdop')         } }
class GPXvDOPParam         extends GPXParam { constructor(obj) { super(obj, 'vdop')         } }
class GPXpDOPParam         extends GPXParam { constructor(obj) { super(obj, 'pdop')         } }
class GPXAgeOfGPSDataParam extends GPXParam { constructor(obj) { super(obj, 'ageofdgpsdata')} }
class GPXdGPSiDParam       extends GPXParam { constructor(obj) { super(obj, 'dgpsid')       } }
class GPXExtensionsParam   extends GPXParam { constructor(obj) { super(obj, 'extensions')   } }



/* 
 * Root Type 
 */
class GPXType
{
    constructor(validator)
    {
        this.attributes = {};
        this.validator = validator;
        this.values = [];
    }

    validate = () =>
    {
        /* Validate required attributes */
        this.validator.requiredAttributes.forEach(attr =>
        {
            if (!Object.keys(this.attributes).includes(attr)) 
            {
                GPXConverter.e(`element of type '${this.constructor.name}' is missing the attribute '${attr}'!`);
                console.table(this);
            }
        });

        /* Validate if all used .attributes are allowed */
        Object.keys(this.attributes).forEach(attr =>
        {
            if (!this.validator.validData.includes(attr))
            {
                GPXConverter.e(`element of type '${this.constructor.name}' contains an illegal attribute '${attr}'!`);
                console.table(this);
            }
        });

        /* Validate if all used .values are allowed */
        this.values.forEach(val =>
        {
            if (!this.validator.validData.includes(val.tagName))
            {
                GPXConverter.e(`element of type '${this.constructor.name}' contains an illegal element '${val.tagName}'!`);
                console.table(this);
            } 
        });
    }

    valuesToAttributes = () =>
    {
        for (let i = 0; i < this.values.length; i++)
        {
            let v = this.values[i];
            this.attributes[v.tagName] = v[v.tagName];
        }

        delete this.values;
    }

    // /* types: Array of allowed types ex.: ['GPXRoute']
    // attributes: ['ele', 'time', 'lat', 'lon'] */
    // static typeCheck = (obj, types, attributes = []) =>
    // {
    //     if (!obj) throw `(Type Check): 'obj' must be instance of '${types.join("', '")}', but it's undefined!`;

    //     /* Type Check */
    //     if (!types.some(type => obj instanceof eval(type))) GPXConverter.t(`(Type Check): 'obj' must be instance of '${types.join("', '")}', but it's '${obj.constructor.name}'!`);

    //     /* Check for inconsistent / incomplete GPXSurfaceTypes */
    //     if (!obj.hasOwnProperty('content')) 
    //     {
    //         GPXConverter.t(`(Type Check): Cannot execute attribute-check, 'obj' has no property 'content'!`);
    //     }
    //     else if ( obj.content.every(o => o.hasOwnProperty('content')) )
    //     {
    //         attributes.forEach(attribute =>
    //         {
    //             obj.content.forEach(cobj =>
    //             {                    
    //                 let inconsitent = cobj.content.filter(o => !(o.attributes.hasOwnProperty(attribute)));
    //                 if (inconsitent.length)
    //                 {
    //                     GPXConverter.w(`(Type Check): Inconsistent Data! ${inconsitent.length} of ${cobj.content.length} Points do not contain the attribute '${attribute}'`);
    //                     console.warn(inconsitent);
    //                     console.warn('Parent Object:');
    //                     console.warn(obj);
    //                 }
    //             });
    //         });
    //     }
    //     else
    //     {            
    //         attributes.forEach(attribute =>
    //         {
    //             let inconsitent = obj.content.filter(o => !(o.attributes.hasOwnProperty(attribute)));

    //             if (inconsitent.length)
    //             {
    //                 GPXConverter.w(`(Type Check): Inconsistent Data! ${inconsitent.length} of ${obj.content.length} Points do not contain the attribute '${attribute}'`);
    //                 console.warn(inconsitent);
    //             }
    //         });
    //     }

    //     return true;
    // }
}


class GPXParentType extends GPXType
{
    constructor(validator)
    {
        super(validator);
        this.content = [];
        this.analyzer = null;
        this.visualizer = null;
    }

    getExtrema = (attr) =>
    {
        let r = {};
        let propName = attr[0].toUpperCase() + attr.slice(1);

        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        
        if (this.content.every(o => o instanceof GPXParentType))
        {
            this.content.forEach(o =>
            {
                let current = o.getExtrema(attr);
                max = current[`max${propName}`] > max ? current[`max${propName}`] : max;
                min = current[`min${propName}`] < min ? current[`min${propName}`] : min;
            });
        }
        else
        {
            for (let i = 0; i < this.content.length; i++)
            {
                let current = this.content[i].attributes[attr];

                if (current > max) max = current;
                if (current < min) min = current;
            }
        }
    
        r[`max${propName}`] = max;
        r[`min${propName}`] = min; 

        return r;
    }

    getPoints = () =>
    {
        let points = [];
        if (this instanceof GPXRoute) points = this.content;
        else this.content.forEach(seg => points = points.concat(seg.content));
        return points;
    }
}


class GPXHead extends GPXParentType         
{ 
    constructor() 
    { 
        super(new GPXHeadValidator()); 
    } 
}


class GPXSurfaceType extends GPXType
{
    constructor()
    {
        super(new GPXPointValidator());
    }

    haverSine = (surfaceType) =>
    {
        if (!surfaceType instanceof GPXSurfaceType) { GPXConverter.e(`haverSine argument must be of type 'GPXSurfaceType'!`); return; }

        let lat1 = this.attributes.lat;
        let lat2 = surfaceType.attributes.lat;
        let lon1 = this.attributes.lon;
        let lon2 = surfaceType.attributes.lon;

        const R = 6371e3; /* Earth's radius in meters */
        const φ1 = lat1 * Math.PI / 180; /* φ, λ in radians */
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1)     * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const d = R * c; /* distance in meters */

        return d;
    }

    heightDifference = (surfaceType) =>
    {
        if (!surfaceType instanceof GPXSurfaceType) { GPXConverter.e(`heightDifference argument must be of type 'GPXSurfaceType'!`); return; }

        let Δh = this.attributes.ele - surfaceType.attributes.ele; /* [m] */
        return Δh; 
    }

    timeDifference = (surfaceType) =>
    {
        if (!surfaceType instanceof GPXSurfaceType) { GPXConverter.e(`timeDifference argument must be of type 'GPXSurfaceType'!`); return; }
        
        let Δt = (this.attributes.time.getTime() - surfaceType.attributes.time.getTime()) / 1000; /* [s] */
        return Δt 

    }
}


class GPXTrack extends GPXParentType        
{ 
    constructor() 
    { 
        super(new GPXTrackValidator());      
    } 
}


class GPXTrackSegment extends GPXParentType 
{ 
    constructor() 
    { 
        super(new GPXTrackSegmentValidator());      
    } 

}


class GPXRoute extends GPXParentType        
{ 
    constructor() 
    { 
        super(new GPXRouteValidator());      
    } 
}



class GPXMetadata extends GPXType           
{ 
    constructor() 
    { 
        super(new GPXMetaValidator());      
    } 
}


class GPXRoutePoint extends GPXSurfaceType { }
class GPXWaypoint   extends GPXSurfaceType { }
class GPXTrackPoint extends GPXSurfaceType { }


