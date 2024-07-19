/* Peity charts */

$(".peity-donut").peity("donut");

function revenuechart() {
  /*LIne-Chart */
  var ctx = document.getElementById("revenuechart").getContext("2d");
  var myChart = new Chart(ctx, {
    type: "line",

    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      datasets: [
        {
          label: "Order",
          data: [30, 150, 65, 160, 70, 130, 70, 120],
          borderWidth: 3,
          backgroundColor: "transparent",
          borderColor: "rgba(183, 179, 220,0.5)",
          pointBackgroundColor: "#ffffff",
          pointRadius: 0,
          borderDash: [4, 3],
        },
        {
          label: "Sale",
          data: [50, 90, 210, 90, 150, 75, 200, 70],
          borderWidth: 3,
          backgroundColor: "transparent",
          borderColor: myVarVal,
          pointBackgroundColor: "#ffffff",
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      tooltips: {
        enabled: true,
      },
      tooltips: {
        mode: "index",
        intersect: false,
      },
      hover: {
        mode: "nearest",
        intersect: true,
      },
      scales: {
        xAxes: [
          {
            ticks: {
              fontColor: "#c8ccdb",
            },
            barPercentage: 0.7,
            display: true,
            gridLines: {
              color: "rgba(119, 119, 142, 0.2)",
              zeroLineColor: "rgba(119, 119, 142, 0.2)",
            },
          },
        ],
        yAxes: [
          {
            ticks: {
              fontColor: "#77778e",
            },
            display: true,
            gridLines: {
              color: "rgba(119, 119, 142, 0.2)",
              zeroLineColor: "rgba(119, 119, 142, 0.2)",
            },
            ticks: {
              min: 0,
              max: 250,
              stepSize: 50,
            },
            scaleLabel: {
              display: true,
              labelString: "Thousands",
              fontColor: "transparent",
            },
          },
        ],
      },
      legend: {
        display: true,
        width: 30,
        height: 30,
        borderRadius: 50,
        labels: {
          fontColor: "#77778e",
        },
      },
    },
  });
}

function recentorders() {
  /*--- Apex (#chart) ---*/
  var options = {
    chart: {
      height: 265,
      type: "radialBar",
      offsetX: 0,
      offsetY: 0,
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        size: 120,
        imageWidth: 50,
        imageHeight: 50,
        track: {
          strokeWidth: "80%",
          background: "transparent",
        },
        dropShadow: {
          enabled: false,
          top: 0,
          left: 0,
          bottom: 0,
          blur: 3,
          opacity: 0.5,
        },
        dataLabels: {
          name: {
            fontSize: "16px",
            color: undefined,
            offsetY: 30,
          },
          hollow: {
            size: "60%",
          },
          value: {
            offsetY: -10,
            fontSize: "22px",
            color: undefined,
            formatter: function (val) {
              return val + "%";
            },
          },
        },
      },
    },
    colors: [myVarVal],
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: [myVarVal],
        inverseColors: !0,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    stroke: {
      dashArray: 4,
    },
    series: [77],
    labels: ["Stores"],
  };

  document.querySelector("#recentorders").innerHTML = "";
  var chart = new ApexCharts(document.querySelector("#recentorders"), options);
  chart.render();
  /*--- Apex (#chart)closed ---*/
}

function percentchart() {
  /*--- Apex (#chart) ---*/
  var options = {
    series: [50, 50],
    colors: ["#7367F0", "#FF9F43"],
    chart: {
      height: 325,
      type: "radialBar",
    },
    //   colors: colors,
    fill: {
      gradient: {
        // enabled: true,
        shade: "dark",
        type: "vertical",
        shadeIntensity: 0.5,
        // gradientToColors: gradientToColors,
        inverseColors: false,
        // opacityFrom: 1,
        // opacityTo: 1,
        stops: [0, 100],
      },
    },
    stroke: {
      lineCap: "round",
    },
    plotOptions: {
      radialBar: {
        size: 165,
        hollow: {
          size: "20%",
        },
        track: {
          strokeWidth: "100%",
          margin: 15,
        },
        dataLabels: {
          name: {
            fontSize: "17px",
          },
          value: {
            fontSize: "15px",
          },
          total: {
            show: true,
            label: "Total",

            formatter: function (w) {
              // return 249
            },
          },
        },
      },
    },
    labels: ["accepted", "pending"],
  };

  document.querySelector("#percentchart").innerHTML = "";
  var chart = new ApexCharts(document.querySelector("#percentchart"), options);
  chart.render();
  /*--- Apex (#chart)closed ---*/
}

