---
layout: post
title: Organizing storage in multiple fog containers using Carrierwave 
description: Carrierwave gem and it's inner workings, organizing switching content between private and public containers  
author:
  name: Dmitry Savitski
  link: https://github.com/MrDominusNox
---

Carrierwave is one of the most popular Ruby-and-Rails solutions for file upload and storage. Most of us used it more than once. But today I want to dig into how flexible it really is. First, we will look a little deeper into how it works on a lower levels (feel free to skip that part if you know stuff), and then watch how you can take advantage of it's flexibility on a couple of simple abstract use-cases.

<!-- full start -->

# How it works? (the skippable part)

First of all, Carrierwave has a number of modules extending your ORM classes. The gem itself includes the extension only for ActiveRecord, but all else are readily available. All it does is, it creates a class method `mount_uploader`, that receives any string param of an ORM model.

{% highlight ruby %}
# == Schema Information
#
# Table name: items
#
#  id         :integer          not null, primary key
#  file       :string(255)

class Item < ActiveRecord::Base
  mount_uploader :file
end
{% endhighlight %}

Every time you instantiate an object of class `Item`, your ORM downloads the data from your DB and instantiates an object as usual. But there is now an object of class Uploader::Base, mounted where just a string param should've been. Methods `file` and `file=` don't access data in @file variable directly now, there is now a middle-man. 

The setter method `file=` of a new object now proceeds through these steps: 

1. It accepts an object of any class extending File. Including various types of streams, Tempfile and ActionDispatch::Http::UploadedFile, which is an object you receive from Http multipart file uploads.
2. Caches the received file in a temporary directory locally.
3. Assigns a file's name to our @file variable. Unlike some other `upload and store` gems, Carrierwave doesn't save the full file path to the DB, only it's original name. The responsibility of building the full path is delegated to the Uploader object.
4. Waits for an object to be persisted.
5. Optionally conducts processing of a file, resulting in a one or more new files.
6. Copies the file or resulting processed files from a temp storage to the persistant storage. Again, exact location and specifics of that storage is determined by an Uploader object.

When you update an existing object, the process is generally the same, with addition of Uploader downloading previously uploaded version, caching it, and restoring if object persisting vailed.  

So, how exactly does an uploader choose where and how to store the uploaded file, how to retrieve it? Carrierwave::Uploader::Base has a large number of defined default methods, some of them grouped into Strategy modules, specifying each aspect of the process (names for cache/storage directories, specifics of processing, etc..). These methods also have  access to model objects the uploader is mounted on, which means that we can tweak the handling of each uploaded file.

 Of course, there is a `Carrierwave.configure` method, accepting a block of configurations, but it merely provides a default results for these uploader instance methods.

Carrierwave has two main storage strategies (`:file` for local storage and `:fog` for remote storage ). One can add other strategies as long as they support storing and retrieving, of course, but these two already cover most options. That said, the `fog` storage strategy is itself a delegation to gem [fog/fog][1], which provides a common API for multiple cloud storage solutions. To initialize a Carrierwave fog storage you provide a name of the service, the name of the container, and the credentials.

# How would we use that to our advantage? (the part the post is about)

## 1. Specifying upload directories
 Both default storage options rely on a number of uploader methods to detemine how to handle uploads. The main is the `store_dir` method, which by default looks like this:

{% highlight ruby %}
def store_dir
  "uploads/#{model.class.to_s.underscore}/#{mounted_as}/#{model.id}"
end
{% endhighlight %}

Uploaded files will be stored locally, in a number of nested folders in a public directory of the application, each file having it's own folder. 

* Generally, we try to normalize a DB in such a way, that one class has one file field maximum, so the `mounted_at` param could be left out. 
* On your development machine, you will probably run application on different environments (at least test), so consider adding `Rails.env` to `store_dir`. 
* Relying on a class name of the model can render data inconsistent if you refactor the model. File will still be there, but an Uploader will be unable to retrieve it since it will look in a wrong place. I prefer to implicitly set a folder name in each Uploader. 

Anyway, you now can see that by overwriting a `store_dir` method in your uploaders, you can store your uploads in any way you like, for example grouping files by their creator's identity, rather than by their type.

