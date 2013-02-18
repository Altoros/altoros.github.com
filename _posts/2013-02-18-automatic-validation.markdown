---
layout: post
title: Automatic validation
description: Validate common database constraints
author:
  name: Yury Kaliada
  link: https://github.com/FUT
---

Every time you develop new application you one simple problem: lack of validation.

The reason may be different. May be specification is not fully determined or the feature will be enhanced/changed/refactored later. But nothing will save you from bugs like:

> "I've just posted 'War and Peace' in the blog - status 500 detected!"

Anyway the problem should be solved but in more graceful way than

{% highlight ruby %}
validates :body, length: { maximum: 255 }
{% endhighlight %}

Here `valle` comes in. [The gem](https://github.com/kaize/valle) enables you to validate all major restrictions without touching your code.

Integer, string, text and primary key columns will be validated. Instead of full validation for any model a set of models to validate might be specified. Finally `valle` might be temporarily disabled for debug reasons.

Such simple tool will make your life easier.
