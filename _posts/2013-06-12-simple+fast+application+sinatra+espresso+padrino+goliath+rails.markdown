---
layout: post
title: "Simple fast application: Sinatra + Espresso + Padrino + Goliath + Rails"
description: Benchmark comparison of ruby frameworks
caconicalUrl: https://www.altoros.com/blog/simple-fast-application-sinatra-espresso-padrino-goliath-rails/
redirect_to:
  - https://www.altoros.com/blog/simple-fast-application-sinatra-espresso-padrino-goliath-rails/
author:
  name: Eugene Melnikov
  link: https://github.com/melnikaite
---
The main target of this article is to find best framework for creating extremely basic and so fast as possible ruby application.

<!-- full start -->
For testing comparison I used ApacheBench 2.3 `ab -n 1000 -c 100 localhost`, CPU 2.53 GHz Intel Core 2 Duo, RAM 8 GB 1333 MHz DDR3, OS X 10.8.4, ruby 2.0.0p0, MySQL 5.6.10 in development environment.
The only parameter in all tables is amount of requests per second (r/s).

###Sinatra 1.4.3
Web Server |	No views and DB |	Views (slim) |	Views (slim) + MySQL (sequel)
--- | --- | --- | ---
WEBrick 1.3.1 |	330 |	119 |	126
Thin 1.5.1 |	980 |	146 |	133
Unicorn 4.6.2 |	645 |	122 |	95

Interesting facts.
When I used stubbed "Hello World!" in `index.haml` I got performance decrease for 5r/s.
WEBrick produced interesting result when I used views and database.
It was faster with MySQL then without for 8r/s.
Also I got performance decrease when I wrapped application in `class App < Sinatra::Application` and added `config.ru` with `run App.new` for unicorn.
After adding `config.ru` thin started to work slower on 200r/s.
It’s not just inaccuracy because I have checked all controversial results many times and got pretty stable speeds.
So you should be extremely careful when you write high load application, because any small change can slow down your application and run benchmark tests on the web server that you are going to use on production.
Since Thin showed the best results all my next tests I’ll do with only this web server and try to keep my application so simple as possible.

###Espresso 0.4.8
No views and DB |	Views (slim) |	MySQL (sequel) |	Views (slim) + MySQL (sequel)
--- | --- | --- | ---
2626 |	2016 |	1517 |	1172

Now you can see that Espresso incredibly faster than Sinatra and also we got one more proof that just using views can significantly change your application speed to worth.
However in case of Espresso database usage decreased performance more than views.
Always remember about caching popular data in memory.

###Padrino 0.11.2
Cache |	No views and DB |	Views (slim) |	MySQL (sequel) |	Views (slim) + MySQL (sequel)
--- | --- | --- | --- | ---
No cache |	825 |	113 |	545 |	92
Memory |	1050 |	207 |	745 |	112

Despite Padrino built on Sinatra and provides a lot of helpful stuff like in Rails, performance still close to clean Sinatra application.
This fact cannot be but a source of joy.

Before I ran all tests using global layout plus layout for action, but for last test I made exception and checked without global layout.
I got 167r/s instead of 92r/s.
It’s even more than result without database.
The same result I got with caching, but in this case it was less than result without database.
So when you make highload application and have to use views try to avoid using global layouts if it’s possible.

###Goliath 1.0.2
No views and DB |	Views (slim) |	MySQL (sequel) |	Views (slim) + MySQL (sequel)
--- | --- | --- | ---
399 |	109 |	261 |	84

Goliath results looks a bit strange for me, because I thought that this framework is the fastest thanks to own HTTP server.
Please don’t hesitate to blame my results and propose your version of benchmark test.

###And just for fun Rails 4.0.0.rc1
No views and DB |	Views (slim) |	MySQL (sequel) |	Views (slim) + MySQL (sequel)
--- | --- | --- | ---
461 |	398 |	316 |	292

I enabled caching classes in `development.rb`, disabled sessions and protection from forgery for these tests.
I used Sequel instead of ActiveRecord to make results more fair.
You can see that results are close to Goliath’s, but little bit better.

You can make sure all [applications](https://github.com/melnikaite/ruby-frameworks-comparison/branches) I made were really similar and tests are not taken from ceil. Hope it helped you to choose right framework.
<!-- full end -->

