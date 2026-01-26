window.addEventListener('load', function () {
  var options = {
    series: [{
      name: "pm10",
      data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
    }
],
    chart: {
      height: 350,
      type: 'area',
      zoom: { enabled: false },
      toolbar: { show: false },
      foreColor: '#98a2b3'
    },
    colors: ['#ff4d4f', "blue"],
    dataLabels: { enabled: false },
    stroke: {
      curve: 'straight',
      width: 3
    },
    tooltip: {
    theme: 'dark', // or 'light'
    style: {
        fontSize: '12px'
    },
    },
    grid: {
      borderColor: '#98a2b3'
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.4,
        gradientToColors: ['#ff9f43'],
        opacityFrom: 0.6,
        opacityTo: 0.05,
        stops: [0, 100]
      }
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      labels: {
        style: { colors: '#98a2b3' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#98a2b3' }
      }
    }
  };

  var chart = new ApexCharts(document.querySelector("#chart"), options);
  chart.render();
});