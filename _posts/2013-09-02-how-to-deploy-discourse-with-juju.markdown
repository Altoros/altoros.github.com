---
layout: post
title: How to deploy Discourse with Juju
description: This guide walks through process of deployment Discourse with Juju and Rack charm.
caconicalUrl: https://www.altoros.com/blog/how-to-deploy-discourse-with-juju/
redirectUrl: how-to-deploy-discourse-with-juju
author:
  name: Pavel Pachkovskij
  link: https://github.com/pavelpachkovskij
---

Discourse is the 100% open source, next-generation discussion platform built for the next decade of the Internet.

Juju is a service orchestration management tool developed by Canonical. This guide requires configured and successfully bootstrapped Juju environment. Please walk through [getting started with Juju](https://juju.ubuntu.com/docs/getting-started.html) guide if you are not familiar with Juju yet.

<!-- full start -->
# Configure Discourse

First you have to fork Discourse and prepare it for deployment with Juju

Add Redis config

**config/redis.yml**:

{% highlight yaml %}
<%= ENV['RAILS_ENV'] %>:
  uri: <%= uri = URI.parse(ENV['REDIS_URL']) %>
  host: <%= uri.host %>
  port: <%= uri.port %>
  password: <%= uri.password %>
{% endhighlight %}

Copy **config/environments/production.rb.sample** to **config/environments/production.rb**

{% highlight bash %}
cp config/environments/production.rb.sample config/environments/production.rb
{% endhighlight %}

Add new files to git:

{% highlight bash %}
git add --force config/environments/production.rb config/redis.yml
{% endhighlight %}

Update your repository:

{% highlight bash %}
git add .
git commit -m 'prepare to deploy with juju'
git push origin master
{% endhighlight %}

Now discourse is ready for the deployment with JuJu.

# Configure Juju

Create Rack charm config:

**discourse.yml**

{% highlight yaml %}
discourse:
  repo: <repo_url>
  env: SECRET_TOKEN=ssEnesNG3f3jAhgJgSlWDLUi0U3cUrUhrTBwwancUKL91hX7ClKAgKl0Ofpv
{% endhighlight %}

Important: Discourse requires SECRET_TOKEN to be defined for sessions storage.

More configuration and deployment options available on [Rack charm](http://manage.jujucharms.com/~pavel-pachkovskij/precise/rack) page.

# Deployment

Deploy Discourse with Rack charm:

{% highlight bash %}
juju deploy rack --config discourse.yml discourse
{% endhighlight %}

Deploy and relate Redis:

{% highlight bash %}
juju deploy redis-master
juju add-relation redis-master:redis-master discourse
{% endhighlight %}

Deploy and relate PostgreSQL

{% highlight bash %}
juju deploy postgresql
juju add-relation postgresql:db-admin discourse
{% endhighlight %}

Generally you should use **db** relation for postgresql but Discourse creates hstore extension in migrations that's why you have to use **db-admin** instead.

Finally expose the Discourse:

{% highlight bash %}
juju expose discourse
{% endhighlight %}

Use **juju status** or **juju debug-log** to watch for deployment progress.

When discourse is deployed create, migrate and seed database:

{% highlight bash %}
juju ssh discourse/0 run rake db:create
juju ssh discourse/0 run rake db:migrate
juju ssh discourse/0 run rake db:seed_fu
{% endhighlight %}

Compile assets:

{% highlight bash %}
juju ssh discourse/0 run rake assets:precompile
{% endhighlight %}

Restart Discourse:

{% highlight bash %}
juju ssh discourse/0 sudo restart rack
{% endhighlight %}

Navigate to discourse and create your account. When you are done promote your account to admin in the Rails console:

{% highlight bash %}
juju ssh discourse/0 run rails c
{% endhighlight %}

{% highlight ruby %}
me = User.find_by_username_or_email('myemailaddress@me.com')
me.activate
me.admin = true
me.save
{% endhighlight %}

Now you can configure discourse from **/admin** console. More info on the [The Discourse Admin Quick Start Guide](https://github.com/discourse/discourse/wiki/The-Discourse-Admin-Quick-Start-Guide) page.

<!-- full end -->