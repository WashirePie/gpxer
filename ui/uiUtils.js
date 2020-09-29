class UIModal
{
    constructor()
    {
        /* Get relevant UI Elements */
        this.uiModalOverlayDiv = document.getElementById('modalOverlay');
        this.uiModalSelect = document.getElementById('modalSelect');
        this.uiModalMessage = document.getElementById('modalMessage');
        this.uiModalOptions = document.getElementById('modalOptions');
        this.uiModalAccept = document.getElementById('modalBtn');    

        /* Properties */
        this.dataBindings = {};

        /* Show modal */
        this.uiModalMessage.innerHTML = "Processing GPX...";
        this.uiModalOptions.style.display = 'none';
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
        
        let selectedOption = options.find(o => o.tag == this.uiModalSelect.options[this.uiModalSelect.selectedIndex].value);

        return Promise.resolve(selectedOption.tour);
    }

}


class UIDataset
{
    constructor(title, unit, rawData)
    {
        this._title = title;
        this._unit = unit;

        this._rawData = rawData;
        this._dataResolution = 60;

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



class RGBAColor
{
    constructor(r, g, b, a)
    {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    static fromRGBA = (rgba) =>
    {
        let re = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+(?:\.\d+)?)\s*\)$/
        let match = re.exec(rgba);

        if (!match) return null;
        else if (match[1] && match[2] && match[3] && match[4])
        {
            let r = parseInt(match[1], 10);
            let g = parseInt(match[2], 10);
            let b = parseInt(match[3], 10);
            let a = parseInt(match[4], 10);
            return new RGBAColor(r, g, b, a);
        }
        else return null;
    }

    static fromHEX = (str, alpha = 1) =>
    {
        let re = /^#([a-fA-F0-9][a-fA-F0-9])([a-fA-F0-9][a-fA-F0-9])?([a-fA-F0-9][a-fA-F0-9])?$/;
        let match = re.exec(str);

        if (!match) return null;
        else if (!match[2] && !match[3])
        {
            let c = parseInt(Number(`0x${match[1]}`), 10);
            return new RGBAColor(c, c, c, 1);
        }
        else if (match.length == 4)
        {
            let r = parseInt(Number(`0x${match[1]}`), 10);
            let g = parseInt(Number(`0x${match[2]}`), 10);
            let b = parseInt(Number(`0x${match[3]}`), 10);
            return new RGBAColor(r, g, b, alpha);
        }
        else return null;

    }

    asString(alpha = this.a, percent = 1)
    {
        let r = this.r * percent;
        let g = this.g * percent;
        let b = this.b * percent;

        r = r > 255 ? 255 : r;
        g = g > 255 ? 255 : g;
        b = b > 255 ? 255 : b;

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    asHEXString(percent = 1)
    {
        let r = this.r * percent;
        let g = this.g * percent;
        let b = this.b * percent;
        let a = this.a;

        r = r > 255 ? 255 : r;
        g = g > 255 ? 255 : g;
        b = b > 255 ? 255 : b;
        return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`
    }
}