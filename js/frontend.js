/** EASE OF USE: IF YOU ARE WORKING ON PAGE 2, SET THIS TO TRUE */
let workingOnPage2 = false
if(workingOnPage2) {
    $('#page1').css('transform', 'translateX(-100%)')
    $('#page2').css('transform', 'translateX(0%)')
}

// Controls transitions between pages
$(document).ready(function () {
    $('.slide-btn').click(function (event) {
      event.preventDefault()
      const target = $(this).data('target')
  
      if (target === 'page1') {
        $('#page1').css('transform', 'translateX(0%)')
        $('#page2').css('transform', 'translateX(100%)')
      } else if (target === 'page2') {
        $('#page1').css('transform', 'translateX(-100%)')
        $('#page2').css('transform', 'translateX(0%)')
      }
    })
  })
  
// Controls the revenue slider on the businesses page
$(function() {
    $("#slider-range-revenue").slider({
        range: true,
        min: 0,
        // max: 500,
        // values: [0, 500],
        max: 8246,
        values: [0, 8246],
        slide: function(event, ui) {
            $("#amount").val("$" + ui.values[0] + " - $" + ui.values[1])
        },
        stop: function(event, ui) {
            const customEvent = new CustomEvent("revenueSliderChanged", {detail: ui.values})
            document.dispatchEvent(customEvent)
        }
    })
    $("#amount").val("$" + $("#slider-range-revenue").slider("values", 0) +
        " - $" + $("#slider-range-revenue").slider("values", 1))
})

// Initializes the date slider on both pages
var minDate = new Date(2022, 2, 1)
var maxDate = new Date(2023, 4, 24)
var totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24)
function formatDate(date) {
    return date.toLocaleDateString()
}
function initializeDateSlider(sliderID, inputID) {
    $( "#" + sliderID ).slider({
        range: true,
        min: 0,
        max: totalDays,
        values: [0, totalDays],
        slide: function (event, ui) {
            var startDate = new Date(minDate)
            startDate.setDate(startDate.getDate() + ui.values[0])

            var endDate = new Date(minDate)
            endDate.setDate(endDate.getDate() + ui.values[1])

            $("#" + inputID).val(formatDate(startDate) + " - " + formatDate(endDate))
        },
        stop: function(event, ui) {
            let startValue = ui.values[0]
            let endValue = ui.values[1]

            var startDate = new Date(minDate)
            startDate.setDate(startDate.getDate() + startValue)

            var endDate = new Date(minDate)
            endDate.setDate(endDate.getDate() + endValue)

            const customEvent = new CustomEvent("dateSliderChanged", { detail: {start: startDate, end: endDate} })
            document.dispatchEvent(customEvent)
        }
    })
    var initialStartDate = new Date(minDate)
    initialStartDate.setDate(initialStartDate.getDate() + $("#" + sliderID).slider("values", 0))
    var initialEndDate = new Date(minDate)
    initialEndDate.setDate(initialEndDate.getDate() + $("#" + sliderID).slider("values", 1))
    $("#" + inputID).val(formatDate(initialStartDate) + " - " + formatDate(initialEndDate))
}
initializeDateSlider("slider-range-date-businesses", "date-businesses")
initializeDateSlider("slider-range-date-people", "date-people")

// Keeps the two sliders in sync
function updateSliders(sliderID) {
    let otherSliderID = ''
    let otherLabel = ''
    if(sliderID === 'slider-range-date-businesses') {
        otherSliderID = 'slider-range-date-people'
        otherLabel = 'date-people'
    }
    else {
        otherSliderID = 'slider-range-date-businesses'
        otherLabel = 'date-businesses'
    }

    //get the values for the first slider
    let values = $("#" + sliderID).slider("values")

    //change the other slider
    $("#" + otherSliderID).slider("values", values)

    //change the other slider's labels
    var initialStartDate = new Date(minDate)
    initialStartDate.setDate(initialStartDate.getDate() + values[0])
    var initialEndDate = new Date(minDate)
    initialEndDate.setDate(initialEndDate.getDate() + values[1])
    $("#" + otherLabel).val(formatDate(initialStartDate) + " - " + formatDate(initialEndDate))
}