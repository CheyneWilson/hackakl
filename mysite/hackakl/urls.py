from django.conf.urls import patterns, include, url
from hackakl import views


urlpatterns = patterns(
    '',
    # Examples:
    # url(r'^$', 'mysite.views.home', name='home'),

    # Wire up our API using automatic URL routing.
    # Additionally, we include login URLs for the browseable API.
    url(r'^$', views.index, name='index'),
    # url(r'^login/$', views.LoginLogout.as_view()),

    # url(r'^register/$', views.RegisterUser.as_view()),

    url(r'^docs/', include('rest_framework_swagger.urls')),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')),

    url(r'^realroute/(?P<route_code>[0-9a-zA-Z_]+)$', views.Route.as_view()),

    url(r'^user/(?P<username>[0-9a-zA-Z_]+)/favourite/$', views.ListFavourites.as_view()),
    url(r'^user/(?P<username>[0-9a-zA-Z_]+)/favourite/(?P<route_code>[0-9a-zA-Z_]+)$', views.EditFavourites.as_view()),

    url(r'^dummyroute/(?P<route_code>[0-9a-zA-Z_]+)$', views.DummyRoute.as_view()),
    url(r'^dummybuses/(?P<route_code>[0-9a-zA-Z_]+)$', views.DummyRtBuses.as_view()),

)
