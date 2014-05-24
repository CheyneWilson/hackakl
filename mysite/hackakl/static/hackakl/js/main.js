$("#route-number").val("TEST");

var map = L.map('map').setView([-36.848460 , 174.763332], 13);

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
}).addTo(map);

routeLayers = {};

// map.on('layeradd', function(e){
// 	alert("Layer added: ");
// });

L.control.layers({}, routeLayers).addTo(map);

function loadRoute() {
	var routeNum = $("#route-number").val();

	var routeURL = "/dummyroute/"+routeNum;

	$.ajax({
	  dataType: "json",
	  // url: "/static/hackakl/data/bus-routes.json",
	  url : routeURL,
	  data: null,
	  success: renderRoute
	});
};

function loadBuses(){
	// expect a feature collection from the json

	var routeNum = $("#route-number").val();

	var routeURL = "/dummybuses/"+routeNum;

	$.ajax({
	  dataType: "json",
	  url: routeURL,
	  data: null,
	  success: renderBuses
	});
}

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
}

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

	var geoLayer = L.geoJson(data, { style: routeStyle });
	geoLayer.addTo(map);

	routeLayers['buses'] = geoLayer;
}


