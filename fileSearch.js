// get data from every uploaded file
function showHistory() {
    $.get( "/getData", function( data ) {
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

//Create a table with data
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
        const anchor = document.createElement("A");
        anchor.href = '/download/'+ results[i].fileName;;
        anchor.innerText = results[i].fileName;
        columnFile.className = "col-5";
        const columnDate = document.createElement("div"); 
        columnDate.innerHTML = results[i].date;
        columnDate.className = "col-4";

        const form = document.createElement("form");
        form.method="POST";
        form.action='/deletepost/'+ results[i].fileName;

        const buttonDiv = document.createElement("div");
        buttonDiv.className = "col-2";
        const buttonD = document.createElement('input');
        buttonD.setAttribute('type', 'submit');
        buttonD.setAttribute('class', ' button-delete');
        buttonD.setAttribute('value', 'Delete');
        buttonD.onclick=onDelete;

        columnFile.appendChild(anchor);
        buttonDiv.appendChild(buttonD);
        row.appendChild(columnId);
        row.appendChild(columnFile);
        row.appendChild(columnDate);
        row.appendChild(buttonDiv);
        form.appendChild(row);
        historySection.appendChild(form);
    }
}

function onDelete() {
    alert('File deleted');
}