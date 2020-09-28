const UIWC = document.getElementById('widgetContainer');

class UIController
{
    constructor()
    {
        /* Get relevant UI Elements */
        this.uiWidgetContainer = document.getElementById('widgetContainer');
        this.uiModalOverlayDiv = document.getElementById('modalOverlay');
        this.uiModalSelect = document.getElementById('modalSelect');
        this.uiModalMessage = document.getElementById('modalMessage');
        this.uiModalOptions = document.getElementById('modalOptions');
        this.uiModalAccept = document.getElementById('modalBtn');    

        /* Properties */
        this.dataBindings = {};

        this.widgets = [
            new UIAppInfoWidget(this.uiWidgetContainer, ''),
            new UITourPlotWidget(this.uiWidgetContainer, 'tour plot', 500, 500),
            new UIChartWidget(this.uiWidgetContainer, '')
        ]

        /* Hide App */
        this.uiWidgetContainer.style.display = 'none';

        /* Show modal */
        this.uiModalMessage.innerHTML = "Processing GPX...";
        this.uiModalOptions.style.display = 'none';
    }

    getTourPlotCanvasContext = () => { return this.widgets.find(widget => widget instanceof UITourPlotWidget).ctx; }
    getChartContext = () =>          { return this.widgets.find(widget => widget instanceof UIChartWidget).chart; }
  
    static getWidgetContainer = () => { return }

    applyExternalDataBindings = (bindings) =>
    {
        document.querySelectorAll('[data-bind]').forEach(e => 
        {
            const binding = bindings.find(b => b[e.getAttribute('data-bind')])
            const obs =     binding[e.getAttribute('data-bind')];

            /* Currently, only Input elements support two-way bindings */
            if (e.tagName.toLocaleLowerCase == 'input') bindValue(e, obs);
            else bindInnerHTML(e, obs);
        });
    }

    applyExternalDataBinding = (binding) =>
    {
        document.querySelectorAll('[data-bind]').forEach(e => 
        {
            const obs =     binding[e.getAttribute('data-bind')];

            /* Currently, only Input elements support two-way bindings */
            if (e.tagName.toLocaleLowerCase == 'input') bindValue(e, obs);
            else bindInnerHTML(e, obs);
        });
    }

    awaitUserChoice = async(gpxInfo, options) =>
    {
        options.forEach((option, i) =>
        {
            let optionElement = document.createElement('option');
            optionElement.innerHTML = option.tag;
            optionElement.value = option.tag;
            this.uiModalSelect.appendChild(optionElement);
        });

        /* Show modal content */
        this.uiModalMessage.innerHTML = `Loaded ${gpxInfo} <br>Please select the desired Tour.`
        this.uiModalOptions.style.display = 'flex';

        await waitListener(this.uiModalAccept, 'click');

        /* Hide modal */
        this.uiModalOverlayDiv.style.display = 'none';
        
        /* Show App */
        this.uiWidgetContainer.style.display = 'grid';

        let selectedOption = options.find(o => o.tag == this.uiModalSelect.options[this.uiModalSelect.selectedIndex].value);

        return Promise.resolve(selectedOption.tour);
    }

}


class UIDataset
{
    constructor(id, title, unit, backgroundColor, borderColor)
    {
        this._id = id;
        this._title = title;
        this._unit = unit;

        this._rawData = [];
        this._dataResolution = 10;
        this._backgroundColor = [backgroundColor];
        this._borderColor = [borderColor];
        this._borderWidth = 3;
        this._pointRadius = 1;

        this._yAxisId = `${this._title.replace(/\s/g, '')}_yID`;
        this._xAxisId = `${this._title.replace(/\s/g, '')}_xID`;

        this._yAxisScalesOptions =
        {
            id: this._yAxisId,
            ticks:
            {
                display: true,
                beginAtZero: true,
                fontColor: this._borderColor
            },
            type: 'linear',
            position: 'left',
            gridLines: { display: false }
        };

        this._xAxisScalesOptions =
        {
            id: this._xAxisId,
            display: false,
            type: 'time',
            position: 'bottom',
            time: { unit: 'minute' },
            gridLines: { display: false }
        };
        
        /*
         * ChartJS Properties 
         */
        this.label = `${this._title} ${this._unit}`;
        this.yAxisID = this._yAxisId;
        this.xAxisID = this._xAxisId;
        this.showLine = true;
        this.fill = true;
        this.data = [];
    }

