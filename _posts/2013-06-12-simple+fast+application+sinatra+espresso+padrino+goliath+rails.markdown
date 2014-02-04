---
layout: post
title: "Simple fast application: Sinatra + Espresso + Padrino + Goliath + Rails"
description: Benchmark comparison of ruby frameworks
author:
  name: Eugene Melnikov
  link: https://github.com/melnikaite
---
The main target of this article is to find best framework for creating extremely basic and so fast as possible ruby application.

<!-- full start -->
For testing comparison I used ApacheBench 2.4.3 `ab -n 1000 -c 100 localhost`, CPU 2.3 GHz intel Core i5 Sandy Bridge, RAM 4 GB 1333 MHz DDR3, SSD intel 330 120GB, OS X Mavericks 10.9.1, ruby 2.0.0p247, MySQL 5.6.14 in development environment.
The only parameter in all tables is amount of requests per second (r/s).

###Sinatra 1.4.4
Web Server |  No views and DB | Views (slim) |  Views (slim) + MySQL (sequel)
--- | --- | --- | ---
WEBrick 1.6.1 | 3.663 ms |  8.594 ms |  8.931 ms
Thin 1.6.1 |  0.626 ms  | 5.730 ms |  7.159 ms
Unicorn 4.8.1 | 1.651 ms |  8.240 ms |  8.235 ms

Interesting facts.
When I used stubbed "Hello World!" in `index.haml` I got performance decrease for 5r/s.
WEBrick produced interesting result when I used views and database.
It was faster with MySQL then without for 8r/s.
Also I got performance decrease when I wrapped application in `class App < Sinatra::Application` and added `config.ru` with `run App.new` for unicorn.
After adding `config.ru` thin started to work slower on 200r/s.
It’s not just inaccuracy because I have checked all controversial results many times and got pretty stable speeds.
So you should be extremely careful when you write high load application, because any small change can slow down your application and run benchmark tests on the web server that you are going to use on production.
Since Thin showed the best results all my next tests I’ll do with only this web server and try to keep my application so simple as possible.

###Espresso

Espresso framework is disappeared from all repositories and I couldn't find any news about this.

###Padrino 0.11.4
Cache | No views and DB | Views (slim) |  MySQL (sequel) |  Views (slim) + MySQL (sequel)
--- | --- | --- | --- | ---
No cache | 0.729 ms | 6.663 ms |  1.388 ms | 7.372 ms
Memory | 0.662 ms | 6.218 ms | 1.170 ms | 7.140 ms

Despite Padrino built on Sinatra and provides a lot of helpful stuff like in Rails, performance still close to clean Sinatra application.
This fact cannot be but a source of joy.

Before I ran all tests using global layout plus layout for action, but for last test I made exception and checked without global layout.
I got 167r/s instead of 92r/s.
It’s even more than result without database.
The same result I got with caching, but in this case it was less than result without database.
So when you make highload application and have to use views try to avoid using global layouts if it’s possible.

###Goliath 1.0.2
No views and DB | Views (slim) |  MySQL (sequel) |  Views (slim) + MySQL (sequel)
--- | --- | --- | ---
2.075 ms | 7.477 ms | 4.314 ms | 10.184 ms

Goliath results looks a bit strange for me, because I thought that this framework is the fastest thanks to own HTTP server.
Please don’t hesitate to blame my results and propose your version of benchmark test.

###And just for fun Rails 4.0.2
No views and DB | Views (slim) |  MySQL (sequel) |  Views (slim) + MySQL (sequel)
--- | --- | --- | ---
1.539 ms | 1.790 ms | 2.248 ms | 2.501 ms

I enabled caching classes in `development.rb`, disabled sessions and protection from forgery for these tests.
I used Sequel instead of ActiveRecord to make results more fair.
You can see that results are close to Goliath’s, but little bit better.

You can make sure all [applications](https://github.com/melnikaite/ruby-frameworks-comparison/branches) I made were really similar and tests are not taken from ceil. Hope it helped you to choose right framework.
<!-- full end -->
