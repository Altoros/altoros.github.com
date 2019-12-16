---
layout: post
title: Websocket-Rails Gem
description: Easy to get started websocket gem for rich Rails application. 
equiv: refresh
caconicalUrl: https://www.altoros.com/blog/websocket-rails-gem/
redirectUrl: 0; url=https://www.altoros.com/blog/websocket-rails-gem/
author:
  name: Dmitry Savitski
  link: https://github.com/MrDominusNox
---

I'd like you to look at the relatively new project here on Github,
 called [websocket-rails][0] built ontop of [Faye][1] (its Ruby version),
 EventMachine and Redis for data storage. In short, the gem is a Rails
 implementation for a websockets, with a number of fallbacks, including 
an implementation of Flash sockets. It provides a very cool tool for
 building a client-side applications. After all, 
["WebSocket represents the next evolutionary step in web communication compared to Comet and Ajax"][2]. 

<!-- full start -->

## Installation

If your app is running on any server supporting threads 
(like Thin or Puma) you can dive right into using websockets just adding 
`gem 'websocket-rails'` to your Gemfile. Otherwise, there is an option of 
[using standalone websocket server][3]. 

The gem comes with a simple 'get started' generator. 
Run `rails g websocket_rails:install`. It will create an *events.rb* initializer, 
as well as require javascript in your application.js.

To see the effects of the gem in development, gem installation instructions
 advise to enable `config.threadsafe!` configuration in development.rb 
( naturally, it is absolutely necessary for production). 
Unfortunately, that option prevents the application from reloading application code between page reloads.

## Routes

Websocket analog for routes in this gem is called `events`. 
A generator creates a file events.rb heavily reminding routes.rb. 
It's generated version is sparingly commented and the syntax is quite simple, 
with `subscribe` as an analog for `match`.

{% highlight ruby %}
WebsocketRails::EventMap.describe do
  namespace :chat_messages do
    subscribe :create, to: Sockets::ChatMessagesController, with_method: :create
  end
end
{% endhighlight %}

It doesn't have any more complex helpers, such as `resources`, yet.
By default, Websocket controllers don't enforce REST, so `create` 
method name later in that article is just me sticking to "my comfort zone" conventions.
Wheteher to stick to a show-create-update-destroy scheme is still an open question.

## Controllers

`websocket-rails` provides an API that may seem familiar to any rails developer, 
featuring a tree of controllers inherited from a common source and routes-ish events. 
[faye-rails][4], that is a different take on Faye, clutters routes.rb and requires more configuration.
 Let's look at a simple sockets controller.

{% highlight ruby %}
class Sockets::ChatMessagesController < WebsocketRails::BaseController

  def initialize_session
    @message_sent = 0
  end

  def create
    if can? :create, ChatMessage
      chat_message = ChatMessage.create(event.data) do |message| 
        message.user = current_user 
      end
      if chat_message
        @messages_sent += 1
        trigger_success( message: 'Message created' )
        broadcast_message :created, chat_message,
             namespace: :chat_messages
      else
        trigger_failure( message: chat_message.errors.full_messages.join(' ') )
      end
    else
      trigger_failure( message: 'Unauthorized' )
    end
  end

end
{% endhighlight %}

First thing we can see here is the fact that socket controllers are inherited from `WebsocketRails::BaseController`.
 What differs this controller from the rest of an application is the fact that its instance is created once on server start,
 and any websocket request is redirected to that one instance. It means that instance vatiables,
 like `@messages_sent` are shared across requests.

This controller is, in fact, not related to `ActionController`,
 so doesn't provide any rails controllers goodness ( redirects, responders, callbacks)
 we are accustomed to rely on. Where does `can?` come from then ?
 websocket-rails uses `method_missing` to delegate undefined instance methods
 to a `DelegationController`, that is inherited from ApplicationController.
 In other words, Websocket controllers have access to any controller instance helper methods.
 Adopting any class-enchancing logic, for example ` load_and_authorize_resource` from the same CanCan gem,
 can be troublesome, though. That prevents us from just plain reusing existing controller code.
 Minor inconvinience at worst, or a problem to solve.

