document.addEventListener('dateSliderChanged', (event) => {
    dateSliderStart = event.detail.start
    dateSliderEnd = event.detail.end
    colorMap(tD)
})

defocusOpacity = 0.6
dateSliderStart = new Date('3/1/2022')
dateSliderEnd = new Date('5/24/2023')
buildingData = []
let selectedBuildings = [];
lassoActive = false;
unitTurnover = [];
document.addEventListener('DOMContentLoaded', function () {

    function buildingForm(d) {
        return {
            BuildingID: +d["buildingId"],
            Location: d["location"].replace("POLYGON ((", "").replace("))", "").split('), ('),
            BuildingType: d["buildingType"],
            MaxOccupancy: +d["maxOccupancy"],
            Units: d["units"] === "" ? [] : JSON.parse(d['units']),
        };
    }
    function turnoverForm(d) {
        return {
            employerId: +d['employerId'],
            buildingId: +d['buildingId'],
            date: new Date(d['date'].split('-').map(Number)),
            positionsFilled: +d['positionsFilled'],
        }
    }

    Promise.all([d3.csv('data/Buildings.csv', buildingForm), d3.json('data/location_points.json'), d3.json('data/rooms.json'), d3.csv('data/DailyEmployeesByEmployer.csv', turnoverForm)])
        .then(function (values) {
            buildingData = values[0];
            location_points = values[1];
            rooms = values[2];
            tD = values[3];

            svg = d3.select('#chart1')
                .append('svg')
                .attr("width", "100%")
                .attr("height", "572")
                .attr('id', 'chart1-svg')
                .attr('transform', 'scale(0.95,0.95)')
                .attr('viewBox', '-4762.19066918826 -30.08359080145072 7412.2 7880.120785945152')

            //Generate Map
            for (var i = 0; i < buildingData.length; i++) {
                if (buildingData[i]['BuildingType'] === 'Residental') {
                    path = ""
                    for (j = 0; j < buildingData[i]['Location'].length; j++) {
                        path += 'M' + buildingData[i]['Location'][j] + 'z '
                    }
                    svg.append('path')
                        .attr('class', buildClassString(buildingData[i]))
                        .attr('id', 'building' + buildingData[i]['BuildingID'])
                        .attr('d', path)
                        .attr('data-coord', () => {
                            cent = pathToCenter(buildingData[i]['Location'])
                            return cent[0] + ' ' + cent[1]
                        })
                        .attr('data-unit', buildingData[i]['Units'][0])
                        .style('stroke', 'black')
                        .style('stroke-width', 10)
                }
                else if (buildingData[i]['BuildingType'] === 'School') {
                    path = ""
                    for (j = 0; j < buildingData[i]['Location'].length; j++) {
                        path += 'M' + buildingData[i]['Location'][j] + 'z '
                    }
                    svg.append('path')
                        .attr('class', buildClassString(buildingData[i]))
                        .attr('id', 'building' + buildingData[i]['BuildingID'])
                        .attr('d', path)
                        .attr('data-coord', () => {
                            cent = pathToCenter(buildingData[i]['Location'])
                            return cent[0] + ' ' + cent[1]
                        })
                        .style('stroke', 'black')
                        .style('stroke-width', 10)
                }
                else if (buildingData[i]['BuildingType'] === 'Commercial' && buildingData[i]['Units'].length <= 1) {
                    path = ""
                    for (j = 0; j < buildingData[i]['Location'].length; j++) {
                        path += 'M' + buildingData[i]['Location'][j] + 'z '
                    }
                    svg.append('path')
                        .attr('class', buildClassString(buildingData[i]))
                        .attr('id', 'building' + buildingData[i]['BuildingID'])
                        .attr('d', path)
                        .attr('data-coord', () => {
                            cent = pathToCenter(buildingData[i]['Location'])
                            return cent[0] + ' ' + cent[1]
                        })
                        .attr('data-unit', buildingData[i]['Units'][0])
                        .style('stroke', 'black')
                        .style('stroke-width', 10)
                }
                else { // Commercial with multiple units
                    filteredRooms = rooms.filter(x => x['buildingId'] == buildingData[i]['BuildingID'])
                    if (filteredRooms.length > 0) {
                        for (j = 0; j < filteredRooms.length; j++) {
                            svg.append('path')
                                .attr('class', 'map-building Commercial unit' + filteredRooms[j]['id'])
                                .attr('id', 'building' + buildingData[i]['BuildingID'] + '-' + filteredRooms[j]['id'])
                                .attr('d', filteredRooms[j]['path'])
                                .attr('data-coord', () => {
                                    cent = pathToCenter(buildingData[i]['Location'])
                                    return cent[0] + ' ' + cent[1]
                                })
                                .attr('data-unit', filteredRooms[j]['id'])
                                .style('fill', 'lightgray')
                                .style('stroke', 'black')
                                .style('stroke-width', 10)
                        }
                    }
                    else { // Weird case or not coded yet
                        path = ""
                        for (j = 0; j < buildingData[i]['Location'].length; j++) {
                            path += 'M' + buildingData[i]['Location'][j] + 'z '
                        }
                        svg.append('path')
                            .attr('class', buildClassString(buildingData[i]))
                            .attr('id', 'building' + buildingData[i]['BuildingID'])
                            .attr('d', path)
                            .attr('data-coord', () => {
                                cent = pathToCenter(buildingData[i]['Location'])
                                return cent[0] + ' ' + cent[1]
                            })
                            .attr('data-unit', buildingData[i]['Units'][0])
                            .style('stroke', 'black')
                            .style('stroke-width', 10)
                    }
                }
            }



            // Lasso selector
            let lassoPath = [];
            const lineGenerator = d3.line();

            function drawPath() {
                d3.select("#lasso")
                    .style("stroke", "black")
                    .style("stroke-width", 2)
                    .style("fill", "#00000054")
                    .attr("d", lineGenerator(lassoPath));
            }

            function dragStart() {
                d3.selectAll('[data-selected]').attr('data-selected', null)
                lassoActive = true;
                lassoPath = [];
                d3.select("#lasso").remove();
                d3.select("#chart1-svg")
                    .append("path")
                    .attr("id", "lasso");
            }

            function dragMove(event) {
                let point = new DOMPoint(0, 0)
                const { clientX, clientY } = event.sourceEvent || { clientX: 0, clientY: 0 }
                point.x = clientX;
                point.y = clientY;
                point = point.matrixTransform(document.getElementById('chart1-svg').getScreenCTM().inverse());
                lassoPath.push([point.x, point.y]);
                drawPath();
            }

            function dragEnd() {
                lassoActive = false
                selectedBuildings = [];
                buildingNodes = d3.selectAll("[class*='unit']").nodes()
                for (i = 0; i < buildingNodes.length; i++) {
                    let point = buildingNodes[i].dataset.coord.split(' ').map(Number)
                    if (robustPointInPolygon(lassoPath, point) < 1) {
                        d3.select("#" + buildingNodes[i].id).attr("data-selected", "true");
                        selectedBuildings.push(buildingNodes[i].id);
                    }
                }
                drawLineChart()
                drawBar()
                drawNormalizedStreamGraph()
                lassoSelectedUpdateBubble()
                //showFilterWarning(true)
                colorMap(tD)
                d3.select("#lasso").remove();
            }

            const drag = d3
                .drag()
                .on("start", dragStart)
                .on("drag", dragMove)
                .on("end", dragEnd);

            d3.select("#chart1").call(drag);

            colorMap(tD)
            builds = d3.selectAll('.map-building')
                .on('mouseover', (e) => {
                    if (e.srcElement.style.fill !== "lightgray") {
                        d3.select('.tooltip')
                            .transition()
                            .duration(200)
                            .style('opacity', 1)
                    }
                }

                )
                .on('mousemove', (e, d) => {
                    if (e.srcElement.style.fill !== "lightgray") {
                        d3.select('.tooltip')
                            .html(`<strong>Building ID:</strong> ${e.srcElement.id.split('building')[1].split('-')[0]}
                        <br> <strong>Unit ID:</strong> ${e.srcElement.dataset.unit}
                        <br> <strong>Turnover Rate:</strong> ${Math.round(unitTurnover.filter(x => x['employerId'] == +e.srcElement.dataset.unit)[0]['turnoverRate'] * 100) / 100}%`
                            )
                            // .attr('opacity', 1)
                            .style("left", (e.pageX + 10) + 'px')
                            .style("top", (e.pageY - 30) + 'px')
                    }
                }
                )
                .on('mouseout', (e) => {
                    if (e.srcElement.style.fill !== "lightgray") {
                        d3.select('.tooltip')
                            .transition()
                            .duration(200)
                            .style('opacity', 0)
                    }
                }
                )

            window.dispatchEvent(new Event('resize'))
        });
});


