---
layout: post
title: Diving into Ember.js - Part 1
description: Step-by-step tutorial on Ember.js framework.
caconicalUrl: https://www.altoros.com/blog/diving-into-ember-js-part-1-2/
author:
  name: Nastia Shaternik
  link: https://github.com/drone-loops
---
Hola.

This article is a part of the tutorial on [Ember.js](http://emberjs.com/) framework. The goal is developing of the js application: neither too complex, nor too trivial. We are going to build it up from scratch, without using bootstrapping tools. Be free to look into the [source code](https://github.com/drone-loops/padrino-assets-pipeline.git) to feel the idea. Note: i'm going to create js application in the context of the [Padrino](http://www.padrinorb.com/); actually, only js files will matter by now. Let's go!

<!-- full start -->
## Creating the skeleton

> If you develop this application in conjuction with Padrino, check out
> [guides](http://www.padrinorb.com/guides) to create Padrino project,
> etc; also, it makes sense to add *asset pipeline*: follow this
> [how-to](http://tedkulp.com/post/42835233934/padrino-and-the-asset-pipeline).
> And, I highly recommend you to write core js files in short-spoken
> [coffeescript](http://coffeescript.org/) :).

So, assume we have *javascripts* directory eventually - it's currently our working directory.

### Prepare vendor code
Now we need to add necessary js files to make Ember work:

* [jquery](http://jquery.com/download/)
* [ember](http://emberjs.com/)
* [handlebars](http://handlebarsjs.com/)/[emblem](http://emblemjs.com/):
Handlebars is the default template language for Ember, but you can (and should) use Emblem over it; Emblem is yet another slim-like template language.

Download these libraries and save them into the *lib* directory.

### Set up application entry point
Ok. Look at the *application.js* file - so-called `manifest` (was brought with `asset pipeline`) - application entry point. We're going to include libraries here:

{% highlight javascript %}
//= require lib/jquery
//= require lib/handlebars
//= require lib/emblem
//= require lib/ember
//= require_self
{% endhighlight %}

And add the line in the end to bootstrap the application; `App`(or any other name) is the namespace of the application:
{% highlight javascript %}
App = Ember.Application.create();
{% endhighlight %}

### Create application structure
So, as we do the [mvc](http://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) application - we should provide a specific structure, also keeping in mind [Ember features](http://emberjs.com/guides/concepts/core-concepts/).
Based on that assertion, we need to create the next directories:

* [models](http://emberjs.com/guides/models)
* [controllers](http://emberjs.com/guides/controllers)
* [views](http://emberjs.com/guides/views)
* [templates](http://emberjs.com/guides/templates/handlebars-basics)
* [helpers](http://emberjs.com/guides/templates/rendering-with-helpers)
* [routes](http://emberjs.com/guides/routing)

And create a *router.js* file - to describe application routes.

We've already [known](http://emberjs.com/guides/concepts/naming-conventions/): "when your application boots, Ember will look for objects: `App.ApplicationRoute`, `App.ApplicationController`, the `application` template" - hence, we should initialize them:

> routes/application_routes.coffee:
{% highlight coffeescript %}
App.ApplicationRoute = Ember.Route.extend()
{% endhighlight %}

> controllers/application_controller.coffee:
{% highlight coffeescript %}
App.ApplicationController = Ember.Controller.extend()
{% endhighlight %}

Eventually, create a bare *application.emblem* file in the *templates* directory.
Our next step is creating of file where we can list all these dependencies.
Let's name it as our namespace.
> app.js:
{% highlight js %}
//= require_tree ./models
//= require_tree ./controllers
//= require_tree ./views
//= require_tree ./helpers
//= require_tree ./templates
//= require ./router
//= require_tree ./routes
//= require_self
{% endhighlight %}

Don't forget to include this file into *application.js*.

> full view of application.js:
{% highlight js %}
//= require lib/jquery
//= require lib/handlebars
//= require lib/emblem
//= require lib/ember
//= require_self
//= require app

App = Ember.Application.create();
{% endhighlight %}

## Create static content
Now we'll try to print out the standard "HELLO WRLD!" message. So, we have [*application* template](http://emberjs.com/guides/application/the-application-template/): it's so-called application layout. Let's add our welcoming message to it:
{% highlight html %}
h1 HELLO WRLD!
{% endhighlight %}

If we reload browser page, we’ll see nothing, because all templates are needed to be precompiled previously.

### Templates' precompilation

Meet [Grunt.js](http://gruntjs.com/) and, in particular, [grunt-emblem](https://github.com/wordofchristian/grunt-emblem)!
> Please, watch this nice [intro](http://www.youtube.com/watch?v=q3Sqljpr-Vc)
> for Grunt, if you have no idea about it; read [installation how-to](http://gruntjs.com/getting-started).
> Read about `grunt-emblem` installation on its [github page](https://github.com/wordofchristian/grunt-emblem).
> As well, checkout [`grunt-contrib-watch`](https://github.com/gruntjs/grunt-contrib-watch) plugin in order to add `watch`
> task.

Since this article isn't about Grunt, i just list *Gruntfile.coffee*:
{% highlight coffeescript %}
module.exports = (grunt) ->
  grunt.loadNpmTasks 'grunt-emblem'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  grunt.initConfig
    emblem:
      compile:
        files:
          'templates.js': 'templates/*.emblem'

        options:
          root: 'templates/'
          dependencies:
            jquery: 'lib/jquery.js'
            ember: 'lib/ember.js'
            emblem: 'lib/emblem.js'
            handlebars: 'lib/handlebars.js'

    watch:
      files: ['templates/*.emblem']
      tasks: ['emblem']
{% endhighlight %}
Right now, we have 2 tasks: `grunt emblem:compile` and `grunt watch`.

`grunt emblem:compile` command produces *templates.js*; so, we need to get back to *app.js* file and add *templates.js* to requirements' list.

You can start `grunt watch` command in the terminal and all your templates will be precompiled every time you've changed them.

Lastly, reload the page - you should see the message.

## And the last words
You can guess, that a lot of details were left behind the scenes - that's why, look into the [commits history](https://github.com/drone-loops/padrino-assets-pipeline/commits/master).
In the next parts we'll create a kind of CRUD application. Stay tuned.
<!-- full end -->

