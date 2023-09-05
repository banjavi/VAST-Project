let start = new Date('2022-01-01'); // Replace with your desired default start date
let end = new Date('2024-01-01'); // Replace with your desired default start date
let scatter_plot_clicked = false;
let lassoSelected = false;
let interactionSource = "";


/** EVENT LISTENERS IF YOU NEED THEM */
document.addEventListener('revenueSliderChanged', (event) => {
    revenueSliderValue = event.detail
    // console.log('Revenue slider value changed:', event.detail);
  })

document.addEventListener('dateSliderChanged', (event) => {
    start = event.detail.start
    end = event.detail.end
    updateData()
  })

  let currentButtonText;

// add event listener for the show.bs.dropdown event
document.getElementById('dropdown-button').addEventListener('show.bs.dropdown', () => {
  currentButtonText = document.getElementById('dropdown-button').textContent;
});

// add event listener for the dropdown menu
document.getElementById('demographic-dropdown').addEventListener('click', (event) => {
   //lassoSelected = false;

  //showFilterWarning(false)

  if (event.target !== event.currentTarget) {
    const demographic = event.target.textContent;
    document.getElementById('dropdown-button').textContent = demographic;

    selected_demographic = demographic;
    updateData();
  } else {
    // restore the button text if the weird area is clicked
    document.getElementById('dropdown-button').textContent = currentButtonText;
  }
});


// Begin
let globalData = [];
let reducedData = [];
let participantBuildings = [];
let selectedBuildingIds = [];
let lassodParticipantIds = [];

let radiusScale = '';
let opacityScale = '';
let xScale = '';
let yScale = '';

let bubbleColor = 'green'

let participant_statuses = [];
let selected_demographic = '';

const demographicValues = {
    'Household Size': 'householdSize',
    'Has Kids': 'haveKids',
    'Age': 'generation',
    'Education Level': 'educationLevel',
    'Interest Group': 'interestGroup',
    'Joviality': 'jovialityDescr'
};

const demographicMap = new Map(Object.entries(demographicValues));
const parseTime = d3.timeParse('%Y-%m');

let dottedLinesData = Array.from({length: 8}, (_, i) => i * 10000);

// to-do: make responsive 
const chart5_width = '100%';
const chart5_height = '100%';

// tooltip
const chart5_tooltip = d3.select('body')
            .append('div')
            .attr('class', 'chart5-tooltip')
            .style('position', 'absolute')
            .style('background-color', 'white')
            .style('border', '1px solid black')
            .style('border-radius', '5px')
            .style('padding', '5px')
            .style('font-size', '12pt')
            .style('pointer-events', 'none')
            .style('display', 'none')
            .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)')
            .style('transition', 'opacity 0.2s ease-in-out');


let svg_cloud_height = document.getElementById('chart5').clientHeight;
let svg_cloud_width = document.getElementById('chart5').clientWidth;

const chart_5_svg = d3.select('#chart5')
  .append('svg')
  .attr('id', 'svg5')
  .attr('viewBox', `0 0 ${svg_cloud_width} ${svg_cloud_height}`)
  .attr('class', 'h-100 w-100');

// Set margins
let cloud_margin = {top: 30, right: 30, bottom: 20, left: 70};
let cloud_width = svg_cloud_width - cloud_margin.left - cloud_margin.right;
let cloud_height = svg_cloud_height - cloud_margin.top - cloud_margin.bottom;

chart_5_svg
.attr('class', null)
.attr('width', cloud_width + cloud_margin.left + cloud_margin.right)
.attr('height', cloud_height + cloud_margin.top + cloud_margin.bottom);

// Add a rectangle with the desired background color
chart_5_svg.append('rect')
.attr('width', '100%')
.attr('height', '100%')
.attr('fill', 'white');



const backgroundLayer = chart_5_svg.append('g');
let simulationInitialized = false;
let simulation;
let circles;
let labels;




