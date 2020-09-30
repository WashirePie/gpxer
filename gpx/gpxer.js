class gpxer
{
    constructor(raw)
    {
        this.gpx = GPXConverter.parse(raw);

        this.userData = 
        {
            weight: 85,         /* [kg] */
            additionalWeight: 3 /* [kg] */
        };

        this.dataBindings =
        {
            appVersion: new Observable('v0.0.0 (beta)'),
            appTitle: new Observable('gpxer'),
            selectedTour: new Observable('null')
        };

        this.dataBindings.selectedTour.subscribe((v) => 
        { 
            // TODO: Find a way to reference the current gpxer instance instead of the global variable 'gpxv'!
            gpxv.selectedTour = gpxv.availableTours.find(t => t.tag == v).tour; 
        });
        
        this.availableTours = this.gpx.getTourList();
        this.currentAnalysis = this.availableTours[0].tour;

        /* Setup Header widget */
        let head = new UIAppInfoWidget(UIWC, '');
        let tours = this.gpx.getTourList();
        this.availableTours.forEach(tour => { head.addOption(tour.tag); });

        this.widgets = [head];

        this.switchTour();
    }

    set selectedTour (tour) { this.currentAnalysis = tour; this.switchTour(this.currentAnalysis); }
    get selectedTour ()     { return this.currentAnalysis; }

    switchTour = () =>
    {
        console.log(this.currentAnalysis);
        GPXType.typeCheck(this.currentAnalysis, ['GPXRoute', 'GPXTrack'], []);
        /* Retrieve GPXSurfaceType points from content */
        this.points = [];
        if (this.currentAnalysis instanceof GPXRoute) this.points = this.currentAnalysis.content;
        else this.currentAnalysis.content.forEach(seg => this.points = this.points.concat(seg.content));

        this.bounds = Object.assign(this.currentAnalysis.getExtrema('ele'), 
                                    this.currentAnalysis.getExtrema('time'), 
                                    this.currentAnalysis.getExtrema('lat'), 
                                    this.currentAnalysis.getExtrema('lon'));

        /* Retrieve capabilities */
        let capabilities = GPXAnalysisBuilder.build(this.points)

        this.analyzers = capabilities.analyzers;
        this.datasets = capabilities.datasets;
        this.widgets = this.widgets.concat(capabilities.widgets);

        /* Get and apply dataBindings */
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
            if (!obs) 
            {
                GPXConverter.w(`unused databinding in DOM: '${e.getAttribute('data-bind')}'`);
                console.warn(e);
            }
            else
            {
                if (e.tagName.toLocaleLowerCase() == 'input') bindValue(e, obs); /* Two-way binding */
                else if (e.tagName.toLocaleLowerCase() == 'select') bindSelectValue(e, obs); /* One-way (DOM->JS) */
                else bindInnerHTML(e, obs); /* One-way (JS->DOM) */
            }
        });
    }
}