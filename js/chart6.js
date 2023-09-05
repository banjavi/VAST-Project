// /** EVENT LISTENERS IF YOU NEED THEM */
// document.addEventListener('revenueSliderChanged', (event) => {
//     revenueSliderValue = event.detail
//     // console.log('Revenue slider value changed:', event.detail);
//   })

// document.addEventListener('dateSliderChanged', (event) => {
//     start = event.detail.start
//     end = event.detail.end
//     // console.log(start)
//     // console.log(end)
//   })

document.getElementById('demographic-dropdown').addEventListener('click', (event) => {
    const demographic = event.target.textContent
    //document.getElementById('dropdown-button').textContent = demographic
    //console.log('Selected demographic:', demographic)

    // Set dot opacities back to 1
    if(!lassoSelected) {
    scatter_svg.selectAll(".dot")
      .transition()
      .attr("opacity", 1)
    }
})

// Define the SVG
var scatter_svg = d3.select("#chart6")
  .append("svg")
  .attr("id", "svg6")
  .attr("class", "h-100 w-100")
svg_scatter_height = document.getElementById('svg6').clientHeight
svg_scatter_width = document.getElementById('svg6').clientWidth

// Set scatter_margins
const scatter_margin = {top: 50, right: 50, bottom: 50, left: 70},
  scatter_width = svg_scatter_width - scatter_margin.left - scatter_margin.right,
  scatter_height = svg_scatter_height - scatter_margin.top - scatter_margin.bottom;
scatter_svg
  .attr("class", null)
  .attr("width", scatter_width + scatter_margin.left + scatter_margin.right)
  .attr("height", scatter_height + scatter_margin.top + scatter_margin.bottom)

// Create the main group
scatter_svg = scatter_svg.append("g")
  .attr("transform", "translate(" + scatter_margin.left + "," + scatter_margin.top + ")")

// Create x and y scales
const scatter_x = d3.scaleLinear()
  .domain([0, 3463])
  .range([0, scatter_width])
const scatter_y = d3.scaleLinear()
  .domain([0, 18400])
  .range([scatter_height, 0])

let all_scatter_data = []
let bubble_filtered_data = []
let scatter_data = []
let currentMonth = []

// Load the scatter_data from the CSV file
d3.csv("data/AggregatedFinancialJournal.csv").then(function(loaded_data) {
  all_scatter_data = loaded_data
  bubble_filtered_data = loaded_data
  drawGraph('2022-03')
})

function drawGraph(month) {

  currentMonth = month
  // Filter scatter_data
  scatter_data = bubble_filtered_data.filter(d => d.month === month)
  expenses = scatter_data.filter(d => d.category === 'expense')
  wages = scatter_data.filter(d => d.category === 'wage')

  // Axes
  scatter_svg.append("g")
    .attr("transform", "translate(0," + scatter_height + ")")
    .call(d3.axisBottom(scatter_x));
  scatter_svg.append("g")
    .call(d3.axisLeft(scatter_y));

  // X-axis label
  scatter_svg.append("text")
    .attr("transform", "translate(" + (scatter_width/2) + "," + (scatter_height + scatter_margin.bottom - 10) + ")")
    .attr("font-size", 20)
    .style("text-anchor", "middle")
    .text("Total Cost of Living: Rent + Other Expenses ($)")

  // Y-axis label
  scatter_svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - scatter_margin.left)
    .attr("x", 0 - (scatter_height / 2))
    .attr("font-size", 20)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Total Wages ($)");


  //   lineChartSVG.append('text')
  //   .attr('x', lineInWidth/2)
  //   .attr('y', lineInHeight + 90)
  //   .attr('font-size', 20)
  //   .text("Date")

  // lineChartSVG.append('text')
  //   .attr('transform', 'rotate(-90)')
  //   .attr('y', 15)
  //   .attr('x', -lineInHeight/2 - 30)
  //   .attr('text-anchor', 'middle')
  //   .attr('font-size', 20)
  //   .text(`Turnover Rate`)

  // Plot scatter_data
  scatter_svg.append('g')
    .selectAll(".dot")
    .data(expenses)
    .enter()
    .append("circle")
      .attr("class", "dot")
      .attr('id', d => d.participantId)
      .attr("cx", (d, i) => scatter_x(d.amount))
      .attr("cy", (d, i) => scatter_y(wages[i].amount))
      .style("fill", "green")
      .attr("opacity", 1)
      .attr("r", 4);
  
   setTooltipListeners()
}