The gem also features a number of responders. 
A couple of them return action status to request initializer (`trigger_success` and `trigger_failure`,
 [it's pretty much what it says on the tin][5] - flash[:status] analogs).
 A couple more methods initialize events in client javascript. `send_message`
 affects one client, requester by default. `broadcast_message`
 affects a range of connected clients, all of them by default. 

## Client dispatcher code

Any rich internet application typically features much more client-side code than server code.
 `websocket-rails` applications don't make an exception, but at least they try.
 First, we need to open a socket connection from javascript.

{% highlight javascript %}
dispatcher = new WebSocketRails('localhost:3000/websockets');
{% endhighlight %}

The gem takes care of mounting the route and it is the default path on a local server.
 Note that the request protocol is not specified, it is resolved depending on which one 
is best supported by the browser. The request sent this way creates an instance of
 `WebsocketRails::ConnectionManager` server-side, transporting browser cookies and
 storing them (so all requests through that connection use the same session_id).
 Connection Managers also persist in memory, silently taking care of all the hard work,
 until the server is stopped or the client closes a connection.

All we need to do now is trigger events like that:

{% highlight javascript %}
...
failure_callback = function(message) { 
	console.log(message); 
}
dispatcher.trigger('chat_messages.create', new_message_object,
	 success_callback, failure_callback);
{% endhighlight %}

And receive them like that:

{% highlight javascript %}
dispatcher.bind('chat_messages.created', insertNewMessageSomewhere);
{% endhighlight %}

## Even more functionality.

That is a lot of text to write about a well documented gem I barely tried.
 But there is even more. 

Broadcasting events to all clients can be expensive in resources,
 insecure, god know what else. Intuition tells, checking user abilities 
to create each chat message is an overkill too. For that, 
`websocket-rails` implements a [Channel][6] mechanism.
 Channels feature their own authorization mechanism,
 you can create and destory them in runtime,
 subscribing clients to them in javascript.
 That allows to narrow message broadcasting to channels and so on. 
Additionally, there exists a possibility to broadcast to specific
 channels from any place of the rest of the app
 (ApplicationController descendants, model callbacks, delayed processess).

Another interesting documented feature is a [DataStore][7]. `WebsocketRails::BaseController`
 instance variables persist between different user requests, so how to store a data specific
 for each user/connection? For that, a `data_store` helper is used. A minor feature, but
 the same helper can be used to aggregate data from all open connections.

## Conclusion

After all, that is the library built on an unstable,
 'not-quite-yet-specified-standards' technology. Nevertheless, it is relatively
 easy to start using the gem in Rails. It wraps low-level tinkering with
 EventMachine, maintaining connections on both sides, server and client.
 It goes out of its way to be as much compatible with the rest of the application
 as possible (though one can wish for more). It even adds some helpers of its own.
 It is supposedly easy to teach the gem to maintain synchronization between server
 instances. Last but not least, it is already thoroughly tested with Rspec and Jasmine.

It doesn't have an extensive set of plugins, nor documented best practices or recipes.
 It must be quite buggy, too. But I believe that (provided no better analog appears)
 it will evolve very fast. That just means that we have an excellent opportunity
 to influence what these best practices will look like. 

<!-- full end -->

[0]: https://github.com/DanKnox/websocket-rails
[1]: http://faye.jcoglan.com
[2]: http://www.websocket.org/
[3]: https://github.com/DanKnox/websocket-rails/wiki/Standalone-Server-Mode
[4]: https://github.com/jamesotron/faye-rails
[5]: http://tvtropes.org/pmwiki/pmwiki.php/Main/ExactlyWhatItSaysOnTheTin "I,ve decided on inserting a link to TVtropes in my every article to be 'my thing'"
[6]: https://github.com/DanKnox/websocket-rails/wiki/Working-with-Channels
[7]: https://github.com/DanKnox/websocket-rails/wiki/Using-the-DataStore

