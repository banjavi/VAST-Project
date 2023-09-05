var streamRawData = [];

const colorDictionary2 = {
  apartment: "#C44872",
  school: "#48C4BF",
  pub: "#EFC33E",
  restaurant: "#5C48C4"
};


// Create SVG container for the stream graph
const streamSvg = d3.select("#chart4")
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%")
  .attr('id', 'chart4-svg');

const tooltipChartFour = d3
  .select("body")
  .append("div")
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

//I think in the future, Chart 3 and Chart 4 should combine there csv loading into a Promise so that we only execute once and the data is passed over. 
document.addEventListener('DOMContentLoaded', function () {
  d3.csv('data/DailyRevenueByBusinessLocation.csv', d3.autoType)
    .then((data) => {
      data.forEach(item => {
        streamRawData.push({
          date: item.date,
          unitId: item.unitId,
          buildingId: item.buildingId,
          location: item.location,
          revenue: item.revenue,
          type: item.type,
        })
      });
      drawNormalizedStreamGraph();
    })
});

/** EVENT LISTENERS IF YOU NEED THEM */
let stream_revenueMin = 0;
let stream_revenueMax = 8246;
document.addEventListener('revenueSliderChanged', (event) => {
  stream_revenueMin = event.detail[0]
  stream_revenueMax = event.detail[1]
  drawNormalizedStreamGraph()
})

let stream_start = new Date('2022-01-01'); // Replace with your desired default start date
let stream_end = new Date('2024-01-01'); // Replace with your desired default start date
document.addEventListener('dateSliderChanged', (event) => {
  stream_start = event.detail.start
  stream_end = event.detail.end
  // console.log(stream_start)
  // console.log(stream_end)
  drawNormalizedStreamGraph()
})

function findMatchingSeries(series, key) {
  const matchingSeries = series.find((s) => s.key === key);
  return matchingSeries ? matchingSeries : [];
}

