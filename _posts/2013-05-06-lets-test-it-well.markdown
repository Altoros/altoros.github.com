---
layout: post
title: Let's test it well (and simply, and smartly)
description: Useful tips about RSpec to start following if you haven't done it yet
author:
  name: Nastia Shaternik
  link: https://github.com/drone-loops
---
Hola.

In this article I would like to tell about some [RSpec](https://github.com/rspec/rspec/) features which are not common used, unfortunately, but can make your tests more clear and simplify your work on it.

<!-- full start -->

## **your tests as specification (really)**

I really fond of tests which can be read as short documentation, which expose the application API. To help you to cope with it, run your specs with `--format d[ocumentation]` option.
Output will be printed in nested way; if you don't understand what your code can do, you should rewrite your tests.
In order to not write rspec options everytime when running specs, create `.rspec` configuration file in your home directory or application directory. (Options that are stored in `./.rspec` take  precedence over options stored in `~/.rspec`, and any options declared directly on the command line will take precedence over those in either file.)

> .rspec file
{% highlight ruby %}
--color
--format d[ocumentation]
{% endhighlight %}


## **flavour of the RSpec’s built-in expectations**

* avoid use of `!=`, remember about `should_not`
* to test `actual.predicate?` methods, use `actual.should be_[predicate]`.
  {% highlight ruby %}
  actual.should be_true  # passes if actual is truthy (not nil or false)
  actual.should be_false # passes if actual is falsy (nil or false)
  actual.should be_nil   # passes if actual is nil
  actual.should be       # passes if actual is truthy (not nil or false)
  {% endhighlight %}
* use collection's matchers
  {% highlight ruby %}
  actual.should include(expected)
  actual.should have(n).items
  actual.should have_exactly(n).items
  actual.should have_at_least(n).items
  actual.should have_at_most(n).items
  {% endhighlight %}


## **mock_model vs. stub_model**

By default, `mock_model` produces a mock that acts like an existing record (`persisted()` returns true).
The `stub_model` method is similar to `mock_model` except that it creates an actual instance of the model. This requires that the model has a corresponding table in the database. So, the main advantage is obvious, tests, that was written using `mock_model`, will run faster.
The another advantage of `mock_model` over `stub_model` is that it's a true double, so the examples are not dependent on the behaviour (or mis-behaviour), or even the existence of any other code.

> Use of `mock_model` method is quite simple:
{% highlight ruby %}
describe SpineData do
  let(:user) { create :user }

  before(:each) do
    SpineData.stub_chain(:controller, :current_user).and_return(user)
  end

  # ...

  context "dealing with content set" do
    let(:set) { mock_model ContentSet }

    describe ".set_updater" do
      subject { SpineData.set_updater set }

      it { should_not be_blank }
      its([:id]) { should == set.id}
    end
  end
end
{% endhighlight %}


## **subject and it {}**

In an example group, you can use the `subject` method to define an explicit subject for testing by passing it a block.
Now you can use `it {}` constructions to specify matchers. It's just concise!
{% highlight ruby %}
describe AccountProcessing do
  include_context :oauth_hash

  # ...


  context 'user is anonymous' do
    let(:acc_processing) { AccountProcessing.new(auth_hash) }

    # ...

    describe '#create_or_update_account' do
      subject { acc_processing.create_or_update_account }
      it { should be_present }
    end

    describe '#account_info' do
      subject { acc_processing.account_info }

      it 'returns valid account info hash' do
        should be == { network: auth_hash['provider'],
                       email: auth_hash['info']['email'],
                       first_name: auth_hash['info']['first_name'],
                       last_name: auth_hash['info']['last_name'],
                       birthday: nil
        }
      end
    end

  end

end
{% endhighlight %}


## **DRY!ness**

There are 2 strategies to share the same data among different examples.
They are

* shared context

Use `shared_context` to define a block that will be evaluated in the context of example groups using `include_context`.
You can put settings(something in the `before`/`after` block), variables, data, methods. All things you put into `shared_contex` will be accessible in the example group by name.

> Defining `shared_context`:
  {% highlight ruby %}
  shared_context "shared_data" do
    before { @some_var = :some_value }

    def shared_method
      "it works"
    end

    let(:shared_let) { {'arbitrary' => 'object'} }

    subject do
      'this is the shared subject'
    end
  end
  {% endhighlight %}

> Using `shared_context`:
  {% highlight ruby %}
  require "./shared_data.rb"

  describe "group that includes a shared context using 'include_context'" do
    include_context :shared_data

    it "has access to methods defined in shared context" do
      shared_method.should eq("it works")
    end

    it "has access to methods defined with let in shared context" do
      shared_let['arbitrary'].should eq('object')
    end

    it "runs the before hooks defined in the shared context" do
      @some_var.should be(:some_value)
    end

    it "accesses the subject defined in the shared context" do
      subject.should eq('this is the shared subject')
    end
  end
  {% endhighlight %}

* shared examples

Shared examples used to describe a common behaviour and encapsulate it into one example group. Then examples can be applied to another example group.

> Defining `shared_examples`:
{% highlight ruby %}
require "set"

shared_examples "a collection" do
  let(:collection) { described_class.new([7, 2, 4]) }

  context "initialized with 3 items" do
    it "says it has three items" do
      collection.size.should eq(3)
    end
  end

  describe "#include?" do
    context "with an an item that is in the collection" do
      it "returns true" do
        collection.include?(7).should be_true
      end
    end

    context "with an an item that is not in the collection" do
      it "returns false" do
        collection.include?(9).should be_false
      end
    end
  end
end
{% endhighlight %}

> Using `shared_examples`:
{% highlight ruby %}
describe Array do
  it_behaves_like "a collection"
end

describe Set do
  it_behaves_like "a collection"
end
{% endhighlight %}


## References:

* Nice [RSpec Documentation](https://www.relishapp.com/rspec/)
* [Better Specs](http://betterspecs.org/)
* book by RSpec's creator David Chelimsky ["The RSpec Book"](http://pragprog.com/book/achbd/the-rspec-book)

<!-- full end -->

