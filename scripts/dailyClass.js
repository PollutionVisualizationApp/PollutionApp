class DailyData{
    constructor(apex){
        this.chart = apex;
        this.sensorData =[];
        this.initChart()
    }

    formatWithTimezone(date) {

    const offset = date.getTimezoneOffset();
    const sign = offset <= 0 ? '+' : '-';
    const hours = String(Math.abs(Math.floor(offset / 60))).padStart(2, '0');
    const minutes = String(Math.abs(offset % 60)).padStart(2, '0');
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hour}:00:00${sign}${hours}:${minutes}`;

    }

    getDates(){
            const now = new Date();
            // now.setHours(now.getHours() + 1);
            now.setMinutes(0, 0, 0);

            // 24 hours before
            const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000);
        
            const urlEncoded = encodeURIComponent(this.formatWithTimezone(now));
            const yesterdayEncoded = encodeURIComponent(this.formatWithTimezone(yesterday));

            return {
                now: urlEncoded,
                yesterday: yesterdayEncoded
            }

    }
    getTimeOnly(date){
        const time = date.split('T')[1].slice(0, 5);
        return time;
    }

    hourDiff(prev, curr){
        const start = new Date(prev);
        const end = new Date(curr);

        const diffMs = Math.abs(end - start);
        const diffHours = diffMs / (1000 * 60 * 60);

        // console.log(diffHours);
        return diffHours;
    }

    fillGaps(arr){
        let previousHour=null;
        let newArr=[];


        arr.forEach(a=>{
            if(previousHour==null){
                previousHour = a.index;
            }
            if(this.hourDiff(previousHour,a.index)>1){
                //  console.log(previousHour+" "+a.index);
                // console.log(a);
                let tmp = this.hourDiff(previousHour,a.index);
                const [baseHour] = previousHour.split('T')[1].split(':').map(Number);

                const obj = { ...a };
                for (let i = 1; i < tmp; i++) {
                
                    const newHour = (baseHour + i) % 24; 
                    // console.log(obj);
                    obj.stamp = String(newHour).padStart(2, '0') + ':00';
                    obj.index = obj.index.split('T')[0]+"T"+obj.stamp;
                    newArr.push(obj);
                    
                    // console.log("PREV: "+previousHour); 
                }
                // previousHour = obj.index;
             }
            //  else{
               previousHour = a.index; 
            //  }

            newArr.push(a);
            
        })

        return newArr;
       
    }

    getAveragePerHour(data, id) {
    const averageByHour = data.reduce((acc, item) => {
        const date = new Date(item.stamp);

        // console.log('stamp:', item.stamp);
        // console.log('before:', date.toISOString());
        const minutes = date.getMinutes();
        date.setMinutes(0, 0, 0);

        if (minutes >= 30) {
        date.setHours(date.getHours() + 1);
        }
        // console.log('after :', date.toISOString());

        const stamp =
        date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + 'T' +
        String(date.getHours()).padStart(2, '0') + ':00';

        const hour = stamp.slice(11);
        console.log(item.stamp+" "+stamp);
        if (!acc[stamp]) {
        acc[stamp] = {
            sensorId: id,
            stamp: hour,
            index: stamp,
            sum: 0,
            count: 0
        };
        }

        acc[stamp].sum += Number(item.value);
        acc[stamp].count += 1;
        return acc;
    }, {});

    const arr = Object.keys(averageByHour)
        .sort((a, b) => new Date(a) - new Date(b))
        .map(key => {
        const d = averageByHour[key];
        return {
            ...d,
            hour: key,
            value: Number((d.sum / d.count).toFixed(2))
        };
        });

    return this.fillGaps(arr);
    }

    initChart(){
        let dates = this.getDates();

        const requests = selectedSensors.map(s =>
        fetch(`https://skopje.pulse.eco/rest/dataRaw?sensorId=${s}&type=${selectedType}&from=${dates.yesterday}&to=${dates.now}`)
            .then(res => res.json())
            .then(data => {
            let avgData = this.getAveragePerHour(data, s);

            if (avgData.length > 24) {
                avgData = avgData.slice(avgData.length - 24);
            }

            return avgData; // ⬅️ return result
            })
        );

        Promise.all(requests).then(results => {
        this.sensorData = results;  
        this.showChart();           
        this.setMinMax();
        });
        

    }
    findDataLongestSeries(series){
        const maxLen = series[0];

        series.forEach(s=>  maxLen = s.data.length > maxLen.data.length?s:maxLen);
        return maxLen;
    }
    showChart(){
        const series = this.getSeries();
        // const longestSeries(series);
        const xLabels = this.getXlabels();
        
        // console.log(options.xaxis);
        // console.log(xLabels);
        
        options.series = series,
        options.xaxis.categories = xLabels;
        // options.xaxis.range = 24;
        // console.log(options.xaxis);
        this.chart.updateOptions(options, true, true);
    }

    getSeries(){

        let arr = [];
        selectedSensors.forEach(ss=>{

            let obj={
                name:"",
                data: []
            };

            obj.name= sensorNames[ss];
            obj.data = this.sensorData.flat(1).filter(s => s.sensorId == ss).map(d=>d["value"]);
            if(obj.data.length<24){
                obj.data = this.normalizeSeries(obj.data, 24);
            }
            // console.log(obj);
            arr.push(obj);
        })

        return arr;
    }

    getXlabels() {
    const labels = [];
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
        const d = new Date(now);
        d.setHours(now.getHours() - i);

        const hour = d.getHours().toString().padStart(2, '0');
        labels.push(`${hour}:00`);
    }

    return labels;
    }
    static countUpFloat(el, start, end, duration = 700, decimals = 2) {
        let startTime = null;

        function animate(ts) {
            if (!startTime) startTime = ts;
            const p = Math.min((ts - startTime) / duration, 1);
            const val = (p * (end - start) + start).toFixed(decimals);
            el.textContent = val;

            if (p < 1) requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }
    setMinMax(){
       let minElement =  document.getElementById("min");
       let maxElement =  document.getElementById("max");
       let types = [...document.getElementsByClassName("typeMinMax")];
       let sMin = parseFloat(minElement.innerText);
       let sMax = parseFloat(maxElement.innerText);
       
       let arr = this.sensorData.flat(1).map(m=>m.value).map(parseFloat);
       let min = Math.min(...arr);
       let max = Math.max(...arr);

       min = Number.isFinite(min)?min:0;
       max = Number.isFinite(max)?max:0;

       types.forEach(t=>t.innerText=selectedType);

       DailyData.countUpFloat(minElement, sMin, min);
       DailyData.countUpFloat(maxElement, sMax, max);
   
       DailyData.showMinMaxEachSensor(this.sensorData)
    }
    static showMinMaxEachSensor(sensorData){ 
        let parentMax = document.querySelectorAll("#maxDiv .values")[0];
        let parentMin = document.querySelectorAll("#minDiv .values")[0];
        parentMax.innerHTML="";
        parentMin.innerHTML="";
        let arrAll = sensorData.flat(1)
        
        selectedSensors.forEach(key=>{
            
            let e = arrAll.filter(m=>m.sensorId==key);

            let arr = e.map(m=>m.value);
            let min = Math.min(...arr);
            let max = Math.max(...arr);
            
            min = Number.isFinite(min)?min:0;
            max = Number.isFinite(max)?max:0;

            let div = document.createElement('div');
            div.classList.add("minMaxInfo");
            div.innerHTML = max;
            parentMax.append(div);

            let div1 = document.createElement('div');
            div1.classList.add("minMaxInfo");
            div1.innerHTML = min;
            parentMin.append(div1);
        });
    }

    normalizeSeries(series, targetLength) {
        let lastValue = 0;
        return Array.from({ length: targetLength }, (_, i) => {
            if (series[i] != null) {
            lastValue = series[i];
            return series[i];
            }
            return lastValue ?? 0;
        });
    }
}
