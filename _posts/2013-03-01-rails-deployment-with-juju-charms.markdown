---
layout: post
title: Easy deployment of Rack applications with Juju
description: How to deploy Rack applications with Juju orchestration tool.
author:
  name: Pavel Pachkovskij
  link: https://github.com/pavelpachkovskij
---
[Juju](https://juju.ubuntu.com/) is a service orchestration management tool developed by Canonical.
With Juju it is easy to build entire environments on public clouds like Amazon Web Services and HP Cloud, and private clouds built on OpenStack, or raw bare metal via MAAS.

Juju uses [Charms](http://jujucharms.com/) to deploy and configure services. Charms are scripts that can be written in any language.
There are over 100 services ready to deploy.

With Rack Charm you can deploy your applications on EC2 in a literally few minutes. Let me give some examples.

<!-- full start -->
> All examples are tested for Ubuntu 12.04 Precise Pangolin

### Getting started

Install Juju

{% highlight console %}
sudo add-apt-repository ppa:juju/pkgs
sudo apt-get update && sudo apt-get install juju
{% endhighlight %}

Run the command-line utility with no arguments to create a sample environment:

{% highlight console %}
juju bootstrap
{% endhighlight %}

Configure your environment `~/.juju/environments.yaml`, here is EC2 example

> See how to run services on your local machine via LXC on [Configure a local environment](https://juju.ubuntu.com/docs/getting-started.html#configuring-a-local-environment) page.

{% highlight yaml %}
default: sample
  environments:
    sample:
      type: ec2
      access-key: YOUR-ACCESS-KEY-GOES-HERE
      secret-key: YOUR-SECRET-KEY-GOES-HERE
      control-bucket: juju-faefb490d69a41f0a3616a4808e0766b
      admin-secret: 81a1e7429e6847c4941fda7591246594
      default-series: precise
      juju-origin: ppa
      ssl-hostname-verification: true
{% endhighlight %}

Bootstrap the environment

{% highlight console %}
juju bootstrap
{% endhighlight %}

### Sinatra example with [Html2Haml](https://github.com/haml/html2haml) application

Deploy a web-server

{% highlight console %}
juju deploy nginx-passenger
{% endhighlight %}

Create a config file for Rack Charm, let's call it `html2haml.yml`

{% highlight yaml %}
html2haml:
  repo_url: https://github.com/twilson63/html2haml.git
  app_name: html2haml
{% endhighlight %}

Deploy Rack Charm with config you've created on the previous step

{% highlight console %}
juju deploy rack html2haml --config html2haml.yml
{% endhighlight %}

and relate it to the web-server

{% highlight console %}
juju add-relation html2haml nginx-passenger
{% endhighlight %}

Open the stack up to the outside world

{% highlight console %}
juju expose nginx-passenger
{% endhighlight %}

and find the nginx-passenger instance's public URL

{% highlight console %}
juju status
{% endhighlight %}

### Rails 3 example

> It's almost the same as Sinatra deployment, but additionally uses PostgreSQL database.

Create `sample_rails.yml` config file

{% highlight yaml %}
sample_rails:
  repo_url: https://github.com/pavelpachkovskij/sample-rails.git
  app_name: sample_rails
{% endhighlight %}

Deploy the application and web-server

{% highlight console %}
juju deploy rack sample_rails --config sample_rails.yml
juju deploy nginx-passenger
juju add-relation sample_rails nginx-passenger
{% endhighlight %}

deploy PostgreSQL and relate it to the application

{% highlight console %}
juju deploy postgresql
juju add-relation postgresql:db sample_rails
{% endhighlight %}

expose nginx-passenger and find it's public URL

{% highlight console %}
juju expose nginx-passenger
juju status
{% endhighlight %}

> You can find more of configuration examples and deployment options at [Rack Charm page](http://jujucharms.com/charms/precise/rack)

### Links
- [Juju documentation](https://juju.ubuntu.com/docs/)
- [Juju GUI](https://juju.ubuntu.com/resources/the-juju-gui/) - web interface that you can deploy right into your environment.
  It lets you model and design your entire stack via your web browser, including integration with the Charm Store.
- [Juju Charms Store](http://jujucharms.com/)
<!-- full end -->