const yScaleCenter = cloud_height / 2 + cloud_margin.top;

const minDimension = Math.min(svg_cloud_width, svg_cloud_height);
const scaleFactor = minDimension / 800; // Assuming 800 is the original dimension
const minRadius = 10 * scaleFactor;
const maxRadius = 100 * scaleFactor;
yScale = d3.scaleLinear()
    .domain([0, 70000])
    .range([cloud_margin.top + maxRadius, cloud_height - cloud_margin.bottom - maxRadius]);





// Load and process data
document.addEventListener('DOMContentLoaded', function () {
    // test 
    //combineLogs();

   //console.log('switch to page 2')

    // Step 1: Participants 
    d3.csv('data/AveragedParticipantBalances.csv')
        .then((data) => {
            globalData = data.map(d => {
                return {
                    participantId: +d.participantID,
                    householdSize: +d.householdSize,
                    haveKids: d.haveKids,
                    age: +d.age,
                    educationLevel: abbreviateEducationLevel(d.educationLevel),
                    interestGroup: d.interestGroup,
                    joviality: parseFloat(d.joviality),
                    jovialityDescr: getJovialityDescr(+d.joviality),
                    generation: getGeneration(+d.age),
                    month: parseTime(d.month),
                    averageBalance: parseFloat(d.averageBalance)
                };
            });
            // Set the default demographic and update the chart
            selected_demographic = 'Household Size';
            updateData();        })
        .catch((error) => {
            console.log('Error loading data:', error);
        });

      // Load the CSV file using D3
  d3.csv("data/ParticipantIDBuildingIDMapping.csv").then(function (data) {
    // Iterate through the data to populate the array with pairs
    data.forEach(function (d) {
      participantBuildings.push({
        participantId: parseInt(d.participantId),
        buildingId: parseInt(d.buildingId),
      });
    });

    // Log the populated array to the console
    //console.log(participantBuildings);
  });

});








// Update data and scales
function updateData(){


    // filter global data by start and end month  HERE
    //console.log(start)
    //console.log(end)
    
    //console.log(globalData)
    var newArray = globalData.filter(function (el) {
      //console.log(el.month); console.log(start); console.log(data);
      //return el.month >= start && el.month <= end
      var elDate = new Date(el.month); 
      var elYearMonth = elDate.getFullYear() * 100 + elDate.getMonth();

      var startDate = new Date(start);
      //console.log(startDate)
      var startYearMonth = startDate.getFullYear() * 100 + startDate.getMonth();

      var endDate = new Date(end);
      var endYearMonth = endDate.getFullYear() * 100 + endDate.getMonth();



      // Filter by lasso'd participants when the lasso is active
      if (lassoSelected) {
        const participantId = el.participantId;
        return elYearMonth >= startYearMonth && elYearMonth <= endYearMonth && lassodParticipantIds.includes(participantId);
      }

      // compare year-month values
      return elYearMonth >= startYearMonth && elYearMonth <= endYearMonth;
    });

    // group data by attribute and calculate the average balance for each group
    const groupedData = newArray.reduce(groupByAttribute, []);
    reducedData = groupedData.map(d => {
        const averageData = calculateAverageBalance(d);

  // Preserve the hoverActive property across updates
  if (lassoSelected && interactionSource === "scatter") {
    averageData.hoverActive = lassodParticipantIds.some(participant => d.uniqueParticipants.has(participant)) ? 1 : 0;
  }  else if (interactionSource !== "scatter") {
    averageData.hoverActive = findHoverActive(reducedData, demographicMap.get(selected_demographic), d[demographicMap.get(selected_demographic)]);
  }
        return averageData;
    });

    //console.log(selected_demographic)
    //console.log(newArray)
    //console.log(groupedData)
    //console.log(reducedData)


    const minDimension = Math.min(svg_cloud_width, svg_cloud_height);
    const scaleFactor = minDimension / 800; // Assuming 800 is the original dimension
    const minRadius = 1.15* 10 * scaleFactor;
    const maxRadius = 1.15* 100 * scaleFactor;
    
    radiusScale = d3.scaleSqrt()
      .domain([0, 1011])
      .range([minRadius, maxRadius]);


    opacityScale = d3.scaleLinear()
    .domain([0, 70000])
    .range([0.4, 1]);

    const maxForceX = cloud_width - cloud_margin.right - radiusScale(1011);


    // Step 1: Calculate the total width for xScale (e.g., 80% of the SVG width)
    const xScaleWidth = svg_cloud_width * 0.8;

    // Step 2: Calculate the left and right margins to center the xScale within the SVG
    const xMarginLeft = (svg_cloud_width - xScaleWidth) / 2;
    const xMarginRight = svg_cloud_width - xMarginLeft;

    // Calculate the maximum value in the reducedData
    const maxValue = d3.max(reducedData, d => d.averageBalance);

    // Set the upper limit to at least 70,000, or whatever is highest
    const upperLimit = Math.max(70000, maxValue);


    yScale = d3.scaleLinear()
        .domain([0, upperLimit])
        .range([cloud_margin.top + maxRadius, cloud_height - cloud_margin.bottom - maxRadius]);


    // Step 3: Update the xScale range
    xScale = d3.scaleLinear()
        .domain([0, upperLimit])
        .range([xMarginLeft, xMarginRight]);


  // Calculate the step value based on the upper limit
  const stepValue = Math.ceil(upperLimit / 80000) * 10000;
  dottedLinesData = Array.from({length: 8}, (_, i) => i * stepValue);


  render(reducedData);

}



