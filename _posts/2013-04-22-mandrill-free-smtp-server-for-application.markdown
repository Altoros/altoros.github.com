---
layout: post
title: Mandrill – free SMTP server for applications
description: About new service from MailChimp creators
caconicalUrl: https://www.altoros.com/blog/mandrill-free-smtp-server-for-applications-2/
author:
  name: Eugene Melnikov
  link: https://github.com/melnikaite
---
Mandrill is special service created by MailChimp developers.
It allow you to send 12 000 emails per month for free.
All you need is change SMTP credentials in your application or email client.

<!-- full start -->
![credentials][0]

If you want to send more emails you can find optimal [price](http://mandrill.com/pricing/).
You can [merge](http://help.mandrill.com/entries/21681117-how-do-i-use-mandrill-if-i-already-have-a-mailchimp-account) your MailCimp and Mandrill account and get some [discounts](http://kb.mailchimp.com/article/mandrill-for-mailchimp-users#discount).

Service has good reputation so emails from you application unlikely to fall into the spam.
They support SPF and DKIM records for your sending domains.
There is reputation level and abuse detection heuristics for each account so your account may not send real emails.
In this case you will get message 'Message not sent: queued' from [here](https://mandrillapp.com/compose).
Also make sure that you use correct From header in you application, because email from 'root@localhost' won't be sent, but will be from 'root@example.com'.
Even if you have wrong From address or sending emails paused your application won't get any errors if you use just SMTP.
You will just see successful api calls [here](https://mandrillapp.com/settings/api).
If you really want to know status of email you may use [webhooks](https://mandrillapp.com/settings/webhooks).
There is a [gem](https://github.com/evendis/mandrill-rails) for rails that add support webhooks.
Following hooks are available:

- Message is sent

- Message is bounced

- Message is soft-bounced

- Message is opened

- Message is clicked

- Message is marked as spam

- Message recipient unsubscribes

- Message is rejected

Yes, Mandrill can change you emails before sending.
It allows tracking some actions and enhance emails and even add [unsubscribe link](https://mandrillapp.com/settings/sending-options).
Mandrill have [templates](http://kb.mailchimp.com/article/template-language-creating-editable-content-areas/) support and special tags fro A/B testing.

There is search by subject and recipient address with ability to filter by status and export found data.
To keep you up-to-date on all your account activity you can install application for your Android or iOS.

![android][1]
![ios][2]

And finally Mandrill has great [RESTful API](https://mandrillapp.com/api/docs/).
It allows you to do everything and even try requests directly in the documentation.
Using API is the most efficient way to control your mailing.
You can find gem for this API [here](https://rubygems.org/gems/mandrill-api).

Hope it helps someone to choose right solution.
<!-- full end -->

[0]: /images/posts/2013-04-22-mandrill-free-smtp-server-for-application/credentials.png
[1]: /images/posts/2013-04-22-mandrill-free-smtp-server-for-application/android.png
[2]: /images/posts/2013-04-22-mandrill-free-smtp-server-for-application/ios.png
