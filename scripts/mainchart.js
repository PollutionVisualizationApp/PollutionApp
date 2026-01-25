// window.addEventListener('load', function () {
//   var options = {
//     series: [{
//       name: "pm10",
//       data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
//     }],
//     chart: {
//       height: 350,
//       type: 'area',
//       zoom: { enabled: false },
//       toolbar: { show: false },
//       foreColor: '#98a2b3'
//     },
//     colors: ['#ff4d4f'],
//     dataLabels: { enabled: false },
//     stroke: {
//       curve: 'straight',
//       width: 3
//     },
//     tooltip: {
//     theme: 'dark', // or 'light'
//     style: {
//         fontSize: '12px'
//     },
//     },
//     grid: {
//       borderColor: '#98a2b3'
//     },
//     fill: {
//       type: 'gradient',
//       gradient: {
//         shade: 'light',
//         type: 'vertical',
//         shadeIntensity: 0.4,
//         gradientToColors: ['#ff9f43'],
//         opacityFrom: 0.6,
//         opacityTo: 0.05,
//         stops: [0, 100]
//       }
//     },
//     xaxis: {
//       categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
//       labels: {
//         style: { colors: '#98a2b3' }
//       }
//     },
//     yaxis: {
//       labels: {
//         style: { colors: '#98a2b3' }
//       }
//     }
//   };
//
//   var chart = new ApexCharts(document.querySelector("#chart"), options);
//   chart.render();
// });

let sensorData;
let chartInstance;
let selectedSensor;
let selectedType = 'pm10';

// Превод на SensorId -> пријателско име
const sensorNames = {
  "3568aa20-235a-408c-861b-279c9f4d7709": "Vodno kaj Pretsedatelka",
  "1002": "MOEPP Miladinovci",
  "6c6a9ef6-85f9-45c0-9e01-0c9d2fb87bc2": "Capitol Mall",
  "fef6bc74-bf86-4874-9531-51b033580379":"Taftalidze 2"
};

// Вчитување JSON
fetch('img/data/MOEPP-Miladinovci_Taftalidze 2_Capitol Mall_monthly_avg_pm.json')
    .then(response => response.json())
    .then(data => {
      // Само за 2025 година
      sensorData = data.filter(d => d.Year == 2025);

      // Креирање бутони за сензори
      const sensors = [...new Set(sensorData.map(d => d.SensorId))];
      const container = document.getElementById('sensorButtons');
      sensors.forEach(sensor => {
        const btn = document.createElement('button');
        btn.textContent = sensorNames[sensor] || sensor;
        btn.dataset.sensor = sensor;
        btn.addEventListener('click', () => {
          selectedSensor = sensor;
          highlightButtons(container, btn);
          updateChart(selectedType, selectedSensor);
        });
        container.appendChild(btn);
      });

      // Почетен сензор
      selectedSensor = sensors[0];
      highlightButtons(container, container.children[0]);

      // Почетен график
      updateChart(selectedType, selectedSensor);
    });

// Бутони за PM тип
const typeContainer = document.getElementById('typeButtons');
document.querySelectorAll('#typeButtons button').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedType = btn.dataset.type;
    highlightButtons(typeContainer, btn);
    updateChart(selectedType, selectedSensor);
  });
});
const firstTypeBtn = document.querySelector('#typeButtons button');
highlightButtons(typeContainer, firstTypeBtn);

// Функција за ажурирање на график
function updateChart(type, sensor) {
  const filtered = sensorData.filter(d => d.Type === type && d.SensorId === sensor);
  filtered.sort((a,b) => (a.Year*12 + a.Month) - (b.Year*12 + b.Month));

  const categories = filtered.map(d => `${d.Year}-${String(d.Month).padStart(2,'0')}`);
  const values = filtered.map(d => d.MonthlyAvg);

  const options = {
    series: [{ name: type, data: values }],
    chart: { height: 350, type: 'area', zoom: { enabled: false }, toolbar: { show: false }, foreColor: '#98a2b3' },
    colors: ['#ff4d4f'],
    dataLabels: { enabled: false },
    stroke: { curve: 'straight', width: 3 },
    tooltip: { theme: 'dark', style: { fontSize: '12px' } },
    grid: { borderColor: '#98a2b3' },
    fill: { type: 'gradient', gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.4,
        gradientToColors: ['#ff9f43'], opacityFrom: 0.6, opacityTo: 0.05, stops: [0,100] } },
    xaxis: { categories: categories, labels: { style: { colors: '#98a2b3' } } },
    yaxis: { labels: { style: { colors: '#98a2b3' } } }
  };

  if(chartInstance) {
    chartInstance.updateOptions(options);
    chartInstance.updateSeries(options.series);
  } else {
    chartInstance = new ApexCharts(document.querySelector("#chart"), options);
    chartInstance.render();
  }
}

// Функција за highlight на избран бутон
function highlightButtons(container, activeBtn) {
  Array.from(container.children).forEach(btn => btn.classList.remove('active'));
  activeBtn.classList.add('active');
}
