

var bar_width, bar_height, bar_innerWidth, bar_innerHeight;
const bar_margin = {top: 30, bottom: 50, right: 20, left: 65};
var bar_svg, bar_g, bar_x_axis, bar_y_axis;
var allData = []; 
const colorDictionary = {
  APARTMENT: "#C44872",
  SCHOOL: "#48C4BF",
  PUB: "#EFC33E",
  RESTAURANT: "#5C48C4"
};



/** EVENT LISTENERS IF YOU NEED THEM */
let bar_revenueMin = 0;
let bar_revenueMax = 8246; 
document.addEventListener('revenueSliderChanged', (event) => {
    bar_revenueMin = event.detail[0]
    bar_revenueMax = event.detail[1]
    drawBar()
})

let bar_start = new Date('2022-01-01'); // Replace with your desired default start date
let bar_end = new Date('2024-01-01'); // Replace with your desired default start date
document.addEventListener('dateSliderChanged', (event) => {
    bar_start = event.detail.start
    bar_end = event.detail.end
    // console.log(bar_start)
    // console.log(bar_end)
    drawBar()
  })

document.getElementById('demographic-dropdown').addEventListener('click', (event) => {
    const demographic = event.target.textContent
    //document.getElementById('dropdown-button').textContent = demographic
    // console.log('Selected demographic:', demographic)
})

document.addEventListener('DOMContentLoaded', function () {
  bar_svg = d3.select('#bar_svg')
  bar_width = +bar_svg.style('width').replace('px','')
  bar_height = +bar_svg.style('height').replace('px','')
  bar_innerWidth = bar_width - bar_margin.left - bar_margin.right
  bar_innerHeight = bar_height - bar_margin.top - bar_margin.bottom

  bar_g = bar_svg.append('g')
    .attr('transform', `translate(${bar_margin.left},${bar_margin.top})`);

  // Init axis 
  bar_x_axis = bar_svg.append('g')
  bar_y_axis = bar_svg.append('g').attr('transform', `translate(${bar_margin.left},${bar_margin.top})`);
  bar_svg.append('text')
    .attr('transform','rotate(-90)')
    .attr('y','+15px')
    .attr('x',-bar_height/2 + 8)
    .attr('text-anchor','middle')
    .text('Total Revenue ($)')
    .attr('font-size', 20)    // 

  d3.csv('data/DailyRevenueByBusinessLocation.csv')
      .then((data) => {
          data.forEach(item => {
            allData.push({
              date: d3.timeParse("%Y-%m-%d")(item.date),
              unitId: +item.unitId,
              buildingId: +item.buildingId,
              location: item.location,
              revenue: +item.revenue,
              type: item.type,
            })
          });
          drawBar()

      })
      .catch((error) => {
          console.log('Error loading data:', error);
      });
});


