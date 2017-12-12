let cloud = new CloudSaver();
let globalPoints = {};
let globalPolys = {};
let loadedSets = [];

/** returns the bounds of variable map (assumed global)
@return {object} - has preperties minLat, maxLat, minLng, maxLng
*/
getViewBounds = function() {
  mapSize = map.getBounds();
  return sectionBounds = {
    minLat: mapSize.f.b,
    maxLat: mapSize.f.f,
    minLng: mapSize.b.b,
    maxLng: mapSize.b.f,
  };
};

/** the function that is assigned to the maps idle event
*/
updateData = function() {
  loadDatasetsWithBounds(getViewBounds());
};

/** goes through each dataset current in use and gets the data for them
@param  {String} bounds - expects an objects with minLat, maxLat, minLng, maxLng
*/
loadDatasetsWithBounds = function(bounds) {
  for (let i = 0; i < loadedSets.length; i++) {
    if (globalPoints[loadedSets[i]]) {
      getPointData(dataset, bounds, function(data) {
        try {
          hideOnMap(globalPoints[loadedSets[i]]);
        } catch (e) {
          console.log(e);
        }
        drawPoints(data, function(geom) {
          globalPoints[dataset] = geom;
        });
      });
    }
    if (globalPolys[loadedSets[i]]) {
      getPolyData(dataset, bounds, function(data) {
        try {
          hideOnMap(globalPolys[loadedSets[i]]);
        } catch (e) {
          console.log(e);
        }
        drawPolys(data, function(geom) {
          globalPolys[dataset] = geom;
        });
      });
    }
  }
};

/** Log all errors to console
@param {object} e - any object e, that is returned as an error
*/
errorCallback = function(e) {
  console.log(e);
};

/** When a call is placed to the datasets api, this callback setups up the
checked boxes.
@param {List} data - a list of objects with id & and name
*/
datasetCallback = function(data) {
  let menu = document.getElementById('menu');
  for (let i = 0; i < data.length; i++) {
    let textnode = document.createTextNode(data[i].name);
    let input = document.createElement('input');
    input.type = 'checkbox';
    input.value = i;
    let label = document.createElement('label');
    label.appendChild(input);
    label.appendChild(textnode);
    let checkbox = document.createElement('div');
    checkbox.class = 'checkbox';
    checkbox.value = data[i].id;
    checkbox.onchange = function(e) {
      dataset = this.value;
      if (e.srcElement.checked) {
        if (!globalPolys[dataset] && !globalPoints[dataset]) {
          let bounds = getViewBounds();
          getPointData(dataset, bounds, function(data) {
            drawPoints(data, function(geom) {
              globalPoints[dataset] = geom;
            });
          });
          getPolyData(dataset, bounds, function(data) {
            drawPolys(data, function(geom) {
              globalPolys[dataset] = geom;
            });
          });
        } else {
          displayOnMap(globalPoints[dataset]);
          displayOnMap(globalPolys[dataset]);
        }
      } else {
        if (globalPolys[dataset] || globalPoints[dataset]) {
          hideOnMap(globalPoints[dataset]);
          hideOnMap(globalPolys[dataset]);
        }
      }
      loadedSets.push(dataset);
    };
    checkbox.appendChild(label);
    menu.appendChild(checkbox);
  }
};


/** What you call when you want to get the point data
@param {int} dataset - the id of the dataset to get
@param {object} optionalBounds - the api data bounds, else use view bounds
@param {function} optionalCallback - the callback, if none, draw points
*/
getPointData = function(dataset, optionalBounds, optionalCallback) {
  if (!optionalBounds) optionalBounds = getViewBounds();
  if (!optionalCallback) optionalCallback = drawPoints;
  cloud.getGISPoints(
    dataset,
    optionalBounds.minLat,
    optionalBounds.maxLat,
    optionalBounds.minLng,
    optionalBounds.maxLng,
    optionalCallback,
    function(data) {
      console.log(data);
    }
  );
};

/** What you call when you want to get the poly data
@param {int} dataset - the id of the dataset to get
@param {object} optionalBounds - the api data bounds, else use view bounds
@param {function} optionalCallback - the callback, if none, draw polys
*/
getPolyData = function(dataset, optionalBounds, optionalCallback) {
  if (!optionalBounds) optionalBounds = getViewBounds();
  if (!optionalCallback) optionalCallback = drawPolygons;
  cloud.getGISPolys(
    dataset,
    optionalBounds.minLat,
    optionalBounds.maxLat,
    optionalBounds.minLng,
    optionalBounds.maxLng,
    optionalCallback,
    function(data) {
      console.log(data);
    }
  );
};

/** draws the points on the map
@param {List} data - the lsit of points from the API
@param {function} optionalCallback - the callback, if none end
*/
drawPoints = function(data, optionalCallback) {
  let points = [];
  let infoWindows = [];
  let contents = [];
  for (let i = 0; i < data.length; i++) {
    let marker = new google.maps.Marker({
      position: {
        lat: parseFloat(data[i].latitude),
        lng: parseFloat(data[i].longitude),
      },
      map: map,
      title: data[i].name,
    });
    contents.push('<div id="content">'+
    '<div id="siteNotice">'+
    '</div>'+
    '<h1 id="firstHeading" class="firstHeading">'+ data[i].name +'</h1>'+
    '<div id="bodyContent">'+
      '<ul>' +
        '<li> street: ' + data[i].street + '</li>' +
        '<li> city: ' + data[i].city + '</li>' +
        '<li> county: ' + data[i].county + '</li>' +
        '<li> state: ' + data[i].state + '</li>' +
        '<li> latitude, longitude: ' + data[i].latitude + ', ' +
                                     data[i].longitude + '</li>' +
        '<li> detail 1: ' + data[i].field1 + '</li>' +
        '<li> detail 2: ' + data[i].field2 + '</li>' +
        '<li> detail 3: ' + data[i].field3 + '</li>' +
        '<li> tags: ' + data[i].tags + '</li>' +
      '</ul>'+
    '</div>'+
    '</div>');
    infoWindows.push(infowindow = new google.maps.InfoWindow({
      content: contents[i],
    }));
    marker.addListener('click', function() {
      infoWindows[i].open(map, marker);
    });
    points.push(marker);
  }
  optionalCallback(points);
};

/** draws the polys on the map
@param {List} data - the lsit of polys from the API
@param {function} optionalCallback - the callback, if none end
*/
drawPolys = function(data, optionalCallback) {
  geometries = [];
  for (let i = 0; i < data.features.length; i++) {
    let pairedCoord = data.features[i].geometry.coordinates[0][0];
    let objectCoord = [];
    let name = data.features[i].properties.name;
    for (let j = 0; j < pairedCoord.length; j++) {
      objectCoord.push({
        lng: pairedCoord[j][0],
        lat: pairedCoord[j][1],
      });
    }
    geometries.push(new google.maps.Polygon({
      paths: objectCoord,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
      title: name,
    }));
    geometries[i].setMap(map);
  }
  optionalCallback(geometries);
};


/** applys the map to the poly / point
@param {List} array - the lsit of polys or points
*/
displayOnMap = function(array) {
  if (array) {
    for (let i = 0; i < array.length; i++) {
      array[i].setMap(map);
    }
  }
};

/** removes the map to the poly / point
@param {List} array - the lsit of polys or points
*/
hideOnMap = function(array) {
  if (array) {
    for (let i = 0; i < array.length; i++) {
      array[i].setMap(null);
    }
  }
};