{% highlight ruby %}
class GeneralApplicationUploader < Carrierwave::Uploader::Base
  
  def store_dir
    folder = respond_to?(:folder_name) ? folder_name : model.class.to_s.underscore
    base_upload_dir << "#{folder}/#{model.id}"
  end

  private

  def base_upload_dir
    "uploads/#{Rails.env}/"
  end

end

class ItemUploader < GeneralApplicationUploader

  def folder_name
    'items'
  end

end
{% endhighlight %}

One thing you should always remember, though: once the file was uploaded, any change to how `store_dir` resolves will prevent the uploader from finding that file. 

## 2. Differences in handling local and cloud storages
Now, if you expect a lot of upload/download activity and you have an option of using a remote storage in production, you should definitely do that. Using a remote storage for development or test environments, on the other hand, can be troublesome (that is, too expensive) 

Ideally, strategies for handling `file` and `fog` storages should behave in the exact same way. And for the most cases they do. Deciding on whether you should develop the application using cloud storage all the time, or cut your expenses and develop using local storage, being prepared to deal with a few differences, is up to you.

If you, for example, have a number of text documents stored, and you want to show document's text on a page, there will be a difference. It will be there because the `fog` storage mostly handles file urls and passes them to client browser, not server.

There is a method you can use to check if you are using local or remote storage:
{% highlight ruby %}
class TextUploader < GeneralApplicationUploader 
  def store_local?
    _storage == CarrierWave::Storage::File
  end

  # Then the text file content can be accessed as:

  def body 
    store_local? ? File.read(path) : open(url).read
  end
end

class Item < ActiveRecord::Base
  mount_uploader :file, TextUploader
end
{% endhighlight %}

This way `Item.first.file.body` will return the same text regardless of whether the file is stored remotely or locally. 

## 3. Safe filenames
By default, Carrierwave already sanitizes the name of the file it receives, keeping only english letters and numbers. There is also a configuration option, that helps you to keep all unicode 
characters. It helps you to avoid [file path injection vulnerabilities][0], but storing the file with it's name unchanged still has some disadvantages. For example, one can upload a file with a name so long that saving it causes an exception on filesystem level. To avoid that, we rename all files that are saved to the system, encoding the old filenames.  

{% highlight ruby %}
  def full_filename(for_file)
    original_name = for_file || model.read_attribute(:mounted_as) 
    [Digest::MD5.hexdigest(original_name), File.extname(original_name)].join
  end
{% endhighlight %}

Above - `full_filename` method is used both on storing the file (where `for_file` is a filename of incoming upload), and on retrieving the file (when it is nil). The good part is that the name is stored to DB in it's original state, while on disk it is properly encoded.

Now, you can provide this file for download, with it retaining an original filename, using this link:
{% highlight ruby %}
= link_to 'Download', item.file.url, download: item[:file], target: '_blank' 
{% endhighlight %}

Cached files are also saved to disk, so we will probably have to encode their names too.
{% highlight ruby %}
  def cache_name
    if cache_id && original_filename
      name = Digest::MD5.hexdigest(full_original_filename + cache_id)
      extension = File.extname(full_original_filename) 
      [name, extension].join
    end
  end
{% endhighlight %}

## 4. Switching remote storage containers of the file
In some cloud file storages, for example on Rackspace, the file can be stored in two types of containers:

* Public : the file is readily available for download via http, sometimes even with CDN support. The content is delivered quickly, but you can't even dream of most security features, like hotlinking protection.
* Private : the file is available only via SSL secured temporary link, but the file is difficult to download other than with your application, CDN is unavailable.

Let's imagine that we need to store some type of files, but it is a user who decides whether it should be publicly available or hidden. Naturally, we will want the interface for this to be as simple as possible.

{% highlight ruby %}
# == Schema Information
#
# Table name: items
#
#  id         :integer          not null, primary key
#  file       :string(255) 
#  hidden     :boolean          not null, default(FALSE)   

class Item < ActiveRecord::Base
  mount_uploader :file, SwitchingUploader
end
{% endhighlight %}

<!-- full end -->

[0]: http://guides.rubyonrails.org/security.html#file-uploads
[1]: https://github.com/fog/fog
