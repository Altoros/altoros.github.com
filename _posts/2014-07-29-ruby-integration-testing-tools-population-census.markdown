---
layout: post
title: "Ruby integration testing tools: population census 2014"
description: Structure of actual in 2014 year tools for integration testing in ruby
keywords: ruby, cucumber, rspec, sahi, capybara, watir, webkit, selenium, poltergeist, phantomjs
author:
  name: Eugene Melnikov
  link: https://github.com/melnikaite
---

Hi colleagues.

Over the past 4 years the world of tools for integration testing has been changed a lot.

Bringing to your attention actual as of 2014 scheme.

<!-- full start -->

# 2010

![2010][0]

<a href="http://www.johng.co.uk/2010/10/11/the-crazy-state-of-cross-browser-integration-testing/" target="_blank">Source</a>

# 2014

![2014][1]

Hope it helped to eliminate mess in your head.

Feel free to comment if there is any discrepancy.

# Comparison

In additional I'd like to introduce performance comparison of some combinations.

Combination | Spent time
--- | ---
capybara-poltergeist-phantomjs | 0.905939
capybara-racktest | 0.164243
capybara-selenium-chrome | 9.512472
capybara-selenium-firefox | 19.975556
capybara-selenium-htmlunit | 9.508733
capybara-selenium-phantomjs | 17.783997
capybara-webkit | 1.211507
sahi-chrome | 25.997508
sahi-firefox | 32.630895
sahi-phantomjs | doesn't work
watir-selenium-chrome | 10.531617
watir-selenium-firefox | 21.71715
watir-selenium-phantomjs | 19.585553

`capybara-racktest` is the fastest combination, but doesn't support javascript.
Consider `capybara-poltergeist-phantomjs` and `capybara-webkit` combinations for your application.

You can find source of tests <a href="https://github.com/melnikaite/ritt_performance" target="_blank">here</a>.

P.S. Sahi is really buggy and has poor ruby support. Don't spend time on it.

<!-- full end -->

[0]: /images/posts/2014-07-29-ruby-integration-testing-tools-population-census/2010.png
[1]: /images/posts/2014-07-29-ruby-integration-testing-tools-population-census/2014.png
