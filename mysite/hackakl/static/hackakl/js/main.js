/*
 * Returns a list of routes for a given stop and attaches it formated as described in templateName
 * Attaches the response to target
 */
(function($, target, templateName, wrapper){
    String.prototype.format = function() {
    var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };

    var map;
    var stopId;  // Cheeky use of semi-global

    var busUpdateRate = 30000;
    
    var routes = {};
    var activeRoutes = {};

    var busRoutes = {};
    var busLayers = {};

    var busReloadTimer = undefined;
    var layerControls = undefined;

    var toggleRoute = function(route_code){

    	if(activeRoutes[route_code]){
    		closeRoute(route_code);
    	} else {
    		openRoute(route_code);
    	}
    }

    var refreshBuses = function(){
    	for(var br in busRoutes){
    		if(busRoutes[br]){
    			loadBusesForRoute(br);
    		}
    	}
    }

    var updateStopList = function(data){
        var template = $(templateName).html();
        for (i = 0; i < data.length; i++){
            // Create a list items, this would be so much easier in angular ..
            var link = data[i].route_id;  // TOOD: Change this to whatever is needed
            var displayName = data[i].route_long_name;
            var item = template.format(link, displayName);
            $(target).append(item);
        };
        $('.checkbox').checkbox();  // Redraw pretty check boxes
        $("#stopName").empty().append(stopId);
        bindFavouriteStopButtons();
        bindShowRoute();
        $("#stoplistWrapper").show(); // Show the list - ignore the hard coding plz
    }

    var bindFavouriteStopButtons = function(){
       $(".myFavourite").on('change', function(){
            if( $(this).is(':checked') ) {
                var routeCode = $(this).data('routecode');
                addFavourite(routeCode);
            } else {
                var routeCode = $(this).data('routecode');
                deleteFavourite(routeCode);
            }
        });
    }

    var addFavourite = function(routeCode){
        var username = 'admin';  // Hardcoded until we have signup
        var url = '/user/' + username + '/favourite/' + routeCode;
            $.ajax({
                dataType: "json",
                type: "POST",
                url: url,
                success: refreshFavourites
            });
    }

    var deleteFavourite = function(routeCode){
        var username = 'admin';  // Hardcoded until we have signup
        var url = '/user/' + username + '/favourite/' + routeCode;
            $.ajax({
                dataType: "json",
                type: "DELETE",
                url: url,
                success: refreshFavourites
            });
    }

    var refreshFavourites = function(){
        var username = 'admin';
        var url = '/user/' + username + '/favourite/';
        $.ajax({
            dataType: "json",
            type: "get",
            url: url,
            success: updateFavourites
        });
    }

    var bindShowRoute = function(){
        $(".showRoute").on('change', function(){
            if( $(this).is(':checked') ) {
                var routeCode = $(this).data('routecode');
                console.log("displaying route " + routeCode)
                loadRoute(routeCode);
                loadBusesForRoute(routeCode);
                startTimerForRoute();
            } else {
                var route_code = $(this).data('routecode');
                closeRoute(route_code);
            }
        })
    }

    var updateFavourites = function(data){
        var templateName = "#favouriteTemplate";
        var target = "#favouriteList";
        var template = $(templateName).html();
        $(target).empty();
        for (i = 0; i < data.length; i++){
            // Create a list items, this would be so much easier in angular ..
            var link = data[i].route_id;  // TOOD: Change this to whatever is needed
            var displayName = data[i].route_long_name;
            var item = template.format(link, displayName);
            $(target).append(item);
        };
        $('.checkbox').checkbox();  // Redraw pretty check boxes
        bindShowRoute();
        bindFavouriteStopButtons();
    }

    var displayRoutesForCurrentStop = function(){
        // Dispaly the routes for the current stop (if exists)
        // From the url, extract the stop number and pass to rest call
        var loc = location.pathname;
        var stopMatches = loc.match(/stop\/([0-9]+)/)
        if (stopMatches != null){
            stopId = stopMatches[1];
            var url = '/stopdata/' + stopId;
            $.ajax({
                dataType: "json",
                url: url,
                success: updateStopList
            });
        }
    }

    // set up favourites
    var addFavourites = function(){
        createSidebarRouteElement("Work", "favourite");
        createSidebarRouteElement("Home", "favourite");
    }

    var findSidebarItem = function(route_code){
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

    var createSidebarRouteElement = function(route_code, classes){
        var li = $('<li>');
        var a = $('<a>');
        a.text(route_code);

        if(classes){
            li.addClass(classes);
        }

        a.data("route_code", route_code);

        $('#favouriteList').append(
            li.append(a));

        a.click(function(){
            var route_code = a.data("route_code");
            openRoute(route_code);
        });

        return li;
    };

    var cancelBusLoadTimer = function(){
        if(busReloadTimer){
            clearInterval(busReloadTimer);
        }
        busReloadTimer = undefined;
    };

    var loadRoute = function(route_code) {

        console.log("loadRoute: "+route_code);

        var routeURL = "/realroute/"+route_code;

        $.ajax({
          dataType: "json",
          url : routeURL,
          data: null,
          success: renderRoute
        });
    };

    var loadBusesForRouteCB = function(){
        refreshBuses();
    }

    var loadBusesForRoute = function(route_code){

        console.log("loadBusesForRoute: "+route_code);

        var busURL = "/livevehicles/"+route_code;

        $.ajax({
          dataType: "json",
          url: busURL,
          data: null,
          success: renderBuses
        });
    };

    var setActiveRoute = function(layer){
        activeRoute = layer;
        route_code = layer.route_code;
    };

    var renderRoute = function(data, textStatus, jqXHR ){
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

        geoLayer.route_code = route_code;

        routes[route_code] = geoLayer;
        activeRoutes[route_code] = geoLayer;
    };

    var onEachBus = function(feature, layer) {
        var popupContent = null;

        if (feature.properties && feature.properties.popupContent) {
            popupContent = feature.properties.popupContent;
            layer.bindPopup(popupContent);
        }
    };

    var renderBuses = function(data, textStatus, jqXHR) {

    	var route_code = data.properties.route_code;

        // replace existing bus layer if already exists.
        if(busLayers[route_code]){
            map.removeLayer(busLayers[route_code]);
            delete busLayers[route_code];
        }

        var iconSize = 45;
        var busIcon = L.icon({
            iconUrl: '/static/hackakl/images/bus.png',

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
        busLayers[route_code] = geoLayer;
        geoLayer.route_code = route_code;

        busLayers[route_code].addTo(map);
    };

    var closeRoute = function(route_code){
    	var si = findSidebarItem(route_code);

    	if(!!si){	
    		si.removeClass("active");
    	}

    	if(activeRoutes[route_code]){
    		map.removeLayer(activeRoutes[route_code]);
	    	delete activeRoutes[route_code];
	    }

	    if(busLayers[route_code]){
	    	map.removeLayer(busLayers[route_code]);
	    	delete busLayers[route_code];
	    }
    	busRoutes[route_code] = false;
    }

    var openRoute = function(route_code){

        if(!route_code){
            console.log("openRoute: invalid route code");
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

    var startTimerForRoute = function(){
	    busReloadTimer = setInterval(loadBusesForRouteCB, busUpdateRate);
	};

    var setupMap = function(){
        var center = [-36.848460 , 174.763332];

        map = L.map('map').setView(center, 13);

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
    }

    $("#route-number").val("Test");

    setupMap();
    refreshFavourites();
    displayRoutesForCurrentStop();

})(jQuery, "#stoplist", "#routeTemplate");

var searchForStop = function(){
    var stop_code = $("#stop-code").val();

    window.location = "/stop/"+stop_code;
};
