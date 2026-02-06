// 1. Помошна функција за вчитување податоци (останува иста)
async function getLiveSensorData(sensorId) {
    try {
        const type = "pm10";
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const from = yesterday.toISOString().split('.')[0] + "Z";
        const to = now.toISOString().split('.')[0] + "Z";

        const url = `https://skopje.pulse.eco/rest/dataRaw?sensorId=${sensorId}&type=${type}&from=${from}&to=${to}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data || data.length === 0) return null;

        // 1. Сортирање по време
        data.sort((a, b) => new Date(a.stamp) - new Date(b.stamp));

        // 2. ГРУПИРАЊЕ ПО ЧАСОВИ (за точен мин/макс)
        const hourlyBuckets = {};
        data.forEach(d => {
            const hour = d.stamp.substring(0, 13); // зема "YYYY-MM-DDTHH"
            if (!hourlyBuckets[hour]) hourlyBuckets[hour] = [];
            hourlyBuckets[hour].push(parseFloat(d.value));
        });

        // Пресметај просек за секој час
        const hourlyAverages = Object.values(hourlyBuckets).map(values => {
            const sum = values.reduce((a, b) => a + b, 0);
            return sum / values.length;
        });

        // 3. ПРЕСМЕТКА НА ВРЕДНОСТИТЕ
        // Тековна вредност = последниот запис од последната минута
        const lastValue = parseFloat(data[data.length - 1].value);

        // Мин/Макс = од часовните просеци (ова ја трга разликата од +-5)
        const minHourly = Math.min(...hourlyAverages);
        const maxHourly = Math.max(...hourlyAverages);

        return {
            lastValue: lastValue.toFixed(0), // Цел број како на Pulse.eco
            min: minHourly.toFixed(0),
            max: maxHourly.toFixed(0),
            time: new Date(data[data.length - 1].stamp).toLocaleTimeString('mk-MK', { hour: '2-digit', minute: '2-digit' })
        };
    } catch (e) {
        console.error("Грешка:", e);
        return null;
    }
}
// 1. Дефинирање на слоевите за мапата
var lightTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'OpenStreetMap'
});

var darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: 'CartoDB'
});

// Иницијализација со Light Mode
var map = L.map('map', {
    center: [41.998, 21.428],
    zoom: 14,
    layers: [lightTiles] // Почетен слој
});

// 2. Функција за Dark Mode Toggle
var isDark = false;
document.getElementById('theme-toggle').addEventListener('click', function() {
    if(isDark) {
        map.removeLayer(darkTiles);
        map.addLayer(lightTiles);
        this.innerHTML = '<i class="ri-moon-line"></i> Смени Тема';
    } else {
        map.removeLayer(lightTiles);
        map.addLayer(darkTiles);
        this.innerHTML = '<i class="ri-sun-line"></i> Смени Тема';
    }
    isDark = !isDark;
});

// 3. Креирање на интересни маркери со икони
var locations = [
    { id: "1000", coords: [41.9967773479914, 21.432331603100533], name: "Центар", icon: "ri-haze-line" },
    { id: "1003", coords: [42.00286238240476, 21.397614894784297], name: "Карпош", icon: "ri-haze-line" },
    { id: "fef6bc74-bf86-4874-9531-51b033580379", coords: [42.001554697536506, 21.385857536726437], name: "Тафталиџе 2", icon: "ri-haze-line" },
    { id: "3568aa20-235a-408c-861b-279c9f4d7709", coords: [41.98571781938131, 21.41637933860789], name: "Водно", icon: "ri-haze-line" },
    { id: "6c6a9ef6-85f9-45c0-9e01-0c9d2fb87bc2", coords: [41.98589548731022, 21.466602435449165], name: "Capitall Mall", icon: "ri-haze-line" },
    { id: "8defa36a-62ca-448a-9ffb-5a2848c2dfa0", coords: [42.006193, 21.415879], name: "FINKI/ZOO", icon: "ri-haze-line" }
];

locations.forEach(function(loc) {
    var markerHtml = `<div class="custom-icon-marker" id="marker-${loc.id}"><i class="${loc.icon}" id="icon-${loc.id}"></i></div>`;
    var customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: markerHtml,
        iconSize: [45, 45],
        iconAnchor: [22, 45]
    });

    var marker = L.marker(loc.coords, { icon: customIcon }).addTo(map);

    marker.bindTooltip("Вчитај податоци...", {
        direction: 'top',
        className: 'custom-leaflet-tooltip',
        offset: [0, -30]
    });

    getLiveSensorData(loc.id).then(liveData => {
        if (liveData) {
            let val = parseFloat(liveData.lastValue);
            let color, icon, advice, statusText;

            // ЛОГИКА ЗА БОИ, ИКОНИ И СОВЕТИ
            if (val <= 25) {
                color = "#2ecc71"; // Зелена
                icon = "ri-user-smile-line";
                statusText = "ОДЛИЧЕН";
                advice = "Воздухот е чист. Идеално за активност надвор!";
            } else if (val <= 50) {
                color = "#f1c40f"; // Жолта
                icon = "ri-rest-time-line";
                statusText = "УМЕРЕН";
                advice = "Воздухот е прифатлив. Чувствителните да внимаваат.";
            } else if (val <= 100) {
                color = "#e67e22"; // Портокалова
                icon = "ri- pirm-line";
                statusText = "НЕЗДРАВ";
                advice = "Намалете го подолгиот престој на отворено.";
            } else {
                color = "#e74c3c"; // Црвена
                icon = "ri-skull-2-line";
                statusText = "ОПАСЕН";
                advice = "Внимавајте! Воздухот е многу загаден. Носете маска.";
            }

            // 1. Ажурирај го изгледот на маркерот на мапата
            const markerElem = document.getElementById(`marker-${loc.id}`);
            const iconElem = document.getElementById(`icon-${loc.id}`);

            if (markerElem && iconElem) {
                markerElem.style.backgroundColor = color;
                iconElem.className = icon; // Ја менува иконата динамички

                // Ако е многу загадено (над 100), додај пулсирачки ефект
                if (val > 100) markerElem.classList.add('critical-pollution');
            }

            // 2. Креирај ја богатата содржина за Tooltip
            const updatedContent = `
                <div class="map-popup-card">
                    <div class="popup-header">
                        <strong style="color: ${color}">${statusText}</strong>
                        <p>${loc.name} во ${liveData.time || 'тековен час'}</p>
                    </div>
                    <div class="popup-value">
                        <span class="main-val" style="color: #333">${val}</span> <span class="unit">µg/m³</span>
                    </div>
                    <div class="advice-box" style="font-size: 11px; margin-bottom: 10px; font-style: italic;">
                        ${advice}
                    </div>
                    <div class="popup-minmax">
                        денешен опсег: ${liveData.min} - ${liveData.max}
                    </div>
                    <p class="click-info">Кликни за детален извештај</p>
                </div>
            `;
            marker.setTooltipContent(updatedContent);
        }
    });

    marker.on('click', function() {
        window.location.href = `dashboard.html?sensor=${loc.id}&timeframe=daily`;
    });
});