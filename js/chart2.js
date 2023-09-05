/** EVENT LISTENERS IF YOU NEED THEM */
document.addEventListener('revenueSliderChanged', (event) => {
    revenueSliderValue = event.detail
    drawLineChart()
    // console.log('Revenue slider value changed:', event.detail);
  })

document.addEventListener('dateSliderChanged', (event) => {
    start_date = event.detail.start
    end_date = event.detail.end
    drawLineChart()
  })

document.getElementById('demographic-dropdown').addEventListener('click', (event) => {
    const demographic = event.target.textContent
    //document.getElementById('dropdown-button').textContent = demographic
})



var lineWidth;
var lineHeight;
var lineInWidth;
var lineInHeight;
const lineMargin = {top: 35, bottom: 65, right: 20, left: 60};
var lineChartSVG;
var all_data = [];
var start_date = new Date('3/1/2022')
var end_date = new Date('5/24/2023')
var lineToolTip;
var xScaleLine;
var yScaleLine
var lineG;

document.addEventListener('DOMContentLoaded', function () {
  lineChartSVG = d3.select('#multi_line_svg')
  lineWidth = +lineChartSVG.style('width').replace('px','')
  lineHeight = +lineChartSVG.style('height').replace('px','')
  lineInWidth = lineWidth - lineMargin.left - lineMargin.right
  lineInHeight = lineHeight - lineMargin.top - lineMargin.bottom
  lineToolTip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("border", "1px solid black")
      .style("background-color", "white")
      .style("padding", "5px")
      .style("border", "1px solid black")
      .style("background-color", "white")
      .style("padding", "5px")
      .style('font-size', '12pt')
      .style("border-radius", "5px")
      .style("box-shadow", "2px 2px 5px rgba(0, 0, 0, 0.1)");
  lineG = lineChartSVG.append('g')
    .attr('transform', 'translate('+lineMargin.left+', '+lineMargin.top+')');

  d3.csv('data/DailyEmployeesByEmployer.csv')
  .then((data) => {
      data.forEach(item => {
        all_data.push({
          date: d3.timeParse("%Y-%m-%d")(item.date),
          employerId: +item.employerId,
          buildingId: +item.buildingId,
          jobsFilled: +item.positionsFilled,
        })
      });
        drawLineChart()
      })
      .catch((error) => {
          console.log('Error loading data:', error);
      });
});

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function drawLineChart() {
  let startDate = start_date
  let endDate = end_date
  let turnoverData = filterLineData(startDate, endDate)
  let maxTurnover = d3.max(turnoverData, d => d.turnoverRate)
  let minTurnover = d3.min(turnoverData, d => d.turnoverRate)
  xScaleLine = d3.scaleTime()
                    .domain([startDate, endDate]) // data space
                    .range([0, lineInWidth]); // pixel space
  const xAxis = d3.axisBottom(xScaleLine);

  yScaleLine = d3.scaleLinear()
                  .domain([minTurnover, maxTurnover])
                  .range([lineInHeight, 0])
  const yAxis = d3.axisLeft(yScaleLine);
  const colorScale = d3.scaleOrdinal(d3.schemeDark2)

  const line = d3.line()
      .curve(d3.curveMonotoneX)
      .x(function(d) { return xScaleLine(Date.parse(new Date(d['date']))); })
      .y(function(d) { return yScaleLine(d['turnoverRate']); });

  lineChartSVG.selectAll('.deleteItem').remove()
  lineChartSVG.selectAll('text').remove()

  var turnover_bisect = d3.bisector(function(d) { return d["date"]; }).left;

  lineG.selectAll('path')
    .data([turnoverData])
    .join(
      enter => {
        lines = enter.append('path')
                      .transition()
                      .duration(750)
                      .attr("d", d => line(d))
                      .style('fill','none')
                      .style('stroke', '#198754')
                      .style('stroke-width','3')
                      .attr('stroke-opacity', 1)
      },
      update => {
        update
          .transition()
          .duration(750)
          .ease(d3.easeLinear)
          .attr("d", d => line(d))
      },
      exit => {
        exit.transition()
          .duration(750)
          .style('opacity', 0)
          .remove()
      }
    )
  
  lineChartSVG.append('g')
            .attr("id", "y-axis")
            .attr('class', 'deleteItem')
            .attr('transform', 'translate('+lineMargin.left+', '+lineMargin.top+')')
            .call(yAxis)
  
  lineChartSVG.append('g')
      .call(xAxis)
      .attr('class', 'deleteItem').attr('class', 'deleteItem')
      .attr('transform',`translate(${lineMargin.left},${lineMargin.top + lineInHeight})`)
      .selectAll("text")                   // If you want to rotate the axis text,
          .style("text-anchor", "end")     // select it with the selectAll call and
          .attr("dx", "-10px")             // and slightly shift it (using dx, dy)
          .attr("dy", "0px")              // and then rotate it.
          .attr("transform", "rotate(-25) translate(10, 10)")
          .style('font-size', 11);

  lineChartSVG.append('text')
    .attr('x', lineInWidth/2)
    .attr('y', lineInHeight + 90)
    .attr('font-size', 20)
    .text("Date")

  lineChartSVG.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 15)
    .attr('x', -lineInHeight/2 - 30)
    .attr('text-anchor', 'middle')
    .attr('font-size', 20)
    .text(`Turnover Rate`)
  
  lineChartSVG.append('rect')
    .style("fill", "none")
    .style("pointer-events", "all")
    .attr('transform', `translate(${lineMargin.left}, ${lineMargin.top})`)
    .attr('width', lineInWidth)
    .attr('height',lineInHeight)
    .on('mouseover', lineMouseOver)
    .on('mousemove', lineMouseMove)
    .on('mouseout', lineMouseOut)
    .attr('class', 'deleteItem');
  
  // Create the circle that travels along the curve of chart
  var focus = lineChartSVG.append('g')
              .append('circle')
              .style("fill", "none")
              .attr("stroke", "black")
              .attr('r', 10)
              .style("opacity", 0)
              .attr('class', 'deleteItem')

  function lineMouseOver(event, i) {
    lineToolTip.transition()
                  .duration(50)
                  .style("opacity", 1);
    const [mouseX] = d3.pointer(event);
    const x0 = xScaleLine.invert(mouseX);
    let index = turnover_bisect(turnoverData, x0, 1);
    if (index > turnoverData.length - 1) {
      index = turnoverData.length - 1
    }
    let selectedData = turnoverData[index];
    let lineHoverDate = new Date(selectedData['date'])
    focus.style("opacity", 1);
    focus
      .attr("cx", xScaleLine(selectedData['date']))
      .attr("cy", yScaleLine(selectedData['turnoverRate']));
    let toolTipText = `<strong>Turnover Rate:</strong> $${selectedData['turnoverRate'].toFixed(2)}%<br><strong>Date:</strong> ${lineHoverDate.getMonth()}/${lineHoverDate.getDate()}/${lineHoverDate.getFullYear()}`;
    lineToolTip.html(toolTipText)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 15) + "px");
  }
  
  function lineMouseMove(event, i) {
    const [mouseX] = d3.pointer(event);
    const x0 = xScaleLine.invert(mouseX);
    let index = turnover_bisect(turnoverData, x0, 1);
    if (index > turnoverData.length - 1) {
      index = turnoverData.length - 1
    }
    let selectedData = turnoverData[index];
    let lineHoverDate = new Date(selectedData['date'])
    focus
      .attr("cx", xScaleLine(selectedData['date']) + lineMargin.left)
      .attr("cy", yScaleLine(selectedData['turnoverRate']) + lineMargin.top);
    let toolTipText = `<strong>Turnover Rate:</strong> ${selectedData['turnoverRate'].toFixed(2)}%<br><strong>Date:</strong> ${lineHoverDate.getMonth()}/${lineHoverDate.getDate()}/${lineHoverDate.getFullYear()}`;
    lineToolTip.html(toolTipText)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 15) + "px");
  }
  
  function lineMouseOut(d, i) {
    focus.style("opacity", 0);
    lineToolTip.transition()
              .duration(50)
              .style("opacity", 0);
  }
}

