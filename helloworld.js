var http = require('http');
var fs = require('fs');

function serveStaticFiles(res, path, contentType, responseCode) {
    if (!responseCode) responseCode = 200;
    console.log(__dirname+path);

    fs.readFile(__dirname + path, function (err, data) {
        if (err) {
            res.writeHead(500, { 'Content-type': 'text/plain' });
            res.end('500 - Internal Error');
        } else {
            res.writeHead(responseCode, { 'Content-type': contentType });
            res.end(data);
        }
    })
}

http.createServer(function (req, res) {
    var path = req.url.replace(/\/?(?:\?.*)?$/, '').toLowerCase();
    
    switch (path) {
        case '':
            serveStaticFiles(res, '/public/home.html', 'text/html');
            break;
        case '/about':
            serveStaticFiles(res, '/public/about.html', 'text/html');
            break;
        default:
            serveStaticFiles(res, '/public/404.html', 'text/html');
            break;
    }
}).listen(3000);

console.log('Сервер запущен на localhost:3000');