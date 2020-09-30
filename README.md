# gpxer

**[WIP]**

Get useful data from gpx files and have them nicely presented.

> Written in pure, ES6 JavaScript.


## [Some insights on the GPX file Structure](#gpx-structure)

A gpx file is essentially a xml file which is structured to fit a specified [xsl schema](https://www.topografix.com/GPX/1/1/gpx.xsd)
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

To define some terms for the context of this app, the following are considered 'parent types'
```xml
<gpx>, <metadata>, <wpt>, <rte>, <rtept>, <trk>, <trkseg>, <trkpt> 
```

Next up 'param types' which must be wrapped by one of the parent types. There are - of course - some limitations, not all parent types
can contain any param type, this is handled in the xsl schema and also loosely implemented in this app.
```xml
<ele>4107.1</ele>
<cmt>Comment</cmt>
<magvar>0.12</magvar>
...
```

Finally, there are attributes for either the parent or param types. There are also limitations to which type can have which attributes.
```xml
<rtept lat="67.57"...
```

Since the gpx format is extensible, it's almost impossible to handle all types. The general params are handled tough.




## App Structure 🔨

todo...
