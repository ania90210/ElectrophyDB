// get data from CSV files
function showFilesToGraph() {
    $.get( "/CSVbasicInfo", function( data ) {
        if(!data) alert('NO DATA RECEIVED');
        const result = takeSearchedData(data);
        if(result.length == 0) alert('Not found');
        showTable(result);
    });
}
// Take just the data searched by the user
function takeSearchedData(data){
    const cancertype = $("input[name='cancertype']").val();
    const cellline = $("input[name='cellline']").val();
    const ionchannel = $("input[name='ionchannel']").val();
    const result  = [];

    for(var i=0; i < data.length; i++){
        if ((data[i].cancerType == cancertype || cancertype == '') && (data[i].cellLine == cellline || cellline == '') && (data[i].ionChannel == ionchannel || ionchannel == '' )) {
            result.push(data[i]);
        } 
        if (cancertype == '' && cellline == '' && ionchannel ==''){
            result.length = 0;
        } 
    }
    return result;
}

// show table with data from CSV files
function showTable(results) {
    const historySection = document.getElementById("history-section");
    if (historySection.innerHTML != "") {
        historySection.innerHTML = "";
    }

    for(var i=0; i < results.length; i++){
        const row = document.createElement("div"); 
        row.setAttribute('class','row row-results border') ;
        const columnId = document.createElement("div");
        columnId.innerHTML = results[i].id;
        columnId.className = "col-1";
        const columnFile = document.createElement("div");
        columnFile.innerHTML = results[i].fileName;
        columnFile.className = "col-5";
        const columnDate = document.createElement("div"); 
        columnDate.innerHTML = results[i].date;
        columnDate.className = "col-4";

        const buttonDiv = document.createElement("div");
        buttonDiv.className = "col-2";
        const buttonG = document.createElement('input');
        buttonG.setAttribute('type', 'submit');
        buttonG.setAttribute('class', ' button-delete');
        buttonG.setAttribute('value', 'Graph');
        buttonG.file = results[i].fileName;
        buttonG.fileId = results[i].id;
        buttonG.onclick = onGraph;

        buttonDiv.appendChild(buttonG);
        row.appendChild(columnId);
        row.appendChild(columnFile);
        row.appendChild(columnDate);
        row.appendChild(buttonDiv);
        historySection.appendChild(row);
    }
}
// Check if the file is ASC or ABF
function onGraph() {
    const fileId = this.fileId;
    const fileName = this.file;
    $.get( "/checkFile/"+fileName, function( data ) {
        // if ABF file
        if(data.length == 0) {
            // take more information
            $.get( "/getCSVdetails/" + fileId, function( data ) {           
                drawGraphABF(data[0].pulseNumber, fileName, data[0].recording);
            });
        }
        // if ASC file
        else {
            drawGraphASC(data.length, fileName, data);
        }
    });    
}

// Calculations and graph in case of ABF files
async function drawGraphABF(pulseNumber, fileName, recording) {
    const ctx = document.getElementById('chart').getContext('2d');
    const nameOfFile = document.getElementById("file");
    // Clear chart area
    if(nameOfFile.innerHTML != "") {
        myChart.destroy();  
    }
    nameOfFile.innerHTML = fileName;    

    const response = await fetch('./uploads/'+fileName);
    const data = await response.text();
    const rows = data.split('\n');
    const k  = 'col'; 
    const xlabels = [];
    const ylabels = [];

    // Create columns for current: col1|2|3.. 
    for(var i=0; i < pulseNumber; i++) {
        eval('var ' + k + i + '= [];'); 
    }
    //Push values into columns
    for(var a = 0; a < rows.length-1; a = a + 100) { 
        const newRow = rows[a].replace(/;/g, ','); 
        const columns = newRow.split(','); 
        for(var i=0; i < pulseNumber+1; i++) { 
            if(i==pulseNumber) eval('xlabels.push(' + columns[i] + ');');
            else eval(k + i + '.push(' + columns[i] + ');');
        }
    }

    for(var i=0; i < pulseNumber; i++) {
        eval('ylabels.push(' + k + i + ');');
    }

    const sites = [];
    // create datasets for chart
    for (var i = 0; i < pulseNumber; i++) {
        const site = {
            fill: false,
            data: ylabels[i],
            backgroundColor: '"#369EAD"',
            borderColor: '#369EAD',
            borderWidth: 1
        };
        sites.push(site);
    }
    var yLabel = "Current [A]";
    if(!col0.includes('e')) yLabel = "Current [nA]";
    if(recording == "current") yLabel = "Voltage [V]";
    //Draw chart
    createChart(ctx, xlabels, sites, yLabel);
}

// Calculations and graph in case of ASC files
async function drawGraphASC(pulseNumber, fileName, dataIdx) {
    const ctx = document.getElementById('chart').getContext('2d');
    const nameOfFile = document.getElementById("file");
    // Clear chart area
    if(nameOfFile.innerHTML != "") {
        myChart.destroy();  
    }
    nameOfFile.innerHTML = fileName; 

    const response = await fetch('./uploads/'+fileName);
    const data = await response.text();
    // Delete first row including "Series_1_1"
    const rows = data.split('\n').slice(1); 
    const k  = 'col'; 
    const xlabels = [];
    const ylabels = [];
    // Create columns for current: col1|2|3.. 
    for(var i=0; i < pulseNumber-1; i++) {
        eval('var ' + k + i + '= [];'); 
    }
    //Push values into columns
    for(var i = 0; i < pulseNumber-1; i++) {
        for(var a = dataIdx[i]; a < dataIdx[i+1] - 3; a = a + 200) {
            const newRow = rows[a].replace(/;/g, ',');
            const columns = newRow.split(',');
            if(i==0) eval('xlabels.push(' + columns[1] + ');');
            eval(k + i + '.push(' + columns[2] + ');');
        }
    }

    for(var i=0; i < pulseNumber-1; i++) {
        eval('ylabels.push(' + k + i + ');');
    }

    const sites = [];

    for (var i = 0; i < pulseNumber-1; i++) {

        const site = {
            fill: false,
            data: ylabels[i],
            backgroundColor: '"#369EAD"',
            borderColor: '#369EAD',
            borderWidth: 1
        };
        sites.push(site);
    }
    //Draw chart
    createChart(ctx, xlabels, sites, 'Current [A]');
}

// Create chart with calculated data
function createChart(ctx, xlabels, sites, yLabel) {
    myChart = new Chart(ctx, {
        type: 'line',
        data:  {
            labels: xlabels, 
            datasets: sites
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    },
                    scaleLabel: {
                        display: true,
                        labelString: yLabel
                      }
                }],
                xAxes: [{
                    ticks: {
                        beginAtZero: true,
                        maxTicksLimit: 10,
                        min: 0,
                        stepSize: 0.1
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Time [s]'
                      }
                }]
            },
            elements: {
                point:{
                    radius: 0
                },
                line: {
                    tension: 0 
                }
            },
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                   label: function(tooltipItem) {
                          return tooltipItem.yLabel;
                   }
                }
            }
        }
    });
}