function drawNormalizedStreamGraph() {

  const data = prepareStreamGraphData(streamRawData);

  if (data.length === 0) {
    console.log("No data to display.");
    return;
  }


  let { height, width } = d3.select('#chart4-svg').node().getBoundingClientRect();
  const streamMargin = { top: 30, right: 30, bottom: 50, left: 50 };
  const streamWidth = width - streamMargin.left - streamMargin.right;
  const streamHeight = height - streamMargin.top - streamMargin.bottom;

  //X and Y Scale
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([0, streamWidth]);

  const yScale = d3.scaleLinear().domain([0, 1]).range([streamHeight, 0]);

  //This creates a Stream Graph Stack
  const stack = d3
    .stack()
    .offset(d3.stackOffsetExpand)
    .keys(Object.keys(data[0]).filter((key) => key !== "date"));
  const series = stack(data);
  
  //Build an Area out of the Stacks
  const area = d3
    .area()
    .curve(d3.curveBasis)
    .x((d) => {
      const xVal = xScale(d.data.date);
      return xVal;
    })
    .y0((d) => {
      const y0Val = yScale(d[0]);
      return y0Val;
    })
    .y1((d) => {
      const y1Val = yScale(d[1]);
      return y1Val;
    });

  const g = streamSvg
    .selectAll("g")
    .data([null])
    .join("g")
    .attr("transform", `translate(${streamMargin.left},${streamMargin.top})`);

  duration = 700

  const paths = g.selectAll("path")
    .data(series, (d) => d.key);

  const prevSeries = g.selectAll("path").data();

  paths
    .join(
      (enter) =>
        enter
          .append("path")
          .attr("fill", (_, i) => colorDictionary2[series[i].key])
          .attr("d", (d) => area(findMatchingSeries(prevSeries, d.key))) // Set initial path from previous data
          .style("opacity", 0.7)
          .style("stroke", "white")
          .style("stroke-width", "0.5px"),
      (update) => update,
      (exit) => exit.remove()
    )
    //Hover Functionality (Tooltip, Highlight)
    .on("mouseover", (event, d) => {
      d3.select(event.currentTarget)
        .classed("segment-hover", true);
      tooltipChartFour.transition().duration(200).style("opacity", 1);
    })
    .on("mousemove", (event, d) => {
      const [mouseX] = d3.pointer(event);
      const mouseDate = xScale.invert(mouseX - streamMargin.left);
      const bisectDate = d3.bisector((segment) => segment.data.date).left;
      const idx = bisectDate(d, mouseDate, 1);
      const segmentData = d[idx - 1];
      const date = d3.timeFormat("%Y-%m-%d")(segmentData.data.date);
      const revenueProportion = ((segmentData[1] - segmentData[0]) * 100).toFixed(2);
      tooltipChartFour
        .html(`<strong>Type:</strong> ${(d.key.toUpperCase())}<br>
               <strong>Date:</strong> ${date}<br>
               <strong>Revenue Proportion:</strong> ${revenueProportion}%`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 40) + "px");
    })
    .on("mouseout", (event, d) => {
      d3.select(event.currentTarget)
        .classed("segment-hover", false);
      tooltipChartFour.transition().duration(500).style("opacity", 0);
    })
    .transition() //
    .duration(duration) //
    .ease(d3.easeLinear) //Transition types: {easeCubicInOut, easeLinear, easeQuadInOut, easeExpInOut}
    .attr("d", area);
  //Note these transitions are WEIRD. Comment out the marked Lines to remove them. 

  g.selectAll('text').remove()


  //Axes Definitions
  g.append("g")
    .attr("transform", `translate(0,${streamHeight})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b")));

  g.append("g").call(
    d3
      .axisLeft(yScale)
      .tickFormat(d3.format(".0%"))
      .ticks(5)
  );


  // Add x-axis label
  g.append("text")
    .attr("transform", `translate(${streamWidth / 2},${streamHeight + streamMargin.bottom - 5})`)
    .style("text-anchor", "middle")
    .style('font-size', '20px')
    .text("Date");

  // Add y-axis label
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - streamMargin.left - 5)
    .attr("x", 0 - streamHeight / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style('font-size', '20px')
    .text("Cumulative Revenue");


}


function prepareStreamGraphData(data) {
  // Filter by date range and revenue range
  let filteredData = data.filter(function (item) {
    return item.date >= stream_start && item.date <= stream_end && item.revenue >= stream_revenueMin && item.revenue <= stream_revenueMax;
  });

  // If region selected then filter by region otherwise get revenue for entire city
  //console.log(selectedBuildings)
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

    // Get records of the selected area by building id and unit id. 
    filteredData = filteredData.filter(function (item) {
      return singleUnitBuildingIds.includes(item.buildingId) || multiUnitUnitIds.includes(item.unitId)
    })
  }


  // Aggregate the data by date and business type
  const aggregatedData = d3
    .rollup(
      filteredData,
      (v) => d3.sum(v, (d) => d.revenue),
      (d) => d.date,
      (d) => d.type
    )
    .entries();
  const aggregatedDataArray = Array.from(aggregatedData, ([date, types]) => [date, new Map(types)]);

  // Transform the aggregated data into the desired format
  const transformedData = aggregatedDataArray.map(([date, types]) => {
    const dateData = { date };
    // Initialize values for each business type
    dateData['apartment'] = 0;
    dateData['pub'] = 0;
    dateData['school'] = 0;
    dateData['restaurant'] = 0;
    types.forEach((value, type) => {
      dateData[type] = value;
    });
    return dateData;
  });

  // Sort the data by date
  transformedData.sort((a, b) => a.date - b.date);

  // Ensure date values are properly formatted as dates
  transformedData.forEach((item) => {
    item.date = new Date(item.date);
  });

  // Calculate cumulative proportions for each business type
  let cumulativeData = [];
  let cumulativeApartment = 0;
  let cumulativePub = 0;
  let cumulativeRestaurant = 0;
  let cumulativeSchool = 0;

  transformedData.forEach((item) => {
    cumulativeApartment += item.apartment;
    cumulativePub += item.pub;
    cumulativeSchool += item.school;
    cumulativeRestaurant += item.restaurant;

    let total = cumulativeApartment + cumulativePub + cumulativeSchool + cumulativeRestaurant;

    cumulativeData.push({
      date: item.date,
      apartment: cumulativeApartment / total,
      pub: cumulativePub / total,
      school: cumulativeSchool / total,
      restaurant: cumulativeRestaurant / total,
    });
  });

  return cumulativeData;
}






