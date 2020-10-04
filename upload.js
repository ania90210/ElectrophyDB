// Check if user filled all data correctly in upload.html
function validation() {
    const cancertype = $("input[name='cancertype']").val();
    const cellline = $("input[name='cellline']").val();
    const ionchannel = $("input[name='ionchannel']").val();
    const filename = $("input[name='fileupload']").val(); 
    const voltageStart = $("input[name='voltageStart']").val();
    const voltageEnd = $("input[name='voltageEnd']").val();
    const increment = $("input[name='increment']").val();
    const pulseNo = $("input[name='pulseNo']").val();
    const length = $("input[name='length']").val();
    const fileext = fileExtension(filename);
    const file = filename.split(/(\\|\/)/g).pop(); 
 
    if((fileext == 'asc' || fileext == 'abf') && (cancertype == '' || cellline == '' || ionchannel =='')) {
        alert('Fill data correctly');
    } else if(fileext == 'csv'  && (cancertype == '' || cellline == '' || ionchannel == ''|| voltageStart == '' || 
    voltageEnd == '' || increment == ''|| pulseNo == '' || length == '')) {
        alert('Fill data correctly');
    } else if (file == '') {
        alert('Fill data correctly');
    } else if (fileext != 'asc' && fileext != 'abf' && fileext != 'csv') {
        alert('Wrong file extension');
    } else {
        alert('File submited'); 
    }     
};

function fileExtension(filename) {
    return filename.split('.').pop();
}

// Change when user selects current- or voltage-clamp
$('select').on('change', function(e){
    const recording = document.getElementById("rec");    
    if(this.value == "current") recording.innerHTML = "Current levels from";
    else recording.innerHTML = "Voltage levels from";
});