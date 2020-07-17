---
# vim:spell:
layout: post
title: CommonJS for Rails
description: How to structure your Rails' JS even more with sprockets-commonjs ruby gem
caconicalUrl: https://www.altoros.com/blog/commonjs-for-rails/
author:
  name: Evgeny Okhrimenko
  link: https://github.com/netoctone
---

This is a post for those, who feels that Sprockets is not enough to structure his JS in a Rails app.
If you're not satisfied with `#= require` and `window.Global` mess, come under the cut.

<!-- full start -->

## Alternatives

As you might suggest, JS community knows a lot about structuring large apps.
[Here's][0] a great overview on what they can offer. In two words, the main practical alternatives are
CommonJS and AMD.

Instead of considering pros and cons of each approach, we'll focus on CommonJS.
It's very simple and is a choise of Node.js by the way.

If you'd like to know other people's opinions, visit [AMD is better ...][1] and [AMD is not the answer][2].


## CommonJS via Alex MacCaw

Because CommonJS is simply a [specification][3], we have a bunch of different [implementations][4].
There is also a number of ruby-based solutions, but I'll promote a single one - [sprockets-commonjs][5].
Yep, it's based on [Sprockets][6], so don't forget to install it unless you are riding Rails >= 3.1.

The rest of this article is a quick start guide. It may be helpful, if you're not satisfied with the [original][7] one.

## the guide

Go to Gemfile and add

       gem 'sprockets-commonjs'

If you are not using Rails 3.1-3.x, you may also need

       gem 'sprockets-rails'

After that, you'll get an ability to create CommonJS modules instead of ordinary JS files.
To do that, simply prefix file extension with `module`. For example, `widget.js.coffee`
must become `widget.module.js.coffee`. Now you get two new keywords:

1. `require()` loads modules, necessary for the current one.
2. `module.exports` specifies, what should be returned, if some other module will require this one.

Let's assume we have our `widget.module.js.coffee` file inside of `app/assets/javascripts/modules/`:

{% highlight javascript %}
class Widget
  draw: ->
    ...

module.exports = Widget
{% endhighlight %}

To use it in some other module, for example `/modules/specific/window.module.js.coffee`,
we just require it:

{% highlight javascript %}
Widget = require('../widget')

class Window extends Widget
  draw: ->
    super
    ...

module.exports = Window
{% endhighlight %}

We can also use a dot:

{% highlight javascript %}
require('./../widget')
{% endhighlight %}

Or even an absolute path

{% highlight javascript %}
require('modules/widget')
{% endhighlight %}

The `module` extension wraps your code with

{% highlight javascript %}
require.define({'path/to/module': function(exports, require, module){ /* your code */ }});
{% endhighlight %}

This callback is executed only if the module is required somewhere. That's why you can no longer worry about the correct `#= require` chain.
A single `#= require_tree ./modules` in `application.js` would be enough.

`require` is the only global variable exposed by the sprockets-commonjs. Except module definition, it also allows to require
modules from non-modules. In this case don't forget about `#= require` precedence.

<!-- full end -->

[0]: http://addyosmani.com/writing-modular-js/
[1]: http://blog.millermedeiros.com/amd-is-better-for-the-web-than-commonjs-modules/
[2]: http://tomdale.net/2012/01/amd-is-not-the-answer/
[3]: http://commonjs.org/specs/modules/1.0/
[4]: http://commonjs.org/impl/
[5]: https://github.com/maccman/sprockets-commonjs
[6]: https://github.com/sstephenson/sprockets
[7]: http://blog.alexmaccaw.com/sprockets-commonjs
