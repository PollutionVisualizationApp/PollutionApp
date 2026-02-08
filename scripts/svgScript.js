
document.getElementById("sensorPollution").addEventListener("change", (e)=>{

    let val = e.target.value;

    console.log(val);
    document.getElementById("svgLanding").classList = "";
    document.getElementById("svgLanding").classList.add(val);

    
})

var options = {
          series: [67],
          chart: {
          height: 200,
          width: 200,
          type: 'radialBar',
          offsetY: -10
        },
        colors: ['var(--second)'],
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
        // fill: {
        //   type: 'gradient',
        //   gradient: {
        //       shade: 'dark',
        //       shadeIntensity: 0.15,
        //       inverseColors: false,
        //       opacityFrom: 1,
        //       opacityTo: 1,
        //       stops: [0, 50, 65, 91]
        //   },
        // },
        // stroke: {
        //   dashArray: 4
        // },
        labels: ['Current Air Quality'],
        };

        var chart = new ApexCharts(document.querySelector("#chart"), options);
        chart.render();