// Render circles, includes updates / removals
function render(data) {
    let attribute = demographicMap.get(selected_demographic)


    const circleGroups = chart_5_svg.selectAll('.circle-group')
    .data(data, d => d[attribute])
    .join(
      enter => enter
        .append('g')
        .attr('class', 'circle-group'),
      update => update,
      exit => exit.remove()
    );

   circles = circleGroups.selectAll('.circle')
    .data(d => [d])
    .join(
      enter => enter
        .append('circle')
        .attr('class', 'circle')
        .attr('fill', bubbleColor)
        .attr('stroke', 'black')
        .attr('stroke-width', 0)
        .attr('opacity', 0),
      update => update,
      exit => exit
      .transition()
      .duration(500)
      .attr('opacity', 0)
      .remove()
    )
    .attr('r', d => radiusScale(d.uniqueParticipants.size))
    .attr('opacity', d => opacityScale(d.averageBalance))
    .classed('glowing-border', d => d.hoverActive === 1) // Set glowing-border class based on the hoverActive property
    .on('click', function(event, d) {
      // check if the clicked circle already has the glowing-border class
      const hasGlowingBorder = d3.select(this).classed('glowing-border');
    
      // remove the glowing-border class from all circles
      circles.classed('glowing-border', false);
    
      circles.each(d => d.hoverActive = 0);

      if (!hasGlowingBorder) {
        d3.select(this).classed('glowing-border', true);
        d.hoverActive = 1; // Set hoverActive to 1 for the clicked circle
    
        let clickedSet = d3.select(this).datum().uniqueParticipants;
        let clickedArray = [...clickedSet];
        //console.log('Passing to bubbleClicked', clickedArray);
        bubbleClicked(clickedArray);
      } else {
        // handle the deselection case
        let allParticipants = [];
    
        // iterate through reducedData and collect all unique participants
        reducedData.forEach(d => {
          let participantsArray = [...d.uniqueParticipants];
          allParticipants = allParticipants.concat(participantsArray);
        });
        allParticipants = Array.from(new Set(allParticipants));
    
       // console.log('Passing all participants to bubbleClicked', allParticipants);
        bubbleClicked(allParticipants);

        //showFilterWarning(false)
      }
    })
    .on('mouseover', function(event, d) {
      chart5_tooltip
        .style('display', 'block')
        .style('opacity', 1)
        .html(`<b>${selected_demographic}</b>: ${d[attribute]}<br>
               <ul style="list-style-type: disc; margin: 5px 0; padding-left: 20px;">
                 <li># of Participants: ${d.uniqueParticipants.size}</li>
                 <li>Average Balance: ${formatCurrency(d.averageBalance)}</li>
               </ul>`);
      })
    .on('mousemove', function(event) {
      chart5_tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - chart5_tooltip.node().offsetHeight - 10) + 'px'); // position tooltip above the mouse
        //.style('left', (event.pageX + 10) + 'px')
        //.style('top', (event.pageY + 10) + 'px');
    })
    .on('mouseout', function() {
        chart5_tooltip.style('display', 'none');
    });

    // FOR SCATTER

   // circles
    //.classed('glowing-border', d => d.hoverActive === 1);






    labels = circleGroups.selectAll('.label')
    .data(d => [d])
    .join(
      enter => enter
        .append('text')
        .attr('class', 'label')
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', 'white')
        .attr('opacity', 1),
      update => update,
      exit => exit
        .transition()
        .duration(500)
        .attr('opacity', 0)
        .remove()
    )
    .text(d => {
        const radius = radiusScale(d.uniqueParticipants.size);
        const labelText = selected_demographic === 'Age' ? getGenerationAbbreviation(d[attribute]) : d[attribute] + '';
        if (radius > 30 || (radius <= 30 && labelText.length < 4)) {
            return labelText;
        } else {
            return labelText.charAt(0);
        }
    });
   
   
    if (!simulationInitialized) {
      simulation = d3.forceSimulation(data)
          .force('x', d3.forceX(d => xScale(d.averageBalance)).strength(1))
          .force('y', d3.forceY(yScaleCenter).strength(0.2))
          .force('collide', d3.forceCollide().radius(d => radiusScale(d.uniqueParticipants.size) + 1));
      simulationInitialized = true;
  } else {
      simulation
          .nodes(data)
          .force('x', d3.forceX(d => xScale(d.averageBalance)).strength(1))
          .force('y', d3.forceY(yScaleCenter).strength(0.2))
          .force('collide', d3.forceCollide().radius(d => radiusScale(d.uniqueParticipants.size) + 1))
          .alpha(scatter_plot_clicked ? 0 : 1)
          .restart();
  }
  
  scatter_plot_clicked = false; // Reset the variable after updating the simulation

      // Run the simulation to completion
      simulation.stop();
      for (var i = 0; i < 300; ++i) simulation.tick();

      // For entering circles, set initial opacity to 0 and then transition the opacity
      circles
        .enter()
        .attr('opacity', 0)
        .transition()
        .duration(500)
        .attr('opacity', d => opacityScale(d.averageBalance));

      // For entering labels, set initial opacity to 0 and then transition the opacity
      labels
        .enter()
        .attr('opacity', 1)
        .transition()
        .duration(500)
        .attr('opacity', 1);

      // Update positions based on the completed simulation using a transition for both `enter` and `update` selections
      circles
        .transition()
        .duration(500)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      labels
        .transition()
        .duration(500)
        .attr('x', d => d.x)
        .attr('y', d => d.y);

