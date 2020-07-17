---
layout: post
title: S3 Storage for your Rails application
description: How to quickly configure S3
caconicalUrl: https://www.altoros.com/blog/s3-storage-for-your-rails-application/
author:
  name: Nikolai Sharangovich
  link: https://github.com/Sharangovich
---

How to quickly configure your application to store assets and uploads on Amazon S3

<!-- full start -->

Because of the increasing applications penetration into clouds, you may face the issue of storing any data in a cloud storage. One of the most popular services in this area is [Amazon S3][2].

## Getting started with Amazon S3

First we need to include support of S3 in Amazon AWS account.

![Amazon S3 Home][0]

Create a bucket to your project, but remember that a name must be unique across all of Amazon S3.
Then you able to manage access permissions to your bucket in 'Properties' tab.

![Bucket permissions][1]

After this actions, we can went to our Rails 3 application and start to configure it to interact with S3. Most of Rails 3 gems, which supports cloud storage's uses a [Fog library][3].

## Configuring CarrierWave uploader

One of the popular uploaders, CarrierWave, has a description how to store uploads on S3. You can initialize storage type in Uploader class:

{% highlight ruby %}
class AvatarUploader < CarrierWave::Uploader::Base
  storage :fog
end
{% endhighlight %}

or in the initializer

{% highlight ruby %}
#config/initializers/carrier_wave.rb
CarrierWave.configure do |config|
  config.storage = :fog
end
{% endhighlight %}

But now we have a issue with development and test environments. We don’t need to use S3 in following environments…
I suggest to do a simple trick, put storage type into your config file and use initializer:

{% highlight ruby %}
#config/config.yaml
development: &development
  carrier_wave:
    storage: file

production:
  amazon:
    provider: AWS
    bucket: altoros-blog
    aws_access_key_id: \YOUR KEY\
    aws_secret_access_key: \YOUR SECRET\
  carrier_wave:
    storage: fog

test:
  <<: *development
{% endhighlight %}


{% highlight ruby %}
#config/initializers/carrier_wave.rb
CarrierWave.configure do |config|
  if (APP_CONFIG[:carrier_wave][:storage] == 'fog') && APP_CONFIG[:amazon]
	  config.fog_credentials = {
	    provider:              APP_CONFIG[:amazon][:provider],
	    aws_access_key_id:     APP_CONFIG[:amazon][:aws_access_key_id],
	    aws_secret_access_key: APP_CONFIG[:amazon][:aws_secret_access_key]

	    # :region                 => 'eu-west-1'
	    # :host                   => 's3.example.com'
	    # :endpoint               => 'https://s3.example.com:8080'
	  }
	  config.fog_directory  = APP_CONFIG[:amazon][:bucket]
	  config.fog_public     = false
	  config.storage        = :fog
  else
    config.storage        = :file
  end
end
{% endhighlight %}

## Configuring assets

Another usefull gem, which will help us to store assets on S3, is [Asset Sync][4].
To configure this gem we should tell him a path, where we want to store assets.

{% highlight ruby %}
#config/environments/production.rb
config.action_controller.asset_host = "//#{ APP_CONFIG[:amazon][:bucket] }.s3.amazonaws.com"
{% endhighlight %}

> The default matcher for compiling files includes application.js, application.css and all non-JS/CSS files (i.e., .coffee and .scss files are not automatically included as they compile to JS/CSS).

To include specific files you should put them to a precompile config:
{% highlight ruby %}
#config/environments/production.rb
config.assets.precompile += ['admin.js', 'admin.css', 'common.js', 'common.css']
{% endhighlight %}

To include all your asset files you should put to config following regexp:
{% highlight ruby %}
#config/environments/production.rb
config.assets.precompile << /(^[^_\/]|\/[^_])[^\/]*$/
{% endhighlight %}

Also, we should configure Asset Sync. We can generate a default config file by executing rake task:
{% highlight console %}
rails g asset_sync:install --provider=AWS
{% endhighlight %}

And then put Amazon config information in it:
{% highlight ruby %}
#config/initializers/asset_sync.rb
if defined?(AssetSync)
  AssetSync.configure do |config|
    config.fog_provider          = APP_CONFIG[:amazon][:provider]
    config.aws_access_key_id     = APP_CONFIG[:amazon][:aws_access_key_id]
    config.aws_secret_access_key = APP_CONFIG[:amazon][:aws_secret_access_key]
    config.fog_directory         = APP_CONFIG[:amazon][:bucket]
    # Increase upload performance by configuring your region
    # config.fog_region = 'eu-west-1'
    #
    # Don't delete files from the store
    # config.existing_remote_files = "keep"
    #
    # Automatically replace files with their equivalent gzip compressed version
    # config.gzip_compression = true
    #
    # Use the Rails generated 'manifest.yml' file to produce the list of files to
    # upload instead of searching the assets directory.
    # config.manifest = true
    #
    # Fail silently.  Useful for environments such as Heroku
    # config.fail_silently = true
  end
end
{% endhighlight %}

Also, in both gems we can see option ['region'][5]. <b>Highly recomended</b> to configure it correctly to increase upload performance.

Now, when we call `assets:precompile`, assets will be uploaded to a specified S3 bucket.

So, this should be enough to basicaly configure your app to work with Amazon Simple Storage Service.

<!-- full end -->

[0]: /images/posts/2013-03-22-s3-storage-for-your_app/bucket.png
[1]: /images/posts/2013-03-22-s3-storage-for-your_app/permissions.png
[2]: http://aws.amazon.com/s3/
[3]: http://fog.io/
[4]: https://github.com/rumblelabs/asset_sync
[5]: http://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region
