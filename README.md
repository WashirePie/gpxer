# gpxer

Turn gpx strings into JS objects.
Written in pure, ES6 JavaScript. [p5.js](https://p5js.org/) was used for some minor visualizing tasks.


## General GPX Structure

```xml
  <gpx ...attribs>
      params
    <metadata ...attribs>
      params
    <wpt ...attribs>
      params
    <rte>
      params
      <rtept ...attribs>
        params
    <trk>
      params
      <trkseg>
        params
        <trkpt ...attribs>
          params
 ```
Checkout [this xsl schema](https://www.topografix.com/GPX/1/1/gpx.xsd) for a detailed ruleset.
These rules were applied in the following class (type) definitions.
At this point in time, the actual types of parameters (string, int etc.) is not handled.

That's something for future me to resolve.



## App Structure 

### [Main Types](#main-types)

The main gpx elements
```xml
<gpx>, <metadata>, <wpt>, <rte>, <rtept>, <trk>, <trkseg>, <trkpt> 
```
are converted to objects of
```js
    /* Base classes */
    class GPXType { ... }
    class GPXParentType extends GPXType { ... }
    class GPXSurfaceType extends GPXType { ... }

    /* Types */
    class GPXMetadata extends GPXType { ... }
    class GPXHead extends GPXParentType {... }
    class GPXTrack extends GPXParentType { ... }
    class GPXTrackSegment extends GPXParentType { ... }
    class GPXRoute extends GPXParentType { ... }
    class GPXRoutePoint extends GPXSurfaceType { }
    class GPXWaypoint extends GPXSurfaceType   { }
    class GPXTrackPoint extends GPXSurfaceType { }
```
Each Type contains a `GPXValidator` object, which is used
to validate the type.


### Params

### **[Deprecated]**
*As of now, params will be converted into properties in the `GPXAttributes` object property*

Secondary elements, which are standalone elements (in that they cannot contain any child elements ) such as: 
```xml
<ele>4107.1</ele>
<cmt>Comment</cmt>
<magvar>0.12</magvar>
...
```
are converted to objects of
```js
    /* Base class */
    class GPXParam { ... }

    /* Types */
    class GPXElevationParam extends GPXParam { ... }
    class GPXTimeParam extends GPXParam { ... }
    class GPXGeoIDHeightParam extends GPXParam { ... }
    class GPXNameParam extends GPXParam { ... }
    ...
```


### Attributes

Now, an XML element can contain attributes next to the `tagName`: 
```xml
<rtept lat="67.57"...
``` 
Such attributes are converted to an object of 
```js
    class GPXAttributes { ... }
```
This object is added as a property to the [Main Types](#main-types)
