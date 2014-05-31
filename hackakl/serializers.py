from rest_framework import serializers
from hackakl.models import Favourite


class FavouriteModelSerializer(serializers.ModelSerializer):

    class Meta:
        model = Favourite