function drawBar() {
  // Clear old chart
  // bar_g.selectAll('*').remove()

  // Filter data to selected slider ranges and map lasso
  data = filterData()

  // Scales
  const colorScale = d3.scaleOrdinal(d3.schemeDark2)
  const xScale = d3.scaleBand()
    .domain(data.map(function(d) { return d.type; }))
    .range([0, bar_innerWidth])
    .padding(0.2)
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, function(d) { return d.totalRevenue; }) + 0.01])
    .range([bar_innerHeight, 0])

  // X axis
  bar_x_axis
    .transition()
    .duration(1000)
    .call(d3.axisBottom(xScale).tickSize(0))
    .attr('transform', `translate(${bar_margin.left}, ${bar_innerHeight + bar_margin.top})`)
    .selectAll('text')
        // .style('font', '11px Helvetica Neue')
        .attr("transform", "rotate(-25) translate(-10, 15)")
  // Y axis
  bar_y_axis
    .transition()
    .duration(1000)
    .call(d3.axisLeft(yScale).tickFormat(d => d/1000000 + ' M'))
    .selectAll('text')
      // .style('font', '11px Helvetica Neue')

    
  bar_g.selectAll('g')
    .data(data, (d) => d.type)
    .join(
      enter => {
        const g = enter.append('g')
        // Bars
        const bar = g.append('rect')
            .attr('id', d => `bar_${d.type}`)
            .attr('class', 'chart3_bars')
            .attr('x', d => xScale(d.type))
            .attr('y', d => yScale(d.totalRevenue))
            .attr('height', d => bar_innerHeight - yScale(d.totalRevenue))
            .attr('width', xScale.bandwidth())
            // Styling
            .attr('fill', d => colorDictionary[d.type])
            .attr('stroke', 'black')
            .attr('stroke-width', '1.5px')
            .attr('rx', 3)   // rounder corners
            // Hover interaction
            .on('mouseover', function(e) {
              // Bar
              d3.selectAll('.chart3_bars')
                .attr('opacity', 0.5)
              d3.select('#'+e.target.id)
                .attr('opacity', 1)
              // Bar label
              d3.selectAll('.bar_label')
                  .attr('opacity', 0.5)
              d3.select('#bar_lab_'+e.target.id.split('_')[1])
                .attr('opacity', 1)
              // Tooltip
              d3.select('.tooltip')
                .transition()
                .duration(200)
                .style('opacity', 1)
            })
            .on('mousemove', function(e, d) {
              // Bar
              d3.selectAll('.chart3_bars')
                .attr('opacity', 0.5)
              d3.select('#'+e.target.id)
                .attr('opacity', 1)
              // Bar label 
              d3.selectAll('.bar_label')
                .attr('opacity', 0.5)
              d3.select('#bar_lab_'+e.target.id.split('_')[1])
                .attr('opacity', 1)
              // Tooltip
              d3.select('.tooltip')
                .html(`<strong>Type:</strong> ${d.type}
                      <br> 
                      <strong>Revenue:</strong> $${d3.format(',')(Math.round(d.totalRevenue))}`
                )
                // .attr('opacity', 1)
                .style("left", (e.pageX + 10) + 'px')
                .style("top", (e.pageY - 30) + 'px')
            })
            .on('mouseout', function(e) {
              // Bar
              d3.selectAll('.chart3_bars')
                .attr('opacity', 1)
              // Bar label
              d3.selectAll('.bar_label')
                .attr('opacity', 1)
              // Tooltip
              d3.select('.tooltip')
                .transition()
                .duration(500)
                .style('opacity', 0);
            })

        // Bar labels
        const label = g.append('text')
          .text(d => Math.round(d.totalRevenue/1000000 * 100)/100)
          .attr('id', d => `bar_lab_${d.type}`)
          .attr('class', 'bar_label')
          .attr('x', d => xScale(d.type) + xScale.bandwidth() / 2)
          .attr('y', d => yScale(d.totalRevenue) - 3)
          .style('font', '11px Helvetica Neue')
          .attr('text-anchor', 'middle')
        

      },
      update => {
        // Animate bars
        update.select('rect')
          .transition()
          .duration(700)
          .attr('x', d => xScale(d.type))
          .attr('y', d => yScale(d.totalRevenue))
          .attr('height', d => bar_innerHeight - yScale(d.totalRevenue))
        
        // Animate bar labels
        update.select('text')
          .transition()
          .duration(700)
          .text(d => Math.round(d.totalRevenue/1000000 * 100)/100)
          .attr('x', d => xScale(d.type) + xScale.bandwidth() / 2)
          .attr('y', d => yScale(d.totalRevenue) - 3);

      }
    )

}


function filterData() {
  // Filter by date range
  var filteredData = allData.filter(function (item) {
    return item.date >= bar_start && item.date <= bar_end 
  });

  // If region selected then filter by region otherwise get revenue for entire city
  if (selectedBuildings.length > 0) {
    // If a building only has one unit then use building ID to filter otherwise use unit ID
    // Get the building ids of building with only one unit; get the unit ids of buildings with more than one unit
    let singleUnitBuildingIds = []
    let multiUnitUnitIds = []
    selectedBuildings.forEach(element => {
      let ids = element.split('-')
      if (ids.length == 1) {
        singleUnitBuildingIds.push(+ids[0].replace('building', ''))
      }
      else {
        multiUnitUnitIds.push(+ids[1])
      }
    })
    // console.log(singleUnitBuildingIds)
    // console.log(multiUnitUnitIds)
    // console.log(selectedBuildings)

    // Get records of the selected area by building id and unit id. 
    filteredData = filteredData.filter(function (item) {
      return singleUnitBuildingIds.includes(item.buildingId) || multiUnitUnitIds.includes(item.unitId)
    })
  }


  // Aggregate by business type
  agg = filteredData.reduce(function(res, value) {
    if (!res[value.type]) {
      res[value.type] = {type: value.type.toUpperCase(), totalRevenue: 0};
    }
    //// Filter by daily revenue range 
    if (value.revenue >= bar_revenueMin && value.revenue <= bar_revenueMax) {
      res[value.type].totalRevenue += value.revenue
    }
    return res;
  }, {});

  
  // Add biz objects if there was no revenue. Otherwise chart will only have bars for biz with revenue
  var aggData = []
  for (const biz of ['apartment', 'pub', 'restaurant', 'school']) {
    if (!agg[biz]) {
      aggData.push({type: biz.toUpperCase(), totalRevenue: 0})
    }
    else {
      aggData.push(agg[biz])
    }
  }

  // Sort biz types by revenue descending
  aggData.sort(function(a, b) {
    return d3.descending(a.totalRevenue, b.totalRevenue)
  })
  // console.log(aggData)

  return aggData
}



