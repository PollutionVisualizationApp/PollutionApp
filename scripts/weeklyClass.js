class WeeklyData {
    constructor(apex) {
        this.chart = apex;
        this.sensorData = [];
        this.initChart();
    }

    formatWithTimezone(date) {
        const offset = date.getTimezoneOffset();
        const sign = offset <= 0 ? '+' : '-';
        const hours = String(Math.abs(Math.floor(offset / 60))).padStart(2, '0');
        const minutes = String(Math.abs(offset % 60)).padStart(2, '0');

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}T00:00:00${sign}${hours}:${minutes}`;
    }

    getDates() {
        const now = new Date();
        // 6 дена наназад за вкупно 7 дена приказ
        const lastWeek = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

        return {
            now: encodeURIComponent(this.formatWithTimezone(now)),
            from: encodeURIComponent(this.formatWithTimezone(lastWeek))
        }
    }

    getAveragePerDay(data, id) {
        const averageByDay = data.reduce((acc, item) => {
            const dayStamp = item.stamp.split('T')[0];
            if (!acc[dayStamp]) {
                acc[dayStamp] = { sensorId: id, stamp: dayStamp, sum: 0, count: 0 };
            }
            acc[dayStamp].sum += Number(item.value);
            acc[dayStamp].count += 1;
            return acc;
        }, {});

        return Object.keys(averageByDay)
            .sort((a, b) => new Date(a) - new Date(b))
            .map(key => {
                const d = averageByDay[key];
                return {
                    ...d,
                    value: Number((d.sum / d.count).toFixed(2))
                };
            });
    }

    initChart() {
        let dates = this.getDates();
        this.sensorData = [];

        // selectedSensors.forEach(s => {
        //     fetch(`https://skopje.pulse.eco/rest/dataRaw?sensorId=${s}&type=${selectedType}&from=${dates.from}&to=${dates.now}`)
        //         .then(response => response.json())
        //         .then(data => {
        //             let avgData = this.getAveragePerDay(data, s);
        //             this.sensorData.push(avgData);
        //             this.showChart();
        //             this.setMinMax();
        //         });
        // });

        const requests = selectedSensors.map(s =>
        fetch(`https://skopje.pulse.eco/rest/dataRaw?sensorId=${s}&type=${selectedType}&from=${dates.from}&to=${dates.now}`)
            .then(res => res.json())
            .then(data => this.getAveragePerDay(data, s))
        );

        Promise.all(requests).then(results => {
        this.sensorData = results;   
        this.showChart();            
        this.setMinMax();
        });

    }

    showChart() {
        const series = this.getSeries();
        const xLabels = this.getXlabels();

        options.series = series;
        options.xaxis.categories = xLabels;
        // Ресетирај опсег за да се видат сите 7 дена убаво
        options.xaxis.range = undefined;

        this.chart.updateOptions(options, true, true);
    }

    getSeries() {
        return selectedSensors.map(ss => ({
            name: sensorNames[ss] || ss,
            data: this.sensorData.flat(1).filter(s => s.sensorId == ss).map(d => d.value)
        }));
    }

    getXlabels() {
        return this.sensorData.length > 0 ? this.sensorData[0].map(d => d.stamp) : [];
    }

    setMinMax() {
        let minElement = document.getElementById("min");
        let maxElement = document.getElementById("max");
        let types = [...document.getElementsByClassName("typeMinMax")];
        let sMin = parseFloat(minElement.innerText);
        let sMax = parseFloat(maxElement.innerText);

        let arr = this.sensorData.flat(1).map(m => m.value);
        if (arr.length === 0) return;

        let min = Math.min(...arr);
        let max = Math.max(...arr);

        types.forEach(t => t.innerText = selectedType);

        // Користи ја истата анимација од dailyClass ако е достапна глобално или преку прототип

        DailyData.countUpFloat(minElement, sMin, min);
        DailyData.countUpFloat(maxElement, sMax, max);

        DailyData.showMinMaxEachSensor(this.sensorData);
    }
}