// Legend courtesy of https://observablehq.com/@d3/color-legend
function legend({
    color,
    title,
    tickSize = 60,
    width = 3200,
    height = 440 + tickSize,
    marginTop = 180,
    marginRight = 0,
    marginBottom = 160 + tickSize,
    marginLeft = 0,
    ticks = width / 640,
    tickFormat,
    tickValues
} = {}) {
    xScaling = -800
    yScaling = 7000
    fontSize = 110
    const svg = d3.select("#chart1-svg")

    let tickAdjust = g => {
        g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height).attr("stroke-width", 5);
        g.selectAll(".tick text").attr("font-size", fontSize);
    }

    let x;
    // Continuous
    if (color.interpolator) {
        x = Object.assign(color.copy()
            .interpolator(d3.interpolateRound(marginLeft, width - marginRight)), {
            range() {
                return [marginLeft, width - marginRight];
            }
        });
        svg.append("image")
            .attr('id', 'chart1-legend')
            .attr("x", xScaling + marginLeft)
            .attr("y", yScaling + marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.interpolator()).toDataURL());

        const n = Math.round(ticks + 1);
        tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
    }

    svg.append("g")
        .attr('id', 'chart1-legend-ticks')
        .attr("transform", `translate(${xScaling},${height - marginBottom + yScaling})`)
        .call(d3.axisBottom(x)
            .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
            .tickFormat(d => '' + Math.round(d*100)/100 + '%')
            .tickSize(tickSize)
            .tickValues(tickValues))
        .call(tickAdjust)
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", marginLeft)
            .attr("y", marginTop + marginBottom - height - 60)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .attr("font-size", fontSize)
            .text(title));

    return svg.node();
}

