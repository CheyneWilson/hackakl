from django.shortcuts import render
from django.db.models import Q
from django.contrib.auth.models import User

from rest_framework.status import HTTP_400_BAD_REQUEST, \
    HTTP_200_OK, HTTP_500_INTERNAL_SERVER_ERROR
from rest_framework.permissions import AllowAny  # , IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

import json
import geojson

import requests

# from djgeojson.serializers import Serializer as GeoJSONSerializer

from hackakl.dummydata import DUMMY_ROUTE_DATA
from hackakl.models import Favourite
from hackakl.serializers import FavouriteModelSerializer


# Create your views here.

AT_API_KEY = '242e03b2-9f69-4053-acfa-68059fd1797b'
BASE_URL = 'https://api.at.govt.nz/v1/gtfs/'


class ErrResponses(object):
    USER_DOES_NOT_EXIST = {"error": "User does not exist"}
    INVALID_JSON_DATA = {"error": "Posted data is not valid JSON."}
    ERROR_CALLING_TRIP_API = {"error": "Error calling trip API."}
    ERROR_CALLING_SHAPE_API = {"error": "Error calling shape API."}
    NO_ROUTE_DATA = {"error": "No route data for route."}
    MULTIPLE_ROUTE_DATA = {"error": "Multiple route maps for route"}
    AT_STOP_SERVICE_NOT_WORKING = {"error": "Problem calling stop service"}


def index(request, route_code=None, stop_code=None):
    """
    Displays the index page

    If stop_code is specified, returns the data for the routes that go through that stop.
    If route_code is specified then returns a default route to display.

    """

    # if stop_code is not None:
    #     # Retrive the stop data

    # elif route_code is not None:
    #     pass

    return render(request, 'hackakl/index.html')


def favourite(request):
    return render(request, 'hackakl/favourites.html')


def _fav_list(username):
    """
    A helper function that returns the favourite list for a user
    """
    fav_list = Favourite.objects.filter(Q(user__username=username))
    serializer = FavouriteModelSerializer(fav_list, many=True)
    return Response(serializer.data)


class ListRoutesForStop(APIView):

    def get(self, request, stop_id):
        """
        Returns a list of all the route codes that run though a bus stop.

        This is a transparent call throught to AT's interface. It prevents us needing to use JSONP and allows for
        caching. This could be moved to a front end sever like nginx or apache. Actually, scratch that, the stop
        data contains duplicates, see the implementation for more details. A bug shold be raised.

        stop_id -- Four letter stop id, e.g "0002"
        """

        stop_url = BASE_URL + 'routes/stopid/' + stop_id + '?api_key=' + AT_API_KEY
        r = requests.get(stop_url)

        if r.status_code == HTTP_200_OK:
            resp = r.json()
            stop_data = resp["response"]

            # FIXME: The stop data contains duplicates! Which is gross. CW to follow up
            seen = set()
            unique_routes = []
            for d in stop_data:
                t = tuple(d.items())
                if t not in seen:
                    seen.add(t)
                    unique_routes.append(d)

            return Response(unique_routes)
        else:
            return Response(ErrResponses.AT_STOP_SERVICE_NOT_WORKING, HTTP_500_INTERNAL_SERVER_ERROR)


class ListFavourites(APIView):
    """
    Provides methods for accessing and setting a users favourite routes
    """
    permission_classes = (AllowAny,)

    def get(self, request, username):
        """
        Lists a users favourite routes
        """

        return _fav_list(username)


class EditFavourites(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, username, route_code):
        """
        Adds or renames a users' favourite route

        Additional options can be posted as an object

        custom_name -- The name to call this route
        reset       -- Clear the custom name
        priority    -- Affects the ording of this in a list (not implemented)

        """
        if len(request.body) > 0:
            try:
                data = json.loads(request.body)
                custom_name = data.get("custom_name", "")
                reset = data.get("reset", False)
                priority = data.get("priority", None)
                if reset is True:
                    custom_name = ""

            except ValueError:
                # Invalid JSON, this is a client error
                return Response(ErrResponses.INVALID_JSON_DATA, status=HTTP_400_BAD_REQUEST)
        else:
            # Not all requests post data
            custom_name = ""
            priority = None

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(ErrResponses.USER_DOES_NOT_EXIST, status=HTTP_400_BAD_REQUEST)

        fav, created = Favourite.objects.get_or_create(user=user, route_code=route_code)
        fav.custom_name = custom_name
        fav.priority = priority
        fav.save()

        # TODO: We could add more details gathered from calling the backend API?
        # knowing this isn't enough, lookup the api for more details

        return _fav_list(username)

    def delete(self, request, username, route_code):
        """
        Delete a users' favourite route

        Note - this is throwing a template error in swagger ...
        """
        try:
            fav = Favourite.objects.filter(Q(user__username=username)).get(route_code=route_code)
        except Favourite.DoesNotExist:
            pass  # nothing to do
        else:
            fav.delete()

        return _fav_list(username)


class Route(APIView):
    """
    Returns a geodata for a route
    """

    def get(self, request, route_code):
        """
        Returns the geodata for a route

        url_path = 'trips/routeid/'
        url = BASE_URL + url_path + route_code + '?api_key=' + AT_API_KEY

        request = requests.get(url)
        if request.status_code == HTTP_200_OK:
            route_data = request.json()
        else:
            raise Http404

        return Response(GeoJSONSerializer().serialize(route_data.objects.all(), use_natural_keys=True)

        e.g 2741ML4710
        """
        route_code = '2741ML4710'
        trip_url = BASE_URL + 'trips/routeid/' + route_code + '?api_key=' + AT_API_KEY
        r = requests.get(trip_url)

        if r.status_code == HTTP_200_OK:
            at_data = r.json()
            trips = at_data["response"]

            shape_ids = set([])
            for t in trips:
                shape_ids.add(t["shape_id"])

            if len(shape_ids) == 1:
                shape_id = shape_ids.pop()
                shape_url = BASE_URL + 'shapes/shapeId/' + shape_id + '?api_key=' + AT_API_KEY
                r = requests.get(shape_url)
                if r.status_code == HTTP_200_OK:
                    route_data = json.loads(r.content)
                    raw_shape = route_data["response"]

                    geo_data_string = geojson.dumps(raw_shape)

                    # FIXEME: HACK - this is silly restructing it so many times...
                    geo_data = json.loads(geo_data_string)

                    return Response(geo_data)
                else:
                    return Response(ErrResponses.ERROR_CALLING_SHAPE_API, HTTP_500_INTERNAL_SERVER_ERROR)

            elif len(shape_ids) == 0:
                return Response(ErrResponses.NO_ROUTE_DATA, HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                return Response(ErrResponses.MULTIPLE_ROUTE_DATA, HTTP_500_INTERNAL_SERVER_ERROR)

        else:
            return Response(ErrResponses.ERROR_CALLING_TRIP_API, HTTP_500_INTERNAL_SERVER_ERROR)


class DummyRoute(APIView):
    """
    A mock used for testing. Returns the dummy data in the format expected by the front end.
    """
    def get(self, request, route_code):
        """
        Returns a LineString for a route
        """

        return Response(DUMMY_ROUTE_DATA)


class DummyRtBuses(APIView):
    """
    A mock used for testing. Returns the dummy data in the format expected by the front end.
    """
    def get(self, request, route_code):
        """
        Returns the coordinates of all buses on a route
        """
        content = [
            #TODO: What about direction?
            {
                "type": "Point",
                "coordinates": [174.763332, -36.848460]
            },
            {
                "type": "Point",
                "coordinates": [174.763032, -36.848860]
            },
        ]

        return Response(content)