function filterLineData(start_date, end_date) {
  let circled_buildings = []

  selectedBuildings.forEach(element => {
    circled_buildings.push(+element.split('building')[1].split('-')[0])
  })

  // Filter by date range
  let filtered_data = all_data.filter(function (item) {
    if (! (item.date >= start_date && item.date <= end_date)) {
      return false
    }
    if (circled_buildings.length != 0 && (! circled_buildings.includes(item.buildingId))) {
      return false
    }
    return true
  });
  
  const sumsByDate = filtered_data.reduce((acc, cur) => {
    const { jobsFilled, date } = cur;
    const index = acc.findIndex((el) => el.date.getTime() === date.getTime());
    if (index === -1) {
      acc.push({ date, jobsFilled });
    } else {
      acc[index].jobsFilled += jobsFilled;
    }
    return acc;
  }, []);
  
  sumsByDate.sort(function(a,b){
    return a.date - b.date;
  });

  let turnoverRates = []

  for (let i = 0; i < sumsByDate.length - 1; i ++) {
    // Turnover is positive when employees leave and negative when employees join
    let turnover = (sumsByDate[i].jobsFilled - sumsByDate[i+1].jobsFilled)/((sumsByDate[i].jobsFilled + sumsByDate[i+1].jobsFilled)/2) * 100
    turnoverRates.push({turnoverRate: turnover, date: sumsByDate[i].date})
  }
  
  return turnoverRates
}