
// document.getElementById("sensorPollution").addEventListener("change", (e)=>{

//     let val = e.target.value;

//     console.log(val);
//     document.getElementById("svgLanding").classList = "";
//     document.getElementById("svgLanding").classList.add(val);

    
// })

var options = {
          series: [0],
          chart: {
          height: 200,
          width: 200,
          type: 'radialBar',
          offsetY: -10
        },
         colors: [
            function({ value, seriesIndex, w }) {
            // value is the scaled percentage (0-100)
            if (value <= 30) return 'var(--second)';       // green
            if (value <= 70) return '#fdcb6e';       // yellow/orange
            return 'var(--first)';                             // red
            }
        ],
        plotOptions: {
          radialBar: {
            startAngle: -135,
            endAngle: 135,
            dataLabels: {
              name: {
                fontSize: '20px',
                color: "var(--text-color)",
                offsetY: 80,
                fontFamily: "var(--font-outfit)",
                fontWeight: 400,
              },
              value: {
                offsetY: -8,
                fontSize: '22px',
                color: "var(--text-color-light)",
                formatter: function (val) {
                  return val + "μ";
                }
              }
            }
            
          }
        },
        labels: ['Current Air Quality'],

        };

var chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render();

let sensor = "1003";
let selectedType = "pm10";
    function formatWithTimezone(date) {

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
   function getDates(){
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

    let airQ = { 
        pm25:50,
        pm10:70
    }
  

    let dates = getDates();
    let maxValue = { 
        pm25: 50,
        pm10: 70
    }

        const requests = fetch(`https://skopje.pulse.eco/rest/dataRaw?sensorId=${sensor}&type=${selectedType}&from=${dates.yesterday}&to=${dates.now}`)
            .then(res => res.json())
            .then(data => {
                let obj = data.pop();
                console.log(options.series);
                const percentage = (obj.value / maxValue[selectedType]) * 100;

                // chart.updateSeries([percentage]);
                chart.updateOptions({
                    series: [percentage],
                    plotOptions: {
                        radialBar: {
                        dataLabels: {
                            value: {
                            formatter: function() {
                                return obj.value + "μg";
                            }
                            }
                        }
                        }
                    }
                    });


                changeAnim(obj.value);
            });

 function changeAnim(val){
    const percentage = (val / maxValue[selectedType]) * 100;
    document.getElementById("svgLanding").classList = "";
    if(percentage<=30){
        document.getElementById("svgLanding").classList.add("NotPolluted");
        return;
    }
    else if(percentage<=70){
        document.getElementById("svgLanding").classList.add("MediumPolluted");
        return;
    }
    else{
        document.getElementById("svgLanding").classList.add("Polluted");
        return;
    }

}
