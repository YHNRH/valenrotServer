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
          },
          subheader1: {
            fontSize:10,
            bold:true,
            alignment:'left',
            color:'red'
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

function getContent(sections){
  var content = []
  var rootsections = sections.filter(el => !el.parentId)
  
  rootsections.forEach(section => {
    content.push({text: section.title,
      style:'header'
    })
    content.push({
      text: section.text
    })

    content.push(getChildSections(sections, section.uid))

  })
  return content;
}

function getChildSections(sections, parentId){
  var content = []
  sections.filter(child => child.parentId === parentId).forEach(el => {
    content.push({text: el.title,
      style: 'subheader'
    })
    content.push({
      text: el.text
    })
      content.push(getChildSections(sections, el.uid))
  })

  return content
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