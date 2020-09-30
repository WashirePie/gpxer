class UIWidget
{
    constructor(parent, title, icon, style = 'span-1 row-1')
    {
        this.element = document.createElement('div');
        this.element.className = `grid-item ${style} grid-item-${parent.childElementCount + 1}`;

        this.icon = document.createElement('p');
        this.icon.className = 'material-icons widget-icon';
        this.icon.innerHTML = icon;

        this.title = document.createElement('p');
        this.title.className = 'widget-title';
        this.title.innerHTML = title;

        this.element.appendChild(this.icon);
        this.element.appendChild(this.title);

        parent.appendChild(this.element);
    }
}

class UIAppInfoWidget extends UIWidget
{
    constructor(parent, title)
    {
        super(parent, title, '', 'span-full row-1');

        this.h1 = document.createElement('h1');
        this.h1.className = 'title-name';
        this.h1.setAttribute('data-bind', 'appTitle');

        this.p = document.createElement('p');
        this.p.className = 'version';
        this.p.setAttribute('data-bind', 'appVersion');

        this.select = document.createElement('select');
        this.select.className = 'tour-selector'
        this.select.setAttribute('data-bind', 'selectedTour');

        this.element.appendChild(this.h1);
        this.element.appendChild(this.p);
        this.element.appendChild(this.select);
    }

    addOption = (name) =>
    {
        let optionElement = document.createElement('option');
        optionElement.innerHTML = name;
        optionElement.value = name;
        this.select.appendChild(optionElement);
    }
}

class UITourPlotWidget extends UIWidget
{
    constructor(parent, title, w, h)
    {
        super(parent, title, '', 'span-3 row-3');

        this.canvas = document.createElement('canvas');
        this.canvas.width = w;
        this.canvas.height = h;

        this.ctx = this.canvas.getContext('2d');

        this.element.appendChild(this.canvas);
    }

    plot = (points, bounds) =>
    {
        let bufferSize = this.ctx.canvas.width;

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.ctx.beginPath();
        this.ctx.strokeStyle = '#fff';
        for (let i = 0; i < points.length - 1; i++) 
        {
            let x = Math.floor(map(points[i].attributes.lon, bounds.minLon, bounds.maxLon, 0, bufferSize));
            let y = Math.floor(map(points[i].attributes.lat, bounds.minLat, bounds.maxLat, bufferSize, 0));

            this.ctx.moveTo(x, y);

            let x2 = Math.floor(map(points[i + 1].attributes.lon, bounds.minLon, bounds.maxLon, 0, bufferSize));
            let y2 = Math.floor(map(points[i + 1].attributes.lat, bounds.minLat, bounds.maxLat, bufferSize, 0));

            this.ctx.lineTo(x2, y2);
        }
        this.ctx.stroke();
    }
}

class UIChartWidget extends UIWidget
{
    constructor(parent, title)
    {
        super(parent, title, '', 'span-full row-4');

        this.canvas = document.createElement('canvas');
        this.chart = createChart(this.canvas);

        this.element.appendChild(this.canvas);
    }
}

class UISingleWidget extends UIWidget
{
    constructor(parent, style, title, icon, unit, binding, description = '') 
    {
        super(parent, title, icon, style);

        this.div = document.createElement('div');
        this.div.className = 'widget-content';

        this.h1 = document.createElement('h1');
        this.h1.className = 'widget-content-inline';
        this.h1.setAttribute('data-bind', binding);
        
        this.h1Unit = document.createElement('h1');
        this.h1Unit.className = 'widget-content-inline widget-unit';
        this.h1Unit.innerHTML = ` <i>${unit}</i>`;
        
        if (description != '')
        {
            this.p = document.createElement('p');
            this.p.className = 'widget-description';
            this.p.innerHTML = description;
    
            this.div.appendChild(this.p);
        }
        this.div.appendChild(this.h1);
        this.div.appendChild(this.h1Unit);

        this.element.appendChild(this.div);
    }
}

