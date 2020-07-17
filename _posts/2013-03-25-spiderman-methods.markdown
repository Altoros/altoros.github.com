---
layout: post
title: Spiderman's extenstion methods
description: The one and only Spiderman's cheat sheet about Active Support core extension methods
caconicalUrl: https://www.altoros.com/blog/spidermans-extenstion-methods/
redirect_to:
  - https://www.altoros.com/blog/spidermans-extenstion-methods/
author:
  name: Alexander Sologub
  link: https://github.com/marvelousNinja
---

Read the one and only Spiderman's cheat sheet about Rails core extension methods (images included)

<!-- full start -->

![Monday Meme][6]

Spiderman is on duty every day (except Sunday, maybe). The thing is - he finds time to develop Rails applications. So, I have a friend of a friend with a friend knowing some random person
who asked Spiderman about his favourite core extension methods. The first thing Spiderman told: 'Dude, call them Hardcore extension methods'.

Before we go, for any feedback on that list use that mail:  
spiderman_doesnt_give_a[something like web here or just an "at" sign]theresnosuchmail.com  
So, let us see the list of coolest Hardcore extension methods.

## [extract_options!(), Array][0]
This method removes last element of array if it's a hash and returns it.
If there's no such element - it returns an empty hash.

{% highlight ruby %}
def spin_the_web(*args)
  args.extract_options!
end

spin_the_web(:all_around)   # => {}
spin_the_web(:all_around, stickiness: => :average)  # => {:stickiness=>:average}
{% endhighlight %}

It can be used, for example, in methods with a variable number of arguments and * in its declaration,
so you can easily separate array of parameters and options hash.

![How do i shoot?][7]

## [try(*args, &block), Object][1]
So, you want to check if there's an instance variable and call a method on it. Without a try method it looks like this:

{% highlight ruby %}
@random_dude && @random_dude.spiderman?
{% endhighlight %}

That code is long enough and occurs too often - so there's a shortcut:

{% highlight ruby %}
@random_dude.try(:spiderman?)
{% endhighlight %}

It will fail with NoMethodError if there's no such method (unless receiver is nil).
You can pass arguments to method after its name (just like you do for public_send method)

![You can't fail if you don't try][8]

## [delegate(*methods), Class][2]
Let's start with an example:

{% highlight ruby %}
class MaryJane
  def cook_soup
    'Mary is cooking'
  end
end

class Spiderman
  def initialize
    @mary_jane = MaryJane.new
  end

  delegate :cook_soup, to: :@mary_jane
end

spiderman = Spiderman.new
spiderman.cook_soup   # => "Mary is cooking"
{% endhighlight %}

Well, example is very straightforward. You can delegate several methods in one call.
Delegation target can be pretty much everything: instance variable, class variable, constant or method.
There's no need to be charming like a Spiderman to use that method.

![Hay][9]

## [sum(identity = 0, &block), Enumerable][3]
After a hard day, Spiderman needs to calculate the total price of things he 'expropriated'.
He can do this with a sum method (if he has a PC nearby, of course):

{% highlight ruby %}
[1,2,3,4,5].sum   # => 15
{% endhighlight %}

Also, you can call it with a block (for example, to calculate sum for some attribute):
{% highlight ruby %}
@goods_from_the_orphanage.sum(&:price)   # => 2000
{% endhighlight %}

![Orphans][10]

## [diff(another_hash), Hash][4]
You can easily determine difference between superheroes and villains by using diff method:

{% highlight ruby %}
spiderman = {
  racist: true,
  narcissistic: true,
  robs_the_banks: true,
  obsessed_with_his_uniqueness: true,
  wears_glasses: false }

dr_octopus = {
  racist: true,
  narcissistic: true,
  robs_the_banks: true,
  obsessed_with_his_uniqueness: true,
  wears_glasses: true }

spiderman.diff(dr_octopus)   # => {:wears_glasses=>false}
{% endhighlight %}

As you can see, there's much difference here.
So, duplicated key-value pairs do not belong to result.
If there are different values and the same key, value from receiver goes to result.
The rest is just merged.

![Bank robbery][11]

## [except(*keys), Hash][5]

To get a part of some hash use except method.

{% highlight ruby %}
spiderman = {
  superpowers: true,
  latex_costume: true,
  camera: true
}

peter_parker = spiderman.except(:superpowers, :latex_costume)   # => {:camera=>true}
{% endhighlight %}

That's the proof of Peter Parker being naked photograph without superpowers.
(Sorry, I can't post image with unacceptable content)

Original except method doesn't remove values from receiver.
However, it has a bang version which does.

<!-- full end -->

[0]: http://apidock.com/rails/Array/extract_options%21
[1]: http://apidock.com/rails/Object/try
[2]: http://apidock.com/rails/Module/delegate
[3]: http://apidock.com/rails/Enumerable/sum
[4]: http://apidock.com/rails/Hash/diff
[5]: http://apidock.com/rails/Hash/except
[6]: /images/posts/2013-03-25-spiderman-methods/its_meme_monday.jpg
[7]: /images/posts/2013-03-25-spiderman-methods/how_do_i_shoot.jpg
[8]: /images/posts/2013-03-25-spiderman-methods/try.jpg
[9]: /images/posts/2013-03-25-spiderman-methods/hay.jpeg
[10]: /images/posts/2013-03-25-spiderman-methods/orphans.jpg
[11]: /images/posts/2013-03-25-spiderman-methods/bank_robbery.jpg
