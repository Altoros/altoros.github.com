---
layout: post
title: Things that I hate as a web developer
description: List of things that irritate us as a developers
keywords: ruby, rails, js, lodash, angular, deep, complexity, quality, activeadmin
caconicalUrl: https://www.altoros.com/blog/things-that-i-hate-as-a-web-developer/
redirectUrl: things-that-i-hate-as-a-web-developer
author:
  name: Eugene Melnikov
  link: https://github.com/melnikaite
---

Do you remember your feelings when you had to customize `activeadmin` or you faced a binding problem in angular and first time read about `primitives`? There are a lot of things that irritate us as a developers. Here is my list. Feel free to add your items in comments.

<!-- full start -->

#### Do we really need `deep` functions?

`Ruby`, `rails`, `lodash` and etc. has a lot of similar function that works in the same way but with full depth. I can't imagine case when I need to copy just first level of hash or array and continue using deep tail by links. Anyways, if there are some cases, name for method should be `merge_first_level` instead of just `merge`.

![lodash][lodash]

![deep1][deep]

#### The way to allow in strong parameters hashes with unknown keys looks ugly.

Best syntaxis suggestions were [ignored][strong_parameters]

- params.require(:product).permit(:name).permit!(:data)

- params.require(:product).permit(:name, :data => Hash)

Instead we should use tap

{% highlight ruby %}
def permitted_params
  params.require(:product).permit(:name).tap do |while_listed|
    while_listed[:data] = params[:product][:data]
  end
end
{% endhighlight %}

#### Why people create whitelists of params in wrappers?

Ok, I understand that it's a good for security reasons, but if you give up support of you wrapper you make people spend time on investigating, forking, fixing, pull requesting, waiting for your reaction and as a result write in Gemfile:

`gem 'neglected_gem', github: 'me/neglected', :ref => '4aded'`

And don't forget `:ref` instead of getting latest master of forked repo to save some trees ![trees][trees]

#### Do you really need to rename scope variables to some synonims?

The less we change names of variables with same value, the less we look at screen and the more we save trees ![trees][trees]

{% highlight javascript %}
scope:
  item: '=ngModel'
{% endhighlight %}

{% highlight javascript %}
scope:
  obligatory: '=required'
{% endhighlight %}

#### A lot of duplicating the same functionality libraries, especially in JS

When I see articles like "[I’m a web developer and I’ve been stuck with the simplest app for the last 10 days][stuck]" I think it's a bad signal. It would be better to join efforts and create something amazing instead of classic

![standards][standards]

#### Supported technologies

I understand that there are a lot of activity: `ES2015`, `TypeScript`, `HTML5`, `CSS4`. A lot of pre and postprocessors that allows you to use new syntax and new methods. But should we use them if it's not yet supported by any browser and we can use supported technologies to write the same functionality? It just make our machines compiling slow, complicate debugging and force using function mappings.

![caniuse][caniuse]

#### Weak quality of plugins

Once I decided to use one plugin for library. I didn't want to use functionality that depends on a lot of dependencies of this plugin, but I had to add them because it wasn't optional. Anyways this plugin didn't work as expected and I decided to write my own simple plugin that has just one require dependency. And I realized that last 10 versions still has serious bug despite several issues on github about it. I could accept some bugs for young library, but not the one with 700+ commits and a lot of tests.

#### Another example is complexity

I just wanted to save some time and use libraby for building trees in DOM based on deep object. In the beginning it worked fine. When I was asked to add "Select all" functionality I was surprised that I should pass to options flatten list of my tree to mark all items selected instead of just adding some `_selected: true` flag. But it still worked fast and fine until I was asked to expand all nodes. Passing the same flatten list to options for expanding node gave the devil to the library. Some node was expanded, some not. When I click to expand one node, another node collapse! After investigating sources I couldn't belive that such simple functionality need so many code.
Dear colleagues, please save some trees ![trees][trees] and write short, simple and understandable code.

<!-- full end -->

[caniuse]: /images/posts/2016-03-22-things-that-i-hate-as-a-web-developer/caniuse.png
[deep]: /images/posts/2016-03-22-things-that-i-hate-as-a-web-developer/deep.png
[lodash]: /images/posts/2016-03-22-things-that-i-hate-as-a-web-developer/lodash.png
[standards]: /images/posts/2016-03-22-things-that-i-hate-as-a-web-developer/standards.png
[trees]: /images/posts/2016-03-22-things-that-i-hate-as-a-web-developer/trees.png

[strong_parameters]: https://github.com/rails/rails/issues/9454
[stuck]: https://medium.com/@pistacchio/i-m-a-web-developer-and-i-ve-been-stuck-with-the-simplest-app-for-the-last-10-days-fb5c50917df
