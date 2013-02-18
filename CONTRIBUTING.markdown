Hi, this is collective blog of developers in Altoros company. This is
show cheatsheet for those from you who would like to contribute some
contents here. The blog is using [jekyll][1] static site generator and
hosted at [github pages][2], so please read corresponding resources to
you need to learn more.

To be accepted your post should follow these simple rules:

1. To have name like `_posts/%{sequential_number}-%{slug}.markdown`. You can
   easily create new file with this oneliner:

        $ touch _posts/`ls _posts | wc -l`-my-cool-post.markdown

2. To have mandatory YAML header like this:

        ---
        layout: post
        title: The Cool Title
        description: Short description of the post
        author:
          name: Your Name
          link: https://github.com/nickname
        ---

    The `layout:` property is constant, but others you must change.
    The `link:` property could be any valid URL which describes your
    identity better.

3. If your post is quite long, it will be great if you will hide
   second part of it on the index page. To do so you should wrap it
   using `<!-- full start -->` and `<!-- full end -->`. For example:

        Bla bla bla...

        <!-- full start -->

        Long body.....
        .....
        .....

        <!-- full end -->

   In this case the generator will be able to cut this section and
   hide on index page.

For those who aren't familiar with ruby ecosystem, steps to setup
local jekyll site:

1. Install ruby

        $ sudo apt-get install -y ruby rubygems

2. Install jekyll and rdiscount

        $ sudo gem install rdiscount jekyll

3. Fork this repository and clone your fork locally

        $ git clone git@github.com:YOURNAME/altoros.github.com.git

4. Write the post and verify it by spawning local server

        $ jekyll --server

5. Create a [pull request][3]

[1]: http://jekyllrb.com/
[2]: http://pages.github.com/
[3]: https://help.github.com/articles/using-pull-requests
