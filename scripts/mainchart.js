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
const colors  = ['#ff4d4f', '#fdb022', '#039855'];
const options = {
    series: [],
    chart: { height: 350, type: 'area', zoom: { enabled: false }, toolbar: { show: false }, foreColor: '#98a2b3' },
    // colors: ,
    dataLabels: { enabled: false },
    stroke: { curve: 'straight', width: 3 },
    tooltip: { theme: 'dark', style: { fontSize: '12px' } },
    grid: { borderColor: '#98a2b3' },
    fill: { type: 'gradient', 
      gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.4,
        gradientToColors: ['#ff9f43'], opacityFrom: 0.6, opacityTo: 0.05, stops: [0,100] } 
      },
    xaxis: { categories: null, labels: { style: { colors: '#98a2b3' } } },
    yaxis: { labels: { style: { colors: '#98a2b3' } } }
  };

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
      sensors.forEach((sensor, i) => {
        const btn = document.createElement('input');
        const label = document.createElement('label');
       
        btn.type = "checkbox";
        btn.id = sensor;
        btn.name = "location";
        if(i==0){
            btn.checked = true; // go selektira prviot senzor
          }
        // btn.dataset.sensor = sensor;
        label.setAttribute("for", sensor);
        label.textContent = btn.textContent = sensorNames[sensor] || sensor;
        btn.addEventListener('change', (e) => {
          console.log(getSelectedSensors().length);
            if (e.target.type === 'checkbox') {
              if (getSelectedSensors().length > 3){
                e.target.checked = false; // zabranuva check na poveke od 3 senzori
                return;
              }
              if(getSelectedSensors().length < 1) {
                e.target.checked = true;
                return;
              }
            }
          selectedSensor = sensor;
          highlightButtons(container, btn);

          updateChart(selectedType, selectedSensor);
        });
        container.appendChild(btn);
        container.appendChild(label);
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
    changeType(selectedType);
  });
});
const firstTypeBtn = document.querySelector('#typeButtons button');
highlightButtons(typeContainer, firstTypeBtn);

function changeType(selectedType){
  options.series=[];
  chartInstance.updateSeries(options.series);
  getSelectedSensors().forEach(s=>updateChart(selectedType, s))
}
// Функција за ажурирање на график
function updateChart(type, sensor) {  
  // console.log(
  //   options.series.map(s=>s.id)
  // )

    const filtered = sensorData.filter(d => d.Type === type && d.SensorId === sensor);
    filtered.sort((a,b) => (a.Year*12 + a.Month) - (b.Year*12 + b.Month));

    const categories = filtered.map(d => `${d.Year}-${String(d.Month).padStart(2,'0')}`);
    const values = filtered.map(d => {
    const n = Number(d.MonthlyAvg.toFixed(2));
    return isNaN(n) ? null : n;
  });
    console.log(values);
    const color = colors.filter(c=>!options.series.map(s=>s.color).includes(c))[0]; // ja naogja prvata slobodna boja
    // console.log(s);

    if(!options.series.map(s=>s.id).includes(sensor)){
      options.series.push({
            name: sensorNames[sensor],
            id: sensor,
            data: values,
            color: color
          });
    }else{
      let idx = options.series.map(s=>s.id).indexOf(sensor);
      options.series.splice(idx, 1);
    }
    
  const allCategories = Array.from(new Set(
    options.series.flatMap(s => s.data.map((v,i) => categories[i]))
  ));
  options.xaxis.categories = allCategories; // ima problem so kategoriite deka falat podatoci izmegu nekoj meseci moze da se resi dokolku se stavat null vrednosti za tie meseci
  
  if(chartInstance) {
    // chartInstance.updateOptions(options);
    // chartInstance.updateSeries(options.series);
    chartInstance.updateOptions({
      series: options.series,
      xaxis: { categories: options.xaxis.categories }
    });
    
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

function getSelectedSensors(){
    return [...document.querySelectorAll('input[name="location"]:checked')].map(i=>i.id);
}