---
layout: post
title: Two (or three) powerful iterators
description: Two Ruby iterator methods I really love, thanks to its simplicity and beauty
caconicalUrl: https://www.altoros.com/blog/two-or-three-powerful-iterators/
redirect_to:
  - https://www.altoros.com/blog/two-or-three-powerful-iterators/
author:
  name: Emiliano Coppo
  link: https://github.com/bismark64
---

If you have some experience working with Ruby you probably had to deal with collections.
Collections can be tedious. But TTR (Thanks To Ruby) we have a large arsenal to deal with them!

In this post I'll show you two Ruby iterator methods I really love, thanks to its simplicity and beauty.

<!-- full start -->

My whimsical example
--------------------

Recently I had to make an small JSON parser of the Flickr public feed, so I'll use some methods of that module as examples for our post.
Basically, the module had to fetch a JSON object returned by the Flickr API and parse it to a Ruby JSON object checking some validations.
This kind of functionality doesn't take more than a dozen of Ruby lines, but it's a good example to achieve our goal.

We'll focus on two methods of the module:

- json_items: returns an array of hashes. Each hash represents a feed item from the Flickr API.
- check(item): checks if the given item hash satisfies some validations.

We'll also skip all the url encoding and some validation stuff to focus on the iterative methods.

First, lets take a look to the check method. The goal of this method is to loop inside a item (a hash) and update it on the fly.
A valid approach could look like this:

    def check(item)
      new_item = {}
      item.each do |key, value|
        new_item[key] = value.empty? ? "No data" : value
      end
      new_item
    end

This code certainly works, but also it also have some design issues like a temp (and unnecessary) hash.

As Ruby developers we should to take care of the Ruby API in this cases.
The bellow code can be good as a start point, but it does not take long to realize that it smells..
So if we look at the Hash doc we can find an alternative (and prettier) solution with the [update](http://www.ruby-doc.org/core-2.0/Hash.html#method-i-update) method:

    def check(item)
      item.update(item) do |key, value|
        value.empty? ? "No data" : value
      end
    end

Here we're using the update method of Hash, which is used when you want to update the content of a hash based on another.
In this case we only have one hash, so we apply the update method to itself.
So using the update method we prevented creating an unnecessary hash and we got our code more readable and clearer.


It's time of the json_items method, as we previously said, this method should return an array of hashes, which must to be checked with our check method.

A possible code could be this:

    def json_items
      new_items = []
      json = get_some_json_data
      json.each do |item|
        new_items << check(item)
      end
      new_items
    end

I really hate this repetitive code snippet, it's very common when you want to create an array based in another:

    def method_name
      temp_array = []
      original_array.each do |item|
        temp_array << some_stuff_with(item)
      end
      temp_array
    end

TTR we have an awesome method for Array objects when we must to deal with this kind of snippets: [inject](http://apidock.com/ruby/Enumerable/inject).
This awesome method allows us to make 'magical' things.. :) for example:

If we want to know the average word length of a document, or string, we can do:

    def average_word_length
      total = 0.0
      words.each{ |word| total += word.size }
      total / word_count
    end

This can be done more concisely with inject:

    def average_word_length
      total = words.inject(0.0){ |result, word| word.size + result}
      total / word_count
    end

As its name suggest inject "injects" an initial object (0.0 in the above example) and uses it as the initial value of the "memo" (result in the code), then iterates the given block like the each method does.
Inject is very flexible, if you do not explicitly specify an initial value in the inject, then the first element of collection is used as the initial value.

    def sum
      (1..10).inject{ |sum, n| sum + n }  #returns 55 (= 1+2+...+10)
    end

You can also use inject with hashes. When running inject on a Hash, the hash is first converted to an array before being passed through.

Applying it to our json_items method we get:

    def json_items
      json = JSON.parse(get_json)["items"]
      items = json.inject([]) do |items, item|
        items << check(item)
      end
    end

So with inject we have saved to instantiate a temp var, what allowed us to build a new array on the fly and have a more concise and readable code.

Inject inherently proyects a set of collection values to an unique value. In other words is such as a many-to-one function. For that reason inject has an well-known alias: reduce. In maths and other programming languagues has also other names like fold,  accumulate, aggregate, compress. This kind of functions analyzes a recursive data structure and recombine through use of a given combining operation the results of recursively processing its constituent parts, building up a return value.


Therefore the json_items example is not the best example to use inject, because we're trying to achieve a one-to-one conversion.
In this cases we should use other methods such as map or collect that fit better with what we're trying to do.

    def json_items
      json = JSON.parse(get_json)["items"]
      json.map{ |item| check(item) }
    end

Ruby provides us awesome methods, we should use them wisely and following the Ruby philosophy. So I encourage you to use this methods to make clearer and beautiful ruby apps!

Docs:

Hash Update: http://apidock.com/ruby/Hash/update, http://www.ruby-doc.org/core-2.0/Hash.html#method-i-update

Enumerable Inject: http://apidock.com/ruby/Enumerable/inject

Thanks to [@avsej](https://github.com/avsej) and [@wacko](https://github.com/wacko) for your suggestions and tips..

<!-- full end -->
