---
# vim:spell:
layout: post
title: Using Couchbase Ruby Gem with EventMachine
description: How to integrate your EventMachine application with couchbase ruby gem
redirect_to:
  - https://www.altoros.com/blog/using-couchbase-ruby-gem-with-eventmachine/
author:
  name: Sergey Avseyev
  link: https://github.com/avsej
---

This is cross-post from [Couchbase blogs][0].

As you might have noticed the new [couchbase ruby gem][1] has been
released recently. The release 1.2.2 is mostly maintenance release
with several bug fixes, but yet you can try new experimental feature:
integration with [EventMachine][2] library. This post supposed to give
you quick intro about how to start using Couchbase Server with your
applications based on EventMachine asynchronous model.

The EventMachine integration is only (currently) accessible on
UNIX-like systems (like Linux, Solaris, BSD). Because it uses fibers,
it also requires MRI ruby version 1.9 or later.

<!-- full start -->

## Setup Your Sandbox

First step is installing the libcouchbase library which handles all of
the low level Couchbase protocol details. You can follow the
[installation guide on the official page][3]. Here I'll only replicate
steps needed for typical GNU/Linux box (I'm using Debian unstable):

1. Install repository PGP key:

       $ wget -O- http://packages.couchbase.com/ubuntu/couchbase.key | sudo apt-key add -

2. Setup repository source. Here I'm using link for Ubuntu 12.04, but
   in general it doesn't matter because we are going to use
   EventMachine plugin, which built into the gem itself. The packages
   in different packages repositories built using the same codebase,
   the only difference in versions of IO libraries ([libevent][4],
   [libev][5]).

       $ sudo wget -O/etc/apt/sources.list.d/couchbase.list http://packages.couchbase.com/ubuntu/couchbase-ubuntu1204.list

3. Install libcouchbase headers, core library and debug symbols.
   Again, you might want to install command line tools or one of the
   IO backends, but they are optional for our current task.

       $ sudo apt-get update
       $ sudo sudo apt-get install libcouchbase-dev libcouchbase2-core libcouchbase-dbg

   That is.

   Now you need to install [Couchbase Server][6], follow
   instructions from the official site. After installation you will
   get administrator console running at http://localhost:8091 and also
   REST API accessible on the same port. Step through initial
   configuration steps and eventually you will allocate bucket with
   the name "default".

4. Finally you need to install gem itself, it is as easy as type this
   into the terminal:

       $ gem install couchbase
       Building native extensions.  This could take a while...
       Successfully installed couchbase-1.2.2
       1 gem installed
       Installing ri documentation for couchbase-1.2.2...
       Installing RDoc documentation for couchbase-1.2.2...

## Building the Application

To demonstrate the integration, lets build simple chat application
using EventMachine and the add logging for all events there to
Couchbase bucket. It is extremely easy to build asynchronous
application with EventMachine and to prove it I will put the complete
source here, in this post (also found in [examples/chat-em][7]
directory of the gem sources).

{% highlight ruby %}
class ChatServer < EM::Connection

  @@clients = []

  def post_init
    @username = nil
    send_data("*** What is your name?\n")
  end

  def receive_data(data)
    if @username
      broadcast(data.strip, @username)
    else
      name = data.gsub(/\s+|[\[\]]/, '').strip[0..20]
      if name.empty?
        send_data("*** What is your name?\n")
      else
        @username = name
        @@clients.push(self)
        broadcast("#{@username} has joined")
        send_data("*** Hi, #{@username}!\n")
      end
    end
  end

  def unbind
    @@clients.delete(self)
    broadcast("#{@username} has left") if @username
  end

  def broadcast(message, author = nil)
    prefix = author ? "<#{@username}>" : "***"
    @@clients.each do |client|
      unless client == self
        client.send_data("#{prefix} #{message}\n")
      end
    end
  end

end

EventMachine.run do
  # hit Control + C to stop
  Signal.trap("INT")  { EventMachine.stop }
  Signal.trap("TERM") { EventMachine.stop }

  EventMachine.start_server("0.0.0.0", 9999, ChatServer)
end
{% endhighlight %}

This is typical EventMachine server based on `EM::Connection`. For
those who doesn't know the meaning of these redefined methods I will
give an exceprt from the [official documentation][10]:

> `EventMachine::Connection` is a class that is instantiated by
> EventMachine's processing loop whenever a new connection is created.
> (New connections can be either initiated locally to a remote server
> or accepted locally from a remote client.) When a Connection object
> is instantiated, it mixes in the functionality contained in the
> user-defined module specified in calls to connect or start_server.
> User-defined handler modules may redefine any or all of the standard
> methods defined here, as well as add arbitrary additional code that
> will also be mixed in.
>
> EventMachine manages one object inherited from
> `EventMachine::Connection` (and containing the mixed-in user code) for
> every network connection that is active at any given time. The event
> loop will automatically call methods on `EventMachine::Connection`
> objects whenever specific events occur on the corresponding
> connections, as described below.
>
> This class is never instantiated by user code, and does not publish
> an initialize method. The instance methods of
> `EventMachine::Connection` which may be called by the event loop are:
> `#post_init`, `#connection_completed`, `#receive_data`, `#unbind`,
> `#ssl_verify_peer` (if TLS is used), `#ssl_handshake_completed`
>
> All of the other instance methods defined here are called only by
> user code.

The protocol is very simple and line oriented. For each connection
EventMachine will create an instance of `ChatServer`, which first ask
the name of new participant and then broadcast all his messages to the
group. You can use your favorite tool which allow you communicate over
arbitrary text protocol, like `telnet` for example or `nc`. Here is
sample of session between endpoints.

    ~ $ telnet localhost 9999           │ ~ $ nc localhost 9999
    Trying 127.0.0.1...                 │ *** What is your name?
    Connected to localhost.             │ alice
    Escape character is '^]'.           │ *** Hi, alice!
    *** What is your name?              │ *** bob has joined
    bob                                 │ <bob> hi everyone
    *** Hi, bob!                        │ hello, bob! how are you?
    hi everyone                         │ ^C
    <alice> hello, bob! how are you?    │ ~ $
    *** alice has left                  │
    ^]                                  │
    telnet> Connection closed.          │
    ~ $                                 │

