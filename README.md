hackakl
=======

These are the instructions for how to get the project created for Hackakl 2014 up and running. Since the event the
source has been reorganised to be able to be deployed onto Heroku. Let's get started!

Local development setup
----

After checking out the code (via git ideally) create a new Python 3 (3.3.2) virtual environment:

    virtualenv venv -p python3 --no-site-packages

Activate the virtualenv:

    source venv/bin/activate

Install the the required packages. The following instructions were tested on MacOSX

    sudo env ARCHFLAGS="-arch i386 -arch x86_64"
    pip install -r requirments.txt --cert etc/cacert.pem

The ARCHFLAGS must be set because otherwise psycopg2 throws a wobly when trying to compile support for the old PPC.
The certs file has been downloaded from [curl.haxx.se/docs/caextract.html] and was used because pip wasn't using the
system certs. It the same certs by mozilla.org The previous step could be improved by properly packaging the project
and using setup.py to configure dev/prod environments.

Running the site locally

    python manage.py syncdb
    python manage.py runserver


Publishing to Heroku
----
These instructions are based off the heroku instructions at https://devcenter.heroku.com/articles/getting-started-with-django.
They only include details for setting up a new site based off the source. If you want to start afresh, see the linked guide above.

#TODO: These are incomplete. We need to make additional changes to secure the application...

Push the source to heroku

    git push heroku master

View the deployed application

    heroku open
