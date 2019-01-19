/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/
/* Import helper libraries */
var urlLib = require('url');
var _ = require('underscore');

/* Set up data store and constants */
var data = {
  results: []
};
var lastObjectId = -1;
var defaultCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': 10 // Seconds.
};

/* Helper functions */
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

var createMessage = function(input) {
  var message = {
    objectId: lastObjectId + 1,
    createdAt: Date.now(),
    username: input.username || 'anonymous',
    text: input.text || '',
    roomname: input.roomname || 'lobby',
  };
  lastObjectId++;
  return message;
};

var getFilteredData = function(urlDetails, data) {
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
  return newData;
};

/* 
 *  Request handler logic. Everything below will consume a request, `ReadableStream`,
 *  and emit a response, `WriteableStream`.
 */
var requestHandler = function(request, response) {
  /* Logging */
  console.log('Serving request type ' + request.method + ' for url ' + request.url);

  /* Set headers */
  var headers = defaultCorsHeaders;
  headers['Content-Type'] = 'text/plain';

  /* 
   *  Parse the incoming request's url into a more usable format, { Url }.
   *  The second parameter to .parse is `true` so that the .key property of the
   *  returned object will be an object and not a string. 
   */
  var urlDetails = urlLib.parse(request.url, true);
  
  /* Declare outgoing status variable */
  var statusCode;
  /* Routing logic - Determine how to consume the incoming request */
  if (urlDetails.pathname === '/classes/messages') {
    if (request.method === 'GET') {
      var newData = getFilteredData(urlDetails, data);
      statusCode = 200;
      response.writeHead(statusCode, headers);
      response.end(JSON.stringify(newData));
    } 
    if (request.method === 'POST') {
      statusCode = 201;
      var body = [];
      request.on('data', (chunks) => {
        body.push(chunks);
      }).on('end', () => {
        var input = JSON.parse(Buffer.concat(body).toString());
        var message = createMessage(input);
        data.results.push(message);
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

/* Exports our request handling function */
module.exports = {
  requestHandler
};
