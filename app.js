const http = require("http");
const request = require('request');
const fs = require('fs')
const PdfPrinter = require('pdfmake');

http.createServer(async function(req, res){
     
    res.setHeader("Content-Type", "application/json; charset=utf-8;");
     
    if(req.url === "/home" || req.url === "/"){
        res.write("<h2>Home</h2>");
        res.end();
    }
    else if(req.url == "/api/upload"){
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end', () => {
            console.log(body);
            fs.writeFile('data/output' + formatDate(Date.now()) + '.json', body, (err) => {
              if (err) throw err;
            })
            generatePdf(JSON.parse(body));
            res.write('"okay"'); 
            res.end(); 
        });
    }
    else if(req.url == "/api/download"){

      const getSortedFiles = async (dir) => {
        const files = await fs.promises.readdir(dir);
      
        return files
          .filter(el => el.startsWith("output") && el.endsWith(".json"))
          .map(fileName => ({
            name: fileName,
            time: fs.statSync(`${dir}/${fileName}`).mtime.getTime(),
          }))
          .sort((a, b) => a.time - b.time)
          .map(file => file.name);
      };
      
      getSortedFiles("data")
        .then(files => {
          fs.readFile("data/" + files.reverse()[0],(err,data)=>{
            if (err) throw err
            console.dir(data.toString())
            res.write(data.toString()); 
            res.end(); 
          })
        })
        .catch(console.error);

    }
    else if(req.url == "/api/names"){
        var body = await doRequest('https://randomall.ru/api/general/fantasy_name')
        console.log(body.split("<br>"));
        res.write(JSON.stringify(body.split("<br>")));
        res.end();
    }
    else{
        res.write("<h2>Not found</h2>");
        res.end();
    }
}).listen(3000);


function doRequest(url) {
    return new Promise(function (resolve, reject) {
      request.post(url, function (error, res, body) {
        if (!error && res.statusCode === 200) {
          resolve(body);
        } else {
          reject(error);
        }
      });
    });
}

function generatePdf(data) {
    var fonts = {
        Roboto: {
          normal: 'fonts/Roboto-Regular.ttf',
          bold: 'fonts/Roboto-Medium.ttf',
          italics: 'fonts/Roboto-Italic.ttf',
          bolditalics: 'fonts/Roboto-MediumItalic.ttf'
        }
      };
      

      var printer = new PdfPrinter(fonts);
      var fs = require('fs');
      
      var docDefinition = {
        styles: {
          header: {
            fontSize:25,
            bold:true,
            alignment:'left'
          },
          subheader: {
            fontSize:15,
            bold:true,
            alignment:'left'
          }
        },
        content: getContent(data)
      };
      
      var options = {
        // ...
      }
      
      var pdfDoc = printer.createPdfKitDocument(docDefinition, options);
      pdfDoc.pipe(fs.createWriteStream('data/document.pdf'));
      pdfDoc.end();
}

function getContent(data){
  var content = []
  data.forEach(el => {
    var race = el.race
    content.push({text: race.name,
        style:'header'
      })

    content.push({
			text: race.description
		})

    content.push({
			table:{
        widths:['auto','auto','*','auto','auto',],
				body:[
					[
            {text:'Здоровье',bold:true},
            race.health,
            {
              text: '',
              borderColor: ['#000000', '#ffffff', '#000000', '#ffffff'],
            },
            {text:'Сила',bold:true},
            race.strength, 
          ],
          [
            {text:'Уворот',bold:true},
            race.dodge, 
            {
              text: '',
              borderColor: ['#000000', '#ffffff', '#000000', '#ffffff'],
            },
            {text:'Ловкость',bold:true},
            race.agility, 
          ],
          [
            {text:'Стойкость',bold:true},
            race.durability, 
            {
              text: '',
              borderColor: ['#000000', '#ffffff', '#000000', '#ffffff'],
            },
            {text:'Харизма',bold:true},
            race.charisma, 
          ],
          [
            {text:'Точность',bold:true},
            race.accuracy, 
            {
              text: '',
              borderColor: ['#000000', '#ffffff', '#000000', '#ffffff'],
            },
            {text:'Интеллект',bold:true},
            race.intelligence, 
          ],
					[ {text:'Урон',bold:true},
          race.damage,
           {
            text: '',
            borderColor: ['#000000', '#ffffff', '#000000', '#ffffff'],
          },
           {text:'Восприятие',bold:true},
           race.perception
          ]
				],
				headerRows:1
			}
		})
    
    el.subraces.forEach(subrace => {
        content.push({text: subrace.name,
          style:'subheader'
        })
        content.push({text: subrace.description})

        content.push({text: "Пассивная способность: " +subrace.passiveAbility})

        content.push({text: "Активная способность: " + subrace.activeAbility})

    })
  })
  return content;
}

function formatDate(date) {
  var d = new Date(date),
      sec = '' + d.getSeconds(),
      min = '' + d.getMinutes(),
      hour = '' + d.getHours(),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) 
      month = '0' + month;
  if (day.length < 2) 
      day = '0' + day;

  return [year, month, day, hour, min, sec].join('-');
}