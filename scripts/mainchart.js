let sensorData = [];
let chartInstance;
let selectedSensors = [];
let selectedType = 'pm10';
let selectedYear = '2025';
let selectedTimeframe = 'monthly';
// options Treba da bide ovde za da moze da se pristapi od daily klasata
const options = {
        series: {},
        chart: {
            id: 'main-chart',
            height: 350,
            type: 'area',
            background: 'transparent',
            foreColor: 'var(--text-color-light-2)',
            zoom: {
                enabled: true,
                type: 'x', // or 'xy'
                autoScaleYaxis: true
            },
            toolbar: {
                show: true,
                autoSelected: 'pan',
                tools: { pan: true, zoom: true, reset: true, download: false }
            },
            animations: {
                enabled: true,
                speed: 300,
                animateGradually: {
                enabled: true,
                delay: 150
                }
            }
        },
        colors: ['#ff4d4f', '#00e396', '#008ffb'],
        stroke: { curve: 'smooth', width: 3 },
        xaxis: {
            categories: [],
            range: [],
            labels: {
                rotate: -45,
                style: { fontSize: '10px' },
                trim: true
            }
        },
        yaxis: {
            // max:200,
            min: 0,
            // tickAmount: 2,
            forceNiceScale: false,
            labels: { formatter: (val) => val ? parseFloat(val).toFixed(2) : "0.00" }
        },
        tooltip: { theme: 'dark' },
        dataLabels: { enabled: false },
        legend: { position: 'top', labels: { colors: 'var(--text-color)' } }
    };


const sensorNames = {
    "3568aa20-235a-408c-861b-279c9f4d7709": "Vodno",
    "6c6a9ef6-85f9-45c0-9e01-0c9d2fb87bc2": "Capitol Mall",
    "fef6bc74-bf86-4874-9531-51b033580379": "Taftalidze 2",
    "8defa36a-62ca-448a-9ffb-5a2848c2dfa0": "FINKI/ZOO",
    "1000":"Centar",
    "1003":"Karpos"
};

fetch('img/data/MOEPP-Miladinovci_Taftalidze 2_Capitol Mall_monthly_avg_pm.json')
    .then(response => response.json())
    .then(data => {
        sensorData = data;
        initDashboard();
    });

function initDashboard() {
    const sensorContainer = document.getElementById('sensorButtons');
    const sensors = [...new Set(sensorData.map(d => d.SensorId))];

    let requestedSensorId = getSensorFromUrl();
    sensorContainer.innerHTML = '';
    selectedSensors = []; // Ресетирај за почеток

    sensors.forEach(sensor => {
        const btn = document.createElement('button');
        btn.textContent = sensorNames[sensor] || sensor;
        btn.dataset.sensor = sensor;
        btn.addEventListener('click', () => toggleSensor(sensor, btn));
        sensorContainer.appendChild(btn);

        //Potrebno za mapata koga kje klikneme na odreden senzor
        if (requestedSensorId && sensor == requestedSensorId) {
            selectedSensors = [sensor];
            btn.classList.add('active');
        }
    });

    // Ако нема параметар во URL или ако тој сензор не постои во податоците,
    // тогаш селектирај го првиот како default
    if (selectedSensors.length === 0 && sensors.length > 0) {
        selectedSensors = [sensors[0]];
        if (sensorContainer.children[0]) sensorContainer.children[0].classList.add('active');
    }
    // selectedSensors = [sensors[0]];
    // if (sensorContainer.children[0]) sensorContainer.children[0].classList.add('active');

    setupFilters();
    updateChart();
}

function setupFilters() {
    // BITNO: NE TREBA DA SE MENUVA. AKO TREBA SAMO DA SE DODADAT RABOTI
    [...document.querySelectorAll('input[name="timeframe"]')].forEach(t=>t.addEventListener('change', (e) => {
        selectedTimeframe = e.target.value;
        document.getElementById('yearSelection').style.display = (selectedTimeframe === 'monthly') ? 'flex' : 'none';
        updateChart();
    }));

    document.getElementById('yearSelect').addEventListener('change', (e) => {
        selectedYear = e.target.value;
        updateChart();
    });

    document.querySelectorAll('#typeButtons button').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedType = btn.dataset.type;
            highlightButtons(document.getElementById('typeButtons'), btn);
            updateChart();
        });
    });
}

function toggleSensor(sensorId, btn) {
    const index = selectedSensors.indexOf(sensorId);
    if (index > -1) {
        if (selectedSensors.length > 1) {
            selectedSensors.splice(index, 1);
            btn.classList.remove('active');
        }
    } else if (selectedSensors.length < 3) {
        selectedSensors.push(sensorId);
        btn.classList.add('active');
    }
    updateChart();
}


