$("#route-number").val("TEST");

var map = L.map('map').setView([-36.848460 , 174.763332], 13);

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
}).addTo(map);

routeLayers = {};

function loadRoute() {
	var routeNum = $("#route-number").val();

	var routeURL = "/dummyroute/"+routeNum;

	$.ajax({
	  dataType: "json",
	  //url: "/static/hackakl/data/bus-route.json",
	  url : routeURL,
	  data: null,
	  success: renderRoute
	});
};

function loadBuses(){
	// expect a feature collection from the json

	$.ajax({
	  dataType: "json",
	  // dummy url = localhost:8000/
	  url: "/static/hackakl/data/bus-locations.json",
	  data: null,
	  success: renderRoute
	});
}

function renderRoute(data, textStatus, jqXHR ){
	var route_code = data.properties.route_code;

	if(routeLayers[route_code]){
		map.removeLayer(routeLayers[route_code]);
		delete routeLayers[data.properties.route_code];
	}

	var geoJsonRouteLayer =  L.geoJson(data, {
		pointToLayer: function (feature, latlng) {
			return L.marker(latlng);
		}
	});

	// var geoJsonRouteLayer =  L.geoJson(data);

	routeLayers[route_code] = geoJsonRouteLayer;

	geoJsonRouteLayer.addTo(map);
	alert('Route loaded and rendered');
}

function renderBuses(data, textStatus, jqXHR) {

}