Now it's time to add a bit of Couchbase. Imagine I'd like to keep all
messages in a distributed database as efficiently as I can. [Couchbase
is the answer][8] :). To do so I need to:

Implement a `log` method in the ChatServer class, which should accept
the message and an optional author (for system events it will be `nil`):


{% highlight ruby %}
def log(message, author = nil)
  Couchbase.bucket.incr("log:key", :initial => 1) do |res|
    entry = {
      'time' => Time.now.utc,
      'author' => author || "[system]",
      'message' => message
    }
    Couchbase.bucket.set("log:#{res.value}", entry)
  end
end
{% endhighlight %}

Then I add a call to `log(message, author)` in the broadcast method
just before iterating all connected clients. And wrap
`EventMachine.start_server` with `Couchbase::Bucket#on_connect`
callback, to execute the server just after the client has been
connected. The resulting loop execution will look like this:

{% highlight ruby %}
EventMachine.run do
  # hit Control + C to stop
  Signal.trap("INT")  { EventMachine.stop }
  Signal.trap("TERM") { EventMachine.stop }

  Couchbase.connection_options = {:async => true, :engine => :eventmachine}
  Couchbase.bucket.on_connect do |res|
    if res.success?
      EventMachine.start_server("0.0.0.0", 9999, ChatServer)
    else
      puts "Cannot connect to Couchbase Server: #{res.error}"
    end
  end
end
{% endhighlight %}

That's it for now! In the future we can expand this example to use
more modern techniques like [em-synchrony][9] and maybe websockets. Watch
[this blog][13] for updates.

## Bonus Points

Just logging might not be that interesting, with Couchbase Server you
can perform simple analytics with View queries using Couchbase's
incremental Map-Reduce awesomeness. For example, here is the Map
function to get all entries in chronological order.

{% highlight javascript %}
function (doc, meta) {
  if (doc.message) {
    if (doc.author == "[system]") {
      emit(new Date(doc.time), "*** " + doc.message);
    } else {
      emit(new Date(doc.time), "<" + doc.author + "> " + doc.message);
    }
  }
}
{% endhighlight %}

And the JSON output.

    {"total_rows":6,"rows":[
      {"id":"log:1","key":"2013-02-11T19:08:05.000Z","value":"*** alice has joined"},
      {"id":"log:2","key":"2013-02-11T19:08:18.000Z","value":"*** bob has joined"},
      {"id":"log:3","key":"2013-02-11T19:08:38.000Z","value":"<bob> hi everyone"},
      {"id":"log:4","key":"2013-02-11T19:08:48.000Z","value":"<alice> hello, bob! how are you?"},
      {"id":"log:5","key":"2013-02-11T19:08:58.000Z","value":"*** alice has left"},
      {"id":"log:6","key":"2013-02-11T19:09:01.000Z","value":"*** bob has left"}
    ]}


Okay, that's really all for now. Enjoy this experimental new feature.
It'll be fully supported in a future release. If you run into any
trouble, please file an issue on the [RCBC project issue tracker][11]. Fixes
and contributions are always welcome too and it's Open Source under an
Apache 2.0 License. You'll find the [sources on github][12].

<!-- full end -->

[0]: http://blog.couchbase.com/using-couchbase-ruby-gem-eventmachine
[1]: https://rubygems.org/gems/couchbase
[2]: https://rubygems.org/gems/eventmachine
[3]: http://www.couchbase.com/develop/c/current
[4]: http://libevent.org
[5]: http://software.schmorp.de/pkg/libev.html
[6]: http://www.couchbase.com/download
[7]: https://github.com/couchbase/couchbase-ruby-client/tree/master/examples/chat-em
[8]: http://www.couchbase.com/why-nosql/nosql-database
[9]: https://github.com/igrigorik/em-synchrony/
[10]: http://eventmachine.rubyforge.org/EventMachine/Connection.html
[11]: http://www.couchbase.com/issues/browse/RCBC
[12]: http://github.com/couchbase/couchbase-ruby-client/
[13]: http://blog.couchbase.com