class UITripleWidget extends UIWidget
{
    constructor(parent, style, title, icon, unit, bindingMin, bindingMax, bindingAvg)
    {
        super(parent, title, icon, style);

        this.div = document.createElement('div');
        this.div.className = 'widget-content';
        

        this.h1Min = document.createElement('h1');
        this.h1Min.className = 'widget-content-inline';
        this.h1Min.setAttribute('data-bind', bindingMin);

        this.h1Max = document.createElement('h1');
        this.h1Max.className = 'widget-content-inline';
        this.h1Max.setAttribute('data-bind', bindingMax);

        this.h1Avg = document.createElement('h1');
        this.h1Avg.className = 'widget-content-inline';
        this.h1Avg.setAttribute('data-bind', bindingAvg);
        
        this.h1UnitMin = document.createElement('h1');
        this.h1UnitMin.className = 'widget-content-inline widget-unit';
        this.h1UnitMin.innerHTML = ` <i>${unit}</i>`;
        
        this.h1UnitMax = document.createElement('h1');
        this.h1UnitMax.className = 'widget-content-inline widget-unit';
        this.h1UnitMax.innerHTML = ` <i>${unit}</i>`;

        this.h1UnitAvg = document.createElement('h1');
        this.h1UnitAvg.className = 'widget-content-inline widget-unit';
        this.h1UnitAvg.innerHTML = ` <i>${unit}</i>`;

        this.pMin = document.createElement('p');
        this.pMin.className = 'widget-description';
        this.pMin.innerHTML = `min`;

        this.pMax = document.createElement('p');
        this.pMax.className = 'widget-description';
        this.pMax.innerHTML = `max`;

        this.pAvg = document.createElement('p');
        this.pAvg.className = 'widget-description';
        this.pAvg.innerHTML = `avg`;

        this.div.appendChild(this.pMax);
        this.div.appendChild(this.h1Max);
        this.div.appendChild(this.h1UnitMax);

        this.div.appendChild(this.pMin);
        this.div.appendChild(this.h1Min);
        this.div.appendChild(this.h1UnitMin);


        this.div.appendChild(this.pAvg);
        this.div.appendChild(this.h1Avg);
        this.div.appendChild(this.h1UnitAvg);

        this.element.appendChild(this.div);
  }
}

class UIQuadWidget extends UIWidget 
{
    constructor(parent, style, title, icon, unit, bindingMin, bindingMax, bindingVal1, bindingVal2) 
    {
        super(parent, title, icon, style);

        this.div = document.createElement('div');
        this.div.className = 'widget-content';

        this.h1Min = document.createElement('h1');
        this.h1Min.className = 'widget-content-inline';
        this.h1Min.setAttribute('data-bind', bindingMin);

        this.h1Max = document.createElement('h1');
        this.h1Max.className = 'widget-content-inline';
        this.h1Max.setAttribute('data-bind', bindingMax);

        this.h1Val1 = document.createElement('h1');
        this.h1Val1.className = 'widget-content-inline';
        this.h1Val1.setAttribute('data-bind', bindingVal1);

        this.h1Val2 = document.createElement('h1');
        this.h1Val2.className = 'widget-content-inline';
        this.h1Val2.setAttribute('data-bind', bindingVal2);

        this.h1UnitMin = document.createElement('h1');
        this.h1UnitMin.className = 'widget-content-inline widget-unit';
        this.h1UnitMin.innerHTML = ` <i>${unit}</i>`;

        this.h1UnitMax = document.createElement('h1');
        this.h1UnitMax.className = 'widget-content-inline widget-unit';
        this.h1UnitMax.innerHTML = ` <i>${unit}</i>`;

        this.h1UnitVal1 = document.createElement('h1');
        this.h1UnitVal1.className = 'widget-content-inline widget-unit';
        this.h1UnitVal1.innerHTML = ` <i>${unit}</i>`;

        this.h1UnitVal2 = document.createElement('h1');
        this.h1UnitVal2.className = 'widget-content-inline widget-unit';
        this.h1UnitVal2.innerHTML = ` <i>${unit}</i>`;

        this.pMin = document.createElement('p');
        this.pMin.className = 'widget-description';
        this.pMin.innerHTML = `min`;

        this.pMax = document.createElement('p');
        this.pMax.className = 'widget-description';
        this.pMax.innerHTML = `max`;

        this.pVal1 = document.createElement('p');
        this.pVal1.className = 'widget-description';
        this.pVal1.innerHTML = bindingVal1; /* As label */

        this.pVal2 = document.createElement('p');
        this.pVal2.className = 'widget-description';
        this.pVal2.innerHTML = bindingVal2; /* As label */

        this.div.appendChild(this.pMax);
        this.div.appendChild(this.h1Max);
        this.div.appendChild(this.h1UnitMax);

        this.div.appendChild(this.pMin);
        this.div.appendChild(this.h1Min);
        this.div.appendChild(this.h1UnitMin);

        this.div.appendChild(this.pVal1);
        this.div.appendChild(this.h1Val1);
        this.div.appendChild(this.h1UnitVal1);

        this.div.appendChild(this.pVal2);
        this.div.appendChild(this.h1Val2);
        this.div.appendChild(this.h1UnitVal2);

        this.element.appendChild(this.div);
    }
}


/*
 * Helper functions
 */

const map = (n, start1, stop1, start2, stop2, withinBounds) =>
{
  const newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;

  if (!withinBounds) return newval;

  if (start2 < stop2) return constrain(newval, start2, stop2);
  else                return constrain(newval, stop2, start2);

}


const constrain = (n, low, high) => { return Math.max(Math.min(n, high), low); }
