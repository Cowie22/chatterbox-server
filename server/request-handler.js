/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/
var urlLib = require('url');
var _ = require('underscore');

var data = {
  results: []
};

var lastObjectId = -1;

// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.
var defaultCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': 10 // Seconds.
};

var filterData = function(data, prop, value) {
  var newData = data.results.reduce(function(acc, curr) {
    if (curr[prop] === value) {
      acc.results.push(curr);
    }
    return acc;
  }, { results: [] });
  return newData;
};

var orderData = function(data, prop) {
  var order = prop[0] === '-' ? 'DESC' : 'ASC';
  prop = prop[0] === '-' ? prop.slice(1) : prop;
  var newData = _.sortBy(data.results, prop);
  if (order === 'DESC') {
    return {results: newData.reverse()};
  }
  return {results: newData};
};

var requestHandler = function(request, response) {
  // Request and Response come from node's http module.
  //
  // They include information about both the incoming request, such as
  // headers and URL, and about the outgoing response, such as its status
  // and content.
  //
  // Documentation for both request and response can be found in the HTTP section at
  // http://nodejs.org/documentation/api/

  // Do some basic logging.
  //
  // Adding more logging to your server can be an easy way to get passive
  // debugging help, but you should always be careful about leaving stray
  // console.logs in your code.
  console.log('Serving request type ' + request.method + ' for url ' + request.url);

  // See the note below about CORS headers.
  var headers = defaultCorsHeaders;

  // Tell the client we are sending them plain text.
  //
  // You will need to change this if you are sending something
  // other than plain text, like JSON or HTML.

  headers['Content-Type'] = 'text/plain';

  var urlDetails = urlLib.parse(request.url, true);
  
  // The outgoing status.
  var statusCode;
  console.log(urlDetails.query);



  // .writeHead() writes to the request line and headers of the response,
  // which includes the status and all headers.

  if (urlDetails.pathname === '/classes/messages') {
    if (request.method === 'GET') {
      var newData = data;
      for (var key in urlDetails.query) {
        if (key.includes('where')) {
          var prop = key.slice(6, key.length - 1);
          newData = filterData(newData, prop, urlDetails.query[key]);
        }
        if (key === 'order') {
          newData = orderData(newData, urlDetails.query[key]);
        }
      }
      statusCode = 200;
      response.writeHead(statusCode, headers);
      response.end(JSON.stringify(newData));
    } 
    if (request.method === 'POST') {
      statusCode = 201;
      request.on('data', (chunks) => {
        var input = JSON.parse(chunks.toString());
        var message = {
          objectId: lastObjectId + 1,
          createdAt: Date.now(),
          username: input.username || 'anonymous',
          text: input.text || '',
          roomname: input.roomname || 'lobby',
        };
        lastObjectId++;
        data.results.push(message);
      });
      request.on('end', () => {
        response.writeHead(statusCode, headers);
        response.end(JSON.stringify(data));
      });
    }
    if (request.method === 'OPTIONS') {
      statusCode = 200;
      response.writeHead(statusCode, headers);
      response.end();
    }
  } else {
    statusCode = 404;
    response.writeHead(statusCode, headers);
    response.end('PAGE NOT FOUND');
  }
 
  // Make sure to always call response.end() - Node may not send
  // anything back to the client until you do. The string you pass to
  // response.end() will be the body of the response - i.e. what shows
  // up in the browser.
  //
  // Calling .end "flushes" the response's internal buffer, forcing
  // node to actually send all the data over to the client.
};

module.exports = {
  requestHandler
};
