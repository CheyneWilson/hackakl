

Local development setup
----

These instructions are based off the heroku instructions at https://devcenter.heroku.com/articles/getting-started-with-django.
They only include details for setting up a new site based off the source. If you want to start afresh, see the linked guide above.

Create a python 3 (3.3.2) virtual environment:

    virtualenv venv -p python3 --no-site-packages

Activate virtualenv:

    source venv/bin/activate

Install django-toolbelt, note that cacert.pem is from[curl.haxx.se/docs/caextract.html]

    sudo env ARCHFLAGS="-arch i386 -arch x86_64" pip install django-toolbelt --cert ~/certs/cacert.pem

Create a file named runtime.txt with the contents 'python-3.3.2'. This tells heroku what python version to use.

Commit all the changes and commit to git locally.


Publishing to Heroku
----

Run the following commands:

    heroku create

    git push heroku master
    
Configuring Heroku
----

Run the following commands:

    heroku ps:scale web=1

    heroku open

