//Desarrollo de las visualizaciones
import * as d3 from 'd3';
import { numberWithCommas3 } from '../helpers';
import { getInTooltip, getOutTooltip, positionTooltip } from '../modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C',
COLOR_COMP_1 = '#528FAD';
let tooltip = d3.select('#tooltip');

export function initChart() {
    ///Lectura de datos
    d3.csv('https://raw.githubusercontent.com/CarlosMunozDiazCSIC/informe_perfil_mayores_2022_salud_2_8/main/data/tasas_mortalidad_sexo_edad_2020.csv', function(error,data) {
        if (error) throw error;

        let margin = {top: 5, right: 30, bottom: 25, left: 50},
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
        
        let ticks = 6;
        if(document.body.clientWidth < 560) {
            ticks = 3;
        }

        let xAxis = function(g) {
            g.call(d3.axisBottom(x).ticks(ticks).tickFormat(function(d,i) { return numberWithCommas3(d); }));
            g.call(function(g) {
                g.call(function(g){
                    g.selectAll('.tick line')
                        .attr('class', function(d,i) {
                            if (d == 0) {
                                return 'line-special';
                            }
                        })
                        .attr('y1', '0')
                        .attr('y2', `-${height}`)
                });
            });
        }

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        let y = d3.scaleBand()
            .domain(edades)
            .range([height,0])
            .padding(0.35);

        let yAxis = function(g) {
            g.call(d3.axisLeft(y));
            g.call(function(g){g.selectAll('.tick line').remove()});
            g.call(function(g){g.select('.domain').remove()});
        }
        
        svg.append("g")
            .call(yAxis);

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
                .attr('class', function(d) {
                    return 'grupo_' + d.Edad_2;
                })
                .selectAll("rect")
                .data(function(d) { return tipos.map(function(key) { return {key: key, value: d[key]}; }); })
                .enter()
                .append("rect")
                .attr('class', function(d) {
                    return 'rect rect_' + d.key;
                })
                .attr('y', function(d) { return ySubgroup(d.key); })
                .attr('height', ySubgroup.bandwidth())
                .attr("fill", function(d) { return color(d.key); })
                .attr('x', x(0))
                .attr('width', x(0))
                .on('mouseover', function(d,i,e) {
                    //Opacidad en barras
                    let css = e[i].getAttribute('class').split(' ')[1];
                    let bars = svg.selectAll('.rect');                    
            
                    bars.each(function() {
                        this.style.opacity = '0.4';
                        let split = this.getAttribute('class').split(" ")[1];
                        if(split == `${css}`) {
                            this.style.opacity = '1';
                        }
                    });

                    //Tooltip > Recuperamos el año de referencia
                    let currentAge = this.parentNode.classList.value;

                    let html = '<p class="chart__tooltip--title">Grupo edad: ' + currentAge.split('_')[1] + '</p>' + 
                            '<p class="chart__tooltip--text">La tasa de mortalidad para <b>' + d.key.split('_')[0].toLowerCase() + '</b> en este grupo de edad es de <b>' + numberWithCommas3(parseFloat(d.value)) + '</b> por cada 100.000 habitantes de este grupo y sexo</p>';
                    
                    tooltip.html(html);

                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);

                })
                .on('mouseout', function(d,i,e) {
                    //Quitamos los estilos de la línea
                    let bars = svg.selectAll('.rect');
                    bars.each(function() {
                        this.style.opacity = '1';
                    });
                
                    //Quitamos el tooltip
                    getOutTooltip(tooltip); 
                })
                .transition()
                .duration(2000)
                .attr('x', function(d) { return x(0); })
                .attr('width', function(d) { return x(d.value) -x(0); });
        }

        function animateChart() {
            svg.selectAll(".rect")
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

        //////
        ///// Resto - Chart
        //////
        init();

        //Animación del gráfico
        document.getElementById('replay').addEventListener('click', function() {
            animateChart();

            setTimeout(() => {
                setChartCanvas();
            }, 4000);
        });

        //////
        ///// Resto
        //////

        //Iframe
        setFixedIframeUrl('informe_perfil_mayores_2022_salud_2_8','mortalidad_sexo_edad_espana');

        //Redes sociales > Antes tenemos que indicar cuál sería el texto a enviar
        setRRSSLinks('mortalidad_sexo_edad_espana');

        //Captura de pantalla de la visualización
        setTimeout(() => {
            setChartCanvas();
        }, 4000);

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            setChartCanvasImage('mortalidad_sexo_edad_espana');
        });

        //Altura del frame
        setChartHeight();
    });    
}