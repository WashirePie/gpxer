class UIWidget
{
    constructor(parent, title, style = '')
    {
        this.element = document.createElement('div');
        this.element.className = `grid-item ${style} grid-item-${parent.childElementCount + 1}`;
        this.element.innerHTML = title;

        parent.appendChild(this.element);
    }
}

class UIAppInfoWidget extends UIWidget
{
    constructor(parent, title)
    {
        super(parent, title, 'span-2');

        this.h1 = document.createElement('h1');
        this.h1.className = 'title-name';
        this.h1.setAttribute('data-bind', 'appTitle');

        this.p = document.createElement('p');
        this.p.className = 'version';
        this.p.setAttribute('data-bind', 'appVersion');

        this.element.appendChild(this.h1);
        this.element.appendChild(this.p);
    }
}

class UITourPlotWidget extends UIWidget
{
    constructor(parent, title, w, h)
    {
        super(parent, title, 'square-3');

        this.canvas = document.createElement('canvas');
        this.canvas.width = w;
        this.canvas.height = h;

        this.ctx = this.canvas.getContext('2d');

        this.element.appendChild(this.canvas);
    }
}

class UIChartWidget extends UIWidget
{
    constructor(parent, title)
    {
        super(parent, title, 'span-chart');

        this.canvas = document.createElement('canvas');
        this.chart = createChart(this.canvas);

        this.element.appendChild(this.canvas);
    }
}

class UIAscentDescentWidget extends UIWidget
{
    constructor(parent)
    {
        super(parent, 'ascent / descent', 'span-2');

        /* Ascent */
        this.ascentDiv = document.createElement('div');
        this.ascentDiv.className = 'widget-content';

        this.ascentIcon = document.createElement('p');
        this.ascentIcon.className = 'material-icons';
        this.ascentIcon.innerHTML = 'north' 
        
        this.ascentH1 = document.createElement('h1');
        this.ascentH1.className = 'widget-content-inline';
        this.ascentH1.setAttribute('data-bind', 'ascent');
        
        this.ascentH1Unit = document.createElement('h1');
        this.ascentH1Unit.className = 'widget-content-inline widget-unit';
        this.ascentH1Unit.innerHTML = ' <i>meters</i>';

        this.ascentDiv.appendChild(this.ascentIcon);
        this.ascentDiv.appendChild(this.ascentH1);
        this.ascentDiv.appendChild(this.ascentH1Unit);

        /* Descent */
        this.descentDiv = document.createElement('div');
        this.descentDiv.className = 'widget-content';

        this.descentIcon = document.createElement('p');
        this.descentIcon.className = 'material-icons';
        this.descentIcon.innerHTML = 'south'

        this.descentH1 = document.createElement('h1');
        this.descentH1.className = 'widget-content-inline';
        this.descentH1.setAttribute('data-bind', 'descent');

        this.descentH1Unit = document.createElement('h1');
        this.descentH1Unit.className = 'widget-content-inline widget-unit';
        this.descentH1Unit.innerHTML = ' <i>meters</i>';

        this.descentDiv.appendChild(this.descentIcon);
        this.descentDiv.appendChild(this.descentH1);
        this.descentDiv.appendChild(this.descentH1Unit);

        this.element.appendChild(this.ascentDiv); 
        this.element.appendChild(this.descentDiv); 
    }
}

class UIEnergyConsumptionWidget extends UIWidget
{
    constructor(parent)
    {
        super(parent, 'energy consumption', 'span-2');

        this.div = document.createElement('div');
        this.div.className = 'widget-content';

        this.icon = document.createElement('p');
        this.icon.className = 'material-icons widget-icon';
        this.icon.innerHTML = 'local_fire_department' 

        this.p = document.createElement('p');
        this.p.className = 'widget-description';
        this.p.innerHTML = `According to "Estimating Energy Expenditure during Level, Uphill, and Downhill Walking" <br>
        <i>https://pubmed.ncbi.nlm.nih.gov/30973477/</i>`;
        
        this.h1 = document.createElement('h1');
        this.h1.className = 'widget-content-inline';
        this.h1.setAttribute('data-bind', 'energy');

        this.h1Unit = document.createElement('h1');
        this.h1Unit.className = 'widget-content-inline widget-unit';
        this.h1Unit.innerHTML = ' <i>kcal</i>';

        this.div.appendChild(this.p);
        this.div.appendChild(this.icon);
        this.div.appendChild(this.h1);
        this.div.appendChild(this.h1Unit);

        this.element.appendChild(this.div); 
    }
}

