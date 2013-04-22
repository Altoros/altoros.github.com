---
layout: post
title: DigitalOcean – new amazing cloud VPS hosting
description: Why DigitalOcean so cute
author:
  name: Eugene Melnikov
  link: https://github.com/melnikaite
---
Hi guys.
Today I wanted to introduce new cheap hosting for your projects.
They started at 2011, but became popular just at the beginning of this year.
It's suitable for small and fast-growing projects or temporary demo instances.
And I'll try to explain why.

<!-- full start -->
## It starts in 1 minute.
Really.
I tried.
It's much more faster then ask admins to start new virtual machine, install OS, fight with firewalls and one more time get disappointed with lack of 80 ports.
They gave dedicated IP for your server, root access and you can do absolutely anything (except updating kernel because the use KVM virtualization).

## It's cheap.
It's cheaper than AWS, Linode and RackSpace analogs.
Just look at comparison (https://www.digitalocean.com/price-comparison-chart).
Moreover it starts prices from 5$/month and bill hourly.
So you can run demo server just for 1 hour demo and pay 0.007$.
If you want daily backups it will cost you 1$/month (20% of server price).
But remember that you pay even for switched of machine.
You should make snapshot (0.02$ per GB) and remove server if you want stop charging and save machine.

## It's fast.
DigitalOcean uses SSD hard drives and you can see impact [here](http://jasonormand.com/2013/02/08/linode-vs-digitalocean-performance-benchmarks/).
And fast [network](http://198.211.116.146/100mb.test).
Currently they have run almost 150 000 cloud servers.

## Easy to use.
There is very simple and clear control panel.
You can manage servers, DNS records, SSH keys, snapshots, backups, open support ticket, check you balance and recharge account via credit card or paypal.
Also you can use simple API that provides almost the same functionality as control panel, happily to RightScale.

## Excellent community.
You can find on official site a lot of tutorials for beginners about initial configuring, balance loading and etc., forum this big amount of resolved problems and even IRC chat.

## 99.99% uptime.
They promise 99.99% uptime around network, power and virtual server availability.
In case something happened they promise credit account according to amount of time that service was unavailable.
Of course the have [status page](http://www.digitaloceanstatus.com/).

## Customers.
[jsFiddle](https://www.digitalocean.com/blog_posts/jsfiddle-net-moves-to-digitalocean) and [railscasts.com](http://railscasts.com/announcements/7) already moved to DigitalOcean.
May be now is you turn?
<!-- full end -->
