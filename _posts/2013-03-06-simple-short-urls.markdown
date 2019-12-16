---
layout: post
title: Simple short urls
description: Making simply short urls
equiv: refresh
caconicalUrl: https://www.altoros.com/blog/simple-short-urls/
redirectUrl: 0; url=https://www.altoros.com/blog/simple-short-urls/
author:
  name: Nikolai Sharangovich
  link: https://github.com/Sharangovich
---

Making simply short urls

<!-- full start -->

I want to share with you an idea, how to reinvent the wheel, if you need short url, but you can't use side solutions (like goo.gl, etc) and has own short domain. You can do something like that - make own url shorter.
First we need to create a model with destination path and params fields and appropriate controller. After that, we can route 
{% highlight ruby %}
get '/:id' => 'short_url#show'
{% endhighlight %}
And make a redirect to needed path with saved params. But if you need to create a very short, for Tweet for example, the digitally ':id' can eat too much symbols in result url. To make it shorter we can convert ':id' number to a string(what, actualy, url shorters do). I have resolved this issue with a help of [Base64][0] standart. In our case it's just array with able characters to use, and their id's(codes). To convert ':id' number to short string, first we convert it into url safe Base64. This is a code of example ShortUrl model:

{% highlight ruby %}
class ShortUrl < ActiveRecord::Base

  SYMBOLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
  DEFAULT_URL = ["http://", APP_CONFIG['host'], (APP_CONFIG['port'].present? ? ":#{APP_CONFIG['port']}" : '')].join

  serialize :params

  def self.find_by_code string
    find decode(string)
  end

  def self.generate path, params
    short_url_record = create do |t|
      t.path = path
      t.params = params
      t.save
    end
    if short_url_record.id
      [DEFAULT_URL, '/', encode(short_url_record.id)].join
    else
      nil
    end
  end

  def full_path
    [DEFAULT_URL, path].join
  end

  private

  def self.encode number
    base = SYMBOLS.length
    res = []
    begin
      code = number % base
      number /= base
      res << SYMBOLS[code]
    end until number == 0
    res << 's'
    res.reverse.join
  end

  def self.decode string
    begin
      string = string.match(/\A[s](.{1,5})\z/)[1]
      i = string.length - 1
      res = 0
      string.each_char do |c|
        res += (SYMBOLS.index(c) * (SYMBOLS.length ** i))
        i -= 1
      end
      res
    rescue
      nil
    end
  end

end
{% endhighlight %}

If you want to leave both route variants (digitally & string id), you can put the prefix before encoded string (in this case it's a char 's'), and use RegExp constraints in route:
{% highlight ruby %}
get '/:id' => 'short_url#show', constraints: { id: /[s].{1,5}/ }
{% endhighlight %}
number of chars is limited to 5, because with a five chars you can encode really big number (1073741823), which can never be used.
There are some examples of encoding:
{% highlight ruby %}
pry(main)> ShortUrl.encode 12345
=> "sDA5"
pry(main)> ShortUrl.encode 1000000
=> "sD0JA"

pry(main)> ShortUrl.encode 1056698302
=> "s-----"

pry(main)> ShortUrl.encode 1827200481836
=> "altoros"
{% endhighlight %}

And, of course, decode
{% highlight ruby %}
pry(main)> ShortUrl.decode "sFFFFF"
=> 85217605
{% endhighlight %}

So, you can generate short urls:
{% highlight ruby %}
ShortUrl.generate(edit_user_path(@screener), reply_to: reply_to)
{% endhighlight %}
the result should be something like this: 
{% highlight ruby %}
=> "http://ru.by/sKa"
{% endhighlight %}

<!-- full end -->

[0]: http://en.wikipedia.org/wiki/Base64
