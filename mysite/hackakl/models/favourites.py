from django.db import models
from django.contrib.auth.models import User


class Favourite(models.Model):
    class Meta:
        app_label = 'hackakl'
        unique_together = ('user', 'route_id',)

    user = models.ForeignKey(User)
    route_id = models.CharField(max_length=30)
    route_long_name = models.CharField(max_length=100)
    route_short_name = models.CharField(max_length=10)
    custom_name = models.CharField(max_length=30)
    priority = models.IntegerField(null=True)

    def __unicode__(self):
        if self.custom_name is None:
            return str(self.route_name)
        else:
            return str(self.custom_name)