class UISingleWidget extends UIWidget
{
    constructor(parent, style, title, icon, unit, binding) 
    {
        super(parent, title, style);

        this.div = document.createElement('div');
        this.div.className = 'widget-content';

        this.icon = document.createElement('p');
        this.icon.className = 'material-icons widget-icon';
        this.icon.innerHTML = icon

        this.h1 = document.createElement('h1');
        this.h1.className = 'widget-content-inline';
        this.h1.setAttribute('data-bind', binding);

        this.h1Unit = document.createElement('h1');
        this.h1Unit.className = 'widget-content-inline widget-unit';
        this.h1Unit.innerHTML = ` <i>${unit}</i>`;

        this.div.appendChild(this.icon);
        this.div.appendChild(this.h1);
        this.div.appendChild(this.h1Unit);

        this.element.appendChild(this.div);
    }
}

class UITripleWidget extends UIWidget
{
    constructor(parent, style, title, iconMin, iconMax, iconAvg, unit, bindingMin, bindingMax, bindingAvg)
    {
        super(parent, title, style);

        this.div = document.createElement('div');
        this.div.className = 'widget-content';

        /* Icons */
        this.iconMin = document.createElement('p');
        this.iconMin.className = 'material-icons widget-icon';
        this.iconMin.innerHTML = iconMin

        this.iconMax = document.createElement('p');
        this.iconMax.className = 'material-icons widget-icon';
        this.iconMax.innerHTML = iconMax

        this.iconAvg = document.createElement('p');
        this.iconAvg.className = 'material-icons widget-icon';
        this.iconAvg.innerHTML = iconAvg

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

        this.div.appendChild(this.pMin);
        this.div.appendChild(this.iconMin);
        this.div.appendChild(this.h1Min);
        this.div.appendChild(this.h1UnitMin);

        this.div.appendChild(this.pMax);
        this.div.appendChild(this.iconMax);
        this.div.appendChild(this.h1Max);
        this.div.appendChild(this.h1UnitMax);

        this.div.appendChild(this.pAvg);
        this.div.appendChild(this.iconAvg);
        this.div.appendChild(this.h1Avg);
        this.div.appendChild(this.h1UnitAvg);

        this.element.appendChild(this.div);
  }
}

class UIQuadWidget extends UIWidget 
{
    constructor(parent, style, title, iconMin, iconMax, iconVal1, iconVal2, unit, bindingMin, bindingMax, bindingVal1, bindingVal2) 
    {
        super(parent, title, style);

        this.div = document.createElement('div');
        this.div.className = 'widget-content';

        /* Icons */
        this.iconMin = document.createElement('p');
        this.iconMin.className = 'material-icons widget-icon';
        this.iconMin.innerHTML = iconMin;

        this.iconMax = document.createElement('p');
        this.iconMax.className = 'material-icons widget-icon';
        this.iconMax.innerHTML = iconMax;

        this.iconVal1 = document.createElement('p');
        this.iconVal1.className = 'material-icons widget-icon';
        this.iconVal1.innerHTML = iconVal1;

        this.iconVal2 = document.createElement('p');
        this.iconVal2.className = 'material-icons widget-icon';
        this.iconVal2.innerHTML = iconVal2;

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

        this.div.appendChild(this.pMin);
        this.div.appendChild(this.iconMin);
        this.div.appendChild(this.h1Min);
        this.div.appendChild(this.h1UnitMin);

        this.div.appendChild(this.pMax);
        this.div.appendChild(this.iconMax);
        this.div.appendChild(this.h1Max);
        this.div.appendChild(this.h1UnitMax);

        this.div.appendChild(this.pVal1);
        this.div.appendChild(this.iconVal1);
        this.div.appendChild(this.h1Val1);
        this.div.appendChild(this.h1UnitVal1);

        this.div.appendChild(this.pVal2);
        this.div.appendChild(this.iconVal2);
        this.div.appendChild(this.h1Val2);
        this.div.appendChild(this.h1UnitVal2);

        this.element.appendChild(this.div);
    }
}