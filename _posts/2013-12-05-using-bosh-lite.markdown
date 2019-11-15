---
layout: post
title: Using Bosh Lite
description: Notes on using Bosh Lite, tool for deploying Cloudfoundry and other releases locally.
equiv: refresh
caconicalUrl: https://www.altoros.com/blog/using-bosh-lite/
redirectUrl: 0; url=https://www.altoros.com/blog/using-bosh-lite/
author:
  name: Nastia Shaternik
  link: https://github.com/drone-loops
---

Hola.

Nowadays, such terms as “IaaS”, “PaaS” and “SaaS” are very popular.
One of them is [Cloud Foundry (CF)](http://cloudfoundry.com/), open source PaaS that can work on the different IaaS clouds like AWS, OpenStack, vSphere.
But you can play with it even on a local computer using [Bosh Lite (BL)](https://github.com/cloudfoundry/bosh-lite). In this article I'm going to introduce you how to deploy BL and CF on your local machine.

<!-- full start -->

**Contents:**

1. Setup environment for using BL

2. Boot the virtual machine

3. Upload the specific stemcell

4. Upload the CF release

5. Deploy CF

6. Some words on what to do with deployed CF

Don’t be afraid of the specific terms  - they will be clarified later.

Understanding how to deploy CF locally, you can do it on the real IaaS, such as OpenStack or AWS. Let’s go!

## 1. Setup environment for using BL

Since this article is about BL and CF, there are only the main steps how to prepare environment for BL:

* firstly, install Virtualbox: `sudo apt-get install virtualbox`
* [download](http://downloads.vagrantup.com/) and install Vagrant package
* install Ruby(using RVM) + RubyGems + Bundler
* clone BL repo: `git clone https://github.com/cloudfoundry/bosh-lite.git`
* enter the BL directory and run `bundle` command

## 2. Boot the virtual machine

Run `vagrant up` command out of BL directory - and, _voila_, you have a running instance. We need target its Director (login as admin/admin):
`bosh target 192.168.50.4`

Type `bosh status` to verify that everything is ok.

Add a set of route entries to your local route table to enable direct warden container access. Your sudo password may be required:
`scripts/add-route`

## 3. Upload the specific stemcell

A [stemcell](http://docs.cloudfoundry.com/docs/running/bosh/components/stemcell.html) is a VM template with an embedded BOSH Agent.
Upload and verify that it was uploaded:

`bosh upload stemcell http://bosh-jenkins-gems-warden.s3.amazonaws.com/stemcells/latest-bosh-stemcell-warden.tgz`

`bosh stemcells`

## 4. Upload the CF release

A [bosh release](http://docs.cloudfoundry.com/docs/running/bosh/reference/) currently has two distinct purposes. Final releases that can be uploaded to any bosh.
Clone CF release repo and upload the latest release:

`git clone https://github.com/cloudfoundry/cf-release.git`

`bosh upload release PATH/TO/CF-RELEASE/releases/LATEST.yml`

## 5. Deploy CF

Create CF [deployment manifest](https://github.com/cloudfoundry-attic/oss-docs/blob/master/bosh/documentation/bosh_deployments.md#bosh-deployment-manifest) - you can do it manually or using BL `make_manifest_spiff` script (see this [tutorial, step 1](https://github.com/cloudfoundry/bosh-lite#deploy-cloud-foundry) )

Set the deployment manifest:
`bosh deployment PATH/TO/MANIFEST.yml`

Run command to start deployment:
`bosh deploy`

## 6. Some words on what to do with deployed CF

So, after all you will have a running CF environment. You can target it using your DNS, login and upload an application.

To target a default DNS for BL:
`cf target http://api.10.244.0.34.xip.io`

To login with admin/admin:
`cf login admin`

Then, create the organization and space on your CF environment:

`cf create_org NAME`

`cf create_space NAME`

And, eventually, push your application:
`cf push`

More information can be found here:

* [CF CLI](http://docs.cloudfoundry.com/docs/using/managing-apps/cf/)
* [Bosh CLI](http://docs.cloudfoundry.com/docs/running/bosh/reference/bosh-cli.html)

<!-- full end -->
