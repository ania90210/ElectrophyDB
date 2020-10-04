const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const app = express();
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');

app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use(express.static(__dirname + '/pages'));

// database connection
const db = mysql.createConnection({
    host:   process.env.DB_HOST,
    user:   process.env.MYSQL_USER,
    password:   process.env.MYSQL_PASSWORD,
    dateStrings: 'date',
    database:  process.env.MYSQL_DATABASE
});

let connected = false;

while(connected) {
    console.log(' not Connected')
    db.connect((error) => {
        if (error) {
            console.log('Failed connecting to db', error);
            var waitTill = new Date(new Date().getTime() + seconds * 1000);
            while(waitTill > new Date()){}
        }
        console.log('Connected')
        connected=true;
    });
}

var dir = './uploads';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
    console.log("directory created")
}
// create tables if do not exist
let createTable1 = 'CREATE TABLE IF NOT EXISTS uploaded_files (id int(11) NOT NULL AUTO_INCREMENT,cancerType varchar(10) NOT NULL,cellLine varchar(15) NOT NULL,ionChannel varchar(15) NOT NULL,fileName text NOT NULL,date timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),PRIMARY KEY (id)) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4';
let createTable2 = 'CREATE TABLE IF NOT EXISTS csv_details (id int(11) NOT NULL,recording varchar(15) NOT NULL,Vstart int(10) NOT NULL,Vend int(10) NOT NULL,increment int(10) NOT NULL,pulseNumber int(10) NOT NULL,pulseLength int(10) NOT NULL,KEY id (id),CONSTRAINT csv_details_ibfk_1 FOREIGN KEY (id) REFERENCES uploaded_files (id) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'; 
db.query(createTable1, function (err, result) {
    if (err) throw err;
});
db.query(createTable2, function (err, result) {
    if (err) throw err;
});



// Upload a file into ./uploads and send data to database
app.post('/upload',  function (req, res) {
   
    if(req.files){
        const file =  req.files.fileupload;
        var filename = file.name; 
        const ext = path.extname(filename) 
        filename = filename.split('.').join('-' + Date.now() + '.');
// in case of csv file
        if(!fs.existsSync('./uploads/' + filename) && ext == '.csv') {

            const errors = validateABFDetails(req);
            if(errors.length) {
                res.status(200).redirect('upload.html');
                return;
            }
            file.mv('./uploads/' + filename);

            let sql = 'INSERT INTO uploaded_files SET ?';
            db.query(sql, {cancerType:req.body.cancertype, cellLine:req.body.cellline, ionChannel:req.body.ionchannel,
            fileName:filename}, (err, result) => {
                if(err) throw err;
            }); 

            var lastId;
            db.query('SELECT id FROM uploaded_files WHERE id = (SELECT MAX(id) FROM uploaded_files)', (err,rows) => {
                if(err) throw err;
                lastId = rows[0].id; 
                db.query('INSERT INTO csv_details SET ?', {id: lastId, recording:req.body.recording, Vstart:req.body.voltageStart, 
                    Vend:req.body.voltageEnd, increment:req.body.increment, pulseNumber:req.body.pulseNo, pulseLength:req.body.length}, 
                    (err, result) => {
                    if(err) throw err;
                    console.log('CSV data submitted');
                    res.status(200).redirect('upload.html');
                }); 
            })
// in case of abf / asc file
        } else if ( ext == '.asc' || ext == '.abf') { 
            const errors = validate(req);
            if(errors.length) {
                res.status(200).redirect('upload.html');
                return;
            }
            file.mv('./uploads/' + filename);
            let sql = 'INSERT INTO uploaded_files SET ?';
            db.query(sql, {cancerType:req.body.cancertype, cellLine:req.body.cellline, ionChannel:req.body.ionchannel,
                fileName:filename}, (err, result) => {
                    if(err) throw err;
                    console.log('ABF ASC data submitted');
                    res.status(200).redirect('upload.html');
                });
        } else {
            res.status(200).redirect('upload.html');
        }
    } else {
        res.status(200).redirect('upload.html')
    }
})

// Check if user filled all data
function validate(req) {
    const errors  = [];
    if (!req.body.cancertype || !req.body.cellline || !req.body.ionchannel) {
        errors.push('Error');
    }
    return errors;
}

function validateABFDetails(req) {
    const errors  = [];
    if (!req.body.voltageStart || !req.body.voltageEnd || !req.body.increment || !req.body.pulseNo || !req.body.length || 
        !req.body.cancertype || !req.body.cellline || !req.body.ionchannel) {
        errors.push('Error');
    }
    return errors;
}

// Get all data from database
app.get('/getData', (req, res) => { 
    let sql = 'SELECT * FROM uploaded_files';
    db.query(sql, (err,rows) =>{
        if(err) throw err;
        res.send(rows);
    })
})

// Delete file from server and data from the database
app.post('/deletepost/:fileName', (req, res) => {
    var filename =req.params.fileName;
    const filePath = './uploads/' + filename;
    fs.unlink(filePath, function (err) {
        if(err) throw err;
    });

    let sql = `DELETE FROM uploaded_files WHERE fileName = "${filename}"`;
    let query = db.query(sql, (err, result) => {
        if(err) throw err;
        res.status(200).redirect('../files.html')
    })
})

//Download a file
app.get('/download/:file(*)',(req, res) => {
    var file = req.params.file;
    var fileLocation = path.join('./uploads',file);
    res.download(fileLocation, file);
});

//Get data just from CSV files
app.get('/CSVbasicInfo', (req, res) => { 
    let sql = 'SELECT id FROM csv_details'
    db.query(sql, (err,rows) =>{
        if(err) throw err;
        if (rows.length > 0) {
            var ids = [];
            for(var i=0; i < rows.length; i++){
                ids.push(rows[i].id);
            }
            let sql2 = `SELECT * FROM uploaded_files WHERE id IN (${ids})`;
            db.query(sql2, (err,rows) =>{
                if(err) throw err;
                res.send(rows);
            })
        }
        else res.send(rows)
    })
})

// Get data from uploaded ABF files
app.get('/getCSVdetails/:id', (req, res) => { 
    let sql = `SELECT * FROM csv_details WHERE id = "${req.params.id}"`;
    db.query(sql, (err,rows) =>{
        if(err) throw err;
        res.send(rows); 
    })
})

// Check if it is ASC or ABF file and send indexes
app.get('/checkFile/:file(*)', (req, res) => {
    var filename = req.params.file;
    let file = fs.readFileSync('./uploads/' + filename, "utf8");
    let arr = file.split(/\r?\n/);
    var ids = [];
    //if it is ASC file then push indexes where "Sweep" occurs
    if(arr[0].includes("Series")){
        arr.forEach((line, idx)=> {
            if(line.includes("Sweep")){
                ids.push(idx+1);
            }
        });
        ids.push(arr.length);
    } else {
        ids.length = 0;
    }
    res.send(ids); 
})

app.listen('3000', () => {
    console.log('Server started at 3000');
})