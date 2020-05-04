---
layout: post
title:  "Email on Rails"
description: Different aspects of work with email in Ruby on Rails
caconicalUrl: https://www.altoros.com/blog/email-on-rails/
redirect_to:
  - https://www.altoros.com/blog/email-on-rails/
keywords: ruby, rails, email
date:   2014-12-22 23:15:45
author:
  name: Anton Trushkevich
  link: https://github.com/trushkevich
---

This post contains some notes regarding different aspects of work with email in Ruby on Rails and covers such topics as sending and receiving email as well as using address tagging.

<!-- full start -->

# **Sending email**

Sending email in Rails is being performed with the use of the [ActionMailer::Base][action_mailer_base] class. You can check the docs to get more details.

### **Configuration**

It appears to be convenient to configure ActionMailer in different ways for different environments.

#### **Development**

A great tool for this environment is the [Letter Opener][letter_opener] gem. It intercepts all outgoing email and opens each email in a separate tab of your default browser instead of real sending. Using it allows you not to worry about sending unwanted emails by accident to your real users mailboxes and not to bother you customer and testers during development or debugging some mailer. Here is an example of ActionMailer config for development environment:

{% highlight ruby %}
# config/environments/development.rb

config.action_mailer.perform_deliveries = true
config.action_mailer.raise_delivery_errors = true
config.action_mailer.delivery_method = :letter_opener
config.action_mailer.default_url_options = { host: 'localhost:3000', protocol: 'http' }
{% endhighlight %}

Another option is to use the [MailCatcher][mail_catcher] gem which is also great but [Letter Opener][letter_opener] is just simpler so I prefer using it.

#### **Staging**

It's rather common to have a 3-environments infrastructure - development, staging and production. Staging environment is usually being used for testing features to work properly (by testers and/or customer) before releasing them to production. In this case it's important for a tester to be able to verify that some email is being sent successfully and is implemented correctly. At the same time emails should not be sent to real users. In this case [Letter Opener][letter_opener] is not an option. [MailCatcher][mail_catcher] would be suitable here but again there is a simpler and more convenient option - [Mailtrap][mailtrap]. You can register a basic account (which is pretty sufficient in most of cases) for free. With this approach email delivery is being actually performed but to [mailtrap.io][mailtrap] mailbox instead of end user mailboxes. Also as it is expected [Mailtrap][mailtrap] provides a web interface to manage sent emails. Below is an example of ActionMailer config for staging environment:

{% highlight ruby %}
# config/environments/staging.rb

config.action_mailer.perform_deliveries = true
config.action_mailer.raise_delivery_errors = false
config.action_mailer.delivery_method = :smtp
config.action_mailer.smtp_settings = {
  user_name: 'examplecom-staging-g8257th95725e9k1',
  password: 'mypassword',
  address: 'mailtrap.io',
  port: '2525',
  authentication: :plain,
}
config.action_mailer.default_url_options = { host: 'staging.example.com', protocol: 'http'  }
{% endhighlight %}

#### **Production**

In this environment everything is pretty obvious as you should have ActionMailer to be configured for real email delivery to your users. ActionMailer config example for production environment:

{% highlight ruby %}
# config/environments/development.rb

config.action_mailer.perform_deliveries = true
config.action_mailer.raise_delivery_errors = false
config.action_mailer.delivery_method = :smtp
config.action_mailer.smtp_settings = {
    address: 'mail.example.com',
    domain: 'example.com',
    user_name: 'myusername',
    password: 'mypassword',
    authentication: :plain,
    enable_starttls_auto: true,
    port: 587,
}
config.action_mailer.default_url_options = { host: 'example.com', protocol: 'http' }
{% endhighlight %}

By the way if anyone uses Gmail for sending email here is an example of smtp settings for it:

{% highlight ruby %}
config.action_mailer.smtp_settings = {
  address: 'smtp.gmail.com',
  domain: 'example.com',
  user_name: 'myusername@gmail.com',
  password: 'mypassword',
  authentication: :plain,
  enable_starttls_auto: true,
  port: 587,
}
{% endhighlight %}

### **Mailers**

Instead of inheriting your mailers directly from [ActionMailer::Base][action_mailer_base] it is convenient to create a parent `ApplicationMailer` mailer class where you can configure default mailer properties as for example layout and "from". Later you create your mailers inherited from it.