var speed = 500
function updateGraph(month) {
  currentMonth = month
  scatter_data = bubble_filtered_data.filter(d => d.month === month)
  expenses = scatter_data.filter(d => d.category === 'expense')
  wages = scatter_data.filter(d => d.category === 'wage')

  scatter_svg.selectAll(".dot")
    .data(expenses)
    .transition()
      .ease(d3.easeLinear)
      .duration(speed)
      .attr('cx', d => scatter_x(d.amount))
      .attr('cy', (d, i) => scatter_y(wages[i].amount))

  setTooltipListeners()
}

function playAnimation() {
  months = ['2022-03', '2022-04', '2022-05','2022-06', '2022-07', '2022-08', '2022-09', '2022-10',
  '2022-11', '2022-12', '2023-01', '2023-02', '2023-03', '2023-04', '2023-05']

  // Disable buttons
  let playButton = document.getElementById("animateChart6")
  let dropdown = document.getElementById("chart6_month_dropdown_button")
  dropdown.disabled = true
  playButton.disabled = true
  
  // Close the month dropdown
  $('#chart6_month_dropdown').dropdown('hide')

  for (let i = 0; i < months.length; i++) {
    setTimeout(() => {
      $('#chart6_month_dropdown_button').text(months[i]);
      updateGraph(months[i])
    }, i * speed)
  }
  setTimeout(() => {
      dropdown.disabled = null
      playButton.disabled = null
  }, months.length * speed)
}

// If user selects a month, update the chart
$('#chart6_month_dropdown').on('click', 'a', function() {
  var selectedText = $(this).text();
  $('#chart6_month_dropdown_button').text(selectedText);
  updateGraph(selectedText)
});

// Tooltip
const tooltip = d3.select(".navbar").append("div")
    .attr("id", "tooltip")
    // .style("position", "absolute")
    // .attr("class", "bg-success text-light rounded-3 p-3")
    .style("visibility", "hidden")
    .style("z-index", 9999)
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

// Tooltip event listeners
function setTooltipListeners() {
  scatter_svg.selectAll(".dot")
      .on("mouseover", function() {
        var id = d3.select(this).attr("id");
        row = scatter_data.filter(d => d.participantId === id);
        wage = row.filter(d => d.category === 'wage')[0]
        expense = row.filter(d => d.category === 'expense')[0]
        tooltip
          .style("visibility", "visible")
          .style("white-space", "pre-wrap")
          .html("<strong>Participant ID</strong>: " + wage.participantId +
          "\n<strong>Total Wages in " + wage.month + "</strong>: $" + wage.amount +
          "\n<strong>Total Expenses in " + expense.month + "</strong>: $" + expense.amount)
      })
      .on("mousemove", function(event) {
          tooltip
              .style("top", (event.pageY - 100) + "px")
              .style("left", (event.pageX + 10) + "px")
      })
      .on("mouseout", function() {
          tooltip.style("visibility", "hidden")
      })
      .on("click", function() {
        var id = d3.select(this).attr("id");
        scatterClicked(id)
      })
}

function bubbleClicked(participants) {
  bubble_filtered_data = []
  let showAll = false
  //showFilterWarning(false)
  if(participants.length == 0 || participants.length == 880) {
    showAll = true
  }
  else {
    bubble_filtered_data = scatter_data.filter(function(element) {
      return !participants.includes(parseInt(element.participantId))
    })
  }

  expenses = bubble_filtered_data.filter(d => d.category === 'expense')
  wages = bubble_filtered_data.filter(d => d.category === 'wage')

  scatter_svg.selectAll(".dot")
    .transition()
    .duration(speed)
    .attr("opacity", function(d) {
      // Check if the participantId exists in the participants array
      if (showAll || participants.includes(parseInt(d.participantId))) {
          return 1
      } else {
          return 0.1
      }
    })

  bubble_filtered_data = all_scatter_data;
}

function showFilterWarning(state) {
  if(state) {
    document.getElementById("filtering_warning").style = "opacity: 100%;"
  }
  else {
    document.getElementById("filtering_warning").style = "opacity: 0%;"
  }
}