// dotted lines and labels
const lines = backgroundLayer.selectAll('.dotted-line')
    .data(dottedLinesData)
    .join(
        enter => enter
            .append('line')
            .attr('class', 'dotted-line')
            .attr('x1', d => xScale(d))
            .attr('x2', d => xScale(d))
            .attr('y1', cloud_margin.top) // 50% of the top margin
            .attr('y2', cloud_height - cloud_margin.bottom) // 50% of the bottom margin
            .attr('stroke', 'rgb(205, 205, 205)')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '1,1')
    );
    const lineLabels = backgroundLayer.selectAll('.line-label')
    .data(dottedLinesData)
    .join(
        enter => enter
            .append('text')
            .attr('class', 'line-label')
            .attr('x', d => xScale(d))
            .attr('y', cloud_height - cloud_margin.bottom + 10) // 50% of the bottom margin + 10
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('fill', 'black')
            .text(d => `$${d / 1000}k`)
    );


// gradient
const defs = chart_5_svg.selectAll('defs')
  .data([null]) // Single element array to create a single defs element
  .join('defs');

const gradient = defs.selectAll('#color-gradient')
  .data([null])
  .join(
    enter => enter
      .append('linearGradient')
      .attr('id', 'color-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%')
  );

gradient.selectAll('stop')
  .data([
    { offset: '0%', color: 'green', opacity: 0.4 },
    { offset: '100%', color: 'green', opacity: 1 }
  ])
  .join('stop')
  .attr('offset', d => d.offset)
  .attr('stop-color', d => d.color)
  .attr('stop-opacity', d => d.opacity);

