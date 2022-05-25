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
    d3.csv('https://raw.githubusercontent.com/EnvejecimientoEnRed/informe_perfil_mayores_2022_salud_2_8/main/data/tasas_mortalidad_sexo_edad_2020.csv', function(error,data) {
        if (error) throw error;

        let paths;

        let margin = {top: 12.5, right: 30, bottom: 25, left: 60},
            width = document.getElementById('chart').clientWidth - margin.left - margin.right,
            height = document.getElementById('chart').clientHeight - margin.top - margin.bottom;

        let svg = d3.select("#chart")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        let edades = d3.map(data, function(d){return(d.Edad_2)}).keys();
        let tipos = ['Hombres', 'Mujeres'];

        let x = d3.scaleBand()
            .domain(edades)
            .range([0,width])
            .padding([0.5]);

        let xAxis = function(g) {
            g.call(d3.axisBottom(x).tickValues(x.domain().filter(function(d,i){ return !(i%2); })));
            g.call(function(g){g.selectAll('.tick line').remove()});
            g.call(function(g){g.select('.domain').remove()});
        }
        
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        let y = d3.scaleLog()
            .domain([1,100000])
            .range([ height, 0 ]);

        let yAxis = function(svg) {
            svg.call(d3.axisLeft(y).ticks(5).tickFormat(function(d,i) { return numberWithCommas3(d); }));
            svg.call(function(g) {
                g.call(function(g){
                    g.selectAll('.tick line')
                        .attr('class', function(d,i) {
                            if (d == 1) {
                                return 'line-special';
                            }
                        })
                        .attr('x1', '0%')
                        .attr('x2', `${width}`)
                });
            });
        }

        svg.append("g")
            .attr("class", "yaxis")
            .call(yAxis);

        function init() {
            //////Líneas
            //Hombres
            svg.append("path")
                .datum(data)
                .attr('class', 'rect')
                .attr("fill", "none")
                .attr("stroke", COLOR_PRIMARY_1)
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(function(d) { return x(d.Edad_2) + x.bandwidth() / 2 })
                    .y(function(d) { return y(+d.Hombres) })
                )
            
            //Mujeres
            svg.append("path")
                .datum(data)
                .attr('class', 'rect')
                .attr("fill", "none")
                .attr("stroke", COLOR_COMP_1)
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(function(d) { return x(d.Edad_2) + x.bandwidth() / 2 })
                    .y(function(d) { return y(+d.Mujeres) })
                )

            //Animación líneas
            paths = svg.selectAll('.rect');

            paths.attr("stroke-dasharray", 1000 + " " + 1000)
                .attr("stroke-dashoffset", 1000)
                .transition()
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0)
                .duration(2000);

            //Círculos para tooltip
            svg.selectAll('circles_male')
                .data(data)
                .enter()
                .append('circle')
                .attr('class', function(d) {
                    return 'circle ' + d.Edad_2;
                })
                .attr('cx', function(d) {
                    return x(d.Edad_2) + x.bandwidth() / 2;
                })
                .attr('cy', function(d) {
                    return y(+d.Hombres);
                })
                .attr('r', 3)
                .attr('stroke', 'none')
                .attr('fill', 'transparent')
                .on('mouseover', function(d,i,e) {
                    //Opacidad en círculos
                    let css = e[i].getAttribute('class').split(' ')[1];
                    let circles = svg.selectAll('.circle');                    
            
                    circles.each(function() {
                        //this.style.stroke = '0.4';
                        let split = this.getAttribute('class').split(" ")[1];
                        if(split == `${css}`) {
                            this.style.stroke = 'black';
                            this.style.strokeWidth = '1';
                        }
                    });

                    //Tooltip > Recuperamos el año de referencia
                    let html = '<p class="chart__tooltip--title">Grupo de edad: ' + d.Edad_2 + '</p>' + 
                            '<p class="chart__tooltip--text">La tasa de mortalidad para hombres en este grupo de edad es de <b>' + numberWithCommas3(parseFloat(d.Hombres).toFixed(1)) + '</b></p>';
                    
                    tooltip.html(html);

                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);
                })
                .on('mouseout', function(d,i,e) {
                    //Quitamos los estilos de la línea
                    let circles = svg.selectAll('.circle');
                    circles.each(function() {
                        this.style.stroke = 'none';
                    });
                
                    //Quitamos el tooltip
                    getOutTooltip(tooltip); 
                });

            svg.selectAll('circles_female')
                .data(data)
                .enter()
                .append('circle')
                .attr('class', function(d) {
                    return 'circle ' + d.Edad_2;
                })
                .attr('cx', function(d) {
                    return x(d.Edad_2) + x.bandwidth() / 2;
                })
                .attr('cy', function(d) {
                    return y(+d.Mujeres);
                })
                .attr('r', 3)
                .attr('stroke', 'none')
                .attr('fill', 'transparent')
                .on('mouseover', function(d,i,e) {
                    //Opacidad en círculos
                    let css = e[i].getAttribute('class').split(' ')[1];
                    let circles = svg.selectAll('.circle');                    
            
                    circles.each(function() {
                        //this.style.stroke = '0.4';
                        let split = this.getAttribute('class').split(" ")[1];
                        if(split == `${css}`) {
                            this.style.stroke = 'black';
                            this.style.strokeWidth = '1';
                        }
                    });

                    //Tooltip > Recuperamos el año de referencia
                    let html = '<p class="chart__tooltip--title">Grupo de edad: ' + d.Edad_2 + '</p>' + 
                            '<p class="chart__tooltip--text">La tasa de mortalidad para mujeres en este grupo de edad es de <b>' + numberWithCommas3(parseFloat(d.Mujeres).toFixed(1)) + '</b></p>';
                    
                    tooltip.html(html);

                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);
                })
                .on('mouseout', function(d,i,e) {
                    //Quitamos los estilos de la línea
                    let circles = svg.selectAll('.circle');
                    circles.each(function() {
                        this.style.stroke = 'none';
                    });
                
                    //Quitamos el tooltip
                    getOutTooltip(tooltip); 
                });
        }

        function animateChart() {
            paths.attr("stroke-dasharray", 1000 + " " + 1000)
                .attr("stroke-dashoffset", 1000)
                .transition()
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0)
                .duration(2000);
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