{% highlight ruby %}
# app/mailers/application_mailer.rb

class ApplicationMailer < ActionMailer::Base

  layout 'application_mailer'
  default from: 'postoffice@example.com'

end
{% endhighlight %}

Having a layout provides you with obvious advantages of DRYing your email views (for example you can easily add shared header and footer).

{% highlight haml %}
/ app/views/layouts/application_mailer.html.haml

%html
  %head
    %meta{'http-equiv' => "Content-Type", content: "text/html; charset=UTF-8"}
  %body
    = render 'shared/email_header'
    %hr
    = yield
    %hr
    = render 'shared/email_footer'
{% endhighlight %}

#### **Custom mailer**

So, let's suppose that your application provides users with a capability to send in-site  messages to each other with an option to send an email to the recipient user as well (via a checkbox or something). A possible simplified `create` action responding to js format for this could look something like this:

{% highlight ruby %}
# app/controllers/messages_controller.rb

class MessagesController < ApplicationController

  def create
    @recipient = User.find(params[:recipient_id])
    @message = current_user.messages.build(message_params)
    if @message.save
      MessageMailer.new_message(@message, recipient).deliver
    else
      # some error processing
    end
  end

end
{% endhighlight %}

By the way for performance and usability reasons it is better to send emails asynchronously, for example using [Sidekiq][sidekiq] gem. In this case your code would look like this:

{% highlight ruby %}
MessageMailer.delay.new_message(@message, recipient)
{% endhighlight %}

Ok, let's look at our `MessageMailer`.

{% highlight ruby %}
# app/mailers/message_mailer.rb

class MessageMailer < ApplicationMailer

  def new_message(message, recipient)
    @message = message
    mail({
      subject: message.subject,
      to: recipient.email,
    })
  end

end
{% endhighlight %}

And we should have a corresponding view:

{% highlight haml %}
/ app/views/message_mailer/new_message.html.haml

%h2= @message.subject
%p= simple_format @message.content
{% endhighlight %}

And that is all. Basic email should now be sent after invoking the "create" action of MessagesController.

#### **Pretty "From" field**