// color gradient rectangle
chart_5_svg.selectAll('.color-gradient-rect')
  .data([null])
  .join(
    enter => enter
      .append('rect')
      .attr('class', 'color-gradient-rect')
      .attr('x', cloud_margin.left)
      .attr('y', cloud_height - cloud_margin.bottom + 20)
      .attr('width', cloud_width)
      .attr('height', 10)
      .style('fill', 'url(#color-gradient)')
  );

// Axis label
chart_5_svg.selectAll('.account-balance-label')
  .data([null])
  .join(
    enter => enter
      .append('text')
      .attr('class', 'account-balance-label')
      .attr('x', cloud_margin.left + cloud_width / 2)
      .attr('y', cloud_height + cloud_margin.top + 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '20')
      .attr('fill', 'black')
      .text('Average Account Balance')
  );

// Bubble size note
chart_5_svg.selectAll('.bubble-size-note')
  .data([null])
  .join(
    enter => enter
      .append('text')
      .attr('class', 'bubble-size-note')
      .attr('x', cloud_margin.left + cloud_width / 1)
      .attr('y', cloud_height + cloud_margin.top)
      .attr('text-anchor', 'end')
      .attr('font-size', '11px')
      .attr('fill', 'black')
      .text('Bubble size based on # of participants')
      .style('font-style', 'italic')
  );

// Add circles next to the text
const circleSizes = [12*.8, 8*.8, 4*.8];
const circleSpacing = 15;
const circleStartX = cloud_margin.left + cloud_width / 1;
const circleStartY = cloud_height + cloud_margin.top + 8

chart_5_svg.selectAll('.bubble-size-circle')
  .data(circleSizes)
  .join(
    enter => enter
      .append('circle')
      .attr('class', 'bubble-size-circle')
      .attr('cx', (d, i) => circleStartX - (i * circleSpacing) - d / 2.5)
      .attr('cy', circleStartY)
      .attr('r', d => d / 2.5)
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .style('opacity', 0.5)
  );



  }
// Groups the data by selected attribute, accumulating total balances and counts
function groupByAttribute(acc, item) {
    let attribute = demographicMap.get(selected_demographic)
    const existingAttr = acc.find(g => g[attribute] === item[attribute]);
    //console.log(item)
    if (existingAttr) {
        existingAttr.totalBalance += item.averageBalance;
        existingAttr.count += 1;
        existingAttr.uniqueParticipants.add(item.participantId); // Update the Set with the new participant id

        // Preserve hoverActive property
        existingAttr.hoverActive = existingAttr.hoverActive || item.hoverActive;
    } else {
      acc.push({
        [attribute]: item[attribute],
        totalBalance: item.averageBalance,
        count: 1,
        hoverActive: item.hoverActive || 0, // Initialize hoverActive with the value from the item or set to 0
        uniqueParticipants: new Set([item.participantId]) // Initialize the Set with the current participant id

      });
    }
    return acc;
  }
  



  function findHoverActive(data, attribute, attrValue) {
    const existingData = data.find(d => d[attribute] === attrValue);
    return existingData ? existingData.hoverActive : 0;
}












  // Calculates the average balance for each attribute group
  function calculateAverageBalance(group) {
    group.averageBalance = group.totalBalance / group.count;
    return group;
  }

