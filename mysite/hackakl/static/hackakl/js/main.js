var map = L.map('map').setView([39.74739, -105], 13);

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
}).addTo(map);

function searchRoute() {
	var routeNum = $("#route-number").val();

	$.ajax({
	  dataType: "json",
	  url: "/static/hackakl/data/bus-locations.json",
	  data: null,
	  success: displayGeoJson
	});
};

function displayGeoJson(data, textStatus, jqXHR ){
	var layer = L.geoJson(data, {
		pointToLayer: function (feature, latlng) {
			return L.marker(latlng);
		}
	}).addTo(map);
}