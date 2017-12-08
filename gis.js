const cloud = new CloudSaver();
const globalPoints = {};
const globalPolys = {};
const loadedBounds = {
  minLat: 42.68298784577109,
  maxLat: 42.97254904409256,
  minLng: -74.00697028808594,
  maxLng: -73.37662971191406,
};
const loadedSets = [];

updateData = function() {
  mapSize = map.getBounds();
  if (mapSize.f.f < loadedBounds.minLat) {
    let sectionBounds = {
      minLat: mapSize.f.f,
      maxLat: loadedBounds.minLat,
      minLng: loadedBounds.minLng,
      maxLng: loadedBounds.maxLng,
    };
    loadDatasetsWithBounds(sectionBounds);
    loadedBounds.minLat = mapSize.f.f;
  }
  if (mapSize.f.b > loadedBounds.maxLat) {
    let sectionBounds = {
      minLat: loadedBounds.maxLat,
      maxLat: mapSize.f.b,
      minLng: loadedBounds.minLng,
      maxLng: loadedBounds.maxLng,
    };
    loadDatasetsWithBounds(sectionBounds);
    loadedBounds.maxLat = mapSize.f.b;
  }
  if (mapSize.b.f < loadedBounds.minLng) {
    let sectionBounds = {
      minLat: loadedBounds.minLat,
      maxLat: loadedBounds.maxLat,
      minLng: mapSize.b.f,
      maxLng: loadedBounds.minLng,
    };
    loadDatasetsWithBounds(sectionBounds);
    loadedBounds.minLat = mapSize.f.f;
  }
  if (mapSize.b.b < loadedBounds.maxLng) {
    let sectionBounds = {
      minLat: loadedBounds.minLat,
      maxLat: loadedBounds.maxLat,
      minLng: loadedBounds.maxLng,
      maxLng: mapSize.b.b,
    };
    loadDatasetsWithBounds(sectionBounds);
    loadedBounds.minLat = mapSize.f.f;
  }
};

loadDatasetsWithBounds = function(bounds) {
  for (let i = 0; i < loadedSets.length; i++) {
    console.log(bounds);
    if (globalPoints[loadedSets[i]]) {
      getPointData(dataset, bounds, function(data) {
        drawPoints(data, function(geom) {
          globalPoints[dataset] += geom;
        });
      });
    }
    if (globalPolys[loadedSets[i]]) {
      getPolyData(dataset, bounds, function(data) {
        drawPolys(data, function(geom) {
          globalPolys[dataset] += geom;
        });
      });
    }
  }
};
errorCallback = function(e) {
  console.log(e);
};
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
          getPointData(dataset, loadedBounds, function(data) {
            drawPoints(data, function(geom) {
              globalPoints[dataset] = geom;
            });
          });
          getPolyData(dataset, loadedBounds, function(data) {
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
getPointData = function(dataset, optionalBounds, optionalCallback) {
  if (!optionalBounds) optionalBounds = loadedBounds;
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
getPolyData = function(dataset, optionalBounds, optionalCallback) {
  if (!optionalBounds) optionalBounds = loadedBounds;
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
drawPolys = function(data, optionalCallback) {
  geometries = [];
  for (let i = 0; i < data.features.length; i++) {
    let pairedCoord = data.features[i].geometry.coordinates[0][0];
    let objectCoord = [];
    for (let j = 0; j < paired_coord.length; j++) {
      objectCoord.push({
        lng: pairedCoord[j][0],
        lat: pairedCoord[j][1],
      });
    }
    geometries.push(new google.maps.Polygon({
      paths: object_coord,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
    }));
    geometries[i].setMap(map);
  }
  optionalCallback(geometries);
};
drawPoints = function(data, optionalCallback) {
  points = [];
  for (let i = 0; i < data.length; i++) {
    let marker = new google.maps.Marker({
      position: {
        lat: parseFloat(data[i].latitude),
        lng: parseFloat(data[i].longitude),
      },
      map: map,
      title: data[i].name,
    });
    points.push(marker);
  }
  optionalCallback(points);
};
displayOnMap = function(array) {
  if (array) {
    for (let i = 0; i < array.length; i++) {
      array[i].setMap(map);
    }
  }
};
hideOnMap = function(array) {
  if (array) {
    for (let i = 0; i < array.length; i++) {
      array[i].setMap(null);
    }
  }
};