// Derived attribute, Generation
 function getGeneration(age) {
    if (age >= 18 && age <= 26) {
        return 'Generation Z (18-26)';
    } else if (age >= 27 && age <= 42) {
        return 'Millennials (27-42)';
    } else if (age >= 43 && age <= 58) {
        return 'Generation X (43-58)';
    } else if (age >= 59) {
        return 'Baby Boomers (59+)';
    }
  }

  function getGenerationAbbreviation(generationText) {
    switch (generationText) {
        case 'Generation Z (18-26)':
            return 'Gen Z';
        case 'Millennials (27-42)':
            return 'Millenials';
        case 'Generation X (43-58)':
            return 'Gen X';
        case 'Baby Boomers (59+)':
            return 'BBs';
        default:
            return generationText;
    }
}

// Derived attribute, Jovialty
function getJovialityDescr(jovialty) {
    if (jovialty >= .666) {
        return 'High';
    } else if (jovialty >= .333) {
        return 'Medium';
    }else
        return 'Low';
}

// Add $ and digits
function formatCurrency(value) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function abbreviateEducationLevel(educationLevel) {
  if (educationLevel === 'HighSchoolOrCollege') {
      return 'HS/College';
  } else {
      return educationLevel;
  }
}


function scatterClicked(participantID) {
    scatter_plot_clicked = true;
  // Set the interaction source
  interactionSource = "scatter";

  //console.log('Participant ID clicked', participantID);
  participantID = Number(participantID);

  // Iterate through each item in reducedData
  reducedData.forEach(d => {
    //console.log(d.uniqueParticipants);
    if (d.uniqueParticipants.has(participantID)) {
      // If hoverActive is already 1, set it to 0; otherwise, set it to 1
      d.hoverActive = d.hoverActive === 1 ? 0 : 1;
      //console.log('Hover state toggled');
    } else {
      d.hoverActive = 0;
    }
  });

  //console.log(reducedData);

  render(reducedData);
}


function lassoSelectedUpdateBubble() {

  //console.log("Chart 5: All Participant Building Mappings");
  //console.log(participantBuildings);
  //console.log("Chart 5: All Participant Building Mappings");

  // process the selectedBuildings array to get an array of numeric building IDs
  selectedBuildingIds = [];
  selectedBuildings.forEach(element => {
    selectedBuildingIds.push(+element.split('building')[1].split('-')[0]);
  });
  
  //console.log("Chart5: Selected Buildings ID");
  //console.log(selectedBuildingIds);
  const lassodParticipants = participantBuildings.filter(pair =>
    selectedBuildingIds.includes(pair.buildingId)
  );

  // extract participantIds from the filtered array
  lassodParticipantIds = [...new Set(lassodParticipants.map(pair => pair.participantId))];
  //console.log("Chart5: Unique Participant IDs in Lasso");
  //console.log(lassodParticipantIds);

  
  /*
 reducedData.forEach(d => {
  // check if there is any mutual participant between uniqueParticipants and lassodParticipantIds
  const mutualParticipants = lassodParticipantIds.some(participant => d.uniqueParticipants.has(participant));
  d.hoverActive = mutualParticipants ? 1 : 0;
  });*/

  // (ERIC HERE) Send the participant IDs to the scatterplot
if(lassodParticipantIds.length != 0) {

  lassoSelected = true;
  showFilterWarning(true)
  bubbleClicked(lassodParticipantIds)
  updateData(reducedData);
}
else {
  lassoSelected = false;
  showFilterWarning(false)
  bubbleClicked(lassodParticipantIds)
  updateData(reducedData)

}

}