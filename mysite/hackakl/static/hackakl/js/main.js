// set the search text for testing
$("#route-number").val("Test");

var center = [-36.848460 , 174.763332];

var map = L.map('map').setView(center, 13);

// OpenStreetMap tiles will be used if this is uncommented
// L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
//     maxZoom: 18,
// }).addTo(map);

// MapBox tiles will be used if this is uncommented.
var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>',
    id: "ajesler.iamkmeee"
});

map.addLayer(mapboxTiles);

busUpdateRate = 30000;

routes = {};
activeRoute = undefined;
busLayer = undefined;
busesActive = true;
busReloadTimer = undefined;
layerControls = undefined;

// set up favourites
function addFavourites(){
	createSidebarRouteElement("Work", "favourite");
	createSidebarRouteElement("Home", "favourite");
}
addFavourites();

function toggleBusLayer(){
	if(busesActive && busLayer){
		map.removeLayer(busLayer);
		$("#btnBusToggle").text("Turn Buses On");
	} else {
		if(busLayer){
			map.addLayer(busLayer)
		}
		$("#btnBusToggle").text("Turn Buses Off");
	}
	busesActive = !busesActive;
};

function searchForRoute(){
	var route_code = $("#route-number").val();

	openRoute(route_code);
};

function findSidebarItem(route_code){
	var si = undefined;

	$("#routelist").find('a').each(function(){
        // cache jquery var
        var crd = $(this).data("route_code");
        if(crd === route_code){
        	si = $(this).parent("li");
        	return false;
        }
    });

    return si;
};

function createSidebarRouteElement(route_code, classes){
	var li = $('<li>');
	var a = $('<a>');
	a.text(route_code);

	if(classes){
		li.addClass(classes);
	}

	a.data("route_code", route_code);

	$('#routelist').append(
	    li.append(a));    

	a.click(function(){
		var route_code = a.data("route_code");
		openRoute(route_code);
	});

	return li;
};

function cancelBusLoadTimer(){
	if(busReloadTimer){
		clearInterval(busReloadTimer);
	}
	busReloadTimer = undefined;
};

function loadRoute(route_code) {

	console.log("loadRoute: "+route_code);

	var routeURL = "/dummyroute/"+route_code;

	$.ajax({
	  dataType: "json",
	  url : routeURL,
	  data: null,
	  success: renderRoute
	});
};

function loadBusesForRouteCB(){
	if(activeRoute && activeRoute.route_code){
		loadBusesForRoute(activeRoute.route_code);
	}
}

function loadBusesForRoute(route_code){

	console.log("loadBusesForRoute: "+route_code);

	if(!busesActive){
		// dont load if not going to be shown
		console.log("loadBusesForRoute: not loading as busesActive is false");
		return;
	}

	var busURL = "/dummybuses/"+route_code;

	$.ajax({
	  dataType: "json",
	  url: busURL,
	  data: null,
	  success: renderBuses
	});
};

function setActiveRoute(layer){
	activeRoute = layer;
	route_code = layer.route_code;
};

function renderRoute(data, textStatus, jqXHR ){
	var route_code = data.properties.route_code;

	if(routes[route_code]){
		map.removeLayer(routes[route_code]);
		delete routes[route_code];
	}

	var routeStyle = {
	    "color": "#FF0000",
	    "weight": 10,
	    "opacity": 0.85
	};

	var geoLayer = L.geoJson(data, { style: routeStyle });
	geoLayer.addTo(map);

	// TODO Fix me when working with live data
	geoLayer.route_code = "Test";/*route_code;*/

	routes[route_code] = geoLayer;
	setActiveRoute(geoLayer);
};

function onEachBus(feature, layer) {
	var popupContent = null;

	if (feature.properties && feature.properties.popupContent) {
		popupContent = feature.properties.popupContent;
		layer.bindPopup(popupContent);
	}
};

function renderBuses(data, textStatus, jqXHR) {

	// replace existing bus layer if already exists.
	if(busLayer){
		map.removeLayer(busLayer);
		busLayer = undefined;
	}

	var iconSize = 45;
	var busIcon = L.icon({
	    iconUrl: 'static/hackakl/images/bus.png',

	    iconSize:     [iconSize, iconSize], // size of the icon
	    iconAnchor:   [iconSize, 21], // point of the icon which will correspond to marker's location
	    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
	});

	// display each bus with the bus icon
	var geoLayer = L.geoJson(data, { 
		pointToLayer: function (feature, latlng) {
			return L.marker(latlng, {icon: busIcon});
		},
		onEachFeature: onEachBus
 	});
	busLayer = geoLayer;

	if(busesActive){
		busLayer.addTo(map);
	}
};

function closeActiveRoute(){

	// close current route and remove from map
	if(activeRoute){
		map.removeLayer(activeRoute);
		activeRoute = undefined;
	}

	if(busLayer){
		map.removeLayer(busLayer);
	}

	// remove active from any active route
	$("#routelist").find('li').each(function(){
        // cache jquery var
        var current = $(this);
        current.removeClass("active");
    });

	cancelBusLoadTimer();
};

function openRoute(route_code){

	if(!route_code){
		console.log("openRoute: invalid route code");
		return;
	}

	closeActiveRoute();

	if(activeRoute && activeRoute.route_code === route_code){
		return;
	}


	// load route data if not already loaded
	if(!routes[route_code]){
		loadRoute(route_code);
	}

	// add route to sidebar if not already there.
	var si = findSidebarItem(route_code);
    if(!si){
    	si = createSidebarRouteElement(route_code);
    }

	// mark as active route
	if(si !== undefined){
    	si.addClass("active");
	}

	loadBusesForRoute(route_code);

	busReloadTimer = setInterval(loadBusesForRouteCB, busUpdateRate);
};


