---
layout: post
title: News from Twitter
description: Warning about changes on Twitter API
caconicalUrl: https://www.altoros.com/blog/news-from-twitter/
redirect_to:
  - https://www.altoros.com/blog/news-from-twitter/
author:
  name: Nikolai Sharangovich
  link: https://github.com/Sharangovich
---

Warning about changes on Twitter API.

<!-- full start -->

If one of your projects uses Twitter API, you should put your attention to news about authorization and API changes. For now Twitter uses OAuth 1.0 & OAuth 1.0 Reviosion A authorization protocols, but since march 5th support of first one was canceled. Main difference between protocols — in new version user authorithation is required. So if you use some features without user authorization, like a search, after cancelling of OAuth 1.0 you will lose this posibility. 
Also, important changes can be found on new [API 1.1][0]. One of them — new tweets search pagination. They changed cardinally. Used 'tweets count' and 'last tweet id' instead of page number.

It's time to verify that everything up to date and works correctly!


<!-- full end -->

[0]: https://dev.twitter.com/docs/api/1.1/overview
