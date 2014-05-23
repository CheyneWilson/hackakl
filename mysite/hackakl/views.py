from django.shortcuts import render
from django.db.models import Q
from django.contrib.auth.models import User
from rest_framework.status import HTTP_400_BAD_REQUEST  # , HTTP_401_UNAUTHORIZED, HTTP_500_INTERNAL_SERVER_ERROR
from rest_framework.permissions import AllowAny  # , IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
import json

from hackakl.models import Favourite
from hackakl.serializers import FavouriteModelSerializer
# Create your views here.


class ErrResponses(object):
    USER_DOES_NOT_EXIST = {"error": "User does not exist"}
    INVALID_JSON_DATA = {"error": "Posted data is not valid JSON."}


def index(request):
    return render(request, 'hackakl/index.html')


def get_fav_list(username):
    fav_list = Favourite.objects.filter(Q(user__username=username))
    serializer = FavouriteModelSerializer(fav_list, many=True)
    return Response(serializer.data)


class ListFavourites(APIView):
    """
    Provides methods for accessing and setting a users favourite routes
    """
    permission_classes = (AllowAny,)

    def get(self, request, username):
        """
        Lists a users favourite routes
        """

        return get_fav_list(username)


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

        return get_fav_list(username)

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

        return get_fav_list(username)
