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
            now.setHours(now.getHours() - 1);
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

        const diffMs = end - start;
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
                const [baseHour] = previousHour.split('T')[1].split(':').map(Number);

                for (let i = 1; i < this.hourDiff(previousHour,a.index); i++) {
                const obj = { ...a };

                    const newHour = (baseHour + i) % 24; 
                    // console.log(newHour);
                    obj.stamp = String(newHour).padStart(2, '0') + ':00';
                    obj.index = obj.index.split('T')[0]+"T"+obj.hour;
                    newArr.push(obj);
                    previousHour = obj.index; 
                }
             }else{
               previousHour = a.index; 
             }

            newArr.push(a);
            
        })

        return newArr;
       
    }

    getAveragePerHour(data, id) {

        let averageByHour = data.reduce((acc, item) => {
      

        const hour = item.stamp.split('T')[1].split(':')[0]+":00";
        const stamp = item.stamp.split('T')[0]+"T"+hour;
        
        // console.log(hour);
        if (!acc[stamp]) {
        acc[stamp] = { sensorId: id, stamp: `${hour}`, index: `${stamp}`, sum: 0, count: 0, value:0 };
        }
        
        acc[stamp].sum += parseFloat(item.value);
        acc[stamp].count += 1;
        return acc;
        }, {});
   
        // console.log(averageByHour);
    
        const arr = Object.keys(averageByHour)
        .sort((a, b) => Number(a) - Number(b))
        .map(key => {
            const data = averageByHour[key]; 
            return {
            ...data,
            hour: key,
            value: (data.sum / data.count).toFixed(2)
            };
        });

        return this.fillGaps(arr);

    }

    initChart(){
        let dates = this.getDates();
        // console.log(selectedType);
        selectedSensors.forEach(s=>{
            fetch(`https://skopje.pulse.eco/rest/dataRaw?sensorId=${s}&type=${selectedType}&&from=${dates.yesterday}&to=${dates.now}`)
        .then(response => response.json())
        .then(data => {
                this.sensorData.push(this.getAveragePerHour(data, s));
                // console.log(data);
                // console.log(this.getAveragePerHour(data, s));
                this.showChart();
                this.setMinMax();
        });
        })
        

    }
    
    showChart(){
        const series = this.getSeries();
        const xLabels = this.getXlabels();
        
        console.log(options.xaxis);
        console.log(xLabels);
        
        options.series = series,
        options.xaxis.categories = xLabels;
        // options.xaxis.range = 24;
        console.log(options.xaxis);
        this.chart.updateOptions(options);
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

            // console.log(obj);
            arr.push(obj);
        })

        return arr;
    }
    getXlabels(){
        let arr = this.sensorData[0]
        // .filter(s => s.sensorId == selectedSensors[0])
        .map(d=>d["stamp"]);
 
        return arr;
    }
    countUpFloat(el, start, end, duration = 700, decimals = 2) {
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

       types.forEach(t=>t.innerText=selectedType);


       this.countUpFloat(minElement, sMin, min);
       this.countUpFloat(maxElement, sMax, max);

   
    }
       
}