    set dataResolution(val)  { this._dataResolution = val;  this._setData(); }
    get dataResolution() { return this._dataResolution; }

    // set backgroundColor(hexStr) { this._backgroundColor = RGBAColor.fromHEX(hexStr).asString(); }
    // get backgroundColor() { return RGBAColor.fromRGBA(this._backgroundColor).asHEXString(); }   
    set backgroundColor(rgbaStr) { this._backgroundColor[0] = rgbaStr; }
    get backgroundColor() { return this._backgroundColor[0] }   

    set borderColor(hexStr) { this._borderColor = RGBAColor.fromHEX(hexStr).asString(); }
    get borderColor() { return RGBAColor.fromRGBA(this._borderColor).asHEXString(); }

    set borderWidth(val) { this._borderWidth = val; }
    get borderWidth() { return this._borderWidth; }

    set pointRadius(val) { this._pointRadius = val; }
    get pointRadius() { return this._pointRadius; }

    _setData = () =>
    {
        if (this._dataResolution > this._rawData.length) this._dataResolution = this._rawData.length;
        else this.label = `Avg. ${this._title} ${this._unit}`;

        this.data = []

        let avgData = 0;
        let avgDate = 0;
        
        for ( let i = 1; i <= this._rawData.length; i++)
        {
            avgData += this._rawData[i - 1].y;
            avgDate += this._rawData[i - 1].x.getTime();

            if ( i % this._dataResolution == 0 )
            {
                this.data.push({ y: avgData / this._dataResolution, x: new Date(avgDate / this._dataResolution) });
                avgData = 0;
                avgDate = 0;
            }
        }

        /* Add rest if there is any */
        if ( avgData != 0 ) 
        {
            let rest = this._rawData.length - (this.dataResolution * Math.floor(this._rawData.length / this._dataResolution));
            this.data.push({ y: avgData / rest, x: new Date(avgDate / rest) });
        }
    }
}


const waitListener = (element, listenerName) =>
{
    return new Promise(function (resolve, reject) 
    {
        var listener = event => 
        {
            try { element.removeEventListener(listenerName, listener); } 
            catch (error) { }
            resolve(event);
        };
        element.addEventListener(listenerName, listener);
    });
}


const createChart = (canvas) =>
{
    Chart.defaults.global.defaultFontFamily = "'Abel'";
    Chart.defaults.global.defaultFontColor = "#fff";
    Chart.defaults.scale.gridLines.drawOnChartArea = false;
    /*
        * Chart JS properties
        */
    let chartTemplate =
    {
        type: 'scatter',
        data: { datasets: [] },
        options:
        {
            scales:
            {
                yAxes: [],
                xAxes: [],
            },
            legend:
            {
                onClick: function (e, legendItem) 
                {
                    let meta = this.chart.getDatasetMeta(legendItem.datasetIndex);
                    let yAxis = this.chart.options.scales.yAxes.find(axis => axis.id == meta.yAxisID);

                    /* Hide Y Axis when dataset gets hidden */
                    meta.hidden = !meta.hidden;
                    yAxis.display = !meta.hidden;

                    this.chart.update();
                }
            }
        }
    }

    let chart = new Chart(canvas, chartTemplate);

    /* Extend ChartJS object */
    chart._addDatasets = (datasets) =>
    {
        if (!datasets) GPXConverter.t(`expected 'GPXChartDataset', but received 'undefined'!`); 
        else if (!(datasets.every(o => o instanceof UIDataset))) GPXConverter.t(`not every item in 'ds' is of type 'GPXAnalysisDataset'!`); 
        else
        {
            datasets.forEach((ds, i) =>
            {                    
                ds._setData();
                chart.data.datasets.push(ds);
                if (i == 0) ds._xAxisScalesOptions.display = true;
                chart.options.scales.yAxes.push(ds._yAxisScalesOptions);
                chart.options.scales.xAxes.push(ds._xAxisScalesOptions);
            });
        }
    }

    chart._removeDatasets = () =>
    {
        chart.data.datasets = [];
        chart.options.scales.yAxes = [];
        chart.options.scales.xAxes = [];
        chart.update();
    }

    return chart;
}