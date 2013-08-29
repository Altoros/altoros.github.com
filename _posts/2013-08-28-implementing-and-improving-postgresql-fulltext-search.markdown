---
layout: post
title: Implementing and improving PostgreSQL fulltext search.
description: Here I will describe how to use postgresql fulltext search.
author:
  name: Pavel Astraukh
  link: https://github.com/enotpoloskun
---

PostgreSQL is great relational database with a lot of features, and one of features I am going to talk about is a build-in fulltext search.

In this post I will describe the proccess of implemeting postgresql fulltext search to your rails application, and also will show you how to improve it's performance.

<!-- full start -->

## Preparing
There are already some ready solutions for implementing postgresql fulltext search. We will be using [this one](https://github.com/Casecommons/pg_search).
So you need to add this line to your gemfile:
{% highlight ruby %}
gem 'pg_search'
{% endhighlight %}

Then, add this line to your application.rb

{% highlight ruby %}
config.active_record.schema_format = :sql
{% endhighlight %}

## Sample app

My sample app will have 3 models:

{% highlight ruby %}
class Article < ActiveRecord::Base
  belongs_to :author
  has_many :comments

  attr_accessible :content, :title
end
{% endhighlight %}

{% highlight ruby %}
class Author < ActiveRecord::Base
  attr_accessible :name
  has_many :articles
end
{% endhighlight %}

{% highlight ruby %}
class Comment < ActiveRecord::Base
  belongs_to :article
  attr_accessible :content
end
{% endhighlight %}

and search will be implemented for articles. It will be able to search article by its title and content, also by it's comments content and author name. Also search will have other settings about which you can read at [gem's page](https://github.com/Casecommons/pg_search). So, for adding search for Articles you should add this to article model:

{% highlight ruby %}
include PgSearch

pg_search_scope :search,
                against: [:title, :content],
                associated_against: {
                  author: :name,
                  comments: :content
                },
                using: {
                  tsearch: {
                    dictionary: 'english',
                    any_word: true,
                    prefix: true
                  }
                }
{% endhighlight %}

And then you can perform search using Article.search method:

{% highlight ruby %}
irb(main):011:0> Article.search('title')
=> [#<Article id: 3, author_id: 1, title: "title", content: "this is content", created_at: "2013-08-26 10:09:01", updated_at: "2013-08-27 07:00:18">]
{% endhighlight %}

Hooray, it found Article by word 'title'! But if you look at query:

{% highlight ruby %}
Article Load (1.9ms)  SELECT "articles".*, ((ts_rank((to_tsvector('simple', coalesce("articles"."title"::text, '')) || to_tsvector('simple', coalesce("articles"."content"::text, '')) || to_tsvector('simple', coalesce(pg_search_1eb533ea18bbbe0846ef24.pg_search_a612c20e7f822205b5b540::text, '')) || to_tsvector('simple', coalesce(pg_search_121ea89914a721445aee70.pg_search_6e76a7a40d9cb3861e7fb2::text, ''))), (to_tsquery('simple', ''' ' || 'title' || ' ''')), 0))) AS pg_search_rank FROM "articles" LEFT OUTER JOIN (SELECT "articles"."id" AS id, string_agg("authors"."name"::text, ' ') AS pg_search_a612c20e7f822205b5b540 FROM "articles" INNER JOIN "authors" ON "authors"."id" = "articles"."author_id" GROUP BY "articles"."id") pg_search_1eb533ea18bbbe0846ef24 ON pg_search_1eb533ea18bbbe0846ef24.id = "articles"."id" LEFT OUTER JOIN (SELECT "articles"."id" AS id, string_agg("comments"."content"::text, ' ') AS pg_search_6e76a7a40d9cb3861e7fb2 FROM "articles" INNER JOIN "comments" ON "comments"."article_id" = "articles"."id" GROUP BY "articles"."id") pg_search_121ea89914a721445aee70 ON pg_search_121ea89914a721445aee70.id = "articles"."id" WHERE (((to_tsvector('simple', coalesce("articles"."title"::text, '')) || to_tsvector('simple', coalesce("articles"."content"::text, '')) || to_tsvector('simple', coalesce(pg_search_1eb533ea18bbbe0846ef24.pg_search_a612c20e7f822205b5b540::text, '')) || to_tsvector('simple', coalesce(pg_search_121ea89914a721445aee70.pg_search_6e76a7a40d9cb3861e7fb2::text, ''))) @@ (to_tsquery('simple', ''' ' || 'title' || ' ''')))) ORDER BY pg_search_rank DESC, "articles"."id" ASC
{% endhighlight %}

you will see that it have several joins which is not good because it greatly slows performance. I will show you how to avoid this behavior and
improve search performance.

## Improving Performance

I am going to add new column to articles tables. New column will have
[tsvector](http://www.postgresql.org/docs/8.3/static/datatype-textsearch.html) type and will store all words by which article can be searched.
Also I will add [GIN index](http://www.postgresql.org/docs/9.1/static/textsearch-indexes.html) to speed up search. So we need to generate migration:

{% highlight ruby %}
class AddTsvectorColumnToArticles < ActiveRecord::Migration
  def up
    add_column :articles, :search_vector, :tsvector

    execute <<-EOS
      CREATE INDEX articles_search_vector_idx ON articles USING gin(search_vector);
    EOS
  end

  def down
    remove_column :articles, :search_vector
  end
end
{% endhighlight %}

I've added tsvector column to articles named search_vector. Now we need somehow to fill up this vector. For this I am going to write postgresql function for filling up vector and trigger, which will fill up this vector on insert or update of article. So here it is migration for creating trigger and function.

{% highlight ruby %}
class CreateFunctionAndTriggerForFillingSearchVectorOfArticles < ActiveRecord::Migration
  def up
    execute <<-EOS
      CREATE OR REPLACE FUNCTION fill_search_vector_for_acticle() RETURNS trigger LANGUAGE plpgsql AS $$
      declare
        article_author record;
        article_comments record;

      begin
        select name into article_author from authors where id = new.author_id;
        select string_agg(content, ' ') as content into article_comments from comments where article_id = new.id;

        new.search_vector :=
          setweight(to_tsvector('pg_catalog.english', coalesce(new.title, '')), 'A')                  ||
          setweight(to_tsvector('pg_catalog.english', coalesce(new.content, '')), 'B')                ||
          setweight(to_tsvector('pg_catalog.english', coalesce(article_author.name, '')), 'B')        ||
          setweight(to_tsvector('pg_catalog.english', coalesce(article_comments.content, '')), 'B');

        return new;
      end
      $$;
    EOS

    execute <<-EOS
      CREATE TRIGGER articles_search_content_trigger BEFORE INSERT OR UPDATE
        ON articles FOR EACH ROW EXECUTE PROCEDURE fill_search_vector_for_acticle();
    EOS

    Article.find_each(&:touch)
  end

  def down
    execute <<-EOS
      DROP FUNCTION fill_search_vector_for_acticle();
      DROP TRIGGER articles_search_content_trigger ON articles;
    EOS
  end
end
{% endhighlight %}

Each time, when article is created or updated new vector will be built for artricle. As you can see here:

{% highlight ruby %}
select name into article_author from authors where id = new.author_id;
        select string_agg(content, ' ') as content into article_comments from comments where article_id = new.id;
{% endhighlight %}

I am fetching name from author and concatenated content of article. And then create new vector:

{% highlight ruby %}
new.search_vector :=
  setweight(to_tsvector('pg_catalog.english', coalesce(new.title, '')), 'A')                  ||
  setweight(to_tsvector('pg_catalog.english', coalesce(new.content, '')), 'B')                ||
  setweight(to_tsvector('pg_catalog.english', coalesce(article_author.name, '')), 'B')        ||
  setweight(to_tsvector('pg_catalog.english', coalesce(article_comments.content, '')), 'B');
{% endhighlight %}

More detaily about each syntax of each function you can read at [documentation](http://www.postgresql.org/docs/).

Also we need to update article, each time when comment is updated. For this we will add touch true for association at comments model.

{% highlight ruby %}
belongs_to :article, touch: true
{% endhighlight %}

Now, everytime when comments is updated, it's article will be updated true, and this will call trigger which will update articles search_vector column.


And the last one step is that we need to to make searching to use new search_vector column. For this we need to change pg_search_scope for artcile model.

{% highlight ruby %}
pg_search_scope :search,
  against: :search_vector,
  using: {
    tsearch: {
      dictionary: 'english',
      any_word: true,
      prefix: true,
      tsvector_column: 'search_vector'
    }
  }
{% endhighlight %}

## Results

Now our articles have tsvector column which stores searched by text in it.

{% highlight ruby %}
irb(main):051:0> Article.last.search_vector
=> "'astraukh':6B 'comment':9B 'content':4B,10B 'pavel':5B 'titl':1A"
irb(main):052:0> Article.search('title')
=> [#<Article id: 3, author_id: 1, title: "title", content: "this is content", created_at: "2013-08-27 08:05:55", updated_at: "2013-08-27 08:06:18", search_vector: "'astraukh':6B 'comment':9B 'content':4B,10B 'pavel'...">]
{% endhighlight %}

And query looks like:

{% highlight ruby %}
Article Load (0.4ms)  SELECT "articles".*, ((ts_rank(("articles"."search_vector"), (to_tsquery('english', ''' ' || 'title' || ' ''' || ':*')), 0))) AS pg_search_rank FROM "articles" WHERE ((("articles"."search_vector") @@ (to_tsquery('english', ''' ' || 'title' || ' ''' || ':*')))) ORDER BY pg_search_rank DESC, "articles"."id" ASC
{% endhighlight %}

As you see query doesn't have any joins and this behavior greatly improves search performance. Now you know how to implement and improve your search using postgresql full text search.
<!-- full end -->
