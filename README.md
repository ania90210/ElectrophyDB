# MasterProject
A web-based platform for data management and modeling in cancer electrophysiology.

To run the application firstly:
- install docker and docker-compose
- run: 'docker-compose up' command

Type http://localhost:3000/upload.html in the browser to see the upload page.

In order to upload converted ABF files (messung_4/5/6/7/20.csv from ABFfiles folder) or ASC files (cell1/2.csv from ASCfiles folder), type in: 
- recording: voltage-clamp (most important)
- voltage levels from: -60 to 60
- increment: 10
- number of pulses: 13 (most important for converted ABF files)
- pulse length: 800
