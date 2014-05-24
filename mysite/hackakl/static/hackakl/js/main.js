$("#route-number").val("TEST");

var map = L.map('map').setView([-36.848460 , 174.763332], 13);

// L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
//     maxZoom: 18,
// }).addTo(map);

var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>',
    id: "ajesler.iamkmeee"
});

map.addLayer(mapboxTiles);

// var map = L.map('map')
//     .addLayer(mapboxTiles)
//     .setView([42.3610, -71.0587], 15);

routeLayers = {};

busReloadTimer = undefined;

layerControls = undefined;

// map.on('layeradd', function(e){
// 	alert("Layer added: ");
// });

function loadRoute() {
	var routeCode = $("#route-number").val();

	var routeURL = "/dummyroute/"+routeCode;

	if(busReloadTimer){
		window.clearInterval(busReloadTimer);
	}

	$.ajax({
	  dataType: "json",
	  url : routeURL,
	  data: null,
	  success: handleRouteData
	});

	loadBusesForRoute(routeCode);

	busReloadTimer = setInterval(function(){
		loadBusesForRoute(routeCode);
	}, 30000);
};

function handleRouteData(data, textStatus, jqXHR){

	renderRoute(data, textStatus, jqXHR);

	if(layerControls){
		map.removeLayer(layerControls);
		layerControls = null;
	}

	layerControls = L.control.layers({}, routeLayers);
	layerControls.addTo(map);
};

function loadBusesForRoute(route_code){
	var busURL = "/dummybuses/"+route_code;

	$.ajax({
	  dataType: "json",
	  url: busURL,
	  data: null,
	  success: renderBuses
	});
};

function renderRoute(data, textStatus, jqXHR ){
	var route_code = data.properties.route_code;

	if(routeLayers[route_code]){
		map.removeLayer(routeLayers[route_code]);
		delete routeLayers[route_code];
	}

	var routeStyle = {
	    "color": "#FF0000",
	    "weight": 10,
	    "opacity": 0.85
	};

	var geoLayer = L.geoJson(data, { style: routeStyle });
	geoLayer.addTo(map);

	routeLayers[route_code] = geoLayer;
};

function onEachBus(feature, layer) {
	var popupContent = null;

	if (feature.properties && feature.properties.popupContent) {
		popupContent = feature.properties.popupContent;
		layer.bindPopup(popupContent);
	}
};

function renderBuses(data, textStatus, jqXHR) {

	if(routeLayers['buses']){
		map.removeLayer(routeLayers['buses']);
		delete routeLayers[routeLayers['buses']];
	}

	var routeStyle = {
	    "color": "#00FF00",
	    "weight": 10,
	    "opacity": 0.85
	};

	var iconSize = 45;
	var busIcon = L.icon({
	    iconUrl: 'static/hackakl/images/bus.png',

	    iconSize:     [iconSize, iconSize], // size of the icon
	    iconAnchor:   [iconSize, 21], // point of the icon which will correspond to marker's location
	    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
	});

	var geoLayer = L.geoJson(data, { 
		style: routeStyle,
		pointToLayer: function (feature, latlng) {
			return L.marker(latlng, {icon: busIcon});
		},
		onEachFeature: onEachBus
 	});
	geoLayer.addTo(map);

	routeLayers['buses'] = geoLayer;
};


