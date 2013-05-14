---
layout: post
title: 2 days with solr or 25x speed up of reindex
description: How to speed up solr reindex.
author:
  name: Eugene Melnikov
  link: https://github.com/melnikaite
---
I have chosen solr for my rails application because it allow to use flexible fields for index.
But one day during deploy on production I faced error `negative argument`.
Cause of it was [progress_bar](https://github.com/sunspot/sunspot/issues/139). It was easy to fix. I moved it to development section in Gemfile.

However database already was quite big (300k records for indexing) and reindex took ~1 hour.
I decided to investigate problem.

<!-- full start -->
After reading [hathitrust.org](http://www.hathitrust.org/blogs/large-scale-search/forty-days-and-forty-nights-re-indexing-7-million-books-part-1) I uncommented `mergeScheduler` in solr/conf/solrconfig.xml, set `ramBufferSizeMB` to 960, `mergeFactor` to 40 and `termIndexInterval` to 1024.
But it didn't increase speed at all.
I checked how busy was my virtual machine. There was about 50% free memory and CPU was loaded with 100%.
After adding 2 more cores to CPU it used in average 33% of each core :)

After that I started investigating possible options for indexing.
First option is `batch_size`. There are a lot of suggestions to increase it to 1000 (no more because of java garbage collector).
But task `rake sunspot:solr:reindex[1000]` still worked slowly.
I tried to run indexing from console `Model.solr_reindex(:batch_size => 1000)` and it took less time than rake task!

I have found 2 more interesting options: `include` and `batch_commit`.
Include allow to select from db same batch of rows as you defined to avoid n+1 problem.
`batch_size` index all rows at once and after that commit it.
Using include and `batch_size` I got much more better results.
I created rake task that reindex all my models using discovered options and got speed ~750 record per second.

But it was still strange for me why rake task worked so slow. After looking into namespace `:sunspot` it became obvious.
`sunspot:solr:reindex` is deprecated task and it just run `sunspot:reindex` without any options.
Ok. I have found how to pass `batch_size`. But how to pass include and `batch_commit`?

Fortunately sunspot_solr and sunspot_rails was recently updated and they already realized passing include from method `searchable` in model and they hardcoded `batch_commit` to `false`.
I started from 80/s and by this moment I got ~1100/s.

New error I got was ``undefined method `closed?' for nil:NilClass``.
In source code of [rsolr](https://github.com/mwmitchell/rsolr/blob/v1.0.7/lib/rsolr/connection.rb#L20) I have found that this is a confirmed ruby bug.
I updated ruby to ruby-1.9.3-p362 and got ~2000r/s!

There is just one small issue with speed decrease [github.com](https://github.com/sunspot/sunspot/pull/372). But you can use your own rake task until it's fixed :)

## Conclusion

* uncomment `mergeScheduler` in solr/conf/solrconfig.xml, set `ramBufferSizeMB` to 960, `mergeFactor` to 40 and `termIndexInterval` to 1024
* use latest version of ruby and gems
* use rake task correctly `rake sunspot:reindex[1000]`
* define related tables in your models using `:include`
* remember that method "searchable" accept a lot of interesting options that can speed up you application like `if`, `unless`, `ignore_attribute_changes_of`, `only_reindex_attribute_changes_of`, ...
<!-- full end -->