function updateChart() {
    let categories = [];
    let timeframeKey = "";
    let xRange = undefined;
    let startZoom = 0;
    let endZoom = 0;
    let instance;
    let labels ={
        daily:{
            title:"Todays Data",
            subtitle:"Hourly data"
        },
        weekly:{
            title:"Weekly Data",
            subtitle:"Last weeks"
        },
        monthly:{
            title:"Monthly Data",
            subtitle:"Data from selected year"
        },
    }
    document.getElementById("titleChart").textContent = labels[selectedTimeframe].title;
    document.getElementById("subTitleChart").textContent = labels[selectedTimeframe].subtitle;
    // ПРВО: Ресетирај го UI-то за соодветниот timeframe
    resetMinMaxUI(selectedTimeframe);
        if (selectedTimeframe === 'daily') {
            options.xaxis.range = undefined;
            instance = new DailyData(chartInstance);
            return;

        } else if (selectedTimeframe === 'weekly') {
            
            new WeeklyData(chartInstance);
            return;
        } else {

            categories = Array.from({length: 12}, (_, i) => `${selectedYear}-${String(i + 1).padStart(2, '0')}`);
            timeframeKey = "Month";
        }
        console.log(categories);
    const allSeries = selectedSensors.map(sensorId => {
        let lastValue=null;
        const chartData = categories.map((_, index) => {
            const timeValue = index + 1;
            const found = sensorData.find(d =>
                d.SensorId == sensorId &&
                d.Year == selectedYear &&
                d.Type === selectedType &&
                // Оваа линија долу е клучна:
                (d[timeframeKey] == timeValue)
            );

            // Проверка за двата можни клучa: Value или MonthlyAvg
            if (found) {
                const val = found.Value !== undefined ? found.Value : found.MonthlyAvg;
                const finalVal = (val!=undefined&&val!=NaN)? val: lastValue;
                lastValue = finalVal;
                return parseFloat(finalVal).toFixed(2);

            }
            return lastValue; //ffill
        });
        return { name: sensorNames[sensorId] || sensorId, data: chartData };
    });

    console.log(allSeries);

    updateMinMaxStats(allSeries);

    options.series = allSeries;
    options.xaxis.categories = categories;
    options.xaxis.range = xRange;

    if (chartInstance) {
        // chartInstance.updateOptions({series:options.series, xaxis: options.xaxis});
        chartInstance.updateOptions(options, true, true);
    } else {
        chartInstance = new ApexCharts(document.querySelector("#chart"), options);
        chartInstance.render();
    }

    setTimeout(() => {
        if (selectedTimeframe === 'weekly' && selectedYear === '2026') {
            ApexCharts.exec('main-chart', 'zoomX', startZoom + 1, endZoom);
        } else if (xRange) {
            const lastIndex = categories.length;
            ApexCharts.exec('main-chart', 'zoomX', lastIndex - xRange + 1, lastIndex);
        }
    }, 200);
}
function highlightButtons(container, activeBtn) {
    Array.from(container.children).forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}
//Koga kje klikneme senzor od mapata ne nosi do soodvetniot senzor vo dashboardot
function getSensorFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('sensor'); // Враќа напр. "1000" или null
}

//MinMax za godisnite statistiki
function updateMinMaxStats(allSeries) {
    let minElement = document.getElementById("min");
    let maxElement = document.getElementById("max");
    let parentMax = document.querySelectorAll("#maxDiv .values")[0];
    let parentMin = document.querySelectorAll("#minDiv .values")[0];

    let sMin = parseFloat(minElement.innerText);
    let sMax = parseFloat(maxElement.innerText);
    
    let allGlobalValues = [];
   
    parentMax.innerHTML="";
    parentMin.innerHTML="";

    allSeries.forEach(series => {
        // Филтрирај ги само бројките (избегни null)
        const numericData = series.data.map(Number).filter(n => !isNaN(n));

        if (numericData.length > 0) {
            const sensorMax = Math.max(...numericData);
            const sensorMin = Math.min(...numericData);
            allGlobalValues.push(...numericData);

            // Креирај меурче за секој сензор (како во Daily)
            let maxDiv = document.createElement('div');
            maxDiv.className = "minMaxInfo";
            maxDiv.innerHTML = sensorMax.toFixed(2);
            parentMax.append(maxDiv);

            let minDiv = document.createElement('div');
            minDiv.className = "minMaxInfo";
            minDiv.innerHTML = sensorMin.toFixed(2);
            parentMin.append(minDiv);
        }
    });

    // Ажурирај ги главните големи бројки
    if (allGlobalValues.length > 0) {
        max = Math.max(...allGlobalValues).toFixed(2);
        min = Math.min(...allGlobalValues).toFixed(2);

        DailyData.countUpFloat(minElement, sMin, min);
        DailyData.countUpFloat(maxElement, sMax, max);
    }
}
// Koga ke se odbere weekly ili daily da se resetira min i max
function resetMinMaxUI(timeframe) {
    const titles = document.querySelectorAll('.minMax h3');
    const titlePrefix = timeframe === 'monthly' ? 'Yearly' : (timeframe === 'weekly' ? 'Weekly' : 'Todays');

    if (titles[0]) titles[0].textContent = `${titlePrefix} Max`;
    if (titles[1]) titles[1].textContent = `${titlePrefix} Min`;

    // Ги чистиме малите меурчиња од претходните пресметки
    // document.querySelectorAll("#maxDiv .values, #minDiv .values").forEach(v => v.innerHTML = "");

    // Го ажурираме типот (pm10/pm25)
    document.querySelectorAll('.typeMinMax').forEach(t => t.innerText = selectedType);
}