function full_progress_chart(colors, colors2) {
  /*--- Apex (#chart) ---*/
  var options = {
    series: [100],
    chart: {
      type: "donut",
      height: 325,
      toolbar: {
        show: false,
      },
    },
    legend: { show: false },
    comparedResult: [2, -3, 8],
    stroke: { width: 0 },
    colors: ["#7c71f1"],
    dataLabels: {
      enabled: false,
    },
    fill: {
      type: "gradient",
      gradient: {
        gradientToColors: colors2,
      },
    },
  };

  document.querySelector("#full_progress_chart").innerHTML = "";
  var chart = new ApexCharts(
    document.querySelector("#full_progress_chart"),
    options
  );
  chart.render();
  /*--- Apex (#chart)closed ---*/
}

function circle_progress_chart() {
  /*--- Apex (#chart) ---*/
  var options = {
    series: [100, 100],
    chart: {
      height: 250,
      type: "radialBar",
      sparkline: {
        enabled: true,
      },
      dropShadow: {
        enabled: true,
        blur: 3,
        left: 1,
        top: 1,
        opacity: 0.1,
      },
    },
    dataLabels: {
      enabled: false,
    },
    colors: ["#26c671", "gray"],
    fill: {
      type: "gradient",
      gradient: {
        // enabled: true,
        shade: "dark",
        type: "vertical",
        shadeIntensity: 0.5,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    stroke: {
      lineCap: "round",
    },
    plotOptions: {
      radialBar: {
        size: 110,
        startAngle: -150,
        endAngle: 150,
        hollow: {
          size: "77%",
        },
        track: {
          background: "#b9c3cd",
          strokeWidth: "50%",
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            offsetY: 18,
            color: "#99a2ac",
            fontSize: "20",
          },
        },
      },
    },
  };

  document.querySelector("#circle_progress_chart").innerHTML = "";
  var chart = new ApexCharts(
    document.querySelector("#circle_progress_chart"),
    options
  );
  chart.render();
  /*--- Apex (#chart)closed ---*/
}

function user_chart() {
  /*--- Apex (#chart) ---*/

  var options = {
    series: [107, 5],

    chart: {
      type: "pie",
      height: 330,
      dropShadow: {
        enabled: false,
        blur: 5,
        left: 1,
        top: 1,
        opacity: 0.2,
      },
      toolbar: {
        show: false,
      },
    },
    labels: ["active", "not active"],
    dataLabels: {
      enabled: false,
    },

    legend: { show: false },
    stroke: {
      width: 5,
    },
    colors: ["#7367F0", "#FF9F43"],

    fill: {
      type: "gradient",
      colors: ["#7367F0", "#FF9F43"],
    },
  };

  document.querySelector("#user_chart").innerHTML = "";
  var chart = new ApexCharts(document.querySelector("#user_chart"), options);
  chart.render();
  /*--- Apex (#chart)closed ---*/
}

function order_status_1() {
  /*--- Apex (#chart) ---*/

  var options = {
    series: [79, 130],

    chart: {
      type: "pie",
      height: 330,
      dropShadow: {
        enabled: false,
        blur: 5,
        left: 1,
        top: 1,
        opacity: 0.2,
      },
      toolbar: {
        show: false,
      },
    },
    labels: ["new", "total order"],
    dataLabels: {
      enabled: false,
    },

    legend: { show: false },
    stroke: {
      width: 5,
    },
    colors: ["#7367F0", "#FF9F43"],

    fill: {
      type: "gradient",
      colors: ["#7367F0", "#FF9F43"],
    },
  };

  document.querySelector("#order_status_1").innerHTML = "";
  var chart = new ApexCharts(
    document.querySelector("#order_status_1"),
    options
  );
  chart.render();
  /*--- Apex (#chart)closed ---*/
}

function order_status_2() {
  /*--- Apex (#chart) ---*/

  var options = {
    series: [19, 130],

    chart: {
      type: "pie",
      height: 330,
      dropShadow: {
        enabled: false,
        blur: 5,
        left: 1,
        top: 1,
        opacity: 0.2,
      },
      toolbar: {
        show: false,
      },
    },
    labels: ["active order", "total order"],
    dataLabels: {
      enabled: false,
    },

    legend: { show: false },
    stroke: {
      width: 5,
    },
    colors: ["#7367F0", "#FF9F43"],

    fill: {
      type: "gradient",
      colors: ["#7367F0", "#FF9F43"],
    },
  };

  document.querySelector("#order_status_2").innerHTML = "";
  var chart = new ApexCharts(
    document.querySelector("#order_status_2"),
    options
  );
  chart.render();
  /*--- Apex (#chart)closed ---*/
}

function order_status_3() {
  /*--- Apex (#chart) ---*/

  var options = {
    series: [28, 130],

    chart: {
      type: "pie",
      height: 330,
      dropShadow: {
        enabled: false,
        blur: 5,
        left: 1,
        top: 1,
        opacity: 0.2,
      },
      toolbar: {
        show: false,
      },
    },
    labels: ["finished order", "total order"],
    dataLabels: {
      enabled: false,
    },

    legend: { show: false },
    stroke: {
      width: 5,
    },
    colors: ["#7367F0", "#FF9F43"],

    fill: {
      type: "gradient",
      colors: ["#7367F0", "#FF9F43"],
    },
  };

  document.querySelector("#order_status_3").innerHTML = "";
  var chart = new ApexCharts(
    document.querySelector("#order_status_3"),
    options
  );
  chart.render();
  /*--- Apex (#chart)closed ---*/
}

function order_status_4() {
	/*--- Apex (#chart) ---*/
  
	var options = {
	  series: [4, 130],
  
	  chart: {
		type: "pie",
		height: 330,
		dropShadow: {
		  enabled: false,
		  blur: 5,
		  left: 1,
		  top: 1,
		  opacity: 0.2,
		},
		toolbar: {
		  show: false,
		},
	  },
	  labels: ["finished order", "total order"],
	  dataLabels: {
		enabled: false,
	  },
  
	  legend: { show: false },
	  stroke: {
		width: 5,
	  },
	  colors: ["#7367F0", "#FF9F43"],
  
	  fill: {
		type: "gradient",
		colors: ["#7367F0", "#FF9F43"],
	  },
	};
  
	document.querySelector("#order_status_4").innerHTML = "";
	var chart = new ApexCharts(
	  document.querySelector("#order_status_4"),
	  options
	);
	chart.render();
	/*--- Apex (#chart)closed ---*/
  }

function vectormap() {
  /*-- Jvector Map -- */
  document.querySelector("#world-map-markers").innerHTML = "";
  $("#world-map-markers").vectorMap({
    map: "world_mill_en",
    scaleColors: [myVarVal, "#f0f0ff"],
    normalizeFunction: "polynomial",
    hoverOpacity: 0.7,
    hoverColor: false,
    regionStyle: {
      initial: {
        fill: "rgba(183, 179, 220,0.3)",
      },
    },
    markerStyle: {
      initial: {
        r: 6,
        fill: myVarVal,
        "fill-opacity": 0.9,
        stroke: "#fff",
        "stroke-width": 2.5,
      },

      hover: {
        stroke: "#fff",
        "fill-opacity": 1,
        "stroke-width": 1.5,
      },
    },
    backgroundColor: "transparent",
    markers: [
      {
        latLng: [-23.533773, -46.62529],
        name: "Brazil",
      },
      {
        latLng: [55.751244, 37.618423],
        name: "Russia",
      },
      {
        latLng: [52.237049, 21.017532],
        name: "Poland",
      },
      {
        latLng: [51.21389, -110.00547],
        name: "Canada",
      },
      {
        latLng: [20.5937, 78.9629],
        name: "India",
      },
    ],
  });
  /*-- End Jvector Map -- */
}
