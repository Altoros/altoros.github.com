---
layout: post
title: News from Twitter
description: Warning about changes on Twitter API
author:
  name: Nikolai Sharangovich
  link: https://github.com/Sharangovich
---

Warning about changes on Twitter API. And small bicycle for the popular short url's.

<!-- full start -->

## Warning

If one of your projects uses Twitter API, you should put your attention to news about authorization and API changes. For now Twitter uses OAuth 1.0 & OAuth 1.0 Reviosion A authorization protocols, but since march 5th support of first one was canceled. Main difference between protocols — in new version user authorithation is required. So if you use some features without user authorization, like a search, after cancelling of OAuth 1.0 you will lose this posibility. 
Also, important changes can be found on new API 1.1. One of them — new tweets search pagination. They changed cardinally. Used 'tweets count' and 'last tweet id' instead of page number.

> It's time to verify that everything up to date and works correctly!


## Bonus

Also, i can share with you some bicycle. If you need to use short links, but you can't use side solution and has own short domain, you can do something like that. Make own url shorter.
First we need to create a model with destination path and params fields and appropriate controller. After that, we can route 
{% highlight ruby %}
get '/:id' => 'short_url#show'
{% endhighlight %}
And make a redirect to needed path with saved params. But if you need to create a very short, for Tweet for example, the digitally ':id' can eat too much symbols in result url. To make it shorter we can convert ':id' number to a string(what, actualy, url shorters do). I have resolved this issue with a help of Base64 standart. In our case it's just array with able characters to use, and their id's(codes). To convert ':id' number to short string, first we convert it into url safe Base64. This is a code of example ShortUrl model:

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

So, you can generate short url's:
{% highlight ruby %}
ShortUrl.generate(edit_user_path(@screener), reply_to: reply_to)
{% endhighlight %}
the result should be something like this: 
{% highlight ruby %}
=> "http://ru.by/sKa"
{% endhighlight %}

<!-- full end -->

[0]: https://dev.twitter.com/docs/api/1.1/overview
[1]: http://en.wikipedia.org/wiki/Base64
