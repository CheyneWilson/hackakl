$("#route-number").val("TEST");

var map = L.map('map').setView([39.74739, -105], 13);

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
}).addTo(map);

routes = {};

function loadRoute() {
	var routeNum = $("#route-number").val();

	// expect a feature of type LineString that describes a route

	var routeURL = "/dummyroute/"+routeNum;

	$.ajax({
	  dataType: "json",
	  //url: "/static/hackakl/data/bus-route.json",
	  url : routeURL,
	  data: null,
	  success: displayGeoJson
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
	routes['test'] = L.geoJson(data, {
		pointToLayer: function (feature, latlng) {
			return L.marker(latlng);
		}
	}).addTo(map);
}

function renderBuses(data, textStatus, jqXHR) {

}


