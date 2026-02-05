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

    sensors.forEach(sensor => {
        const btn = document.createElement('button');
        btn.textContent = sensorNames[sensor] || sensor;
        btn.dataset.sensor = sensor;
        btn.addEventListener('click', () => toggleSensor(sensor, btn));
        sensorContainer.appendChild(btn);
    });

    selectedSensors = [sensors[0]];
    if (sensorContainer.children[0]) sensorContainer.children[0].classList.add('active');

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
    
        if (selectedTimeframe === 'daily') {
            options.xaxis.range = undefined;
            instance = new DailyData(chartInstance);
            return;

        } else if (selectedTimeframe === 'weekly') {
            // timeframeKey = "Week";
            // xRange = 4; // Покажи 4 недели одеднаш
            //
            // // Креирање категории во формат: 2026-01 до 2026-02
            // categories = Array.from({length: 52}, (_, i) => {
            //     const weekNum = i + 1;
            //     // Груба пресметка на месеци за приказ на оската
            //     const startMonth = Math.ceil(weekNum / 4.33);
            //     const endMonth = Math.ceil((weekNum + 1) / 4.33);
            //     return `${selectedYear}-${String(startMonth).padStart(2, '0')} to ${selectedYear}-${String(endMonth > 12 ? 12 : endMonth).padStart(2, '0')}`;
            // });
            //
            // // Зумирај на тековниот месец (денес е јануари според системот)
            // const currentMonth = new Date().getMonth() + 1;
            // startZoom = Math.max(0, (currentMonth - 1) * 4);
            // endZoom = startZoom + 4;
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
                d.SensorId === sensorId &&
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