Let's modify a bit `From` field of the email in order to clearly see who sent you a message when you receive such email. And also let's not show the actual user email address (let's assume it is for private reasons) but instead we'll use the email address which we set as the default in the `ApplicationMailer` class.

{% highlight ruby %}
mail({
  from: "#{message.author.full_name} <#{default_params[:from]}>",
  subject: message.subject,
  to: recipient.email,
})
{% endhighlight %}

Assuming a message was sent by John Doe for example Gmail will show an email sent this way as from "John Doe". Many email clients will show it as from "John Doe \<postoffice@example.com\>". I think it looks much better than just from "postoffice@example.com" and besides it allows you to search for emails based on their actual sender.

### **Attachments**

Suppose we want to send some file attachments along with an email. File uploads are out of scope of this post so let's just assume that we have following models:

{% highlight ruby %}
class Message < ActiveRecord::Base
  MAX_ATTACHMENTS_TOTAL_SIZE = 20 * 1024 * 1024
  has_many :content_files
  belongs_to :author, class_name: 'User', foreign_key: 'created_by'
end
{% endhighlight %}

{% highlight ruby %}
class ContentFile < ActiveRecord::Base
  mount_uploader :attachment, ContentFileUploader
  belongs_to :message
end
{% endhighlight %}

Here the `ContentFile` model has a mounted as `:attachment` [CarrierWave][carrier_wave] uploader (yep, I prefer to use [CarrierWave][carrier_wave] for file uploads).


Also you should keep in mind that you can't send an arbitrary amount of data in attachments as it's most likely that email size will be limited at the destination mailserver. For example current Gmail total email size limit (including body and attachments) is equal to 25 MB. So we should process attachments somehow taking into account their size. There are plenty of options that you could implement including blocking messages with attachments size overlimit from being sent at all, but to my mind a better solution is to send just as much data as possible and if there are attachments that were not sent then for example explicitly tell about it to the recipient user and invite him to see an original message at your website. Code responsible for this could be as follows:

{% highlight ruby %}
class MessageMailer < ApplicationMailer

  def new_message(message, recipient)
    @message = message

    total_attachments_size = 0
    message.content_files.each do |content_file|
      next if total_attachments_size + content_file.filesize >= Message::MAX_ATTACHMENTS_TOTAL_SIZE
      attachments[content_file.title] = File.read(content_file.attachment.file.path)
      total_attachments_size += content_file.filesize
    end

    mail({
      from: "#{message.author.full_name} <#{default_params[:from]}>",
      subject: message.subject,
      to: recipient.email,
    })
  end

end
{% endhighlight %}

The algorithm above of course is not the most perfect one and can be improved in many ways depending on your needs. This implementation tries first to create attachments based on first uploaded files assuming that they are the most important and then it tries to add as many files as possible up to the provided limit skipping large files causing overlimit.

Regarding `content_file.filesize` - I usually store filesize in the database for faster access to it and to avoid additional disk operations.

Great, now we can send emails with attachments. Next let's see how to receive mail in Rails.

# **Receiving email**

Without any doubts it would be very useful to not only send emails but also to receive them and process in the context of your Rails application. The most common solution for this task is to use the [Mailman][mailman] gem. Setting up [Mailman][mailman] is pretty simple. Let's see how to configure it to fetch email from a Gmail account. First, add it to your `Gemfile`

{% highlight ruby %}
gem 'mailman', require: false
{% endhighlight %}

and run `bundle install`. Next let's create a file which we will use to run mailman as a background process.

{% highlight ruby %}
# script/mailman_daemon

#!/usr/bin/env ruby
require 'daemons'
Daemons.run('script/mailman_server')
{% endhighlight %}

We will be able to run it almost as a standard UNIX daemon:

{% highlight bash %}
bundle exec script/mailman_daemon start|stop|restart|status
{% endhighlight %}

Next let's create the actual [Mailman][mailman] server script. Here is an example of what it could look like:

{% highlight ruby %}
#!/usr/bin/env ruby
require "mailman"

Mailman.config.logger = Logger.new(File.expand_path("../../log/mailman.log", __FILE__))
Mailman.config.poll_interval = 60
Mailman.config.pop3 = {
  server: 'pop.gmail.com', port: 995, ssl: true,
  username: 'myemail@gmail.com',
  password: 'mypassword',
}

Mailman::Application.run do
  to '%folder%@example.com' do
    # at this point we have "message" and "params" methods available
    # so you can check fetched message and params. Everything before the "@" character
    # will be available as params[:folder]
    Mailman.logger.info message.inspect
    Mailman.logger.info params.inspect
  end

  default do
    # this is a catch-all route
  end
end
{% endhighlight %}

Here we configured [Mailman][mailman] to get email from a Gmail account via the POP3 protocol once a minute. Within a `Mailman::Application.run` block we define rules to determine how to process an email in a way very similar to the Rails router approach - you define routes one by one and the first suitable route's block will be executed. Pretty simple, isn't it? Great, now you can both send and receive email in Rails.

# **Address tags**

Another very important and useful technique anyone should be familiar with is "address tagging" which is sometimes referenced as "sub-addressing" (eg. in [RFC 5233][rfc_5233_subaddressing]). The point of this technique is that you can provide some additional info when you send an email right in an email address after a certain separator (usually a `+` character) this way - `me+tag1-tag2@example.com`. All emails sent to this address will be actually delivered to `me@example.com` address.

One of the most well-known use cases of this technique is to determine sites whose database was stolen (or sold, who knows). So imagine that you have an email address `johndoe@example.com` and you want to register at some site `www.awesomesite.com`. During registration provide your email as `johndoe+www.awesomesite.com@example.com`. If after some time period you start receiving magic pills advertising emails with `To` header field equal to `johndoe+www.awesomesite.com@example.com` then it's pretty obvious where those spammers got your email. Sometimes sites can have email validation rules that will reject your email address containing `+` or some other characters.

Also you should keep in mind that this technique can't be used in some cases because not all mail servers support it or have it enabled by default (eg. Gmail supports it). So if you're setting up your own mail server then you better check the docs to be sure.

# **Rails + Mailman + Address tagging**

A very interesting functionality can be achieved combining all the above described techniques. Imagine you have a website where users can send messages to each other and you also automatically send a copy of a message by email (or users can manually choose to send a copy to email) - pretty standard feature. It would be great if a recipient user could reply to your email right in his (or her) email client. Let's see how we can do it. Further I provide a pseudo code which can lack some details but is sufficient to get the idea.

Let's suppose we have following models:

{% highlight ruby %}
class User < ActiveRecord::Base
end
{% endhighlight %}

{% highlight ruby %}
class MessageDelivery < ActiveRecord::Base
  belongs_to :recipient, class_name: "User", foreign_key: "recipient_id"
  belongs_to :message
end
{% endhighlight %}

{% highlight ruby %}
class Message < ActiveRecord::Base
  belongs_to :author, class_name: "User", foreign_key: "author_id"
  has_many :message_deliveries
  has_many :recipients, through: :message_deliveries
end
{% endhighlight %}

and a `MessagesController` controller with `create` action responsible for sending messages which looks like this:

{% highlight ruby %}
class MessagesController < ApplicationController

  def create
    @message = Message.new(message_params)
    if @message.save
      @message.recipients.each do |recipient|
        # as I mentioned previously it's strongly recommended to process email sending in background
        MessageMailer.delay.email_copy(@message, recipient)
      end
    else
      # some error processing
    end
  end

end
{% endhighlight %}

Our mailer class `MessageMailer` could look like this:

{% highlight ruby %}
class ApplicationMailer < ActionMailer::Base
  layout 'application_mailer'
  default from: 'postoffice@example.com'
end
{% endhighlight %}


{% highlight ruby %}
class MessageMailer < ApplicationMailer

  def email_copy(message, recipient, options = {})
    @message = message
    mail({
      from: "#{message.author.full_name} <#{default_params[:from]}>",
      subject: "New message",
      to: recipient.email,
      reply_to: default_params[:from].gsub('@', "+f-#{recipient.uuid}-t-#{@message.author.uuid}-m-#{@message.uuid}@"),
    })
  end

end
{% endhighlight %}

Here I set `Reply-to` field to contain our default `From` email address but with addition of some useful information using address tagging. What it gives is that an user will still receive emails from address `postoffice@example.com`, but when he hits "Reply" in his email client than the `To` email address will be equal to the one we passed in `Reply-to` field. Of course we make an assumption that an user will not change it, but I think that in most of cases he indeed will not.

To my mind it's better to send some hashed values rather than just plain ids as the system will be more resistant to fraud actions in this case. Also it's better to use one-time hashes and expire them after a message is received.

[Mailman][mailman] route for catching these emails can look like this:

{% highlight ruby %}
Mailman::Application.run do
  to 'f-%from_uuid%-t-%to_uuid%-m-%message_uuid%@' do
    # here you can load all records that you need
    from_user = User.find_by_uuid(params[:from_uuid])
    to_user = User.find_by_uuid(params[:to_uuid])
    original_message = Message.find_by_uuid(params[:message_uuid])
    # and perform some processing
    # remember that at this point you have access to a Mailman "message" method which returns Mailman message object - you can get all details of the incoming email from it
  end
end
{% endhighlight %}

In [Mailman][mailman] you can create a new reply-message and also send it's copy by email. This way you'll implement such a system where users can exchange messages with each other directly from their email clients and in the meantime there will be created messages on your site.

As a bonus you'll get the capability to collect user's alternative emails. Some users can have email forwarding enabled in their mailboxes so the actual reply can come from email address that is not present in your database. It allows you to implement users sign in based on alternative emails too apart from the one that an user provided during a registration.

Also you should notice that if you have to put some users in `CC` or `BCC` fields then you will not be able to recognize an user who used an alternative email to reply to your message. It will happen because you will be able only to put author's uuid to email `Reply-to` address and putting recipient's uuid will not be possible due to there can be a lot of `CC`-recipients and it just will not make sense. So when an user will use an alternative email you will just not have it in the database. In this case you'll have to determine who sent a reply message only based on "From" field of the incoming email.


Ok, at this point I'm stopping. I hope this post was useful for you. Thanks for reading!


[action_mailer_base]:      http://api.rubyonrails.org/classes/ActionMailer/Base.html
[letter_opener]:           https://github.com/ryanb/letter_opener
[mail_catcher]:            https://github.com/sj26/mailcatcher
[mailtrap]:                https://mailtrap.io/
[sidekiq]:                 https://github.com/mperham/sidekiq
[carrier_wave]:            https://github.com/carrierwaveuploader/carrierwave
[mailman]:                 https://github.com/titanous/mailman
[rfc_5233_subaddressing]:  https://tools.ietf.org/html/rfc5233#section-1
<!-- full end -->
