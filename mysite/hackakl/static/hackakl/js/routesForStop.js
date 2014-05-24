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
        $("#stopName").append(stopId);
        $("#stoplistWrapper").show(); // Show the list - ignore the hard coding plz
    }

    // From the url, extract the stop number and pass to rest call
    var loc = location.pathname;
    var stopMatches = loc.match(/stop\/([0-9]+)/)
    if (stopMatches != null){
        var stopId = stopMatches[1];
        var url = '/stopdata/' + stopId;
        $.ajax({
            dataType: "json",
            url: url,
            success: updateStopList
        });
    }
})(jQuery, "#stoplist", "#routeTemplate");
