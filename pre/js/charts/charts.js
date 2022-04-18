//Desarrollo de las visualizaciones
import * as d3 from 'd3';
//import { numberWithCommas2 } from './helpers';
//import { getInTooltip, getOutTooltip, positionTooltip } from './modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C', 
COLOR_PRIMARY_2 = '#E37A42', 
COLOR_ANAG_1 = '#D1834F', 
COLOR_ANAG_2 = '#BF2727', 
COLOR_COMP_1 = '#528FAD', 
COLOR_COMP_2 = '#AADCE0', 
COLOR_GREY_1 = '#B5ABA4', 
COLOR_GREY_2 = '#64605A', 
COLOR_OTHER_1 = '#B58753', 
COLOR_OTHER_2 = '#731854';

export function initChart(iframe) {
    ///Lectura de datos
    d3.csv('https://raw.githubusercontent.com/CarlosMunozDiazCSIC/informe_perfil_mayores_2022_salud_2_8/main/data/tasas_mortalidad_sexo_edad_2020.csv', function(error,data) {
        if (error) throw error;

        let margin = {top: 10, right: 30, bottom: 20, left: 50},
            width = document.getElementById('chart').clientWidth - margin.left - margin.right,
            height = document.getElementById('chart').clientHeight - margin.top - margin.bottom;

        let svg = d3.select("#chart")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        let edades = d3.map(data, function(d){return(d.Edad_2)}).keys().reverse();
        let tipos = ['Hombres', 'Mujeres'];

        let x = d3.scaleLinear()
            .domain([0,35000])
            .range([0,width]);        

        let xAxis = function(g) {
            g.call(d3.axisBottom(x));
        }

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        let y = d3.scaleBand()
            .domain(edades)
            .range([height,0])
            .padding(0.35);
        
        svg.append("g")
            .call(d3.axisLeft(y));

        let ySubgroup = d3.scaleBand()
            .domain(tipos)
            .range([0, y.bandwidth()]);

        let color = d3.scaleOrdinal()
            .domain(tipos)
            .range([COLOR_PRIMARY_1, COLOR_COMP_1]);

        function init() {
            svg.append("g")
                .selectAll("g")
                .data(data)
                .enter()
                .append("g")
                .attr("transform", function(d) { return "translate(0," + y(d.Edad_2) + ")"; })
                .selectAll("rect")
                .data(function(d) { return tipos.map(function(key) { return {key: key, value: d[key]}; }); })
                .enter()
                .append("rect")
                .attr('class', 'prueba')
                .attr('y', function(d) { return ySubgroup(d.key); })
                .attr('height', ySubgroup.bandwidth())
                .attr("fill", function(d) { return color(d.key); })
                .attr('x', x(0))
                .attr('width', x(0))
                .transition()
                .duration(2000)
                .attr('x', function(d) { return x(0); })
                .attr('width', function(d) { return x(d.value) -x(0); });
        }

        function animateChart() {
            svg.selectAll(".prueba")
                .attr('y', function(d) { return ySubgroup(d.key); })
                .attr('height', ySubgroup.bandwidth())
                .attr("fill", function(d) { return color(d.key); })
                .attr('x', x(0))
                .attr('width', width - x(0))
                .transition()
                .duration(2000)
                .attr('x', function(d) { return x(d.value); })
                .attr('width', function(d) { return width - x(d.value); });
        }

        //////
        ///// Resto - Chart
        //////
        init();

        //Animación del gráfico
        document.getElementById('replay').addEventListener('click', function() {
            animateChart();
        });

        //////
        ///// Resto
        //////

        //Iframe
        setFixedIframeUrl('informe_perfil_mayores_2022_salud_2_8','mortalidad_sexo_edad_espana');

        //Redes sociales > Antes tenemos que indicar cuál sería el texto a enviar
        setRRSSLinks('mortalidad_sexo_edad_espana');

        //Captura de pantalla de la visualización
        setChartCanvas();

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            setChartCanvasImage('mortalidad_sexo_edad_espana');
        });

        //Altura del frame
        setChartHeight(iframe);
    });    
}