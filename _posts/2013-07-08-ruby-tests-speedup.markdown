---
layout: post
title: Speeding up Ruby tests
description: This post describes different ways to speed-up development using TDD
equiv: refresh
caconicalUrl: https://www.altoros.com/blog/speeding-up-ruby-tests
redirectUrl: 0; url=https://www.altoros.com/blog/speeding-up-ruby-tests
author:
  name: Alexander Borovsky
  link: https://github.com/borovsky
---

Test Driven Development (TDD) is very powerful process. Using it
possible to create stable projects that survive changes over time.

One of the most important things in this process is getting test
results as fast as possible (ideally just after source code change).

This post describes ways to improve testing speed and getting test
results as fast as possible.

<!-- full start -->
## Profiling

Easiest way to get improve testing speed is find the slowest tests and
optimize them. To do this you need to add ``--profile`` option to you
command line / .rspec file. After successful test execution it will
print 10 slowest tests.

## Spork

Unfortunately test optimizing doesn't solve problem with slow Rails
startup. E.g. for [LVEE](https://github.com/borovsky/lvee) tests it
adds 15 seconds to testing time (all tests pass in 35 seconds).

For solve this problem [Spork](https://github.com/sporkrb/spork) was
created. It preloads application and run tests on this state.

To add it to your Ruby (Rails) application you need to add

{% highlight ruby %}
  gem 'spork' #gem "spork-rails"
{% endhighlight %}

to you ``Gemfile`` file, execute ``bundler install`` and bootstrap
config with

{% highlight bash %}
spork rspec --bootstrap # if you use RSpec for your tests
spork cucumber --bootstrap  # if you use Cucumber for your tests
{% endhighlight %}

For RSpec it will generate following config (some comments ommited):

{% highlight ruby %}
require 'rubygems'
require 'spork'
#uncomment the following line to use spork with the debugger
#require 'spork/ext/ruby-debug'

Spork.prefork do
  # Loading more in this block will cause your tests to run faster. However,
  # if you change any configuration or code from libraries loaded here, you'll
  # need to restart spork for it take effect.

end

Spork.each_run do
  # This code will be run each time you run your specs.

end

# Your spec_helper.rb content here
{% endhighlight %}

Here ``Spork.prefork`` part will be runned only once (during Spork
loading) and ``Spork.each_run`` will be executed during each test
restart. So it's good idea to move as much as possible to prefork
block to speedup test running.

For Rails (in addition to your spec_helper content) you will need
(some lines depend to your gems):

{% highlight ruby %}
Spork.prefork do
  # Preloading Rails
  require "rails/application"
  # This line required to proper routes reloading in Rails 3.1+
  Spork.trap_method(Rails::Application::RoutesReloader, :reload!)

  # Preloading your application
  require File.dirname(__FILE__) + "/../config/environment.rb"

  # Preloading RSpec
  require 'rspec/rails'

  require 'shoulda/matchers/integrations/rspec' # after require 'rspec/rails'

  RSpec.configure do |config|
    # Your RSpec config here
  end
end

Spork.each_run do
  # Reloading support files each run
  Dir[Rails.root.join("spec/support/**/*.rb")].each {|f| require f}

  # Reload FactoryGirl2 factories
  FactoryGirl.reload

  # Reload locales
  I18n.backend.reload!
end
{% endhighlight %}

More information about Spork you can find on
[Github](https://github.com/sporkrb/spork/)

Note: if you change your initializer scripts
you need to reload Spork.

## Guard

Now we can start our tests really fast, but after each file change we
need rerun tests (from command line or using key binding), and it's
boring!

[Guard](https://github.com/guard/guard) is automatically tracks
changes in your project and run tests or reload Spork if initializer
changes. Also it can run ``bundler`` if Gemfile changed.

To add it to your application you need to modify your Gemfile:

{% highlight ruby %}
  group :development do
    gem "guard"
    gem "guard-rspec" # plugin to automate RSpec testing
    gem "guard-cucumber" # plugin to automate Cucumber testing
    gem 'guard-spork' # plugin to automate Spork reload
    gem 'guard-bundler' # plugin to automate Bundler tasks
  end
{% endhighlight %}

For typical Rails application you can use following configuration:

{% highlight ruby %}
# Guardfile

guard 'bundler' do
  watch('Gemfile')
  # Uncomment next line if Gemfile contain `gemspec' command
  # watch(/^.+\.gemspec/)
end

guard 'spork', cucumber_env: { 'RAILS_ENV' => 'test' }, rspec_env: {'RAILS_ENV' => 'test' } do
  # Reloading Spork if any of following files changed
  watch('config/application.rb')
  watch('config/environment.rb')
  watch('config/environments/test.rb')
  watch(%r{^config/initializers/.+\.rb$})
  watch('Gemfile')
  watch('Gemfile.lock')
  # Reload and run specific test type
  watch('spec/spec_helper.rb') { :rspec }
  watch(%r{features/support/}) { :cucumber }
end

guard 'rspec', cli: '--drb --format Fuubar --color --profile' do
  # Rerun all tests
  watch(%r{^spec/.+_spec\.rb$})
  # Rerun tests with specific name
  watch(%r{^lib/(.+)\.rb$})     { |m| "spec/lib/#{m[1]}_spec.rb" }
  watch('spec/spec_helper.rb')  { "spec" }

  watch(%r{^app/(.+)\.rb$})                           { |m| "spec/#{m[1]}_spec.rb" }
  watch(%r{^app/controllers/(.+)_(controller)\.rb$})  { |m| ["spec/routing/#{m[1]}_routing_spec.rb", "spec/#{m[2]}s/#{m[1]}_#{m[2]}_spec.rb", "spec/acceptance/#{m[1]}_spec.rb"] }
  watch(%r{^spec/support/(.+)\.rb$})                  { "spec" }
  watch('config/routes.rb')                           { "spec/routing" }
  watch('app/controllers/application_controller.rb')  { "spec/controllers" }
end

guard 'cucumber', cli: "--drb" do
  watch(%r{^features/.+\.feature$})
  watch(%r{^features/support/.+$})          { 'features' }
  watch(%r{^features/step_definitions/(.+)_steps\.rb$}) { |m| Dir[File.join("**/#{m[1]}.feature")][0] || 'features' }
end
{% endhighlight %}

This Guard plugins are smart enough to rerun only changed and
failed tests first, and only if tests fixed it runs whole test suite.

There is bunch of Guard plugins for automate all aspects of
development. There list of few of them:

* [guard-rails](https://github.com/guard/guard-rails) - autoreloads
  application if required (e.g. initializers / configuration / library
  / gems was changed)
* [guard-livereload](https://github.com/guard/guard-livereload) -
autoreloads browser if you changing view.
* [guard-jekyll](https://github.com/therabidbanana/guard-jekyll) -
helps you write posts to this blog ;)
* [guard-jasmine](https://github.com/guard/guard-jasmine) -
autorun [Jasmine](http://pivotal.github.io/jasmine/) tests automatically

## Bonus: Tests coverage

Tests coverage is very useful if you practice TDD: it helps detect
parts of code not checked by tests.

For Ruby 1.9.3 the best gem to generate profiling information is
``simplecov``. it generate pretty HTML reports.

To integrate it with your test you need to add:
{% highlight ruby %}
require 'simplecov'
SimpleCov.start 'rails'
{% endhighlight %}

If you use Spork, you need to add simplecov bit different:
{% highlight ruby %}
Spork.prefork do
  unless ENV['DRB']
    require 'simplecov'
    SimpleCov.start 'rails'
  end

  # other code ...
end

Spork.each_run do
  if ENV['DRB']
    require 'simplecov'
    SimpleCov.start 'rails'
  end

  # other code ...
end
{% endhighlight %}

It required because Spork works internally (using fork), so results
will be inconsistent unless we start it in ``each_run`` section.

<!-- full end -->