function ramp(color, n = 256) {
    var canvas = document.createElement('canvas');
    canvas.width = n;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    for (let i = 0; i < n; ++i) {
        context.fillStyle = color(i / (n - 1));
        context.fillRect(i, 0, 1, 1);
    }
    return canvas;
}



window.addEventListener("resize", function () {
    d3.select('#chart1-svg').attr('height', 1)
    d3.select('#chart1-svg').attr('height', d3.select('#multi_line_svg').node().parentElement.parentElement.parentElement.scrollHeight * 2 - d3.select('#heatmap-title').node().scrollHeight)
});



function colorMap(d) {
    builds = d3.selectAll('.map-building').style('opacity', defocusOpacity).style('fill', 'lightgray')
    if (builds.nodes().length > 0) {
        d3.selectAll('.map-building:not([data-selected])').style('fill', 'lightgray')
    }

    ds = d.filter(x => {
        return x['date'] >= dateSliderStart && x['date'] <= dateSliderEnd
    }).filter(x => {
        return selectedBuildingIds.includes(x['buildingId'])
    })
    let unique = [...new Set(ds.map(x => x['employerId']))]

    if (unique.length == 0) {
        ds = d.filter(x => {
            return x['date'] >= dateSliderStart && x['date'] <= dateSliderEnd
        })
        unique = [...new Set(ds.map(x => x['employerId']))]
    }

    unitTurnover = []
    for (var i = 0; i < unique.length; i++) {
        emp = ds.filter(x => x['employerId'] == unique[i]).map(x => x['positionsFilled'])
        fires = 0
        for (var j = 1; j < emp.length; j++) {
            if (emp[j] < emp[j - 1]) {
                fires += emp[j - 1] - emp[j]
            }
        }
        sUnique = '' + unique[i]
        unitTurnover.push({ 'employerId': unique[i], 'turnoverRate': fires / ((emp[0] + emp[emp.length - 1]) / 2) * 100 })
    }

    turnovers = unitTurnover.map(x => x['turnoverRate'])
    min = Math.min(...turnovers)
    max = Math.max(...turnovers)
    if (max - min > 0) {
        unitTurnover = unitTurnover.map(x => ({ ...x, 'colorDecimal': ((x['turnoverRate'] - min) / (max - min)) }))
    }
    else {
        unitTurnover = unitTurnover.map(x => ({ ...x, 'colorDecimal': 0.5 }))
    }
    for (i = 0; i < unitTurnover.length; i++) {
        d3.select('.unit' + unitTurnover[i]['employerId']).style('fill', d3.interpolatePlasma(unitTurnover[i]['colorDecimal'])).style('opacity', 1)
    }

    d3.select('#chart1-legend').remove()
    d3.select('#chart1-legend-ticks').remove()
    legend({
        color: d3.scaleSequential([min, max], d3.interpolatePlasma),
        title: "Employee Turnover Rate"
    })
}


function buildClassString(buildingDataRow) {
    classes = 'map-building '
    classes += buildingDataRow['BuildingType']
    classes += ' buildingID' + buildingDataRow['BuildingID']
    for (var i = 0; i < buildingDataRow['Units'].length; i++) {
        classes += ' unit' + buildingDataRow['Units'][i]
    }
    if (buildingDataRow['Units'].length == 0) classes += ' unit-1'
    return classes
}

function pathToCenter(locations) {
    points = []
    for (i = 0; i < locations.length; i++) {
        points.push(...(locations[i].split(', ').map(x => x.split(' ').map(Number))))
    }
    return points.reduce((acc, cv) => [acc[0] + cv[0], acc[1] + cv[1]]).map(x => x / points.length)
}



//mapCorners = [-4762.19066918826, 2650, -30.08359080145072, 7850.037195143702];