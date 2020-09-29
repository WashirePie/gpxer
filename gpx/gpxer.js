class gpxer
{
    constructor(tour)
    {
        GPXType.typeCheck(tour, ['GPXRoute', 'GPXTrack'], []);

        /* Retrieve GPXSurfaceType points from content */
        this.points = [];
        if (tour instanceof GPXRoute) this.points = tour.content;
        else tour.content.forEach(seg => this.points = this.points.concat(seg.content));

        this.bounds = Object.assign(tour.getExtrema('ele'), tour.getExtrema('time'), tour.getExtrema('lat'), tour.getExtrema('lon'));

        this.userData = 
        {
            weight: 85,         /* [kg] */
            additionalWeight: 3 /* [kg] */
        };


        /* Setup Header widget */
        this.widgets = [new UIAppInfoWidget(UIWC, '')];
        
        /* Retrieve capabilities */
        let capabilities = GPXAnalysisBuilder.build(this.points)

        this.analyzers = capabilities.analyzers;
        this.datasets =  capabilities.datasets;
        this.widgets =   this.widgets.concat(capabilities.widgets);

        /* Get and apply dataBindings */
        this.dataBindings =
        {
            appVersion: new Observable('v0.0.0 (beta)'),
            appTitle: new Observable('gpxer')
        };
        this.analyzers.forEach(a => { if (a.dataBinding) Object.assign(this.dataBindings, a.dataBinding); });
        this.applyDataBindings();

        /* Execute */
        this.executeCapabilities();
    }


    executeCapabilities = () =>
    {
        /* Reset analyzers  */
        this.analyzers.forEach(a => a.resetData());

        /* Execute analyzers */
        for (let i = 0; i < this.points.length - 1; i++)
        {
            this.analyzers.forEach(a => a.analyzeTransition(this.points[i], this.points[i + 1], i, this.userData));
        }

        /* Update datasets */
        this.analyzers.forEach(a =>
        {
            let ds = this.datasets.find(ds => ds._title == a.title);
            if (ds) ds._rawData = a.graph;
        })

        /* Finalize analyzers */
        this.analyzers.forEach(a => a.finalize());

        /* Execute widget functions */
        this.widgets.forEach(w => 
        {
            if (w instanceof UITourPlotWidget) w.plot(this.points, this.bounds);
            if (w instanceof UIChartWidget) 
            {
                w.chart._removeDatasets();
                w.chart._addDatasets(this.datasets);
                w.chart.update();
            }
        });
    }

    applyDataBindings = () =>
    {
        document.querySelectorAll('[data-bind]').forEach(e => 
        {
            const obs = this.dataBindings[e.getAttribute('data-bind')];

            /* Currently, only Input elements support two-way bindings */
            if (e.tagName.toLocaleLowerCase == 'input') bindValue(e, obs);
            else bindInnerHTML(e, obs);
        });
    }
}